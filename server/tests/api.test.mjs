import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { startTestServer, person } from "./helpers.mjs";

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(200, 1)]);

async function createSlot(t, cookie, date = "2026-10-10", time = "10:00") {
  const res = await t.request("POST", "/api/admin/slots", { date, time, durationMin: 60 }, { cookie });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body.data.slots[0];
}

async function createProgram(t, cookie, overrides = {}) {
  const body = {
    type: "workshop",
    title: "Tesztworkshop",
    summary: "Rövid",
    description: "Leírás",
    location: "Szeged",
    capacity: 2,
    status: "published",
    registrationOpen: true,
    sessions: [{ date: "2026-10-20", start: "17:00", end: "19:00" }],
    ...overrides,
  };
  const res = await t.request("POST", "/api/admin/programs", body, { cookie });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body.data.program;
}

test("jogosultság: bejelentkezés nélkül az admin végpontok nem érhetők el", async () => {
  const t = await startTestServer();
  try {
    for (const [method, url, body] of [
      ["GET", "/api/admin/data"],
      ["PUT", "/api/admin/site-content", { heroTitle: "Feltört" }],
      ["POST", "/api/admin/programs", { title: "x" }],
      ["POST", "/api/admin/slots", { date: "2026-10-10", time: "10:00" }],
      ["PATCH", "/api/admin/bookings/bk_x", { status: "confirmed" }],
      ["PATCH", "/api/admin/registrations/rg_x", { status: "confirmed" }],
      ["DELETE", "/api/admin/programs/pr_x"],
    ]) {
      const res = await t.request(method, url, body);
      assert.equal(res.status, 401, `${method} ${url}`);
    }
    const forged = await t.request("GET", "/api/admin/data", undefined, { cookie: "mesegombolyag_admin=hamis.token.ertek" });
    assert.equal(forged.status, 401);
    const bad = await t.request("POST", "/api/admin/login", { username: "tesztadmin", password: "rossz" });
    assert.equal(bad.status, 401);
    assert.match(bad.body.message, /Hibás/);
    // a nyilvános adatokban nincs személyes adat
    const cookie = await t.login();
    const slot = await createSlot(t, cookie);
    await t.request("POST", "/api/bookings", { slotId: slot.id, ...person(1) });
    const pub = await t.request("GET", "/api/public-data");
    const text = JSON.stringify(pub.body);
    assert.ok(!text.includes("teszt1@example.hu"));
    assert.ok(!text.includes("Teszt Elek"));
  } finally {
    await t.close();
  }
});

test("munkamenet: kijelentkezés és lejárt token után 401", async () => {
  const t = await startTestServer();
  try {
    const cookie = await t.login();
    assert.equal((await t.request("GET", "/api/admin/data", undefined, { cookie })).status, 200);
    const session = await t.request("GET", "/api/admin/session", undefined, { cookie });
    assert.equal(session.body.data.loggedIn, true);
    const out = await t.request("POST", "/api/admin/logout", undefined, { cookie });
    assert.match(out.headers.get("set-cookie"), /mesegombolyag_admin=;/);
    // lejárt munkamenet: érvényes aláírású, de lejárt token
    const expired = jwt.sign({ sub: 1, username: "tesztadmin", exp: Math.floor(Date.now() / 1000) - 60 }, "teszt-titok-legalabb-16-karakter");
    const res = await t.request("GET", "/api/admin/data", undefined, { cookie: `mesegombolyag_admin=${expired}` });
    assert.equal(res.status, 401);
    assert.equal(res.body.code, "UNAUTHENTICATED");
    assert.match(res.body.message, /munkamenet lejárt/);
    const s2 = await t.request("GET", "/api/admin/session", undefined, { cookie: `mesegombolyag_admin=${expired}` });
    assert.equal(s2.body.data.loggedIn, false);
  } finally {
    await t.close();
  }
});

test("egyéni foglalás: siker, admin látja, e-mailek, dupla foglalás és párhuzamos kérés", async () => {
  const t = await startTestServer();
  try {
    const cookie = await t.login();
    const slot = await createSlot(t, cookie);
    let pub = await t.request("GET", "/api/public-data");
    assert.equal(pub.body.data.slots.length, 1);

    // két párhuzamos kérés ugyanarra az időpontra
    const [a, b] = await Promise.all([
      t.request("POST", "/api/bookings", { slotId: slot.id, ...person(1), idempotencyKey: "kulcs-aaaa-1" }),
      t.request("POST", "/api/bookings", { slotId: slot.id, ...person(2), idempotencyKey: "kulcs-bbbb-2" }),
    ]);
    const statuses = [a.status, b.status].sort();
    assert.deepEqual(statuses, [201, 409]);
    const winner = a.status === 201 ? a : b;
    assert.equal(winner.body.data.booking.status, "pending");
    assert.match(winner.body.message, /Visszaigazolásra vár/);
    // levélfogó módban nincs valódi kézbesítés: nem ígérünk e-mailt, a lemondási link a válaszban jön
    assert.equal(winner.body.data.emailNotifications, false);
    assert.doesNotMatch(winner.body.message, /e-mail/i);
    assert.match(winner.body.data.manageUrl, /#\/lemondas\/[A-Za-z0-9_-]{20,}$/);
    const flags = (await t.request("GET", "/api/public-data")).body.data.site;
    assert.deepEqual(flags, { previewMode: false, emailNotifications: false });

    // ismételt beküldés ugyanazzal a kulccsal: nincs új foglalás
    const again = await t.request("POST", "/api/bookings", { slotId: slot.id, ...person(1), idempotencyKey: a.status === 201 ? "kulcs-aaaa-1" : "kulcs-bbbb-2" });
    assert.equal(again.status, 200);
    assert.equal(again.body.data.duplicate, true);
    assert.equal(again.body.data.booking.id, winner.body.data.booking.id);

    pub = await t.request("GET", "/api/public-data");
    assert.equal(pub.body.data.slots.length, 0, "a foglalt időpont nem látszik szabadnak");

    const admin = await t.request("GET", "/api/admin/data", undefined, { cookie });
    assert.equal(admin.body.data.bookings.length, 1);
    assert.equal(admin.body.data.bookings[0].status, "pending");

    await t.flushEmails();
    const mails = t.mails();
    assert.equal(mails.length, 2);
    const client = mails.find((m) => m.text.includes(`To: ${winner === a ? "teszt1" : "teszt2"}@example.hu`));
    assert.ok(client, "a látogató visszaigazolása a megadott címre ment");
    assert.match(client.text, /visszaigazolásra vár/i);
    assert.match(client.text, /2026\. október 10\., szombat 10:00/);
    assert.match(client.text, /http:\/\/localhost:4173\/mesegombolyag\/#\/lemondas\/[A-Za-z0-9_-]{20,}/);
    assert.match(client.html, /<html lang="hu">/);
    const adminMail = mails.find((m) => m.text.includes("To: johanna-teszt@example.hu"));
    assert.match(adminMail.text, /#\/admin/);
  } finally {
    await t.close();
  }
});

test("egyéni foglalás: lezárt, múltbeli, nem létező időpont és hibás adatok", async () => {
  const t = await startTestServer();
  try {
    const cookie = await t.login();
    const slot = await createSlot(t, cookie);
    const invalid = await t.request("POST", "/api/bookings", { slotId: slot.id, name: "", email: "rossz", phone: "abc" });
    assert.equal(invalid.status, 400);
    assert.ok(invalid.body.errors.name && invalid.body.errors.email && invalid.body.errors.phone);

    await t.request("PATCH", `/api/admin/slots/${slot.id}`, { status: "closed" }, { cookie });
    assert.equal((await t.request("POST", "/api/bookings", { slotId: slot.id, ...person() })).status, 409);
    await t.request("PATCH", `/api/admin/slots/${slot.id}`, { status: "open" }, { cookie });

    t.setNow("2026-10-10T09:00:00Z"); // az időpont (08:00 UTC) már elmúlt
    assert.equal((await t.request("POST", "/api/bookings", { slotId: slot.id, ...person() })).status, 409);
    assert.equal((await t.request("GET", "/api/public-data")).body.data.slots.length, 0);
    assert.equal((await t.request("POST", "/api/bookings", { slotId: "sl_nincs", ...person() })).status, 409);

    const past = await t.request("POST", "/api/admin/slots", { date: "2026-10-01", time: "08:00" }, { cookie });
    assert.equal(past.status, 400);
    const gap = await t.request("POST", "/api/admin/slots", { date: "2027-03-28", time: "02:30" }, { cookie });
    assert.equal(gap.status, 400);
    assert.match(gap.body.message, /óraátállítás/);
  } finally {
    await t.close();
  }
});

test("lemondás felszabadítja az időpontot, visszaállítás ütközés esetén hibát ad", async () => {
  const t = await startTestServer();
  try {
    const cookie = await t.login();
    const slot = await createSlot(t, cookie);
    const first = await t.request("POST", "/api/bookings", { slotId: slot.id, ...person(1) });
    const id = first.body.data.booking.id;
    assert.equal((await t.request("PATCH", `/api/admin/bookings/${id}`, { status: "confirmed" }, { cookie })).status, 200);
    assert.equal((await t.request("PATCH", `/api/admin/bookings/${id}`, { status: "cancelled" }, { cookie })).status, 200);
    assert.equal((await t.request("GET", "/api/public-data")).body.data.slots.length, 1, "lemondás után újra szabad");
    const second = await t.request("POST", "/api/bookings", { slotId: slot.id, ...person(2) });
    assert.equal(second.status, 201);
    const revive = await t.request("PATCH", `/api/admin/bookings/${id}`, { status: "pending" }, { cookie });
    assert.equal(revive.status, 409);
    // foglalással rendelkező időpont nem törölhető
    assert.equal((await t.request("DELETE", `/api/admin/slots/${slot.id}`, undefined, { cookie })).status, 409);
    await t.flushEmails();
    assert.ok(t.mails().some((m) => /Időpontod visszaigazolva/.test(m.text)));
    assert.ok(t.mails().some((m) => /lemondva/.test(m.text)));
  } finally {
    await t.close();
  }
});

test("adatbázis-szintű védelem: egy időpontra nem kerülhet két aktív foglalás", async () => {
  const t = await startTestServer();
  try {
    const cookie = await t.login();
    const slot = await createSlot(t, cookie);
    await t.request("POST", "/api/bookings", { slotId: slot.id, ...person(1) });
    assert.throws(() =>
      t.db.prepare("INSERT INTO bookings (id, slot_id, name, email, phone, status, created_at, updated_at) VALUES ('x', ?, 'a', 'b', 'c', 'pending', 'n', 'n')").run(slot.id),
      /UNIQUE/,
    );
  } finally {
    await t.close();
  }
});

test("csoportos jelentkezés: kapacitás, utolsó hely párhuzamosan, duplikáció, visszavonás", async () => {
  const t = await startTestServer();
  try {
    const cookie = await t.login();
    const program = await createProgram(t, cookie, { capacity: 2 });
    const r1 = await t.request("POST", "/api/registrations", { programId: program.id, ...person(1) });
    assert.equal(r1.status, 201);
    const dup = await t.request("POST", "/api/registrations", { programId: program.id, ...person(1), email: "TESZT1@example.hu" });
    assert.equal(dup.status, 409);
    assert.equal(dup.body.code, "DUPLICATE_REGISTRATION");

    const [x, y] = await Promise.all([
      t.request("POST", "/api/registrations", { programId: program.id, ...person(2) }),
      t.request("POST", "/api/registrations", { programId: program.id, ...person(3) }),
    ]);
    assert.deepEqual([x.status, y.status].sort(), [201, 409]);
    let pub = await t.request("GET", "/api/public-data");
    assert.equal(pub.body.data.programs[0].registrationState, "full");
    assert.equal(pub.body.data.programs[0].seatsLeft, 0);

    // visszavonás felszabadít egy helyet
    const regId = r1.body.data.registration.id;
    await t.request("PATCH", `/api/admin/registrations/${regId}`, { status: "cancelled" }, { cookie });
    pub = await t.request("GET", "/api/public-data");
    assert.equal(pub.body.data.programs[0].seatsLeft, 1);
    const r4 = await t.request("POST", "/api/registrations", { programId: program.id, ...person(4) });
    assert.equal(r4.status, 201);
    // a visszavont jelentkezés nem állítható vissza, ha nincs hely
    const revive = await t.request("PATCH", `/api/admin/registrations/${regId}`, { status: "pending" }, { cookie });
    assert.equal(revive.status, 409);
    // a férőhely nem csökkenthető a lefoglalt helyek alá
    const shrink = await t.request("PUT", `/api/admin/programs/${program.id}`, { ...editable(program), capacity: 1 }, { cookie });
    assert.equal(shrink.status, 409);
    // jelentkezőkkel rendelkező program nem törölhető
    assert.equal((await t.request("DELETE", `/api/admin/programs/${program.id}`, undefined, { cookie })).status, 409);
    // adatbázis-szintű kapacitásvédelem
    assert.throws(() =>
      t.db.prepare("INSERT INTO registrations (id, program_id, name, email, email_norm, phone, seats, status, created_at, updated_at) VALUES ('z', ?, 'a', 'z@e.hu', 'z@e.hu', '1', 1, 'pending', 'n', 'n')").run(program.id),
      /CAPACITY_EXCEEDED/,
    );
  } finally {
    await t.close();
  }
});

function editable(p) {
  const toParts = (iso) => {
    const d = new Date(iso);
    const f = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Budapest", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    const o = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
    return { date: `${o.year}-${o.month}-${o.day}`, time: `${o.hour}:${o.minute}` };
  };
  return {
    type: p.type, title: p.title, summary: p.summary, description: p.description, location: p.location, image: p.image,
    capacity: p.capacity, status: p.status, registrationOpen: p.registrationOpen,
    sessions: p.sessions.map((s) => ({ date: toParts(s.startsAt).date, start: toParts(s.startsAt).time, end: toParts(s.endsAt).time })),
  };
}

test("meseműhely: egyetlen jelentkezés a teljes folyamatra, zárt/elmarad/múltbeli/piszkozat állapotok", async () => {
  const t = await startTestServer();
  try {
    const cookie = await t.login();
    const bad = await t.request("POST", "/api/admin/programs", {
      type: "mesemuhely", title: "Egy alkalom", capacity: 5, status: "published", sessions: [{ date: "2026-10-20", start: "17:00", end: "19:00" }],
    }, { cookie });
    assert.equal(bad.status, 400);

    const program = await createProgram(t, cookie, {
      type: "mesemuhely",
      title: "Őszi meseműhely",
      capacity: 6,
      sessions: [
        { date: "2026-10-20", start: "17:00", end: "19:00" },
        { date: "2026-10-27", start: "17:00", end: "19:00" },
        { date: "2026-11-03", start: "17:00", end: "19:00" },
      ],
    });
    assert.equal(program.sessions.length, 3);
    assert.equal(program.slug, "oszi-mesemuhely");
    // az október 27-i alkalom már téli időben van
    assert.equal(program.sessions[1].startsAt, "2026-10-27T16:00:00.000Z");

    const reg = await t.request("POST", "/api/registrations", { programId: program.id, ...person(1) });
    assert.equal(reg.status, 201);
    assert.equal(t.db.prepare("SELECT COUNT(*) AS n FROM registrations").get().n, 1, "egy jelentkezés, nem alkalmanként");
    const tooMany = await t.request("POST", "/api/registrations", { programId: program.id, ...person(2), seats: 2 });
    assert.equal(tooMany.status, 400);

    await t.flushEmails();
    const mail = t.mails().find((m) => m.text.includes("To: teszt1@example.hu"));
    assert.match(mail.text, /teljes, több alkalomból álló folyamatra/);
    assert.match(mail.text, /3\. alkalom: 2026\. november 3\., kedd 17:00–19:00/);

    // jelentkezés lezárása
    await t.request("PUT", `/api/admin/programs/${program.id}`, { ...editable(program), registrationOpen: false }, { cookie });
    let r = await t.request("POST", "/api/registrations", { programId: program.id, ...person(3) });
    assert.equal(r.status, 409);
    assert.equal(r.body.code, "PROGRAM_CLOSED");

    // elmarad
    const cancel = await t.request("PUT", `/api/admin/programs/${program.id}`, { ...editable(program), status: "cancelled" }, { cookie });
    assert.equal(cancel.status, 200);
    assert.match(cancel.body.message, /1 aktív jelentkezőt értesíts/);
    r = await t.request("POST", "/api/registrations", { programId: program.id, ...person(3) });
    assert.equal(r.body.code, "PROGRAM_CANCELLED");

    // piszkozat nem látszik nyilvánosan
    const draft = await createProgram(t, cookie, { title: "Piszkozat", status: "draft" });
    const pub = await t.request("GET", "/api/public-data");
    assert.ok(!pub.body.data.programs.some((p) => p.id === draft.id));
    assert.equal((await t.request("GET", `/api/programs/${draft.slug}`)).status, 404);
    assert.equal((await t.request("POST", "/api/registrations", { programId: draft.id, ...person(4) })).status, 404);

    // múltbeli
    const ws = await createProgram(t, cookie, { title: "Régi workshop" });
    t.setNow("2026-10-21T12:00:00Z");
    r = await t.request("POST", "/api/registrations", { programId: ws.id, ...person(5) });
    assert.equal(r.body.code, "PROGRAM_PAST");
    assert.ok(!(await t.request("GET", "/api/public-data")).body.data.programs.some((p) => p.id === ws.id));
  } finally {
    await t.close();
  }
});

test("érdeklődés: típusok, programhoz kötés, hibás adatok, ismételt beküldés", async () => {
  const t = await startTestServer();
  try {
    const cookie = await t.login();
    const program = await createProgram(t, cookie);
    const ok = await t.request("POST", "/api/inquiries", { ...person(1), kind: "general", message: "Szeretnék érdeklődni.", idempotencyKey: "erdeklodes-1" });
    assert.equal(ok.status, 201);
    const again = await t.request("POST", "/api/inquiries", { ...person(1), kind: "general", message: "Szeretnék érdeklődni.", idempotencyKey: "erdeklodes-1" });
    assert.equal(again.status, 200);
    await t.request("POST", "/api/inquiries", { ...person(2), kind: "individual", message: "Egyéni alkalom érdekel." });
    await t.request("POST", "/api/inquiries", { ...person(3), kind: "program", programId: program.id, message: "Erről a workshopról kérdeznék." });
    const bad = await t.request("POST", "/api/inquiries", { name: "A", email: "x", message: "" });
    assert.equal(bad.status, 400);
    assert.deepEqual(Object.keys(bad.body.errors).sort(), ["email", "message", "name"]);
    const notJson = await t.request("POST", "/api/inquiries", undefined, { raw: "name=x", contentType: "application/x-www-form-urlencoded" });
    assert.equal(notJson.status, 415);

    const admin = await t.request("GET", "/api/admin/data", undefined, { cookie });
    assert.equal(admin.body.data.inquiries.length, 3);
    const kinds = admin.body.data.inquiries.map((i) => i.kind).sort();
    assert.deepEqual(kinds, ["general", "individual", "program"]);
    assert.equal(admin.body.data.inquiries.find((i) => i.kind === "program").programTitle, "Tesztworkshop");
    await t.flushEmails();
    assert.ok(t.mails().some((m) => /Új érdeklődés: Konkrét program: Tesztworkshop/.test(m.text)));
  } finally {
    await t.close();
  }
});

test("e-mail-hiba: az adat mentve marad, nincs új foglalás újrapróbáláskor, a hiba naplózva", async () => {
  const t = await startTestServer({ mailTransport: "fail" });
  try {
    const cookie = await t.login();
    const slot = await createSlot(t, cookie);
    const first = await t.request("POST", "/api/bookings", { slotId: slot.id, ...person(1), idempotencyKey: "ujraproba-123" });
    assert.equal(first.status, 201);
    const retry = await t.request("POST", "/api/bookings", { slotId: slot.id, ...person(1), idempotencyKey: "ujraproba-123" });
    assert.equal(retry.status, 200);
    assert.equal(t.db.prepare("SELECT COUNT(*) AS n FROM bookings").get().n, 1);
    await t.flushEmails();
    const admin = await t.request("GET", "/api/admin/data", undefined, { cookie });
    assert.equal(admin.body.data.emails.length, 2);
    assert.ok(admin.body.data.emails.every((e) => e.status === "failed" && /Szimulált/.test(e.lastError)));
    const again = await t.request("POST", `/api/admin/emails/${admin.body.data.emails[0].id}/retry`, undefined, { cookie });
    assert.equal(again.body.ok, false);
  } finally {
    await t.close();
  }
});

test("vendég lemondási link csak a saját foglalást kezeli", async () => {
  const t = await startTestServer();
  try {
    const cookie = await t.login();
    const s1 = await createSlot(t, cookie, "2026-10-10", "10:00");
    const s2 = await createSlot(t, cookie, "2026-10-10", "12:00");
    await t.request("POST", "/api/bookings", { slotId: s1.id, ...person(1) });
    await t.request("POST", "/api/bookings", { slotId: s2.id, ...person(2) });
    await t.flushEmails();
    const mail = t.mails().find((m) => m.text.includes("To: teszt1@example.hu"));
    const token = mail.text.match(/#\/lemondas\/([A-Za-z0-9_-]+)/)[1];
    const view = await t.request("GET", `/api/manage/${token}`);
    assert.equal(view.body.data.name, "Teszt Elek 1");
    assert.equal(view.body.data.canCancel, true);
    assert.equal((await t.request("GET", `/api/manage/${token.slice(0, -2)}xx`)).status, 404);
    const cancel = await t.request("POST", `/api/manage/${token}/cancel`);
    assert.equal(cancel.status, 200);
    assert.equal(cancel.body.data.status, "cancelled");
    const data = (await t.request("GET", "/api/admin/data", undefined, { cookie })).body.data;
    const statuses = Object.fromEntries(data.bookings.map((b) => [b.email, b.status]));
    assert.deepEqual(statuses, { "teszt1@example.hu": "cancelled", "teszt2@example.hu": "pending" });
    assert.equal((await t.request("POST", `/api/manage/${token}/cancel`)).status, 409);
  } finally {
    await t.close();
  }
});

test("tartalomszerkesztés és képfeltöltés tartósan mentődik", async () => {
  const t = await startTestServer();
  try {
    const cookie = await t.login();
    const upload = await t.request("POST", "/api/admin/uploads", undefined, { cookie, raw: JPEG, contentType: "image/jpeg" });
    assert.equal(upload.status, 201);
    const url = upload.body.data.url;
    const img = await fetch(t.base + url);
    assert.equal(img.status, 200);

    const fake = await t.request("POST", "/api/admin/uploads", undefined, { cookie, raw: Buffer.from("<script>alert(1)</script>........"), contentType: "image/jpeg" });
    assert.equal(fake.status, 415);
    const big = await t.request("POST", "/api/admin/uploads", undefined, { cookie, raw: Buffer.concat([JPEG, Buffer.alloc(5 * 1024 * 1024)]), contentType: "image/jpeg" });
    assert.equal(big.status, 413);
    assert.equal((await t.request("POST", "/api/admin/uploads", undefined, { raw: JPEG, contentType: "image/jpeg" })).status, 401);

    const save = await t.request("PUT", "/api/admin/site-content", { heroTitle: "Új címsor", heroImage: url }, { cookie });
    assert.equal(save.status, 200);
    const unknown = await t.request("PUT", "/api/admin/site-content", { isAdmin: true }, { cookie });
    assert.equal(unknown.status, 400);
    const external = await t.request("PUT", "/api/admin/site-content", { heroImage: "https://evil.example/x.jpg" }, { cookie });
    assert.equal(external.status, 400);
    const pub = await t.request("GET", "/api/public-data");
    assert.equal(pub.body.data.siteContent.heroTitle, "Új címsor");
    assert.equal(pub.body.data.siteContent.heroImage, url);

    const program = await createProgram(t, cookie, { image: url });
    assert.equal(program.image, url);
  } finally {
    await t.close();
  }
});

test("belépési próbálkozások korlátozása", async () => {
  const t = await startTestServer({ rateLimit: true });
  try {
    const statuses = [];
    for (let i = 0; i < 11; i += 1) statuses.push((await t.request("POST", "/api/admin/login", { username: "tesztadmin", password: "rossz" })).status);
    assert.deepEqual(statuses.slice(0, 10), Array(10).fill(401));
    assert.equal(statuses[10], 429);
  } finally {
    await t.close();
  }
});

test("jelszócsere az adminból: régi jelszó kell, a többi munkamenet érvénytelen lesz", async () => {
  const t = await startTestServer();
  try {
    const other = await t.login();
    const mine = await t.login();
    const body = (current, next) => ({ currentPassword: current, newPassword: next });
    assert.equal((await t.request("POST", "/api/admin/password", body("rossz", "uj-jelszo-2026-osz"), { cookie: mine })).status, 400);
    assert.equal((await t.request("POST", "/api/admin/password", body("teszt-jelszo-123", "rovid"), { cookie: mine })).status, 400);
    assert.equal((await t.request("POST", "/api/admin/password", body("teszt-jelszo-123", "uj-jelszo-2026-osz"))).status, 401);
    const ok = await t.request("POST", "/api/admin/password", body("teszt-jelszo-123", "uj-jelszo-2026-osz"), { cookie: mine });
    assert.equal(ok.status, 200);
    const fresh = ok.headers.get("set-cookie").split(";")[0];
    assert.equal((await t.request("GET", "/api/admin/data", undefined, { cookie: fresh })).status, 200, "a jelenlegi böngésző új munkamenetet kap");
    assert.equal((await t.request("GET", "/api/admin/data", undefined, { cookie: other })).status, 401, "más eszköz kijelentkezik");
    assert.equal((await t.request("POST", "/api/admin/login", { username: "tesztadmin", password: "teszt-jelszo-123" })).status, 401);
    assert.equal((await t.request("POST", "/api/admin/login", { username: "tesztadmin", password: "uj-jelszo-2026-osz" })).status, 200);
  } finally {
    await t.close();
  }
});

import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createApp } from "../app.mjs";

/** Helyi, hamis Resend API: rögzíti a kéréseket, és igény szerint hibát ad. */
async function fakeResend() {
  const calls = [];
  let failNext = 0;
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      calls.push({ method: req.method, url: req.url, headers: req.headers, body: JSON.parse(body || "{}") });
      if (failNext > 0) {
        failNext -= 1;
        res.writeHead(422, { "content-type": "application/json" });
        return res.end(JSON.stringify({ name: "validation_error", message: "The domain is not verified." }));
      }
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ id: `re_${calls.length}` }));
    });
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return { calls, base: `http://127.0.0.1:${server.address().port}`, failNextN: (n) => (failNext = n), close: () => new Promise((r) => server.close(r)) };
}

async function start(resendBase) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mesegombolyag-resend-"));
  const ctx = createApp({
    dbPath: path.join(dir, "t.db"),
    uploadDir: path.join(dir, "uploads"),
    jwtSecret: "teszt-titok-legalabb-16-karakter",
    publicSiteUrl: "https://mesegombolyag.example.hu",
    adminNotifyEmail: "johanna-teszt@example.hu",
    rateLimit: false,
    clock: () => new Date("2026-10-01T08:00:00Z"),
    mail: { transport: "resend", from: "Mesegombolyag <ertesites@example.hu>", resend: { apiKey: "re_teszt_kulcs", apiBase: resendBase } },
    bootstrapAdmin: { username: "admin", password: "teszt-jelszo-123" },
  });
  const server = await new Promise((r) => { const s = ctx.app.listen(0, () => r(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const req = async (method, url, body, cookie) => {
    const res = await fetch(base + url, { method, headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: res.status, body: await res.json(), headers: res.headers };
  };
  const login = await req("POST", "/api/admin/login", { username: "admin", password: "teszt-jelszo-123" });
  const cookie = login.headers.get("set-cookie").split(";")[0];
  return { ...ctx, req, cookie, close: () => new Promise((r) => server.close(() => { ctx.db.close(); fs.rmSync(dir, { recursive: true, force: true }); r(); })) };
}

test("Resend: látogatói visszaigazolás és Johanna értesítése helyes fejlécekkel, hivatkozásokkal", async () => {
  const resend = await fakeResend();
  const t = await start(resend.base);
  try {
    const slot = (await t.req("POST", "/api/admin/slots", { date: "2026-10-10", time: "10:00" }, t.cookie)).body.data.slots[0];
    const b = await t.req("POST", "/api/bookings", { slotId: slot.id, name: "Árvíz Tűrő", email: "latogato@example.hu", phone: "+36 30 123 4567", idempotencyKey: "resend-foglalas-1" });
    assert.equal(b.status, 201);
    await t.flushEmails();
    assert.equal(resend.calls.length, 2);
    for (const c of resend.calls) {
      assert.equal(c.method, "POST");
      assert.equal(c.url, "/emails");
      assert.equal(c.headers.authorization, "Bearer re_teszt_kulcs");
      assert.match(c.headers["idempotency-key"], /^mesegombolyag-[0-9a-f-]{36}-\d+$/);
      assert.equal(c.body.from, "Mesegombolyag <ertesites@example.hu>");
    }
    const visitor = resend.calls.find((c) => c.body.to[0] === "latogato@example.hu");
    const admin = resend.calls.find((c) => c.body.to[0] === "johanna-teszt@example.hu");
    assert.equal(visitor.body.reply_to, "mesegombolyag@gmail.com", "a látogató Johannának válaszolhat");
    assert.equal(admin.body.reply_to, "latogato@example.hu", "Johanna közvetlenül a látogatónak válaszolhat");
    assert.match(visitor.body.subject, /visszaigazolásra vár/);
    assert.match(visitor.body.text, /Kedves Árvíz Tűrő!/);
    assert.match(visitor.body.text, /https:\/\/mesegombolyag\.example\.hu\/#\/lemondas\/[A-Za-z0-9_-]{20,}/);
    assert.match(admin.body.text, /https:\/\/mesegombolyag\.example\.hu\/#\/admin/);
    const emails = (await t.req("GET", "/api/admin/data", null, t.cookie)).body.data.emails;
    assert.ok(emails.every((e) => e.status === "sent"));
    assert.ok(t.db.prepare("SELECT provider_id FROM email_outbox WHERE provider_id LIKE 're_%'").all().length === 2);
  } finally {
    await t.close();
    await resend.close();
  }
});

test("Resend: szolgáltatói hiba → a foglalás megmarad, a levél hibás, újraküldés ugyanazzal az idempotencia-kulccsal", async () => {
  const resend = await fakeResend();
  const t = await start(resend.base);
  try {
    const slot = (await t.req("POST", "/api/admin/slots", { date: "2026-10-10", time: "12:00" }, t.cookie)).body.data.slots[0];
    resend.failNextN(2);
    const body = { slotId: slot.id, name: "Teszt Elek", email: "elek@example.hu", phone: "+36 30 123 4567", idempotencyKey: "resend-hiba-1" };
    assert.equal((await t.req("POST", "/api/bookings", body)).status, 201);
    await t.flushEmails();
    // a látogató újrapróbálkozik ugyanazzal a beküldéssel: nincs új foglalás, nincs új levél
    const again = await t.req("POST", "/api/bookings", body);
    assert.equal(again.status, 200);
    assert.equal(again.body.data.duplicate, true);
    assert.equal(t.db.prepare("SELECT COUNT(*) AS n FROM bookings").get().n, 1);
    assert.equal(t.db.prepare("SELECT COUNT(*) AS n FROM email_outbox").get().n, 2);

    const emails = (await t.req("GET", "/api/admin/data", null, t.cookie)).body.data.emails;
    assert.ok(emails.every((e) => e.status === "failed" && /Resend hiba \(422\): The domain is not verified/.test(e.lastError)));
    const failedKey = resend.calls[0].headers["idempotency-key"];
    const target = emails.find((e) => failedKey.endsWith(`-${e.id}`));
    const retry = await t.req("POST", `/api/admin/emails/${target.id}/retry`, null, t.cookie);
    assert.equal(retry.body.ok, true);
    assert.equal(resend.calls.at(-1).headers["idempotency-key"], failedKey, "újraküldéskor ugyanaz a kulcs → a szolgáltató nem kézbesít duplán");
    assert.ok(!JSON.stringify(emails).includes("re_teszt_kulcs"), "az API-kulcs nem kerül a naplóba");
  } finally {
    await t.close();
    await resend.close();
  }
});

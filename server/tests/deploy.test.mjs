// Folyamatszintű tesztek: a valódi `server/index.mjs` production módban, elkülönített „kötettel"
// (ideiglenes mappa), a Railway által adott környezeti változókkal szimulálva.
import test from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../config.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(300, 7)]);

const freePort = () => new Promise((resolve) => {
  const s = net.createServer();
  s.listen(0, () => { const { port } = s.address(); s.close(() => resolve(port)); });
});

function baseEnv(volume, port) {
  // Szándékosan üres környezetből indulunk, hogy a fejlesztői .env ne szivároghasson be.
  return {
    PATH: process.env.PATH,
    SystemRoot: process.env.SystemRoot,
    PORT: String(port),
    RAILWAY_ENVIRONMENT: "production",
    RAILWAY_VOLUME_MOUNT_PATH: volume,
    RAILWAY_PUBLIC_DOMAIN: "mesegombolyag-teszt.up.railway.app",
    JWT_SECRET: "x".repeat(20) + "a8f3k2m9q7w1z5r4t6y0",
    ADMIN_PASSWORD: "tartos-teszt-jelszo-2026",
    MAIL_TRANSPORT: "disabled",
    DISABLE_RATE_LIMIT: "1",
    DOTENV_CONFIG_PATH: path.join(volume, "nincs.env"),
  };
}

async function startServer(env) {
  const child = spawn(process.execPath, ["server/index.mjs", "--production"], { cwd: root, env, stdio: ["ignore", "pipe", "pipe"] });
  let out = "";
  child.stdout.on("data", (d) => (out += d));
  child.stderr.on("data", (d) => (out += d));
  const base = `http://127.0.0.1:${env.PORT}`;
  for (let i = 0; i < 100; i += 1) {
    if (child.exitCode !== null) throw new Error(`A szerver kilépett: ${out}`);
    try {
      const r = await fetch(`${base}/api/health`);
      if (r.ok) break;
    } catch { /* még indul */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  const stop = () => new Promise((resolve) => {
    if (child.exitCode !== null) return resolve();
    child.once("exit", resolve);
    child.kill("SIGTERM");
  });
  return { child, base, stop, output: () => out };
}

async function api(base, method, url, body, cookie, raw) {
  const headers = { ...(cookie ? { cookie } : {}) };
  let payload;
  if (raw) { payload = raw; headers["content-type"] = "image/jpeg"; } else if (body) { payload = JSON.stringify(body); headers["content-type"] = "application/json"; }
  const res = await fetch(base + url, { method, headers, body: payload, redirect: "manual" });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* nem JSON */ }
  return { status: res.status, json, text, headers: res.headers };
}

async function login(base, password = "tartos-teszt-jelszo-2026") {
  const r = await api(base, "POST", "/api/admin/login", { username: "mesegombolyag", password });
  assert.equal(r.status, 200, r.text);
  assert.match(r.headers.get("set-cookie"), /HttpOnly/i);
  assert.match(r.headers.get("set-cookie"), /Secure/i, "production módban Secure süti");
  return r.headers.get("set-cookie").split(";")[0];
}

test("production indulás: hiányzó vagy gyenge titok, kötet és levélbeállítás esetén egyértelmű hiba", () => {
  const ok = { NODE_ENV: "production", RAILWAY_ENVIRONMENT: "production", RAILWAY_VOLUME_MOUNT_PATH: "/data", RAILWAY_PUBLIC_DOMAIN: "x.up.railway.app", JWT_SECRET: "k".repeat(40), RESEND_API_KEY: "re_x", MAIL_FROM: "M <a@b.hu>" };
  assert.deepEqual(loadConfig(ok, { root }).errors, []);
  const cases = [
    [{ JWT_SECRET: "" }, /JWT_SECRET/],
    [{ JWT_SECRET: "change-this-secret-in-production-please-123" }, /mintaértéknek/],
    [{ RAILWAY_VOLUME_MOUNT_PATH: "" }, /kötet/],
    [{ RAILWAY_PUBLIC_DOMAIN: "" }, /PUBLIC_SITE_URL/],
    [{ RAILWAY_PUBLIC_DOMAIN: "", PUBLIC_SITE_URL: "http://nem-https.hu" }, /https/],
    [{ RESEND_API_KEY: "" }, /Nincs levélküldés/],
    [{ MAIL_FROM: "" }, /MAIL_FROM/],
    [{ MAIL_TRANSPORT: "file" }, /csak teszteléshez/],
    [{ ADMIN_PASSWORD: "rovid" }, /ADMIN_PASSWORD/],
  ];
  for (const [override, re] of cases) {
    const errors = loadConfig({ ...ok, ...override }, { root }).errors.join(" | ");
    assert.match(errors, re, JSON.stringify(override));
  }
  const cfg = loadConfig(ok, { root });
  assert.equal(cfg.host, "0.0.0.0");
  assert.equal(cfg.dataDir, path.resolve("/data"));
  assert.equal(cfg.app.publicSiteUrl, "https://x.up.railway.app");
  assert.equal(cfg.app.mail.transport, "resend");
  assert.equal(cfg.app.trustProxy, 1);
});

test("production indulás valódi folyamattal: titok nélkül és admin nélkül leáll, beépített jelszót nem használ", async () => {
  const volume = fs.mkdtempSync(path.join(os.tmpdir(), "mg-vol-"));
  try {
    const port = await freePort();
    const noSecret = spawnSync(process.execPath, ["server/index.mjs", "--production"], { cwd: root, env: { ...baseEnv(volume, port), JWT_SECRET: "" }, encoding: "utf8" });
    assert.equal(noSecret.status, 1);
    assert.match(noSecret.stderr, /JWT_SECRET/);
    const noAdmin = spawnSync(process.execPath, ["server/index.mjs", "--production"], { cwd: root, env: { ...baseEnv(volume, port), ADMIN_PASSWORD: "" }, encoding: "utf8" });
    assert.equal(noAdmin.status, 1);
    assert.match(noAdmin.stderr, /Nincs admin felhasználó/);
  } finally {
    fs.rmSync(volume, { recursive: true, force: true });
  }
});

test("tartós adatok: jelentkezés, tartalom és kép megmarad újraindítás után; mentés és visszaállítás; jelszócsere", async () => {
  const volume = fs.mkdtempSync(path.join(os.tmpdir(), "mg-vol-"));
  const port = await freePort();
  const env = baseEnv(volume, port);
  let srv = await startServer(env);
  try {
    // statikus weboldal és API ugyanarról a címről
    const home = await api(srv.base, "GET", "/");
    if (fs.existsSync(path.join(root, "dist", "index.html"))) {
      assert.equal(home.status, 200);
      assert.match(home.text, /<div id="root">/);
      assert.match(home.text, /src="\.\/assets\//, "relatív asset-hivatkozások");
      assert.equal((await api(srv.base, "GET", "/mesegombolyag/")).status, 301);
    }
    const unknownApi = await api(srv.base, "GET", "/api/nincs-ilyen");
    assert.equal(unknownApi.status, 404);
    assert.equal(unknownApi.json.ok, false, "ismeretlen API-útvonal JSON hibát ad, nem HTML-t");
    const health = await api(srv.base, "GET", "/api/health");
    assert.deepEqual(health.json, { ok: true, data: { status: "ok" } });

    let cookie = await login(srv.base);
    const upload = await api(srv.base, "POST", "/api/admin/uploads", null, cookie, JPEG);
    assert.equal(upload.status, 201);
    const imageUrl = upload.json.data.url;
    assert.equal((await api(srv.base, "PUT", "/api/admin/site-content", { heroTitle: "Tartós címsor", heroImage: imageUrl }, cookie)).status, 200);
    const prog = await api(srv.base, "POST", "/api/admin/programs", {
      type: "workshop", title: "Tartós workshop", capacity: 5, status: "published", sessions: [{ date: "2031-05-10", start: "10:00", end: "12:00" }],
    }, cookie);
    assert.equal(prog.status, 201, prog.text);
    const reg = await api(srv.base, "POST", "/api/registrations", { programId: prog.json.data.program.id, name: "Tartós Teszt", email: "tartos@example.hu", phone: "+36 30 111 2233" });
    assert.equal(reg.status, 201, reg.text);

    // 1) újraindítás
    await srv.stop();
    srv = await startServer(env);
    const pub = (await api(srv.base, "GET", "/api/public-data")).json.data;
    assert.equal(pub.siteContent.heroTitle, "Tartós címsor");
    assert.equal(pub.programs[0].seatsTaken, 1);
    assert.equal((await api(srv.base, "GET", imageUrl)).status, 200, "a feltöltött kép újraindítás után is elérhető");
    cookie = await login(srv.base);
    const data = (await api(srv.base, "GET", "/api/admin/data", null, cookie)).json.data;
    assert.equal(data.registrations[0].email, "tartos@example.hu");
    assert.equal(data.siteContent.heroImage, imageUrl);

    // 2) mentés → módosítás → visszaállítás előjegyzése → újraindítás
    const cliEnv = { ...env };
    const backup = spawnSync(process.execPath, ["server/scripts/backup.mjs"], { cwd: root, env: cliEnv, encoding: "utf8" });
    assert.equal(backup.status, 0, backup.stderr);
    const backupName = path.basename(backup.stdout.match(/Mentés kész: (.+)/)[1].trim());
    assert.equal((await api(srv.base, "PUT", "/api/admin/site-content", { heroTitle: "Mentés utáni címsor" }, cookie)).status, 200);
    const restore = spawnSync(process.execPath, ["server/scripts/restore.mjs", backupName], { cwd: root, env: cliEnv, encoding: "utf8" });
    assert.equal(restore.status, 0, restore.stderr);
    assert.equal(spawnSync(process.execPath, ["server/scripts/restore.mjs", "../../kivul"], { cwd: root, env: cliEnv, encoding: "utf8" }).status, 1, "mentésmappán kívüli útvonal elutasítva");
    await srv.stop();
    srv = await startServer(env);
    assert.match(srv.output(), /Visszaállítás kész/);
    const restored = (await api(srv.base, "GET", "/api/public-data")).json.data;
    assert.equal(restored.siteContent.heroTitle, "Tartós címsor");
    assert.equal((await api(srv.base, "GET", imageUrl)).status, 200);
    assert.ok(fs.readdirSync(volume).some((d) => d.startsWith("pre-restore-")), "a felülírt adatok biztonsági másolata megmaradt");

    // 3) jelszócsere: a régi munkamenet és a régi jelszó érvénytelen
    const oldCookie = await login(srv.base);
    const change = spawnSync(process.execPath, ["server/scripts/admin-password.mjs"], { cwd: root, env: cliEnv, input: "uj-eros-jelszo-2026-osz\n", encoding: "utf8" });
    assert.equal(change.status, 0, change.stderr);
    assert.ok(!change.stdout.includes("uj-eros-jelszo"), "a jelszó nem kerül a kimenetbe");
    assert.equal((await api(srv.base, "GET", "/api/admin/data", null, oldCookie)).status, 401);
    assert.equal((await api(srv.base, "POST", "/api/admin/login", { username: "mesegombolyag", password: "tartos-teszt-jelszo-2026" })).status, 401);
    await login(srv.base, "uj-eros-jelszo-2026-osz");
    // az ADMIN_PASSWORD változó már létező admin mellett nem írja felül a jelszót
    await srv.stop();
    srv = await startServer(env);
    await login(srv.base, "uj-eros-jelszo-2026-osz");
  } finally {
    await srv.stop();
    fs.rmSync(volume, { recursive: true, force: true });
  }
});

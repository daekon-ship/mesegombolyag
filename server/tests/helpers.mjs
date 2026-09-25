import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createApp } from "../app.mjs";

export const ADMIN = { username: "tesztadmin", password: "teszt-jelszo-123" };

/** Elkülönített tesztpéldány: ideiglenes adatbázis és feltöltési mappa, levélfogó vagy hibázó levelező. */
export async function startTestServer({ mailTransport = "file", now, rateLimit = false } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mesegombolyag-test-"));
  let current = now ? new Date(now) : new Date("2026-10-01T08:00:00Z");
  const ctx = createApp({
    dbPath: path.join(dir, "test.db"),
    uploadDir: path.join(dir, "uploads"),
    jwtSecret: "teszt-titok-legalabb-16-karakter",
    publicSiteUrl: "http://localhost:4173/mesegombolyag",
    adminNotifyEmail: "johanna-teszt@example.hu",
    rateLimit,
    clock: () => current,
    mail: { transport: mailTransport, captureDir: path.join(dir, "mail"), from: "teszt@example.hu", smtp: {} },
    bootstrapAdmin: { username: ADMIN.username, password: ADMIN.password, email: "admin@example.hu" },
  });
  const server = await new Promise((resolve) => {
    const s = ctx.app.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;

  async function request(method, url, body, { cookie, raw, contentType } = {}) {
    const headers = {};
    if (cookie) headers.cookie = cookie;
    let payload;
    if (raw) {
      payload = raw;
      headers["content-type"] = contentType || "application/octet-stream";
    } else if (body !== undefined) {
      payload = JSON.stringify(body);
      headers["content-type"] = "application/json";
    }
    const res = await fetch(base + url, { method, headers, body: payload });
    const json = await res.json().catch(() => null);
    return { status: res.status, body: json, headers: res.headers };
  }

  async function login() {
    const res = await request("POST", "/api/admin/login", ADMIN);
    const cookie = res.headers.get("set-cookie").split(";")[0];
    return cookie;
  }

  function mails() {
    const mailDir = path.join(dir, "mail");
    if (!fs.existsSync(mailDir)) return [];
    return fs.readdirSync(mailDir).filter((f) => f.endsWith(".txt")).sort().map((f) => ({
      file: f,
      text: fs.readFileSync(path.join(mailDir, f), "utf8"),
      html: fs.readFileSync(path.join(mailDir, f.replace(/\.txt$/, ".html")), "utf8"),
    }));
  }

  return {
    ...ctx,
    base,
    request,
    login,
    mails,
    setNow: (iso) => { current = new Date(iso); },
    close: () => new Promise((resolve) => server.close(() => { ctx.db.close(); fs.rmSync(dir, { recursive: true, force: true }); resolve(); })),
  };
}

export const person = (n = 1) => ({ name: `Teszt Elek ${n}`, email: `teszt${n}@example.hu`, phone: "+36 30 123 4567" });

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { createApp, DEFAULT_SITE_CONTENT } from "./app.mjs";
import { applyPendingRestore } from "./backup.mjs";
import { loadConfig } from "./config.mjs";

// DOTENV_CONFIG_PATH-szal másik (vagy nem létező) fájl adható meg — a tesztek így nem olvassák a fejlesztői .env-et.
dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || ".env", quiet: true });
// `npm start` (Railway) mindig production módban indít, platformfüggetlenül.
if (process.argv.includes("--production")) process.env.NODE_ENV = "production";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const config = loadConfig(process.env, { root });

function fail(messages) {
  console.error("A szerver nem indítható, javítsd a beállításokat:");
  for (const m of messages) console.error(`  - ${m}`);
  process.exit(1);
}

if (config.errors.length) fail(config.errors);

fs.mkdirSync(config.dataDir, { recursive: true });
// A függő visszaállítás az adatbázis megnyitása ELŐTT fut (a kötet ekkor már csatolva van).
applyPendingRestore({ dataDir: config.dataDir, dbPath: config.app.dbPath });

const { app, db, processOutbox, adminBootstrapped } = createApp(config.app);

const adminCount = db.prepare("SELECT COUNT(*) AS n FROM admin_users").get().n;
if (!adminCount && !process.env.ADMIN_PASSWORD_HASH && !process.env.ADMIN_PASSWORD) {
  if (config.isProduction) fail(["Nincs admin felhasználó, és az ADMIN_PASSWORD sincs megadva. Első indításhoz állítsd be (min. 12 karakter), majd az első belépés után töröld a változót."]);
  console.warn("Figyelem: nincs admin felhasználó (ADMIN_PASSWORD nincs megadva).");
}
if (adminBootstrapped) {
  console.log("Az első admin felhasználó létrejött. Belépés után töröld az ADMIN_PASSWORD változót.");
} else if (adminCount && process.env.ADMIN_PASSWORD) {
  console.warn("Megjegyzés: az ADMIN_PASSWORD csak az első admin létrehozásakor számít; már van admin, a változó törölhető.");
}

if (!config.isProduction) importLegacyJson();

const server = app.listen(config.port, config.host, () => {
  console.log(`Mesegombolyag szerver: http://${config.host}:${config.port} (adatok: ${config.dataDir}, levélküldés: ${config.app.mail.transport})`);
});

// Railway újratelepítéskor SIGTERM-et küld: új kérést nem fogadunk, a folyamatban lévő levelek kimennek, az adatbázis rendben lezárul.
let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal}: leállás…`);
  const force = setTimeout(() => process.exit(1), 10_000);
  force.unref();
  server.close(async () => {
    try {
      await processOutbox();
      db.close();
    } finally {
      process.exit(0);
    }
  });
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

/**
 * Csak fejlesztői környezetben: a korábbi JSON-tárolóból (data/mesegombolyag-data.json) egyszer átemeli
 * az oldaltartalmat, az admin felhasználót és az érdeklődéseket. Production módban nem fut
 * (a JSON-fájlban lévő régi jelszó-hash a git-előzményekben szerepel, ezért élesben nem használható).
 */
function importLegacyJson() {
  const legacyPath = path.join(config.dataDir, "mesegombolyag-data.json");
  if (!fs.existsSync(legacyPath)) return;
  const done = db.prepare("SELECT value FROM site_content WHERE key = '__legacy_imported'").get();
  if (done) return;
  let legacy;
  try {
    legacy = JSON.parse(fs.readFileSync(legacyPath, "utf8"));
  } catch {
    return;
  }
  const now = new Date().toISOString();
  db.exec("BEGIN IMMEDIATE");
  try {
    const upsert = db.prepare("INSERT OR IGNORE INTO site_content (key, value, updated_at) VALUES (?, ?, ?)");
    for (const [key, value] of Object.entries(legacy.siteContent || {})) {
      if (key in DEFAULT_SITE_CONTENT && typeof value === "string" && value) upsert.run(key, value, now);
    }
    for (const user of legacy.adminUsers || []) {
      if (user.username && user.passwordHash) {
        db.prepare("INSERT OR IGNORE INTO admin_users (username, email, password_hash, created_at) VALUES (?, ?, ?, ?)").run(user.username, user.email || null, user.passwordHash, now);
      }
    }
    for (const iq of legacy.inquiries || []) {
      db.prepare(
        `INSERT OR IGNORE INTO inquiries (id, kind, name, email, phone, message, status, created_at) VALUES (?, 'general', ?, ?, ?, ?, 'new', ?)`,
      ).run(iq.id, iq.name || "—", iq.email || "—", iq.phone || null, iq.message || "—", iq.createdAt || now);
    }
    db.prepare("INSERT INTO site_content (key, value, updated_at) VALUES ('__legacy_imported', ?, ?)").run(now, now);
    db.exec("COMMIT");
    console.log("A korábbi JSON-adatok átemelve az adatbázisba.");
  } catch (error) {
    db.exec("ROLLBACK");
    console.error("A JSON-adatok átemelése nem sikerült:", error.message);
  }
}

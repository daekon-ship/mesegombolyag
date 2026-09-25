import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { createApp, DEFAULT_SITE_CONTENT } from "./app.mjs";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const env = process.env;
const isProduction = env.NODE_ENV === "production";

if (isProduction && (!env.JWT_SECRET || env.JWT_SECRET.length < 32)) {
  console.error("Hiba: production módban a JWT_SECRET legalább 32 karakteres, titkos érték kell legyen.");
  process.exit(1);
}

const dataDir = env.DATA_DIR ? path.resolve(env.DATA_DIR) : path.join(root, "data");
const port = Number(env.PORT || 3001);

const { app, db } = createApp({
  dbPath: env.DB_PATH ? path.resolve(env.DB_PATH) : path.join(dataDir, "mesegombolyag.db"),
  uploadDir: path.join(dataDir, "uploads"),
  distDir: path.join(root, "dist"),
  basePath: env.BASE_PATH || "/mesegombolyag",
  jwtSecret: env.JWT_SECRET || "mesegombolyag-local-dev-secret-only",
  secureCookies: isProduction,
  trustProxy: env.TRUST_PROXY === "1" ? 1 : false,
  corsOrigins: (env.CORS_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean),
  publicSiteUrl: (env.PUBLIC_SITE_URL || `http://localhost:4173/mesegombolyag`).replace(/\/$/, ""),
  adminNotifyEmail: env.ADMIN_EMAIL || DEFAULT_SITE_CONTENT.contactEmail,
  rateLimit: env.DISABLE_RATE_LIMIT !== "1",
  mail: {
    transport: env.MAIL_TRANSPORT || undefined,
    captureDir: path.join(dataDir, "mail-capture"),
    from: env.FROM_EMAIL || env.ADMIN_EMAIL || DEFAULT_SITE_CONTENT.contactEmail,
    smtp: { host: env.SMTP_HOST, port: Number(env.SMTP_PORT || 587), user: env.SMTP_USER, pass: env.SMTP_PASS },
  },
  bootstrapAdmin: {
    username: env.ADMIN_USERNAME,
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
    passwordHash: env.ADMIN_PASSWORD_HASH,
  },
});

importLegacyJson();

app.listen(port, () => {
  console.log(`Mesegombolyag szerver: http://localhost:${port}`);
});

/**
 * A korábbi JSON-tárolóból (data/mesegombolyag-data.json) egyszer átemeli az oldaltartalmat,
 * az admin felhasználót és az érdeklődéseket. Az eredeti fájlt nem módosítja.
 * A régi, kódba égetett demo csoportokhoz tartozó jelentkezések nem kerülnek át,
 * mert az új rendszerben ezek a programok nem léteznek — a JSON-fájlban megmaradnak.
 */
function importLegacyJson() {
  const legacyPath = path.join(dataDir, "mesegombolyag-data.json");
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

import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

/**
 * Mentés és visszaállítás a tartós adatmappán (DATA_DIR / Railway-kötet) belül.
 * - A mentés futó szerver mellett is biztonságos: `VACUUM INTO` konzisztens pillanatképet ír.
 * - A visszaállítás nem futó adatbázist ír felül: csak „függő visszaállítást" jelöl meg,
 *   amelyet a szerver a következő induláskor, az adatbázis megnyitása ELŐTT hajt végre.
 *   A felülírt adatok előbb a `pre-restore-<időbélyeg>` mappába kerülnek.
 */

const MARKER = ".restore-pending";
const DB_FILE = "mesegombolyag.db";

const stamp = () => new Date().toISOString().replace(/[:.]/g, "-");

export function createBackup({ dataDir, dbPath }) {
  const dir = path.join(dataDir, "backups", `mentes-${stamp()}`);
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, DB_FILE);
  const db = new DatabaseSync(dbPath);
  try {
    db.exec("PRAGMA busy_timeout = 5000");
    db.prepare("VACUUM INTO ?").run(target);
  } finally {
    db.close();
  }
  const uploads = path.join(dataDir, "uploads");
  if (fs.existsSync(uploads)) fs.cpSync(uploads, path.join(dir, "uploads"), { recursive: true });
  const info = inspectBackup(dir);
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify({ createdAt: new Date().toISOString(), ...info }, null, 2));
  return { dir, ...info };
}

/** Ellenőrzi a mentést: épség, sémaverzió és néhány darabszám (személyes adat nélkül). */
export function inspectBackup(dir) {
  const file = path.join(dir, DB_FILE);
  if (!fs.existsSync(file)) throw new Error(`A mentésben nincs ${DB_FILE}: ${dir}`);
  const db = new DatabaseSync(file, { readOnly: true });
  try {
    const integrity = db.prepare("PRAGMA integrity_check").get().integrity_check;
    if (integrity !== "ok") throw new Error(`A mentett adatbázis sérült: ${integrity}`);
    const schemaVersion = db.prepare("PRAGMA user_version").get().user_version;
    const count = (t) => db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;
    const uploadsDir = path.join(dir, "uploads");
    return {
      schemaVersion,
      counts: {
        bookings: count("bookings"),
        registrations: count("registrations"),
        programs: count("programs"),
        inquiries: count("inquiries"),
        uploads: fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir).length : 0,
      },
    };
  } finally {
    db.close();
  }
}

export function listBackups(dataDir) {
  const root = path.join(dataDir, "backups");
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root).filter((d) => fs.existsSync(path.join(root, d, DB_FILE))).sort();
}

/** Visszaállítás előjegyzése: csak a DATA_DIR/backups alatti, ellenőrzött mentés fogadható el. */
export function requestRestore({ dataDir, backupName }) {
  const root = path.resolve(dataDir, "backups");
  const dir = path.resolve(root, backupName);
  if (!dir.startsWith(root + path.sep)) throw new Error("A mentésnek a backups mappában kell lennie.");
  const info = inspectBackup(dir);
  fs.writeFileSync(path.join(dataDir, MARKER), path.basename(dir), "utf8");
  return { dir, ...info };
}

/** Induláskor, az adatbázis megnyitása előtt hívandó. Visszaadja a végrehajtott visszaállítás adatait, vagy null-t. */
export function applyPendingRestore({ dataDir, dbPath, log = console.log }) {
  const marker = path.join(dataDir, MARKER);
  if (!fs.existsSync(marker)) return null;
  const name = fs.readFileSync(marker, "utf8").trim();
  const source = path.resolve(dataDir, "backups", name);
  inspectBackup(source);

  const safety = path.join(dataDir, `pre-restore-${stamp()}`);
  fs.mkdirSync(safety, { recursive: true });
  for (const suffix of ["", "-wal", "-shm"]) {
    const f = dbPath + suffix;
    if (fs.existsSync(f)) fs.renameSync(f, path.join(safety, path.basename(f)));
  }
  const uploads = path.join(dataDir, "uploads");
  if (fs.existsSync(uploads)) fs.renameSync(uploads, path.join(safety, "uploads"));

  fs.copyFileSync(path.join(source, DB_FILE), dbPath);
  if (fs.existsSync(path.join(source, "uploads"))) fs.cpSync(path.join(source, "uploads"), uploads, { recursive: true });
  else fs.mkdirSync(uploads, { recursive: true });
  fs.rmSync(marker);
  log(`Visszaállítás kész a(z) ${name} mentésből. A korábbi adatok: ${path.basename(safety)}`);
  return { source, safety };
}

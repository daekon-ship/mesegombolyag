import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

// Aktív (helyet foglaló) státuszok. Minden kapacitás- és elérhetőség-számítás ezt használja:
// a „pending" (visszaigazolásra vár) és a „confirmed" (visszaigazolva) foglal helyet,
// a „cancelled" (lemondva) és a „rejected" (elutasítva) nem.
export const ACTIVE_STATUSES = ["pending", "confirmed"];

const MIGRATIONS = [
  `
  CREATE TABLE admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE site_content (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE slots (
    id TEXT PRIMARY KEY,
    starts_at TEXT NOT NULL UNIQUE,
    duration_min INTEGER NOT NULL DEFAULT 60 CHECK (duration_min BETWEEN 15 AND 480),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_at TEXT NOT NULL
  );

  CREATE TABLE bookings (
    id TEXT PRIMARY KEY,
    slot_id TEXT NOT NULL REFERENCES slots(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'rejected')),
    manage_token_hash TEXT UNIQUE,
    idempotency_key TEXT UNIQUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  -- Egy időpontra egyszerre legfeljebb egy aktív foglalás lehet (adatbázis-szintű védelem).
  CREATE UNIQUE INDEX bookings_one_active_per_slot ON bookings(slot_id) WHERE status IN ('pending', 'confirmed');

  CREATE TABLE programs (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('workshop', 'mesemuhely')),
    title TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    image TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    capacity INTEGER NOT NULL CHECK (capacity BETWEEN 1 AND 200),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled')),
    registration_open INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE program_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    starts_at TEXT NOT NULL,
    ends_at TEXT NOT NULL,
    CHECK (ends_at > starts_at)
  );
  CREATE INDEX program_sessions_program ON program_sessions(program_id, starts_at);

  -- Egy jelentkezés mindig egy teljes programhoz tartozik (meseműhelynél a teljes folyamathoz),
  -- soha nem egy-egy találkozóhoz.
  CREATE TABLE registrations (
    id TEXT PRIMARY KEY,
    program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    email_norm TEXT NOT NULL,
    phone TEXT NOT NULL,
    seats INTEGER NOT NULL DEFAULT 1 CHECK (seats BETWEEN 1 AND 10),
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'rejected')),
    manage_token_hash TEXT UNIQUE,
    idempotency_key TEXT UNIQUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE UNIQUE INDEX registrations_one_active_per_email ON registrations(program_id, email_norm) WHERE status IN ('pending', 'confirmed');

  CREATE TRIGGER registrations_capacity_insert BEFORE INSERT ON registrations
  WHEN NEW.status IN ('pending', 'confirmed')
  BEGIN
    SELECT RAISE(ABORT, 'CAPACITY_EXCEEDED')
    WHERE (SELECT COALESCE(SUM(seats), 0) FROM registrations WHERE program_id = NEW.program_id AND status IN ('pending', 'confirmed')) + NEW.seats
      > (SELECT capacity FROM programs WHERE id = NEW.program_id);
  END;

  CREATE TRIGGER registrations_capacity_reactivate BEFORE UPDATE OF status ON registrations
  WHEN NEW.status IN ('pending', 'confirmed') AND OLD.status NOT IN ('pending', 'confirmed')
  BEGIN
    SELECT RAISE(ABORT, 'CAPACITY_EXCEEDED')
    WHERE (SELECT COALESCE(SUM(seats), 0) FROM registrations WHERE program_id = NEW.program_id AND status IN ('pending', 'confirmed')) + NEW.seats
      > (SELECT capacity FROM programs WHERE id = NEW.program_id);
  END;

  CREATE TRIGGER programs_capacity_not_below_registered BEFORE UPDATE OF capacity ON programs
  BEGIN
    SELECT RAISE(ABORT, 'CAPACITY_BELOW_REGISTERED')
    WHERE NEW.capacity < (SELECT COALESCE(SUM(seats), 0) FROM registrations WHERE program_id = NEW.id AND status IN ('pending', 'confirmed'));
  END;

  CREATE TABLE inquiries (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL CHECK (kind IN ('general', 'individual', 'workshop', 'mesemuhely', 'program')),
    program_id TEXT REFERENCES programs(id) ON DELETE SET NULL,
    program_title TEXT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'handled')),
    idempotency_key TEXT UNIQUE,
    created_at TEXT NOT NULL
  );

  CREATE TABLE email_outbox (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    related_type TEXT,
    related_id TEXT,
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    text_body TEXT NOT NULL,
    html_body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TEXT NOT NULL,
    sent_at TEXT
  );
  `,
];

export function openDatabase(dbPath) {
  if (dbPath !== ":memory:") fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
  const { user_version: version } = db.prepare("PRAGMA user_version").get();
  for (let i = version; i < MIGRATIONS.length; i += 1) {
    transaction(db, () => {
      db.exec(MIGRATIONS[i]);
      db.exec(`PRAGMA user_version = ${i + 1}`);
    });
  }
  return db;
}

/** Írási tranzakció (BEGIN IMMEDIATE), hibánál visszagörget. */
export function transaction(db, fn) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

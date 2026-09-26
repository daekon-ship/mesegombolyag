import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { ACTIVE_STATUSES, openDatabase, transaction } from "./db.mjs";
import { createMailer, renderEmail } from "./mail.mjs";
import { budapestLocalToUtc, budapestParts, formatBudapestDateTime, formatBudapestRange } from "./time.mjs";

// ---------------------------------------------------------------------------
// Konstansok és címkék
// ---------------------------------------------------------------------------

export const PROGRAM_TYPE_LABELS = { workshop: "Mesés workshop", mesemuhely: "Meseműhely" };
export const STATUS_LABELS = {
  pending: "Visszaigazolásra vár",
  confirmed: "Visszaigazolva",
  cancelled: "Lemondva",
  rejected: "Elutasítva",
};
const INDIVIDUAL_SERVICE = "Személyes kísérés mesékkel";
const INQUIRY_KIND_LABELS = {
  general: "Általános kérdés",
  individual: "Személyes kísérés mesékkel (egyéni alkalom)",
  workshop: "Mesés workshop",
  mesemuhely: "Meseműhely",
  program: "Konkrét program",
};
const MAX_SEATS = { workshop: 3, mesemuhely: 1 };

export const DEFAULT_SITE_CONTENT = {
  heroTitle: "Meríts abból, ami benned van!",
  heroSubtitle: "Meseterápiával a lelki immunrendszerért.",
  heroDescription:
    "Vannak időszakok, amikor nem újabb tanácsokra van szükségünk, hanem arra, hogy egy kicsit megálljunk, és más szemszögből nézzünk rá a velünk történtekre.",
  heroImage: "",
  introTitle: "Minden élethelyzetnek megvan a mesebeli párja.",
  introText:
    "A népmesék szimbólumai és megküzdési mintái évszázados tudást hordoznak — segítségükkel más nézőpontból tekinthetünk saját élethelyzeteinkre.",
  contactEmail: "mesegombolyag@gmail.com",
  contactPhone: "",
  location: "Szeged",
  // Jogi oldalak: a szöveget Johanna (és jogi szakember) adja meg az adminban; üresen az oldal ezt jelzi.
  privacyPolicy: "",
  impressum: "",
};
const SITE_CONTENT_LIMITS = {
  heroTitle: 120,
  heroSubtitle: 160,
  heroDescription: 600,
  heroImage: 300,
  introTitle: 160,
  introText: 1500,
  contactEmail: 254,
  contactPhone: 40,
  location: 120,
  privacyPolicy: 30000,
  impressum: 10000,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9 ()/-]{6,20}$/;
const IMAGE_TYPES = [
  { ext: "jpg", mime: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "png", mime: "image/png", test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: "webp", mime: "image/webp", test: (b) => b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP" },
];
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

const nowIso = (clock) => clock().toISOString();
const newId = (prefix) => `${prefix}_${crypto.randomUUID()}`;
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const newToken = () => crypto.randomBytes(24).toString("base64url");
const clean = (value) => (typeof value === "string" ? value.trim() : "");

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "program";
}

// ---------------------------------------------------------------------------
// Validáció
// ---------------------------------------------------------------------------

function validateContact(body, { phoneRequired }) {
  const errors = {};
  const name = clean(body.name);
  const email = clean(body.email);
  const phone = clean(body.phone);
  if (name.length < 2) errors.name = "Kérlek, add meg a neved.";
  else if (name.length > 100) errors.name = "A név legfeljebb 100 karakter lehet.";
  if (!email) errors.email = "Kérlek, add meg az e-mail-címed.";
  else if (email.length > 254 || !EMAIL_RE.test(email)) errors.email = "Az e-mail-cím formátuma nem megfelelő.";
  if (!phone && phoneRequired) errors.phone = "Kérlek, add meg a telefonszámod.";
  else if (phone && !PHONE_RE.test(phone)) errors.phone = "A telefonszám formátuma nem megfelelő (pl. +36 30 123 4567).";
  return { errors, name, email, phone };
}

function validateOptionalText(body, field, max, errors, label) {
  const value = clean(body[field]);
  if (value.length > max) errors[field] = `${label} legfeljebb ${max} karakter lehet.`;
  return value || null;
}

function assertNoErrors(errors) {
  if (Object.keys(errors).length) {
    throw new HttpError(400, "Kérlek, javítsd a megjelölt mezőket.", { errors });
  }
}

function readIdempotencyKey(body) {
  const key = clean(body.idempotencyKey);
  if (!key) return null;
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(key)) throw new HttpError(400, "Érvénytelen kérésazonosító.");
  return key;
}

// ---------------------------------------------------------------------------
// Az alkalmazás
// ---------------------------------------------------------------------------

export function createApp(options) {
  const config = {
    clock: () => new Date(),
    rateLimit: true,
    corsOrigins: [],
    secureCookies: false,
    sessionHours: 8,
    basePath: "/",
    ...options,
  };
  if (!config.jwtSecret || config.jwtSecret.length < 16) throw new Error("JWT_SECRET legalább 16 karakter legyen.");

  const db = openDatabase(config.dbPath);
  const mailer = createMailer(config.mail);
  const uploadDir = config.uploadDir;
  fs.mkdirSync(uploadDir, { recursive: true });

  // --- adatbázis-segédek ----------------------------------------------------

  function getSiteContent() {
    const rows = db.prepare("SELECT key, value FROM site_content").all();
    const content = { ...DEFAULT_SITE_CONTENT };
    for (const row of rows) if (row.key in content) content[row.key] = row.value;
    return content;
  }

  function sessionsFor(programId) {
    return db
      .prepare("SELECT id, starts_at AS startsAt, ends_at AS endsAt FROM program_sessions WHERE program_id = ? ORDER BY starts_at")
      .all(programId)
      .map((s) => ({ ...s }));
  }

  function seatsTaken(programId) {
    return db
      .prepare(`SELECT COALESCE(SUM(seats), 0) AS n FROM registrations WHERE program_id = ? AND status IN ('pending', 'confirmed')`)
      .get(programId).n;
  }

  function decorateProgram(row) {
    const sessions = sessionsFor(row.id);
    const taken = seatsTaken(row.id);
    const now = nowIso(config.clock);
    const first = sessions[0];
    const last = sessions[sessions.length - 1];
    const isPast = last ? last.endsAt <= now : false;
    const started = first ? first.startsAt <= now : false;
    let registrationState = "open";
    if (row.status === "cancelled") registrationState = "cancelled";
    else if (isPast) registrationState = "past";
    else if (row.status !== "published" || !row.registration_open || started || !first) registrationState = "closed";
    else if (taken >= row.capacity) registrationState = "full";
    return {
      id: row.id,
      slug: row.slug,
      type: row.type,
      typeLabel: PROGRAM_TYPE_LABELS[row.type],
      title: row.title,
      summary: row.summary,
      description: row.description,
      image: row.image,
      location: row.location,
      capacity: row.capacity,
      status: row.status,
      registrationOpen: Boolean(row.registration_open),
      sessions,
      seatsTaken: taken,
      seatsLeft: Math.max(row.capacity - taken, 0),
      maxSeatsPerRegistration: MAX_SEATS[row.type],
      registrationState,
      isPast,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  function getProgramRow(id) {
    return db.prepare("SELECT * FROM programs WHERE id = ?").get(id);
  }

  function describeSessions(sessions) {
    return sessions.map((s, i) => `${sessions.length > 1 ? `${i + 1}. alkalom: ` : ""}${formatBudapestRange(s.startsAt, s.endsAt)}`).join("\n");
  }

  function availableSlots() {
    return db
      .prepare(
        `SELECT s.id, s.starts_at AS startsAt, s.duration_min AS durationMin FROM slots s
         WHERE s.status = 'open' AND s.starts_at > ?
           AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.slot_id = s.id AND b.status IN ('pending', 'confirmed'))
         ORDER BY s.starts_at`,
      )
      .all(nowIso(config.clock))
      .map((s) => ({ ...s }));
  }

  // --- e-mail sor -------------------------------------------------------------

  /** Látogatónak szóló levél: a válaszcím Johanna kapcsolati címe. */
  function queueEmail(relatedType, relatedId, to, rendered, replyTo = getSiteContent().contactEmail) {
    db.prepare(
      `INSERT INTO email_outbox (related_type, related_id, recipient, reply_to, subject, text_body, html_body, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    ).run(relatedType, relatedId, to, replyTo || null, rendered.subject, rendered.text, rendered.html, nowIso(config.clock));
  }
  /** Johannának szóló értesítés: a válaszcím a látogató címe, így közvetlenül válaszolhat. */
  function queueAdminEmail(visitorEmail, relatedType, relatedId, rendered) {
    queueEmail(relatedType, relatedId, notifyAdmin(), rendered, visitorEmail);
  }

  // Adatbázisonként egyedi azonosító: a szolgáltatói Idempotency-Key ne ütközzön két telepítés között.
  const installId = (() => {
    const row = db.prepare("SELECT value FROM site_content WHERE key = '__install_id'").get();
    if (row) return row.value;
    const id = crypto.randomUUID();
    db.prepare("INSERT INTO site_content (key, value, updated_at) VALUES ('__install_id', ?, ?)").run(id, nowIso(config.clock));
    return id;
  })();

  let outboxRun = Promise.resolve();
  function processOutbox() {
    outboxRun = outboxRun.then(async () => {
      const pending = db.prepare("SELECT * FROM email_outbox WHERE status = 'pending' ORDER BY id").all();
      for (const row of pending) {
        try {
          const result = await mailer.deliver({
            id: row.id,
            idempotencyKey: `mesegombolyag-${installId}-${row.id}`,
            to: row.recipient,
            replyTo: row.reply_to,
            subject: row.subject,
            text: row.text_body,
            html: row.html_body,
          });
          db.prepare("UPDATE email_outbox SET status = 'sent', attempts = attempts + 1, last_error = NULL, provider_id = ?, sent_at = ? WHERE id = ?").run(result?.providerId ?? null, nowIso(config.clock), row.id);
        } catch (error) {
          db.prepare("UPDATE email_outbox SET status = 'failed', attempts = attempts + 1, last_error = ? WHERE id = ?").run(String(error?.message || error).slice(0, 500), row.id);
        }
      }
    });
    return outboxRun;
  }

  // Csak valódi kézbesítésnél ígérünk e-mailt a látogatónak (levélfogó/kikapcsolt módban nem).
  const emailNotifications = mailer.mode === "resend" || mailer.mode === "smtp";
  const adminUrl = () => `${config.publicSiteUrl}/#/admin`;
  const manageUrl = (token) => `${config.publicSiteUrl}/#/lemondas/${token}`;
  const notifyAdmin = () => config.adminNotifyEmail || getSiteContent().contactEmail;

  // --- levélsablonok ------------------------------------------------------------

  function bookingRows(booking, slot) {
    return [
      ["Alkalom", INDIVIDUAL_SERVICE],
      ["Időpont", formatBudapestDateTime(slot.starts_at)],
      ["Időtartam", `${slot.duration_min} perc`],
      ["Állapot", STATUS_LABELS[booking.status]],
    ];
  }

  function registrationRows(reg, program) {
    const sessions = sessionsFor(program.id);
    return [
      ["Program", `${program.title} (${PROGRAM_TYPE_LABELS[program.type]})`],
      [sessions.length > 1 ? "Alkalmak" : "Időpont", describeSessions(sessions) || "—"],
      ["Helyszín", program.location || "Egyeztetés alatt"],
      ["Létszám", `${reg.seats} fő`],
      ["Állapot", STATUS_LABELS[reg.status]],
    ];
  }

  function emailBookingStatus(booking, slot, { byGuest = false } = {}) {
    const rows = bookingRows(booking, slot);
    if (booking.status === "confirmed") {
      queueEmail("booking", booking.id, booking.email, renderEmail({
        subject: `Időpontod visszaigazolva – ${formatBudapestDateTime(slot.starts_at)}`,
        greeting: `Kedves ${booking.name}!`,
        paragraphs: ["Örömmel visszaigazolom az egyéni alkalmunkat. Ha mégsem tudnál eljönni, kérlek, jelezd minél előbb."],
        rows,
      }));
    } else if (booking.status === "cancelled" || booking.status === "rejected") {
      queueEmail("booking", booking.id, booking.email, renderEmail({
        subject: booking.status === "cancelled" ? "Időpontfoglalásod lemondva – Mesegombolyag" : "Időpontfoglalásod nem igazolható vissza – Mesegombolyag",
        greeting: `Kedves ${booking.name}!`,
        paragraphs: [
          byGuest
            ? "A foglalásodat lemondtad, az időpont felszabadult."
            : booking.status === "cancelled"
              ? "Sajnos az alábbi időpontot le kell mondanom. Ha szeretnél új időpontot, a weboldalon választhatsz a szabad alkalmak közül."
              : "Sajnos az alábbi időpontot nem tudom visszaigazolni. Ha szeretnél, válassz egy másik szabad időpontot a weboldalon, vagy írj nekem.",
        ],
        rows,
        action: { label: "Szabad időpontok", url: `${config.publicSiteUrl}/#/foglalas` },
      }));
    }
  }

  function emailRegistrationStatus(reg, program, { byGuest = false } = {}) {
    const rows = registrationRows(reg, program);
    if (reg.status === "confirmed") {
      queueEmail("registration", reg.id, reg.email, renderEmail({
        subject: `Jelentkezésed visszaigazolva – ${program.title}`,
        greeting: `Kedves ${reg.name}!`,
        paragraphs: ["Örömmel visszaigazolom a jelentkezésedet. Hamarosan küldöm a további tudnivalókat."],
        rows,
      }));
    } else if (reg.status === "cancelled" || reg.status === "rejected") {
      queueEmail("registration", reg.id, reg.email, renderEmail({
        subject: reg.status === "cancelled" ? `Jelentkezésed lemondva – ${program.title}` : `Jelentkezésed nem igazolható vissza – ${program.title}`,
        greeting: `Kedves ${reg.name}!`,
        paragraphs: [
          byGuest
            ? "A jelentkezésedet lemondtad, a helyed felszabadult."
            : reg.status === "cancelled"
              ? "Sajnos a jelentkezésedet le kell mondanom. Ha kérdésed van, válaszolj erre a levélre."
              : "Sajnos a jelentkezésedet ezúttal nem tudom visszaigazolni. Ha kérdésed van, válaszolj erre a levélre.",
        ],
        rows,
      }));
    }
  }

  // --- rate limit ---------------------------------------------------------------

  const hits = new Map();
  function rateLimit(bucket, max, windowMs) {
    return (req, _res, next) => {
      if (!config.rateLimit) return next();
      const key = `${bucket}:${req.ip}`;
      const now = Date.now();
      const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
      if (list.length >= max) return next(new HttpError(429, "Túl sok próbálkozás rövid időn belül. Kérlek, várj néhány percet, és próbáld újra."));
      list.push(now);
      hits.set(key, list);
      next();
    };
  }

  // --- autentikáció ------------------------------------------------------------------

  const COOKIE = "mesegombolyag_admin";
  /** Érvényes aláírás és lejárat mellett a tokenverziónak is egyeznie kell (jelszócsere után a régi munkamenetek érvénytelenek). */
  function readAdmin(req) {
    const token = req.cookies?.[COOKIE];
    if (!token) return null;
    let payload;
    try {
      payload = jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] });
    } catch {
      return null;
    }
    const user = db.prepare("SELECT id, username, token_version FROM admin_users WHERE id = ?").get(payload.sub);
    if (!user || user.token_version !== payload.ver) return null;
    return { sub: user.id, username: user.username };
  }
  function requireAdmin(req, _res, next) {
    const admin = readAdmin(req);
    if (!admin) return next(new HttpError(401, "A munkamenet lejárt vagy nem vagy bejelentkezve. Kérlek, jelentkezz be újra.", { code: "UNAUTHENTICATED" }));
    req.admin = admin;
    next();
  }

  // --- express ---------------------------------------------------------------------------

  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", config.trustProxy ?? false);

  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "DENY");
    const allowedOrigin = config.corsOrigins.find((o) => o === req.headers.origin);
    if (allowedOrigin) {
      res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE");
      res.setHeader("Vary", "Origin");
      if (req.method === "OPTIONS") return res.sendStatus(204);
    }
    next();
  });
  app.use(cookieParser());
  app.use("/api", (req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    // Állapotmódosító kéréseknél csak JSON-t fogadunk (a képfeltöltés kivétel), ez CSRF ellen is véd.
    if (["POST", "PUT", "PATCH"].includes(req.method) && req.path !== "/admin/uploads" && req.headers["content-length"] !== "0" && req.headers["content-type"] && !req.is("application/json")) {
      return next(new HttpError(415, "A kérés formátuma nem támogatott."));
    }
    next();
  });
  app.use("/api", express.json({ limit: "100kb" }));

  app.use("/uploads", express.static(uploadDir, { maxAge: "30d", immutable: true, fallthrough: false }));

  // --- nyilvános végpontok ------------------------------------------------------------------

  // Állapotellenőrzés (Railway healthcheck): csak annyit árul el, hogy a szerver és az adatbázis válaszol.
  app.get("/api/health", (_req, res) => {
    try {
      db.prepare("SELECT 1").get();
      res.json({ ok: true, data: { status: "ok" } });
    } catch {
      res.status(503).json({ ok: false, message: "Az adatbázis nem érhető el." });
    }
  });

  app.get("/api/public-data", (_req, res) => {
    const programs = db
      .prepare("SELECT * FROM programs WHERE status IN ('published', 'cancelled')")
      .all()
      .map(decorateProgram)
      .filter((p) => !p.isPast && p.sessions.length)
      .sort((a, b) => a.sessions[0].startsAt.localeCompare(b.sessions[0].startsAt))
      .map(publicProgram);
    res.json({
      ok: true,
      data: { siteContent: getSiteContent(), slots: availableSlots(), programs, site: { previewMode: Boolean(config.previewMode), emailNotifications } },
    });
  });

  function publicProgram(p) {
    const { createdAt: _c, updatedAt: _u, registrationOpen: _r, ...rest } = p;
    return rest;
  }

  app.get("/api/programs/:slug", (req, res) => {
    const row = db.prepare("SELECT * FROM programs WHERE slug = ? AND status IN ('published', 'cancelled')").get(req.params.slug);
    if (!row) throw new HttpError(404, "A program nem található.");
    res.json({ ok: true, data: { program: publicProgram(decorateProgram(row)) } });
  });

  // Egyéni időpontfoglalás
  app.post("/api/bookings", rateLimit("public", 20, 10 * 60_000), (req, res) => {
    const body = req.body || {};
    if (clean(body.website)) return res.json({ ok: true, message: "Köszönjük!" }); // honeypot
    const idempotencyKey = readIdempotencyKey(body);
    if (idempotencyKey) {
      const existing = db.prepare("SELECT b.*, s.starts_at, s.duration_min FROM bookings b JOIN slots s ON s.id = b.slot_id WHERE b.idempotency_key = ?").get(idempotencyKey);
      if (existing) return res.json(bookingResponse(existing, true));
    }
    const { errors, name, email, phone } = validateContact(body, { phoneRequired: true });
    const notes = validateOptionalText(body, "notes", 2000, errors, "Az üzenet");
    const slotId = clean(body.slotId);
    if (!slotId) errors.slotId = "Kérlek, válassz egy szabad időpontot.";
    assertNoErrors(errors);

    const token = newToken();
    const booking = transaction(db, () => {
      const slot = db.prepare("SELECT * FROM slots WHERE id = ?").get(slotId);
      if (!slot || slot.status !== "open" || slot.starts_at <= nowIso(config.clock)) {
        throw new HttpError(409, "Ez az időpont már nem foglalható. Kérlek, válassz másikat.", { code: "SLOT_UNAVAILABLE" });
      }
      const taken = db.prepare("SELECT 1 FROM bookings WHERE slot_id = ? AND status IN ('pending', 'confirmed')").get(slotId);
      if (taken) throw new HttpError(409, "Ezt az időpontot közben valaki más lefoglalta. Kérlek, válassz másikat.", { code: "SLOT_TAKEN" });
      const now = nowIso(config.clock);
      const row = { id: newId("bk"), slot_id: slotId, name, email, phone, notes, status: "pending", manage_token_hash: hashToken(token), idempotency_key: idempotencyKey, created_at: now, updated_at: now };
      try {
        db.prepare(
          `INSERT INTO bookings (id, slot_id, name, email, phone, notes, status, manage_token_hash, idempotency_key, created_at, updated_at)
           VALUES (:id, :slot_id, :name, :email, :phone, :notes, :status, :manage_token_hash, :idempotency_key, :created_at, :updated_at)`,
        ).run(row);
      } catch (error) {
        if (String(error.message).includes("UNIQUE")) throw new HttpError(409, "Ezt az időpontot közben valaki más lefoglalta. Kérlek, válassz másikat.", { code: "SLOT_TAKEN" });
        throw error;
      }
      const rows = bookingRows(row, slot);
      queueEmail("booking", row.id, email, renderEmail({
        subject: "Időpontfoglalásod megérkezett – visszaigazolásra vár",
        greeting: `Kedves ${name}!`,
        paragraphs: [
          "Köszönöm, hogy időpontot foglaltál. A foglalásod rögzítettem, de még visszaigazolásra vár: hamarosan e-mailben jelzem, hogy az időpont végleges-e.",
        ],
        rows,
        action: { label: "Foglalás megtekintése vagy lemondása", url: manageUrl(token) },
        footerNote: "Ezt a levelet azért kaptad, mert a Mesegombolyag weboldalán időpontot foglaltál. A fenti hivatkozás csak a te foglalásodhoz tartozik, ne add tovább.",
      }));
      queueAdminEmail(email, "booking", row.id, renderEmail({
        subject: `Új időpontfoglalás: ${formatBudapestDateTime(slot.starts_at)}`,
        greeting: "Szia Johanna!",
        signature: false,
        paragraphs: ["Új egyéni időpontfoglalás érkezett a weboldalról. A foglalás visszaigazolásra vár."],
        rows: [["Név", name], ["E-mail", email], ["Telefon", phone], ...rows, ["Üzenet", notes || "—"]],
        action: { label: "Megnyitás az adminban", url: adminUrl() },
      }));
      return { ...row, starts_at: slot.starts_at, duration_min: slot.duration_min };
    });
    processOutbox();
    res.status(201).json(bookingResponse(booking, false, token));
  });

  /** Levélküldés nélkül a lemondási link csak így juthat el a látogatóhoz — kizárólag a beküldőnek adjuk vissza. */
  const followUp = (token) => ({ emailNotifications, ...(!emailNotifications && token ? { manageUrl: manageUrl(token) } : {}) });
  const pendingSuffix = () => (emailNotifications ? "hamarosan e-mailben jelentkezünk." : "Johanna hamarosan felveszi veled a kapcsolatot.");

  function bookingResponse(b, duplicate, token) {
    return {
      ok: true,
      message: `Foglalásodat rögzítettük. Visszaigazolásra vár — ${pendingSuffix()}`,
      data: { booking: { id: b.id, status: b.status, statusLabel: STATUS_LABELS[b.status], startsAt: b.starts_at, durationMin: b.duration_min }, duplicate, ...followUp(token) },
    };
  }

  // Csoportos jelentkezés (workshop vagy teljes meseműhely-folyamat)
  app.post("/api/registrations", rateLimit("public", 20, 10 * 60_000), (req, res) => {
    const body = req.body || {};
    if (clean(body.website)) return res.json({ ok: true, message: "Köszönjük!" });
    const idempotencyKey = readIdempotencyKey(body);
    if (idempotencyKey) {
      const existing = db.prepare("SELECT * FROM registrations WHERE idempotency_key = ?").get(idempotencyKey);
      if (existing) return res.json(registrationResponse(existing, getProgramRow(existing.program_id), true));
    }
    const { errors, name, email, phone } = validateContact(body, { phoneRequired: true });
    const notes = validateOptionalText(body, "notes", 2000, errors, "A megjegyzés");
    const programId = clean(body.programId);
    if (!programId) errors.programId = "Hiányzik a program azonosítója.";
    const seats = body.seats === undefined ? 1 : Number(body.seats);
    if (!Number.isInteger(seats) || seats < 1) errors.seats = "A létszám legalább 1 fő.";
    assertNoErrors(errors);

    const token = newToken();
    const { registration, program } = transaction(db, () => {
      const programRow = getProgramRow(programId);
      if (!programRow || programRow.status === "draft") throw new HttpError(404, "A program nem található.");
      const program = decorateProgram(programRow);
      const closedMessages = {
        cancelled: "Ez a program elmarad, ezért nem fogad jelentkezést.",
        past: "Ez a program már lezajlott.",
        closed: "Erre a programra a jelentkezés jelenleg zárva.",
        full: "Ez a program betelt, nincs több szabad hely.",
      };
      if (program.registrationState !== "open") {
        throw new HttpError(409, closedMessages[program.registrationState], { code: `PROGRAM_${program.registrationState.toUpperCase()}` });
      }
      if (seats > MAX_SEATS[programRow.type]) {
        throw new HttpError(400, "Kérlek, javítsd a megjelölt mezőket.", { errors: { seats: `Egy jelentkezéssel legfeljebb ${MAX_SEATS[programRow.type]} fő jelentkezhet.` } });
      }
      if (seats > program.seatsLeft) {
        throw new HttpError(409, `Már csak ${program.seatsLeft} szabad hely maradt.`, { code: "CAPACITY_EXCEEDED", seatsLeft: program.seatsLeft });
      }
      const emailNorm = email.toLowerCase();
      const dup = db.prepare("SELECT 1 FROM registrations WHERE program_id = ? AND email_norm = ? AND status IN ('pending', 'confirmed')").get(programId, emailNorm);
      if (dup) throw new HttpError(409, "Ezzel az e-mail-címmel már van aktív jelentkezés erre a programra.", { code: "DUPLICATE_REGISTRATION" });
      const now = nowIso(config.clock);
      const row = { id: newId("rg"), program_id: programId, name, email, email_norm: emailNorm, phone, seats, notes, status: "pending", manage_token_hash: hashToken(token), idempotency_key: idempotencyKey, created_at: now, updated_at: now };
      try {
        db.prepare(
          `INSERT INTO registrations (id, program_id, name, email, email_norm, phone, seats, notes, status, manage_token_hash, idempotency_key, created_at, updated_at)
           VALUES (:id, :program_id, :name, :email, :email_norm, :phone, :seats, :notes, :status, :manage_token_hash, :idempotency_key, :created_at, :updated_at)`,
        ).run(row);
      } catch (error) {
        const msg = String(error.message);
        if (msg.includes("CAPACITY_EXCEEDED")) throw new HttpError(409, "Ez a program közben betelt, nincs elég szabad hely.", { code: "CAPACITY_EXCEEDED" });
        if (msg.includes("UNIQUE")) throw new HttpError(409, "Ezzel az e-mail-címmel már van aktív jelentkezés erre a programra.", { code: "DUPLICATE_REGISTRATION" });
        throw error;
      }
      const rows = registrationRows(row, programRow);
      queueEmail("registration", row.id, email, renderEmail({
        subject: `Jelentkezésed megérkezett – ${programRow.title}`,
        greeting: `Kedves ${name}!`,
        paragraphs: [
          programRow.type === "mesemuhely"
            ? "Köszönöm a jelentkezésedet a meseműhelyre. A jelentkezés a teljes, több alkalomból álló folyamatra szól. Rögzítettem, és hamarosan visszaigazolom."
            : "Köszönöm a jelentkezésedet. Rögzítettem, és hamarosan visszaigazolom.",
        ],
        rows,
        action: { label: "Jelentkezés megtekintése vagy lemondása", url: manageUrl(token) },
        footerNote: "A fenti hivatkozás csak a te jelentkezésedhez tartozik, ne add tovább.",
      }));
      queueAdminEmail(email, "registration", row.id, renderEmail({
        subject: `Új jelentkezés: ${programRow.title}`,
        greeting: "Szia Johanna!",
        signature: false,
        paragraphs: ["Új jelentkezés érkezett a weboldalról. A jelentkezés visszaigazolásra vár."],
        rows: [["Név", name], ["E-mail", email], ["Telefon", phone], ...rows, ["Megjegyzés", notes || "—"], ["Foglalt helyek", `${program.seatsTaken + seats} / ${programRow.capacity}`]],
        action: { label: "Megnyitás az adminban", url: adminUrl() },
      }));
      return { registration: row, program: programRow };
    });
    processOutbox();
    res.status(201).json(registrationResponse(registration, program, false, token));
  });

  function registrationResponse(reg, program, duplicate, token) {
    return {
      ok: true,
      message: `Jelentkezésedet rögzítettük. Visszaigazolásra vár — ${pendingSuffix()}`,
      data: { registration: { id: reg.id, status: reg.status, statusLabel: STATUS_LABELS[reg.status], seats: reg.seats, programId: program.id, programTitle: program.title }, duplicate, ...followUp(token) },
    };
  }

  // Érdeklődés
  app.post("/api/inquiries", rateLimit("public", 20, 10 * 60_000), (req, res) => {
    const body = req.body || {};
    if (clean(body.website)) return res.json({ ok: true, message: "Köszönjük!" });
    const idempotencyKey = readIdempotencyKey(body);
    const okResponse = (id) => ({ ok: true, message: "Köszönjük! Üzenetedet megkaptuk, Johanna hamarosan válaszol.", data: { inquiry: { id }, emailNotifications } });
    if (idempotencyKey) {
      const existing = db.prepare("SELECT id FROM inquiries WHERE idempotency_key = ?").get(idempotencyKey);
      if (existing) return res.json(okResponse(existing.id));
    }
    const { errors, name, email, phone } = validateContact(body, { phoneRequired: false });
    const message = clean(body.message);
    if (message.length < 5) errors.message = "Kérlek, írj legalább néhány szót az üzenetbe.";
    else if (message.length > 3000) errors.message = "Az üzenet legfeljebb 3000 karakter lehet.";
    const kind = clean(body.kind) || "general";
    if (!(kind in INQUIRY_KIND_LABELS)) errors.kind = "Kérlek, válassz témát.";
    let program = null;
    if (clean(body.programId)) {
      program = db.prepare("SELECT id, title, type FROM programs WHERE id = ? AND status != 'draft'").get(clean(body.programId));
      if (!program) errors.programId = "A megadott program nem található.";
    }
    assertNoErrors(errors);

    const id = newId("iq");
    const kindLabel = program ? `${INQUIRY_KIND_LABELS.program}: ${program.title}` : INQUIRY_KIND_LABELS[kind];
    transaction(db, () => {
      db.prepare(
        `INSERT INTO inquiries (id, kind, program_id, program_title, name, email, phone, message, status, idempotency_key, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`,
      ).run(id, program ? "program" : kind, program?.id ?? null, program?.title ?? null, name, email, phone || null, message, idempotencyKey, nowIso(config.clock));
      queueAdminEmail(email, "inquiry", id, renderEmail({
        subject: `Új érdeklődés: ${kindLabel}`,
        greeting: "Szia Johanna!",
        signature: false,
        paragraphs: ["Új érdeklődés érkezett a weboldalról."],
        rows: [["Téma", kindLabel], ["Név", name], ["E-mail", email], ["Telefon", phone || "—"], ["Üzenet", message]],
        action: { label: "Megnyitás az adminban", url: adminUrl() },
      }));
      queueEmail("inquiry", id, email, renderEmail({
        subject: "Üzeneted megérkezett – Mesegombolyag",
        greeting: `Kedves ${name}!`,
        paragraphs: ["Köszönöm, hogy írtál. Az üzeneted megérkezett, hamarosan személyesen válaszolok."],
        rows: [["Téma", kindLabel], ["Üzeneted", message]],
      }));
    });
    processOutbox();
    res.status(201).json(okResponse(id));
  });

  // Vendég lemondási link — kizárólag a tokenhez tartozó foglalás/jelentkezés kezelhető vele.
  function findByToken(token) {
    if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
    const hash = hashToken(token);
    const booking = db.prepare("SELECT b.*, s.starts_at, s.duration_min FROM bookings b JOIN slots s ON s.id = b.slot_id WHERE b.manage_token_hash = ?").get(hash);
    if (booking) return { type: "booking", row: booking };
    const reg = db.prepare("SELECT * FROM registrations WHERE manage_token_hash = ?").get(hash);
    if (reg) return { type: "registration", row: reg };
    return null;
  }

  function manageView(found) {
    const now = nowIso(config.clock);
    if (found.type === "booking") {
      const b = found.row;
      return {
        type: "booking",
        title: INDIVIDUAL_SERVICE,
        name: b.name,
        status: b.status,
        statusLabel: STATUS_LABELS[b.status],
        when: formatBudapestDateTime(b.starts_at),
        canCancel: ACTIVE_STATUSES.includes(b.status) && b.starts_at > now,
      };
    }
    const r = found.row;
    const program = getProgramRow(r.program_id);
    const sessions = sessionsFor(program.id);
    return {
      type: "registration",
      title: `${program.title} (${PROGRAM_TYPE_LABELS[program.type]})`,
      name: r.name,
      status: r.status,
      statusLabel: STATUS_LABELS[r.status],
      when: describeSessions(sessions),
      seats: r.seats,
      canCancel: ACTIVE_STATUSES.includes(r.status) && (sessions[0]?.startsAt ?? "") > now,
    };
  }

  app.get("/api/manage/:token", rateLimit("manage", 60, 10 * 60_000), (req, res) => {
    const found = findByToken(req.params.token);
    if (!found) throw new HttpError(404, "A hivatkozás érvénytelen vagy lejárt.");
    res.json({ ok: true, data: manageView(found) });
  });

  app.post("/api/manage/:token/cancel", rateLimit("manage", 60, 10 * 60_000), (req, res) => {
    const found = findByToken(req.params.token);
    if (!found) throw new HttpError(404, "A hivatkozás érvénytelen vagy lejárt.");
    if (!manageView(found).canCancel) throw new HttpError(409, "Ez a foglalás már nem mondható le online. Kérlek, írj e-mailt.");
    transaction(db, () => {
      const now = nowIso(config.clock);
      if (found.type === "booking") {
        db.prepare("UPDATE bookings SET status = 'cancelled', updated_at = ? WHERE id = ?").run(now, found.row.id);
        const updated = { ...found.row, status: "cancelled" };
        const slot = { starts_at: found.row.starts_at, duration_min: found.row.duration_min };
        emailBookingStatus(updated, slot, { byGuest: true });
        queueAdminEmail(found.row.email, "booking", found.row.id, renderEmail({
          subject: `Lemondott időpont: ${formatBudapestDateTime(slot.starts_at)}`,
          greeting: "Szia Johanna!",
        signature: false,
          paragraphs: [`${found.row.name} lemondta az időpontját. Az időpont újra foglalható.`],
          rows: bookingRows(updated, slot),
          action: { label: "Megnyitás az adminban", url: adminUrl() },
        }));
      } else {
        db.prepare("UPDATE registrations SET status = 'cancelled', updated_at = ? WHERE id = ?").run(now, found.row.id);
        const updated = { ...found.row, status: "cancelled" };
        const program = getProgramRow(found.row.program_id);
        emailRegistrationStatus(updated, program, { byGuest: true });
        queueAdminEmail(found.row.email, "registration", found.row.id, renderEmail({
          subject: `Lemondott jelentkezés: ${program.title}`,
          greeting: "Szia Johanna!",
        signature: false,
          paragraphs: [`${found.row.name} lemondta a jelentkezését, ${found.row.seats} hely felszabadult.`],
          rows: registrationRows(updated, program),
          action: { label: "Megnyitás az adminban", url: adminUrl() },
        }));
      }
    });
    processOutbox();
    res.json({ ok: true, message: "A lemondást rögzítettük.", data: { ...manageView(findByToken(req.params.token)), emailNotifications } });
  });

  // --- admin: bejelentkezés -----------------------------------------------------------------------

  app.post("/api/admin/login", rateLimit("login", 10, 15 * 60_000), (req, res) => {
    const username = clean(req.body?.username);
    const password = String(req.body?.password ?? "");
    const user = db.prepare("SELECT * FROM admin_users WHERE username = ? OR lower(email) = lower(?)").get(username, username);
    if (!user || !password || !bcrypt.compareSync(password, user.password_hash)) {
      throw new HttpError(401, "Hibás felhasználónév vagy jelszó.");
    }
    const token = jwt.sign({ sub: user.id, username: user.username, ver: user.token_version }, config.jwtSecret, { algorithm: "HS256", expiresIn: `${config.sessionHours}h` });
    res.cookie(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: config.secureCookies, maxAge: config.sessionHours * 3600_000, path: "/" });
    res.json({ ok: true, data: { user: { username: user.username } } });
  });

  app.get("/api/admin/session", (req, res) => {
    const admin = readAdmin(req);
    res.json({ ok: true, data: admin ? { loggedIn: true, user: { username: admin.username } } : { loggedIn: false } });
  });

  app.post("/api/admin/logout", (_req, res) => {
    res.clearCookie(COOKIE, { path: "/" });
    res.json({ ok: true, data: { loggedOut: true } });
  });

  // Jelszócsere az adminból: a jelenlegi jelszó kell hozzá; minden korábbi munkamenet érvénytelen lesz,
  // a mostani böngésző új munkamenetet kap.
  app.post("/api/admin/password", rateLimit("login", 10, 15 * 60_000), requireAdmin, (req, res) => {
    const current = String(req.body?.currentPassword ?? "");
    const next = String(req.body?.newPassword ?? "");
    const user = db.prepare("SELECT * FROM admin_users WHERE id = ?").get(req.admin.sub);
    if (!user || !bcrypt.compareSync(current, user.password_hash)) {
      throw new HttpError(400, "A jelenlegi jelszó nem megfelelő.", { errors: { currentPassword: "A jelenlegi jelszó nem megfelelő." } });
    }
    if (next.length < 12) throw new HttpError(400, "Az új jelszó legalább 12 karakter legyen.", { errors: { newPassword: "Legalább 12 karakter." } });
    if (next === current) throw new HttpError(400, "Az új jelszó nem egyezhet a régivel.", { errors: { newPassword: "Nem egyezhet a régivel." } });
    db.prepare("UPDATE admin_users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?").run(bcrypt.hashSync(next, 12), user.id);
    const fresh = db.prepare("SELECT * FROM admin_users WHERE id = ?").get(user.id);
    const token = jwt.sign({ sub: fresh.id, username: fresh.username, ver: fresh.token_version }, config.jwtSecret, { algorithm: "HS256", expiresIn: `${config.sessionHours}h` });
    res.cookie(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: config.secureCookies, maxAge: config.sessionHours * 3600_000, path: "/" });
    res.json({ ok: true, message: "A jelszó megváltozott. Minden más eszközön újra be kell jelentkezni." });
  });

  // --- admin: adatok ------------------------------------------------------------------------------------

  app.get("/api/admin/data", requireAdmin, (_req, res) => {
    const bookings = db
      .prepare(
        `SELECT b.id, b.slot_id AS slotId, b.name, b.email, b.phone, b.notes, b.status, b.created_at AS createdAt, b.updated_at AS updatedAt,
                s.starts_at AS startsAt, s.duration_min AS durationMin
         FROM bookings b JOIN slots s ON s.id = b.slot_id ORDER BY s.starts_at DESC`,
      )
      .all()
      .map((r) => ({ ...r }));
    const slots = db
      .prepare(
        `SELECT s.id, s.starts_at AS startsAt, s.duration_min AS durationMin, s.status,
                (SELECT b.id FROM bookings b WHERE b.slot_id = s.id AND b.status IN ('pending', 'confirmed')) AS activeBookingId,
                (SELECT COUNT(*) FROM bookings b WHERE b.slot_id = s.id) AS bookingCount
         FROM slots s ORDER BY s.starts_at`,
      )
      .all()
      .map((r) => ({ ...r }));
    const programs = db.prepare("SELECT * FROM programs ORDER BY created_at DESC").all().map(decorateProgram);
    const registrations = db
      .prepare(
        `SELECT id, program_id AS programId, name, email, phone, seats, notes, status, created_at AS createdAt, updated_at AS updatedAt
         FROM registrations ORDER BY created_at DESC`,
      )
      .all()
      .map((r) => ({ ...r }));
    const inquiries = db
      .prepare(
        `SELECT id, kind, program_id AS programId, program_title AS programTitle, name, email, phone, message, status, created_at AS createdAt
         FROM inquiries ORDER BY created_at DESC`,
      )
      .all()
      .map((r) => ({ ...r }));
    const emails = db
      .prepare(
        `SELECT id, related_type AS relatedType, related_id AS relatedId, recipient, subject, status, attempts, last_error AS lastError,
                created_at AS createdAt, sent_at AS sentAt
         FROM email_outbox ORDER BY id DESC LIMIT 200`,
      )
      .all()
      .map((r) => ({ ...r }));
    res.json({ ok: true, data: { siteContent: getSiteContent(), bookings, slots, programs, registrations, inquiries, emails, mailMode: mailer.mode } });
  });

  // Foglalás státusza
  const ALL_STATUSES = ["pending", "confirmed", "cancelled", "rejected"];
  app.patch("/api/admin/bookings/:id", requireAdmin, (req, res) => {
    const status = clean(req.body?.status);
    if (!ALL_STATUSES.includes(status)) throw new HttpError(400, "Érvénytelen státusz.");
    const result = transaction(db, () => {
      const booking = db.prepare("SELECT b.*, s.starts_at, s.duration_min FROM bookings b JOIN slots s ON s.id = b.slot_id WHERE b.id = ?").get(req.params.id);
      if (!booking) throw new HttpError(404, "A foglalás nem található.");
      if (booking.status === status) return { booking, changed: false };
      try {
        db.prepare("UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?").run(status, nowIso(config.clock), booking.id);
      } catch (error) {
        if (String(error.message).includes("UNIQUE")) {
          throw new HttpError(409, "Erre az időpontra időközben másik aktív foglalás érkezett, ezért ez a foglalás nem állítható vissza.");
        }
        throw error;
      }
      const updated = { ...booking, status };
      emailBookingStatus(updated, booking);
      return { booking: updated, changed: true };
    });
    processOutbox();
    res.json({ ok: true, message: result.changed ? `Állapot: ${STATUS_LABELS[status]}.` : "Nem történt változás.", data: { id: result.booking.id, status } });
  });

  // Időpontok
  app.post("/api/admin/slots", requireAdmin, (req, res) => {
    const date = clean(req.body?.date);
    const times = Array.isArray(req.body?.times) ? req.body.times.map(clean) : [clean(req.body?.time)];
    const durationMin = Number(req.body?.durationMin ?? 60);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError(400, "Kérlek, adj meg egy dátumot.");
    if (!times.length || times.some((t) => !/^\d{2}:\d{2}$/.test(t))) throw new HttpError(400, "Kérlek, adj meg érvényes kezdési időt (óó:pp).");
    if (!Number.isInteger(durationMin) || durationMin < 15 || durationMin > 480) throw new HttpError(400, "Az időtartam 15 és 480 perc között lehet.");
    const created = transaction(db, () =>
      times.map((time) => {
        const startsAt = budapestLocalToUtc(date, time);
        if (!startsAt) throw new HttpError(400, `${date} ${time} nem létező időpont (óraátállítás miatt kimarad). Kérlek, válassz másikat.`);
        if (startsAt <= nowIso(config.clock)) throw new HttpError(400, `${date} ${time} már elmúlt.`);
        const id = newId("sl");
        try {
          db.prepare("INSERT INTO slots (id, starts_at, duration_min, status, created_at) VALUES (?, ?, ?, 'open', ?)").run(id, startsAt, durationMin, nowIso(config.clock));
        } catch (error) {
          if (String(error.message).includes("UNIQUE")) throw new HttpError(409, `${date} ${time} időpont már létezik.`);
          throw error;
        }
        return { id, startsAt, durationMin };
      }),
    );
    res.status(201).json({ ok: true, message: `${created.length} időpont létrehozva.`, data: { slots: created } });
  });

  app.patch("/api/admin/slots/:id", requireAdmin, (req, res) => {
    const status = clean(req.body?.status);
    if (!["open", "closed"].includes(status)) throw new HttpError(400, "Érvénytelen státusz.");
    const info = db.prepare("UPDATE slots SET status = ? WHERE id = ?").run(status, req.params.id);
    if (!info.changes) throw new HttpError(404, "Az időpont nem található.");
    const active = db.prepare("SELECT 1 FROM bookings WHERE slot_id = ? AND status IN ('pending', 'confirmed')").get(req.params.id);
    res.json({
      ok: true,
      message: status === "closed"
        ? active ? "Időpont lezárva. A meglévő foglalás megmaradt — ha le kell mondani, a foglalásnál teheted meg." : "Időpont lezárva, nem foglalható."
        : "Időpont újra megnyitva.",
      data: { id: req.params.id, status },
    });
  });

  app.delete("/api/admin/slots/:id", requireAdmin, (req, res) => {
    const used = db.prepare("SELECT COUNT(*) AS n FROM bookings WHERE slot_id = ?").get(req.params.id).n;
    if (used) throw new HttpError(409, "Ehhez az időponthoz foglalás tartozik, ezért nem törölhető. Zárd le helyette.");
    const info = db.prepare("DELETE FROM slots WHERE id = ?").run(req.params.id);
    if (!info.changes) throw new HttpError(404, "Az időpont nem található.");
    res.json({ ok: true, message: "Időpont törölve.", data: { id: req.params.id } });
  });

  // Programok
  function parseProgram(body, existing) {
    const errors = {};
    const type = clean(body.type);
    if (!(type in PROGRAM_TYPE_LABELS)) errors.type = "Válaszd ki a program típusát.";
    const title = clean(body.title);
    if (title.length < 3 || title.length > 140) errors.title = "A cím 3–140 karakter legyen.";
    const summary = clean(body.summary);
    if (summary.length > 400) errors.summary = "A rövid leírás legfeljebb 400 karakter.";
    const description = clean(body.description);
    if (description.length > 6000) errors.description = "A leírás legfeljebb 6000 karakter.";
    const location = clean(body.location);
    if (location.length > 200) errors.location = "A helyszín legfeljebb 200 karakter.";
    const image = clean(body.image);
    if (image && !/^\/uploads\/[A-Za-z0-9_.-]+$/.test(image)) errors.image = "A képet a feltöltés gombbal add meg.";
    const capacity = Number(body.capacity);
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 200) errors.capacity = "A férőhely 1 és 200 közötti egész szám legyen.";
    const status = clean(body.status) || "draft";
    if (!["draft", "published", "cancelled"].includes(status)) errors.status = "Érvénytelen állapot.";
    const registrationOpen = body.registrationOpen === undefined ? true : Boolean(body.registrationOpen);

    const rawSessions = Array.isArray(body.sessions) ? body.sessions : [];
    const sessions = [];
    rawSessions.forEach((s, i) => {
      const date = clean(s?.date);
      const start = budapestLocalToUtc(date, clean(s?.start));
      const end = budapestLocalToUtc(date, clean(s?.end));
      if (!start || !end) errors[`sessions.${i}`] = `${i + 1}. alkalom: adj meg érvényes dátumot és időt (óraátállításkor kimaradó időpont nem választható).`;
      else if (end <= start) errors[`sessions.${i}`] = `${i + 1}. alkalom: a befejezés legyen a kezdés után.`;
      else sessions.push({ startsAt: start, endsAt: end });
    });
    if (type === "workshop" && sessions.length !== 1 && !Object.keys(errors).some((k) => k.startsWith("sessions."))) errors.sessions = "A mesés workshop egyalkalmas: pontosan egy időpontot adj meg.";
    if (type === "mesemuhely" && sessions.length < 2 && !Object.keys(errors).some((k) => k.startsWith("sessions."))) errors.sessions = "A meseműhely több alkalomból áll: legalább két találkozót adj meg.";
    sessions.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    if (!existing && sessions.length && sessions[0].startsAt <= nowIso(config.clock)) errors.sessions = "Az első alkalom nem lehet a múltban.";
    assertNoErrors(errors);
    return { type, title, summary, description, location, image, capacity, status, registrationOpen, sessions };
  }

  function uniqueSlug(base, excludeId) {
    let slug = base;
    for (let i = 2; db.prepare("SELECT 1 FROM programs WHERE slug = ? AND id != ?").get(slug, excludeId ?? ""); i += 1) slug = `${base}-${i}`;
    return slug;
  }

  function writeSessions(programId, sessions) {
    db.prepare("DELETE FROM program_sessions WHERE program_id = ?").run(programId);
    const insert = db.prepare("INSERT INTO program_sessions (program_id, starts_at, ends_at) VALUES (?, ?, ?)");
    for (const s of sessions) insert.run(programId, s.startsAt, s.endsAt);
  }

  app.post("/api/admin/programs", requireAdmin, (req, res) => {
    const p = parseProgram(req.body || {}, null);
    const program = transaction(db, () => {
      const id = newId("pr");
      const now = nowIso(config.clock);
      db.prepare(
        `INSERT INTO programs (id, slug, type, title, summary, description, image, location, capacity, status, registration_open, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(id, uniqueSlug(slugify(p.title)), p.type, p.title, p.summary, p.description, p.image, p.location, p.capacity, p.status, p.registrationOpen ? 1 : 0, now, now);
      writeSessions(id, p.sessions);
      return decorateProgram(getProgramRow(id));
    });
    res.status(201).json({ ok: true, message: p.status === "published" ? "Program létrehozva és közzétéve." : "Program elmentve piszkozatként.", data: { program } });
  });

  app.put("/api/admin/programs/:id", requireAdmin, (req, res) => {
    const existing = getProgramRow(req.params.id);
    if (!existing) throw new HttpError(404, "A program nem található.");
    const p = parseProgram(req.body || {}, existing);
    const active = db.prepare("SELECT COUNT(*) AS n FROM registrations WHERE program_id = ? AND status IN ('pending', 'confirmed')").get(existing.id).n;
    if (active && p.type !== existing.type) throw new HttpError(409, "A program típusa nem módosítható, amíg aktív jelentkezők vannak.");
    const before = JSON.stringify(sessionsFor(existing.id).map((s) => [s.startsAt, s.endsAt]));
    const program = transaction(db, () => {
      try {
        db.prepare(
          `UPDATE programs SET type = ?, title = ?, summary = ?, description = ?, image = ?, location = ?, capacity = ?, status = ?, registration_open = ?, updated_at = ?
           WHERE id = ?`,
        ).run(p.type, p.title, p.summary, p.description, p.image, p.location, p.capacity, p.status, p.registrationOpen ? 1 : 0, nowIso(config.clock), existing.id);
      } catch (error) {
        if (String(error.message).includes("CAPACITY_BELOW_REGISTERED")) {
          throw new HttpError(409, `A férőhely nem lehet kevesebb a már lefoglalt helyeknél (${seatsTaken(existing.id)}).`, { errors: { capacity: "Kevesebb, mint a lefoglalt helyek száma." } });
        }
        throw error;
      }
      writeSessions(existing.id, p.sessions);
      return decorateProgram(getProgramRow(existing.id));
    });
    const after = JSON.stringify(program.sessions.map((s) => [s.startsAt, s.endsAt]));
    const warnings = [];
    if (active && before !== after) warnings.push(`Az időpontok megváltoztak, és ${active} aktív jelentkező érintett — kérlek, értesítsd őket.`);
    if (active && p.status === "cancelled" && existing.status !== "cancelled") warnings.push(`A program elmarad: ${active} aktív jelentkezőt értesíts, és állítsd a jelentkezésüket „Lemondva" állapotra.`);
    res.json({ ok: true, message: ["Program mentve.", ...warnings].join(" "), data: { program, warnings } });
  });

  app.delete("/api/admin/programs/:id", requireAdmin, (req, res) => {
    const program = getProgramRow(req.params.id);
    if (!program) throw new HttpError(404, "A program nem található.");
    const regs = db.prepare("SELECT COUNT(*) AS n FROM registrations WHERE program_id = ?").get(program.id).n;
    if (regs) throw new HttpError(409, `A programhoz ${regs} jelentkezés tartozik, ezért nem törölhető. Állítsd „Elmarad" állapotra, így az adatok megmaradnak.`);
    db.prepare("DELETE FROM programs WHERE id = ?").run(program.id);
    res.json({ ok: true, message: "Program törölve.", data: { id: program.id } });
  });

  // Jelentkezés státusza
  app.patch("/api/admin/registrations/:id", requireAdmin, (req, res) => {
    const status = clean(req.body?.status);
    if (!ALL_STATUSES.includes(status)) throw new HttpError(400, "Érvénytelen státusz.");
    const result = transaction(db, () => {
      const reg = db.prepare("SELECT * FROM registrations WHERE id = ?").get(req.params.id);
      if (!reg) throw new HttpError(404, "A jelentkezés nem található.");
      if (reg.status === status) return { reg, changed: false };
      try {
        db.prepare("UPDATE registrations SET status = ?, updated_at = ? WHERE id = ?").run(status, nowIso(config.clock), reg.id);
      } catch (error) {
        const msg = String(error.message);
        if (msg.includes("CAPACITY_EXCEEDED")) throw new HttpError(409, "Nincs elég szabad hely a jelentkezés visszaállításához.");
        if (msg.includes("UNIQUE")) throw new HttpError(409, "Ezzel az e-mail-címmel már van másik aktív jelentkezés erre a programra.");
        throw error;
      }
      const updated = { ...reg, status };
      emailRegistrationStatus(updated, getProgramRow(reg.program_id));
      return { reg: updated, changed: true };
    });
    processOutbox();
    res.json({ ok: true, message: result.changed ? `Állapot: ${STATUS_LABELS[status]}.` : "Nem történt változás.", data: { id: result.reg.id, status } });
  });

  app.patch("/api/admin/inquiries/:id", requireAdmin, (req, res) => {
    const status = clean(req.body?.status);
    if (!["new", "handled"].includes(status)) throw new HttpError(400, "Érvénytelen státusz.");
    const info = db.prepare("UPDATE inquiries SET status = ? WHERE id = ?").run(status, req.params.id);
    if (!info.changes) throw new HttpError(404, "Az érdeklődés nem található.");
    res.json({ ok: true, data: { id: req.params.id, status } });
  });

  // Oldaltartalom
  app.put("/api/admin/site-content", requireAdmin, (req, res) => {
    const body = req.body || {};
    const errors = {};
    const updates = {};
    for (const [key, max] of Object.entries(SITE_CONTENT_LIMITS)) {
      if (!(key in body)) continue;
      const value = clean(body[key]);
      if (value.length > max) errors[key] = `Legfeljebb ${max} karakter.`;
      updates[key] = value;
    }
    for (const key of Object.keys(body)) if (!(key in SITE_CONTENT_LIMITS)) errors[key] = "Ismeretlen mező.";
    for (const key of ["heroTitle", "heroSubtitle", "introTitle"]) if (key in updates && !updates[key]) errors[key] = "Nem lehet üres.";
    if (updates.contactEmail !== undefined && !EMAIL_RE.test(updates.contactEmail)) errors.contactEmail = "Érvényes e-mail-címet adj meg.";
    if (updates.contactPhone && !PHONE_RE.test(updates.contactPhone)) errors.contactPhone = "Érvénytelen telefonszám.";
    if (updates.heroImage && !/^\/uploads\/[A-Za-z0-9_.-]+$/.test(updates.heroImage)) errors.heroImage = "A képet a feltöltés gombbal add meg.";
    assertNoErrors(errors);
    transaction(db, () => {
      const upsert = db.prepare("INSERT INTO site_content (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at");
      for (const [k, v] of Object.entries(updates)) upsert.run(k, v, nowIso(config.clock));
    });
    res.json({ ok: true, message: "Tartalom mentve, a nyilvános oldalon is megjelenik.", data: { siteContent: getSiteContent() } });
  });

  // Képfeltöltés (nyers bináris törzs, a fájltípust a tartalom alapján ellenőrizzük)
  app.post(
    "/api/admin/uploads",
    requireAdmin,
    express.raw({ type: () => true, limit: MAX_UPLOAD_BYTES }),
    (req, res) => {
      const buf = req.body;
      if (!Buffer.isBuffer(buf) || buf.length < 12) throw new HttpError(400, "Nem érkezett képfájl.");
      const type = IMAGE_TYPES.find((t) => t.test(buf));
      if (!type) throw new HttpError(415, "Csak JPG, PNG vagy WebP kép tölthető fel.");
      const name = `${crypto.randomUUID()}.${type.ext}`;
      fs.writeFileSync(path.join(uploadDir, name), buf);
      res.status(201).json({ ok: true, message: "Kép feltöltve.", data: { url: `/uploads/${name}`, bytes: buf.length } });
    },
  );

  app.post("/api/admin/emails/:id/retry", requireAdmin, async (req, res) => {
    const info = db.prepare("UPDATE email_outbox SET status = 'pending' WHERE id = ? AND status = 'failed'").run(Number(req.params.id));
    if (!info.changes) throw new HttpError(404, "A levél nem található vagy nem hibás állapotú.");
    await processOutbox();
    const row = db.prepare("SELECT status, last_error AS lastError FROM email_outbox WHERE id = ?").get(Number(req.params.id));
    res.json({ ok: row.status === "sent", message: row.status === "sent" ? "A levél elküldve." : `A küldés ismét sikertelen: ${row.lastError}`, data: { ...row } });
  });

  // --- statikus frontend (production) ------------------------------------------------------------------------

  // Ismeretlen API-útvonal: JSON 404, sosem a weboldal HTML-je.
  app.use("/api", (_req, _res, next) => next(new HttpError(404, "Ismeretlen végpont.")));

  if (config.distDir && fs.existsSync(path.join(config.distDir, "index.html"))) {
    const base = config.basePath === "/" ? "" : config.basePath;
    const indexFile = path.join(config.distDir, "index.html");
    // A buildben relatív hivatkozások vannak (vite base: "./"), így bármely alapútvonal alatt működik.
    app.use(base || "/", express.static(config.distDir, { index: false, maxAge: "1h", setHeaders: (res, file) => {
      if (file.includes(`${path.sep}assets${path.sep}`)) res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    } }));
    const sendIndex = (_req, res) => {
      res.setHeader("Cache-Control", "no-cache");
      res.sendFile(indexFile);
    };
    app.get(base ? [`${base}`, `${base}/`] : "/", sendIndex);
    if (base) app.get("/", (_req, res) => res.redirect(`${base}/`));
    // Régi GitHub Pages-es hivatkozások (/mesegombolyag/…) átirányítása, ha a gyökérről szolgálunk ki.
    if (!base) app.get(["/mesegombolyag", "/mesegombolyag/"], (_req, res) => res.redirect(301, "/"));
  }

  // --- hibakezelés -------------------------------------------------------------------------------------------------

  // eslint-disable-next-line no-unused-vars
  app.use((error, _req, res, _next) => {
    if (error?.type === "entity.parse.failed") return res.status(400).json({ ok: false, message: "Hibás formátumú kérés." });
    if (error?.type === "entity.too.large") return res.status(413).json({ ok: false, message: "A fájl túl nagy (legfeljebb 5 MB)." });
    if (error instanceof HttpError) return res.status(error.status).json({ ok: false, message: error.message, ...error.extra });
    if (error?.status === 404) return res.status(404).json({ ok: false, message: "Nem található." });
    console.error(error);
    res.status(500).json({ ok: false, message: "Váratlan szerverhiba történt. Kérlek, próbáld újra később." });
  });

  // Első indításkor admin felhasználó a környezeti változókból
  let adminBootstrapped = false;
  if (config.bootstrapAdmin) {
    const count = db.prepare("SELECT COUNT(*) AS n FROM admin_users").get().n;
    const { username, email, password, passwordHash } = config.bootstrapAdmin;
    adminBootstrapped = !count && Boolean(username && (password || passwordHash));
    if (adminBootstrapped) {
      db.prepare("INSERT INTO admin_users (username, email, password_hash, created_at) VALUES (?, ?, ?, ?)").run(
        username,
        email || null,
        passwordHash || bcrypt.hashSync(password, 12),
        nowIso(config.clock),
      );
    }
  }

  // Induláskor a korábban (pl. újraindítás miatt) függőben maradt levelek kiküldése.
  if (config.processOutboxOnStart) processOutbox();

  return { app, db, processOutbox, flushEmails: () => processOutbox(), mailer, budapestParts, adminBootstrapped };
}

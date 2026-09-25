import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "..", "data");
fs.mkdirSync(dataDir, { recursive: true });

const app = express();
const PORT = Number(process.env.PORT || 3001);
const DATA_PATH = path.join(dataDir, "mesegombolyag-data.json");
const JWT_SECRET = process.env.JWT_SECRET || "mesegombolyag-local-dev-secret";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "mesegombolyag@gmail.com";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "";

const defaultServices = [
  {
    id: "individual-session",
    name: "Személyes mesealapú beszélgetés",
    duration: 60,
    description: "Bizalommal teli, személyre szabott beszélgetés, ahol a mese és a megküzdési minták segítenek új nézőpontot találni.",
    price: 24000,
    active: true,
  },
  {
    id: "mother-child-story",
    name: "Anyák és gyermekek közös meseidő",
    duration: 45,
    description: "Közös, nyugodt alkalom, ahol a játék, a figyelem és a történet összekapcsolja a családi ritmust.",
    price: 18000,
    active: true,
  },
  {
    id: "group-circle",
    name: "Csoportos mese- és alkotó kör",
    duration: 90,
    description: "Közösségi alkalom, ahol a történet, a képzelet és a közös alkotás új lendületet ad a megküzdéshez.",
    price: 8500,
    active: true,
  },
];

const defaultAvailability = [
  { date: "2026-10-04", slots: ["10:00", "11:30", "14:00"] },
  { date: "2026-10-11", slots: ["09:30", "11:00", "15:00"] },
  { date: "2026-10-18", slots: ["10:30", "12:00", "17:30"] },
  { date: "2026-10-25", slots: ["11:00", "13:00", "18:30"] },
];

const defaultGroups = [
  {
    id: "mese-kor-szulesi",
    title: "Kis mese- és játék kör",
    description: "Nyugodt, szeretetteljes közösségi alkalom kisgyermekes és szülői részvétellel, ahol a történet és a játék segít megnyugodni.",
    image: "",
    date: "2026-10-11",
    time: "10:00-11:30",
    location: "Mesegombolyag műhely",
    capacity: 8,
    ageMin: 4,
    ageMax: 8,
    price: 6500,
    active: true,
  },
  {
    id: "felnott-mese-kor",
    title: "Felnőtt mese- és visszatekintő kör",
    description: "A történetekben rejlő szimbólumok és minták segítségével nyugodt, mélyebb beszélgetésben tudunk a nehéz pillanatokra is ránézni.",
    image: "",
    date: "2026-10-18",
    time: "18:30-20:00",
    location: "Kerti udvar",
    capacity: 12,
    ageMin: 18,
    ageMax: 99,
    price: 7000,
    active: true,
  },
];

const defaultEvents = [
  {
    id: "kerti-meseeste",
    slug: "kerti-meseeste",
    title: "Kerti meseeste",
    shortDescription: "Egy nyugodt, közösségi est, ahol a mese és a természet együtt ad egy gyógyító hangulatú alkalmat.",
    description: "A kerti meseeste egy olyan est, ahol a népmesék nyugtató ritmusa, a természet hangjai és a közös figyelem együtt teremtenek biztonságos, szép pillanatokat.",
    image: "",
    date: "2026-10-25",
    startTime: "18:30",
    endTime: "20:00",
    location: "Kerti udvar",
    price: 4500,
    capacity: 20,
    status: "published",
    registrationDeadline: "2026-10-20",
  },
  {
    id: "dolgozati-folymat",
    slug: "dolgozati-folyamat",
    title: "Személyes úton járó folyamat",
    shortDescription: "Kiküszöbölve a sietést: egy személyre szabott megküzdési és nyugvó folyamat kezdete.",
    description: "Ez az alkalom a megelőző beszélgetésre, a saját történet feltérképezésére és egy nyugodt, személyre szabott útra épül.",
    image: "",
    date: "2026-11-02",
    startTime: "15:30",
    endTime: "17:00",
    location: "Mesegombolyag stúdió",
    price: 32000,
    capacity: 6,
    status: "published",
    registrationDeadline: "2026-10-27",
  },
];

const defaultSiteContent = {
  heroTitle: "A történetek néha ott találnak meg, ahol a szavaink elfogynak.",
  heroSubtitle: "A mese és a személyes figyelem helye.",
  heroDescription: "A mese és a személyes figyelem helye: itt a nyugalom, a kreativitás és a bizalom adhat új irányt a nehéz pillanatokhoz.",
  introTitle: "Minden élethelyzetnek megvan a maga története.",
  introText: "A történetek nemcsak emlékek, hanem útmutatók is. Ilyen módon a mese segíthet új nézőpontból látni a nehéz helyzeteket, és több nyugalommal, figyelemmel és önbizalommal lépni tovább.",
  contactEmail: "mesegombolyag@gmail.com",
  contactPhone: "",
  location: "",
};

const DEFAULT_STATE = {
  siteContent: defaultSiteContent,
  bookings: [],
  groupRegistrations: [],
  eventRegistrations: [],
  adminUsers: ADMIN_USERNAME && ADMIN_PASSWORD && ADMIN_PASSWORD_HASH ? [{ username: ADMIN_USERNAME, email: ADMIN_EMAIL, passwordHash: ADMIN_PASSWORD_HASH }] : [],
  emailLogs: [],
};

function readState() {
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(DEFAULT_STATE, null, 2), "utf8");
    return structuredClone(DEFAULT_STATE);
  }

  try {
    const raw = fs.readFileSync(DATA_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return {
      siteContent: parsed.siteContent || defaultSiteContent,
      bookings: parsed.bookings || [],
      groupRegistrations: parsed.groupRegistrations || [],
      eventRegistrations: parsed.eventRegistrations || [],
      adminUsers: parsed.adminUsers || (ADMIN_USERNAME && ADMIN_PASSWORD && ADMIN_PASSWORD_HASH ? [{ username: ADMIN_USERNAME, email: ADMIN_EMAIL, passwordHash: ADMIN_PASSWORD_HASH }] : []),
      emailLogs: parsed.emailLogs || [],
    };
  } catch {
    fs.writeFileSync(DATA_PATH, JSON.stringify(DEFAULT_STATE, null, 2), "utf8");
    return structuredClone(DEFAULT_STATE);
  }
}

const appState = readState();

function saveState() {
  fs.writeFileSync(DATA_PATH, JSON.stringify(appState, null, 2), "utf8");
}

function readSiteContent() { return appState.siteContent ?? defaultSiteContent; }
function writeSiteContent(content) { appState.siteContent = content; saveState(); }
function getAllBookings() { return [...appState.bookings].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)); }
function getAllGroupRegistrations() { return [...appState.groupRegistrations].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)); }
function getAllEventRegistrations() { return [...appState.eventRegistrations].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)); }

function getAvailableSlots(date, serviceId) {
  const day = defaultAvailability.find((entry) => entry.date === date);
  if (!day) return [];
  const booked = appState.bookings.filter((entry) => entry.date === date && entry.serviceId === serviceId && entry.status !== "cancelled").map((entry) => entry.slot);
  return day.slots.filter((slot) => !booked.includes(slot));
}

function getGroupAttendanceCount(groupId) {
  return appState.groupRegistrations.filter((entry) => entry.groupId === groupId && entry.status !== "cancelled").length;
}

function getEventAttendanceCount(eventId) {
  return appState.eventRegistrations.filter((entry) => entry.eventId === eventId).reduce((sum, entry) => sum + Number(entry.guests || 0), 0);
}

function signAdminToken(user) {
  return jwt.sign({ username: user.username, email: user.email }, JWT_SECRET, { expiresIn: "8h" });
}

function verifyAdminToken(req) {
  const token = req.cookies?.mesegombolyag_admin || req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}

function sendEmail(recipient, subject, body) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromEmail = process.env.FROM_EMAIL || ADMIN_EMAIL;

  if (!host || !user || !pass) {
    return Promise.resolve({ ok: false, message: "SMTP is not configured; email delivery is disabled in local mode." });
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: Number(port) === 465,
    auth: { user, pass },
  });

  return transporter.sendMail({ from: fromEmail, to: recipient, subject, text: body });
}

function logEmail(recipient, subject, status, errorMessage = null) {
  appState.emailLogs.unshift({ recipient, subject, status, errorMessage, createdAt: new Date().toISOString() });
  saveState();
}

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

app.get("/api/health", (_, res) => res.json({ ok: true, data: { status: "ok" } }));

app.get("/api/public-data", (_, res) => {
  res.json({ ok: true, data: { siteContent: readSiteContent(), services: defaultServices, availability: defaultAvailability, groups: defaultGroups, events: defaultEvents, bookings: getAllBookings(), groupRegistrations: getAllGroupRegistrations(), eventRegistrations: getAllEventRegistrations() } });
});

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body || {};
  const normalizedUser = String(username || "").trim();
  const normalizedPassword = String(password || "");
  const user = appState.adminUsers.find((entry) => entry.username === normalizedUser || entry.email === normalizedUser);

  if (!user || !bcrypt.compareSync(normalizedPassword, user.passwordHash)) {
    return res.status(401).json({ ok: false, message: "Hibás felhasználónév vagy jelszó." });
  }

  const token = signAdminToken(user);
  res.cookie("mesegombolyag_admin", token, { httpOnly: true, sameSite: "lax", secure: false, maxAge: 8 * 60 * 60 * 1000 });
  return res.json({ ok: true, data: { user: { username: user.username, email: user.email } } });
});

app.get("/api/admin/session", (req, res) => {
  const payload = verifyAdminToken(req);
  if (!payload) return res.json({ ok: true, data: { loggedIn: false } });
  return res.json({ ok: true, data: { loggedIn: true, user: { username: payload.username, email: payload.email } } });
});

app.post("/api/admin/logout", (req, res) => {
  res.clearCookie("mesegombolyag_admin");
  res.json({ ok: true, data: { loggedOut: true } });
});

app.get("/api/admin/data", (req, res) => {
  const payload = verifyAdminToken(req);
  if (!payload) return res.status(401).json({ ok: false, message: "Nincs jogosultságod az admin felülethez." });
  return res.json({ ok: true, data: { siteContent: readSiteContent(), groups: defaultGroups, events: defaultEvents, bookings: getAllBookings(), groupRegistrations: getAllGroupRegistrations(), eventRegistrations: getAllEventRegistrations() } });
});

app.patch("/api/admin/site-content", (req, res) => {
  const payload = verifyAdminToken(req);
  if (!payload) return res.status(401).json({ ok: false, message: "Nincs jogosultságod az admin felülethez." });
  const content = { ...readSiteContent(), ...req.body };
  writeSiteContent(content);
  return res.json({ ok: true, data: { siteContent: content } });
});

app.post("/api/bookings", (req, res) => {
  const { serviceId, date, slot, name, email, phone, childName, notes } = req.body || {};
  if (!serviceId || !date || !slot || !name || !email || !phone) {
    return res.status(400).json({ ok: false, message: "Minden kötelező mezőt kitöltöttél?" });
  }

  const available = getAvailableSlots(date, serviceId);
  if (!available.includes(slot)) {
    return res.status(409).json({ ok: false, message: "Ez az időpont már nem elérhető." });
  }

  const booking = { id: `bk-${Date.now()}`, serviceId, date, slot, name, email, phone, childName: childName || null, notes: notes || null, status: "pending", createdAt: new Date().toISOString() };
  appState.bookings.unshift(booking);
  saveState();

  const subject = "Foglalás érkezett – ellenőrzésre vár";
  const body = `Kedves ${name}!\n\nA foglalásod rögzítésre került. A csapat hamarosan visszaigazolja az időpontot.\n\nIdőpont: ${date} ${slot}\n\nÜdvözlettel:\nMesegombolyag`;
  sendEmail(email, subject, body).then(({ ok, message }) => {
    if (ok) logEmail(email, subject, "sent", null); else logEmail(email, subject, "failed", message || "Unknown SMTP error");
  }).catch((error) => logEmail(email, subject, "failed", error?.message || String(error)));

  return res.json({ ok: true, message: "A foglalás rögzítve. Hamarosan visszajelzünk.", data: booking });
});

app.post("/api/group-registrations", (req, res) => {
  const { groupId, name, email, phone, preferredDate, preferredTime, notes } = req.body || {};
  if (!groupId || !name || !email || !phone) return res.status(400).json({ ok: false, message: "A jelentkezéshez minden kötelező mező kitöltése szükséges." });

  const group = defaultGroups.find((item) => item.id === groupId);
  if (!group) return res.status(404).json({ ok: false, message: "A kiválasztott csoport nem található." });
  if (getGroupAttendanceCount(groupId) >= group.capacity) return res.status(409).json({ ok: false, message: "A csoport már betelt." });

  const registration = { id: `gr-${Date.now()}`, groupId, name, email, phone, preferredDate: preferredDate || group.date, preferredTime: preferredTime || group.time, notes: notes || null, status: "pending", createdAt: new Date().toISOString() };
  appState.groupRegistrations.unshift(registration);
  saveState();
  return res.json({ ok: true, message: "A csoportos jelentkezés rögzítve.", data: registration });
});

app.post("/api/event-registrations", (req, res) => {
  const { eventId, name, email, phone, preferredDate, preferredTime, guests, notes } = req.body || {};
  if (!eventId || !name || !email || !phone || !guests) return res.status(400).json({ ok: false, message: "A jelentkezéshez minden kötelező mezőt ki kell tölteni." });

  const event = defaultEvents.find((item) => item.id === eventId);
  if (!event) return res.status(404).json({ ok: false, message: "A kiválasztott esemény nem található." });
  if (getEventAttendanceCount(eventId) + Number(guests) > event.capacity) return res.status(409).json({ ok: false, message: "Az eseményre már nem maradt elég szabad hely." });

  const registration = { id: `er-${Date.now()}`, eventId, name, email, phone, preferredDate: preferredDate || event.date, preferredTime: preferredTime || event.startTime, guests: Number(guests), notes: notes || null, status: "pending", createdAt: new Date().toISOString() };
  appState.eventRegistrations.unshift(registration);
  saveState();
  return res.json({ ok: true, message: "Az eseményre történő jelentkezés rögzítve.", data: registration });
});

app.patch("/api/admin/bookings/:id/status", (req, res) => {
  const payload = verifyAdminToken(req);
  if (!payload) return res.status(401).json({ ok: false, message: "Nincs jogosultságod az admin felülethez." });
  const { id } = req.params;
  const { status } = req.body || {};
  const row = appState.bookings.find((entry) => entry.id === id);
  if (!row) return res.status(404).json({ ok: false, message: "A foglalás nem található." });

  appState.bookings = appState.bookings.map((entry) => (entry.id === id ? { ...entry, status } : entry));
  saveState();
  const nextStatus = status === "confirmed" ? "confirmed" : "cancelled";
  const subject = nextStatus === "confirmed" ? "Foglalásod jóváhagyva" : "Foglalásod elutasítva";
  const text = nextStatus === "confirmed" ? `Kedves ${row.name}!\n\nA foglalásodat jóváhagytuk.\nIdőpont: ${row.date} ${row.slot}\n\nÜdvözlettel:\nMesegombolyag` : `Kedves ${row.name}!\n\nA foglalásodat jelenleg nem tudjuk elfogadni.\n\nÜdvözlettel:\nMesegombolyag`;

  sendEmail(row.email, subject, text).then(({ ok, message }) => {
    if (ok) logEmail(row.email, subject, "sent", null); else logEmail(row.email, subject, "failed", message || "Unknown SMTP error");
  }).catch((error) => logEmail(row.email, subject, "failed", error?.message || String(error)));

  return res.json({ ok: true, data: { id, status } });
});

app.patch("/api/admin/group-registrations/:id/status", (req, res) => {
  const payload = verifyAdminToken(req);
  if (!payload) return res.status(401).json({ ok: false, message: "Nincs jogosultságod az admin felülethez." });
  const { id } = req.params;
  const { status } = req.body || {};
  const row = appState.groupRegistrations.find((entry) => entry.id === id);
  if (!row) return res.status(404).json({ ok: false, message: "A jelentkezés nem található." });
  appState.groupRegistrations = appState.groupRegistrations.map((entry) => (entry.id === id ? { ...entry, status } : entry));
  saveState();
  return res.json({ ok: true, data: { id, status } });
});

app.patch("/api/admin/event-registrations/:id/status", (req, res) => {
  const payload = verifyAdminToken(req);
  if (!payload) return res.status(401).json({ ok: false, message: "Nincs jogosultságod az admin felülethez." });
  const { id } = req.params;
  const { status } = req.body || {};
  const row = appState.eventRegistrations.find((entry) => entry.id === id);
  if (!row) return res.status(404).json({ ok: false, message: "A jelentkezés nem található." });
  appState.eventRegistrations = appState.eventRegistrations.map((entry) => (entry.id === id ? { ...entry, status } : entry));
  saveState();
  return res.json({ ok: true, data: { id, status } });
});

app.listen(PORT, () => {
  console.log(`Mesegombolyag backend listening on http://localhost:${PORT}`);
});

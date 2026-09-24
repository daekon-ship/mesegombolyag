export type Service = {
  id: string;
  name: string;
  duration: number;
  description: string;
  price?: number;
  active: boolean;
};

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export type BookingRecord = {
  id: string;
  serviceId: string;
  date: string;
  slot: string;
  name: string;
  email: string;
  phone: string;
  childName?: string;
  notes?: string;
  status: BookingStatus;
  createdAt: string;
};

export type GroupProgram = {
  id: string;
  title: string;
  description: string;
  image: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  ageMin?: number;
  ageMax?: number;
  price?: number;
  active: boolean;
};

export type EventRecord = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  image: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  price?: number;
  capacity: number;
  status: "draft" | "published" | "full" | "cancelled" | "completed" | "archived";
  registrationDeadline: string;
};

export type RegistrationBase = {
  id: string;
  name: string;
  email: string;
  phone: string;
  preferredDate?: string;
  preferredTime?: string;
  notes?: string;
  createdAt: string;
};

export type GroupRegistration = RegistrationBase & {
  groupId: string;
  status: "pending" | "approved" | "cancelled";
};

export type EventRegistration = RegistrationBase & {
  eventId: string;
  guests: number;
};

export type SiteContent = {
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  introTitle: string;
  introText: string;
  contactEmail: string;
  contactPhone: string;
  location: string;
};

export const siteContent: SiteContent = {
  heroTitle: "A történetek néha ott találnak meg, ahol a szavaink elfogynak.",
  heroSubtitle: "Meseterápiával a lelki immunrendszerért.",
  heroDescription:
    "Egyéni folyamatok és személyes workshopok Szegeden, ahol a népmesék, a kreativitás és a közös figyelem segítenek közelebb kerülni belső erőforrásainkhoz.",
  introTitle: "Minden élethelyzetnek megvan a maga története.",
  introText:
    "A népmesék szimbólumai és megküzdési mintái évszázados tudást hordoznak. Segítségükkel más nézőpontból tekinthetünk saját élethelyzeteinkre.",
  contactEmail: "hello@mesegombolyag.hu",
  contactPhone: "+36 20 123 4567",
  location: "Szeged",
};

export const services: Service[] = [
  {
    id: "meseterapia",
    name: "Meseterápia egyéni alkalom",
    duration: 60,
    description: "Személyre szabott, nyugodt és bizalmas beszélgetés és meseélmény.",
    price: 18000,
    active: true,
  },
  {
    id: "csalad", 
    name: "Családi mesealkalom",
    duration: 90,
    description: "Közös, támogató és érzékeny légkörű családi program.",
    price: 22000,
    active: true,
  },
  {
    id: "workshop",
    name: "Személyes workshop",
    duration: 120,
    description: "Kreatív, önismereti és megküzdési workshop kis csoportban.",
    price: 26000,
    active: true,
  },
];

export const availability = [
  { date: "2026-09-25", slots: ["09:00", "10:30", "12:00", "15:00"] },
  { date: "2026-09-27", slots: ["09:30", "11:00", "13:30", "16:00"] },
  { date: "2026-09-29", slots: ["10:00", "12:30", "14:00", "17:00"] },
  { date: "2026-10-02", slots: ["08:30", "10:00", "13:00", "15:30"] },
  { date: "2026-10-06", slots: ["09:00", "11:00", "14:00", "16:30"] },
];

export const bookings: BookingRecord[] = [
  {
    id: "bk-1001",
    serviceId: "meseterapia",
    date: "2026-09-25",
    slot: "10:30",
    name: "Nagy Anna",
    email: "anna@example.com",
    phone: "+36 20 555 1111",
    childName: "Luca",
    notes: "Első alkalom, nyugodt hangulatot keresünk.",
    status: "confirmed",
    createdAt: "2026-09-18T14:20:00.000Z",
  },
  {
    id: "bk-1002",
    serviceId: "workshop",
    date: "2026-09-29",
    slot: "14:00",
    name: "Kovács Péter",
    email: "peter@example.com",
    phone: "+36 30 123 4567",
    notes: "Kis csoportos workshopra jelentkezett.",
    status: "pending",
    createdAt: "2026-09-19T09:40:00.000Z",
  },
];

export const groups: GroupProgram[] = [
  {
    id: "g-1",
    title: "A mese és a bátorság",
    description: "Egyéni és csoportos, bátorság-erősítő mesejátékok.",
    image: "https://images.unsplash.com/photo-1517486808906-6ca8b3a04846?auto=format&fit=crop&w=1200&q=80",
    date: "2026-09-30",
    time: "17:00",
    location: "Szeged, Központi műhely",
    capacity: 12,
    ageMin: 6,
    ageMax: 12,
    price: 6000,
    active: true,
  },
  {
    id: "g-2",
    title: "Belső gyermek foglalkozás",
    description: "Nyitott, megnyugtató műhely, ahol a mese és a kreativitás találkozik.",
    image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1200&q=80",
    date: "2026-10-05",
    time: "16:30",
    location: "Szeged, József Attila utca 12.",
    capacity: 10,
    ageMin: 10,
    ageMax: 16,
    price: 7000,
    active: true,
  },
];

export const events: EventRecord[] = [
  {
    id: "ev-1",
    slug: "meses-csoport-szeptember",
    title: "Mesés csoportos alkalom – szeptember",
    shortDescription: "Közös mesélés, játék és belső erőforrások felfedezése.",
    description:
      "Egy nyugodt, gondoskodó környezetben játsszunk, meséljünk és figyeljünk egymásra. A foglalkozás célja, hogy a résztvevők jobban érezzék a közös figyelem és a mese megnyugtató erejét.",
    image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1200&q=80",
    date: "2026-10-08",
    startTime: "18:00",
    endTime: "19:30",
    location: "Szeged, Meseház",
    price: 5500,
    capacity: 20,
    status: "published",
    registrationDeadline: "2026-10-05T18:00:00.000Z",
  },
  {
    id: "ev-2",
    slug: "egeszseges-fokozatos-ujrakezdes",
    title: "Egészséges, fokozatos újrakezdés",
    shortDescription: "A változás nem mindig robbanás; sokszor a lassú, történetközeli lépcsőfokok vezetik előre.",
    description:
      "Ez a program különösen azoknak szól, akik új irányba szeretnének lépni, de szeretnék, hogy a változás ne legyen túlterhelő. A mese és a közös reflexió segít megérteni a lépés lépésről való szépségét.",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    date: "2026-10-15",
    startTime: "17:30",
    endTime: "19:00",
    location: "Szeged, Tiszti Közösségi Ház",
    price: 6500,
    capacity: 15,
    status: "published",
    registrationDeadline: "2026-10-12T20:00:00.000Z",
  },
];

export const groupRegistrations: GroupRegistration[] = [
  {
    id: "gr-1",
    groupId: "g-1",
    name: "Mészáros Dóra",
    email: "dora@example.com",
    phone: "+36 20 999 1244",
    preferredDate: "2026-09-30",
    preferredTime: "17:00",
    notes: "A program szüleivel szeretne eljönni.",
    status: "approved",
    createdAt: "2026-09-16T12:40:00.000Z",
  },
];

export const eventRegistrations: EventRegistration[] = [
  {
    id: "er-1",
    eventId: "ev-1",
    name: "Farkas Márta",
    email: "marta@example.com",
    phone: "+36 20 777 9077",
    preferredDate: "2026-10-08",
    preferredTime: "18:00",
    guests: 2,
    notes: "Két főre jelentkezünk.",
    createdAt: "2026-09-20T09:00:00.000Z",
  },
];

export const adminCredentials = {
  username: import.meta.env.VITE_ADMIN_USERNAME || "mesegombolyag",
  email: import.meta.env.VITE_ADMIN_EMAIL || "admin@mesegombolyag.hu",
  password: import.meta.env.VITE_ADMIN_PASSWORD || "mesegombolyag-demo",
};

export function getAvailableSlots(date: string, serviceId: string): string[] {
  const day = availability.find((entry) => entry.date === date);
  if (!day) return [];

  const booked = bookings
    .filter((entry) => entry.date === date && entry.serviceId === serviceId && entry.status !== "cancelled")
    .map((entry) => entry.slot);

  return day.slots.filter((slot) => !booked.includes(slot));
}

export function getGroupAttendanceCount(groupId: string): number {
  return groupRegistrations.filter((entry) => entry.groupId === groupId && entry.status !== "cancelled").length;
}

export function getEventAttendanceCount(eventId: string): number {
  return eventRegistrations.filter((entry) => entry.eventId === eventId).reduce((sum, entry) => sum + entry.guests, 0);
}

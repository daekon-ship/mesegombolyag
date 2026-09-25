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
  status?: "pending" | "approved" | "cancelled";
};

import heroPortrait from "../assets/photos/hero-portrait.jpg";
import ritualFloralArrangement from "../assets/photos/ritual-floral-arrangement.jpg";
import groupEveningCircle from "../assets/photos/group-evening-circle.jpg";

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
  heroSubtitle: "A mese és a személyes figyelem helye.",
  heroDescription:
    "A mese és a személyes figyelem helye: itt a nyugalom, a kreativitás és a bizalom adhat új irányt a nehéz pillanatokhoz.",
  introTitle: "Minden élethelyzetnek megvan a maga története.",
  introText:
    "A történetek nemcsak emlékek, hanem útmutatók is. Ilyen módon a mese segíthet új nézőpontból látni a nehéz helyzeteket, és több nyugalommal, figyelemmel és önbizalommal lépni tovább.",
  contactEmail: "mesegombolyag@gmail.com",
  contactPhone: "",
  location: "",
};

export const services: Service[] = [
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

export const availability: { date: string; slots: string[] }[] = [
  { date: "2026-10-04", slots: ["10:00", "11:30", "14:00"] },
  { date: "2026-10-11", slots: ["09:30", "11:00", "15:00"] },
  { date: "2026-10-18", slots: ["10:30", "12:00", "17:30"] },
  { date: "2026-10-25", slots: ["11:00", "13:00", "18:30"] },
];

export const bookings: BookingRecord[] = [];

export const groups: GroupProgram[] = [
  {
    id: "mese-kor-szulesi",
    title: "Kis mese- és játék kör",
    description: "Nyugodt, szeretetteljes közösségi alkalom kisgyermekes és szülői részvétellel, ahol a történet és a játék segít megnyugodni.",
    image: groupEveningCircle,
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
    image: ritualFloralArrangement,
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

export const events: EventRecord[] = [
  {
    id: "kerti-meseeste",
    slug: "kerti-meseeste",
    title: "Kerti meseeste",
    shortDescription: "Egy nyugodt, közösségi est, ahol a mese és a természet együtt ad egy gyógyító hangulatú alkalmat.",
    description: "A kerti meseeste egy olyan est, ahol a népmesék nyugtató ritmusa, a természet hangjai és a közös figyelem együtt teremtenek biztonságos, szép pillanatokat.",
    image: ritualFloralArrangement,
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
    image: heroPortrait,
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

export const groupRegistrations: GroupRegistration[] = [];
export const eventRegistrations: EventRegistration[] = [];

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

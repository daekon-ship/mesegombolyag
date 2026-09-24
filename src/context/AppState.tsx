import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  adminCredentials,
  availability,
  bookings as initialBookings,
  eventRegistrations as initialEventRegistrations,
  events,
  getAvailableSlots,
  getEventAttendanceCount,
  getGroupAttendanceCount,
  groupRegistrations as initialGroupRegistrations,
  groups,
  services,
  siteContent as initialSiteContent,
  type BookingRecord,
  type EventRegistration,
  type GroupRegistration,
  type SiteContent,
} from "../lib/siteData";

export type BookingDraft = {
  serviceId: string;
  date: string;
  slot: string;
  name: string;
  email: string;
  phone: string;
  childName?: string;
  notes?: string;
};

export type GroupDraft = {
  groupId: string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
};

export type EventDraft = {
  eventId: string;
  name: string;
  email: string;
  phone: string;
  guests: number;
  notes?: string;
};

type AppStateValue = {
  bookings: BookingRecord[];
  groups: typeof groups;
  events: typeof events;
  groupRegistrations: GroupRegistration[];
  eventRegistrations: EventRegistration[];
  availability: typeof availability;
  services: typeof services;
  siteContent: SiteContent;
  isAdmin: boolean;
  loginAdmin: (email: string, password: string) => boolean;
  logoutAdmin: () => void;
  addBooking: (draft: BookingDraft) => { ok: boolean; message: string; booking?: BookingRecord };
  addGroupRegistration: (draft: GroupDraft) => { ok: boolean; message: string };
  addEventRegistration: (draft: EventDraft) => { ok: boolean; message: string };
  updateSiteContent: (content: Partial<SiteContent>) => void;
  getAvailableSlots: (date: string, serviceId: string) => string[];
  getUpcomingBookings: () => BookingRecord[];
  getUpcomingGroups: () => typeof groups;
  getUpcomingEvents: () => typeof events;
  getGroupRegistrationCount: (groupId: string) => number;
  getEventRegistrationCount: (eventId: string) => number;
};

const AppStateContext = createContext<AppStateValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<BookingRecord[]>(initialBookings);
  const [groupRegistrations, setGroupRegistrations] = useState<GroupRegistration[]>(initialGroupRegistrations);
  const [eventRegistrations, setEventRegistrations] = useState<EventRegistration[]>(initialEventRegistrations);
  const [siteContent, setSiteContent] = useState<SiteContent>(initialSiteContent);
  const [isAdmin, setIsAdmin] = useState(false);

  const loginAdmin = (email: string, password: string) => {
    const ok =
      email.trim().toLowerCase() === adminCredentials.email.toLowerCase() &&
      password === adminCredentials.password;

    setIsAdmin(ok);
    return ok;
  };

  const logoutAdmin = () => setIsAdmin(false);

  const addBooking = (draft: BookingDraft) => {
    const service = services.find((item) => item.id === draft.serviceId);
    if (!service) {
      return { ok: false, message: "A kiválasztott szolgáltatás nem található." };
    }

    const currentSlots = getAvailableSlots(draft.date, draft.serviceId);
    if (!draft.date || !draft.slot || !currentSlots.includes(draft.slot)) {
      return { ok: false, message: "Ez az időpont már nem elérhető vagy érvénytelen." };
    }

    const booking: BookingRecord = {
      id: `bk-${Date.now()}`,
      serviceId: draft.serviceId,
      date: draft.date,
      slot: draft.slot,
      name: draft.name,
      email: draft.email,
      phone: draft.phone,
      childName: draft.childName,
      notes: draft.notes,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    setBookings((prev) => [booking, ...prev]);
    return { ok: true, message: "A foglalás rögzítve, hamarosan visszajelzünk.", booking };
  };

  const addGroupRegistration = (draft: GroupDraft) => {
    const group = groups.find((item) => item.id === draft.groupId);
    if (!group) {
      return { ok: false, message: "A kiválasztott csoport nem található." };
    }

    const reserved = getGroupAttendanceCount(draft.groupId);
    if (group.capacity <= reserved) {
      return { ok: false, message: "A csoport már betelt, nem tudsz rá jelentkezni." };
    }

    const registration: GroupRegistration = {
      id: `gr-${Date.now()}`,
      groupId: draft.groupId,
      name: draft.name,
      email: draft.email,
      phone: draft.phone,
      notes: draft.notes,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    setGroupRegistrations((prev) => [registration, ...prev]);
    return { ok: true, message: "A csoportos jelentkezés rögzítve." };
  };

  const addEventRegistration = (draft: EventDraft) => {
    const event = events.find((item) => item.id === draft.eventId);
    if (!event) {
      return { ok: false, message: "A kiválasztott esemény nem létezik." };
    }

    const currentCount = getEventAttendanceCount(draft.eventId);
    if (event.capacity <= currentCount) {
      return { ok: false, message: "Az esemény már betelt." };
    }

    const registration: EventRegistration = {
      id: `er-${Date.now()}`,
      eventId: draft.eventId,
      name: draft.name,
      email: draft.email,
      phone: draft.phone,
      guests: draft.guests,
      notes: draft.notes,
      createdAt: new Date().toISOString(),
    };

    setEventRegistrations((prev) => [registration, ...prev]);
    return { ok: true, message: "Az eseményre való jelentkezés rögzítve." };
  };

  const value = useMemo<AppStateValue>(
    () => ({
      bookings,
      groups,
      events,
      groupRegistrations,
      eventRegistrations,
      availability,
      services,
      siteContent,
      isAdmin,
      loginAdmin,
      logoutAdmin,
      addBooking,
      addGroupRegistration,
      addEventRegistration,
      updateSiteContent: (content) => setSiteContent((prev) => ({ ...prev, ...content })),
      getAvailableSlots,
      getUpcomingBookings: () => [...bookings].sort((a, b) => a.date.localeCompare(b.date)),
      getUpcomingGroups: () => [...groups].sort((a, b) => a.date.localeCompare(b.date)),
      getUpcomingEvents: () => [...events].sort((a, b) => a.date.localeCompare(b.date)),
      getGroupRegistrationCount: (groupId) => getGroupAttendanceCount(groupId),
      getEventRegistrationCount: (eventId) => getEventAttendanceCount(eventId),
    }),
    [bookings, events, groupRegistrations, eventRegistrations, isAdmin, siteContent],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }

  return context;
}

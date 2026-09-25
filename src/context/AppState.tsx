import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
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
import {
  checkAdminSession,
  createBooking,
  createEventRegistration,
  createGroupRegistration,
  fetchAdminData,
  fetchPublicData,
  loginAdmin as apiLoginAdmin,
  logoutAdmin as apiLogoutAdmin,
  updateBookingStatus as apiUpdateBookingStatus,
  updateEventRegistrationStatus as apiUpdateEventRegistrationStatus,
  updateGroupRegistrationStatus as apiUpdateGroupRegistrationStatus,
  updateSiteContent as apiUpdateSiteContent,
} from "../lib/api";

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
  preferredDate?: string;
  preferredTime?: string;
  notes?: string;
};

export type EventDraft = {
  eventId: string;
  name: string;
  email: string;
  phone: string;
  preferredDate?: string;
  preferredTime?: string;
  guests: number;
  notes?: string;
};

export type BookingStatusUpdate = "pending" | "confirmed" | "cancelled";
export type GroupStatusUpdate = "pending" | "approved" | "cancelled";

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
  loginAdmin: (usernameOrEmail: string, password: string) => Promise<boolean>;
  logoutAdmin: () => Promise<void>;
  addBooking: (draft: BookingDraft) => Promise<{ ok: boolean; message: string; booking?: BookingRecord }>;
  addGroupRegistration: (draft: GroupDraft) => Promise<{ ok: boolean; message: string }>;
  addEventRegistration: (draft: EventDraft) => Promise<{ ok: boolean; message: string }>;
  updateBookingStatus: (bookingId: string, status: BookingStatusUpdate) => Promise<void>;
  updateGroupRegistrationStatus: (registrationId: string, status: GroupStatusUpdate) => Promise<void>;
  updateEventRegistrationStatus: (registrationId: string, status: "pending" | "approved" | "cancelled") => Promise<void>;
  updateSiteContent: (content: Partial<SiteContent>) => Promise<void>;
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
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const [publicDataResponse, sessionResponse] = await Promise.all([
          fetchPublicData(),
          checkAdminSession(),
        ]);

        if (!active) {
          return;
        }

        if (publicDataResponse.ok && publicDataResponse.data) {
          setBookings((publicDataResponse.data.bookings ?? []) as BookingRecord[]);
          setGroupRegistrations((publicDataResponse.data.groupRegistrations ?? []) as GroupRegistration[]);
          setEventRegistrations((publicDataResponse.data.eventRegistrations ?? []) as EventRegistration[]);
          setSiteContent((publicDataResponse.data.siteContent ?? initialSiteContent) as SiteContent);
        }

        if (sessionResponse.ok && sessionResponse.data?.loggedIn) {
          setIsAdmin(true);
        }
      } catch {
        setIsAdmin(false);
      }
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, []);

  const loginAdmin = async (usernameOrEmail: string, password: string) => {
    const response = await apiLoginAdmin(usernameOrEmail, password);
    if (response.ok) {
      setIsAdmin(true);
      const adminData = await fetchAdminData();
      if (adminData.ok && adminData.data) {
        setBookings(adminData.data.bookings as BookingRecord[]);
        setGroupRegistrations(adminData.data.groupRegistrations as GroupRegistration[]);
        setEventRegistrations(adminData.data.eventRegistrations as EventRegistration[]);
        setSiteContent(adminData.data.siteContent as SiteContent);
      }
      return true;
    }

    setIsAdmin(false);
    return false;
  };

  const logoutAdmin = async () => {
    await apiLogoutAdmin();
    setIsAdmin(false);
  };

  const addBooking = async (draft: BookingDraft) => {
    const service = services.find((item) => item.id === draft.serviceId);
    if (!service) {
      return { ok: false, message: "A kiválasztott szolgáltatás nem található." };
    }

    const response = await createBooking(draft);
    if (!response.ok) {
      return { ok: false, message: response.message || "A foglalás elküldése meghiúsult." };
    }

    const booking = (response.data as BookingRecord | undefined) ?? {
      id: `bk-${Date.now()}`,
      ...draft,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    setBookings((prev) => [booking, ...prev]);
    return { ok: true, message: response.message || "A foglalás rögzítve, hamarosan visszajelzünk.", booking };
  };

  const addGroupRegistration = async (draft: GroupDraft) => {
    const response = await createGroupRegistration(draft);
    if (!response.ok) {
      return { ok: false, message: response.message || "A csoportos jelentkezés elküldése meghiúsult." };
    }

    const next = response.data as GroupRegistration | undefined;
    if (next) {
      setGroupRegistrations((prev) => [next, ...prev]);
    }

    return { ok: true, message: response.message || "A csoportos jelentkezés rögzítve." };
  };

  const addEventRegistration = async (draft: EventDraft) => {
    const response = await createEventRegistration(draft);
    if (!response.ok) {
      return { ok: false, message: response.message || "Az eseményre történő jelentkezés elküldése meghiúsult." };
    }

    const next = response.data as EventRegistration | undefined;
    if (next) {
      setEventRegistrations((prev) => [next, ...prev]);
    }

    return { ok: true, message: response.message || "Az eseményre való jelentkezés rögzítve." };
  };

  const updateBookingStatus = async (bookingId: string, status: BookingStatusUpdate) => {
    const response = await apiUpdateBookingStatus(bookingId, status);
    if (response.ok) {
      setBookings((prev) => prev.map((booking) => booking.id === bookingId ? { ...booking, status } : booking));
    }
  };

  const updateGroupRegistrationStatus = async (registrationId: string, status: GroupStatusUpdate) => {
    const response = await apiUpdateGroupRegistrationStatus(registrationId, status);
    if (response.ok) {
      setGroupRegistrations((prev) => prev.map((entry) => entry.id === registrationId ? { ...entry, status } : entry));
    }
  };

  const updateEventRegistrationStatus = async (registrationId: string, status: "pending" | "approved" | "cancelled") => {
    const response = await apiUpdateEventRegistrationStatus(registrationId, status);
    if (response.ok) {
      setEventRegistrations((prev) => prev.map((entry) => entry.id === registrationId ? { ...entry, status } : entry));
    }
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
      updateBookingStatus,
      updateGroupRegistrationStatus,
      updateEventRegistrationStatus,
      updateSiteContent: async (content) => {
        const response = await apiUpdateSiteContent(content);
        if (response.ok && response.data?.siteContent) {
          setSiteContent(response.data.siteContent as SiteContent);
        }
      },
      getAvailableSlots,
      getUpcomingBookings: () => [...bookings].sort((a, b) => a.date.localeCompare(b.date)),
      getUpcomingGroups: () => [...groups].sort((a, b) => a.date.localeCompare(b.date)),
      getUpcomingEvents: () => [...events].sort((a, b) => a.date.localeCompare(b.date)),
      getGroupRegistrationCount: (groupId) => getGroupAttendanceCount(groupId),
      getEventRegistrationCount: (eventId) => getEventAttendanceCount(eventId),
    }),
    [bookings, events, eventRegistrations, groupRegistrations, isAdmin, siteContent],
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

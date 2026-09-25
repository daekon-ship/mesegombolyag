export type SiteContent = {
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  heroImage: string;
  introTitle: string;
  introText: string;
  contactEmail: string;
  contactPhone: string;
  location: string;
};

export type Slot = { id: string; startsAt: string; durationMin: number };

export type ProgramType = "workshop" | "mesemuhely";
export type RegistrationState = "open" | "closed" | "full" | "past" | "cancelled";

export type ProgramSession = { id: number; startsAt: string; endsAt: string };

export type Program = {
  id: string;
  slug: string;
  type: ProgramType;
  typeLabel: string;
  title: string;
  summary: string;
  description: string;
  image: string;
  location: string;
  capacity: number;
  status: "draft" | "published" | "cancelled";
  registrationOpen?: boolean;
  sessions: ProgramSession[];
  seatsTaken: number;
  seatsLeft: number;
  maxSeatsPerRegistration: number;
  registrationState: RegistrationState;
  isPast: boolean;
};

export type RecordStatus = "pending" | "confirmed" | "cancelled" | "rejected";

export type AdminBooking = {
  id: string;
  slotId: string;
  name: string;
  email: string;
  phone: string;
  notes: string | null;
  status: RecordStatus;
  startsAt: string;
  durationMin: number;
  createdAt: string;
};

export type AdminSlot = Slot & { status: "open" | "closed"; activeBookingId: string | null; bookingCount: number };

export type AdminRegistration = {
  id: string;
  programId: string;
  name: string;
  email: string;
  phone: string;
  seats: number;
  notes: string | null;
  status: RecordStatus;
  createdAt: string;
};

export type InquiryKind = "general" | "individual" | "workshop" | "mesemuhely" | "program";

export type AdminInquiry = {
  id: string;
  kind: InquiryKind;
  programId: string | null;
  programTitle: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: "new" | "handled";
  createdAt: string;
};

export type AdminEmail = {
  id: number;
  relatedType: string | null;
  recipient: string;
  subject: string;
  status: "pending" | "sent" | "failed";
  attempts: number;
  lastError: string | null;
  createdAt: string;
  sentAt: string | null;
};

export type AdminData = {
  siteContent: SiteContent;
  bookings: AdminBooking[];
  slots: AdminSlot[];
  programs: (Program & { registrationOpen: boolean })[];
  registrations: AdminRegistration[];
  inquiries: AdminInquiry[];
  emails: AdminEmail[];
  mailMode: string;
};

export const STATUS_LABELS: Record<RecordStatus, string> = {
  pending: "Visszaigazolásra vár",
  confirmed: "Visszaigazolva",
  cancelled: "Lemondva",
  rejected: "Elutasítva",
};

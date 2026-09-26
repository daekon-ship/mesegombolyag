import type { AdminData, Program, SiteContent, Slot } from "./types";

export type ApiResult<T> = {
  ok: boolean;
  status: number;
  data?: T;
  message?: string;
  errors?: Record<string, string>;
  code?: string;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

let onUnauthenticated: (() => void) | null = null;
/** Az admin munkamenet lejáratakor meghívott függvény (AppState állítja be). */
export function setUnauthenticatedHandler(handler: (() => void) | null) {
  onUnauthenticated = handler;
}

async function apiRequest<T>(path: string, options: RequestInit & { json?: unknown } = {}): Promise<ApiResult<T>> {
  const { json, headers, ...rest } = options;
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api${path}`, {
      credentials: "include",
      ...rest,
      headers: {
        Accept: "application/json",
        ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(headers ?? {}),
      },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  } catch {
    return {
      ok: false,
      status: 0,
      message: "Nem sikerült kapcsolódni a szerverhez. Ellenőrizd az internetkapcsolatot, és próbáld újra — a beírt adatok megmaradtak.",
    };
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) {
    if (response.status === 401 && payload?.code === "UNAUTHENTICATED") onUnauthenticated?.();
    return {
      ok: false,
      status: response.status,
      message:
        payload?.message ||
        (response.status >= 500 ? "A szerver átmenetileg nem érhető el. Kérlek, próbáld újra később — a beírt adatok megmaradtak." : "A művelet nem sikerült."),
      errors: payload?.errors,
      code: payload?.code,
    };
  }
  return { ok: true, status: response.status, data: payload.data, message: payload.message };
}

export type SiteFlags = { previewMode: boolean; emailNotifications: boolean };
/** Beküldés utáni tájékoztatás: levélküldés nélkül a lemondási link közvetlenül jön vissza. */
export type FollowUp = { emailNotifications?: boolean; manageUrl?: string };
export type PublicData = { siteContent: SiteContent; slots: Slot[]; programs: Program[]; site?: SiteFlags };

export const api = {
  publicData: () => apiRequest<PublicData>("/public-data"),
  program: (slug: string) => apiRequest<{ program: Program }>(`/programs/${encodeURIComponent(slug)}`),
  createBooking: (body: Record<string, unknown>) =>
    apiRequest<{ booking: { id: string; status: string; statusLabel: string; startsAt: string; durationMin: number } } & FollowUp>("/bookings", { method: "POST", json: body }),
  createRegistration: (body: Record<string, unknown>) =>
    apiRequest<{ registration: { id: string; status: string; statusLabel: string; seats: number; programTitle: string } } & FollowUp>("/registrations", { method: "POST", json: body }),
  createInquiry: (body: Record<string, unknown>) => apiRequest<{ inquiry: { id: string } } & FollowUp>("/inquiries", { method: "POST", json: body }),
  manageView: (token: string) =>
    apiRequest<{ type: string; title: string; name: string; status: string; statusLabel: string; when: string; seats?: number; canCancel: boolean }>(
      `/manage/${encodeURIComponent(token)}`,
    ),
  manageCancel: (token: string) =>
    apiRequest<{ status: string; statusLabel: string; canCancel: boolean } & FollowUp>(`/manage/${encodeURIComponent(token)}/cancel`, { method: "POST" }),

  login: (username: string, password: string) => apiRequest<{ user: { username: string } }>("/admin/login", { method: "POST", json: { username, password } }),
  session: () => apiRequest<{ loggedIn: boolean; user?: { username: string } }>("/admin/session"),
  logout: () => apiRequest("/admin/logout", { method: "POST" }),
  adminData: () => apiRequest<AdminData>("/admin/data"),
  setBookingStatus: (id: string, status: string) => apiRequest(`/admin/bookings/${id}`, { method: "PATCH", json: { status } }),
  createSlots: (body: { date: string; times: string[]; durationMin: number }) => apiRequest("/admin/slots", { method: "POST", json: body }),
  setSlotStatus: (id: string, status: "open" | "closed") => apiRequest(`/admin/slots/${id}`, { method: "PATCH", json: { status } }),
  deleteSlot: (id: string) => apiRequest(`/admin/slots/${id}`, { method: "DELETE" }),
  createProgram: (body: unknown) => apiRequest<{ program: Program }>("/admin/programs", { method: "POST", json: body }),
  updateProgram: (id: string, body: unknown) => apiRequest<{ program: Program; warnings: string[] }>(`/admin/programs/${id}`, { method: "PUT", json: body }),
  deleteProgram: (id: string) => apiRequest(`/admin/programs/${id}`, { method: "DELETE" }),
  setRegistrationStatus: (id: string, status: string) => apiRequest(`/admin/registrations/${id}`, { method: "PATCH", json: { status } }),
  setInquiryStatus: (id: string, status: "new" | "handled") => apiRequest(`/admin/inquiries/${id}`, { method: "PATCH", json: { status } }),
  saveSiteContent: (content: Partial<SiteContent>) => apiRequest<{ siteContent: SiteContent }>("/admin/site-content", { method: "PUT", json: content }),
  retryEmail: (id: number) => apiRequest(`/admin/emails/${id}/retry`, { method: "POST" }),
  uploadImage: (file: File) =>
    apiRequest<{ url: string }>("/admin/uploads", { method: "POST", body: file, headers: { "Content-Type": file.type || "application/octet-stream" } }),
};

/** A feltöltött képek a szerver gyökeréről (/uploads/...) érhetők el. */
export function mediaUrl(url: string) {
  if (!url) return "";
  return url.startsWith("/uploads/") ? `${API_BASE}${url}` : url;
}

export function newIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `k-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

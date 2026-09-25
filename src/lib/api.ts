export type ApiEnvelope<T> = {
  ok: boolean;
  data?: T;
  message?: string;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<ApiEnvelope<T>> {
  const response = await fetch(`${API_BASE}/api${path}`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      message: payload.message || "A kért művelet nem sikerült.",
    };
  }

  return {
    ok: true,
    data: payload.data ?? payload,
    message: payload.message,
  };
}

export async function fetchPublicData() {
  const response = await apiRequest<{
    siteContent: any;
    services: any[];
    availability: any[];
    groups: any[];
    events: any[];
    bookings: any[];
    groupRegistrations: any[];
    eventRegistrations: any[];
  }>("/public-data");

  return response;
}

export async function loginAdmin(username: string, password: string) {
  return apiRequest<{ user: { username: string } }>('/admin/login', {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function checkAdminSession() {
  return apiRequest<{ loggedIn: boolean; user?: { username: string } }>('/admin/session');
}

export async function logoutAdmin() {
  return apiRequest('/admin/logout', { method: "POST" });
}

export async function createBooking(draft: any) {
  return apiRequest<any>('/bookings', {
    method: "POST",
    body: JSON.stringify(draft),
  });
}

export async function createGroupRegistration(draft: any) {
  return apiRequest<any>('/group-registrations', {
    method: "POST",
    body: JSON.stringify(draft),
  });
}

export async function createEventRegistration(draft: any) {
  return apiRequest<any>('/event-registrations', {
    method: "POST",
    body: JSON.stringify(draft),
  });
}

export async function updateBookingStatus(bookingId: string, status: string) {
  return apiRequest<any>(`/admin/bookings/${bookingId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function updateGroupRegistrationStatus(registrationId: string, status: string) {
  return apiRequest<any>(`/admin/group-registrations/${registrationId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function updateEventRegistrationStatus(registrationId: string, status: string) {
  return apiRequest<any>(`/admin/event-registrations/${registrationId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function fetchAdminData() {
  return apiRequest<{ bookings: any[]; groupRegistrations: any[]; eventRegistrations: any[]; siteContent: any; groups: any[]; events: any[] }>("/admin/data");
}

export async function updateSiteContent(content: Record<string, unknown>) {
  return apiRequest<any>("/admin/site-content", {
    method: "PATCH",
    body: JSON.stringify(content),
  });
}

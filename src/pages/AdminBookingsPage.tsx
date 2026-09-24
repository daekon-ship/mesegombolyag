import { CalendarDays, CheckCircle2, LogOut, Users } from "lucide-react";
import { Link, Navigate, NavLink, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppState";
import { services } from "../lib/siteData";

export function AdminBookingsPage() {
  const navigate = useNavigate();
  const {
    isAdmin,
    logoutAdmin,
    bookings,
    groups,
    events,
    groupRegistrations,
    eventRegistrations,
    updateBookingStatus,
    updateGroupRegistrationStatus,
    updateEventRegistrationStatus,
  } = useAppContext();

  if (!isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const sortedBookings = [...bookings].sort((a, b) => a.date.localeCompare(b.date));
  const sortedGroupRegs = [...groupRegistrations].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const sortedEventRegs = [...eventRegistrations].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-30 border-b border-forest/10 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-5 py-4 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-forest text-sm font-semibold tracking-[0.18em] text-paper shadow-[0_12px_30px_rgba(32,58,50,0.18)]">
                M
              </div>
              <div>
                <p className="font-sans text-[10px] uppercase tracking-[0.26em] text-terracotta">Admin foglaláskezelő</p>
                <Link to="/" className="font-serif text-2xl leading-none text-forest">Mesegombolyag</Link>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-2">
              <NavLink to="/admin/dashboard" className={({ isActive }) => `inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${isActive ? "bg-forest text-paper shadow-[0_10px_20px_rgba(32,58,50,0.12)]" : "border border-forest/15 bg-white/60 text-forest hover:bg-forest/5"}`}>
                Dashboard
              </NavLink>
              <NavLink to="/admin/foglalasok" className={({ isActive }) => `inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${isActive ? "bg-forest text-paper shadow-[0_10px_20px_rgba(32,58,50,0.12)]" : "border border-forest/15 bg-white/60 text-forest hover:bg-forest/5"}`}>
                Foglalások
              </NavLink>
              <NavLink to="/" className={({ isActive }) => `inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${isActive ? "bg-forest text-paper shadow-[0_10px_20px_rgba(32,58,50,0.12)]" : "border border-forest/15 bg-white/60 text-forest hover:bg-forest/5"}`}>
                Főoldal
              </NavLink>
              <button type="button" onClick={() => { logoutAdmin(); navigate("/admin", { replace: true }); }} className="inline-flex items-center gap-2 rounded-full border border-forest/15 bg-paper px-4 py-2 text-sm font-semibold text-forest transition hover:border-forest/30 hover:bg-forest/5">
                <LogOut className="h-4 w-4" />
                Kijelentkezés
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-5 py-10 sm:px-8 lg:px-12">
        <section className="grid gap-4 md:grid-cols-3">
          <SummaryCard title="Egyéni foglalások" value={bookings.length.toString()} icon={<CalendarDays className="h-5 w-5" />} />
          <SummaryCard title="Csoportos jelentkezések" value={groupRegistrations.length.toString()} icon={<Users className="h-5 w-5" />} />
          <SummaryCard title="Eseményes jelentkezések" value={eventRegistrations.length.toString()} icon={<CheckCircle2 className="h-5 w-5" />} />
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-[28px] border border-forest/10 bg-white/70 p-6 xl:col-span-2">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="font-serif text-3xl text-forest">Egyéni foglalások</h2>
              <span className="rounded-full bg-forest/8 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-forest">{bookings.length} db</span>
            </div>

            <div className="space-y-3">
              {sortedBookings.map((booking) => {
                const serviceName = services.find((service) => service.id === booking.serviceId)?.name ?? booking.serviceId;
                return (
                  <div key={booking.id} className="rounded-2xl border border-forest/10 bg-paper p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-forest">{booking.name}</p>
                        <p className="text-sm text-ink/70">{booking.email} · {booking.phone}</p>
                        <p className="mt-2 text-sm text-ink/70">{serviceName} · {booking.childName ? `Gyermek: ${booking.childName}` : "Felnőtt alkalom"}</p>
                      </div>
                      <div className="text-left text-sm text-ink/70 md:text-right">
                        <p>{new Date(`${booking.date}T12:00:00`).toLocaleDateString("hu-HU", { year: "numeric", month: "long", day: "numeric" })}</p>
                        <p>{booking.slot}</p>
                        <span className="mt-2 inline-flex rounded-full bg-terracotta/10 px-2.5 py-1 text-xs font-semibold text-terracotta">{booking.status}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" onClick={() => updateBookingStatus(booking.id, "confirmed")} className="rounded-full bg-forest px-3 py-1.5 text-xs font-semibold text-paper hover:bg-terracotta">Elfogad</button>
                      <button type="button" onClick={() => updateBookingStatus(booking.id, "cancelled")} className="rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">Elutasít</button>
                    </div>
                    {booking.notes && <p className="mt-3 text-sm text-ink/70">Megjegyzés: {booking.notes}</p>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-forest/10 bg-white/70 p-6">
            <h2 className="font-serif text-3xl text-forest">Gyors áttekintés</h2>
            <div className="mt-5 space-y-4">
              <MiniStat label="Aktív csoportok" value={groups.filter((group) => group.active).length.toString()} />
              <MiniStat label="Publikált események" value={events.filter((event) => event.status === "published").length.toString()} />
              <MiniStat label="Jövő héten" value={bookings.filter((item) => item.date >= "2026-09-24").length.toString()} />
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[28px] border border-forest/10 bg-white/70 p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-3xl text-forest">Csoportos jelentkezések</h2>
              <span className="rounded-full bg-forest/8 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-forest">{groupRegistrations.length}</span>
            </div>

            <div className="space-y-3">
              {sortedGroupRegs.map((entry) => {
                const group = groups.find((item) => item.id === entry.groupId);
                return (
                  <div key={entry.id} className="rounded-2xl border border-forest/10 bg-paper p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-semibold text-forest">{entry.name}</p>
                      <span className="rounded-full bg-terracotta/10 px-2.5 py-1 text-xs font-semibold text-terracotta">{entry.status}</span>
                    </div>
                    <p className="mt-2 text-sm text-ink/70">{group?.title ?? "Ismeretlen csoport"}</p>
                    <p className="text-sm text-ink/70">{entry.email} · {entry.phone}</p>
                    <p className="mt-2 text-sm text-ink/70">Időpont: {entry.preferredDate ?? group?.date ?? "-"} · {entry.preferredTime ?? group?.time ?? "-"}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => updateGroupRegistrationStatus(entry.id, "approved")} className="rounded-full bg-forest px-3 py-1.5 text-xs font-semibold text-paper hover:bg-terracotta">Jóváhagy</button>
                      <button type="button" onClick={() => updateGroupRegistrationStatus(entry.id, "cancelled")} className="rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">Elutasít</button>
                    </div>
                    {entry.notes && <p className="mt-2 text-sm text-ink/70">Megjegyzés: {entry.notes}</p>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-forest/10 bg-white/70 p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-3xl text-forest">Eseményjelentkezések</h2>
              <span className="rounded-full bg-forest/8 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-forest">{eventRegistrations.length}</span>
            </div>

            <div className="space-y-3">
              {sortedEventRegs.map((entry) => {
                const event = events.find((item) => item.id === entry.eventId);
                return (
                  <div key={entry.id} className="rounded-2xl border border-forest/10 bg-paper p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-semibold text-forest">{entry.name}</p>
                      <span className="rounded-full bg-forest px-2.5 py-1 text-xs font-semibold text-paper">{entry.guests} fő</span>
                    </div>
                    <p className="mt-2 text-sm text-ink/70">{event?.title ?? "Ismeretlen esemény"}</p>
                    <p className="text-sm text-ink/70">{entry.email} · {entry.phone}</p>
                    <p className="mt-2 text-sm text-ink/70">Időpont: {entry.preferredDate ?? event?.date ?? "-"} · {entry.preferredTime ?? event?.startTime ?? "-"}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => updateEventRegistrationStatus(entry.id, "approved")} className="rounded-full bg-forest px-3 py-1.5 text-xs font-semibold text-paper hover:bg-terracotta">Jóváhagy</button>
                      <button type="button" onClick={() => updateEventRegistrationStatus(entry.id, "cancelled")} className="rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">Elutasít</button>
                    </div>
                    {entry.notes && <p className="mt-2 text-sm text-ink/70">Megjegyzés: {entry.notes}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function SummaryCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-[24px] border border-forest/10 bg-white/70 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink/70">{title}</p>
        <div className="rounded-full bg-forest/8 p-2 text-forest">{icon}</div>
      </div>
      <p className="mt-5 font-serif text-4xl text-forest">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-paper px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-ink/70">{label}</span>
        <span className="font-semibold text-forest">{value}</span>
      </div>
    </div>
  );
}

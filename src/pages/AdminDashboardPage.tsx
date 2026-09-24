import { type ReactNode } from "react";
import { BellRing, CalendarRange, CheckCircle2, LogOut, Users, Wand2 } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useAppContext } from "../context/AppState";

export function AdminDashboardPage() {
  const { isAdmin, logoutAdmin, bookings, groups, events, eventRegistrations, groupRegistrations, getUpcomingBookings, getUpcomingEvents, getUpcomingGroups } = useAppContext();

  if (!isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const upcomingBookings = getUpcomingBookings().slice(0, 5);
  const upcomingGroups = getUpcomingGroups().slice(0, 4);
  const upcomingEvents = getUpcomingEvents().slice(0, 4);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-forest/10 bg-paper/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
          <div>
            <p className="font-sans text-xs uppercase tracking-[0.25em] text-terracotta">Mesegombolyag admin</p>
            <Link to="/" className="font-serif text-2xl text-forest">Mesegombolyag</Link>
          </div>
          <button onClick={logoutAdmin} className="inline-flex items-center gap-2 rounded-full border border-forest/20 px-4 py-2 text-sm font-medium text-forest hover:bg-forest/5">
            <LogOut className="h-4 w-4" />
            Kijelentkezés
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-5 py-10 sm:px-8 lg:px-12">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Közelgő foglalások" value={upcomingBookings.length.toString()} icon={<CalendarRange className="h-5 w-5" />} />
          <StatCard title="Új jelentkezők" value={bookings.length.toString()} icon={<Users className="h-5 w-5" />} />
          <StatCard title="Aktív csoportok" value={groups.filter((group) => group.active).length.toString()} icon={<Wand2 className="h-5 w-5" />} />
          <StatCard title="Események" value={events.filter((event) => event.status === "published").length.toString()} icon={<BellRing className="h-5 w-5" />} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-forest/10 bg-white/60 p-6">
            <h2 className="font-serif text-3xl text-forest">Foglalások</h2>
            <div className="mt-5 space-y-3">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="flex flex-col gap-2 rounded-2xl border border-forest/10 bg-paper p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-forest">{booking.name}</p>
                    <p className="text-sm text-ink/70">{booking.email}</p>
                  </div>
                  <div className="text-right text-sm text-ink/70">
                    <p>{new Date(`${booking.date}T12:00:00`).toLocaleDateString("hu-HU", { month: "long", day: "numeric" })}</p>
                    <p>{booking.slot}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-forest/10 bg-white/60 p-6">
            <h2 className="font-serif text-3xl text-forest">Jelentkezők összefoglalója</h2>
            <div className="mt-5 space-y-4">
              <SummaryRow label="Csoportos jelentkezések" value={groupRegistrations.length.toString()} />
              <SummaryRow label="Eseményjelentkezések" value={eventRegistrations.length.toString()} />
              <SummaryRow label="Publikált események" value={events.filter((event) => event.status === "published").length.toString()} />
              <SummaryRow label="Aktív csoportok" value={groups.filter((group) => group.active).length.toString()} />
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[28px] border border-forest/10 bg-white/60 p-6">
            <h3 className="font-serif text-2xl text-forest">Közelgő csoportok</h3>
            <div className="mt-4 space-y-4">
              {upcomingGroups.map((group) => (
                <div key={group.id} className="rounded-2xl border border-forest/10 bg-paper p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold text-forest">{group.title}</p>
                    <span className="rounded-full bg-forest px-2.5 py-1 text-xs font-semibold text-paper">{group.active ? "Aktív" : "Inaktív"}</span>
                  </div>
                  <p className="mt-2 text-sm text-ink/70">{group.date} · {group.time}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-forest/10 bg-white/60 p-6">
            <h3 className="font-serif text-2xl text-forest">Közelgő események</h3>
            <div className="mt-4 space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="rounded-2xl border border-forest/10 bg-paper p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold text-forest">{event.title}</p>
                    <span className="rounded-full bg-terracotta/10 px-2.5 py-1 text-xs font-semibold text-terracotta">{event.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-ink/70">{event.date} · {event.startTime}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-forest/10 bg-white/60 p-6">
          <h3 className="font-serif text-2xl text-forest">Gyors műveletek</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <QuickAction title="Új foglalás" subtitle="Időpontok és admin ellenőrzés" />
            <QuickAction title="Csoport létrehozása" subtitle="Létszám és jelentkezők kezelése" />
            <QuickAction title="Esemény publikálása" subtitle="Weboldal és hirdetés" />
            <QuickAction title="Oldal szerkesztése" subtitle="Hero, szövegek és CTA-k" />
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: ReactNode }) {
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-paper px-4 py-3">
      <span className="text-sm text-ink/70">{label}</span>
      <span className="font-semibold text-forest">{value}</span>
    </div>
  );
}

function QuickAction({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border border-forest/10 bg-paper p-4">
      <div className="mb-3 inline-flex rounded-full bg-forest/8 p-2 text-forest"><CheckCircle2 className="h-4 w-4" /></div>
      <p className="font-semibold text-forest">{title}</p>
      <p className="mt-2 text-sm text-ink/70">{subtitle}</p>
    </div>
  );
}

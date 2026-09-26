import { Link } from "react-router-dom";
import { formatDateTime } from "../../lib/format";
import { AdminCard, StatusBadge, useAdmin } from "./AdminLayout";

export function AdminOverviewPage() {
  const { data } = useAdmin();
  if (!data) return null;
  const now = new Date().toISOString();
  const pendingBookings = data.bookings.filter((b) => b.status === "pending");
  const pendingRegs = data.registrations.filter((r) => r.status === "pending");
  const newInquiries = data.inquiries.filter((i) => i.status === "new");
  const failedEmails = data.emails.filter((e) => e.status === "failed");
  const upcomingBookings = data.bookings
    .filter((b) => b.startsAt > now && (b.status === "pending" || b.status === "confirmed"))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, 6);
  const freeSlots = data.slots.filter((s) => s.startsAt > now && s.status === "open" && !s.activeBookingId).length;
  const programTitle = (id: string) => data.programs.find((p) => p.id === id)?.title ?? "—";

  const stats = [
    { label: "Visszaigazolásra váró foglalás", value: pendingBookings.length, to: "/admin/foglalasok" },
    { label: "Visszaigazolásra váró jelentkezés", value: pendingRegs.length, to: "/admin/programok" },
    { label: "Új érdeklődés", value: newInquiries.length, to: "/admin/erdeklodesek" },
    { label: "Szabad jövőbeli időpont", value: freeSlots, to: "/admin/foglalasok" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-forest sm:text-4xl">Áttekintés</h1>
      {failedEmails.length > 0 && (
        <div role="alert" className="rounded-2xl border border-rose-700/20 bg-rose-50 p-4 text-[15px] text-rose-900">
          {failedEmails.length} levél kiküldése nem sikerült.{" "}
          <Link to="/admin/levelek" className="focus-ring font-semibold underline">Levélnapló megnyitása</Link>
          {data.mailMode !== "smtp" && <span className="block pt-1 text-sm">A levélküldés jelenleg nincs élesítve (mód: {data.mailMode}).</span>}
        </div>
      )}
      {(!data.siteContent.privacyPolicy || !data.siteContent.impressum) && (
        <div role="alert" className="rounded-2xl border border-ochre/40 bg-ochre/10 p-4 text-[15px] text-[#5e4516]">
          Hiányzik: {[!data.siteContent.privacyPolicy && "adatkezelési tájékoztató", !data.siteContent.impressum && "impresszum"].filter(Boolean).join(" és ")}.
          Az űrlapok személyes adatot gyűjtenek, ezért élesítés előtt töltsd ki.{" "}
          <Link to="/admin/tartalom" className="focus-ring font-semibold underline">Oldaltartalom szerkesztése</Link>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="focus-ring rounded-[20px] border border-forest/10 bg-white/70 p-4 transition hover:border-forest/25 sm:p-5">
            <p className="font-serif text-3xl text-forest sm:text-4xl">{s.value}</p>
            <p className="mt-2 text-sm leading-snug text-ink/70">{s.label}</p>
          </Link>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Közelgő egyéni alkalmak">
          {upcomingBookings.length === 0 ? (
            <p className="text-ink/60">Nincs közelgő foglalás.</p>
          ) : (
            <ul className="divide-y divide-forest/10">
              {upcomingBookings.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-semibold text-forest">{formatDateTime(b.startsAt)}</p>
                    <p className="text-sm text-ink/70">{b.name}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
        <AdminCard title="Legutóbbi jelentkezések">
          {data.registrations.length === 0 ? (
            <p className="text-ink/60">Még nincs jelentkezés.</p>
          ) : (
            <ul className="divide-y divide-forest/10">
              {data.registrations.slice(0, 6).map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-forest">{r.name}</p>
                    <p className="truncate text-sm text-ink/70">{programTitle(r.programId)}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>
    </div>
  );
}

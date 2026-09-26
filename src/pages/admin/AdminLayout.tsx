import { type ReactNode, useCallback, useEffect, useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { useAppContext } from "../../context/AppState";
import { api } from "../../lib/api";
import type { AdminData, RecordStatus } from "../../lib/types";
import { STATUS_LABELS } from "../../lib/types";

type AdminCtx = {
  data: AdminData | null;
  loadError: string | null;
  reload: () => Promise<void>;
  notify: (tone: "success" | "error", text: string) => void;
};

export function useAdmin() {
  return useOutletContext<AdminCtx>();
}

const NAV = [
  { to: "/admin/attekintes", label: "Áttekintés" },
  { to: "/admin/foglalasok", label: "Időpontok és foglalások" },
  { to: "/admin/programok", label: "Programok és jelentkezők" },
  { to: "/admin/erdeklodesek", label: "Érdeklődések" },
  { to: "/admin/tartalom", label: "Oldaltartalom" },
  { to: "/admin/levelek", label: "Levélnapló" },
  { to: "/admin/fiok", label: "Fiók" },
];

export function AdminLayout() {
  const { isAdmin, logoutAdmin } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<AdminData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const reload = useCallback(async () => {
    const res = await api.adminData();
    if (res.ok && res.data) {
      setData(res.data);
      setLoadError(null);
    } else if (res.status !== 401) setLoadError(res.message || "Az adatok betöltése nem sikerült.");
  }, []);

  useEffect(() => {
    if (isAdmin) reload();
  }, [isAdmin, reload]);
  useEffect(() => setMenuOpen(false), [location.pathname]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.tone === "error" ? 9000 : 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const notify = useCallback((tone: "success" | "error", text: string) => setToast({ tone, text }), []);

  if (isAdmin === null) return <div className="flex min-h-screen items-center justify-center bg-paper text-ink/60" role="status">Betöltés…</div>;
  if (!isAdmin) return <Navigate to="/admin" replace />;

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-30 border-b border-forest/10 bg-paper/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-terracotta">Admin</p>
            <Link to="/" className="focus-ring font-serif text-xl text-forest">Mesegombolyag</Link>
          </div>
          <nav aria-label="Admin menü" className="hidden items-center gap-1 xl:flex">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `focus-ring rounded-full px-3.5 py-2 text-sm font-semibold transition ${isActive ? "bg-forest text-paper" : "text-forest hover:bg-forest/5"}`}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                await logoutAdmin();
                navigate("/admin", { replace: true });
              }}
              className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-forest/15 px-4 text-sm font-semibold text-forest hover:bg-forest/5"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Kijelentkezés</span>
            </button>
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-controls="admin-mobile-nav"
              aria-label={menuOpen ? "Menü bezárása" : "Menü megnyitása"}
              onClick={() => setMenuOpen((v) => !v)}
              className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full border border-forest/15 text-forest xl:hidden"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav id="admin-mobile-nav" aria-label="Admin menü" className="border-t border-forest/10 px-4 py-3 xl:hidden">
            <ul className="grid gap-1 sm:grid-cols-2">
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} className={({ isActive }) => `focus-ring block rounded-xl px-4 py-3 text-[15px] font-semibold ${isActive ? "bg-forest text-paper" : "text-forest hover:bg-forest/5"}`}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      {toast && (
        <div role={toast.tone === "error" ? "alert" : "status"} className="fixed inset-x-3 bottom-4 z-50 mx-auto max-w-lg">
          <div className={`flex items-start justify-between gap-3 rounded-2xl px-4 py-3 text-[15px] shadow-lg ${toast.tone === "error" ? "bg-rose-800 text-white" : "bg-forest text-paper"}`}>
            <span>{toast.text}</span>
            <button type="button" onClick={() => setToast(null)} aria-label="Értesítés bezárása" className="focus-ring shrink-0 opacity-80 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
        {loadError && (
          <div role="alert" className="mb-6 rounded-2xl border border-rose-700/20 bg-rose-50 p-4 text-rose-800">
            {loadError} <button type="button" onClick={reload} className="focus-ring font-semibold underline">Újrapróbálom</button>
          </div>
        )}
        {!data && !loadError ? <p className="text-ink/60" role="status">Adatok betöltése…</p> : <Outlet context={{ data, loadError, reload, notify } satisfies AdminCtx} />}
      </main>
    </div>
  );
}

export function StatusBadge({ status }: { status: RecordStatus }) {
  const tone = {
    pending: "bg-ochre/20 text-[#7a5a1f]",
    confirmed: "bg-emerald-700/10 text-emerald-800",
    cancelled: "bg-forest/10 text-forest/70",
    rejected: "bg-rose-700/10 text-rose-800",
  }[status];
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{STATUS_LABELS[status]}</span>;
}

export function AdminCard({ title, children, actions }: { title?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="min-w-0 rounded-[24px] border border-forest/10 bg-white/70 p-5 sm:p-6">
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="font-serif text-2xl text-forest">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export const smallBtn =
  "focus-ring inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-60";
export const primaryBtn = `${smallBtn} border-forest bg-forest text-paper hover:bg-terracotta hover:border-terracotta`;
export const ghostBtn = `${smallBtn} border-forest/20 text-forest hover:bg-forest/5`;
export const dangerBtn = `${smallBtn} border-rose-700/30 text-rose-800 hover:bg-rose-50`;

/** Kétlépcsős megerősítés böngészős felugró ablak nélkül. */
export function ConfirmButton({ label, confirmLabel = "Igen", onConfirm, className = dangerBtn, question }: { label: string; confirmLabel?: string; onConfirm: () => Promise<void> | void; className?: string; question?: string }) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!asking) {
    return <button type="button" className={className} onClick={() => setAsking(true)}>{label}</button>;
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2 rounded-full bg-rose-50 px-2 py-1">
      <span className="px-1 text-sm text-rose-900">{question ?? "Biztos?"}</span>
      <button
        type="button"
        disabled={busy}
        className={`${smallBtn} border-rose-800 bg-rose-800 text-white`}
        onClick={async () => {
          setBusy(true);
          await onConfirm();
          setBusy(false);
          setAsking(false);
        }}
      >
        {confirmLabel}
      </button>
      <button type="button" className={ghostBtn} onClick={() => setAsking(false)}>Mégsem</button>
    </span>
  );
}

/** Admin művelet futtatása: visszajelzés + adatfrissítés. */
export function useAdminAction() {
  const { reload, notify } = useAdmin();
  return async (run: () => Promise<{ ok: boolean; message?: string }>, successText?: string) => {
    const res = await run();
    if (res.ok) notify("success", res.message || successText || "Mentve.");
    else notify("error", res.message || "A művelet nem sikerült.");
    await reload();
    return res;
  };
}

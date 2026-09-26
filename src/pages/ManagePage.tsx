import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { Alert, PageShell, cardClass, eyebrowClass, pageTitleClass } from "../components/ui/forms";

type View = { type: string; title: string; name: string; status: string; statusLabel: string; when: string; seats?: number; canCancel: boolean };

/** Vendég lemondási oldal: a levélben kapott egyedi hivatkozással csak a saját foglalás/jelentkezés kezelhető. */
export function ManagePage() {
  const { token = "" } = useParams();
  const [view, setView] = useState<View | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    api.manageView(token).then((res) => {
      if (res.ok && res.data) {
        setView(res.data);
        setState("ready");
      } else setState(res.status === 404 ? "missing" : "error");
    });
  }, [token]);

  async function cancel() {
    if (busy) return;
    setBusy(true);
    const res = await api.manageCancel(token);
    setBusy(false);
    setConfirming(false);
    if (res.ok && res.data) {
      setView((v) => (v ? { ...v, ...res.data } : v));
      setMessage({ tone: "success", text: res.data.emailNotifications ? "A lemondást rögzítettük, erről e-mailt is küldünk." : "A lemondást rögzítettük." });
    } else setMessage({ tone: "error", text: res.message || "A lemondás nem sikerült." });
  }

  return (
    <PageShell>
      <section className={`mt-6 ${cardClass}`}>
        <p className={eyebrowClass}>Foglalás kezelése</p>
        {state === "loading" && <p className="mt-6 text-ink/60" role="status">Betöltés…</p>}
        {state === "missing" && <div className="mt-6"><Alert tone="error">Ez a hivatkozás érvénytelen vagy lejárt.</Alert></div>}
        {state === "error" && <div className="mt-6"><Alert tone="error">Most nem sikerült betölteni az adatokat. Kérlek, próbáld újra később.</Alert></div>}
        {state === "ready" && view && (
          <>
            <h1 className={pageTitleClass}>{view.title}</h1>
            <dl className="mt-6 space-y-3 text-[15px]">
              <div><dt className="text-sm text-ink/55">Név</dt><dd className="text-forest">{view.name}</dd></div>
              <div><dt className="text-sm text-ink/55">Időpont</dt><dd className="whitespace-pre-line text-forest">{view.when}</dd></div>
              {view.seats && <div><dt className="text-sm text-ink/55">Létszám</dt><dd className="text-forest">{view.seats} fő</dd></div>}
              <div><dt className="text-sm text-ink/55">Állapot</dt><dd className="font-semibold text-forest">{view.statusLabel}</dd></div>
            </dl>
            <div className="mt-6 space-y-4">
              {message && <Alert tone={message.tone}>{message.text}</Alert>}
              {view.canCancel && !confirming && (
                <button type="button" onClick={() => setConfirming(true)} className="focus-ring rounded-full border border-rose-700/30 px-5 py-3 text-sm font-semibold text-rose-800 hover:bg-rose-50">
                  Lemondom
                </button>
              )}
              {confirming && (
                <div className="rounded-2xl border border-rose-700/20 bg-rose-50 p-4">
                  <p className="text-[15px] text-rose-900">Biztosan lemondod? A helyed felszabadul, és mások foglalhatják.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" disabled={busy} onClick={cancel} className="focus-ring rounded-full bg-rose-800 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                      {busy ? "Lemondás…" : "Igen, lemondom"}
                    </button>
                    <button type="button" onClick={() => setConfirming(false)} className="focus-ring rounded-full border border-forest/20 px-5 py-2.5 text-sm font-semibold text-forest">
                      Mégsem
                    </button>
                  </div>
                </div>
              )}
              {!view.canCancel && !message && (
                <p className="text-sm text-ink/60">Ez a foglalás online már nem módosítható. Ha kérdésed van, írj e-mailt.</p>
              )}
            </div>
          </>
        )}
      </section>
    </PageShell>
  );
}

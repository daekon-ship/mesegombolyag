import { type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes, useId, useRef, useState } from "react";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { newIdempotencyKey, type ApiResult } from "../../lib/api";

export const inputClass =
  "w-full rounded-2xl border bg-paper px-4 py-3 text-base text-ink outline-none transition focus:border-forest focus:ring-2 focus:ring-terracotta/40 aria-[invalid=true]:border-rose-600/60 aria-[invalid=true]:bg-rose-50/40";

type FieldBase = { label: string; error?: string; hint?: string; required?: boolean; optional?: boolean };

function FieldShell({ id, label, error, hint, required, optional, children }: FieldBase & { id: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block font-sans text-sm font-semibold text-ink/80">
        {label}
        {required && <span aria-hidden="true" className="ml-0.5 text-terracotta">*</span>}
        {optional && <span className="ml-1 font-normal text-ink/50">(nem kötelező)</span>}
      </label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="text-xs leading-relaxed text-ink/55">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="flex items-start gap-1.5 text-sm text-rose-700">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: string) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

export function TextField({ label, error, hint, required, optional, ...props }: FieldBase & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required} optional={optional}>
      <input id={id} required={required} aria-invalid={Boolean(error)} aria-describedby={describedBy(id, error, hint)} className={`${inputClass} border-forest/15`} {...props} />
    </FieldShell>
  );
}

export function TextAreaField({ label, error, hint, required, optional, ...props }: FieldBase & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required} optional={optional}>
      <textarea id={id} required={required} aria-invalid={Boolean(error)} aria-describedby={describedBy(id, error, hint)} className={`${inputClass} border-forest/15`} {...props} />
    </FieldShell>
  );
}

export function SelectField({ label, error, hint, required, optional, children, ...props }: FieldBase & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required} optional={optional}>
      <select id={id} aria-invalid={Boolean(error)} aria-describedby={describedBy(id, error, hint)} className={`${inputClass} border-forest/15`} {...props}>
        {children}
      </select>
    </FieldShell>
  );
}

/** Spam elleni rejtett mező — ember nem látja, nem tölti ki. */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Weboldal
        <input tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} name="website" />
      </label>
    </div>
  );
}

export function Alert({ tone, children }: { tone: "error" | "success" | "info"; children: ReactNode }) {
  const styles = {
    error: "border-rose-700/20 bg-rose-50 text-rose-800",
    success: "border-emerald-700/20 bg-emerald-50 text-emerald-900",
    info: "border-forest/15 bg-sage/30 text-forest",
  }[tone];
  const Icon = tone === "success" ? CheckCircle2 : TriangleAlert;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`flex items-start gap-3 rounded-2xl border p-4 text-[15px] leading-relaxed ${styles}`}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function SubmitButton({ sending, children, sendingLabel = "Küldés folyamatban…" }: { sending: boolean; children: ReactNode; sendingLabel?: string }) {
  return (
    <button
      type="submit"
      disabled={sending}
      aria-busy={sending}
      className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-full bg-forest px-6 py-3.5 font-sans text-[15px] font-semibold text-paper transition-colors hover:bg-terracotta disabled:cursor-wait disabled:opacity-70 sm:w-auto"
    >
      {sending ? (
        <>
          <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-paper/40 border-t-paper" />
          {sendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * Beküldés-kezelés: dupla kattintás elleni zár, ismételt beküldés elleni azonosító
 * (ugyanaz marad hiba esetén, így az újrapróbálás nem hoz létre új rekordot),
 * mezőszintű hibák. Sikernél új azonosítót generál.
 */
export function useSubmission<T>() {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ApiResult<T> | null>(null);
  const keyRef = useRef(newIdempotencyKey());
  const lock = useRef(false);

  async function submit(run: (idempotencyKey: string) => Promise<ApiResult<T>>, clientErrors: Record<string, string> = {}) {
    if (lock.current) return null;
    if (Object.keys(clientErrors).length) {
      setError("Kérlek, javítsd a megjelölt mezőket.");
      setFieldErrors(clientErrors);
      return null;
    }
    lock.current = true;
    setSending(true);
    setError(null);
    setFieldErrors({});
    try {
      const res = await run(keyRef.current);
      if (res.ok) {
        setResult(res);
        keyRef.current = newIdempotencyKey();
      } else {
        setError(res.message || "A beküldés nem sikerült.");
        setFieldErrors(res.errors ?? {});
      }
      return res;
    } finally {
      lock.current = false;
      setSending(false);
    }
  }

  return { sending, error, fieldErrors, result, submit, reset: () => setResult(null) };
}

export function PageShell({ children, backTo = "/", backLabel = "Vissza a főoldalra", wide = false }: { children: ReactNode; backTo?: string; backLabel?: string; wide?: boolean }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-forest/10 bg-paper/90">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4 sm:px-8 lg:px-12">
          <Link to="/" className="focus-ring font-serif text-2xl text-forest">Mesegombolyag</Link>
          <nav aria-label="Fő navigáció" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-forest/80">
            <Link to="/esemenyek" className="focus-ring py-1 hover:text-terracotta">Programok</Link>
            <Link to="/foglalas" className="focus-ring py-1 hover:text-terracotta">Időpontfoglalás</Link>
            <Link to="/erdeklodes" className="focus-ring py-1 hover:text-terracotta">Érdeklődöm</Link>
          </nav>
        </div>
      </header>
      <main className={`mx-auto px-5 py-10 sm:px-8 lg:px-12 lg:py-14 ${wide ? "max-w-6xl" : "max-w-3xl"}`}>
        <Link to={backTo} className="focus-ring inline-flex items-center gap-1.5 font-sans text-sm font-medium text-ink/60 transition-colors hover:text-terracotta">
          ← {backLabel}
        </Link>
        {children}
      </main>
    </div>
  );
}

export const cardClass = "rounded-[28px] border border-forest/10 bg-white/60 p-6 shadow-sm sm:p-9";
export const eyebrowClass = "font-sans text-xs font-semibold uppercase tracking-[0.25em] text-terracotta";
export const pageTitleClass = "mt-3 font-serif text-[1.85rem] leading-tight text-forest sm:text-[2.3rem]";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9 ()/-]{6,20}$/;

/** Kliensoldali ellenőrzés — ugyanazok a szabályok, mint a szerveren. */
export function validateContactFields(values: { name: string; email: string; phone?: string }, { phoneRequired }: { phoneRequired: boolean }) {
  const errors: Record<string, string> = {};
  const name = values.name.trim();
  const email = values.email.trim();
  const phone = (values.phone ?? "").trim();
  if (name.length < 2) errors.name = "Kérlek, add meg a neved.";
  if (!email) errors.email = "Kérlek, add meg az e-mail-címed.";
  else if (!EMAIL_RE.test(email)) errors.email = "Az e-mail-cím formátuma nem megfelelő.";
  if (!phone && phoneRequired) errors.phone = "Kérlek, add meg a telefonszámod.";
  else if (phone && !PHONE_RE.test(phone)) errors.phone = "A telefonszám formátuma nem megfelelő (pl. +36 30 123 4567).";
  return errors;
}

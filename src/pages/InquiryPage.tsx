import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Send } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useAppContext } from "../context/AppState";
import { api } from "../lib/api";
import { formatDate } from "../lib/format";
import {
  Alert,
  Honeypot,
  PageShell,
  PrivacyNote,
  SelectField,
  SubmitButton,
  TextAreaField,
  TextField,
  cardClass,
  eyebrowClass,
  pageTitleClass,
  useSubmission,
  validateContactFields,
} from "../components/ui/forms";

/**
 * Érdeklődés — általános kérdés, egyéni alkalom vagy egy konkrét program.
 * URL-paraméterek: ?tema=general|individual|workshop|mesemuhely, ?program=<slug>.
 * A régi ?alkalom=... hivatkozásokat is értelmezi.
 */
const KIND_OPTIONS = [
  { value: "general", label: "Általános kérdés" },
  { value: "individual", label: "Személyes kísérés mesékkel (egyéni alkalom)" },
  { value: "workshop", label: "Mesés workshop" },
  { value: "mesemuhely", label: "Meseműhely" },
];
const LEGACY_KIND: Record<string, string> = {
  altalanos: "general",
  "egyeni-alkalom": "individual",
  "meses-workshop": "workshop",
  mesemuhely: "mesemuhely",
  "csoport-esemeny": "workshop",
};

export function InquiryPage() {
  const [searchParams] = useSearchParams();
  const { programs } = useAppContext();
  const programSlug = searchParams.get("program");
  const program = useMemo(() => programs.find((p) => p.slug === programSlug) ?? null, [programs, programSlug]);

  const initialKind = useMemo(() => {
    const raw = searchParams.get("tema") ?? searchParams.get("alkalom") ?? "";
    const kind = LEGACY_KIND[raw] ?? raw;
    return KIND_OPTIONS.some((o) => o.value === kind) ? kind : "general";
  }, [searchParams]);

  const [form, setForm] = useState({ name: "", email: "", phone: "", kind: initialKind, message: "", website: "" });
  useEffect(() => setForm((f) => ({ ...f, kind: initialKind })), [initialKind]);
  const { sending, error, fieldErrors, result, submit } = useSubmission<{ inquiry: { id: string } }>();
  const set = (field: keyof typeof form) => (value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submit((idempotencyKey) =>
      api.createInquiry({
        name: form.name,
        email: form.email,
        phone: form.phone,
        kind: program ? "program" : form.kind,
        programId: program?.id,
        message: form.message,
        website: form.website,
        idempotencyKey,
      }),
      {
        ...validateContactFields(form, { phoneRequired: false }),
        ...(form.message.trim().length < 5 ? { message: "Kérlek, írj legalább néhány szót az üzenetbe." } : {}),
      },
    );
  };

  return (
    <PageShell>
      <section className={`mt-6 ${cardClass}`}>
        <p className={eyebrowClass}>Érdeklődés</p>
        <h1 className={pageTitleClass}>{program ? `Érdeklődés: ${program.title}` : "Írj Johannának"}</h1>
        <p className="mt-4 max-w-[58ch] font-sans text-[15.5px] leading-relaxed text-ink/75">
          {program
            ? `${program.typeLabel}${program.sessions[0] ? `, ${formatDate(program.sessions[0].startsAt)}` : ""}. Írd meg a kérdésed, és Johanna személyesen válaszol.`
            : "Kérdésed van, vagy nem tudod, melyik forma illik hozzád? Írd meg pár sorban — Johanna személyesen válaszol."}
        </p>

        {result?.ok ? (
          <div className="mt-8 space-y-4">
            <Alert tone="success">
              <p className="font-semibold">{result.message}</p>
              <p className="mt-1 text-sm">A megadott e-mail-címre visszaigazoló levelet küldünk.</p>
            </Alert>
            <p className="text-sm text-ink/70">
              <Link to="/" className="focus-ring underline hover:text-terracotta">Vissza a főoldalra</Link> ·{" "}
              <Link to="/esemenyek" className="focus-ring underline hover:text-terracotta">Programok megtekintése</Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="relative mt-8 space-y-5">
            <Honeypot value={form.website} onChange={set("website")} />
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField label="Név" required value={form.name} onChange={(e) => set("name")(e.target.value)} autoComplete="name" error={fieldErrors.name} maxLength={100} />
              <TextField label="E-mail" type="email" required value={form.email} onChange={(e) => set("email")(e.target.value)} autoComplete="email" inputMode="email" error={fieldErrors.email} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField label="Telefonszám" optional type="tel" value={form.phone} onChange={(e) => set("phone")(e.target.value)} autoComplete="tel" placeholder="+36 30 123 4567" error={fieldErrors.phone} />
              {program ? (
                <div className="space-y-2">
                  <p className="font-sans text-sm font-semibold text-ink/80">Téma</p>
                  <p className="rounded-2xl border border-forest/10 bg-sage/25 px-4 py-3 text-[15px] text-forest">{program.title}</p>
                </div>
              ) : (
                <SelectField label="Téma" value={form.kind} onChange={(e) => set("kind")(e.target.value)} error={fieldErrors.kind}>
                  {KIND_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </SelectField>
              )}
            </div>
            <TextAreaField
              label="Üzenet"
              required
              rows={6}
              value={form.message}
              onChange={(e) => set("message")(e.target.value)}
              placeholder="Pár sor arról, mi hozott ide, vagy mit szeretnél kérdezni."
              error={fieldErrors.message}
              maxLength={3000}
            />
            {error && <Alert tone="error">{error}</Alert>}
            <SubmitButton sending={sending}>
              <Send className="h-4 w-4" aria-hidden="true" />
              Üzenet elküldése
            </SubmitButton>
            <PrivacyNote />
          </form>
        )}
      </section>
    </PageShell>
  );
}

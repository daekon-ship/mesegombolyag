import type { Program, RegistrationState } from "../lib/types";

export const STATE_LABELS: Record<RegistrationState, string> = {
  open: "Jelentkezés nyitva",
  full: "Betelt",
  closed: "Jelentkezés lezárva",
  past: "Lezajlott",
  cancelled: "Elmarad",
};

export function StateBadge({ state }: { state: RegistrationState }) {
  const tone =
    state === "open"
      ? "bg-emerald-700/10 text-emerald-800"
      : state === "cancelled"
        ? "bg-rose-700/10 text-rose-800"
        : "bg-forest/10 text-forest/75";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${tone}`}>{STATE_LABELS[state]}</span>;
}

export function TypeBadge({ program }: { program: Pick<Program, "typeLabel"> }) {
  return (
    <span className="inline-flex rounded-full bg-terracotta/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-terracotta">
      {program.typeLabel}
    </span>
  );
}

export function seatsText(program: Program) {
  if (program.registrationState === "full") return "Minden hely elkelt";
  return `${program.seatsLeft} szabad hely (összesen ${program.capacity})`;
}

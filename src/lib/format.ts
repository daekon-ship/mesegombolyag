// Minden dátum Europe/Budapest szerint jelenik meg, a látogató gépének időzónájától függetlenül.
const TZ = "Europe/Budapest";

const dateFmt = new Intl.DateTimeFormat("hu-HU", { timeZone: TZ, year: "numeric", month: "long", day: "numeric", weekday: "long" });
const shortDateFmt = new Intl.DateTimeFormat("hu-HU", { timeZone: TZ, month: "long", day: "numeric", weekday: "short" });
const timeFmt = new Intl.DateTimeFormat("hu-HU", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const partsFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** „2026. október 4., vasárnap" */
export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
/** „okt. 4., V" jellegű rövid dátum */
export const formatShortDate = (iso: string) => shortDateFmt.format(new Date(iso));
/** „10:00" */
export const formatTime = (iso: string) => timeFmt.format(new Date(iso));
/** „2026. október 4., vasárnap 10:00" */
export const formatDateTime = (iso: string) => `${formatDate(iso)} ${formatTime(iso)}`;

/** Budapesti fali idő részei: { date: "YYYY-MM-DD", time: "HH:mm" } — az admin űrlapokhoz. */
export function budapestParts(iso: string) {
  const p = Object.fromEntries(partsFmt.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

export function formatSessionRange(startsAt: string, endsAt: string) {
  return `${formatDate(startsAt)} · ${formatTime(startsAt)}–${formatTime(endsAt)}`;
}

/** Budapesti „ma" YYYY-MM-DD formában (a dátumválasztó minimumához). */
export const todayInBudapest = () => budapestParts(new Date().toISOString()).date;

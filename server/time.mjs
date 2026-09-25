// Időzóna-segédfüggvények: minden időpontot UTC ISO-formátumban tárolunk,
// a bevitel és a megjelenítés pedig mindig Europe/Budapest szerint történik.
export const TIME_ZONE = "Europe/Budapest";

const partsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Egy UTC időpont budapesti fali ideje: { date: "YYYY-MM-DD", time: "HH:mm" }. */
export function budapestParts(isoOrDate) {
  const date = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  const parts = Object.fromEntries(partsFormatter.formatToParts(date).map((p) => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

/**
 * Budapesti fali időből UTC ISO-időpont.
 * Budapest eltolása csak +1 (CET) vagy +2 (CEST) óra lehet, ezért mindkettőt kipróbáljuk:
 * - óraátállítási „lyuk" (márciusban 02:00–02:59): nincs érvényes megoldás → null;
 * - kétértelmű óra (októberben 02:00–02:59): a korábbi (nyári idő szerinti) időpontot adjuk.
 */
export function budapestLocalToUtc(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date)) || !/^\d{2}:\d{2}$/.test(String(time))) return null;
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  if (hh > 23 || mm > 59) return null;
  const naive = Date.UTC(y, m - 1, d, hh, mm);
  const matches = [120, 60]
    .map((offset) => new Date(naive - offset * 60_000))
    .filter((candidate) => {
      const p = budapestParts(candidate);
      return p.date === date && p.time === time;
    })
    .sort((a, b) => a.getTime() - b.getTime());
  return matches.length ? matches[0].toISOString() : null;
}

const longDate = new Intl.DateTimeFormat("hu-HU", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long",
});

/** „2026. október 4., vasárnap" */
export function formatBudapestDate(iso) {
  return longDate.format(new Date(iso));
}

/** „2026. október 4., vasárnap 10:00" */
export function formatBudapestDateTime(iso) {
  return `${formatBudapestDate(iso)} ${budapestParts(iso).time}`;
}

/** Időtartam: „2026. október 4., vasárnap 10:00–11:30" (azonos napon). */
export function formatBudapestRange(startIso, endIso) {
  const start = budapestParts(startIso);
  const end = budapestParts(endIso);
  if (start.date === end.date) return `${formatBudapestDate(startIso)} ${start.time}–${end.time}`;
  return `${formatBudapestDateTime(startIso)} – ${formatBudapestDateTime(endIso)}`;
}

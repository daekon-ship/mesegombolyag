import test from "node:test";
import assert from "node:assert/strict";
import { budapestLocalToUtc, budapestParts, formatBudapestDateTime } from "../time.mjs";

test("téli és nyári idő helyes átváltása", () => {
  assert.equal(budapestLocalToUtc("2026-01-15", "10:00"), "2026-01-15T09:00:00.000Z");
  assert.equal(budapestLocalToUtc("2026-07-15", "10:00"), "2026-07-15T08:00:00.000Z");
});

test("tavaszi óraátállítás: a kimaradó óra érvénytelen", () => {
  assert.equal(budapestLocalToUtc("2026-03-29", "02:30"), null);
  assert.equal(budapestLocalToUtc("2026-03-29", "01:59"), "2026-03-29T00:59:00.000Z");
  assert.equal(budapestLocalToUtc("2026-03-29", "03:00"), "2026-03-29T01:00:00.000Z");
});

test("őszi óraátállítás: a kétszer előforduló órából a korábbit választja, és visszaalakítva ugyanaz", () => {
  const iso = budapestLocalToUtc("2026-10-25", "02:30");
  assert.equal(iso, "2026-10-25T00:30:00.000Z");
  assert.deepEqual(budapestParts(iso), { date: "2026-10-25", time: "02:30" });
  assert.equal(budapestLocalToUtc("2026-10-25", "10:00"), "2026-10-25T09:00:00.000Z");
});

test("magyar formátumú megjelenítés a böngésző időzónájától függetlenül", () => {
  assert.equal(formatBudapestDateTime("2026-10-04T08:00:00.000Z"), "2026. október 4., vasárnap 10:00");
  assert.equal(formatBudapestDateTime("2026-10-25T23:30:00.000Z"), "2026. október 26., hétfő 00:30");
});

test("hibás bemenet", () => {
  assert.equal(budapestLocalToUtc("2026-13-01", "10:00"), null);
  assert.equal(budapestLocalToUtc("2026-10-01", "25:00"), null);
  assert.equal(budapestLocalToUtc("", ""), null);
});

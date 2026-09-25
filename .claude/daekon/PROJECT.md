# Mesegombolyag — projektállapot

**Ügyfél:** Tóth Johanna, meseterapeuta és mentálhigiénés szakember (Szeged)
**Stack:** Vite + React 18 + TypeScript + Tailwind v4 (frontend) · Node.js ≥ 22.13 + Express + beépített SQLite (`node:sqlite`) + Nodemailer (backend)
**Utolsó frissítés:** 2026-09-25 — foglalási, jelentkezési és admin rendszer befejezése és tesztelése.

## Futtatás

```bash
npm install
cp .env.example .env      # töltsd ki: JWT_SECRET, ADMIN_PASSWORD, SMTP_* stb.
npm run dev               # szerver: :3001, frontend (Vite): http://localhost:4173/mesegombolyag/
npm test                  # szerveroldali tesztek (node:test, ideiglenes adatbázissal)
npm run build             # típusellenőrzés + production build (dist/)
npm start                 # production: az Express szolgálja ki az API-t ÉS a dist/-et
                          #   → http://localhost:3001/mesegombolyag/
```

Admin: `…/#/admin` — az első admin felhasználó az `ADMIN_USERNAME` / `ADMIN_PASSWORD` környezeti változókból jön létre (vagy a régi JSON-ból átemelve).

## Architektúra

- `server/app.mjs` — minden API-végpont, validáció, jogosultság, levélsablonok. `server/index.mjs` — környezeti változók, indítás, régi JSON-adatok egyszeri átemelése.
- `server/db.mjs` — SQLite séma és migrációk. **Adatbázis-szintű védelem:** részleges egyedi index (egy időpontra egy aktív foglalás), triggerek a program-kapacitásra és a kapacitás csökkentésére, egyedi index az azonos e-mailes aktív jelentkezésre, idempotencia-kulcsok.
- `server/time.mjs` — minden időpont UTC-ben tárolva, bevitel/megjelenítés Europe/Budapest szerint; óraátállítási lyuk elutasítva, kétértelmű óra következetesen a nyári időre.
- `server/mail.mjs` — kimenő levélsor (`email_outbox`). Az adatmentés és a levélküldés külön lépés; hibás levél az adminban látszik és újraküldhető. `MAIL_TRANSPORT=smtp|file|fail|disabled`.
- Adatok: `data/mesegombolyag.db`, feltöltött képek: `data/uploads/`, levélfogó: `data/mail-capture/` (mind gitignore-ban).

### Üzleti szabályok

- **Mesés workshop** = pontosan 1 alkalom; **meseműhely** = legalább 2 alkalom, a jelentkezés a teljes folyamatra szól (egy rekord, nem alkalmanként).
- **Személyes kísérés** = egyéni időpontfoglalás a Johanna által meghirdetett szabad időpontokból.
- Státuszok: `pending` (Visszaigazolásra vár) · `confirmed` (Visszaigazolva) · `cancelled` (Lemondva) · `rejected` (Elutasítva). **Helyet csak a pending és a confirmed foglal.**
- Jelentkezés csak közzétett, nyitott, nem betelt programra, az első alkalom kezdete előtt. Workshopon egy jelentkezés max. 3 fő, meseműhelyen 1 fő.
- Jelentkezőkkel rendelkező program nem törölhető (→ „Elmarad” állapot), a férőhely nem csökkenthető a lefoglalt helyek alá, a típus nem változtatható. Időpontváltozásnál és elmaradásnál az admin figyelmeztetést kap az érintett jelentkezők számával.
- Foglalással rendelkező időpont nem törölhető, csak lezárható.
- A látogató a visszaigazoló levélben egyedi lemondási linket kap (`#/lemondas/<token>`, a token csak hash-ként tárolva), amellyel kizárólag a saját foglalását mondhatja le.

## Tesztek és ellenőrzések (2026-09-25)

- `npm test`: **18/18 sikeres** — jogosultság (401 minden admin végponton, hamis token), nyilvános API személyes adat nélkül, egyéni foglalás + párhuzamos foglalás ugyanarra az időpontra (201/409), ismételt beküldés, lezárt/múltbeli/nem létező időpont, lemondás → felszabadulás, ütköző visszaállítás, DB-szintű egyediség, csoportos jelentkezés + párhuzamos utolsó hely, duplikált e-mail, visszavonás → kapacitás, meseműhely egy rekorddal, zárt/elmarad/múltbeli/piszkozat, érdeklődési típusok, e-mail-hiba melletti sikeres mentés újrapróbálással, vendég lemondási link izolációja, tartalom + képfeltöltés (típus, 5 MB-os korlát, hamisított tartalom), óraátállítás, belépési rate limit.
- `npm run build`: sikeres. `npm audit --omit=dev`: 0 sebezhetőség (nodemailer 6 → 10 frissítés után).
- Böngészős (Playwright, production build az Express mögött, elkülönített `data/e2e` adatokkal, levélfogóval): admin belépés/hibás jelszó, időpontok meghirdetése, workshop + meseműhely létrehozása képpel, validáció, piszkozat; látogatói foglalás (kliensoldali hibák, siker, a foglalt időpont eltűnik), érdeklődés (előválasztott téma, hibák, megőrzött adatok), programlista, jelentkezés dupla kattintással (1 rekord), admin visszaigazolás (frissítés után is megmarad), vendég lemondás, érvénytelen token, tartalom- és nyitóképcsere megjelenése a nyilvános oldalon, hibás fájltípus, munkamenet nélküli átirányítás, főoldali menü horgonyai (asztali + mobil), hálózati és 500-as hiba az űrlapon (hibaüzenet, adatok megmaradnak, nincs sikerüzenet).
- Reszponzív: 360/390/768/1440 px — főoldal, programlista, programrészlet, foglalás, érdeklődés és mind a 8 adminképernyő: nincs vízszintes kilógás, nincs konzolhiba.
- Levelek: a levélfogóban ellenőrizve (címzett, tárgy, program, dátum, állapot, ékezetek, lemondási/admin hivatkozás). **A valódi SMTP-kézbesítés nincs tesztelve** — nincs beállított SMTP-hozzáférés.

## Javított fontosabb hibák (2026-09-25)

1. A `/api/public-data` minden foglalást és jelentkezést kiadott névvel, e-maillel, telefonnal → csak nem személyes adatok.
2. Nem volt adatbázis; programok/időpontok kódba égetve; az admin nem tudta kezelni őket → SQLite + teljes admin CRUD.
3. A foglalási oldal nem választott időpontot (mindig „rugalmas”, mai dátum) → valódi időpontválasztó, szerveroldali újraellenőrzéssel.
4. Eseményeknél a lemondott jelentkezés is foglalta a helyet; nem volt duplikáció- és párhuzamossági védelem → egységes szabály + DB-triggerek.
5. CORS bármely originnek engedélyezett hitelesített kéréseket; a tartalommentés tetszőleges kulcsot elfogadott → engedélyezőlista, mezőszintű validáció, JSON-only állapotmódosítás.
6. A főoldali tartalom a kódból jött, az admin mentése nem jelent meg → a nyilvános oldal az adatbázis tartalmát mutatja.
7. `HashRouter` mellett a `#mese`, `#rolam` stb. menüpontok és a hero „Érdeklődöm” gombja (nem létező `#erdeklodes`) a főoldal tetejére dobtak → görgetés.
8. `.env` nem volt gitignore-ban; a jelszó-hash-t tartalmazó JSON adatfájl be volt commitolva → kivéve a követésből.
9. A nyitókép 1,2 MB volt → 125 KB (1600 px, vizuálisan ellenőrizve DPR2-n).
10. Admin mobilnézet 390 px-en 681 px-re szélesedett → javítva.

## Hátralévő feladatok / élesítést akadályozó tényezők

1. **Hosting (blokkoló):** a jelenlegi GitHub Pages workflow csak statikus fájlokat tesz ki — ott nincs backend, így élesben minden űrlap „Nem sikerült kapcsolódni a szerverhez” hibát ad (sikerüzenet nem jelenik meg tévesen). Node.js-t futtató tárhely kell (VPS / Railway / Render stb., tartós lemezzel az SQLite-nak és a `data/uploads`-nak), `NODE_ENV=production`, `npm run build && npm start`, HTTPS reverse proxy (`TRUST_PROXY=1`). A döntés az ügyfélé/fejlesztőé — nincs élesítve, nincs push.
2. **SMTP:** `SMTP_HOST/PORT/USER/PASS`, `FROM_EMAIL`, `MAIL_TRANSPORT=smtp` beállítása, SPF/DKIM a küldő domainre, majd tesztlevél egy tesztpostafiókba.
3. **Adatkezelési tájékoztató és impresszum:** az űrlapok személyes adatot gyűjtenek, élesítés előtt kötelező. A tartalom az ügyféltől kell (a korábbi dőlt betűs helykitöltő feliratokat eltávolítottam, kitalált szöveget nem tettem be). Telefonszám szintén nincs megadva (adminból pótolható).
4. **Admin jelszó:** a korábbi jelszó-hash a git-előzményekben szerepel → élesítés előtt új, erős jelszó és új `JWT_SECRET`.
5. **Eredeti ügyfélszöveg:** a projektben nem található az eredeti ügyfélanyag, így a szövegeket nem lehetett vele összevetni; a kért szakaszok és idézetek (Boldizsár Ildikó névvel, három aranyalma) megvannak. Árak nem jelennek meg.
6. A `data/` alatti régi érdeklődések korábbi tesztadatok (`example.hu`) — Johanna az adminban megválaszoltnak jelölheti őket.
7. Nem kötelező: az `@supabase/supabase-js` függőség nincs használatban.

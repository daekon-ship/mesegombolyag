# Mesegombolyag — projektállapot

**Ügyfél:** Tóth Johanna, meseterapeuta és mentálhigiénés szakember (Szeged)
**Stack:** Vite + React 18 + TypeScript + Tailwind v4 (frontend) · Node.js 24 + Express + beépített SQLite (`node:sqlite`) + Resend HTTPS API / Nodemailer (backend)
**Utolsó frissítés:** 2026-09-26 — tesztelőnézet telepítve Railway-re.

## Telepítési állapot

- **Tesztelőnézet: TELEPÍTVE és kipróbálva** — https://mesegombolyag-production.up.railway.app/ (admin: `/#/admin`). Nem éles: `PREVIEW_MODE=1` (minden oldalon „Tesztelőnézet” sáv), `MAIL_TRANSPORT=disabled` (e-mail nem megy ki, a felület nem is ígér e-mailt; a lemondási link a sikeroldalon jelenik meg).
- Railway: projekt `mesegombolyag-elonezet`, szolgáltatás `mesegombolyag`, kötet `mesegombolyag-data` → `/data`, régió sfo, 1 replika. Fiók: **Hobby** csomag (havi 5 USD beépített keret; kötet max. 0,5 GB; Railway-kötetmentés nem elérhető — csak az alkalmazásszintű `npm run backup`).
- Forrás: GitHub `daekon-ship/mesegombolyag`, **`railway` ág**. A `main` ág (és a GitHub Pages látványterv: https://daekon-ship.github.io/mesegombolyag/) változatlan; a `main` helyi példánya 3 commit előrébb jár, nincs pusholva.
- A push a `railway` ágra **nem indít automatikus telepítést** — új verzióhoz a forrást újra kell csatolni / „Deploy latest commit”.
- Változók a Railway-en (értékek csak ott): `JWT_SECRET` (véletlen, 64 hexa), `ADMIN_USERNAME`, `ADMIN_PASSWORD` (első belépéshez; belépés + jelszócsere után törlendő), `ADMIN_EMAIL`, `MAIL_TRANSPORT=disabled`, `PREVIEW_MODE=1`, `PUBLIC_SITE_URL`.
- Tesztadatok az előnézetben (mind „TESZT” jelöléssel): 2 időpont (okt. 8.), egy workshop és egy 3 alkalmas meseműhely, 1 foglalás, 1 jelentkezés, 1 érdeklődés.

## Futtatás

```bash
npm install
cp .env.example .env      # töltsd ki: JWT_SECRET, ADMIN_PASSWORD, levélküldés stb.
npm run dev               # szerver :3001, frontend (Vite) http://localhost:4173/ — foglalt portnál hibával leáll
npm test                  # 23 teszt (API, idő, Resend hamis API-val, production-indulás, tartósság valódi folyamattal)
npm run build             # típusellenőrzés + production build (dist/, relatív asset-útvonalak)
npm start                 # production (--production): Express szolgálja ki az API-t ÉS a weboldalt a gyökérről
npm run backup            # mentés: DATA_DIR/backups/mentes-<időbélyeg>/ (adatbázis + képek)
npm run restore -- <név>  # visszaállítás előjegyzése, a következő induláskor fut le
npm run admin:password    # adminjelszó-csere, minden munkamenet érvénytelenítése
```

Admin: `…/#/admin`. Az első admin az `ADMIN_USERNAME` / `ADMIN_PASSWORD` változókból jön létre, ha még nincs admin az adatbázisban.

## Architektúra

- `server/app.mjs` — API-végpontok, validáció, jogosultság, levélsablonok, statikus kiszolgálás (ismeretlen `/api/*` → JSON 404).
- `server/config.mjs` — környezeti változók; production módban hiányzó/gyenge `JWT_SECRET`, hiányzó kötet (Railway-en), hiányzó `PUBLIC_SITE_URL`/`RAILWAY_PUBLIC_DOMAIN`, nem https cím, beállítatlan levélküldés vagy teszt-levélmód esetén hibalistával leáll. Beépített alapjelszó nincs.
- `server/index.mjs` — `0.0.0.0:$PORT`; induláskor függő visszaállítás, migrációk, első admin; admin nélkül production módban leáll; SIGTERM-re új kérést nem fogad, kiküldi a függő leveleket, lezárja az adatbázist. A régi JSON-átemelés csak fejlesztői módban fut.
- `server/db.mjs` — SQLite séma, migrációk (2. migráció: admin tokenverzió, levél válaszcím és szolgáltatói azonosító). Adatbázis-szintű védelem: egy időpontra egy aktív foglalás, kapacitás-triggerek, azonos e-mail kizárása, idempotencia-kulcsok.
- `server/time.mjs` — UTC tárolás, Europe/Budapest bevitel/megjelenítés, óraátállítás kezelése.
- `server/mail.mjs` + `server/mail-resend.mjs` — kimenő levélsor; `MAIL_TRANSPORT=resend|smtp|file|fail|disabled`. A Resend-szállítás külön modul, idempotencia-kulcs = telepítésazonosító + levélsor-azonosító (újraküldés nem kézbesít duplán). Látogatói levél válaszcíme: Johanna kapcsolati címe; Johannának szóló értesítésé: a látogató címe.
- `server/backup.mjs`, `server/scripts/` — mentés (`VACUUM INTO` + képek, futó szerver mellett is konzisztens), visszaállítás induláskor (a felülírt adatok `pre-restore-*` mappába kerülnek), jelszócsere rejtett beolvasással.
- Adatok helye: `DATA_DIR` → `RAILWAY_VOLUME_MOUNT_PATH` → `./data`: `mesegombolyag.db`, `uploads/`, `backups/`, `mail-capture/` (levélfogó, csak teszt).
- Frontend: `vite base: "./"` → a build bármely alapútvonal alatt működik; a régi `/mesegombolyag/` cím 301-gyel a gyökérre irányít.

### Üzleti szabályok

- **Mesés workshop** = pontosan 1 alkalom; **meseműhely** = legalább 2 alkalom, a jelentkezés a teljes folyamatra szól (egy rekord).
- **Személyes kísérés** = egyéni időpontfoglalás a meghirdetett szabad időpontokból.
- Státuszok: Visszaigazolásra vár · Visszaigazolva · Lemondva · Elutasítva. Helyet csak az első kettő foglal.
- Jelentkezés csak közzétett, nyitott, nem betelt programra, az első alkalom előtt. Workshopon max. 3 fő/jelentkezés, meseműhelyen 1 fő.
- Jelentkezőkkel rendelkező program nem törölhető (→ „Elmarad”), a férőhely nem csökkenthető a foglaltak alá, a típus nem változtatható; változásnál az admin figyelmeztetést kap.
- Foglalással rendelkező időpont nem törölhető, csak lezárható.
- Vendég lemondási link (`#/lemondas/<token>`, a token hash-ként tárolva) kizárólag a saját foglalást kezeli.

## Tesztek és ellenőrzések

**2026-09-26 — a telepített tesztelőnézeten (https://mesegombolyag-production.up.railway.app)**
- Health: `{"status":"ok"}`; `/` a weboldal; ismeretlen `/api/*` → JSON 404; régi `/mesegombolyag/` → 301; admin API bejelentkezés nélkül 401. Futási napló: adatmappa `/data`, első admin létrejött, levélküldés `disabled`.
- Admin (asztali): belépés (Secure süti), 2 időpont meghirdetése, workshop képfeltöltéssel, 3 alkalmas meseműhely közzététele.
- Látogató (390 px, mobil emuláció): tesztelőnézet-sáv, egyéni foglalás, meseműhely-jelentkezés, érdeklődés — egyik sem ígér e-mailt; a lemondási link megjelenik és a saját foglalást mutatja; nincs kilógás, konzolhiba vagy 4xx/5xx kérés.
- Admin (390 px): tartalomszerkesztés + nyitókép-feltöltés → a nyilvános oldalon megjelent.
- **Tartósság újratelepítés után** (új konténer, 3103e0a): foglalás, jelentkezés, érdeklődés, 2 program, 2 időpont, szerkesztett alcím, feltöltött nyitókép és programkép mind megmaradt (képek HTTP 200). A tesztszerkesztést utána visszaállítottam.
- Javítva a telepített változat alapján: a tesztelőnézet-sáv felül jelent meg (most alul tapad), információs ikon, jelentkezésnél „jelentkezésedet”, kikapcsolt levélküldésnél nyugodt tájékoztatás a „sikertelen levelek” riasztás helyett, admin jelszócsere (Fiók oldal).
- Semgrep: a munkamenet elején jelzett „1 finding” a korábbi CORS-szabály (`javascript.express.security.cors-misconfiguration`, `server/app.mjs`) volt, akkor javítva (engedélyezőlistából visszaadott érték). A Guardian-szkennert a jelenlegi összes szerver- és kulcsfontosságú frontendfájlra lefuttatva: 0 találat; pozitív kontroll (szándékosan hibás mintafájl) jelzett, tehát a szkenner működött. Függőségek külön: `npm audit --omit=dev` → 0 sebezhetőség.

**2026-09-26 — Railway-előkészítés**
- A korábbi „exit code 127” értesítések oka igazolva: a háttérben indított tesztszervert a tesztek után én állítottam le `Stop-Process`-szel, és Git Bash alatt Windowson ez 127-es kilépési kódot ad (reprodukálva: a szerver hibátlanul válaszolt a health-végponton, a kód csak a kényszerleállítás után jelent meg). A `node:test` tesztek nem külső szervert használnak: minden teszt saját, folyamaton belüli példányt indít véletlen porton, ideiglenes adatbázissal; a folyamatszintű tesztek üres környezettel és nem létező `.env`-vel indulnak, így a fejlesztői `.env` sem szivároghat be. A 4173-as portot egy másik projekt (`kiosz`) `vite preview` folyamata foglalja — a tesztek sosem használták. Kockázat volt viszont, hogy az `npm run dev` csendben másik portra lép, miközben a levelek a 4173-ra mutatnak → a Vite most foglalt portnál leáll.
- `npm test`: **23/23 sikeres**. Új: Resend-integráció helyi hamis API-val (Bearer-kulcs, Idempotency-Key, válaszcímek, https lemondási és admin link; 422-es szolgáltatói hiba → a foglalás megmarad, a levél „Sikertelen”, újraküldés ugyanazzal a kulccsal; az ismételt beküldés nem hoz létre új foglalást; az API-kulcs nem kerül a naplóba); production-konfiguráció 9 hibaesete; valódi `server/index.mjs --production` folyamat: titok vagy admin nélkül leáll, Secure süti, jelentkezés + tartalom + kép megmarad újraindítás után, mentés → módosítás → visszaállítás → újraindítás, mentésmappán kívüli útvonal elutasítva, jelszócsere után a régi munkamenet és jelszó érvénytelen, a jelszó nem kerül a kimenetbe, és az `ADMIN_PASSWORD` nem írja felül a már létező admint.
- `npm run build`: sikeres.
- Böngésző (production mód, gyökérről, ideiglenes kötettel): főoldal és képek, régi `/mesegombolyag/` → 301, jogi oldalak és linkjeik (lábléc, űrlapok), admin figyelmeztetés a hiányzó jogi szövegekre, mentett impresszum megjelenik, 390 px-en nincs kilógás, nincs konzolhiba vagy hibás kérés.
- **Nem tesztelt:** valódi Railway-telepítés; valódi Resend-kézbesítés (nincs hitelesített domain és API-kulcs).

**2026-09-25 — funkcionális kör**
- Szerveroldali tesztek: jogosultság (401 minden admin végponton, hamis és lejárt token), nyilvános API személyes adat nélkül, párhuzamos foglalás ugyanarra az időpontra, ismételt beküldés, lezárt/múltbeli időpont, lemondás → felszabadulás, csoportos jelentkezés + párhuzamos utolsó hely, duplikált e-mail, meseműhely egy rekorddal, zárt/elmarad/múltbeli/piszkozat, érdeklődési típusok, e-mail-hiba melletti mentés, vendég lemondási link izolációja, tartalom- és képfeltöltés, óraátállítás, belépési korlát.
- Böngészős végigkattintás (foglalás, érdeklődés, jelentkezés, admin, lemondás, tartalom- és képcsere, hálózati/500-as hiba), reszponzív 360/390/768/1440 px, levelek renderelése 360 px-en, munkamenet lejárata használat közben.

## Javított fontosabb hibák

2026-09-25:
1. A nyilvános API minden foglaló személyes adatát kiadta → megszüntetve.
2. Nem volt adatbázis; programok/időpontok kódba égetve → SQLite + admin CRUD.
3. Nem lehetett időpontot választani → valódi időpontválasztó szerveroldali újraellenőrzéssel.
4. Lemondott jelentkezés is foglalta a helyet; nem volt duplikáció- és párhuzamossági védelem → egységes szabály + DB-triggerek.
5. CORS bármely originnek; tetszőleges tartalomkulcs mentése → engedélyezőlista, validáció.
6. Az admin tartalommentése nem jelent meg → a nyilvános oldal az adatbázisból olvas.
7. Hibás horgonylinkek `HashRouter` mellett → görgetés.
8. `.env` nem volt gitignore-ban; jelszó-hash-es JSON commitolva → kivéve a követésből.
9. Nyitókép 1,2 MB → 125 KB. 10. Admin mobilon kilógott → javítva. 11. Nem használt Google Fonts betöltés → eltávolítva.

2026-09-26:
12. Az `npm run dev` foglalt portnál csendben portot váltott (a levélhivatkozások ilyenkor egy másik alkalmazásra mutattak volna) → leáll.
13. Az SMTP Railway Free/Trial/Hobby csomagon nem használható → Resend HTTPS API külön modulban, idempotens újraküldéssel.
14. A health-végpont kiadta a levélküldési módot → csak `status: ok` + adatbázis-ellenőrzés.
15. A régi, git-előzményekben szereplő jelszó-hash production módban nem kerülhet be (a JSON-átemelés csak fejlesztői módban fut); a jelszócsere érvényteleníti a munkameneteket.

## Hátralévő feladatok / élesítést akadályozó tényezők

1. **Railway-telepítés:** push, projekt, Volume `/data`, változók — lépésenként a `DEPLOY_RAILWAY.md`-ben. A GitHub Pages workflow-t push előtt kikapcsolni.
2. **Levélküldés:** Johanna saját domainje kell (Gmail-címről a Resend nem küldhet), a domain hitelesítése a Resendben (SPF/DKIM), `RESEND_API_KEY`, `MAIL_FROM`, majd egy tesztlevél. Addig `MAIL_TRANSPORT=disabled`-del indítható (a foglalások mentődnek, levél nem megy).
3. **Adatkezelési tájékoztató és impresszum:** az oldalak (`#/adatkezeles`, `#/impresszum`) és a hivatkozások (lábléc, minden űrlap) elkészültek; a szöveget az adminban kell beilleszteni. Amíg üres, az oldal ezt jelzi, az admin figyelmeztet. Kitalált jogi szöveg nincs publikálva.
4. **Admin jelszó:** élesben friss adatbázis indul, a régi hash nem kerül át; új `ADMIN_PASSWORD` és új `JWT_SECRET` kell.
5. **Eredeti ügyfélszöveg — ellenőrizetlen:** az eredeti ügyfélanyag nincs a projektben; a kért szakaszok és idézetek megvannak, árak nem jelennek meg.
6. A helyi `data/` alatti régi érdeklődések korábbi tesztadatok (`example.hu`).
7. Nem kötelező: az `@supabase/supabase-js` függőség nincs használatban.

## Johannától szükséges adatok és dokumentumok

1. Adatkezelési tájékoztató végleges, jogilag ellenőrzött szövege (űrlapokon gyűjtött adatok: név, e-mail, telefon, üzenet; adatfeldolgozók: Railway tárhely, Resend levélküldő; megőrzési idő; érintetti jogok).
2. Impresszum adatai: szolgáltató neve (egyéni vállalkozó / cég), székhely, nyilvántartási szám, adószám, elérhetőség, tárhelyszolgáltató.
3. Saját domain (pl. mesegombolyag.hu) és hozzáférés a DNS-beállításaihoz.
4. Értesítési cím (`ADMIN_EMAIL`) és feladócím (`MAIL_FROM`).
5. Publikus telefonszám, ha meg szeretné jeleníteni.
6. Az eredeti szövegek forrása az összevetéshez.
7. Railway-csomag döntés (Hobby vagy Pro) és számlázási adatok.

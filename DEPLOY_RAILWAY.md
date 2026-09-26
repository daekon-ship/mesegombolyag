# Mesegombolyag telepítése Railway-re

Állapot: lásd `.claude/daekon/PROJECT.md` → „Telepítési állapot”. A Railway-változat a **`railway` ágon** van; a `main` ág továbbra is a GitHub Pages-es látványtervet adja.

## 1. Projekt és szolgáltatás

1. railway.com → **New Project → Deploy from GitHub repo** → `daekon-ship/mesegombolyag` (ág: **`railway`**).
   - A GitHub Pages workflow csak `main`-re fut, ezért a `railway` ág pusholása nem írja felül a megosztott látványtervet. Ha a Railway lesz az éles hely, a `railway` ág beolvasztható a `main`-be — előtte a Pages workflow-t ki kell kapcsolni.
2. Egyetlen szolgáltatás kell (webes felület + API együtt). **Replika: 1** — kötettel a Railway nem enged több replikát, és az SQLite-hoz ez így helyes.
3. A build- és indítási beállításokat a repóban lévő `railway.json` adja:
   - build: Railpack, `npm run build` (típusellenőrzés + Vite build; a Node-verziót a `package.json` `engines` mezője rögzíti: 24.x)
   - start: `npm start` (= `node server/index.mjs --production`)
   - healthcheck: `/api/health`, újraindítás hiba esetén, 15 mp türelmi idő leállításkor.
4. **Settings → Networking → Generate Domain** (pl. `mesegombolyag.up.railway.app`), vagy saját domain.

## 2. Tartós tárhely (Volume) — kötelező

**Service → Settings → Volumes → New Volume**, csatolási útvonal: **`/data`**.

- Az alkalmazás a `RAILWAY_VOLUME_MOUNT_PATH` alatt tárol mindent: `mesegombolyag.db` (SQLite), `uploads/` (admin képfeltöltések), `backups/` (mentések).
- A kötet csak futásidőben csatolódik (buildkor nem), az adatbázis-inicializálás és a migrációk induláskor futnak, és meglévő adatot nem írnak felül.
- Production módban **kötet nélkül a szerver nem indul el** (szándékosan: különben újratelepítéskor minden adat elveszne).
- Méretkorlát: a fiók tényleges keretében (Hobby, 2026-09-26-án lekérdezve) **0,5 GB kötetenként**; a Railway dokumentációja Hobby csomagra 5 GB-ot ír, de a fiókra érvényes limit 0,5 GB. Újratelepítéskor rövid (néhány másodperces) leállás van, mert egyszerre csak egy példány csatolhatja a kötetet.

## 3. Környezeti változók (Service → Variables)

| Változó | Kötelező | Érték |
|---|---|---|
| `JWT_SECRET` | igen | 64 hexa karakter: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ADMIN_PASSWORD` | első indításkor | új, erős jelszó (min. 12 karakter). **Az első belépés után töröld.** |
| `ADMIN_USERNAME` | nem | alapértelmezés: `mesegombolyag` |
| `ADMIN_EMAIL` | igen | Johanna értesítési címe |
| `MAIL_TRANSPORT` | igen | `resend` (vagy `disabled`, ha átmenetileg levél nélkül indul) |
| `RESEND_API_KEY` | resendnél | a Resend API-kulcs (csak küldési jogosultsággal) |
| `MAIL_FROM` | resendnél | `Mesegombolyag <ertesites@HITELESITETT-DOMAIN>` |
| `PUBLIC_SITE_URL` | saját domainnél | `https://…` — railway.app domainnél elhagyható (a `RAILWAY_PUBLIC_DOMAIN`-ből képződik) |
| `PREVIEW_MODE` | tesztelőnézetben | `1` → minden oldalon „Tesztelőnézet — még nem éles” sáv; élesítéskor töröld |

A `PORT`, `RAILWAY_VOLUME_MOUNT_PATH` és `RAILWAY_PUBLIC_DOMAIN` változót a Railway maga adja. Hiányzó vagy gyenge kötelező érték esetén a szerver induláskor egyértelmű hibalistával leáll (Deploy Logs).

## 4. Levélküldés

A Railway Free, Trial és Hobby csomagban az SMTP nem használható, ezért a levelek HTTPS API-n (Resend) mennek.

1. resend.com → **Domains → Add Domain** — Johanna saját domainje kell (Gmail-címről küldeni nem lehet). A megadott DNS-rekordokat (SPF, DKIM) be kell állítani a domain szolgáltatójánál, és megvárni a „Verified” állapotot.
2. **API Keys → Create** (Permission: *Sending access*, csak erre a domainre) → `RESEND_API_KEY`.
3. `MAIL_FROM` = egy cím ezen a domainen. A látogatói levelek válaszcíme Johanna kapcsolati címe (adminból szerkeszthető), a Johannának szóló értesítéseké a látogató címe.
4. Pro csomagon SMTP is választható: `MAIL_TRANSPORT=smtp` + `SMTP_*`.

Hibás küldés nem akadályozza a foglalást; a levél az **Admin → Levélnapló** oldalon „Sikertelen” állapotban látszik, és újraküldhető. Az újraküldés ugyanazt az idempotencia-kulcsot használja, így 24 órán belül nem kézbesítődik duplán.

## 5. Első belépés

1. A telepítés után nyisd meg: `https://<domain>/#/admin`.
2. Felhasználónév: az `ADMIN_USERNAME` (alapból `mesegombolyag`). Az első jelszó a Railway-en látható: **Service → Variables → `ADMIN_PASSWORD`** (a szem ikonnal).
3. Belépés után: **Admin → Fiók → Jelszó módosítása** — adj meg egy saját, legalább 12 karakteres jelszót. A csere minden más eszközt kijelentkeztet.
4. Ezután **töröld az `ADMIN_PASSWORD` változót** a Railway-en (a jelszó már csak hash-ként van az adatbázisban; a változó létező admin mellett amúgy sem írja felül).
5. Elfelejtett jelszó: `railway ssh` → `npm run admin:password` (a beírt jelszó nem látszik, minden munkamenet érvénytelen lesz). Csak kijelentkeztetés: `npm run admin:password -- --revoke-only`. A `JWT_SECRET` cseréje is minden munkamenetet érvénytelenít.

**Automatikus telepítés:** a `railway` ágra történő push a jelenlegi projektben **nem** indít automatikusan új telepítést (2026-09-26-án tapasztalva). Új verzióhoz: Railway → a szolgáltatás → **Deployments → Deploy latest commit** (vagy a forrás újracsatolása). Ha automatikus telepítést szeretnél: Service → Settings → Source → a GitHub-kapcsolat ellenőrzése (a Railway GitHub-alkalmazásnak hozzáférés kell a repóhoz).

## 6. Telepítés utáni ellenőrzés

1. `https://<domain>/api/health` → `{"ok":true,"data":{"status":"ok"}}`
2. Főoldal betölt, képek látszanak; `https://<domain>/api/nincs` → JSON 404.
3. Admin belépés; **Oldaltartalom**: adatkezelési tájékoztató és impresszum kitöltése (amíg üres, az Áttekintés figyelmeztet).
4. Admin: egy teszt-időpont meghirdetése → foglalás egy saját tesztcímmel → a visszaigazoló levél megérkezik; a benne lévő lemondási link a `https://<domain>/#/lemondas/…` címre mutat és működik; Johanna értesítője megérkezik. A tesztfoglalást utána mondd le, az időpontot töröld.
5. Egy képfeltöltés, majd **Restart** → a kép és az adatok megvannak.
6. Levélnapló: minden levél „Elküldve”.

## 7. Mentés és visszaállítás

- **Railway beépített kötetmentés:** a jelenlegi (Hobby) keretben **nem elérhető** (a fiók limitje: 0 mentés). Pro csomagon: Service → Volume → Backups.
- **Alkalmazásszintű mentés** (adatbázis + feltöltött képek a kötetre):
  - `railway ssh` → `npm run backup` → a mentés a `/data/backups/mentes-<időbélyeg>/` mappába kerül (futó szerver mellett is konzisztens, `VACUUM INTO`). Lista: `npm run backup -- --list`.
  - Visszaállítás: `npm run restore -- mentes-<időbélyeg>` → majd a szolgáltatás **Restart**-ja. A visszaállítás induláskor, az adatbázis megnyitása előtt fut; a felülírt adatok a `/data/pre-restore-<időbélyeg>/` mappába kerülnek.
  - A kötetre írt mentés a kötettel együtt veszhet el. Éles indulás előtt ki kell alakítani a kötetről a saját gépre (vagy tárolóba) történő letöltést — ez a lépés **még nincs kipróbálva**, ezért itt nem adunk meg parancsot.

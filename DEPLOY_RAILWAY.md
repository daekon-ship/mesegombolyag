# Mesegombolyag telepítése Railway-re

Állapot: **előkészítve, még nincs telepítve.** A konfiguráció helyben, production módban tesztelve (lásd `.claude/daekon/PROJECT.md`).

## 1. Projekt és szolgáltatás

1. railway.com → **New Project → Deploy from GitHub repo** → `daekon-ship/mesegombolyag` (ág: `main`).
   - Előtte a helyi commitokat pusholni kell (`git push`). A push a régi GitHub Pages workflow-t is elindítja — ez a statikus változat backend nélkül; érdemes a `.github/workflows/deploy.yml`-t kikapcsolni vagy törölni, ha a Railway lesz az éles hely.
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
- Méretkorlát: Free/Trial 0,5 GB, Hobby 5 GB, Pro 50 GB. Újratelepítéskor rövid (néhány másodperces) leállás van, mert egyszerre csak egy példány csatolhatja a kötetet.

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
2. Felhasználónév: az `ADMIN_USERNAME` (alapból `mesegombolyag`), jelszó: az `ADMIN_PASSWORD`.
3. Sikeres belépés után **töröld az `ADMIN_PASSWORD` változót** (a jelszó az adatbázisban hash-ként marad).
4. Jelszócsere később: `railway ssh` → `npm run admin:password` (a beírt jelszó nem látszik, és minden korábbi munkamenet érvénytelen lesz). Csak kijelentkeztetés: `npm run admin:password -- --revoke-only`. A `JWT_SECRET` cseréje is minden munkamenetet érvénytelenít.

## 6. Telepítés utáni ellenőrzés

1. `https://<domain>/api/health` → `{"ok":true,"data":{"status":"ok"}}`
2. Főoldal betölt, képek látszanak; `https://<domain>/api/nincs` → JSON 404.
3. Admin belépés; **Oldaltartalom**: adatkezelési tájékoztató és impresszum kitöltése (amíg üres, az Áttekintés figyelmeztet).
4. Admin: egy teszt-időpont meghirdetése → foglalás egy saját tesztcímmel → a visszaigazoló levél megérkezik; a benne lévő lemondási link a `https://<domain>/#/lemondas/…` címre mutat és működik; Johanna értesítője megérkezik. A tesztfoglalást utána mondd le, az időpontot töröld.
5. Egy képfeltöltés, majd **Restart** → a kép és az adatok megvannak.
6. Levélnapló: minden levél „Elküldve”.

## 7. Mentés és visszaállítás

- **Railway beépített mentés** (ajánlott, a teljes kötetet menti): Service → Volume → **Backups** — kézi mentés, vagy ütemezett (napi/heti). Visszaállítás ugyanott.
- **Alkalmazásszintű mentés** (adatbázis + feltöltött képek a kötetre):
  - `railway ssh` → `npm run backup` → a mentés a `/data/backups/mentes-<időbélyeg>/` mappába kerül (futó szerver mellett is konzisztens, `VACUUM INTO`). Lista: `npm run backup -- --list`.
  - Visszaállítás: `npm run restore -- mentes-<időbélyeg>` → majd a szolgáltatás **Restart**-ja. A visszaállítás induláskor, az adatbázis megnyitása előtt fut; a felülírt adatok a `/data/pre-restore-<időbélyeg>/` mappába kerülnek.
  - A kötetre írt mentés a kötettel együtt veszhet el — fontos időpontok előtt a Railway Backups funkciót is használd.

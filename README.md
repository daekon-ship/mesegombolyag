# Mesegombolyag

Tóth Johanna meseterapeuta weboldala egyéni időpontfoglalással, csoportos programokra (mesés workshop, meseműhely) való jelentkezéssel, érdeklődési űrlappal és adminfelülettel.

## Indítás

Szükséges: Node.js 22.13 vagy újabb (a beépített `node:sqlite` miatt).

```bash
npm install
cp .env.example .env   # töltsd ki (titkos értékek, ne kerüljön git-be)
npm run dev            # fejlesztés: http://localhost:4173/mesegombolyag/ (API: :3001)
npm test               # szerveroldali tesztek
npm run build          # production build
npm start              # production: API + frontend egy folyamatban, http://localhost:3001/mesegombolyag/
```

Admin: `/#/admin`. Az első admin felhasználó az `ADMIN_USERNAME` és `ADMIN_PASSWORD` változókból jön létre.

A beállítások leírása a `.env.example` fájlban, a részletes projektállapot, az üzleti szabályok és a hátralévő feladatok a `.claude/daekon/PROJECT.md` fájlban találhatók.

## Élesítés

A rendszernek Node.js-t futtató szerver kell, tartós tárolóval (`data/`). A statikus tárhely (pl. GitHub Pages) önmagában nem elég, mert ott nem fut a backend.

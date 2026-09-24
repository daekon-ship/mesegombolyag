# Mesegombolyag

Ez a projekt a Mesegombolyag meglévő látványtervére épülő, production-ready webes rendszer alapja. A cél, hogy a meglévő premium design és brand hangulat megmaradjon, miközben a látogató képes legyen:

- egyéni időpontot foglalni,
- csoportos programra jelentkezni,
- eseményre regisztrálni,
- admin felületen kezelni a foglalásokat és eseményeket.

## Fejlesztői indulás

1. `npm install`
2. Másold a `.env.example` tartalmát `.env` fájlba.
3. A Vite környezethez a következő változók szükségesek:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ADMIN_EMAIL`
   - `VITE_ADMIN_PASSWORD`
4. `npm run dev`

## Build

```bash
npm run build
```

## Admin hozzáférés

A demo admin bejelentkezés alapértelmezett értékei:

- e-mail: `admin@mesegombolyag.hu`
- jelszó: `mesegombolyag-demo`

A production környezetben ezt Supabase Auth + RLS policy alapján kell lecserélni valódi admin felhasználókra.

## Supabase architektúra javaslat

A rendszer így épül fel:

- `profiles` — admin és felhasználói profilok
- `services` — egyéni szolgáltatások, időtartam, ár
- `availability` — admin által definiált szabad időpontok
- `individual_bookings` — egyéni foglalások
- `groups` — csoportos programok
- `group_registrations` — csoportos jelentkezések
- `events` — események
- `event_registrations` — eseményjelentkezések
- `site_content` — oldaltartalom szerkesztése

## Későbbi production lépések

- Supabase Auth és Row Level Security beállítása
- Resend / transactional email konfiguráció
- Vercel deployment és env változók bekötése
- admin felület bővítése tényleges CRUD műveletekkel
- valódi adatbázis migrációk és schema fájlok hozzáadása

## Admin használati útmutató

- A főoldalról a navban az Admin gombra kattintva nyílik meg a belépő.
- A demo bejelentkezés után az admin dashboard mutatja a közelgő foglalásokat, csoportokat és eseményeket.
- A demo rendszer helyi, frontend szintű state alapján működik, így a biztonságos production implementációhoz szükséges a Supabase + RLS beüzemelése.

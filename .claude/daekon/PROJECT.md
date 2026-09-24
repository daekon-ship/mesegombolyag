# Mesegombolyag — Project State

**Client:** Tóth Johanna, meseterapeuta (Szeged)
**Type:** Látványterv (visual concept) — a real, running React prototype, not a static mockup
**Stack:** Vite + React 18 + TypeScript + Tailwind CSS v4 + Framer Motion + Lucide React
**Stage:** First coherent implementation, self-reviewed and bug-fixed. Not yet shown to the client for approval.

## Run it

```
npm install
npm run dev      # http://localhost:5173/
npm run build    # production build, currently passing clean (tsc --noEmit && vite build)
```

## What exists

All 11 sections from the brief: header/nav, hero, intro statement, "Miben segíthet a mese" (3 themes), "Alkalmak és folyamatok" (6 occasion cards), "Rólam" (Johanna bio), "Hogyan zajlik" (4-step process), testimonial placeholder, "Gondolatok"/Instagram teaser, contact CTA (mailto), footer.

## Real assets used

Three real photos were selected and cropped from Johanna's own saved Instagram export (`(1) Instagram_files/`), per the brief's priority order:
- `src/assets/photos/johanna-portrait-fixed.jpg` — hero/about portrait (candid, cropped by the user directly from a source Instagram photo of Johanna in her practice space; supersedes an earlier draft crop of the same source image).
- `src/assets/photos/workshop-circle.jpg` — evening courtyard storytelling circle, used in the About section.
- `src/assets/photos/picnic-fabrics.jpg` — outdoor creative-materials moment, used in the Journal section.

No AI-generated portraits, no stock photography, per the brief.

## Visual direction (see VISUAL_DIRECTION.md)

Palette and typography were grounded directly in Johanna's own existing Instagram graphics (confirmed by inspecting her saved posts before designing), not invented from scratch — this is why the concept should already feel "on brand" to her rather than generic.

## Known-fixed issues this session

- Mobile fullscreen nav menu was rendering transparently (content bled through) because `backdrop-blur` on the `<header>` created a CSS containing block that broke the menu's `position: fixed`. Fixed by moving the blur to an inner wrapper.
- The botanical branch motif (root/branch SVG used in "Miben segíthet a mese" and the contact CTA) was only partially drawing — roughly half of each icon's paths never animated in. Root cause: many sibling `motion` elements each running their own independent `whileInView` observer was unreliable. Fixed by switching to a single parent `whileInView` + Framer Motion `variants`, which is also the more standard pattern — applied to both `BranchMotif` and `ThreadDivider`.
- Desktop hero (1024–1440px) read as "slipped"/unbalanced after several earlier attempts to fix it with spacing tweaks. Measured the actual computed layout instead of guessing: (1) `lg:pt-44` left a 104px dead gap under the 72px-tall fixed header, and the padding scale *grew* at wider breakpoints instead of staying roughly constant; (2) `lg:ml-auto` on the portrait never actually right-aligned it, because the still-active `mx-auto` also sets `margin-right: auto` and nothing cancelled it — the portrait sat centered in its column with 64px of dead space on both sides instead of flush right; (3) the text column's `max-w-xl` (576px) didn't fill its own 605px-wide grid track. Net effect: a 124px gap between text and portrait instead of the intended ~32px. Fixed all three in `Hero.tsx` (tightened `pt`/`pb` scale, `lg:max-w-none` on the text column, `lg:mr-0 lg:ml-auto` + a larger `lg:max-w-[500px]` on the portrait) — gap is now 80px and both columns fill their tracks. Also found the desktop nav switches on at exactly `lg` (1024px) with no room to breathe (nav butts against the CTA button); moved the nav/hamburger breakpoint from `lg` to `xl` (1280px) in `Header.tsx` so 1024–1279px keeps the clean hamburger instead of a cramped inline row.

## Explicitly not done (concept-scope only, per the brief)

No real backend, auth, payments, or CMS — content is static JSX, matching "only a látványterv" scope. Several content spots are marked `TODO` in both the UI (visible italic notes) and code comments where the brief said to flag missing client-confirmed information: the step-by-step process, testimonials, phone number, privacy policy/impresszum, and the four "egyeztetés alatt" occasion cards.

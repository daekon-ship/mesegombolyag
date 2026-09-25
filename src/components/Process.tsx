import { motion } from "framer-motion";
import { fadeUpStagger } from "../lib/motion";

const STEPS = [
  {
    title: "Belépés a mesei térbe",
    text: "Az alkalom egy nyugodt, biztonságos helyzetből indul, ahol megállhatsz és meg tudod osztani, mi hozott ide.",
  },
  {
    title: "Összekapcsolás a mesével",
    text: "A mese és a személyes helyzet között egy látens, még rejtett kapcsolat kezdi megmutatni magát.",
  },
  {
    title: "Élőszavas mesemondás",
    text: "A történet hangulatának és ritmusának segítségével a szimbolikus világ belép a jelenbe.",
  },
  {
    title: "Érzékszervi tapasztalatok",
    text: "A képek, a hangok, a mozgás és a tér együtt segítenek a mélyebb megértéshez.",
  },
  {
    title: "Képzelet és kreativitás használata",
    text: "A saját belső világ felé nyitás során a képzelet új utakat találhat meg a megértéshez.",
  },
  {
    title: "Érzések megfogalmazása",
    text: "Az érzések neve és helye fontos, hogy ne csak megtapasztaljuk őket, hanem tudatosan is megértsük.",
  },
  {
    title: "Személyes sík bekapcsolódása",
    text: "A történetből a mindennapi valóság felé fordulunk, és a tanulságot a saját életünkbe kapcsoljuk.",
  },
  {
    title: "Egymás meghallgatása",
    text: "A folyamat végén helyet kap a nyugalom, a tisztánlátás, és az, hogy a másik hangját is meghalljuk.",
  },
];

/**
 * 06 · Mi történik egy meseterápiás alkalmon?
 * Az elemek az alkalmak jellemző részeiként jelennek meg — nem merev
 * lépéssorként, ezért nincs sorszámozás, csak finom vizuális ritmus.
 */
export function Process() {
  return (
    <section className="bg-sage/45 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 lg:px-12">
        <div className="text-center">
          <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-terracotta">
            Mi történik egy meseterápiás alkalmon?
          </p>
          <h2 className="mx-auto max-w-[38ch] font-serif text-[1.9rem] leading-tight text-forest sm:text-[2.3rem]">
            Minden csoportos alkalomnak és egyéni folyamatnak középpontjában a
            mesékkel való kapcsolódás áll.
          </h2>
        </div>

        <ul className="mt-16 grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <motion.li
              key={step.title}
              {...fadeUpStagger(i, 4)}
              className="relative rounded-[22px] border border-forest/10 bg-paper/70 p-5"
            >
              <span
                aria-hidden="true"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-forest/8 font-serif text-sm text-forest"
              >
                {i + 1}
              </span>
              <h3 className="mt-3 font-serif text-[1.15rem] leading-snug text-forest">
                {step.title}
              </h3>
              <p className="mt-2 font-sans text-[14.5px] leading-relaxed text-ink/75">
                {step.text}
              </p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

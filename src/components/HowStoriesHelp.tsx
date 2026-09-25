import { motion } from "framer-motion";
import { BranchMotif } from "./motifs/BranchMotif";
import { fadeUp } from "../lib/motion";

const THEMES = [
  "stresszkezelés",
  "reziliencia – a lelki immunrendszer erősítése",
  "döntéshozatal",
  "konfliktuskezelés",
  "veszteségek feldolgozása",
  "női szerepek",
  "életválságok és életciklusváltások kezelése",
];

/**
 * 03 · Miben segíthet a mese?
 * Bevezető szöveg és a csoportokon gyakran előkerülő témák listája.
 */
export function HowStoriesHelp() {
  return (
    <section className="bg-paper py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <motion.p
              {...fadeUp(0, 14)}
              className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-terracotta"
            >
              Miben segíthet a mese?
            </motion.p>
            <motion.h2
              {...fadeUp(0.1)}
              className="max-w-[24ch] font-serif text-[1.9rem] leading-tight text-forest sm:text-[2.4rem]"
            >
              A mesék nem kész megoldásokat kínálnak. Inkább kapaszkodókat, új
              nézőpontokat és egy kis teret ahhoz, hogy meghalld a saját
              válaszaidat.
            </motion.h2>

            <BranchMotif
              className="mt-10 hidden h-44 w-24 text-forest/70 lg:block"
              color="var(--color-mauve)"
            />
          </div>

          <motion.div {...fadeUp(0.15, 20)}>
            <h3 className="font-serif text-xl text-forest sm:text-2xl">
              Témák, amik a csoportjaimon gyakran előkerülnek:
            </h3>
            <ul className="mt-6 flex flex-col divide-y divide-forest/10 border-y border-forest/10">
              {THEMES.map((theme, i) => (
                <motion.li
                  key={theme}
                  {...fadeUp(0.1 + i * 0.05, 12)}
                  className="flex items-center gap-4 py-4"
                >
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta/80"
                  />
                  <span className="font-sans text-[16px] leading-relaxed text-ink/80">
                    {theme}
                  </span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

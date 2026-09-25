import { motion } from "framer-motion";
import { BranchMotif } from "./motifs/BranchMotif";
import { fadeUp } from "../lib/motion";

const THEMES = [
  {
    title: "Belső erőforrások",
    text: "A mesehősök próbatételei szimbolikus térképet adnak ahhoz, hogy felismerjük saját erőforrásainkat — azt, ami már most is bennünk van, csak néha nehéz hozzáférni.",
    align: "left" as const,
  },
  {
    title: "Önismeret és kapcsolódás",
    text: "A közösen hallgatott vagy alkotott mese biztonságos távolságot ad ahhoz, hogy önmagunkra és egymásra is másképp figyeljünk.",
    align: "right" as const,
  },
  {
    title: "Megküzdés és újrakezdés",
    text: "A népmesék újra és újra a veszteségről, próbatételről és újjászületésről szólnak — mintát adva ahhoz, hogyan lehet egy nehéz fejezet után mégis továbblépni.",
    align: "left" as const,
  },
];

export function HowStoriesHelp() {
  return (
    <section id="mese" className="bg-paper py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-12">
        <motion.p
          {...fadeUp(0, 14)}
          className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-terracotta"
        >
          Miben segíthet a mese?
        </motion.p>
        <motion.h2
          {...fadeUp(0.1)}
          className="max-w-2xl font-serif text-[1.9rem] leading-tight text-forest sm:text-[2.4rem]"
        >
          A mese nem menekülés a valóság elől — hanem egy másik út befelé.
        </motion.h2>

        <div className="mt-16 flex flex-col gap-16 sm:mt-20 sm:gap-20">
          {THEMES.map((theme, i) => (
            <div
              key={theme.title}
              className={`flex flex-col items-start gap-6 sm:items-center sm:gap-10 ${
                theme.align === "right"
                  ? "sm:flex-row-reverse sm:justify-end"
                  : "sm:flex-row sm:justify-start"
              }`}
            >
              <BranchMotif
                className="h-28 w-16 shrink-0 sm:h-36 sm:w-20"
                color={i === 1 ? "var(--color-terracotta)" : i === 2 ? "var(--color-mauve)" : "var(--color-forest)"}
              />
              <motion.div
                {...fadeUp(0.05, 24)}
                className={`max-w-lg ${theme.align === "right" ? "sm:text-right" : ""}`}
              >
                <span className="font-serif text-5xl text-forest/15 sm:text-6xl">
                  0{i + 1}
                </span>
                <h3 className="mt-1 font-serif text-2xl text-forest sm:text-[1.7rem]">
                  {theme.title}
                </h3>
                <p className="mt-3 font-sans text-[15.5px] leading-relaxed text-ink/75">
                  {theme.text}
                </p>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

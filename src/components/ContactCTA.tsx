import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { BranchMotif } from "./motifs/BranchMotif";
import { fadeUp } from "../lib/motion";

export function ContactCTA() {
  return (
    <section
      id="kapcsolat"
      className="relative overflow-hidden bg-forest-deep py-28 text-paper sm:py-36"
    >
      <BranchMotif
        className="pointer-events-none absolute -left-6 top-0 h-full w-40 opacity-25 sm:w-56"
        color="var(--color-sage)"
      />
      <BranchMotif
        className="pointer-events-none absolute -right-6 top-0 h-full w-40 rotate-180 opacity-20 sm:w-56"
        color="var(--color-ochre)"
      />

      <div className="relative mx-auto max-w-2xl px-6 text-center sm:px-8">
        <motion.h2
          {...fadeUp(0)}
          className="text-balance font-serif text-[2rem] leading-[1.2] sm:text-[2.6rem]"
        >
          Lehet, hogy a következő történet már rólad szól.
        </motion.h2>
        <motion.p
          {...fadeUp(0.15, 16)}
          className="mx-auto mt-6 max-w-md font-sans text-[16px] leading-relaxed text-paper/75"
        >
          Ha megszólított a Mesegombolyag világa, írj Johannának, és induljon
          el egy személyes beszélgetéssel.
        </motion.p>
        <motion.a
          {...fadeUp(0.3, 16)}
          href="mailto:mesegombolyag@gmail.com"
          className="focus-ring mt-10 inline-flex items-center gap-2.5 rounded-full bg-terracotta px-8 py-4 font-sans text-[15px] font-semibold text-paper transition-colors hover:bg-ochre hover:text-ink"
        >
          <Mail className="h-[18px] w-[18px]" />
          Írok Johannának
        </motion.a>
      </div>
    </section>
  );
}

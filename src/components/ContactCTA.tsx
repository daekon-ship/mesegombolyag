import { motion } from "framer-motion";
import { ArrowRight, Instagram, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { BranchMotif } from "./motifs/BranchMotif";
import { fadeUp } from "../lib/motion";
import { useAppContext } from "../context/AppState";

export function ContactCTA() {
  const { siteContent } = useAppContext();
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
          className="mx-auto mt-6 max-w-[52ch] font-sans text-[16px] leading-relaxed text-paper/75"
        >
          Ha megszólított a Mesegombolyag világa, írj Johannának — vagy
          küldd el kérdésedet az érdeklődő űrlapon, és hamarosan
          visszajelzünk.
        </motion.p>
        <motion.div
          {...fadeUp(0.3, 16)}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            to="/erdeklodes"
            className="focus-ring group inline-flex items-center justify-center gap-2.5 rounded-full bg-terracotta px-8 py-4 font-sans text-[15px] font-semibold text-paper transition-colors hover:bg-ochre hover:text-ink"
          >
            <Mail className="h-[18px] w-[18px]" />
            Érdeklődöm
            <ArrowRight className="h-[16px] w-[16px] transition-transform group-hover:translate-x-0.5" />
          </Link>

          <a
            href={`mailto:${siteContent.contactEmail}`}
            className="focus-ring inline-flex items-center gap-2.5 rounded-full border border-paper/30 bg-paper/5 px-8 py-4 font-sans text-[15px] font-semibold text-paper transition-colors hover:bg-paper hover:text-forest"
          >
            <Mail className="h-[18px] w-[18px]" />
            Írás közvetlenül
          </a>

          <a
            href="https://www.instagram.com/tothjohanna_meseterapia/"
            target="_blank"
            rel="noreferrer"
            className="focus-ring inline-flex items-center gap-2 rounded-full border border-paper/30 px-6 py-4 font-sans text-[15px] font-semibold text-paper transition-colors hover:bg-paper/10"
            aria-label="Mesegombolyag Instagram profil"
          >
            <Instagram className="h-[18px] w-[18px]" />
            <span className="sr-only sm:not-sr-only">Instagram</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}

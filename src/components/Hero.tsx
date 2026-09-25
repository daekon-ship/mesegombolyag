import { motion } from "framer-motion";
import { ArrowRight, Mail } from "lucide-react";
import { HeroThread } from "./motifs/HeroThread";
import heroPortrait from "../assets/photos/hero-portrait.jpg";
import { softEase } from "../lib/motion";

const fadeUp = {
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
};

export function Hero() {
  return (
    <section
      id="hero"
      className="paper-grain relative overflow-hidden pb-16 pt-24 sm:pb-20 sm:pt-28 lg:pb-24 lg:pt-32"
    >
      <HeroThread className="pointer-events-none absolute inset-y-0 left-0 hidden h-full w-[420px] opacity-80 lg:block" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:justify-items-center lg:gap-8 lg:px-12">
        <div className="relative z-10 max-w-xl lg:max-w-none lg:justify-self-start">
          <motion.p
            {...fadeUp}
            transition={{ duration: 0.7, delay: 0.05, ease: softEase }}
            className="mb-5 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-terracotta"
          >
            Mesegombolyag · Tóth Johanna
          </motion.p>

          <motion.h1
            {...fadeUp}
            transition={{ duration: 0.8, delay: 0.15, ease: softEase }}
            className="font-serif text-[2.5rem] leading-[1.12] tracking-tight text-forest sm:text-[3.1rem] lg:text-[3.6rem]"
          >
            A történetek néha ott találnak meg, ahol a szavaink elfogynak.
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.7, delay: 0.28, ease: softEase }}
            className="mt-6 font-script text-2xl text-mauve sm:text-[1.7rem]"
          >
            A mese és a személyes figyelem helye.
          </motion.p>

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.7, delay: 0.38, ease: softEase }}
            className="mt-6 max-w-md font-sans text-[17px] leading-relaxed text-ink/80"
          >
            A mese és a személyes figyelem helye: itt a nyugalom, a
            kreativitás és a bizalom adhat új irányt a nehéz pillanatokhoz.
          </motion.p>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.7, delay: 0.5, ease: softEase }}
            className="mt-9 flex flex-col gap-3.5 sm:flex-row sm:items-center"
          >
            <a
              href="#alkalmak"
              className="focus-ring group inline-flex items-center justify-center gap-2 rounded-full bg-forest px-6 py-3.5 font-sans text-[15px] font-semibold text-paper transition-colors hover:bg-terracotta"
            >
              Felfedezem az alkalmakat
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#kapcsolat"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-forest/25 px-6 py-3.5 font-sans text-[15px] font-semibold text-forest transition-colors hover:border-forest hover:bg-forest/5"
            >
              <Mail className="h-4 w-4" />
              Kapcsolat Johannával
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: softEase }}
          className="relative mx-auto flex w-full items-center justify-center px-0 sm:max-w-[420px] lg:max-w-[480px] lg:justify-self-center"
        >
          <div
            className="relative mx-auto aspect-[3/4] w-full max-w-[360px] overflow-hidden bg-sage shadow-[0_18px_48px_rgba(32,58,50,0.12)] ring-1 ring-forest/10 sm:w-[92%] sm:max-w-[360px] lg:w-[86%] lg:max-w-[420px]"
            style={{
              borderRadius: "58% 42% 47% 53% / 55% 48% 52% 45%",
              margin: 0,
              padding: 0,
              transform: "translateX(0)",
            }}
          >
            <img
              src={heroPortrait}
              alt="Tóth Johanna mosolyogva a természetes fényben"
              className="h-full w-full object-cover"
              style={{
                objectPosition: "62% 22%",
                transform: "translateX(3%) scale(1.03)",
              }}
              loading="eager"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

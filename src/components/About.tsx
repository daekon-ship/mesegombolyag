import { motion } from "framer-motion";
import { ResponsiveImage } from "./ResponsiveImage";
import { groupCirclePhoto } from "../lib/photos";
import { fadeUp } from "../lib/motion";

/**
 * 05 · Rólam
 * Johannaportré a kerti közösségi kör fotójával és a bevezető szöveggel.
 */
export function About() {
  return (
    <section id="rolam" className="bg-paper py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:px-12">
        <motion.div {...fadeUp(0, 28)} className="relative mx-auto w-full max-w-sm lg:mx-0">
          <div
            className="relative overflow-hidden"
            style={{ borderRadius: "18% 82% 30% 70% / 62% 24% 76% 38%" }}
          >
            <ResponsiveImage photo={groupCirclePhoto} loading="lazy" />
          </div>
          <p className="mt-4 text-center font-sans text-xs italic text-ink/50">
            Egy esti meseest közösségben
          </p>
        </motion.div>

        <div>
          <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-terracotta">
            Rólam
          </p>
          <motion.h2
            {...fadeUp(0)}
            className="font-serif text-[1.9rem] leading-tight text-forest sm:text-[2.4rem]"
          >
            Aki a történetek fonalát tartja
          </motion.h2>

          <motion.p
            {...fadeUp(0.22, 14)}
            className="mt-6 max-w-[62ch] font-sans text-[16px] leading-relaxed text-ink/80"
          >
            Azért hoztam létre a Mesegombolyagot, mert szeretnék egy olyan
            teret és közösséget, ahol szabadon lehet megállni, gondolkodni,
            kapcsolódni – és közben a mesék segítségével közelebb kerülni
            önmagunkhoz. Hiszen a mesék nem csak gyerekeknek szólnak, a
            felnőtteknek is szükségük van a népmesékben rejlő tudásra,
            tapasztalatra és csodára.
          </motion.p>

          <motion.div {...fadeUp(0.3, 14)} className="mt-8">
            <p className="font-script text-2xl text-mauve">Tóth Johanna</p>
            <p className="mt-1 font-sans text-sm text-ink/60">
              meseterapeuta és mentálhigiénés szakember
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

import { motion } from "framer-motion";
import workshopCircleNew from "../assets/photos/workshop-circle-new.jpg";
import { fadeUp } from "../lib/motion";

export function About() {
  return (
    <section id="rolam" className="bg-paper py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:px-12">
        <motion.div
          {...fadeUp(0, 28)}
          className="relative mx-auto w-full max-w-sm lg:mx-0"
        >
          <div
            className="relative aspect-[4/5] w-full overflow-hidden bg-sage"
            style={{ borderRadius: "18% 82% 30% 70% / 62% 24% 76% 38%" }}
          >
            <img
              src={workshopCircleNew}
              alt="Johanna esti meseműhely körben ülő hallgatósággal, gyertyafényes udvarban"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
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
            {...fadeUp(0.12, 14)}
            className="mt-6 font-script text-xl text-mauve sm:text-2xl"
          >
            „A mesékben mindig ott van a nyugalom, a kreativitás és a
            bizalom lehetősége.”
          </motion.p>

          <motion.p
            {...fadeUp(0.22, 14)}
            className="mt-6 max-w-xl font-sans text-[16px] leading-relaxed text-ink/80"
          >
            A történetek nemcsak emlékek, hanem útmutatók is. Ilyen módon a
            mese segíthet új nézőpontból látni a nehéz helyzeteket, és több
            nyugalommal, figyelemmel és önbizalommal lépni tovább.
          </motion.p>
        </div>
      </div>
    </section>
  );
}

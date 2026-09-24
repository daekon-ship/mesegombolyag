import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import workshopCircle from "../assets/photos/workshop-circle.jpg";
import { fadeUp } from "../lib/motion";

const CREDENTIALS = [
  "Mentálhigiénés szakember",
  "Meseterapeuta",
  "Szociológus",
  "Szociálpedagógus",
];

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
              src={workshopCircle}
              alt="Johanna esti meseműhely körben ülő hallgatósággal, gyertyafényes udvarban"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="absolute -bottom-6 -left-5 flex items-center gap-2 rounded-full bg-forest px-4 py-2.5 text-paper shadow-lg sm:-left-8">
            <MapPin className="h-4 w-4 text-ochre" />
            <span className="font-sans text-sm font-medium">Szeged</span>
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
            „Munkámban az egyéni figyelem, a közösség megtartó ereje és a
            történetekben rejlő évszázados tudás találkozik.”
          </motion.p>

          <motion.p
            {...fadeUp(0.22, 14)}
            className="mt-6 max-w-xl font-sans text-[16px] leading-relaxed text-ink/80"
          >
            Gyermekkoromtól foglalkoztat, mi motiválja az embereket, hogyan
            lehet őket jobban megismerni és támogatni. Szociálpedagógiai
            tanulmányaimat követően mentálhigiénés szakemberként és
            meseterapeutaként mélyítettem tovább ezt az utat — egyéni
            kísérésben, közösségek megtartásában és egyetemisták
            stresszkezelésének támogatásában szerzett tapasztalattal.
          </motion.p>

          <motion.ul
            {...fadeUp(0.32, 14)}
            className="mt-8 flex flex-wrap gap-2.5"
          >
            {CREDENTIALS.map((c) => (
              <li
                key={c}
                className="rounded-full border border-forest/20 px-4 py-1.5 font-sans text-[13.5px] font-medium text-forest"
              >
                {c}
              </li>
            ))}
          </motion.ul>
        </div>
      </div>
    </section>
  );
}

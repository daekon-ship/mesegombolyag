import { motion } from "framer-motion";
import { ThreadDivider } from "./motifs/ThreadDivider";
import { fadeUpStagger } from "../lib/motion";

const STEPS = [
  {
    n: "01",
    title: "Kapcsolatfelvétel",
    text: "Írsz Johannának pár sort arról, mi hozott ide — e-mailben vagy Instagramon.",
  },
  {
    n: "02",
    title: "Rövid egyeztetés",
    text: "Egy rövid beszélgetés keretében körvonalazódik, milyen forma illik hozzád.",
  },
  {
    n: "03",
    title: "Személyes folyamat vagy workshop",
    text: "Elindul a közös munka — egyéni kísérésben vagy egy csoportos alkalom részeként.",
  },
  {
    n: "04",
    title: "Közös lezárás és útravaló",
    text: "A folyamat vagy alkalom végén időt kap az, amit magaddal viszel.",
  },
];

export function Process() {
  return (
    <section className="bg-sage/45 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 lg:px-12">
        <div className="text-center">
          <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-terracotta">
            Hogyan zajlik?
          </p>
          <h2 className="mx-auto max-w-xl font-serif text-[1.9rem] leading-tight text-forest sm:text-[2.3rem]">
            Egy általános, biztonságos keret — a részletek közösen alakulnak
          </h2>
          <p className="mx-auto mt-4 max-w-md font-sans text-sm italic text-ink/55">
            TODO: a végleges folyamat ügyféllel pontosítandó.
          </p>
        </div>

        <div className="relative mt-16 grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-14 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              {...fadeUpStagger(i, 4)}
              className="relative"
            >
              <span className="font-serif text-4xl text-forest/25">{step.n}</span>
              <h3 className="mt-3 font-serif text-xl text-forest">{step.title}</h3>
              <p className="mt-2.5 font-sans text-[14.5px] leading-relaxed text-ink/75">
                {step.text}
              </p>
              {i < STEPS.length - 1 && (
                <ThreadDivider
                  className="absolute -bottom-8 left-0 hidden w-16 lg:-right-9 lg:left-auto lg:top-4 lg:block lg:w-14 lg:rotate-90"
                  color="var(--color-mauve)"
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

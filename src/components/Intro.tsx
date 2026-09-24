import { motion } from "framer-motion";
import { ThreadDivider } from "./motifs/ThreadDivider";
import { fadeUp } from "../lib/motion";

export function Intro() {
  return (
    <section className="bg-sage/45 py-24 sm:py-28">
      <ThreadDivider className="mb-14 max-w-3xl mx-auto px-5" color="var(--color-forest)" />
      <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
        <motion.h2
          {...fadeUp(0)}
          className="text-balance font-serif text-[1.9rem] leading-[1.28] text-forest sm:text-[2.3rem]"
        >
          Minden élethelyzetnek megvan a maga története. És minden
          történetben ott rejtőzhet egy következő lépés.
        </motion.h2>
        <motion.p
          {...fadeUp(0.15, 16)}
          className="mx-auto mt-7 max-w-xl font-sans text-[16px] leading-relaxed text-ink/75"
        >
          A népmesék szimbólumai és megküzdési mintái évszázados tudást
          hordoznak. Segítségükkel gyakran más nézőpontból tekinthetünk
          saját élethelyzeteinkre — és találhatunk bennük egy szálat, amit
          érdemes tovább követni.
        </motion.p>
      </div>
    </section>
  );
}

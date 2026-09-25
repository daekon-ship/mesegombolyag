import { motion } from "framer-motion";
import { YarnMark } from "./motifs/YarnMark";
import { fadeUp } from "../lib/motion";

/**
 * Külön kiemelt idézet — Boldizsár Ildikó
 * A meseterápia bemutatása és az alkalomtípusok között kap helyet.
 */
export function Testimonials() {
  return (
    <section className="bg-paper-dim py-24 sm:py-28">
      <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
        <motion.blockquote
          {...fadeUp(0)}
          className="rounded-[28px] border border-dashed border-forest/25 bg-sage/25 px-7 py-14 sm:px-14"
        >
          <YarnMark className="mx-auto h-9 w-9 text-terracotta/70" />
          <p className="mt-6 font-serif text-xl italic leading-[1.5] text-forest sm:text-[1.55rem] sm:leading-[1.55]">
            „A mese olyan történet, amelyben mindenért meg kell dolgozni,
            semmi sem magától szép és jó, semmi sem magától működik rendben.
            A hős épp azért jár be egy utat, hogy széppé, jóvá, működővé tegye
            maga körül mindazt, ami rút, rossz vagy működésképtelen.”
          </p>
          <footer className="mt-7">
            <p className="font-sans text-sm font-semibold tracking-wide text-forest">
              Boldizsár Ildikó
            </p>
            <p className="mt-1 font-sans text-xs text-ink/55">
              Metamorphoses-meseterápiás módszer megalkotója
            </p>
          </footer>
        </motion.blockquote>
      </div>
    </section>
  );
}

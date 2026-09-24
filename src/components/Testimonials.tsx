import { motion } from "framer-motion";
import { YarnMark } from "./motifs/YarnMark";
import { fadeUp } from "../lib/motion";

export function Testimonials() {
  return (
    <section className="bg-paper py-24 sm:py-28">
      <div className="mx-auto max-w-2xl px-5 text-center sm:px-8">
        <motion.div
          {...fadeUp(0)}
          className="rounded-[28px] border border-dashed border-forest/25 bg-sage/25 px-8 py-14 sm:px-14"
        >
          <YarnMark className="mx-auto h-9 w-9 text-terracotta/70" />
          <p className="mt-6 font-serif text-2xl italic leading-snug text-forest sm:text-[1.7rem]">
            „A résztvevők történetei hamarosan itt folytatódnak.”
          </p>
          <p className="mt-5 font-sans text-xs italic text-ink/50">
            TODO: valódi résztvevői visszajelzések bekérése Johannától.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

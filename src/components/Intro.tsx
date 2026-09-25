import { motion } from "framer-motion";
import { ThreadDivider } from "./motifs/ThreadDivider";
import { ResponsiveImage } from "./ResponsiveImage";
import { natureMandalaPhoto } from "../lib/photos";
import { fadeUp } from "../lib/motion";
import { useAppContext } from "../context/AppState";

/**
 * 02 · Meseterápia / Bevezető
 * A hero alatti folytatás: szöveg + természet-mandala fotó párosítása.
 */
export function Intro() {
  const { siteContent } = useAppContext();
  return (
    <section id="mese" className="bg-sage/45 py-24 sm:py-28">
      <ThreadDivider className="mx-auto mb-14 max-w-3xl px-5" color="var(--color-forest)" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-12">
        <div>
          <motion.h2
            {...fadeUp(0)}
            className="text-balance font-serif text-[1.9rem] leading-[1.28] text-forest sm:text-[2.3rem]"
          >
            {siteContent.introTitle}
          </motion.h2>
          <motion.p
            {...fadeUp(0.12, 16)}
            className="mt-7 max-w-[62ch] font-sans text-[16px] leading-relaxed text-ink/75"
          >
            {siteContent.introText}
          </motion.p>
          <motion.p
            {...fadeUp(0.2, 16)}
            className="mt-5 max-w-[62ch] font-sans text-[16px] leading-relaxed text-ink/75"
          >
            Több éve dolgozom egyetemistákkal, így közelről ismerem a fiatal
            felnőttkor sokszor izgalmas, ugyanakkor bizonytalan és kihívásokkal
            teli időszakát, ahogyan azt is, a mesék hogyan tudnak ezekben a
            helyzetekben utat mutatni.
          </motion.p>
        </div>

        <motion.div {...fadeUp(0.18, 24)} className="mx-auto w-full max-w-[340px] lg:max-w-[380px]">
          <div
            className="overflow-hidden shadow-[0_18px_48px_rgba(32,58,50,0.10)] ring-1 ring-forest/10"
            style={{ borderRadius: "46% 54% 55% 45% / 48% 44% 56% 52%" }}
          >
            <ResponsiveImage photo={natureMandalaPhoto} ratioOverride="4 / 5" loading="lazy" />
          </div>
          <p className="mt-4 text-center font-sans text-xs italic text-ink/50">
            Természetes anyagokból komponált mandala egy alkotó alkalmon
          </p>
        </motion.div>
      </div>
    </section>
  );
}

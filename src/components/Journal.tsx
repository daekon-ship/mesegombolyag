import { motion } from "framer-motion";
import { Instagram } from "lucide-react";
import { picnicFabricsPhoto } from "../lib/photos";
import { ResponsiveImage } from "./ResponsiveImage";
import { fadeUp } from "../lib/motion";

const INSTAGRAM_URL = "https://www.instagram.com/tothjohanna_meseterapia/";

/**
 * 07 · Gondolatok / Instagram
 * Igényes, profilra vezető blokk a három aranyalma mondással és
 * egy valós fotóval; a link a ellenőrzött Instagram profilra vezet.
 */
export function Journal() {
  return (
    <section id="gondolatok" className="bg-paper py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-terracotta">
              Gondolatok
            </p>
            <h2 className="max-w-lg font-serif text-[1.9rem] leading-tight text-forest sm:text-[2.3rem]">
              Kövess az Instagramon
            </h2>
          </div>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            className="focus-ring inline-flex w-fit items-center gap-2 rounded-full border border-forest/25 px-5 py-2.5 font-sans text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-forest/5"
          >
            <Instagram className="h-4 w-4" />
            @tothjohanna_meseterapia
          </a>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:mt-16 md:grid-cols-2">
          <motion.a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            {...fadeUp(0)}
            className="focus-ring group relative block overflow-hidden rounded-[28px] bg-sage"
            aria-label="Mesegombolyag Instagram profil megnyitása"
          >
            <ResponsiveImage
              photo={picnicFabricsPhoto}
              ratioOverride="4 / 3"
              loading="lazy"
              className="transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/75 via-forest-deep/10 to-transparent" />
            <span className="absolute inset-x-5 bottom-5 font-serif text-lg leading-snug text-paper">
              „Az égből három aranyalma hullott a földre: egy a mesélőé, egy
              azé, aki hallgatja, egy meg azé, aki éppen az úton vándorol.”
            </span>
            <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-forest-deep/55 px-3 py-1.5 font-sans text-xs font-semibold text-paper backdrop-blur-sm">
              <Instagram className="h-3.5 w-3.5" />
              Instagram
            </span>
          </motion.a>

          <div className="flex flex-col justify-between rounded-[28px] border border-forest/12 bg-paper p-7 sm:p-8">
            <div>
              <h3 className="font-serif text-xl leading-snug text-forest sm:text-2xl">
                Meseterápiás pillanatok, gondolatok, bejelentések
              </h3>
              <p className="mt-4 max-w-[55ch] font-sans text-[15.5px] leading-relaxed text-ink/70">
                Az Instagramon oszlok meg a legfrissebb programokról, a
                mesékhez kapcsolódó gondolatokról és az alkalmak kulisszái
                mögötti pillanatokról. Ha szeretnéd elsőként tudni, mikor indul
                a következő csoport, ott találod meg őket először.
              </p>
            </div>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="focus-ring mt-6 inline-flex w-fit items-center gap-1.5 font-sans text-sm font-semibold text-terracotta hover:underline"
            >
              @tothjohanna_meseterapia
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

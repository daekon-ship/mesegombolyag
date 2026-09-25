import { motion } from "framer-motion";
import { Instagram } from "lucide-react";
import picnicFabrics from "../assets/photos/picnic-fabrics.jpg";
import { fadeUp, fadeUpStagger } from "../lib/motion";

const POSTS = [
  {
    title: "Mi történik egy személyes beszélgetésen?",
    text: "Egy bepillantás abba, milyen nyugodt és figyelmes légkörben épülhet fel a kapcsolat.",
  },
  {
    title: "Játékosság felnőttként",
    text: "Miért fontos a könnyedség és a közös figyelem a nehéz időszakokban — és hogyan találhatunk újra hozzáférést a belső nyugalomhoz.",
  },
  {
    title: "Hogyan válhat a mese belső erőforrássá?",
    text: "A történetekben gyakran ott rejlik az a nyelv, amely segít új nézőpontból látni a nehézségeket.",
  },
];

export function Journal() {
  return (
    <section id="gondolatok" className="bg-paper-dim py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-terracotta">
              Gondolatok
            </p>
            <h2 className="max-w-lg font-serif text-[1.9rem] leading-tight text-forest sm:text-[2.3rem]">
              További történetek az Instagramon
            </h2>
          </div>
          <a
            href="https://www.instagram.com/tothjohanna_meseterapia/"
            target="_blank"
            rel="noreferrer"
            className="focus-ring inline-flex w-fit items-center gap-2 rounded-full border border-forest/25 px-5 py-2.5 font-sans text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-forest/5"
          >
            <Instagram className="h-4 w-4" />
            @tothjohanna_meseterapia
          </a>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:mt-16 sm:grid-cols-3">
          <motion.a
            href="https://www.instagram.com/tothjohanna_meseterapia/"
            target="_blank"
            rel="noreferrer"
            {...fadeUp(0)}
            className="focus-ring group relative row-span-2 overflow-hidden rounded-[28px] bg-sage sm:min-h-[420px]"
          >
            <img
              src={picnicFabrics}
              alt="Közös alkotás színes textilekkel egy szabadtéri alkalmon"
              className="h-full min-h-[260px] w-full object-cover transition-transform duration-700 group-hover:scale-105 sm:min-h-[420px]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/70 via-forest-deep/0 to-transparent" />
            <span className="absolute bottom-5 left-5 right-5 font-serif text-lg text-paper">
              Egy pillanat a közös alkotásból
            </span>
          </motion.a>

          {POSTS.map((post, i) => (
            <motion.article
              key={post.title}
              {...fadeUpStagger(i, 3)}
              className="flex flex-col justify-between rounded-[28px] border border-forest/12 bg-paper p-7"
            >
              <div>
                <h3 className="font-serif text-xl leading-snug text-forest">
                  {post.title}
                </h3>
                <p className="mt-3 font-sans text-[14.5px] leading-relaxed text-ink/70">
                  {post.text}
                </p>
              </div>
              <a
                href="https://www.instagram.com/tothjohanna_meseterapia/"
                target="_blank"
                rel="noreferrer"
                className="focus-ring mt-6 inline-flex w-fit items-center gap-1.5 font-sans text-sm font-semibold text-terracotta"
              >
                Tovább Instagramon
              </a>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

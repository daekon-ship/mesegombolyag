import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { fadeUpStagger } from "../lib/motion";

const OCCASIONS = [
  {
    title: "Egyéni meseterápiás folyamatok",
    text: "Személyes kísérés, ahol a mese eszköz ahhoz, hogy más nézőpontból lássuk saját élethelyzetünket.",
    tag: "Egyéni",
  },
  {
    title: "Személyes workshopok Szegeden",
    text: "Alkalmanként meghirdetett, élőben megélt alkalmak, ahol a történet közös térben mozdul meg.",
    tag: "Csoportos",
  },
  {
    title: "Belső gyermek workshop",
    text: "Játékos, mégis mélyen személyes alkalom, amely a bennünk élő gyermeki résszel teremt kapcsolatot.",
    tag: "Workshop",
  },
  {
    title: "Önbizalom- és reziliencia-erősítő alkalmak",
    text: "Mesei szimbólumok és gyakorlatok mentén épített folyamat a belső stabilitás erősítésére.",
    tag: "Workshop",
    pending: true,
  },
  {
    title: "Művészetterápiás foglalkozások kisgyermekes anyáknak",
    text: "Alkotó, testközeli alkalmak, amelyek teret adnak a feltöltődésnek és az önkifejezésnek.",
    tag: "Anyáknak",
  },
  {
    title: "Csoportos mesés alkalmak",
    text: "Közös mesehallgatás és -alkotás, amely a csoport megtartó erejére épít.",
    tag: "Csoportos",
    pending: true,
  },
];

export function Occasions() {
  return (
    <section id="alkalmak" className="bg-forest py-24 text-paper sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-ochre">
              Alkalmak és folyamatok
            </p>
            <h2 className="max-w-lg font-serif text-[1.9rem] leading-tight sm:text-[2.3rem]">
              Válaszd ki, milyen formában találkoznál a mesékkel
            </h2>
          </div>
          <p className="max-w-xs font-sans text-sm leading-relaxed text-paper/65">
            Az időpontokról és aktuális helyekről Johannával egyeztetve
            kaphatsz pontos tájékoztatást.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
          {OCCASIONS.map((item, i) => (
            <motion.article
              key={item.title}
              {...fadeUpStagger(i)}
              className="group relative flex min-h-[280px] flex-col justify-between overflow-hidden rounded-[28px] border border-paper/12 bg-paper/[0.04] p-7 transition-colors hover:border-ochre/40 hover:bg-paper/[0.07]"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-paper/20 px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-wide text-paper/70">
                    {item.tag}
                  </span>
                  {item.pending && (
                    <span
                      className="font-sans text-[11px] italic text-ochre/80"
                      title="TODO: ügyféllel pontosítandó"
                    >
                      egyeztetés alatt
                    </span>
                  )}
                </div>
                <h3 className="mt-5 font-serif text-[1.35rem] leading-snug text-paper sm:text-2xl">
                  {item.title}
                </h3>
                <p className="mt-3 font-sans text-[14.5px] leading-relaxed text-paper/70">
                  {item.text}
                </p>
              </div>

              <a
                href="#kapcsolat"
                className="focus-ring mt-7 inline-flex w-fit items-center gap-1.5 font-sans text-sm font-semibold text-ochre transition-colors group-hover:text-paper"
              >
                Érdeklődöm
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

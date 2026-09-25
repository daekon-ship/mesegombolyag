import { motion } from "framer-motion";
import { ArrowRight, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { ResponsiveImage } from "./ResponsiveImage";
import { storyCirclePhoto } from "../lib/photos";
import { fadeUp } from "../lib/motion";

/**
 * 04 · Alkalmak és folyamatok
 * A három alkalomtípus külön kezdeményezéssel; minden kártya gombja
 * a megfelelő felületre viszi a látogatót, átadva a választott típust.
 */
const OFFERINGS = [
  {
    id: "workshop",
    tag: "Egyalkalmas program",
    title: "Mesés workshop",
    text: "Egyalkalmas program felnőtteknek, amikor egy meghatározott témát dolgozunk fel egy mese segítségével. Célja a lélekfrissítés és fejlődés. Fontos a mesei elemek használata, a kreatív tevékenységek és az érzékszervek bevonása.",
    cta: "Workshopok és jelentkezés",
    to: "/esemenyek",
  },
  {
    id: "mesemuhely",
    tag: "Zárt csoportos folyamat",
    title: "Meseműhely",
    text: "Egymásra épülő csoportos alkalmak, ahol több találkozáson keresztül foglalkozunk ugyanazzal a témával a mesék segítségével. A csoport zárt, tehát tagjai a folyamat során nem változnak. Az önismereti téma komplex, többszempontú megközelítésében egy vagy több történetet is segítségül hívunk.",
    cta: "Meseműhelyek és jelentkezés",
    to: "/esemenyek",
  },
  {
    id: "egyeni",
    tag: "Egyéni folyamat",
    title: "Személyes kísérés mesékkel",
    text: "Egyéni folyamat, amikor a mentálhigiénés beszélgetések során a meséket hívjuk segítségül az aktuális élethelyzet rendezésében. Egy választott történetben együtt járjuk végig a hős útját. A folyamat célja, hogy a mesékben rejlő lehetőségeket megtanuljuk iránytűként és cselekvési forgatókönyvként használni.",
    cta: "Egyéni időpontot foglalok",
    to: "/foglalas",
  },
];

export function Occasions() {
  return (
    <section id="alkalmak" className="bg-forest py-24 text-paper sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-12">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.85fr] lg:gap-16">
          <div>
            <motion.p
              {...fadeUp(0, 14)}
              className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-ochre"
            >
              Alkalmak és folyamatok
            </motion.p>
            <motion.h2
              {...fadeUp(0.08)}
              className="max-w-[26ch] font-serif text-[1.9rem] leading-tight sm:text-[2.3rem]"
            >
              Milyen formában dolgozhatjuk fel a történeteket?
            </motion.h2>
          </div>
          <motion.div {...fadeUp(0.15, 20)} className="overflow-hidden rounded-[28px] ring-1 ring-paper/15">
            <ResponsiveImage photo={storyCirclePhoto} ratioOverride="16 / 10" loading="lazy" />
          </motion.div>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {OFFERINGS.map((item, i) => (
            <motion.article
              key={item.id}
              {...fadeUp(0.1 + i * 0.08, 24)}
              className="flex flex-col rounded-[26px] border border-paper/12 bg-paper/[0.04] p-6 shadow-[0_16px_32px_rgba(20,31,29,0.12)] sm:p-7"
            >
              <span className="inline-flex w-fit rounded-full border border-paper/15 bg-paper/5 px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-ochre">
                {item.tag}
              </span>
              <h3 className="mt-5 font-serif text-2xl text-paper">{item.title}</h3>
              <p className="mt-3 flex-1 text-[15px] leading-relaxed text-paper/75">
                {item.text}
              </p>
              <Link
                to={item.to}
                className="focus-ring group mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-paper px-5 py-2.5 font-sans text-sm font-semibold text-forest transition-colors hover:bg-ochre"
              >
                {item.cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.article>
          ))}
        </div>

        <motion.div
          {...fadeUp(0.1, 20)}
          className="mt-10 flex flex-col items-start gap-5 rounded-[28px] border border-paper/12 bg-paper/[0.04] p-7 sm:flex-row sm:items-center sm:justify-between sm:p-8"
        >
          <p className="max-w-xl font-sans text-[15.5px] leading-relaxed text-paper/75">
            A meghirdetett workshopokhoz és meseműhelyekhez a
            Csoportok és események oldalon jelentkezhetsz; az egyéni folyamatot
            pedig közvetlenül Johannával egyeztetheted le.
          </p>
          <Link
            to="/esemenyek"
            className="focus-ring inline-flex shrink-0 items-center gap-2 rounded-full border border-paper/30 px-5 py-3 font-sans text-sm font-semibold text-paper transition-colors hover:bg-paper/10"
          >
            <Users className="h-4 w-4" />
            Csoportok és események
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

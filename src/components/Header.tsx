import { type MouseEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { YarnMark } from "./motifs/YarnMark";
import { scrollToSection } from "./ScrollToTop";

const NAV_LINKS = [
  { label: "Kezdőlap", id: "hero" },
  { label: "A mese", id: "mese" },
  { label: "Alkalmak", id: "alkalmak" },
  { label: "Rólam", id: "rolam" },
  { label: "Gondolatok", id: "gondolatok" },
];

/** HashRouter alatt a `#szakasz` horgony útvonalváltás lenne, ezért görgetünk. */
function sectionHandler(id: string, after?: () => void) {
  return (event: MouseEvent) => {
    event.preventDefault();
    after?.();
    scrollToSection(id);
  };
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    // Note: the blur/bg treatment lives on this inner wrapper, not <header> itself —
    // a `backdrop-filter` on an ancestor of a `fixed` element turns it into that
    // ancestor's containing block, which would break the full-viewport mobile menu below.
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={`transition-all duration-500 ${
          scrolled || open
            ? "bg-paper/90 shadow-[0_1px_0_rgba(37,34,31,0.08)] backdrop-blur-md"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
          <a
            href="#/"
            onClick={sectionHandler("hero")}
            className="focus-ring flex items-center gap-2 text-forest"
            aria-label="Mesegombolyag, kezdőlap"
          >
            <YarnMark className="h-7 w-7 text-terracotta" />
            <span className="font-serif text-xl tracking-tight text-forest sm:text-[22px]">
              Mesegombolyag
            </span>
          </a>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Fő navigáció">
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={`#/?szakasz=${link.id}`}
                onClick={sectionHandler(link.id)}
                className="focus-ring font-sans text-[15px] font-medium text-ink/80 transition-colors hover:text-terracotta"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/esemenyek"
              className="focus-ring font-sans text-[15px] font-medium text-ink/80 transition-colors hover:text-terracotta"
            >
              Programok
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/erdeklodes"
              className="focus-ring hidden rounded-full bg-forest px-5 py-2.5 font-sans text-sm font-semibold text-paper transition-colors hover:bg-terracotta sm:inline-block"
            >
              Érdeklődöm
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="focus-ring rounded-full p-2 text-forest lg:hidden"
              aria-label={open ? "Menü bezárása" : "Menü megnyitása"}
              aria-expanded={open}
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 top-[64px] z-40 flex flex-col overflow-y-auto bg-paper px-8 pb-10 pt-6 lg:hidden"
          >
            <nav className="flex flex-1 flex-col justify-center gap-1" aria-label="Mobil navigáció">
              {NAV_LINKS.map((link, i) => (
                <motion.a
                  key={link.id}
                  href={`#/?szakasz=${link.id}`}
                  onClick={sectionHandler(link.id, () => setOpen(false))}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.35 }}
                  className="focus-ring border-b border-forest/10 py-4 font-serif text-3xl text-forest"
                >
                  {link.label}
                </motion.a>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * NAV_LINKS.length, duration: 0.35 }}
              >
                <Link
                  to="/esemenyek"
                  onClick={() => setOpen(false)}
                  className="focus-ring block border-b border-forest/10 py-4 font-serif text-3xl text-forest"
                >
                  Csoportok és események
                </Link>
              </motion.div>
            </nav>
            <Link
              to="/erdeklodes"
              onClick={() => setOpen(false)}
              className="focus-ring mt-6 rounded-full bg-forest px-6 py-4 text-center font-sans font-semibold text-paper"
            >
              Érdeklődöm
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

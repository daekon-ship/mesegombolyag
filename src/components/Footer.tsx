import { Instagram, Mail } from "lucide-react";
import { YarnMark } from "./motifs/YarnMark";

export function Footer() {
  return (
    <footer className="bg-forest-deep pb-10 pt-16 text-paper/80">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-10 border-b border-paper/12 pb-12 sm:flex-row sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <YarnMark className="h-6 w-6 text-ochre" />
              <span className="font-serif text-lg text-paper">Mesegombolyag</span>
            </div>
            <p className="mt-3 max-w-xs font-sans text-sm leading-relaxed text-paper/60">
              Tóth Johanna · meseterapeuta és mentálhigiénés szakember ·
              Szeged
            </p>
          </div>

          <div className="flex flex-col gap-3 font-sans text-sm">
            <a
              href="mailto:mesegombolyag@gmail.com"
              className="focus-ring inline-flex items-center gap-2 text-paper/75 transition-colors hover:text-ochre"
            >
              <Mail className="h-4 w-4" />
              mesegombolyag@gmail.com
            </a>
            <a
              href="https://www.instagram.com/tothjohanna_meseterapia/"
              target="_blank"
              rel="noreferrer"
              className="focus-ring inline-flex items-center gap-2 text-paper/75 transition-colors hover:text-ochre"
            >
              <Instagram className="h-4 w-4" />
              @tothjohanna_meseterapia
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-6 font-sans text-xs text-paper/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Mesegombolyag — Tóth Johanna</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <span className="italic" title="TODO: ügyféllel pontosítandó">
              Adatkezelési tájékoztató — hamarosan
            </span>
            <span className="italic" title="TODO: ügyféllel pontosítandó">
              Impresszum — hamarosan
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

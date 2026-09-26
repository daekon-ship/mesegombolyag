import { Instagram, Mail, Phone } from "lucide-react";
import { useAppContext } from "../context/AppState";
import { Link } from "react-router-dom";
import { YarnMark } from "./motifs/YarnMark";

export function Footer() {
  const { siteContent } = useAppContext();
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
              Meseterápiával a lelki immunrendszerért.
            </p>
          </div>

          <div className="flex flex-col gap-3 font-sans text-sm">
            <a
              href={`mailto:${siteContent.contactEmail}`}
              className="focus-ring inline-flex items-center gap-2 text-paper/75 transition-colors hover:text-ochre"
            >
              <Mail className="h-4 w-4" />
              {siteContent.contactEmail}
            </a>
            {siteContent.contactPhone && (
              <a
                href={`tel:${siteContent.contactPhone.replace(/\s/g, "")}`}
                className="focus-ring inline-flex items-center gap-2 text-paper/75 transition-colors hover:text-ochre"
              >
                <Phone className="h-4 w-4" />
                {siteContent.contactPhone}
              </a>
            )}
            <a
              href="https://www.instagram.com/tothjohanna_meseterapia/"
              target="_blank"
              rel="noreferrer"
              className="focus-ring inline-flex items-center gap-2 text-paper/75 transition-colors hover:text-ochre"
            >
              <Instagram className="h-4 w-4" />
              @tothjohanna_meseterapia
            </a>
            <Link
              to="/erdeklodes"
              className="focus-ring inline-flex items-center gap-2 text-paper/75 transition-colors hover:text-ochre"
            >
              Érdeklődöm
            </Link>
            <Link
              to="/esemenyek"
              className="focus-ring inline-flex items-center gap-2 text-paper/75 transition-colors hover:text-ochre"
            >
              Programok
            </Link>
            <Link
              to="/foglalas"
              className="focus-ring inline-flex items-center gap-2 text-paper/75 transition-colors hover:text-ochre"
            >
              Egyéni időpontfoglalás
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-6 font-sans text-xs text-paper/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Mesegombolyag — Tóth Johanna</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/adatkezeles" className="focus-ring hover:text-paper/80">Adatkezelési tájékoztató</Link>
            <Link to="/impresszum" className="focus-ring hover:text-paper/80">Impresszum</Link>
            <Link to="/admin" className="focus-ring text-paper/35 hover:text-paper/70">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

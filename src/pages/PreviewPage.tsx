import type { ReactNode } from "react";
import { Instagram, Mail, MapPin } from "lucide-react";
import { YarnMark } from "../components/motifs/YarnMark";
import { BranchMotif } from "../components/motifs/BranchMotif";
import johannaPortrait from "../assets/photos/johanna-portrait-fixed.jpg";
import workshopCircle from "../assets/photos/workshop-circle.jpg";
import picnicFabrics from "../assets/photos/picnic-fabrics.jpg";

/**
 * A separate, static, portrait-oriented presentation of the live site —
 * built for sending to the client (Messenger/email/phone), not for
 * visitors. Deliberately does not use whileInView/scroll-triggered
 * animation: it needs to render fully and correctly in a single
 * full-page screenshot regardless of scroll state, on any device.
 */

function PanelLabel({ index, label }: { index: string; label: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="font-serif text-sm text-terracotta">{index}</span>
      <span className="h-px flex-1 bg-forest/15" />
      <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-ink/45">
        {label}
      </span>
    </div>
  );
}

function Panel({
  index,
  label,
  tone = "paper",
  children,
}: {
  index: string;
  label: string;
  tone?: "paper" | "dim" | "sage";
  children: ReactNode;
}) {
  const bg =
    tone === "dim" ? "bg-paper-dim" : tone === "sage" ? "bg-sage/40" : "bg-paper";
  return (
    <section className={`${bg} px-6 py-12 sm:px-10 sm:py-14`}>
      <PanelLabel index={index} label={label} />
      {children}
    </section>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-forest/20 px-3.5 py-1.5 font-sans text-[12.5px] font-medium text-forest">
      {children}
    </span>
  );
}

const THEMES = [
  { n: "01", title: "Belső erőforrások" },
  { n: "02", title: "Önismeret és kapcsolódás" },
  { n: "03", title: "Megküzdés és újrakezdés" },
];

const OCCASIONS = [
  "Egyéni meseterápiás folyamatok",
  "Személyes workshopok Szegeden",
  "Belső gyermek workshop",
  "Önbizalom- és reziliencia-erősítő alkalmak",
  "Művészetterápiás foglalkozások kisgyermekes anyáknak",
  "Csoportos mesés alkalmak",
];

const STEPS = [
  "Kapcsolatfelvétel",
  "Rövid egyeztetés",
  "Személyes folyamat vagy workshop",
  "Közös lezárás és útravaló",
];

export default function PreviewPage() {
  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto max-w-[600px] bg-paper shadow-[0_0_60px_rgba(37,34,31,0.06)]">
        {/* Back to live site — small, unobtrusive, doesn't interfere with screenshots */}
        <div className="flex justify-center bg-forest-deep py-2.5">
          <a
            href="/"
            className="font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-paper/60 hover:text-paper"
          >
            ← Vissza az élő oldalra
          </a>
        </div>

        {/* Opening block */}
        <header className="paper-grain relative overflow-hidden px-6 pb-14 pt-14 text-center sm:px-10 sm:pt-16">
          <YarnMark className="mx-auto h-10 w-10 text-terracotta" />
          <p className="mt-5 font-sans text-xs font-semibold uppercase tracking-[0.3em] text-terracotta">
            Mesegombolyag · Tóth Johanna
          </p>
          <h1 className="mt-4 font-serif text-[2.1rem] leading-[1.15] text-forest">
            Weboldal látványterv
          </h1>
          <p className="mx-auto mt-4 max-w-sm font-script text-xl text-mauve">
            Meseterápiával a lelki immunrendszerért.
          </p>
          <p className="mx-auto mt-5 max-w-xs font-sans text-sm leading-relaxed text-ink/65">
            Az alábbi oldalak a Mesegombolyag weboldal tervezett vizuális
            hangulatát és felépítését mutatják be — egy helyen, könnyen
            áttekinthetően.
          </p>
        </header>

        <div className="border-t border-forest/10" />

        {/* Hero */}
        <Panel index="01" label="Kezdőlap · Hero">
          <div
            className="mx-auto aspect-[4/5] w-full max-w-[320px] overflow-hidden bg-sage"
            style={{ borderRadius: "58% 42% 47% 53% / 55% 48% 52% 45%" }}
          >
            <img
              src={johannaPortrait}
              alt="Tóth Johanna portréja"
              className="h-full w-full object-cover"
            />
          </div>
          <h2 className="mt-7 text-center font-serif text-[1.6rem] leading-tight text-forest">
            A történetek néha ott találnak meg, ahol a szavaink elfogynak.
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-center font-sans text-[14.5px] leading-relaxed text-ink/70">
            Egyéni folyamatok és személyes workshopok Szegeden, ahol a
            népmesék, a kreativitás és a közös figyelem segítenek közelebb
            kerülni belső erőforrásainkhoz.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <span className="rounded-full bg-forest px-5 py-2.5 font-sans text-[13px] font-semibold text-paper">
              Felfedezem az alkalmakat
            </span>
          </div>
        </Panel>

        {/* Intro / value proposition */}
        <Panel index="02" label="Meseterápia · Bevezető" tone="sage">
          <h2 className="text-balance text-center font-serif text-[1.5rem] leading-[1.3] text-forest">
            Minden élethelyzetnek megvan a maga története. És minden
            történetben ott rejtőzhet egy következő lépés.
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-center font-sans text-[14px] leading-relaxed text-ink/70">
            A népmesék szimbólumai és megküzdési mintái évszázados tudást
            hordoznak — segítségükkel más nézőpontból tekinthetünk saját
            élethelyzeteinkre.
          </p>
        </Panel>

        {/* 01-02-03 themes */}
        <Panel index="03" label="Miben segíthet a mese?">
          <h2 className="font-serif text-[1.4rem] leading-tight text-forest">
            A mese nem menekülés a valóság elől — hanem egy másik út befelé.
          </h2>
          <div className="mt-7 flex flex-col gap-5">
            {THEMES.map((t) => (
              <div key={t.n} className="flex items-center gap-4">
                <BranchMotif static className="h-14 w-9 shrink-0 text-forest/70" />
                <div>
                  <span className="font-serif text-xs text-forest/40">{t.n}</span>
                  <h3 className="font-serif text-[1.05rem] text-forest">{t.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Occasions */}
        <Panel index="04" label="Alkalmak és folyamatok" tone="dim">
          <div className="rounded-[24px] bg-forest px-6 py-8 text-paper">
            <h2 className="font-serif text-[1.35rem] leading-tight">
              Válaszd ki, milyen formában találkoznál a mesékkel
            </h2>
            <ul className="mt-6 flex flex-col gap-3">
              {OCCASIONS.map((o) => (
                <li
                  key={o}
                  className="rounded-2xl border border-paper/15 bg-paper/[0.05] px-4 py-3 font-sans text-[13.5px] text-paper/85"
                >
                  {o}
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        {/* About */}
        <Panel index="05" label="Rólam">
          <div
            className="mx-auto aspect-[4/5] w-full max-w-[300px] overflow-hidden bg-sage"
            style={{ borderRadius: "18% 82% 30% 70% / 62% 24% 76% 38%" }}
          >
            <img
              src={workshopCircle}
              alt="Johanna esti meseműhelye"
              className="h-full w-full object-cover"
            />
          </div>
          <h2 className="mt-7 text-center font-serif text-[1.5rem] text-forest">
            Aki a történetek fonalát tartja
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-center font-script text-lg text-mauve">
            „Az egyéni figyelem, a közösség megtartó ereje és a történetekben
            rejlő évszázados tudás találkozik.”
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Tag>Mentálhigiénés szakember</Tag>
            <Tag>Meseterapeuta</Tag>
            <div className="flex items-center gap-1.5 rounded-full bg-forest px-3.5 py-1.5 font-sans text-[12.5px] font-medium text-paper">
              <MapPin className="h-3.5 w-3.5 text-ochre" />
              Szeged
            </div>
          </div>
        </Panel>

        {/* Process */}
        <Panel index="06" label="Hogyan zajlik?" tone="sage">
          <ol className="flex flex-col gap-4">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-forest/25 font-serif text-sm text-forest">
                  {i + 1}
                </span>
                <span className="font-sans text-[14.5px] text-ink/80">{s}</span>
              </li>
            ))}
          </ol>
        </Panel>

        {/* Gondolatok / Instagram */}
        <Panel index="07" label="Gondolatok · Instagram">
          <div className="overflow-hidden rounded-[24px]">
            <img
              src={picnicFabrics}
              alt="Közös alkotás színes textilekkel"
              className="h-48 w-full object-cover"
            />
          </div>
          <p className="mt-6 text-center font-serif text-[1.2rem] leading-snug text-forest">
            Hogyan válhat a mese belső erőforrássá?
          </p>
          <div className="mt-5 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-forest/25 px-4 py-2 font-sans text-[13px] font-semibold text-forest">
              <Instagram className="h-4 w-4" />
              @tothjohanna_meseterapia
            </span>
          </div>
        </Panel>

        {/* Closing CTA / footer mood */}
        <section className="bg-forest-deep px-6 py-16 text-center text-paper sm:px-10">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-ochre">
            08 · Kapcsolat
          </p>
          <h2 className="mx-auto mt-4 max-w-xs text-balance font-serif text-[1.7rem] leading-[1.25]">
            Lehet, hogy a következő történet már rólad szól.
          </h2>
          <span className="mt-7 inline-flex items-center gap-2 rounded-full bg-terracotta px-6 py-3 font-sans text-[13.5px] font-semibold text-paper">
            <Mail className="h-4 w-4" />
            Írok Johannának
          </span>

          <div className="mx-auto mt-14 flex max-w-xs items-center justify-center gap-2 border-t border-paper/15 pt-8">
            <YarnMark className="h-5 w-5 text-ochre" />
            <span className="font-serif text-base text-paper">Mesegombolyag</span>
          </div>
          <p className="mt-2 font-sans text-xs text-paper/50">
            Tóth Johanna · meseterapeuta · Szeged · mesegombolyag@gmail.com
          </p>
        </section>

        <div className="bg-forest-deep px-6 pb-8 text-center">
          <p className="font-sans text-[11px] italic text-paper/35">
            Ez egy bemutató látványterv — nem az élő weboldal.
          </p>
        </div>
      </div>
    </div>
  );
}

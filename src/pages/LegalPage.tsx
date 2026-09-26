import { useAppContext } from "../context/AppState";
import { PageShell, cardClass, pageTitleClass } from "../components/ui/forms";

const TITLES = { privacy: "Adatkezelési tájékoztató", impressum: "Impresszum" } as const;

/**
 * Jogi oldalak. A szöveget Johanna (jogilag ellenőrzött formában) az adminban adja meg;
 * amíg ez nem történt meg, az oldal ezt őszintén jelzi — kitalált jogi szöveg nem jelenik meg.
 */
export function LegalPage({ kind }: { kind: keyof typeof TITLES }) {
  const { siteContent, publicState } = useAppContext();
  const text = kind === "privacy" ? siteContent.privacyPolicy : siteContent.impressum;

  return (
    <PageShell>
      <article className={`mt-6 ${cardClass}`}>
        <h1 className={pageTitleClass}>{TITLES[kind]}</h1>
        {publicState === "loading" ? (
          <p className="mt-6 text-ink/60" role="status">Betöltés…</p>
        ) : text ? (
          <div className="mt-6 max-w-[70ch] whitespace-pre-line text-[15.5px] leading-relaxed text-ink/85">{text}</div>
        ) : (
          <p className="mt-6 max-w-[60ch] text-[15.5px] leading-relaxed text-ink/75">
            Az {TITLES[kind].toLowerCase()} véglegesítése folyamatban van. Addig is kérdés esetén írj a{" "}
            <a href={`mailto:${siteContent.contactEmail}`} className="focus-ring underline hover:text-terracotta">{siteContent.contactEmail}</a>{" "}
            címre.
          </p>
        )}
      </article>
    </PageShell>
  );
}

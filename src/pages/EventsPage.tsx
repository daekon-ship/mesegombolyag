import { CalendarDays, MapPin, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppState";
import { mediaUrl } from "../lib/api";
import { formatDate, formatTime } from "../lib/format";
import { Alert, PageShell, eyebrowClass, pageTitleClass } from "../components/ui/forms";
import { StateBadge, TypeBadge, seatsText } from "../components/ProgramBits";

export function EventsPage() {
  const { programs, publicState, refreshPublic } = useAppContext();

  return (
    <PageShell wide>
      <section className="mt-6">
        <p className={eyebrowClass}>Csoportos programok</p>
        <h1 className={`${pageTitleClass} max-w-[26ch]`}>Mesés workshopok és meseműhelyek</h1>
        <p className="mt-4 max-w-[62ch] font-sans text-[15.5px] leading-relaxed text-ink/75">
          A <strong className="font-semibold text-forest">mesés workshop</strong> egyalkalmas program felnőtteknek. A{" "}
          <strong className="font-semibold text-forest">meseműhely</strong> több, egymásra épülő találkozóból álló zárt csoportos folyamat — a
          jelentkezés a teljes folyamatra szól.
        </p>
      </section>

      {publicState === "loading" && <p className="mt-10 text-ink/60" role="status">Programok betöltése…</p>}
      {publicState === "error" && (
        <div className="mt-10">
          <Alert tone="error">
            A programokat most nem sikerült betölteni.{" "}
            <button type="button" onClick={() => refreshPublic()} className="focus-ring font-semibold underline">Újrapróbálom</button>
          </Alert>
        </div>
      )}

      {publicState === "ready" && programs.length === 0 && (
        <section className="mt-10 rounded-[28px] border border-dashed border-forest/25 bg-sage/25 p-8 text-center sm:p-12">
          <h2 className="font-serif text-2xl text-forest">Jelenleg nincs meghirdetett csoportos program</h2>
          <p className="mx-auto mt-3 max-w-[52ch] font-sans text-[15.5px] leading-relaxed text-ink/70">
            Írj Johannának, ha érdekel a következő workshop vagy meseműhely — szívesen értesít, amint új alkalom indul.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/erdeklodes?tema=workshop" className="focus-ring inline-flex items-center justify-center rounded-full bg-forest px-6 py-3 font-sans text-sm font-semibold text-paper transition-colors hover:bg-terracotta">
              Workshopról érdeklődöm
            </Link>
            <Link to="/erdeklodes?tema=mesemuhely" className="focus-ring inline-flex items-center justify-center rounded-full border border-forest/25 px-6 py-3 font-sans text-sm font-semibold text-forest transition-colors hover:border-forest/50">
              Meseműhelyről érdeklődöm
            </Link>
          </div>
        </section>
      )}

      {programs.length > 0 && (
        <section className="mt-10 space-y-6">
          {programs.map((program) => {
            const first = program.sessions[0];
            const last = program.sessions[program.sessions.length - 1];
            return (
              <article key={program.id} className="overflow-hidden rounded-[28px] border border-forest/10 bg-white/60 shadow-sm sm:grid sm:grid-cols-[minmax(0,1fr)_220px] lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="p-6 sm:p-8">
                  <div className="flex flex-wrap items-center gap-2">
                    <TypeBadge program={program} />
                    <StateBadge state={program.registrationState} />
                  </div>
                  <h2 className="mt-4 font-serif text-[1.55rem] leading-snug text-forest sm:text-[1.9rem]">{program.title}</h2>
                  {program.summary && <p className="mt-3 max-w-[62ch] text-[15.5px] leading-relaxed text-ink/70">{program.summary}</p>}
                  <dl className="mt-5 grid gap-3 text-[15px] text-ink/80 sm:grid-cols-2">
                    <div className="flex items-start gap-2">
                      <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" aria-hidden="true" />
                      <dt className="sr-only">Időpont</dt>
                      <dd>
                        {program.sessions.length > 1
                          ? `${program.sessions.length} alkalom: ${formatDate(first.startsAt)} – ${formatDate(last.startsAt)}`
                          : `${formatDate(first.startsAt)}, ${formatTime(first.startsAt)}–${formatTime(first.endsAt)}`}
                      </dd>
                    </div>
                    {program.location && (
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" aria-hidden="true" />
                        <dt className="sr-only">Helyszín</dt>
                        <dd>{program.location}</dd>
                      </div>
                    )}
                    {program.registrationState !== "cancelled" && (
                      <div className="flex items-start gap-2">
                        <Users className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" aria-hidden="true" />
                        <dt className="sr-only">Férőhely</dt>
                        <dd>{seatsText(program)}</dd>
                      </div>
                    )}
                  </dl>
                  <Link
                    to={`/esemenyek/${program.slug}`}
                    className="focus-ring mt-6 inline-flex items-center justify-center rounded-full bg-forest px-6 py-3 font-sans text-sm font-semibold text-paper transition-colors hover:bg-terracotta"
                  >
                    {program.registrationState === "open" ? "Részletek és jelentkezés" : "Részletek"}
                  </Link>
                </div>
                {program.image && (
                  <img src={mediaUrl(program.image)} alt="" loading="lazy" className="h-48 w-full object-cover sm:h-full" />
                )}
              </article>
            );
          })}
        </section>
      )}
    </PageShell>
  );
}

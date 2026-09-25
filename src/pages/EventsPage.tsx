import { Link } from "react-router-dom";
import { events, groups } from "../lib/siteData";

export function EventsPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-forest/10 bg-paper/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
          <Link to="/" className="font-serif text-2xl text-forest">Mesegombolyag</Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-forest/80">
            <Link to="/">Kezdőlap</Link>
            <Link to="/foglalas">Foglalás</Link>
            <Link to="/esemenyek">Események</Link>
            <Link to="/admin">Admin</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:px-12">
        <section className="mb-10">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.25em] text-terracotta">Események és csoportok</p>
          <h1 className="mt-4 font-serif text-4xl text-forest">Közösségi programok és meghirdetett alkalmak</h1>
          <p className="mt-4 max-w-2xl text-base text-ink/75">
            Közös mesék, tudatos játék, és olyan pillanatok, ahol a történet segít újra megtalálni a nyugalmat és a bizalmat.
          </p>
        </section>

        <section className="space-y-8">
          {[...groups, ...events].map((item) => (
            <article key={item.id} className="rounded-[28px] border border-forest/10 bg-white/60 p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <span className="inline-flex rounded-full bg-terracotta/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-terracotta">
                    {"date" in item ? "Esemény" : "Csoport"}
                  </span>
                  <h2 className="mt-4 font-serif text-3xl text-forest">{item.title}</h2>
                  <p className="mt-3 max-w-2xl text-base text-ink/70">{item.description}</p>
                </div>
                <Link
                  to={"slug" in item ? `/esemenyek/${item.slug}` : `/esemenyek/${item.id}`}
                  className="inline-flex rounded-full bg-forest px-5 py-3 font-sans text-sm font-semibold text-paper hover:bg-terracotta"
                >
                  Részletek
                </Link>
              </div>
              <div className="mt-6 grid gap-4 text-sm text-ink/75 sm:grid-cols-3">
                <div><span className="font-semibold text-forest">Dátum:</span> {item.date}</div>
                <div><span className="font-semibold text-forest">Idő:</span> {"time" in item ? item.time : `${item.startTime}–${item.endTime}`}</div>
                <div><span className="font-semibold text-forest">Helyszín:</span> {item.location}</div>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

import { CalendarDays, MapPin, Ticket, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppState";

export function EventsPage() {
  const { events, groups } = useAppContext();

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
          <div>
            <h2 className="mb-5 font-serif text-3xl text-forest">Csoportos programok</h2>
            <div className="grid gap-5 md:grid-cols-2">
              {groups.map((group) => (
                <article key={group.id} className="overflow-hidden rounded-[28px] border border-forest/10 bg-white/60 shadow-sm">
                  <img src={group.image} alt={group.title} className="h-56 w-full object-cover" />
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-serif text-2xl text-forest">{group.title}</h3>
                      <span className="rounded-full bg-forest px-2.5 py-1 text-xs font-semibold text-paper">{group.active ? "Aktív" : "Inaktív"}</span>
                    </div>
                    <p className="mt-3 text-sm text-ink/70">{group.description}</p>
                    <div className="mt-4 space-y-2 text-sm text-ink/70">
                      <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-terracotta" /> {group.date} · {group.time}</div>
                      <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-terracotta" /> {group.location}</div>
                      <div className="flex items-center gap-2"><Users className="h-4 w-4 text-terracotta" /> {group.capacity} fő</div>
                    </div>
                    <Link to={`/esemenyek/${group.id}`} className="mt-5 inline-flex rounded-full bg-forest px-5 py-2.5 font-sans text-sm font-semibold text-paper hover:bg-terracotta">
                      Jelentkezés a programra
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-5 font-serif text-3xl text-forest">Események</h2>
            <div className="grid gap-5 md:grid-cols-2">
              {events.map((event) => (
                <article key={event.id} className="overflow-hidden rounded-[28px] border border-forest/10 bg-white/60 shadow-sm">
                  <img src={event.image} alt={event.title} className="h-56 w-full object-cover" />
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-serif text-2xl text-forest">{event.title}</h3>
                      <span className="rounded-full bg-terracotta/10 px-2.5 py-1 text-xs font-semibold text-terracotta">{event.status}</span>
                    </div>
                    <p className="mt-3 text-sm text-ink/70">{event.shortDescription}</p>
                    <div className="mt-4 space-y-2 text-sm text-ink/70">
                      <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-terracotta" /> {event.date} · {event.startTime}</div>
                      <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-terracotta" /> {event.location}</div>
                      <div className="flex items-center gap-2"><Ticket className="h-4 w-4 text-terracotta" /> {event.price ? `${event.price.toLocaleString("hu-HU")} Ft` : "Ingyenes"}</div>
                    </div>
                    <Link to={`/esemenyek/${event.slug}`} className="mt-5 inline-flex rounded-full bg-forest px-5 py-2.5 font-sans text-sm font-semibold text-paper hover:bg-terracotta">
                      Részletek és jelentkezés
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

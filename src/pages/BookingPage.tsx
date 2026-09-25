import { Link } from "react-router-dom";
import { services } from "../lib/siteData";

export function BookingPage() {
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

      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8 lg:px-12">
        <section className="rounded-[32px] border border-forest/10 bg-white/60 p-8 shadow-sm sm:p-12">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.28em] text-terracotta">
            Egyéni időpontfoglalás
          </p>
          <h1 className="mt-4 font-serif text-4xl text-forest">Válassz a nyugodt, személyre szabott alkalmak közül.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-ink/75">
            A részletek, az időpontok és a legjobb megoldás a személyes egyeztetés után alakulnak ki — így minden találkozás a lehető leginkább hozzád illeszkedik.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {services.map((service) => (
              <article key={service.id} className="rounded-[26px] border border-forest/10 bg-paper p-5 text-left shadow-sm">
                <span className="inline-flex rounded-full bg-terracotta/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-terracotta">
                  {service.duration} perc
                </span>
                <h2 className="mt-4 font-serif text-2xl text-forest">{service.name}</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink/70">{service.description}</p>
                <div className="mt-5 flex items-center justify-between border-t border-forest/10 pt-4">
                  <span className="font-sans text-sm font-semibold text-forest">{service.price?.toLocaleString("hu-HU")} Ft</span>
                  <a
                    href="mailto:mesegombolyag@gmail.com?subject=Foglalás%20kérés"
                    className="inline-flex rounded-full bg-forest px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-paper hover:bg-terracotta"
                  >
                    Kapcsolat
                  </a>
                </div>
              </article>
            ))}
          </div>

          <a
            href="mailto:mesegombolyag@gmail.com"
            className="mt-8 inline-flex rounded-full bg-forest px-6 py-3.5 font-sans text-sm font-semibold text-paper hover:bg-terracotta"
          >
            Kapcsolat Johannával
          </a>
        </section>
      </main>
    </div>
  );
}

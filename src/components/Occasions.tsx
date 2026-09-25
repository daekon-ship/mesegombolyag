const offerings = [
  {
    title: "Személyes mesealapú beszélgetés",
    text: "Bizalmi és nyugodt tér, ahol a történetek és a szimbólumok új perspektívát adnak a nehéz helyzetekhez.",
  },
  {
    title: "Anyák és gyermekek közös meseidő",
    text: "A közös játék, a nyugodt hangulat és a történet összekötheti a családi ritmust és a bizalmat.",
  },
  {
    title: "Csoportos mese- és alkotó kör",
    text: "Közösségi, kézművesen és narratív módon támogatott alkalom, amely a figyelmet és a kapcsolódást erősíti.",
  },
];

export function Occasions() {
  return (
    <section id="alkalmak" className="bg-forest py-24 text-paper sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-ochre">
              Alkalmak és folyamatok
            </p>
            <h2 className="max-w-lg font-serif text-[1.9rem] leading-tight sm:text-[2.3rem]">
              Biztonságos, személyre szabott mesés pillanatok a saját tempódban.
            </h2>
          </div>
          <p className="max-w-xs font-sans text-sm leading-relaxed text-paper/65">
            A mélyebb részletek és az időpontok személyes egyeztetéssel alakulnak.
          </p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {offerings.map((item) => (
            <article
              key={item.title}
              className="rounded-[26px] border border-paper/12 bg-paper/[0.04] p-6 text-left shadow-[0_16px_32px_rgba(20,31,29,0.12)]"
            >
              <span className="inline-flex rounded-full border border-paper/15 bg-paper/5 px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-ochre">
                Alkalom
              </span>
              <h3 className="mt-5 font-serif text-2xl text-paper">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-paper/75">{item.text}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-[28px] border border-paper/12 bg-paper/[0.04] p-8 sm:mt-14">
          <p className="max-w-2xl font-sans text-base leading-relaxed text-paper/75">
            A pontos időpontok és a személyes egyeztetés után tudjuk a legjobban összehangolni a folyamatot, a környezetet és a végeredményt.
          </p>

          <a
            href="mailto:mesegombolyag@gmail.com"
            className="focus-ring mt-7 inline-flex items-center gap-2 rounded-full bg-paper px-5 py-3 font-sans text-sm font-semibold text-forest transition-colors hover:bg-ochre hover:text-forest"
          >
            Kapcsolat Johannával
          </a>
        </div>
      </div>
    </section>
  );
}

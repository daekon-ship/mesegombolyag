import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Oldalváltáskor a lap tetejére görget; ha az útvonal `?szakasz=<id>` paramétert kap
 * (pl. aloldalról a főoldal egy szakaszára), oda görget.
 */
export function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    const section = new URLSearchParams(search).get("szakasz");
    if (section) {
      requestAnimationFrame(() => document.getElementById(section)?.scrollIntoView());
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, search]);
  return null;
}

/**
 * Főoldali szakaszra görgetés. HashRouter mellett a `#szakasz` típusú horgony
 * útvonalváltásnak számítana, ezért görgetést használunk helyette.
 */
export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
  return true;
}

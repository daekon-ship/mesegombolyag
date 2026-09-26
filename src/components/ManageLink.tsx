import { Link } from "react-router-dom";

/**
 * Ha nincs e-mail-küldés, a szerver a beküldés válaszában adja vissza a saját foglalás
 * kezelésére szolgáló hivatkozást — ez csak a beküldőnek jelenik meg, ide.
 */
export function ManageLink({ url }: { url?: string }) {
  if (!url) return null;
  const hashIndex = url.indexOf("#");
  const path = hashIndex >= 0 ? url.slice(hashIndex + 1) : null;
  return (
    <p className="rounded-2xl border border-forest/15 bg-white/70 p-4 text-sm leading-relaxed text-ink/75">
      Mentsd el ezt a hivatkozást: ezzel tudod később megnézni vagy lemondani a foglalásodat.{" "}
      {path ? (
        <Link to={path} className="focus-ring break-all font-semibold text-forest underline hover:text-terracotta">Foglalás kezelése</Link>
      ) : (
        <a href={url} className="focus-ring break-all font-semibold text-forest underline hover:text-terracotta">Foglalás kezelése</a>
      )}
    </p>
  );
}

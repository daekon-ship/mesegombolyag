import { Link } from "react-router-dom";

/**
 * Ha nincs e-mail-küldés, a szerver a beküldés válaszában adja vissza a saját foglalás
 * kezelésére szolgáló hivatkozást — ez csak a beküldőnek jelenik meg, ide.
 */
export function ManageLink({ url, kind = "booking" }: { url?: string; kind?: "booking" | "registration" }) {
  if (!url) return null;
  const hashIndex = url.indexOf("#");
  const path = hashIndex >= 0 ? url.slice(hashIndex + 1) : null;
  return (
    <p className="rounded-2xl border border-forest/15 bg-white/70 p-4 text-sm leading-relaxed text-ink/75">
      Mentsd el ezt a hivatkozást: ezzel tudod később megnézni vagy lemondani a {kind === "booking" ? "foglalásodat" : "jelentkezésedet"}.{" "}
      {path ? (
        <Link to={path} className="focus-ring break-all font-semibold text-forest underline hover:text-terracotta">{kind === "booking" ? "Foglalás kezelése" : "Jelentkezés kezelése"}</Link>
      ) : (
        <a href={url} className="focus-ring break-all font-semibold text-forest underline hover:text-terracotta">{kind === "booking" ? "Foglalás kezelése" : "Jelentkezés kezelése"}</a>
      )}
    </p>
  );
}

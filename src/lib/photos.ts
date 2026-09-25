/**
 * Központi fotótár — a Mesegombolyag oldalon használt valódi fényképek.
 *
 * A projektfőmappába kapott négy új ügyfélfotó közül kettő a korábbi
 * készlet duplikátuma volt (azonos MD5), ezért a négy képen négy, eltartalmú
 * fotó jelenik meg:
 *
 *  1. „kép ami fent legyen.jpeg"   → story-circle-evening.jpg  — esti meseest az udvaron
 *  2. „kép ami fent legyen.jpg"    → megegyezik a hero-portrait.jpg-vel (Johannaportré)
 *  3. „kép ami fent legyena.jfif"  → nature-mandala.jpg        — természet-mandala alkotás
 *  4. „kép amit fent legyen!.jpg"  → megegyezik a group-evening-circle.jpg-vel (kerti kör)
 */

import heroPortrait from "../assets/photos/hero-portrait.jpg";
import storyCircleEvening from "../assets/photos/story-circle-evening.jpg";
import natureMandala from "../assets/photos/nature-mandala.jpg";
import groupEveningCircle from "../assets/photos/group-evening-circle.jpg";
import picnicFabrics from "../assets/photos/picnic-fabrics.jpg";

/**
 * A fénykép fókuszpontja (object-position) képernyőméret-töréspontonként.
 * Az arcot tartalmazó portréknál a keretközép nem garantálja a jó vágást,
 * ezért minden képhez explicit, tesztelt érték tartozik.
 */
export type PhotoFocus = {
  /** alapértelmezett object-position, pl. "50% 18%" */
  base: string;
  /** keskeny kijelzőn (max 640 px) alkalmazott érték */
  mobile?: string;
  /** széles kijelzőn (min 1024 px) alkalmazott érték */
  desktop?: string;
};

export type SitePhoto = {
  src: string;
  alt: string;
  /** megjelenítési képarány (width / height) — töréspontonként felülírható */
  ratio: { base: string; sm?: string; lg?: string };
  focus?: PhotoFocus;
  /** fenti felső él; a korábban hibásan vágott képeknél fontos */
  topSafe?: boolean;
};

/** Johanna arcképe a hero szekcióhoz — a főoldal egyetlen eager képe. */
export const heroPhoto: SitePhoto = {
  src: heroPortrait,
  alt: "Tóth Johanna meseterapeuta mosolyogva otthonos, növényekkel teli térben",
  // Az arc a kép balharmadában van (kb. 25–30% vízszintesen), a szemek
  // magassága kb. 30% függőlegesen: ezekkel a fókuszpontokkal az arc
  // a keretben középen marad minden törésponton.
  ratio: { base: "3 / 4", sm: "3 / 4" },
  focus: { base: "28% 18%", mobile: "30% 22%", desktop: "28% 16%" },
};

/** Esti meseest kerti körben — az alkalmak bemutatásához. */
export const storyCirclePhoto: SitePhoto = {
  src: storyCircleEvening,
  alt: "Esti mesealkalom gyertyafénnyel, körben ülő résztvevőkkel az udvaron",
  ratio: { base: "4 / 3", lg: "5 / 4" },
  focus: { base: "50% 50%" },
};

/** Természet-mandala alkotás — a meseterápia lényegének illusztrálásához. */
export const natureMandalaPhoto: SitePhoto = {
  src: natureMandala,
  alt: "Szivarfalevelekből és virágból komponált körmandala természetes anyagokból",
  ratio: { base: "1 / 1", lg: "4 / 5" },
  focus: { base: "50% 50%" },
};

/** Kerti közösségi kör — a Rólam szekcióban Johannát nem tartalmaz, csoportkép. */
export const groupCirclePhoto: SitePhoto = {
  src: groupEveningCircle,
  alt: "Csoportos meseest a kertben, füzérfénnyel megvilágított udvarban",
  ratio: { base: "4 / 5" },
  // Az eredeti felső vágás eltűntette a füzérfényeket; kicsit lejjebb
  // tolva a fókuszt a lampionok és a tető is látszik.
  focus: { base: "50% 42%" },
};

/** Textil- és anyagminták közös alkotáshoz — az Instagram blokkhoz. */
export const picnicFabricsPhoto: SitePhoto = {
  src: picnicFabrics,
  alt: "Színes textíliák és fonalak közös alkotóalkalomra kiterítve",
  ratio: { base: "3 / 4" },
  focus: { base: "50% 45%" },
};

/** A hosszú szövegblokkok ideális sorhossza (kb. 60–70 karakter). */
export const MEASURE_CLASS = "max-w-[62ch]";

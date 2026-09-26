import type { SiteContent } from "./types";

/**
 * Az oldal alapszövegei. A szerver adatbázisában tárolt, adminból szerkesztett
 * értékek ezeket írják felül, amint a nyilvános adatok betöltődnek.
 */
export const defaultSiteContent: SiteContent = {
  heroTitle: "Meríts abból, ami benned van!",
  heroSubtitle: "Meseterápiával a lelki immunrendszerért.",
  heroDescription:
    "Vannak időszakok, amikor nem újabb tanácsokra van szükségünk, hanem arra, hogy egy kicsit megálljunk, és más szemszögből nézzünk rá a velünk történtekre.",
  heroImage: "",
  introTitle: "Minden élethelyzetnek megvan a mesebeli párja.",
  introText:
    "A népmesék szimbólumai és megküzdési mintái évszázados tudást hordoznak — segítségükkel más nézőpontból tekinthetünk saját élethelyzeteinkre.",
  contactEmail: "mesegombolyag@gmail.com",
  contactPhone: "",
  location: "Szeged",
  privacyPolicy: "",
  impressum: "",
};

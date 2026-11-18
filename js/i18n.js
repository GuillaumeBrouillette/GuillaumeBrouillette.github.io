const NAV_TRANSLATIONS = {
  en: {
    home: "Home",
    research: "Research",
    publications: "Publications",
    teaching: "Teaching",
    horizons: "Seminar",
    applets: "Applets",
    cv: "CV",
    contact: "Contact",
    position: "Postdoctoral researcher and lecturer",
    university: "Université du Québec à Trois-Rivières"
  },
  fr: {
    home: "Accueil",
    research: "Recherche",
    publications: "Publications",
    teaching: "Enseignement",
    horizons: "Séminaire",
    applets: "Applettes",
    cv: "CV",
    contact: "Contact",
    position: "Chercheur postdoctoral et chargé de cours",
    university: "Université du Québec à Trois-Rivières"
  }
};

const HERO_TITLES = {
  en: { publications: "Publications and talks", horizons: "Horizons Mathématiques" },
  fr: { publications: "Publications et conférences", horizons: "Horizons Mathématiques" }
};

// Language of the current page. Pages under /fr/ and /en/ declare it in the
// navbar placeholder. Applet pages are shared by both languages and read it
// from the ?lang= query parameter, then from the browser language.
function getSiteLang() {
  const declared = document.getElementById("navbar-placeholder")?.dataset.lang;
  if (declared === "en" || declared === "fr") return declared;
  const q = new URLSearchParams(window.location.search).get("lang");
  if (q === "en" || q === "fr") return q;
  const l = (navigator.language || "fr").toLowerCase();
  return l.indexOf("en") === 0 ? "en" : "fr";
}

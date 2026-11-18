// Shared helper for the applet pages.
//
// Each applet is a single page that serves both languages. The language comes
// from getSiteLang() (js/i18n.js): the ?lang= query parameter, then the
// browser language. An applet declares its strings as
//   { fr: { key: "..." }, en: { key: "..." } }
// and calls Applet.localize(strings), which fills every element carrying a
// data-i18n="key" attribute and returns a lookup function t(key).

const Applet = (() => {
  const COMMON = {
    fr: { back: "Toutes les applettes" },
    en: { back: "All applets" },
  };

  const lang = getSiteLang();

  function localize(strings) {
    const dict = Object.assign({}, COMMON[lang], strings[lang] || {});
    document.documentElement.lang = lang;

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const value = dict[el.dataset.i18n];
      if (value !== undefined) el.innerHTML = value;
    });
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const value = dict[el.dataset.i18nTitle];
      if (value !== undefined) el.title = value;
    });
    document.querySelectorAll("[data-applets-link]").forEach((a) => {
      a.href = `/${lang}/applets.html`;
    });
    if (dict.docTitle) document.title = dict.docTitle;

    return (key) => (dict[key] !== undefined ? dict[key] : key);
  }

  // Decimal separator follows the language (comma in French).
  function fmt(x, digits = 2) {
    const s = Number(x).toFixed(digits);
    return lang === "fr" ? s.replace(".", ",") : s;
  }

  return { lang, localize, fmt };
})();

// Ensure NAV_TRANSLATIONS is already loaded via i18n.js

document.addEventListener("DOMContentLoaded", () => {

  // ------------------ NAVBAR ------------------
  const navbarPlaceholder = document.getElementById("navbar-placeholder");
  const heroPlaceholder = document.getElementById("hero-placeholder");
  const footerPlaceholder = document.getElementById("footer-placeholder");

  const page = navbarPlaceholder?.dataset.page || "home";
  const lang = navbarPlaceholder?.dataset.lang || "fr";

  // Build a root-absolute URL for a given page in a given language.
  const pageUrl = (lng, pg) => `/${lng}/${pg === "home" ? "index" : pg}.html`;

  // --------- Insert Navbar ---------
  if (navbarPlaceholder) {
    fetch("/partials/navbar.html")
      .then(res => res.text())
      .then(html => {
        navbarPlaceholder.innerHTML = html;

        // Point the brand link to the current-language home page
        const brand = navbarPlaceholder.querySelector(".navbar-brand");
        if (brand) brand.href = pageUrl(lang, "home");

        // Set active page
        navbarPlaceholder.querySelectorAll(".nav-link[data-page]").forEach(link => {
          if (link.dataset.page === page) link.classList.add("active");

          // Update href based on language
          link.href = pageUrl(lang, link.dataset.page);

          // Translate label
          if (link.dataset.key) {
            link.textContent = NAV_TRANSLATIONS[lang][link.dataset.key];
          }
        });

        // Language switch buttons
        navbarPlaceholder.querySelectorAll("[data-lang]").forEach(el => {
          if (el.dataset.lang === lang) el.classList.add("active");

          el.addEventListener("click", e => {
            e.preventDefault();
            window.location.href = pageUrl(el.dataset.lang, page);
          });
        });
      });
  }

  // ------------------ HERO ------------------
  if (heroPlaceholder) {
    fetch("/partials/hero.html")
      .then(res => res.text())
      .then(html => {
        heroPlaceholder.innerHTML = html;

        const titleEl = document.getElementById("hero-title");
        const subtitleEl = document.getElementById("hero-subtitle");

        if (page === "home") {
          titleEl.textContent = "Guillaume Brouillette";
          // No subtitle on the home hero; the position still shows in the footer.
          subtitleEl?.remove();
        } else {
          titleEl.textContent = (HERO_TITLES[lang] && HERO_TITLES[lang][page]) || NAV_TRANSLATIONS[lang][page];
          subtitleEl?.remove();
        }
      });
  }

  // ------------------ FOOTER ------------------
if (footerPlaceholder) {
  fetch("/partials/footer.html")
    .then(res => res.text())
    .then(html => {
      footerPlaceholder.innerHTML = html;

      const lang =
        document.querySelector("#navbar-placeholder")?.dataset.lang || "en";

      footerPlaceholder.querySelectorAll("[data-key]").forEach(el => {
        const key = el.dataset.key;
        if (NAV_TRANSLATIONS[lang][key]) {
          el.textContent = NAV_TRANSLATIONS[lang][key];
        }
      });
    });
}
});

// Ensure NAV_TRANSLATIONS is already loaded via i18n.js

document.addEventListener("DOMContentLoaded", () => {

  // ------------------ NAVBAR ------------------
  const navbarPlaceholder = document.getElementById("navbar-placeholder");
  const heroPlaceholder = document.getElementById("hero-placeholder");
  const footerPlaceholder = document.getElementById("footer-placeholder");

  const page = navbarPlaceholder?.dataset.page || "home";
  const lang = navbarPlaceholder?.dataset.lang || "fr";

  // --------- Insert Navbar ---------
  if (navbarPlaceholder) {
    fetch("partials/navbar.html")
      .then(res => res.text())
      .then(html => {
        navbarPlaceholder.innerHTML = html;

        // Set active page
        navbarPlaceholder.querySelectorAll(".nav-link[data-page]").forEach(link => {
          if (link.dataset.page === page) link.classList.add("active");

          // Update href based on language
          const p = link.dataset.page;
          if (lang === "fr") {
            link.href = p === "home" ? "index-fr.html" : `${p}-fr.html`;
          } else {
            link.href = p === "home" ? "index.html" : `${p}.html`;
          }

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
            const newLang = el.dataset.lang;
            let newHref;
            if (newLang === "fr") {
              newHref = page === "home" ? "index-fr.html" : `${page}-fr.html`;
            } else {
              newHref = page === "home" ? "index.html" : `${page}.html`;
            }
            window.location.href = newHref;
          });
        });
      });
  }

  // ------------------ HERO ------------------
  if (heroPlaceholder) {
    fetch("partials/hero.html")
      .then(res => res.text())
      .then(html => {
        heroPlaceholder.innerHTML = html;

        const titleEl = document.getElementById("hero-title");
        const subtitleEl = document.getElementById("hero-subtitle");

        if (page === "home") {
          titleEl.textContent = "Guillaume Brouillette";
          subtitleEl.textContent = NAV_TRANSLATIONS[lang].position;
        } else {
          titleEl.textContent = (HERO_TITLES[lang] && HERO_TITLES[lang][page]) || NAV_TRANSLATIONS[lang][page];
          subtitleEl?.remove();
        }
      });
  }

  // ------------------ FOOTER ------------------
if (footerPlaceholder) {
  fetch("partials/footer.html")
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
(function () {
  "use strict";

  var lang = document.documentElement.lang === "ru" ? "ru" : "es";

  /* ---------- Mobile nav ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var mainNav = document.querySelector(".main-nav");
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      var open = mainNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------- Cookie consent ---------- */
  var STORAGE_KEY = "aav_cookie_consent";
  var banner = document.getElementById("cookie-banner");
  var modal = document.getElementById("cookie-modal");

  var STRINGS = {
    es: {
      savedAcceptAll: "todas aceptadas",
      savedRejectAll: "solo necesarias",
      savedCustom: "preferencias guardadas"
    },
    ru: {
      savedAcceptAll: "все приняты",
      savedRejectAll: "только необходимые",
      savedCustom: "настройки сохранены"
    }
  };

  function getConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setConsent(prefs) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (e) { /* storage unavailable, ignore */ }
  }

  function applyConsentToSwitches(prefs) {
    var prefSwitch = document.getElementById("cookie-pref-preferences");
    var analyticsSwitch = document.getElementById("cookie-pref-analytics");
    if (prefSwitch) prefSwitch.checked = !!(prefs && prefs.preferences);
    if (analyticsSwitch) analyticsSwitch.checked = !!(prefs && prefs.analytics);
  }

  function hideBanner() {
    if (banner) banner.classList.remove("is-visible");
  }
  function showBanner() {
    if (banner) banner.classList.add("is-visible");
  }
  function hideModal() {
    if (modal) modal.classList.remove("is-visible");
  }
  function showModal() {
    if (modal) modal.classList.add("is-visible");
  }

  var existing = getConsent();
  if (!existing) {
    showBanner();
  } else {
    applyConsentToSwitches(existing);
  }

  var acceptAllBtns = document.querySelectorAll("[data-cookie-accept-all]");
  var rejectAllBtns = document.querySelectorAll("[data-cookie-reject-all]");
  var openPrefsBtns = document.querySelectorAll("[data-cookie-open-prefs]");
  var savePrefsBtn = document.getElementById("cookie-save-prefs");
  var closeModalBtns = document.querySelectorAll("[data-cookie-close-modal]");

  acceptAllBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var prefs = { necessary: true, preferences: true, analytics: true, ts: "accept_all" };
      setConsent(prefs);
      applyConsentToSwitches(prefs);
      hideBanner();
      hideModal();
    });
  });

  rejectAllBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var prefs = { necessary: true, preferences: false, analytics: false, ts: "reject_all" };
      setConsent(prefs);
      applyConsentToSwitches(prefs);
      hideBanner();
      hideModal();
    });
  });

  openPrefsBtns.forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var current = getConsent();
      applyConsentToSwitches(current || { preferences: false, analytics: false });
      showModal();
      hideBanner();
    });
  });

  closeModalBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      hideModal();
      if (!getConsent()) showBanner();
    });
  });

  if (savePrefsBtn) {
    savePrefsBtn.addEventListener("click", function () {
      var prefSwitch = document.getElementById("cookie-pref-preferences");
      var analyticsSwitch = document.getElementById("cookie-pref-analytics");
      var prefs = {
        necessary: true,
        preferences: prefSwitch ? prefSwitch.checked : false,
        analytics: analyticsSwitch ? analyticsSwitch.checked : false,
        ts: "custom"
      };
      setConsent(prefs);
      hideModal();
      hideBanner();
    });
  }

  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        hideModal();
        if (!getConsent()) showBanner();
      }
    });
  }

  /* ---------- AJAX form submission (Formspree-compatible) ---------- */
  document.querySelectorAll("[data-ajax-form]").forEach(function (form) {
    var msg = form.querySelector(".form-msg");
    var submitBtn = form.querySelector('button[type="submit"]');
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.action.indexOf("YOUR_FORM_ID") !== -1) {
        if (msg) {
          msg.textContent = form.getAttribute("data-error") || "Formulario no configurado todavía.";
          msg.className = "form-msg is-visible form-msg--err";
        }
        return;
      }
      if (submitBtn) submitBtn.disabled = true;
      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      }).then(function (response) {
        if (response.ok) {
          if (msg) {
            msg.textContent = form.getAttribute("data-success") || "Gracias, hemos recibido su mensaje.";
            msg.className = "form-msg is-visible form-msg--ok";
          }
          form.reset();
        } else {
          if (msg) {
            msg.textContent = form.getAttribute("data-error") || "No se pudo enviar el formulario. Inténtelo de nuevo.";
            msg.className = "form-msg is-visible form-msg--err";
          }
        }
      }).catch(function () {
        if (msg) {
          msg.textContent = form.getAttribute("data-error") || "No se pudo enviar el formulario. Inténtelo de nuevo.";
          msg.className = "form-msg is-visible form-msg--err";
        }
      }).finally(function () {
        if (submitBtn) submitBtn.disabled = false;
      });
    });
  });

  /* ---------- Booking link outbound note ---------- */
  document.querySelectorAll("[data-booking-link]").forEach(function (link) {
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
  });
})();

(function () {
  "use strict";

  /* ============================================================
     NAV: scroll shadow, mobile menu, active link, back-to-top
     ============================================================ */
  var nav = document.getElementById("nav");
  var burger = document.getElementById("navBurger");
  var navLinksEl = document.getElementById("navLinks");
  var backToTop = document.getElementById("backToTop");
  var navLinkItems = document.querySelectorAll("[data-nav]");

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    nav.classList.toggle("is-scrolled", y > 8);
    if (backToTop) backToTop.classList.toggle("is-visible", y > 700);
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (burger && navLinksEl) {
    burger.addEventListener("click", function () {
      var open = navLinksEl.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    navLinkItems.forEach(function (link) {
      link.addEventListener("click", function () {
        navLinksEl.classList.remove("is-open");
        burger.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  if (backToTop) {
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Active link highlighting via IntersectionObserver
  var sections = ["home", "services", "about", "pricing", "contact"]
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = entry.target.id;
            navLinkItems.forEach(function (link) {
              link.classList.toggle("is-active", link.getAttribute("href") === "#" + id);
            });
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach(function (s) { navObserver.observe(s); });
  }

  /* ============================================================
     SCROLL REVEAL
     ============================================================ */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ============================================================
     LIVE TIMEZONE CONSOLE
     Business timezone: Africa/Johannesburg (SAST, UTC+2, no DST)
     Visitor timezone: auto-detected from the browser
     ============================================================ */
  var BUSINESS_TZ = "Africa/Johannesburg";
  var visitorTz = "UTC";
  try {
    visitorTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch (e) { /* keep UTC fallback */ }

  var isSameTz = visitorTz === BUSINESS_TZ;

  var businessTimeEls = [document.getElementById("businessTime"), document.getElementById("businessTime2")];
  var businessDateEl = document.getElementById("businessDate");
  var visitorTimeEls = [document.getElementById("visitorTime"), document.getElementById("visitorTime2")];
  var visitorDateEl = document.getElementById("visitorDate");
  var visitorLabelEls = [document.getElementById("visitorLabel"), document.getElementById("visitorLabel2")];
  var tzOffsetEl = document.getElementById("tzOffset");
  var openStatusEl = document.getElementById("openStatus");

  var timeFmt = { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false };
  var dateFmt = { weekday: "short", day: "2-digit", month: "short" };

  function friendlyTzName(tz) {
    var last = tz.split("/").pop() || tz;
    return last.replace(/_/g, " ");
  }

  function getOffsetMinutes(tz) {
    // Compute UTC offset (in minutes) for a given IANA timezone, "now".
    var now = new Date();
    var dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    });
    var parts = dtf.formatToParts(now).reduce(function (acc, p) {
      acc[p.type] = p.value;
      return acc;
    }, {});
    var asUTC = Date.UTC(
      parseInt(parts.year, 10), parseInt(parts.month, 10) - 1, parseInt(parts.day, 10),
      parts.hour === "24" ? 0 : parseInt(parts.hour, 10), parseInt(parts.minute, 10), parseInt(parts.second, 10)
    );
    return Math.round((asUTC - now.getTime()) / 60000);
  }

  function fmtOffset(mins) {
    var sign = mins >= 0 ? "+" : "-";
    var abs = Math.abs(mins);
    var h = Math.floor(abs / 60);
    var m = abs % 60;
    return "UTC" + sign + h + (m ? ":" + String(m).padStart(2, "0") : "");
  }

  if (visitorLabelEls.length) {
    var label = isSameTz ? "Your local time (South Africa)" : "Your local time — " + friendlyTzName(visitorTz);
    visitorLabelEls.forEach(function (el) { if (el) el.textContent = label; });
  }

  function isBusinessOpen(nowInBusinessTz) {
    var day = nowInBusinessTz.getDay(); // 0 Sun ... 6 Sat
    var hour = nowInBusinessTz.getHours();
    var minute = nowInBusinessTz.getMinutes();
    var mins = hour * 60 + minute;
    var isWeekday = day >= 1 && day <= 5;
    return isWeekday && mins >= (8 * 60) && mins < (18 * 60);
  }

  function updateClocks() {
    var now = new Date();

    var businessTimeStr = new Intl.DateTimeFormat("en-GB", Object.assign({ timeZone: BUSINESS_TZ }, timeFmt)).format(now);
    var businessDateStr = new Intl.DateTimeFormat("en-GB", Object.assign({ timeZone: BUSINESS_TZ }, dateFmt)).format(now);
    businessTimeEls.forEach(function (el) { if (el) el.textContent = businessTimeStr; });
    if (businessDateEl) businessDateEl.textContent = businessDateStr + " · SAST";

    var visitorTimeStr = new Intl.DateTimeFormat("en-GB", Object.assign({ timeZone: visitorTz }, timeFmt)).format(now);
    var visitorDateStr = new Intl.DateTimeFormat("en-GB", Object.assign({ timeZone: visitorTz }, dateFmt)).format(now);
    visitorTimeEls.forEach(function (el) { if (el) el.textContent = visitorTimeStr; });
    if (visitorDateEl) visitorDateEl.textContent = visitorDateStr;

    // Business open/closed status, evaluated in business local time
    var businessParts = new Intl.DateTimeFormat("en-US", {
      timeZone: BUSINESS_TZ, hour12: false, weekday: "short",
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"
    }).formatToParts(now).reduce(function (acc, p) { acc[p.type] = p.value; return acc; }, {});
    var weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    var fauxDate = new Date();
    fauxDate.setHours(parseInt(businessParts.hour, 10), parseInt(businessParts.minute, 10), 0, 0);
    var open = weekdayMap[businessParts.weekday] >= 1 && weekdayMap[businessParts.weekday] <= 5 &&
      isBusinessOpen(fauxDate);

    if (openStatusEl) {
      openStatusEl.textContent = open ? "OPEN NOW" : "CLOSED";
      openStatusEl.classList.toggle("is-closed", !open);
    }

    if (tzOffsetEl) {
      if (isSameTz) {
        tzOffsetEl.textContent = "You're viewing this from the same timezone as our studio (SAST, UTC+2).";
      } else {
        var bizOffset = getOffsetMinutes(BUSINESS_TZ);
        var visOffset = getOffsetMinutes(visitorTz);
        var diff = Math.round((visOffset - bizOffset) / 60 * 10) / 10;
        var diffLabel = diff === 0 ? "same time as" : (diff > 0 ? diff + "h ahead of" : Math.abs(diff) + "h behind") ;
        tzOffsetEl.textContent = friendlyTzName(visitorTz) + " (" + fmtOffset(visOffset) + ") is " + diffLabel + " Cape Town (" + fmtOffset(bizOffset) + ").";
      }
    }
  }

  updateClocks();
  setInterval(updateClocks, 1000);

  /* ============================================================
     CURRENCY CONVERSION
     Base price: R1,460 (ZAR) — official price, always shown.
     Automatically detects the visitor's likely currency from their
     browser locale and shows an approximate converted amount.
     ============================================================ */
  var BASE_ZAR = 1460;

  // Locale region -> ISO currency code (major regions covered)
  var REGION_CURRENCY = {
    ZA: "ZAR", US: "USD", GB: "GBP", IE: "EUR", DE: "EUR", FR: "EUR", ES: "EUR", IT: "EUR",
    NL: "EUR", PT: "EUR", BE: "EUR", AT: "EUR", FI: "EUR", GR: "EUR", LU: "EUR", SK: "EUR",
    SI: "EUR", EE: "EUR", LV: "EUR", LT: "EUR", CY: "EUR", MT: "EUR", HR: "EUR",
    CA: "CAD", AU: "AUD", NZ: "NZD", IN: "INR", NG: "NGN", KE: "KES", GH: "GHS",
    AE: "AED", SA: "SAR", CN: "CNY", JP: "JPY", KR: "KRW", SG: "SGD", HK: "HKD",
    CH: "CHF", SE: "SEK", NO: "NOK", DK: "DKK", PL: "PLN", CZ: "CZK", HU: "HUF",
    RO: "RON", TR: "TRY", BR: "BRL", MX: "MXN", AR: "ARS", ZW: "ZWL", ZM: "ZMW",
    MZ: "MZN", BW: "BWP", NA: "NAD", MU: "MUR", EG: "EGP", MA: "MAD", IL: "ILS",
    PH: "PHP", ID: "IDR", MY: "MYR", TH: "THB", VN: "VND", PK: "PKR", BD: "BDT",
    RU: "RUB", UA: "UAH"
  };

  // Static approximate fallback rates (units of currency per 1 ZAR),
  // used if the live conversion API is unavailable or the currency
  // isn't supported by it. Approximate only.
  var FALLBACK_RATES_PER_ZAR = {
    USD: 0.055, EUR: 0.051, GBP: 0.043, CAD: 0.076, AUD: 0.084, NZD: 0.091,
    INR: 4.6, NGN: 85, KES: 7.1, GHS: 0.8, AED: 0.2, SAR: 0.21, CNY: 0.4,
    JPY: 8.3, KRW: 75, SGD: 0.073, HKD: 0.43, CHF: 0.048, SEK: 0.58, NOK: 0.59,
    DKK: 0.38, PLN: 0.22, CZK: 1.27, HUF: 20, RON: 0.26, TRY: 1.9, BRL: 0.31,
    MXN: 1.05, ARS: 55, ZMW: 1.5, MZN: 3.5, BWP: 0.75, NAD: 1, MUR: 2.5,
    EGP: 2.7, MAD: 0.55, ILS: 0.2, PHP: 3.1, IDR: 880, MYR: 0.25, THB: 1.95,
    VND: 1400, PKR: 15.5, BDT: 6.6, RUB: 5.1, UAH: 2.3
  };

  var CURRENCY_LOCALE = {
    USD: "en-US", EUR: "de-DE", GBP: "en-GB", CAD: "en-CA", AUD: "en-AU", NZD: "en-NZ",
    INR: "en-IN", NGN: "en-NG", KES: "en-KE", GHS: "en-GH", AED: "ar-AE", SAR: "ar-SA",
    CNY: "zh-CN", JPY: "ja-JP", KRW: "ko-KR", SGD: "en-SG", HKD: "zh-HK", CHF: "de-CH",
    SEK: "sv-SE", NOK: "nb-NO", DKK: "da-DK", PLN: "pl-PL", CZK: "cs-CZ", HUF: "hu-HU",
    RON: "ro-RO", TRY: "tr-TR", BRL: "pt-BR", MXN: "es-MX", ARS: "es-AR", ZMW: "en-ZM",
    MZN: "pt-MZ", BWP: "en-BW", NAD: "en-NA", MUR: "en-MU", EGP: "ar-EG", MAD: "ar-MA",
    ILS: "he-IL", PHP: "en-PH", IDR: "id-ID", MYR: "ms-MY", THB: "th-TH", VND: "vi-VN",
    PKR: "ur-PK", BDT: "bn-BD", RUB: "ru-RU", UAH: "uk-UA"
  };

  function detectCurrency() {
    try {
      var locales = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "en-ZA"];
      for (var i = 0; i < locales.length; i++) {
        var loc = new Intl.Locale(locales[i]);
        var region = loc.region || (loc.maximize && loc.maximize().region);
        if (region && REGION_CURRENCY[region]) return REGION_CURRENCY[region];
      }
    } catch (e) { /* fall through */ }
    return null; // unknown — treat as ZAR / no conversion needed
  }

  function formatAmount(amount, currency) {
    try {
      return new Intl.NumberFormat(CURRENCY_LOCALE[currency] || "en-US", {
        style: "currency", currency: currency, maximumFractionDigits: amount >= 100 ? 0 : 2
      }).format(amount);
    } catch (e) {
      return currency + " " + amount.toFixed(0);
    }
  }

  var convertEl = document.getElementById("currencyConvert");
  var currencySelectEl = document.getElementById("currencySelect");

  // The manually-selectable currency list (must match the <select> options in index.html).
  var SELECTABLE_CURRENCIES = ["ZAR","USD","GBP","EUR","AUD","CAD","NZD","AED","SAR","INR","CNY","JPY","CHF","BWP","NAD","ZMW","NGN","KES"];

  function renderConversion(currency, amount, live) {
    if (!convertEl) return;
    if (!currency || currency === "ZAR") {
      convertEl.textContent = "R1,460 ZAR is the official price — no conversion needed.";
      return;
    }
    var formatted = formatAmount(amount, currency);
    convertEl.textContent = "≈ " + formatted + " " + currency + (live ? "" : " (approx.)") +
      " — approximate, based on current exchange rates. R1,460 ZAR remains the official price.";
  }

  // Frankfurter (ECB-backed, free, no API key) supports a defined set of currencies.
  var frankfurterSupported = ["AUD","BGN","BRL","CAD","CHF","CNY","CZK","DKK","EUR","GBP","HKD","HUF","IDR","ILS","INR","ISK","JPY","KRW","MXN","MYR","NOK","NZD","PHP","PLN","RON","SEK","SGD","THB","TRY","USD"];

  function runConversion(currency) {
    if (!currency || currency === "ZAR") {
      renderConversion(currency, 0, true);
      return;
    }

    if (!convertEl) return;
    convertEl.textContent = "Converting to " + currency + "…";

    if (frankfurterSupported.indexOf(currency) !== -1) {
      var controller = ("AbortController" in window) ? new AbortController() : null;
      var timeout = setTimeout(function () { if (controller) controller.abort(); }, 5000);

      fetch("https://api.frankfurter.app/latest?amount=" + BASE_ZAR + "&from=ZAR&to=" + currency, controller ? { signal: controller.signal } : {})
        .then(function (res) {
          clearTimeout(timeout);
          if (!res.ok) throw new Error("rate fetch failed");
          return res.json();
        })
        .then(function (data) {
          var amount = data && data.rates && data.rates[currency];
          if (typeof amount === "number") {
            renderConversion(currency, amount, true);
          } else {
            throw new Error("no rate in response");
          }
        })
        .catch(function () {
          var fallback = FALLBACK_RATES_PER_ZAR[currency];
          if (fallback) renderConversion(currency, BASE_ZAR * fallback, false);
          else if (convertEl) convertEl.textContent = "R1,460 ZAR — the official base price.";
        });
    } else {
      var rate = FALLBACK_RATES_PER_ZAR[currency];
      if (rate) renderConversion(currency, BASE_ZAR * rate, false);
      else if (convertEl) convertEl.textContent = "R1,460 ZAR — the official base price.";
    }
  }

  // Auto-detect the visitor's currency first; fall back to ZAR if it isn't
  // one of the selectable currencies. The visitor can always override manually.
  var detected = detectCurrency();
  var initialCurrency = (detected && SELECTABLE_CURRENCIES.indexOf(detected) !== -1) ? detected : "ZAR";

  if (currencySelectEl) {
    currencySelectEl.value = initialCurrency;
    currencySelectEl.addEventListener("change", function () {
      runConversion(this.value);
    });
  }

  runConversion(initialCurrency);

  /* ============================================================
     CONTACT FORM -> mailto (no backend required)
     ============================================================ */
  var form = document.getElementById("contactForm");
  var formNote = document.getElementById("formNote");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var name = document.getElementById("cf-name").value.trim();
      var email = document.getElementById("cf-email").value.trim();
      var service = document.getElementById("cf-service").value;
      var message = document.getElementById("cf-message").value.trim();

      if (!name || !email || !message) {
        if (formNote) {
          formNote.textContent = "Please fill in your name, email and project details before sending.";
          formNote.classList.remove("is-sent");
        }
        return;
      }

      var subject = "Project brief from " + name + " — " + service;
      var body =
        "Name: " + name + "\n" +
        "Email: " + email + "\n" +
        "Service: " + service + "\n\n" +
        "Project details:\n" + message;

      var mailto = "mailto:habakkukdesigns@outlook.com" +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);

      window.location.href = mailto;

      if (formNote) {
        formNote.textContent = "Opening your email app with the brief pre-filled — just hit send.";
        formNote.classList.add("is-sent");
      }
    });
  }

  /* ============================================================
     FOOTER YEAR
     ============================================================ */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();

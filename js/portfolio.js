(function () {
  "use strict";

  /* ============================================================
     PORTFOLIO LIVE PREVIEWS
     - Lazy-loads each website preview when it nears the viewport.
     - Asks /api/embed-check (Vercel function) which sites allow framing.
     - Sites that block framing get a clear message; every card always
       has an "Open in new tab" button.
     - If the check is unavailable (offline, local file server), the
       previews are still attempted and the button remains.
     ============================================================ */
  var cards = document.querySelectorAll(".portfolio__card[data-host]");
  if (!cards.length) return;

  var MESSAGES = {
    blocked: "This website doesn't allow itself to be previewed inside another site. Use the button below to open it in a new tab.",
    unavailable: "The preview couldn't be loaded right now. Use the button below to open the website in a new tab."
  };

  function fetchWithTimeout(url, ms) {
    if (!("AbortController" in window)) return fetch(url);
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, ms);
    return fetch(url, { signal: controller.signal }).then(function (r) {
      clearTimeout(timer);
      return r;
    }, function (e) {
      clearTimeout(timer);
      throw e;
    });
  }

  var checkPromise = fetchWithTimeout("/api/embed-check", 12000)
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(function (data) { return data && data.sites ? data.sites : null; })
    .catch(function () { return null; });

  function showFallback(card, kind) {
    var frame = card.querySelector(".portfolio__frame");
    var iframe = card.querySelector(".portfolio__iframe");
    var box = card.querySelector(".portfolio__fallback");
    if (!frame || !box) return;
    if (iframe) {
      iframe.removeAttribute("src");
      iframe.hidden = true;
    }
    var text = box.querySelector(".portfolio__fallback-text");
    if (text) text.textContent = MESSAGES[kind] || MESSAGES.unavailable;
    box.hidden = false;
  }

  function loadCard(card) {
    var iframe = card.querySelector(".portfolio__iframe");
    if (!iframe || iframe.getAttribute("src")) return;
    var host = card.getAttribute("data-host");

    checkPromise.then(function (sites) {
      var info = sites && sites[host];
      if (info && info.status === "blocked") {
        showFallback(card, "blocked");
        return;
      }
      iframe.addEventListener("error", function () { showFallback(card, "unavailable"); });
      iframe.setAttribute("src", iframe.getAttribute("data-src"));
    });
  }

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          obs.unobserve(entry.target);
          loadCard(entry.target);
        }
      });
    }, { rootMargin: "400px 0px" });
    cards.forEach(function (card) { observer.observe(card); });
  } else {
    cards.forEach(loadCard);
  }
})();

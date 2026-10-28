(function () {
  "use strict";

  /* ============================================================
     PORTFOLIO LIVE PREVIEWS
     - Lazy-loads each website preview when it nears the viewport.
     - Asks /api/embed-check (Vercel function) which sites allow framing.
     - Sites that allow it show a live, browsable preview.
     - Sites that block framing show a real screenshot of THEIR OWN
       homepage (/api/screenshot?host=...), linking to the website.
     - If a screenshot can't be captured, a clear message for that
       website is shown instead. No placeholder or reused images.
     - Every card always has an "Open in new tab" button.
     ============================================================ */
  var cards = document.querySelectorAll(".portfolio__card[data-host]");
  if (!cards.length) return;

  var MESSAGES = {
    loading: "Loading a screenshot of this website…",
    noshot: "A screenshot of this website couldn't be captured automatically. Use the button below to open it in a new tab."
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

  function setMessage(card, text) {
    var box = card.querySelector(".portfolio__fallback");
    var msg = card.querySelector(".portfolio__fallback-text");
    if (msg) msg.textContent = text;
    if (box) box.hidden = false;
  }

  // Replace the live frame with a real screenshot of this card's own homepage.
  function showScreenshot(card) {
    var host = card.getAttribute("data-host");
    var frame = card.querySelector(".portfolio__frame");
    var iframe = card.querySelector(".portfolio__iframe");
    if (!frame || card.getAttribute("data-shot")) return;
    card.setAttribute("data-shot", "1");

    if (iframe) {
      iframe.removeAttribute("src");
      iframe.hidden = true;
    }
    setMessage(card, MESSAGES.loading);

    var link = document.createElement("a");
    link.className = "portfolio__shot-link";
    link.href = "https://" + host + "/";
    link.target = "_blank";
    link.rel = "noopener";
    link.setAttribute("aria-label", "Open " + host + " in a new tab");

    var img = new Image();
    img.className = "portfolio__shot";
    img.alt = "Screenshot of the " + host + " homepage";
    img.decoding = "async";
    img.onload = function () {
      var label = document.createElement("span");
      label.className = "portfolio__shot-label";
      label.textContent = "SCREENSHOT";
      link.appendChild(img);
      link.appendChild(label);
      frame.appendChild(link);
      frame.classList.add("portfolio__frame--shot");
      var box = card.querySelector(".portfolio__fallback");
      if (box) box.hidden = true;
    };
    img.onerror = function () {
      setMessage(card, MESSAGES.noshot);
    };
    img.src = "/api/screenshot?host=" + encodeURIComponent(host);
  }

  function loadCard(card) {
    var iframe = card.querySelector(".portfolio__iframe");
    if (!iframe || iframe.getAttribute("src") || card.getAttribute("data-shot")) return;
    var host = card.getAttribute("data-host");

    checkPromise.then(function (sites) {
      var info = sites && sites[host];
      if (info && info.status === "blocked") {
        showScreenshot(card);
        return;
      }
      iframe.addEventListener("error", function () { showScreenshot(card); });
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

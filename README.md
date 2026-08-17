# Habakkuk Designs — Website

A complete, production-ready website for **Habakkuk Designs** — "Digital Solutions and Creative Technology."

## What's included

```
habakkuk-designs/
├── index.html          Full one-page site: Home, Services, About, Pricing, Contact
├── css/
│   └── styles.css      All styling, layout, responsive rules and animations
├── js/
│   └── main.js         Navigation, scroll animations, live clocks, currency conversion, contact form
├── assets/
│   └── favicon.svg     Site icon / logo mark
├── sitemap.xml          XML sitemap (SEO) — live domain: https://habakkukdesigns.co.za/
├── robots.txt            Crawl rules + sitemap declaration (SEO)
├── vercel.json           Vercel deployment config (headers/caching only — no routing changes)
└── README.md
```

No build step, no dependencies to install. It's a static site — open `index.html` in a browser, or upload the whole folder to any web host.

## How to run it

**Locally:** double-click `index.html`, or serve it (recommended, so fonts/fetch work identically to production):

```bash
cd habakkuk-designs
python3 -m http.server 8080
# then open http://localhost:8080
```

**To publish:** upload the entire `habakkuk-designs` folder (keeping the folder structure) to any static host — Netlify, Vercel, GitHub Pages, cPanel, etc. Nothing needs configuring; it works as-is.

## Features

- **Fully responsive** — tailored layouts for phones, tablets and desktops.
- **Solid navigation bar** — the nav always has a solid ink background, so menu text stays readable over any content while scrolling.
- **Working contact links** — WhatsApp (`wa.me/27705495751`), phone, and `mailto:habakkukdesigns@outlook.com` links throughout, plus a contact form that opens the visitor's email app with a pre-filled brief (no backend/server required).
- **Live timezone console** — shows Habakkuk Designs' current time in Johannesburg (Africa/Johannesburg, SAST) alongside the visitor's own local time, detected automatically via the browser (`Intl.DateTimeFormat`) and updated every second. It also shows whether the studio is currently open, based on Mon–Fri, 08:00–18:00 SAST.
- **Automatic currency conversion** — the official price (**R1,460**, South African Rand) is always shown as the base price. For international visitors, the site detects a likely local currency from the browser's language/region and shows an approximate converted amount:
  - Live rates are fetched from [Frankfurter](https://www.frankfurter.app/) (free, no API key, ECB-backed).
  - If the live rate can't be fetched (offline, unsupported currency, network blocked), it falls back to built-in approximate rates so the widget never breaks or shows a blank state.
  - South African visitors simply see the Rand price with no extra conversion line.
- **Smooth scroll-reveal animations** on section entry, a hover-driven nav underline, and a subtle marquee — all disabled automatically for visitors with "reduce motion" enabled in their OS.
- **Accessible by default** — semantic landmarks, visible focus states, skip-to-content link, alt text, labelled form fields.

## SEO: sitemap & robots.txt

The site now includes:

- **`sitemap.xml`** — declares the live homepage `https://habakkukdesigns.co.za/`. Habakkuk Designs is a single-page site (Services/About/Pricing/Contact are in-page anchors, not separate URLs), so per Google's own guidance only the one canonical page URL is listed — fragment URLs like `/#services` are intentionally omitted, since search engines treat those as the same page.
- **`robots.txt`** — allows all crawlers (`Allow: /`) and points search engines to the sitemap via a `Sitemap:` directive.

Both are plain static files served from the project root, so they work the same locally, on Vercel, or on any static host — no server configuration required. If the site ever grows beyond a single page (e.g. a real `/blog` or `/case-studies` route), add each new page's URL as its own `<url>` entry in `sitemap.xml`.

## Deploying to Vercel

This project deploys to Vercel with zero build configuration — it's a static site with `index.html` at the root.

1. Push this folder to a Git repository (GitHub/GitLab/Bitbucket), or use the Vercel CLI (`vercel deploy`) directly from this folder.
2. In Vercel, import the repository/folder. Framework preset: **Other** (no build command, no output directory needed — Vercel serves the static files as-is).
3. `vercel.json` is already included and only sets response headers (correct content-types and long-term caching for `css/js/assets`, short caching for `sitemap.xml`/`robots.txt`) — it does not add redirects, rewrites, or change any URLs, so nothing about the site's behavior changes.
4. Once deployed, point the `habakkukdesigns.co.za` domain at the Vercel project (Vercel → Project → Settings → Domains) so the live URLs match those declared in `sitemap.xml`.
5. After going live, verify `https://habakkukdesigns.co.za/sitemap.xml` and `https://habakkukdesigns.co.za/robots.txt` both load, then submit the sitemap in Google Search Console.

## Editing content

- **Text/copy:** edit directly in `index.html` — every section is clearly commented (`<!-- ===== SERVICES ===== -->` etc.).
- **Colours/fonts:** all design tokens live at the top of `css/styles.css` under `:root { ... }`.
- **Price:** update the `R1,460` figure in `index.html` (in the Pricing section) **and** the `BASE_ZAR` constant near the top of the currency section in `js/main.js`, so the converter stays in sync.
- **Contact details:** phone/WhatsApp number and email appear in a few places (nav, hero, pricing CTA, contact section, footer) — search for `27705495751` and `habakkukdesigns@outlook.com` to update everywhere at once.
- **Business hours:** update the visible text in the Contact section, and the `isBusinessOpen()` logic in `js/main.js` (currently Mon–Fri, 08:00–18:00, `Africa/Johannesburg`).

## Notes on the currency widget

Exchange rates move daily. The live figure is clearly labelled as an approximation ("≈") and the interface always states that **R1,460 is the official price** — the converted amount is a convenience for visitors, not a quote.

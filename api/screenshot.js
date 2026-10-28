/*
  Habakkuk Designs — portfolio homepage screenshots (Vercel serverless function)

  GET /api/screenshot?host=<portfolio host>

  Used for portfolio websites that refuse to be embedded in an iframe. It
  captures that website's real homepage with a screenshot service and returns
  the image. Each host gets its own screenshot; nothing is faked — if no
  screenshot can be captured, it answers 502 and the page shows a clear
  message for that website instead.

  Providers, tried in order:
    1. Microlink  (https://microlink.io) — free tier works without a key.
       Set the MICROLINK_API_KEY environment variable in Vercel for higher limits.
    2. thum.io    (https://www.thum.io) — free, no signup (1,000 views/month).

  Successful screenshots are cached by Vercel's CDN for 7 days, so each site is
  captured about once a week, not on every visit.

  Only hosts listed in api/_sites.js can be captured (no open proxy / SSRF).
*/

const { SITES } = require("./_sites");

const MIN_IMAGE_BYTES = 4000; // anything smaller is an error/placeholder, not a real page capture

async function timedFetch(url, options, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, Object.assign({}, options, { signal: controller.signal }));
  } finally {
    clearTimeout(timer);
  }
}

async function fetchImage(url, ms) {
  const res = await timedFetch(url, { redirect: "follow", headers: { accept: "image/*" } }, ms);
  if (!res.ok) throw new Error("image request failed: " + res.status);
  const type = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (!/^image\/(png|jpe?g|webp|gif)$/.test(type)) throw new Error("not an image: " + type);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < MIN_IMAGE_BYTES) throw new Error("image too small to be a page capture");
  return { buf, type };
}

async function viaMicrolink(host) {
  const key = process.env.MICROLINK_API_KEY;
  const endpoint = key ? "https://pro.microlink.io/" : "https://api.microlink.io/";
  const params = new URLSearchParams({
    url: "https://" + host + "/",
    screenshot: "true",
    meta: "false",
    "viewport.width": "1200",
    "viewport.height": "1120"
  });
  const res = await timedFetch(endpoint + "?" + params.toString(), { headers: key ? { "x-api-key": key } : {} }, 22000);
  const json = await res.json().catch(() => null);
  if (!res.ok || !json || json.status !== "success") {
    throw new Error("microlink: " + ((json && (json.code || json.message)) || res.status));
  }
  const shot = json.data && json.data.screenshot && json.data.screenshot.url;
  if (typeof shot !== "string" || !/^https:\/\//.test(shot)) throw new Error("microlink: no screenshot url");
  return fetchImage(shot, 15000);
}

async function viaThum(host) {
  return fetchImage("https://image.thum.io/get/width/1200/crop/1120/https://" + host + "/", 25000);
}

const PROVIDERS = [["microlink", viaMicrolink], ["thum.io", viaThum]];

function readHost(req) {
  if (req.query && typeof req.query.host === "string") return req.query.host;
  try {
    return new URL(req.url, "http://localhost").searchParams.get("host") || "";
  } catch (e) {
    return "";
  }
}

async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET, HEAD");
    return res.end();
  }

  const host = readHost(req).trim().toLowerCase();
  if (!SITES.includes(host)) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=3600");
    return res.end(JSON.stringify({ error: "unknown host" }));
  }

  const failures = [];
  for (const [name, provider] of PROVIDERS) {
    try {
      const image = await provider(host);
      res.statusCode = 200;
      res.setHeader("Content-Type", image.type);
      res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000");
      res.setHeader("X-Screenshot-Source", name);
      return res.end(image.buf);
    } catch (err) {
      failures.push(name + ": " + (err && err.message ? err.message : "failed"));
    }
  }

  // No provider could capture it. Cache briefly so a broken site doesn't hammer the providers.
  res.statusCode = 502;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=300");
  res.end(JSON.stringify({ error: "screenshot unavailable", host, failures }));
}

module.exports = handler;

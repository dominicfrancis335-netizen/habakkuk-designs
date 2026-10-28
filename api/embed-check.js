/*
  Habakkuk Designs — portfolio embed check (Vercel serverless function)

  Browsers cannot read another site's X-Frame-Options / Content-Security-Policy
  headers, so this function does it server-side. The portfolio page calls
  /api/embed-check once, then shows a live preview for sites that allow
  framing and a message + "Open in new tab" button for sites that don't.

  Only the hosts listed in api/_sites.js can be checked (no open proxy / SSRF).
*/

const { SITES } = require("./_sites");

// Hosts allowed to frame the previews (the portfolio's own domain).
const PARENT_HOSTS = ["habakkukdesigns.co.za", "www.habakkukdesigns.co.za"];

function sourceMatchesHost(source, host) {
  let s = source.trim().toLowerCase();
  if (!s) return false;
  if (s === "*") return true;
  if (s === "https:" || s === "http:") return true;
  if (s.startsWith("'")) return false; // 'self', 'none'
  s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//, "").replace(/[/?#].*$/, "").replace(/:(\d+|\*)$/, "");
  if (s === host) return true;
  if (s.startsWith("*.")) return host.endsWith(s.slice(1));
  return false;
}

// Returns { status: "ok" | "blocked", reason } from response headers.
function evaluateHeaders(headers, parentHosts) {
  const csp = headers.get("content-security-policy") || "";
  const xfo = (headers.get("x-frame-options") || "").toLowerCase();

  // CSP frame-ancestors (every policy must allow us) takes precedence over X-Frame-Options.
  let sawFrameAncestors = false;
  for (const policy of csp.split(",")) {
    for (const directive of policy.split(";")) {
      const parts = directive.trim().split(/\s+/);
      if (parts[0] && parts[0].toLowerCase() === "frame-ancestors") {
        sawFrameAncestors = true;
        const sources = parts.slice(1);
        const allowed = sources.some((src) => parentHosts.some((h) => sourceMatchesHost(src, h)));
        if (!allowed) {
          return { status: "blocked", reason: "Content-Security-Policy frame-ancestors: " + (sources.join(" ") || "'none'") };
        }
      }
    }
  }
  if (sawFrameAncestors) return { status: "ok", reason: "frame-ancestors allows this site" };

  if (xfo) {
    const values = xfo.split(",").map((v) => v.trim());
    if (values.includes("deny") || values.includes("sameorigin")) {
      return { status: "blocked", reason: "X-Frame-Options: " + xfo };
    }
  }
  return { status: "ok", reason: "no framing restrictions" };
}

async function checkSite(host, parentHosts) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch("https://" + host + "/", {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "HabakkukDesigns-EmbedCheck/1.0", accept: "text/html" }
    });
    try { if (res.body && res.body.cancel) await res.body.cancel(); } catch (e) { /* ignore */ }
    return evaluateHeaders(res.headers, parentHosts);
  } catch (err) {
    // Could not reach it from the server: let the browser try; the card still has its button.
    return { status: "unknown", reason: "could not be checked" };
  } finally {
    clearTimeout(timer);
  }
}

async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET, HEAD");
    return res.end();
  }
  const reqHost = String((req.headers && req.headers.host) || "").toLowerCase().replace(/:\d+$/, "");
  const parentHosts = Array.from(new Set(PARENT_HOSTS.concat(reqHost ? [reqHost] : [])));

  const results = await Promise.all(SITES.map((h) => checkSite(h, parentHosts)));
  const sites = {};
  SITES.forEach((h, i) => { sites[h] = results[i]; });

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.end(JSON.stringify({ checkedAt: new Date().toISOString(), sites }));
}

module.exports = handler;
module.exports.evaluateHeaders = evaluateHeaders;
module.exports.SITES = SITES;

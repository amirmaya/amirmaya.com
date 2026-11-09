// amirmaya.com visitor counter — anonymous, cookie-free, and frugal with Workers KV (free tier: 1,000 writes/day).
// One daily document holds everything, so a visit costs 1 write (view) + 1 write per 3-minute heartbeat + 1 write (end):
//   d:YYYY-MM-DD  { views, visitors, sessions, dur_sum, dur_n, vh: [visitor hashes], live: { sid: last_seen_ms }, sections: {}, countries: {} }
// Visitor id = sha256(ip + ua + daily salt) truncated; never stored raw. "online" = sessions seen in the last 4 minutes.
// Writes race on the single key (last writer wins); for a personal site that is an acceptable trade for staying inside the quota.
const EMPTY = () => ({ views: 0, visitors: 0, sessions: 0, dur_sum: 0, dur_n: 0, vh: [], live: {}, sections: {}, countries: {} });
const ONLINE_MS = 240000;
export default {
  async fetch(req, env) {
    const url = new URL(req.url); const cors = {
      "access-control-allow-origin": "https://amirmaya.com", "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type", "cache-control": "no-store", "content-type": "application/json" };
    const origin = req.headers.get("origin") || "";
    const okOrigin = /^https?:\/\/(www\.)?amirmaya\.com$|^http:\/\/127\.0\.0\.1:8765$/.test(origin);
    if (origin && !okOrigin) return new Response("{}", { status: 403, headers: cors });
    if (okOrigin) cors["access-control-allow-origin"] = origin;
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    const now = Date.now(), day = new Date(now).toISOString().slice(0, 10), month = day.slice(0, 7), year = day.slice(0, 4);
    try {
      if (url.pathname === "/hit" && req.method === "POST") {
        let body = {}; try { body = await req.json(); } catch {}
        const sid = String(body.sid || "").slice(0, 40), kind = body.kind || "view", section = String(body.section || "").slice(0, 32).replace(/[^a-z0-9_-]/gi, "");
        if (!sid) return new Response("{}", { status: 400, headers: cors });
        const d = await getJSON(env.KV, "d:" + day, EMPTY());
        for (const k in d.live) if (now - d.live[k] > 3600000) delete d.live[k];           // forget sessions silent for an hour
        if (kind === "view") {
          const hash = await sha((req.headers.get("cf-connecting-ip") || "0") + "|" + (req.headers.get("user-agent") || "") + "|" + day + "|" + env.SALT);
          d.views++;
          if (!d.vh.includes(hash)) { d.vh.push(hash); d.visitors++; }
          if (!(sid in d.live)) { d.sessions++; const cc = req.cf?.country || "XX"; d.countries[cc] = (d.countries[cc] || 0) + 1; d.starts = d.starts || {}; d.starts[sid] = now; }
          if (section) d.sections[section] = (d.sections[section] || 0) + 1;
          d.live[sid] = now;
        } else if (kind === "beat") {
          if (sid in d.live) d.live[sid] = now;
        } else if (kind === "end") {
          const start = (d.starts || {})[sid];
          if (start) { d.dur_sum += Math.min(3600, Math.max(0, (now - start) / 1000)); d.dur_n++; delete d.starts[sid]; }
          delete d.live[sid];
        }
        await env.KV.put("d:" + day, JSON.stringify(d), { expirationTtl: 400 * 86400 });
        return new Response("{}", { headers: cors });
      }
      if (url.pathname === "/stats") {
        const full = url.searchParams.get("key") && url.searchParams.get("key") === env.ADMIN_KEY;
        const today = await getJSON(env.KV, "d:" + day, EMPTY());
        const online = Object.values(today.live || {}).filter(t => now - t < ONLINE_MS).length;
        const out = { today: today.visitors, online, avg_visit: today.dur_n ? Math.round(today.dur_sum / today.dur_n) : null };
        if (full) {
          const days = (await env.KV.list({ prefix: "d:" })).keys.map(k => k.name.slice(2)).sort();
          const series = []; const mtd = { visitors: 0, views: 0, sessions: 0 }, ytd = { visitors: 0, views: 0, sessions: 0 }, all = { visitors: 0, views: 0, sessions: 0 };
          let dsum = 0, dn = 0; const countries = {}, sections = {};
          for (const dd of days) { const d = dd === day ? today : await getJSON(env.KV, "d:" + dd, {});
            series.push({ day: dd, views: d.views || 0, visitors: d.visitors || 0, sessions: d.sessions || 0, dur_sum: d.dur_sum || 0, dur_n: d.dur_n || 0 });
            for (const t of [all, ...(dd.startsWith(month) ? [mtd] : []), ...(dd.startsWith(year) ? [ytd] : [])]) { t.visitors += d.visitors || 0; t.views += d.views || 0; t.sessions += d.sessions || 0; }
            dsum += d.dur_sum || 0; dn += d.dur_n || 0;
            if (dd.startsWith(month)) { for (const c in d.countries || {}) countries[c] = (countries[c] || 0) + d.countries[c]; for (const s in d.sections || {}) sections[s] = (sections[s] || 0) + d.sections[s]; } }
          Object.assign(out, { mtd, ytd, all, avg_visit_all: dn ? Math.round(dsum / dn) : null, series: series.slice(-90), countries, sections });
        }
        return new Response(JSON.stringify(out), { headers: cors });
      }
    } catch (e) {
      // KV quota exhausted or a transient error: answer quietly; the page must never see a failed request
      return new Response(JSON.stringify({ today: 0, online: 1, avg_visit: null, degraded: true }), { headers: cors });
    }
    return new Response("amirmaya.com stats", { headers: { "content-type": "text/plain" } });
  }
};
async function getJSON(kv, k, dflt) { const v = await kv.get(k); if (!v) return dflt; try { return Object.assign(dflt && typeof dflt === "object" ? EMPTY() : {}, JSON.parse(v)); } catch { return dflt; } }
async function sha(s) { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return [...new Uint8Array(b)].slice(0, 12).map(x => x.toString(16).padStart(2, "0")).join(""); }

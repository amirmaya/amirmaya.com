// amirmaya.com door counter — anonymous, cookie-free.
// Visitor id = sha256(ip + ua + daily salt), never stored raw. KV keys:
//   d:YYYY-MM-DD        {views, visitors(set via v:), sessions, dur_sum}  (JSON)
//   v:YYYY-MM-DD:<hash> "1"  (ttl 2 days)   -> unique visitor marker
//   s:<sid>             {start, last, hash}  (ttl 2h)  -> live session for "online now" + duration
//   online:<sid>        "1" (ttl 120s)      -> heartbeat
//   cc:YYYY-MM:<CC>     count                -> country per month
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

    const now = new Date(); const day = now.toISOString().slice(0, 10); const month = day.slice(0, 7); const year = day.slice(0, 4);
    const ip = req.headers.get("cf-connecting-ip") || "0"; const ua = req.headers.get("user-agent") || "";
    const hash = await sha(ip + "|" + ua + "|" + day + "|" + env.SALT);
    const cc = req.cf?.country || "XX";

    if (url.pathname === "/hit" && req.method === "POST") {
      let body = {}; try { body = await req.json(); } catch {}
      const sid = String(body.sid || "").slice(0, 40); const kind = body.kind || "view"; const section = String(body.section || "").slice(0, 32);
      if (!sid) return new Response("{}", { status: 400, headers: cors });
      if (kind === "view") {
        const d = await getJSON(env.KV, "d:" + day, { views: 0, visitors: 0, sessions: 0, dur_sum: 0, dur_n: 0 });
        d.views++;
        if (!(await env.KV.get("v:" + day + ":" + hash))) { d.visitors++; await env.KV.put("v:" + day + ":" + hash, "1", { expirationTtl: 172800 }); }
        if (!(await env.KV.get("s:" + sid))) { d.sessions++; await env.KV.put("s:" + sid, JSON.stringify({ start: now.getTime(), last: now.getTime() }), { expirationTtl: 7200 }); await env.KV.put("cc:" + month + ":" + cc, String(1 + +(await env.KV.get("cc:" + month + ":" + cc) || 0)), { expirationTtl: 400 * 86400 }); }
        await env.KV.put("d:" + day, JSON.stringify(d));
        await env.KV.put("online:" + sid, "1", { expirationTtl: 120 });
        if (section) await env.KV.put("sec:" + month + ":" + section, String(1 + +(await env.KV.get("sec:" + month + ":" + section) || 0)), { expirationTtl: 400 * 86400 });
      } else if (kind === "beat" || kind === "end") {
        const s = await getJSON(env.KV, "s:" + sid, null);
        if (s) {
          s.last = now.getTime(); await env.KV.put("s:" + sid, JSON.stringify(s), { expirationTtl: 7200 });
          if (kind === "end" && !s.ended) {
            s.ended = true; await env.KV.put("s:" + sid, JSON.stringify(s), { expirationTtl: 7200 });
            const dday = new Date(s.start).toISOString().slice(0, 10); const d = await getJSON(env.KV, "d:" + dday, { views: 0, visitors: 0, sessions: 0, dur_sum: 0, dur_n: 0 });
            const dur = Math.min(3600, Math.max(0, (s.last - s.start) / 1000)); d.dur_sum = (d.dur_sum || 0) + dur; d.dur_n = (d.dur_n || 0) + 1; await env.KV.put("d:" + dday, JSON.stringify(d));
          }
        }
        if (kind === "beat") await env.KV.put("online:" + sid, "1", { expirationTtl: 120 });
        else await env.KV.delete("online:" + sid);
      }
      return new Response("{}", { headers: cors });
    }

    if (url.pathname === "/stats") {
      const full = url.searchParams.get("key") && url.searchParams.get("key") === env.ADMIN_KEY;
      const online = (await env.KV.list({ prefix: "online:" })).keys.length;
      const today = await getJSON(env.KV, "d:" + day, { views: 0, visitors: 0, sessions: 0, dur_sum: 0, dur_n: 0 });
      const out = { today: today.visitors, online, avg_visit: today.dur_n ? Math.round(today.dur_sum / today.dur_n) : null };
      if (full) {
        const days = (await env.KV.list({ prefix: "d:" })).keys.map(k => k.name.slice(2)).sort();
        const series = []; let mtd = { visitors: 0, views: 0, sessions: 0 }, ytd = { visitors: 0, views: 0, sessions: 0 }, all = { visitors: 0, views: 0, sessions: 0 }, dsum = 0, dn = 0;
        for (const dd of days) { const d = await getJSON(env.KV, "d:" + dd, {}); series.push({ day: dd, ...d });
          for (const t of [all, ...(dd.startsWith(month) ? [mtd] : []), ...(dd.startsWith(year) ? [ytd] : [])]) { t.visitors += d.visitors || 0; t.views += d.views || 0; t.sessions += d.sessions || 0; }
          dsum += d.dur_sum || 0; dn += d.dur_n || 0; }
        const countries = (await env.KV.list({ prefix: "cc:" + month + ":" })).keys.map(k => k.name.split(":")[2]);
        const ccs = {}; for (const c of countries) ccs[c] = +(await env.KV.get("cc:" + month + ":" + c) || 0);
        const secs = (await env.KV.list({ prefix: "sec:" + month + ":" })).keys.map(k => k.name.split(":")[2]);
        const sections = {}; for (const s of secs) sections[s] = +(await env.KV.get("sec:" + month + ":" + s) || 0);
        Object.assign(out, { mtd, ytd, all, avg_visit_all: dn ? Math.round(dsum / dn) : null, series: series.slice(-90), countries: ccs, sections });
      }
      return new Response(JSON.stringify(out), { headers: cors });
    }
    return new Response("amirmaya.com stats", { headers: { "content-type": "text/plain" } });
  }
};
async function getJSON(kv, k, dflt) { const v = await kv.get(k); if (!v) return dflt; try { return JSON.parse(v); } catch { return dflt; } }
async function sha(s) { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return [...new Uint8Array(b)].slice(0, 12).map(x => x.toString(16).padStart(2, "0")).join(""); }

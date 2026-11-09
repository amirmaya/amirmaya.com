// Door counter client. Anonymous: a random per-tab session id (sessionStorage, dies with the tab), no cookies, no fingerprinting here.
(() => {
  const API = "https://amirmaya-stats.mayaamir96.workers.dev";
  const $ = s => document.querySelector(s);
  let sid = sessionStorage.getItem("sid"); if (!sid) { sid = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem("sid", sid); }
  const post = (body, keepalive = false) => fetch(API + "/hit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sid, ...body }), keepalive }).catch(() => {});
  const section = () => { let cur = "hero"; document.querySelectorAll("section[id], article[id]").forEach(s => { if (s.getBoundingClientRect().top < innerHeight * .5) cur = s.id; }); return cur; };
  post({ kind: "view", section: "hero" });
  const beat = setInterval(() => document.visibilityState === "visible" && post({ kind: "beat" }), 45000);
  addEventListener("pagehide", () => post({ kind: "end" }, true));
  async function paint() {
    try {
      const r = await fetch(API + "/stats"); const d = await r.json();
      const f = n => Number(n || 0).toLocaleString("en-US");
      const el = $("#door"); if (!el) return;
      el.querySelector("[data-k=today]").textContent = f(d.today || 0);
      el.querySelector("[data-k=online]").textContent = d.online || 1;
      el.querySelector("[data-k=avg]").textContent = d.avg_visit ? `${Math.floor(d.avg_visit / 60)}:${String(d.avg_visit % 60).padStart(2, "0")}` : "—";
      el.classList.add("ready");
    } catch {}
  }
  paint(); setInterval(paint, 60000);
})();

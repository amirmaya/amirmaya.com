// Route + fan-out: five career stops on a curve. Click a stop → its children (tools, press, certificates, awards) fan out around it.
window.Graph = (() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let C, stops = [], kids = {}, open = null, sel = null, svg, W, H;
  const DESK = [[.09,.62],[.3,.3],[.5,.64],[.7,.3],[.91,.6]], MOB = [[.5,.08],[.5,.29],[.5,.5],[.5,.71],[.5,.92]];
  const short = (t, n = 26) => t.length > n ? t.slice(0, n - 1) + "…" : t;

  function build(content) {
    C = content; kids = {};
    stops = C.stops.map(s => ({ id: s.id, label: s.name, logo: s.logo, data: s, chapter: true }));
    const amz = C.stops.find(s => s.id === "amazon"), hm = C.stops.find(s => s.id === "hypemerch");
    kids.amazon = [
      ...(amz.tools || []).map((t, i) => ({ id: "tool" + i, label: t.name, logo: t.icon, data: { kicker: C.ui.tools, lead: t.d, img: t.img, blur: true } })),
      { id: "smalls", label: C.ui.g_desktop, logo: "tiles/sweep.png", data: { kicker: amz.small_title, lead: amz.small_sub, list: (amz.small || []).map(t => [t.n, t.d]) } },
      ...(amz.awards || []).map((a, i) => ({ id: "award" + i, label: a.note, img: a.img, data: { kicker: C.ui.awards, lead: a.note, img: a.img } }))
    ];
    kids.hypemerch = [
      ...(hm.press || []).map((p, i) => ({ id: "press" + i, label: p.outlet, img: p.img, data: { kicker: C.ui.press, lead: p.note, img: p.img } })),
      { id: "hm-app", label: "App Store", img: (hm.apps || [{}])[0].img, data: { kicker: "App Store · 10 Sep 2023", lead: hm.body[1], imgs: (hm.apps || []).map(a => a.img) } }
    ];
    const certIcon = o => /Michigan/.test(o) ? "tiles/umich.png" : /Google/.test(o) ? "tiles/google.png" : /MongoDB/.test(o) ? "tiles/mongodb.png" : "tiles/coursera.png";
    kids.coursera = C.me.certs.map((c, i) => ({ id: "cert" + i, label: c.t, logo: certIcon(c.o), data: { kicker: c.o + " · " + c.d, lead: c.t, link: c.u } }));
    kids.trnotify = [{ id: "trn-bots", label: C.ui.g_bots, logo: "tiles/bots.png", data: { kicker: "Discord · 2020", lead: C.stops.find(s => s.id === "trnotify").lead } }];
    kids.deloitte = [];
  }

  function layout() {
    const el = $("#graph"); W = el.clientWidth; H = el.clientHeight; const mob = W < 760, P = mob ? MOB : DESK;
    stops.forEach((s, i) => { s.x = P[i][0] * W; s.y = P[i][1] * H; });
    if (open) {
      const p = stops.find(s => s.id === open), ks = kids[open] || [], n = ks.length;
      const up = p.y > H / 2, R = Math.min(mob ? 120 : 190, H * .36);
      const a0 = up ? -165 : 15, a1 = up ? -15 : 165;           // arc above or below the stop
      ks.forEach((k, i) => { const a = (a0 + (a1 - a0) * (n === 1 ? .5 : i / (n - 1))) * Math.PI / 180; k.x = Math.min(W - 70, Math.max(70, p.x + Math.cos(a) * R)); k.y = p.y + Math.sin(a) * R; });
    }
    draw();
  }

  function draw() {
    const chain = stops.map((s, i) => i ? `<path class="ge" d="${curve(stops[i - 1], s)}"/>` : "").join("");
    let fan = "", kidNodes = "";
    if (open) { const p = stops.find(s => s.id === open); (kids[open] || []).forEach((k, i) => {
      fan += `<path class="ge on" d="${curve(p, k)}"/>${reduced ? "" : `<circle r="2.5" class="sig"><animateMotion dur="${1.8 + (i % 3) * .4}s" repeatCount="indefinite" path="${curve(p, k)}"/></circle>`}`;
      const r = 24, img = k.img ? `assets/img/${k.img}` : `assets/logos/${k.logo}`;
      kidNodes += `<g class="gn kid ${sel === k.id ? "sel" : ""}" data-id="${k.id}" transform="translate(${k.x},${k.y})" style="--d:${i * 45}ms" tabindex="0" role="button" aria-label="${esc(k.label)}">
        <circle r="${r + 5}" class="halo"/><clipPath id="c-${k.id}"><circle r="${r}"/></clipPath><circle r="${r}" class="ring"/>
        <image href="${img}" x="${-r}" y="${-r}" width="${2 * r}" height="${2 * r}" clip-path="url(#c-${k.id})" preserveAspectRatio="xMidYMid slice"/>
        <text class="gl" y="${r + 14}" text-anchor="middle">${esc(short(k.label))}</text></g>`; }); }
    const stopNodes = stops.map(s => { const r = s.id === "amazon" ? 46 : 40, dim = open && open !== s.id; return `
      <g class="gn hub ${open === s.id ? "open" : ""} ${dim ? "dim" : ""} ${sel === s.id ? "sel" : ""}" data-id="${s.id}" transform="translate(${s.x},${s.y})" tabindex="0" role="button" aria-label="${esc(s.label)}">
        <circle r="${r + 7}" class="halo"/><clipPath id="c-${s.id}"><circle r="${r}"/></clipPath><circle r="${r}" class="ring"/>
        <image href="assets/logos/${s.logo}" x="${-r}" y="${-r}" width="${2 * r}" height="${2 * r}" clip-path="url(#c-${s.id})"/>
        <text class="gl big" y="${r + 18}" text-anchor="middle">${esc(s.label)}</text><text class="gy" y="${r + 32}" text-anchor="middle">${esc(s.data.years)}${(kids[s.id] || []).length ? ` · ${(kids[s.id] || []).length}` : ""}</text></g>`; }).join("");
    svg.innerHTML = chain + fan + stopNodes + kidNodes;
    $$(".gn", svg).forEach(g => { const act = () => g.classList.contains("hub") ? toggle(g.dataset.id) : select(g.dataset.id);
      g.addEventListener("click", act); g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); } }); });
  }
  const curve = (p, q) => { const cx = (p.x + q.x) / 2; return `M${p.x},${p.y} C${cx},${p.y} ${cx},${q.y} ${q.x},${q.y}`; };

  function toggle(id) { if (open === id) { open = null; sel = null; closePanel(); } else { open = id; sel = id; } layout(); if (sel) showPanel(stops.find(s => s.id === id)); }
  function select(id) { const k = (kids[open] || []).find(x => x.id === id); if (!k) return; sel = id; draw(); showPanel(k); }
  function closePanel() { $("#gpanel").classList.remove("open"); setTimeout(layout, 380); }
  function showPanel(n) {
    const p = $("#gpanel"), d = n.data, imgs = d.imgs || (d.img ? [d.img] : []);
    p.innerHTML = `<button class="gclose" aria-label="Close">×</button><p class="eyebrow">${esc(d.kicker || "")}</p><h3>${esc(n.label)}</h3>
      ${d.lead ? `<p class="glead">${esc(d.lead)}</p>` : ""}${(d.body || []).map(x => `<p class="gbody">${esc(x)}</p>`).join("")}
      ${d.list ? `<ul class="glist">${d.list.map(([a, b]) => `<li><b>${esc(a)}</b><span>${esc(b)}</span></li>`).join("")}</ul>` : ""}
      ${imgs.length ? `<div class="gimgs">${imgs.map(i => `<img src="assets/img/${i}" alt="" loading="lazy">`).join("")}</div>` : ""}
      ${d.blur ? `<p class="eyebrow">${esc(C.ui.blur_note)}</p>` : ""}
      <div class="gacts">${d.link ? `<a class="btn" target="_blank" rel="noopener" href="${esc(d.link)}">${esc(C.ui.g_verify)} ↗</a>` : ""}${n.chapter ? `<a class="btn btn-ink" href="#${n.id}" data-scroll>${esc(C.ui.g_read)} ↓</a>` : ""}</div>`;
    const was = p.classList.contains("open"); p.classList.add("open"); if (!was) setTimeout(layout, 380);
    $(".gclose", p).onclick = () => { open = null; sel = null; closePanel(); layout(); };
    $("[data-scroll]", p)?.addEventListener("click", e => { e.preventDefault(); $(e.currentTarget.getAttribute("href")).scrollIntoView({ behavior: reduced ? "auto" : "smooth" }); });
  }
  function mount(content) { svg = $("#gsvg"); build(content); open = null; sel = null; $("#gpanel").classList.remove("open"); layout(); addEventListener("resize", layout); }
  return { mount };
})();

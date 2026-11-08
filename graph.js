// Knowledge graph: career, tools, certificates and proof as a layered network. Click a node → detail panel.
window.Graph = (() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let C, lang, nodes = [], edges = [], sel = null, filter = "all", svg, W, H;

  function build(content, l) {
    C = content; lang = l; nodes = []; edges = [];
    const add = (n) => (nodes.push(n), n.id);
    // L0 education
    C.education.forEach(e => { add({ id: e.id, layer: 0, type: "edu", label: e.name, logo: e.logo, data: e, size: 26 });
      (e.internships || []).forEach((x, i) => { const id = e.id + "-i" + i; add({ id, layer: 0, type: "edu", label: x.name, logo: x.logo, data: { ...x, kicker: x.role + " · " + x.when, lead: x.d }, size: 16 }); edges.push([id, e.id]); }); });
    edges.push(["hisar", "bilgi"]);
    // L1 career
    C.stops.forEach((s, i) => { add({ id: s.id, layer: 1, type: "career", label: s.name, logo: s.logo, data: s, size: 30, chapter: true }); if (i) edges.push([C.stops[i - 1].id, s.id]); });
    edges.push(["bilgi", "deloitte"]);
    // L2 tools & products
    const amz = C.stops.find(s => s.id === "amazon"), hm = C.stops.find(s => s.id === "hypemerch");
    (amz.tools || []).forEach((t, i) => { const id = "tool" + i; add({ id, layer: 2, type: "tool", label: t.name, logo: t.icon, data: { kicker: C.ui.tools, lead: t.d, img: t.img, blur: true }, size: 24 }); edges.push(["amazon", id]); });
    const smallIcons = ["tiles/sweep.png","tiles/scraper.png","tiles/deleter.png","tiles/extractor.png","tiles/downloader.png"];
    (amz.small || []).forEach((t, i) => { const id = "small" + i; add({ id, layer: 2, type: "tool", label: t.n, logo: smallIcons[i], data: { kicker: t.t, lead: t.d }, size: 17 }); edges.push(["amazon", id]); });
    add({ id: "hm-app", layer: 2, type: "tool", label: "Hype-Merch app", logo: "tiles/app.png", data: { kicker: "App Store · 10 Sep 2023", lead: hm.body[1], imgs: (hm.apps || []).map(a => a.img) }, size: 18 }); edges.push(["hypemerch", "hm-app"]);
    add({ id: "trn-bots", layer: 2, type: "tool", label: "TRNotify bots", logo: "tiles/bots.png", data: { kicker: "Discord · 2020", lead: C.stops.find(s => s.id === "trnotify").lead }, size: 14 }); edges.push(["trnotify", "trn-bots"]);
    // L3 proof
    const certIcon = o => /Michigan/.test(o) ? "tiles/umich.png" : /Google/.test(o) ? "tiles/google.png" : /MongoDB/.test(o) ? "tiles/mongodb.png" : "tiles/coursera.png";
    C.me.certs.forEach((c, i) => { const id = "cert" + i; add({ id, layer: 3, type: "cert", label: c.t, logo: certIcon(c.o), data: { kicker: c.o + " · " + c.d, lead: c.t, link: c.u }, size: 12 }); edges.push(["coursera", id]); });
    (hm.press || []).forEach((p, i) => { const id = "press" + i; add({ id, layer: 3, type: "press", label: p.outlet, logo: /Vogue/.test(p.outlet) ? "tiles/vogue.png" : /H\u00fcrriyet/.test(p.outlet) ? "tiles/hurriyet.png" : "tiles/press.png", data: { kicker: C.ui.press, lead: p.note, img: p.img }, size: 14 }); edges.push(["hypemerch", id]); });
    (amz.awards || []).forEach((a, i) => { const id = "award" + i; add({ id, layer: 3, type: "award", label: a.note, logo: "tiles/award.png", data: { kicker: C.ui.awards, lead: a.note, img: a.img }, size: 14 }); edges.push(["amazon", id]); });
  }

  function layout() {
    const el = $("#graph"); W = el.clientWidth; H = el.clientHeight; const mobile = W < 760;
    const cols = [0, 1, 2, 3]; const pad = mobile ? 24 : 70; const colX = i => pad + (W - 2 * pad) * (mobile ? [0.02, 0.3, 0.6, 0.78][i] : [0.03, 0.29, 0.56, 0.78][i]);
    cols.forEach(L => { const ns = nodes.filter(n => n.layer === L); const top = 60, bot = H - 30, step = (bot - top) / Math.max(1, ns.length - 1 || 1);
      ns.forEach((n, i) => { n.x = colX(L); n.y = ns.length === 1 ? (top + bot) / 2 : top + i * step; }); });
    // career layer: spread with more room
    draw();
  }

  function visible(n) { return filter === "all" || n.type === filter || (filter === "proof" && (n.type === "cert" || n.type === "press" || n.type === "award")); }
  function neighbors(id) { const s = new Set([id]); edges.forEach(([a, b]) => { if (a === id) s.add(b); if (b === id) s.add(a); }); return s; }

  function draw() {
    const byId = Object.fromEntries(nodes.map(n => [n.id, n])); const hi = sel ? neighbors(sel) : null;
    const path = ([a, b]) => { const p = byId[a], q = byId[b]; const cx = (p.x + q.x) / 2; return `M${p.x},${p.y} C${cx},${p.y} ${cx},${q.y} ${q.x},${q.y}`; };
    const edgesHtml = edges.map(e => { const on = hi && hi.has(e[0]) && hi.has(e[1]); const dim = (hi && !on) || !(visible(byId[e[0]]) || visible(byId[e[1]])); return `<path class="ge ${on ? "on" : ""} ${dim ? "dim" : ""}" d="${path(e)}"/>${on && !reduced ? `<circle r="3" class="sig"><animateMotion dur="${2 + Math.random()}s" repeatCount="indefinite" path="${path(e)}"/></circle>` : ""}`; }).join("");
    const nodesHtml = nodes.map(n => { const dim = (hi && !hi.has(n.id)) || !visible(n); const r = n.size; return `
      <g class="gn ${n.type} ${sel === n.id ? "sel" : ""} ${dim ? "dim" : ""}" data-id="${n.id}" transform="translate(${n.x},${n.y})" tabindex="0" role="button" aria-label="${esc(n.label)}">
        <circle r="${r + 6}" class="halo"/>
        ${n.logo ? `<clipPath id="c-${n.id}"><circle r="${r}"/></clipPath><circle r="${r}" class="ring"/><image href="assets/logos/${n.logo}" x="${-r}" y="${-r}" width="${2 * r}" height="${2 * r}" clip-path="url(#c-${n.id})"/>` : `<circle r="${r}" class="dot"/>`}
        <text class="gl" x="${n.layer === 3 ? r + 8 : 0}" y="${n.layer === 3 ? 4 : r + 16}" text-anchor="${n.layer === 3 ? "start" : "middle"}">${esc(n.label.length > 34 ? n.label.slice(0, 32) + "…" : n.label)}</text></g>`; }).join("");
    const heads = [C.ui.g_l0, C.ui.g_l1, C.ui.g_l2, C.ui.g_l3].map((t, i) => { const n = nodes.find(x => x.layer === i); return n ? `<text class="gh" x="${n.x}" y="22" text-anchor="${i === 3 ? "start" : "middle"}">${esc(t)}</text>` : ""; }).join("");
    svg.innerHTML = heads + edgesHtml + nodesHtml;
    $$(".gn", svg).forEach(g => { g.addEventListener("click", () => select(g.dataset.id)); g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(g.dataset.id); } });
      g.addEventListener("pointerenter", () => { if (!sel) { const nb = neighbors(g.dataset.id); $$(".gn", svg).forEach(x => x.classList.toggle("dim", !nb.has(x.dataset.id))); $$(".ge", svg).forEach((e, i) => e.classList.toggle("dim", !(nb.has(edges[i][0]) && nb.has(edges[i][1])))); } });
      g.addEventListener("pointerleave", () => { if (!sel) draw(); }); });
  }

  function select(id) {
    sel = sel === id ? null : id; draw(); const p = $("#gpanel"); const n = nodes.find(x => x.id === id);
    if (!sel || !n) { p.classList.remove("open"); setTimeout(layout, 380); return; }
    const d = n.data; const imgs = d.imgs || (d.img ? [d.img] : []);
    p.innerHTML = `<button class="gclose" aria-label="Close">×</button>
      <p class="eyebrow">${esc(d.kicker || n.type)}</p><h3>${esc(n.label)}</h3>
      ${d.lead ? `<p class="glead">${esc(d.lead)}</p>` : ""}
      ${(d.body || []).map(x => `<p class="gbody">${esc(x)}</p>`).join("")}
      ${imgs.length ? `<div class="gimgs">${imgs.map(i => `<img src="assets/img/${i}" alt="" loading="lazy" class="${d.blur ? "blur" : ""}">`).join("")}</div>` : ""}
      ${d.blur ? `<p class="eyebrow">${esc(C.ui.blur_note)}</p>` : ""}
      <div class="gacts">${d.link ? `<a class="btn" target="_blank" rel="noopener" href="${esc(d.link)}">${esc(C.ui.g_verify)} ↗</a>` : ""}${n.chapter ? `<a class="btn btn-ink" href="#${n.id}" data-scroll>${esc(C.ui.g_read)} ↓</a>` : ""}</div>`;
    const wasOpen = p.classList.contains("open"); p.classList.add("open"); if (!wasOpen) setTimeout(layout, 380);
    $(".gclose", p).onclick = () => select(sel);
    $("[data-scroll]", p)?.addEventListener("click", e => { e.preventDefault(); $(e.currentTarget.getAttribute("href")).scrollIntoView({ behavior: reduced ? "auto" : "smooth" }); });
  }

  function mount(content, l) {
    svg = $("#gsvg"); build(content, l); sel = null; filter = "all";
    $("#gfilters").innerHTML = [["all", C.ui.g_all], ["career", C.ui.g_l1], ["tool", C.ui.g_l2], ["proof", C.ui.g_l3]].map(([k, t]) => `<button data-f="${k}" class="${k === "all" ? "on" : ""}">${esc(t)}</button>`).join("");
    $$("#gfilters button").forEach(b => b.onclick = () => { filter = b.dataset.f; $$("#gfilters button").forEach(x => x.classList.toggle("on", x === b)); sel = null; $("#gpanel").classList.remove("open"); draw(); });
    layout(); addEventListener("resize", layout);
  }
  return { mount, select };
})();

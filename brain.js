// Brain: 3D point cloud with five career neurons. Click a neuron → camera turns & zooms to it, its children appear as hologram cards.
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const C = () => CONTENT[document.documentElement.lang || "en"];
  const UI_EXTRA = { en: { v3_signal: "Signal", v3_hint: "Click a neuron to zoom in. Esc to zoom out.", v3_back: "Zoom out", v3_none: "Nothing attached here yet." }, tr: { v3_signal: "Sinyal", v3_hint: "Yaklaşmak için bir nörona tıkla. Esc ile geri çık.", v3_back: "Uzaklaş", v3_none: "Buraya bağlı bir şey yok." } };
  const ui = () => ({ ...C().ui, ...UI_EXTRA[document.documentElement.lang || "en"] });

  /* ---- headline typing ---- */
  let hlIdx = 0, hlTimer, tw;
  function typeLine() { const lines = C().headlines, h = $("#hl"); if (!h) return; const txt = lines[hlIdx % lines.length]; let i = 0; clearInterval(tw); h.textContent = "";
    tw = setInterval(() => { h.textContent = txt.slice(0, ++i); if (i >= txt.length) clearInterval(tw); }, reduced ? 0 : 24); }

  /* ---- children per stop ---- */
  function childrenOf(id) {
    const c = C(), s = c.stops.find(x => x.id === id); if (!s) return [];
    const certIcon = o => /Michigan/.test(o) ? "tiles/umich.png" : /Google/.test(o) ? "tiles/google.png" : /MongoDB/.test(o) ? "tiles/mongodb.png" : "tiles/coursera.png";
    if (id === "amazon") return [
      ...(s.tools || []).map(t => ({ k: c.ui.tools, t: t.name, logo: t.icon, d: t.d, img: t.img, blur: true })),
      { k: s.small_title, t: ui().g_desktop || "Desktop tools", logo: "tiles/sweep.png", d: s.small_sub, list: (s.small || []).map(x => [x.n, x.d]) },
      ...(s.awards || []).map(a => ({ k: c.ui.awards, t: a.note, img: a.img, d: a.note })) ];
    if (id === "hypemerch") return [
      ...(s.press || []).map(p => ({ k: c.ui.press, t: p.outlet, img: p.img, d: p.note })),
      { k: "App Store", t: "Hype-Merch app", img: (s.apps || [{}])[0].img, d: s.body[1], imgs: (s.apps || []).map(a => a.img) } ];
    if (id === "coursera") return c.me.certs.map(x => ({ k: x.o, t: x.t, logo: certIcon(x.o), d: x.d, link: x.u }));
    if (id === "trnotify") return [{ k: "Discord · 2020", t: ui().g_bots || "Discord bots", logo: "tiles/bots.png", d: s.lead }];
    return [];
  }

  /* ---- point cloud ---- */
  const cv = $("#cv"), ctx = cv.getContext("2d"), wrap = $("#brain"); let W, H, dpr = Math.min(2, devicePixelRatio || 1);
  const pts = [], edges = [];
  function rnd(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  const R = rnd(42);
  // Anatomy: two hemispheres (long front→back, z axis), a fissure between them, cerebellum at the back-bottom, brainstem below.
  const hemi = (side, n) => { for (let i = 0; i < n; i++) { const u = R() * 6.2832, v = Math.acos(2 * R() - 1);
      let x = Math.sin(v) * Math.cos(u), y = Math.cos(v), z = Math.sin(v) * Math.sin(u);
      // squash into hemisphere: flat inner face at the fissure, flatter base
      x = Math.abs(x) * .50 + .04; y = y * .64; z = z * .98; if (y < -.25) y = -.25 - (y + .25) * .45; if (z > .6) y -= (z - .6) * .35;   // frontal lobe slopes down
      const g = .035 * Math.sin(z * 9 + y * 7) * Math.cos(x * 11 + z * 5);                                             // gyri texture
      pts.push({ x: side * (x + g), y: y + .1 + g, z: z - .05 + g, s: .55 + R() * 1.0 }); } };
  hemi(-1, 900); hemi(1, 900);
  const N = pts.length;
  for (let i = 0; i < N; i++) { const d = []; const p = pts[i]; for (let j = 0; j < N; j++) if (j !== i) { const q = pts[j]; d.push([(p.x - q.x) ** 2 + (p.y - q.y) ** 2 + (p.z - q.z) ** 2, j]); } d.sort((a, b2) => a[0] - b2[0]); for (let k = 0; k < 3; k++) if (d[k][1] > i) edges.push([i, d[k][1]]); }
  const anchors = [[-.62, .12, .55], [-.36, .66, .25], [.05, .5, .82], [.40, .68, .1], [.64, .22, .5]];

  /* ---- camera ---- */
  let rotY = -.35, rotX = .12, tRotY = rotY, tRotX = rotX, zoom = 1, tZoom = 1, offX = 0, offY = 0, tOffX = 0, tOffY = 0, drag = null, auto = true, focus = null;
  function size() { W = wrap.clientWidth; H = wrap.clientHeight; cv.width = W * dpr; cv.height = H * dpr; }
  size(); addEventListener("resize", () => size());
  wrap.addEventListener("pointermove", e => { if (focus !== null) return; if (drag) { tRotY = drag.ry + (e.clientX - drag.x) * .006; tRotX = Math.max(-.6, Math.min(.6, drag.rx + (e.clientY - drag.y) * .004)); } else if (!reduced) { const r = wrap.getBoundingClientRect(); tRotY = -.35 + ((e.clientX - r.left) / r.width - .5) * .5; tRotX = .12 + ((e.clientY - r.top) / r.height - .5) * .3; } });
  wrap.addEventListener("pointerdown", e => { if (focus === null && e.target === cv) { drag = { x: e.clientX, y: e.clientY, ry: tRotY, rx: tRotX }; auto = false; } });
  addEventListener("pointerup", () => drag = null);
  cv.addEventListener("click", () => { if (focus !== null) unfocus(); });
  addEventListener("keydown", e => { if (e.key === "Escape" && focus !== null) unfocus(); });
  function project(p, raw) {
    const cy = Math.cos(rotY), sy = Math.sin(rotY), cx = Math.cos(rotX), sx = Math.sin(rotX);
    let x = p.x * cy + p.z * sy, z = -p.x * sy + p.z * cy, y = p.y * cx - z * sx; z = p.y * sx + z * cx;
    const f = 2.6 / (2.6 + z), S = Math.min(W, H) * .44 * zoom;
    return { X: W / 2 + x * f * S + (raw ? 0 : offX), Y: H / 2 - 10 - y * f * S + (raw ? 0 : offY), z, f };
  }

  /* ---- neurons ---- */
  function buildNeurons() {
    $("#neurons").innerHTML = C().stops.map((s, i) => `<a class="neuron" data-i="${i}" href="#${s.id}"><span class="disc"><img src="assets/logos/${s.logo}" alt="${esc(s.name)}"></span><span class="lbl"><b>${esc(s.name)}</b><span>${esc(s.years)}</span></span></a>`).join("");
    const tip = $("#tip");
    $$(".neuron").forEach(el => {
      el.addEventListener("click", e => { e.preventDefault(); const i = +el.dataset.i; focus === i ? unfocus() : focusOn(i); });
      el.addEventListener("pointerenter", () => { if (focus !== null) return; const s = C().stops[+el.dataset.i]; $("#tipK").textContent = s.kicker; $("#tipT").textContent = s.lead; tip.style.left = el.style.left; tip.style.top = `calc(${el.style.top} - 44px)`; tip.classList.add("show"); });
      el.addEventListener("pointerleave", () => tip.classList.remove("show"));
    });
  }

  /* ---- focus: full-screen takeover + ordered hologram panel ---- */
  let placeholder = null;
  function expand() {
    const r = wrap.getBoundingClientRect(); placeholder = document.createElement("div"); placeholder.style.height = r.height + "px"; wrap.parentNode.insertBefore(placeholder, wrap);
    wrap.classList.add("focused"); document.body.classList.add("brain-open");
    const vw = innerWidth, vh = innerHeight, sx = r.width / vw, sy = r.height / vh;
    wrap.style.transition = "none"; wrap.style.transform = `translate(${r.left}px,${r.top}px) scale(${sx},${sy})`; wrap.style.transformOrigin = "0 0";
    requestAnimationFrame(() => { wrap.style.transition = "transform .7s cubic-bezier(.2,.7,.2,1)"; wrap.style.transform = "translate(0,0) scale(1,1)"; });
    setTimeout(() => { size(); }, 50); setTimeout(() => { size(); placePanel(); }, 720);
  }
  function collapse() {
    if (!placeholder) return; const r = placeholder.getBoundingClientRect(); const sx = r.width / innerWidth, sy = r.height / innerHeight;
    wrap.style.transition = "transform .6s cubic-bezier(.2,.7,.2,1)"; wrap.style.transform = `translate(${r.left}px,${r.top}px) scale(${sx},${sy})`;
    setTimeout(() => { wrap.classList.remove("focused"); document.body.classList.remove("brain-open"); wrap.style.transform = ""; wrap.style.transition = ""; placeholder.remove(); placeholder = null; size(); }, 600);
  }
  function focusOn(i) {
    if (focus === null) expand();
    focus = i; auto = false; $("#tip").classList.remove("show");
    const a = anchors[i]; tRotY = Math.atan2(a[0], a[2]); tRotX = Math.max(-.5, Math.min(.5, -a[1] * .6)); tZoom = 2.6;
    const s = C().stops[i], kids = childrenOf(s.id), u = ui(), holo = $("#holo");
    holo.innerHTML = `<button class="holo-close btn" data-back>✕ ${esc(u.v3_back)}</button>
      <div class="holo-panel">
        <div class="holo-head"><span class="eyebrow">${esc(s.kicker)}</span><h3>${esc(s.name)} <span class="mono">${esc(s.years)}</span></h3><p>${esc(s.lead)}</p>
          <div class="holo-acts"><a class="btn btn-ink" href="#${s.id}" data-read>${esc(u.g_read)} ↓</a></div></div>
        <div class="holo-grid">${kids.length ? kids.map((k, j) => `<button class="holo-card" style="--d:${260 + j * 60}ms" data-j="${j}">${k.img ? `<img class="hc-img" src="assets/img/${k.img}" alt="">` : `<img class="hc-ico" src="assets/logos/${k.logo}" alt="">`}<span><span class="hc-k">${esc(k.k)}</span><b class="hc-t">${esc(k.t)}</b></span></button>`).join("") : `<p class="eyebrow">${esc(u.v3_none)}</p>`}</div>
        <div class="holo-detail" id="holoDetail"></div>
        <nav class="holo-nav">${C().stops.map((x, j) => `<button class="hn ${j === i ? "on" : ""}" data-n="${j}" title="${esc(x.name)}"><img src="assets/logos/${x.logo}" alt=""></button>`).join("")}</nav>
      </div>`;
    holo.classList.add("on");
    $("[data-back]", holo).onclick = unfocus;
    $("[data-read]", holo).onclick = ev => { ev.preventDefault(); unfocus(); setTimeout(() => $("#" + s.id).scrollIntoView({ behavior: reduced ? "auto" : "smooth" }), 650); };
    $$(".holo-card", holo).forEach(btn => btn.onclick = () => showDetail(kids[+btn.dataset.j], btn));
    $$(".hn", holo).forEach(btn => btn.onclick = () => focusOn(+btn.dataset.n));
    placePanel();
  }
  function unfocus() { if (focus === null) return; focus = null; tZoom = 1; tOffX = tOffY = 0; tRotY = -.35; tRotX = .12; $("#holo").classList.remove("on"); $("#holo").innerHTML = ""; collapse(); }
  function placePanel() { /* panel is CSS-positioned; nothing dynamic */ }
  const placeHolo = placePanel;
  function showDetail(k, btn) {
    const d = $("#holoDetail"), u = ui(); $$(".holo-card").forEach(x => x.classList.toggle("sel", x === btn));
    const imgs = k.imgs || (k.img ? [k.img] : []);
    d.innerHTML = `<button class="hd-close" aria-label="Close">×</button><span class="eyebrow">${esc(k.k)}</span><b>${esc(k.t)}</b><p>${esc(k.d || "")}</p>
      ${k.list ? `<ul>${k.list.map(([a, b2]) => `<li><b>${esc(a)}</b> ${esc(b2)}</li>`).join("")}</ul>` : ""}
      ${imgs.length ? `<div class="hd-imgs">${imgs.map(i => `<img src="assets/img/${i}" alt="" data-full="assets/img/${i}">`).join("")}</div>` : ""}
      ${k.blur ? `<span class="eyebrow">${esc(u.blur_note)}</span>` : ""}${k.link ? `<a class="btn" target="_blank" rel="noopener" href="${esc(k.link)}">${esc(u.g_verify)} ↗</a>` : ""}`;
    d.classList.add("on"); $(".hd-close", d).onclick = () => { d.classList.remove("on"); $$(".holo-card").forEach(x => x.classList.remove("sel")); };
    $$(".hd-imgs img", d).forEach(im => im.onclick = () => { const lb = $("#lightbox"); if (lb) { $("img", lb).src = im.dataset.full; lb.classList.add("open"); lb.onclick = () => lb.classList.remove("open"); } });
  }

  /* ---- render loop ---- */
  let t0 = null;
  function frame(now) {
    if (t0 === null) t0 = now; const t = Math.max(0, (now - t0) / 1000);
    if (auto && !drag && !reduced && focus === null) tRotY += .0008;
    rotY += (tRotY - rotY) * .06; rotX += (tRotX - rotX) * .06; zoom += (tZoom - zoom) * .07;
    if (focus !== null) { const c0 = project({ x: 0, y: .1, z: 0 }, true); tOffX = W * .5 - c0.X; tOffY = H * .5 - c0.Y; }
    offX += (tOffX - offX) * .07; offY += (tOffY - offY) * .07;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const dim = focus !== null ? .95 : 1, P = pts.map(p => project(p));
    for (const [a, b] of edges) { const p = P[a], q = P[b], d = (p.z + q.z) / 2, al = (.07 + (1 - (d + 1) / 2) * .34) * dim; ctx.strokeStyle = `rgba(124,156,255,${al.toFixed(3)})`; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(p.X, p.Y); ctx.lineTo(q.X, q.Y); ctx.stroke(); }
    for (let i = 0; i < N; i++) { const p = P[i], depth = 1 - (p.z + 1) / 2, al = (.3 + depth * .65) * dim, r = pts[i].s * p.f * Math.sqrt(zoom);
      ctx.fillStyle = `rgba(124,156,255,${(al * .18).toFixed(3)})`; ctx.beginPath(); ctx.arc(p.X, p.Y, r * 3.2, 0, 6.283); ctx.fill();
      ctx.fillStyle = `rgba(214,226,255,${al.toFixed(3)})`; ctx.beginPath(); ctx.arc(p.X, p.Y, r, 0, 6.283); ctx.fill(); }
    const A = anchors.map(a => project({ x: a[0], y: a[1], z: a[2] }));
    ctx.lineWidth = 1.6; ctx.strokeStyle = `rgba(46,230,197,${focus === null ? .55 : .25})`; ctx.shadowColor = "rgba(46,230,197,.8)"; ctx.shadowBlur = 10; ctx.beginPath(); ctx.moveTo(A[0].X, A[0].Y);
    for (let i = 1; i < A.length; i++) { const p = A[i - 1], q = A[i], cx = (p.X + q.X) / 2; ctx.bezierCurveTo(cx, p.Y, cx, q.Y, q.X, q.Y); } ctx.stroke(); ctx.shadowBlur = 0;
    if (!reduced && focus === null) { const k = (((t * .18) % 1) + 1) % 1, total = A.length - 1, seg = Math.max(0, Math.min(total - 1, Math.floor(k * total))), u = Math.min(1, k * total - seg), p = A[seg], q = A[seg + 1], cx = (p.X + q.X) / 2;
      const bx = (1 - u) ** 3 * p.X + 3 * (1 - u) ** 2 * u * cx + 3 * (1 - u) * u * u * cx + u ** 3 * q.X, by = (1 - u) ** 3 * p.Y + 3 * (1 - u) ** 2 * u * p.Y + 3 * (1 - u) * u * u * q.Y + u ** 3 * q.Y;
      ctx.fillStyle = "#2ee6c5"; ctx.shadowColor = "#2ee6c5"; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(bx, by, 4, 0, 6.283); ctx.fill(); ctx.shadowBlur = 0; }
    // hologram links
    if (focus !== null) { const a = A[focus]; const panel = $(".holo-panel"); if (panel) { const pr = panel.getBoundingClientRect(), wr = wrap.getBoundingClientRect(); ctx.strokeStyle = "rgba(46,230,197,.5)"; ctx.lineWidth = 1.2; ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.moveTo(a.X, a.Y); ctx.lineTo(pr.left - wr.left, pr.top - wr.top + pr.height * .5); ctx.stroke(); ctx.setLineDash([]); }
      for (let k = 0; k < 2; k++) { const rr = (48 + k * 22) * Math.sqrt(zoom) + 6 * Math.sin(t * 2.4 + k); ctx.beginPath(); ctx.arc(a.X, a.Y, rr, 0, 6.283); ctx.strokeStyle = `rgba(46,230,197,${(.35 - k * .15) + .15 * Math.sin(t * 3 + k)})`; ctx.lineWidth = 1.2; ctx.stroke(); } }
    $$(".neuron").forEach((el, i) => { const a = A[i], depth = 1 - (a.z + 1) / 2; el.style.left = a.X + "px"; el.style.top = a.Y + "px";
      const s = (focus === null ? .72 + depth * .5 : (i === focus ? 1.7 : .5)); el.style.transform = `translate(-50%,-50%) scale(${s.toFixed(3)})`;
      el.style.opacity = focus === null ? (.55 + depth * .45).toFixed(2) : (i === focus ? 1 : .1); el.style.zIndex = Math.round(depth * 10) + 2; });
    requestAnimationFrame(frame);
  }
  window.BrainRender = () => { const u = ui(); $$("[data-v3]").forEach(el => el.textContent = u[el.dataset.v3] ?? ""); clearInterval(hlTimer); hlIdx = 0; typeLine(); if (!reduced) hlTimer = setInterval(() => { hlIdx++; typeLine(); }, 5600); buildNeurons(); if (focus !== null) unfocus(); };
  requestAnimationFrame(frame);
})();

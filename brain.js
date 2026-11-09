// Brain: 3D point cloud with five career neurons. Click a neuron → camera turns & zooms to it, its children appear as hologram cards.
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const C = () => CONTENT[document.documentElement.lang || "en"];
  const UI_EXTRA = { en: { v3_signal: "Signal", v3_hint: "Click a neuron to zoom in. Esc to zoom out.", v3_back: "Zoom out", v3_none: "Nothing attached here yet.", v3_pick: "Pick a satellite to read it." }, tr: { v3_signal: "Sinyal", v3_hint: "Yaklaşmak için bir nörona tıkla. Esc ile geri çık.", v3_back: "Uzaklaş", v3_none: "Buraya bağlı bir şey yok.", v3_pick: "Okumak için bir uyduya tıkla." } };
  const ui = () => ({ ...C().ui, ...UI_EXTRA[document.documentElement.lang || "en"] });

  /* ---- headline typing ---- */
  let hlIdx = 0, hlTimer, tw;
  function typeLine() { const lines = C().headlines, h = $("#hl"); if (!h) return; const txt = lines[hlIdx % lines.length]; let i = 0; clearInterval(tw); h.textContent = "";
    tw = setInterval(() => { h.textContent = txt.slice(0, ++i); if (i >= txt.length) clearInterval(tw); }, reduced ? 0 : 24); }

  /* ---- children per stop ---- */
  function childrenOf(id) {
    const c = C(), s = c.stops.find(x => x.id === id); if (!s) return [];
    const certIcon = o => /Michigan/.test(o) ? "tiles/umich.png" : /Google/.test(o) ? "tiles/google.png" : /MongoDB/.test(o) ? "tiles/mongodb.png" : "tiles/coursera.png";
    // numbers under the heading become text satellites; explicit nodes (Deloitte) too
    const stats = (s.stats || []).filter(([v]) => !/^Discord$/.test(v)).map(([v, l, d]) => ({ k: l, t: v, val: v, sl: l, d: d || s.lead }));
    const nodes = (s.nodes || []).map(x => ({ k: s.name, t: x.n, val: x.v, sl: x.n, d: x.d }));
    if (id === "amazon") return [...stats,
      ...(s.tools || []).map(t => ({ k: c.ui.tools, t: t.name, logo: t.icon, d: t.d, img: t.img, blur: true })),
      { k: s.small_title, t: ui().g_desktop || "Desktop tools", logo: "tiles/sweep.png", d: s.small_sub, list: (s.small || []).map(x => [x.n, x.d]) },
      ...(s.awards || []).map(a => ({ k: c.ui.awards, t: a.note, img: a.img, d: a.note })) ];
    if (id === "hypemerch") return [...stats,
      ...(s.press || []).map(p => ({ k: c.ui.press, t: p.outlet, img: p.img, d: p.note })),
      { k: "App Store", t: "Hype-Merch app", img: (s.apps || [{}])[0].img, d: s.body[1], imgs: (s.apps || []).map(a => a.img) } ];
    if (id === "coursera") return c.me.certs.map(x => ({ k: x.o, t: x.t, logo: certIcon(x.o), d: x.d, link: x.u }));
    if (id === "trnotify") return [...stats, { k: "Discord · 2020", t: ui().g_bots || "Discord bots", logo: "tiles/bots.png", d: s.lead }];
    return [...stats, ...nodes];
  }

  /* ---- point cloud ---- */
  const cv = $("#cv"), ctx = cv.getContext("2d"), wrap = $("#brain"); let W, H, dpr = Math.min(2, devicePixelRatio || 1);
  const pts = [], edges = [];
  function rnd(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  const R = rnd(42);
  // Anatomy: two hemispheres (long front→back, z axis) with a fissure between them.
  const hemi = (side, n) => { for (let i = 0; i < n; i++) { const u = R() * 6.2832, v = Math.acos(2 * R() - 1);
      let x = Math.sin(v) * Math.cos(u), y = Math.cos(v), z = Math.sin(v) * Math.sin(u);
      // squash into hemisphere: flat inner face at the fissure, flatter base
      x = Math.abs(x) * .50 + .04; y = y * .64; z = z * .74; if (y < -.25) y = -.25 - (y + .25) * .45; if (z > .45) y -= (z - .45) * .45;   // frontal lobe slopes down; length:width ≈ 1.35 like a real brain
      const g = .035 * Math.sin(z * 9 + y * 7) * Math.cos(x * 11 + z * 5);                                             // gyri texture
      pts.push({ x: side * (x + g), y: y + .1 + g, z: z - .05 + g, s: .55 + R() * 1.0 }); } };
  const DENSE = Math.min(innerWidth, innerHeight) >= 700 ? 900 : 520; hemi(-1, DENSE); hemi(1, DENSE);
  const N = pts.length;
  for (let i = 0; i < N; i++) { const d = []; const p = pts[i]; for (let j = 0; j < N; j++) if (j !== i) { const q = pts[j]; d.push([(p.x - q.x) ** 2 + (p.y - q.y) ** 2 + (p.z - q.z) ** 2, j]); } d.sort((a, b2) => a[0] - b2[0]); for (let k = 0; k < 3; k++) if (d[k][1] > i) edges.push([i, d[k][1]]); }
  const anchors = [[-.62, .12, .42], [-.36, .66, .19], [.05, .5, .62], [.40, .68, .08], [.64, .22, .38]];
  // Brain stem: a column of vertebra rings on the brain's axis, from the base down past the stage edge. It rotates with the
  // brain, and the story spine below picks up its pitch and radius so the two read as one structure.
  // Brain stem + spinal column, in the brain's own material: a point-cloud tube on the brain's axis with vertebral bulges,
  // a gentle S-curve, gyri-like noise and k-nearest-neighbour edges. One long cloud: the hero draws the part inside its stage,
  // the story canvas draws the rest with the same projection, so the two halves are literally one object.
  const STEM = { r: .05, pitch: .115, top: -.15, len: 24, rho: 200 };
  const axisAt = s => ({ x: .07 * Math.sin(s / 1.7), z: .05 * Math.cos(s / 2.3) - .02 });
  const radiusAt = s => { const v = Math.pow(.5 + .5 * Math.cos(6.2832 * s / STEM.pitch), 1.6), neck = Math.min(1, .55 + s * .9); return STEM.r * neck * (.74 + .26 * v); };
  const stemPts = []; { const Rs = rnd(7); for (let i = 0; i < STEM.len * STEM.rho; i++) { const s0 = Rs() * STEM.len, th = Rs() * 6.2832, ax = axisAt(s0), g = .006 * Math.sin(s0 * 23 + th * 3) * Math.cos(th * 5 + s0 * 9);
      const r = radiusAt(s0) + g; stemPts.push({ s: s0, ax: ax.x, az: ax.z, dx: Math.cos(th) * r, dz: Math.sin(th) * r, sz: .55 + Rs() * 1.0 }); }
    stemPts.sort((a, b) => a.s - b.s); }
  const stemEdges = []; for (let i = 0; i < stemPts.length; i++) { const p = stemPts[i], d = []; for (let j = Math.max(0, i - 45); j < Math.min(stemPts.length, i + 45); j++) if (j !== i) { const q = stemPts[j]; d.push([(p.ax + p.dx - q.ax - q.dx) ** 2 + (p.s - q.s) ** 2 + (p.az + p.dz - q.az - q.dz) ** 2, j]); } d.sort((a, b) => a[0] - b[0]); for (let k = 0; k < 3; k++) if (d[k] && d[k][1] > i) stemEdges.push([i, d[k][1]]); }
  const stemPoint = (p, taper = 1) => ({ x: p.ax + p.dx * taper, y: STEM.top - p.s, z: p.az + p.dz * taper });
  /* ---- camera ---- */
  let rotY = -.35, rotX = .12, tRotY = rotY, tRotX = rotX, zoom = 1, tZoom = 1, offX = 0, offY = 0, tOffX = 0, tOffY = 0, drag = null, auto = true, focus = null;
  const FOCAL = 3.2;
  let baseS = 300, cX = 0, cY = 0;                       // scale unit (px per brain unit at zoom 1) and projection centre
  /* Rest fit: the brain rotates continuously, so size it to the largest footprint over a full turn (points + neuron boxes),
     then centre that footprint in the stage, leaving room for the HUD strip at the top and the legend at the bottom. */
  function restFit(w, h) {
    const PAD = { top: 44, bottom: 62, side: 10 }, NB = { x: 68, yTop: 38, yBot: 74 }; // stage margins (HUD / legend), neuron box around its anchor
    let xa = 0, ya = 0, yaN = 0, xp = 0, yp = 0, ypN = 0;                             // unit extents (symmetric in x after the sweep)
    const samp = pts.filter((_, i) => i % 7 === 0);
    for (let ry = -.78; ry <= .1; ry += .08) for (const rx of [-.05, .12, .3]) {        // idle sway ±.22 + pointer ±.15 around -.35
      const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
      const pr = p => { const x = p.x * cy + p.z * sy; let z = -p.x * sy + p.z * cy; const y = p.y * cx - z * sx; z = p.y * sx + z * cx; const f = FOCAL / (FOCAL + z); return [x * f, y * f]; };
      for (const p of samp) { const [x, y] = pr(p); xp = Math.max(xp, Math.abs(x)); yp = Math.max(yp, y); ypN = Math.max(ypN, -y); }
      for (const a of anchors) { const [x, y] = pr({ x: a[0], y: a[1], z: a[2] }); xa = Math.max(xa, Math.abs(x)); ya = Math.max(ya, y); yaN = Math.max(yaN, -y); }
    }
    // need(S) = extent*S + constant margin; solve the largest S whose footprint fits (monotone → bisection)
    const top = S => Math.max(ya * S + NB.yTop, yp * S + 6), bot = S => Math.max(yaN * S + NB.yBot, ypN * S + 6), half = S => Math.max(xa * S + NB.x, xp * S + 6);
    let lo = 40, hi = 2000; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; (top(m) + bot(m) <= h - PAD.top - PAD.bottom && 2 * half(m) <= w - 2 * PAD.side) ? lo = m : hi = m; }
    const S = lo, free = (h - PAD.top - PAD.bottom) - (top(S) + bot(S));
    return { S, cx: w / 2, cy: PAD.top + free / 2 + top(S) };
  }
  function fit() { if (wrap.classList.contains("focused")) { baseS = Math.min(W, H) * .44; cX = W / 2; cY = H / 2 - 10; } else { const f = restFit(W, H); baseS = f.S; cX = f.cx; cY = f.cy; } }
  function size() { W = wrap.clientWidth; H = wrap.clientHeight; cv.width = W * dpr; cv.height = H * dpr; fit(); }
  size(); addEventListener("resize", () => size());
  wrap.addEventListener("pointermove", e => { if (focus !== null) return; if (drag) { tRotY = drag.ry + (e.clientX - drag.x) * .006; tRotX = Math.max(-.6, Math.min(.6, drag.rx + (e.clientY - drag.y) * .004)); } else if (!reduced) { const r = wrap.getBoundingClientRect(); tRotY = -.35 + ((e.clientX - r.left) / r.width - .5) * .3; tRotX = .12 + ((e.clientY - r.top) / r.height - .5) * .3; } });
  let hover = false, px = -1e4, py = -1e4; wrap.addEventListener("pointerenter", () => hover = true); wrap.addEventListener("pointerleave", () => { hover = false; px = py = -1e4; });
  wrap.addEventListener("pointermove", e => { const r = wrap.getBoundingClientRect(); px = e.clientX - r.left; py = e.clientY - r.top; });
  wrap.addEventListener("pointerdown", e => { if (focus === null && e.target === cv) { drag = { x: e.clientX, y: e.clientY, ry: tRotY, rx: tRotX }; auto = false; } });
  addEventListener("pointerup", () => drag = null);
  cv.addEventListener("click", () => { if (focus !== null) unfocus(); });
  addEventListener("keydown", e => { if (e.key === "Escape" && focus !== null) unfocus(); });
  function projStem(p) { const cy = Math.cos(rotY), sy = Math.sin(rotY); const x = p.x * cy + p.z * sy, z = -p.x * sy + p.z * cy, f = FOCAL / (FOCAL + z), S = baseS * zoom;
    return { X: cX + x * f * S + offX, Y: cY - p.y * f * S + offY, z, f }; }
  // material shared by brain and column
  function drawCloud(ctx, P, pts, edges, from, to, alpha, fireAt, stim, t) {
    const st = stim ? (x, y) => { const d = Math.hypot(x - stim.X, y - stim.Y); return d > stim.R ? 0 : Math.pow(1 - d / stim.R, 1.5) * (.8 + .2 * Math.sin(t * 18 + x * .05 + y * .07)); } : () => 0;
    for (const [a, b] of edges) { if (a < from || a >= to || b < from || b >= to) continue; const p = P[a - from], q = P[b - from]; if (!p || !q) continue; const d = (p.z + q.z) / 2, k = st((p.X + q.X) / 2, (p.Y + q.Y) / 2), al = (.07 + (1 - (d + 1) / 2) * .34) * alpha(a) + k * .5;
      ctx.strokeStyle = k > 0 ? `rgba(${Math.round(124 + 131 * k)},${Math.round(156 - 90 * k)},${Math.round(255 - 175 * k)},${al.toFixed(3)})` : `rgba(124,156,255,${al.toFixed(3)})`; ctx.lineWidth = .8 + k * .6; ctx.beginPath(); ctx.moveTo(p.X, p.Y); ctx.lineTo(q.X, q.Y); ctx.stroke(); }
    for (let i = from; i < to; i++) { const p = P[i - from]; if (!p) continue; const depth = 1 - (p.z + 1) / 2, fire = fireAt ? fireAt(i) : 0, k = st(p.X, p.Y), al = Math.min(1, (.3 + depth * .65) * alpha(i) + fire * .6 + k * .5), r = pts[i].sz * p.f * (1 + fire * .8 + k * 1.1);
      ctx.fillStyle = k > 0 ? `rgba(255,70,60,${(al * .35 * k + .04).toFixed(3)})` : fire > 0 ? `rgba(46,230,197,${(al * .3).toFixed(3)})` : `rgba(124,156,255,${(al * .18).toFixed(3)})`; ctx.beginPath(); ctx.arc(p.X, p.Y, r * 3.2, 0, 6.283); ctx.fill();
      ctx.fillStyle = k > 0 ? `rgba(${Math.round(214 + 41 * k)},${Math.round(226 - 140 * k)},${Math.round(255 - 170 * k)},${al.toFixed(3)})` : `rgba(214,226,255,${al.toFixed(3)})`; ctx.beginPath(); ctx.arc(p.X, p.Y, r, 0, 6.283); ctx.fill(); }
  }
  // the probe itself: a hot red core with a soft halo, drawn where the pointer is
  function drawProbe(ctx, X, Y, R, t) {
    const g = ctx.createRadialGradient(X, Y, 0, X, Y, R); g.addColorStop(0, "rgba(255,80,70,.26)"); g.addColorStop(.45, "rgba(255,60,60,.08)"); g.addColorStop(1, "rgba(255,60,60,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X, Y, R, 0, 6.283); ctx.fill();
    ctx.save(); ctx.shadowColor = "rgba(255,90,80,1)"; ctx.shadowBlur = 18 + 6 * Math.sin(t * 9); ctx.fillStyle = "rgba(255,230,225,.95)"; ctx.beginPath(); ctx.arc(X, Y, 2.6, 0, 6.283); ctx.fill(); ctx.restore();
    ctx.strokeStyle = "rgba(255,110,100,.45)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(X, Y, 10 + 3 * Math.sin(t * 6), 0, 6.283); ctx.stroke();
  }
  function project(p, raw) {
    const cy = Math.cos(rotY), sy = Math.sin(rotY), cx = Math.cos(rotX), sx = Math.sin(rotX);
    let x = p.x * cy + p.z * sy, z = -p.x * sy + p.z * cy, y = p.y * cx - z * sx; z = p.y * sx + z * cx;
    const f = FOCAL / (FOCAL + z), S = baseS * zoom;
    return { X: cX + x * f * S + (raw ? 0 : offX), Y: cY - y * f * S + (raw ? 0 : offY), z, f };
  }

  /* ---- neurons ---- */
  function buildNeurons() {
    $("#neurons").innerHTML = C().stops.map((s, i) => `<a class="neuron" data-i="${i}" href="#${s.id}"><span class="disc"><img src="assets/logos/${s.logo}" alt="${esc(s.name)}"></span>${childrenOf(s.id).length ? `<span class="cnt">${childrenOf(s.id).length}</span>` : ""}<span class="lbl"><b>${esc(s.name)}</b><span>${esc(s.years)}</span></span></a>`).join("");
    const tip = $("#tip");
    $$(".neuron").forEach(el => {
      el.addEventListener("click", e => { e.preventDefault(); const i = +el.dataset.i; focus === i ? unfocus() : focusOn(i); });
      el.addEventListener("pointerenter", () => { if (focus !== null) return; const s = C().stops[+el.dataset.i]; $("#tipK").textContent = s.kicker; $("#tipT").textContent = s.lead;
        const x = parseFloat(el.style.left), y = parseFloat(el.style.top), below = y < 230;                 // flip under the neuron when there is no room above
        tip.style.left = Math.min(W - 170, Math.max(170, x)) + "px"; tip.style.top = (below ? y + 56 : y - 44) + "px"; tip.classList.toggle("below", below); tip.classList.add("show"); });
      el.addEventListener("pointerleave", () => tip.classList.remove("show"));
    });
  }

  /* ---- focus: full-screen takeover + ordered hologram panel ---- */
  let placeholder = null;
  function expand() {
    const r = wrap.getBoundingClientRect(); placeholder = document.createElement("div"); placeholder.style.height = r.height + "px"; wrap.parentNode.insertBefore(placeholder, wrap);
    // go full-screen instantly, but start the camera where the brain was on screen so nothing jumps; the camera then eases to the centre
    const oldS = baseS, oldCx = cX, oldCy = cY; wrap.classList.add("focused"); document.body.classList.add("brain-open"); size();
    zoom = oldS / baseS;                                        // keep the same on-screen size at first
    const c0 = project({ x: 0, y: .1, z: 0 }, true); offX = (r.left + oldCx) - c0.X; offY = (r.top + oldCy) - c0.Y;
    requestAnimationFrame(() => wrap.classList.add("lit"));
  }
  function collapse() {
    if (!placeholder) return; const r = placeholder.getBoundingClientRect();
    // ease the camera back to where the inline brain will be, then drop the overlay
    const rf = restFit(r.width, r.height); tZoom = rf.S / baseS;
    const z0 = zoom; zoom = tZoom; const c0 = project({ x: 0, y: .1, z: 0 }, true); zoom = z0;   // measure at the target zoom
    tOffX = (r.left + rf.cx) - c0.X; tOffY = (r.top + rf.cy) - c0.Y;
    wrap.classList.remove("lit");
    setTimeout(() => { wrap.classList.remove("focused"); document.body.classList.remove("brain-open"); placeholder.remove(); placeholder = null; size(); zoom = 1; offX = offY = 0; tZoom = 1; tOffX = tOffY = 0; }, 650);
  }
  function focusOn(i) {
    if (focus === null) expand();
    focus = i; auto = false; $("#tip").classList.remove("show");
    const a = anchors[i]; tRotY = Math.atan2(-a[0], a[2]); const zr = Math.hypot(a[0], a[2]); tRotX = Math.max(-.7, Math.min(.7, Math.atan2(a[1], zr) * .85)); tZoom = 2.4;
    const s = C().stops[i], kids = childrenOf(s.id), u = ui(), holo = $("#holo");
    holo.innerHTML = `<button class="holo-close btn" data-back>✕ ${esc(u.v3_back)}</button>
      <div class="holo-panel">
        <div class="holo-head"><span class="eyebrow">${esc(s.kicker)}</span><h3>${esc(s.name)} <span class="mono">${esc(s.years)}</span></h3><p>${esc(s.lead)}</p>
          <div class="holo-acts"><a class="btn btn-ink" href="#${s.id}" data-read>${esc(u.g_read)} ↓</a></div></div>
        <div class="holo-chips"></div>
        <div class="holo-detail" id="holoDetail"><p class="holo-empty">${kids.length ? esc(u.v3_pick) : esc(u.v3_none)}</p></div>
        <nav class="holo-nav">${C().stops.map((x, j) => `<button class="hn ${j === i ? "on" : ""}" data-n="${j}" title="${esc(x.name)}"><img src="assets/logos/${x.logo}" alt=""></button>`).join("")}</nav>
      </div>`;
    holo.classList.add("on");
    $("[data-back]", holo).onclick = unfocus;
    $("[data-read]", holo).onclick = ev => { ev.preventDefault(); unfocus(); setTimeout(() => $("#" + s.id).scrollIntoView({ behavior: reduced ? "auto" : "smooth" }), 650); };
    renderSats(kids);
    $$(".hn", holo).forEach(btn => btn.onclick = () => focusOn(+btn.dataset.n));
    placePanel();
  }
  let sats = [];
  function renderSats(kids) {
    const narrow = matchMedia("(max-width:980px)").matches, item = (k, j, cls) => { const lab = k.sl || k.t; return `<button class="${cls}" style="--d:${320 + j * 55}ms" data-j="${j}" title="${esc(k.t)}">${k.val ? `<span class="sd sv">${esc(k.val)}</span>` : `<span class="sd"><img src="${k.img ? "assets/img/" + k.img : "assets/logos/" + k.logo}" alt=""></span>`}<span class="sl">${esc(lab.length > 18 ? lab.slice(0, 17) + "…" : lab)}</span></button>`; };
    // wide screens: satellites float around the neuron; narrow screens: the same items as a chip strip inside the panel
    $("#sats").innerHTML = narrow ? "" : kids.map((k, j) => item(k, j, "sat")).join("");
    const strip = $(".holo-chips"); if (strip) strip.innerHTML = narrow ? kids.map((k, j) => item(k, j, "chip")).join("") : "";
    sats = $$(".sat"); if (sats.length) measureSats();
    $$(".sat, .chip").forEach(el => el.onclick = () => { $$(".sat, .chip").forEach(x => x.classList.toggle("on", x === el)); showDetail(kids[+el.dataset.j], null); });
  }
  let satW = 120, satH = 66;
  function measureSats() { satW = Math.max(60, ...sats.map(e => e.offsetWidth)) + 6; satH = Math.max(40, ...sats.map(e => e.offsetHeight)) + 6; }
  function placeSats(a, t) {
    // Satellites sit on a ring around the focused neuron. The ring leaves a gap on the right (towards the panel) so the
    // dashed connector has room and no satellite ever slides under the panel; the radius adapts to the free space so
    // neighbours never touch and the ring is never squashed against an edge.
    const n = sats.length; if (!n) return;
    const panel = $(".holo-panel"), wr = wrap.getBoundingClientRect();
    const pl = panel ? panel.getBoundingClientRect().left - wr.left : W;                  // panel's left edge, stage coords
    const up = a.Y - satH / 2 - 8, down = H - satH / 2 - 8 - a.Y, left = (a.X - satW / 2 - 8) / 1.25, room = pl - satW / 2 - 8 - a.X;
    const fit = Math.max(90, Math.min(up, down, left));                                       // largest ring that stays on screen
    let R0 = Math.min(fit, Math.min(W, H) * .20 * Math.sqrt(zoom / 2.4) + 48), alt = 28, gap = 45, step = 0;
    for (let k = 0; k < 3; k++) {
      const RX = (R0 + alt) * 1.25;
      gap = room >= RX ? 45 : Math.max(45, Math.acos(Math.max(-1, Math.min(1, room / RX))) * 180 / Math.PI);
      step = n > 1 ? (360 - 2 * gap) / (n - 1) : 0;
      const chord = n > 1 ? 2 * R0 * Math.sin(step / 2 * Math.PI / 180) : 1e9, need = Math.max(satW / 1.25, satH) + 4;
      if (chord >= need) break;
      const want = need / (2 * Math.sin(step / 2 * Math.PI / 180));
      if (want + alt <= fit) R0 = want; else { R0 = Math.max(90, fit - alt); alt = Math.min(44, Math.max(0, fit - R0)); }
    }
    sats.forEach((el, j) => { const base = n === 1 ? 180 : gap + j * step; const ang = (base + Math.sin(t * .6 + j) * 2) * Math.PI / 180; const R = R0 + (j % 2) * alt;
      const x = a.X + Math.cos(ang) * R * 1.25, y = a.Y + Math.sin(ang) * R;
      el.style.left = Math.min(pl - satW / 2 - 8, Math.max(satW / 2 + 8, x)) + "px"; el.style.top = Math.min(H - satH / 2 - 8, Math.max(satH / 2 + 8, y)) + "px"; });
  }
  function unfocus() { if (focus === null) return; focus = null; tRotY = -.35; tRotX = .12; $("#holo").classList.remove("on"); $("#holo").innerHTML = ""; $("#sats").innerHTML = ""; sats = []; collapse(); }
  function placePanel() { /* panel is CSS-positioned; nothing dynamic */ }
  const placeHolo = placePanel;
  function showDetail(k, btn) {
    const d = $("#holoDetail"), u = ui();
    const imgs = k.imgs || (k.img ? [k.img] : []);
    d.innerHTML = `<button class="hd-close" aria-label="Close">×</button><span class="eyebrow">${esc(k.k)}</span><b>${esc(k.t)}</b><p>${esc(k.d || "")}</p>
      ${k.list ? `<ul>${k.list.map(([a, b2]) => `<li><b>${esc(a)}</b> ${esc(b2)}</li>`).join("")}</ul>` : ""}
      ${imgs.length ? `<div class="hd-imgs">${imgs.map(i => `<img src="assets/img/${i}" alt="" data-full="assets/img/${i}">`).join("")}</div>` : ""}
      ${k.blur ? `<span class="eyebrow">${esc(u.blur_note)}</span>` : ""}${k.link ? `<a class="btn" target="_blank" rel="noopener" href="${esc(k.link)}">${esc(u.g_verify)} ↗</a>` : ""}`;
    d.classList.add("on"); $(".hd-close", d).onclick = () => { d.innerHTML = `<p class="holo-empty">${esc(u.v3_pick)}</p>`; $$(".sat, .chip").forEach(x => x.classList.remove("on")); };
    /* panel images open in the proof viewer (gallery.js, delegated) */
  }

  /* ---- render loop ---- */
  let t0 = null, visible = true; new IntersectionObserver(es => es.forEach(e => visible = e.isIntersecting), { threshold: 0 }).observe(wrap); document.addEventListener('visibilitychange', () => { if (!document.hidden) requestAnimationFrame(frame); });
  function frame(now) {
    if (document.hidden) return; if (!visible && focus === null) { requestAnimationFrame(frame); return; }
    if (t0 === null) t0 = now; const t = Math.max(0, (now - t0) / 1000);
    if (auto && !drag && !hover && !reduced && focus === null) tRotY = -.35 + Math.sin(t * .14) * .22;
    rotY += (tRotY - rotY) * .07; rotX += (tRotX - rotX) * .07; zoom += (tZoom - zoom) * .08;
    if (focus !== null) { const c0 = project({ x: 0, y: .1, z: 0 }, true), af = anchors[focus], n0 = project({ x: af[0], y: af[1], z: af[2] }, true);
      tOffX = W * .5 - c0.X; tOffY = H * .5 - c0.Y;
      // brain stays centred, but the focused neuron is kept inside a band (left of the panel, mid-height) so its satellite ring has room
      const narrow = W < 981, yN = Math.min(H * .26, H * .39 - 90);                  // narrow: panel sits at the bottom, neuron goes to the upper free area
      const nx = n0.X + tOffX, ny = n0.Y + tOffY, xMin = narrow ? W * .5 : W * .32, xMax = narrow ? W * .5 : W * .44, yMin = narrow ? yN : H * .44, yMax = narrow ? yN : H * .56;
      if (nx > xMax) tOffX -= nx - xMax; else if (nx < xMin) tOffX += xMin - nx;
      if (ny < yMin) tOffY += yMin - ny; else if (ny > yMax) tOffY -= ny - yMax; }
    offX += (tOffX - offX) * .08; offY += (tOffY - offY) * .08;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const dim = focus !== null ? .95 : 1, P = pts.map(p => project(p));
    const stim = (hover && focus === null && px > -1e3) ? { X: px, Y: py, R: 95 } : null;
    drawCloud(ctx, P, pts.map(q => ({ sz: q.s * Math.sqrt(zoom) })), edges, 0, N, () => dim, null, stim, t);
    const A = anchors.map(a => project({ x: a[0], y: a[1], z: a[2] }));
    ctx.lineWidth = 1.6; ctx.strokeStyle = `rgba(46,230,197,${focus === null ? .55 : .25})`; ctx.shadowColor = "rgba(46,230,197,.8)"; ctx.shadowBlur = 10; ctx.beginPath(); ctx.moveTo(A[0].X, A[0].Y);
    for (let i = 1; i < A.length; i++) { const p = A[i - 1], q = A[i], cx = (p.X + q.X) / 2; ctx.bezierCurveTo(cx, p.Y, cx, q.Y, q.X, q.Y); } ctx.stroke(); ctx.shadowBlur = 0;
    if (focus === null && innerWidth > 980) {                          // brain stem: the column leaves the stage through its base, the story canvas continues it
      const sMax = Math.max(0, (H + 30 - cY) / (baseS * zoom) + STEM.top) + .3; let to = 0; while (to < stemPts.length && stemPts[to].s < sMax) to++; stemTo = to;
      const P = []; for (let i = 0; i < to; i++) P.push(projStem(stemPoint(stemPts[i])));
      const sig = sigS(t);
      drawCloud(ctx, P, stemPts, stemEdges, 0, to, () => 1, i => Math.max(0, 1 - Math.abs(stemPts[i].s - sig) / .14), stim, t);
      // the neural link continues down the column as its cord
      ctx.save(); ctx.lineWidth = 1.6; ctx.strokeStyle = "rgba(46,230,197,.5)"; ctx.shadowColor = "rgba(46,230,197,.8)"; ctx.shadowBlur = 10; ctx.beginPath();
      for (let ss = 0, first = true; ss <= sMax; ss += .2) { const a = axisAt(ss), q = projStem({ x: a.x, y: STEM.top - ss, z: a.z }); first ? ctx.moveTo(q.X, q.Y) : ctx.lineTo(q.X, q.Y); first = false; } ctx.stroke(); ctx.restore();
      if (!reduced && sig < sMax) { const a = axisAt(sig), q = projStem({ x: a.x, y: STEM.top - sig, z: a.z }); ctx.save(); ctx.shadowColor = "rgba(46,230,197,1)"; ctx.shadowBlur = 18; ctx.fillStyle = "rgba(220,255,247,.95)"; ctx.beginPath(); ctx.arc(q.X, q.Y, 2.6, 0, 6.283); ctx.fill(); ctx.restore(); } }
    if (stim) drawProbe(ctx, stim.X, stim.Y, stim.R, t);
    if (!reduced && focus === null) { const k = (((t * .18) % 1) + 1) % 1, total = A.length - 1, seg = Math.max(0, Math.min(total - 1, Math.floor(k * total))), u = Math.min(1, k * total - seg), p = A[seg], q = A[seg + 1], cx = (p.X + q.X) / 2;
      const bx = (1 - u) ** 3 * p.X + 3 * (1 - u) ** 2 * u * cx + 3 * (1 - u) * u * u * cx + u ** 3 * q.X, by = (1 - u) ** 3 * p.Y + 3 * (1 - u) ** 2 * u * p.Y + 3 * (1 - u) * u * u * q.Y + u ** 3 * q.Y;
      ctx.fillStyle = "#2ee6c5"; ctx.shadowColor = "#2ee6c5"; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(bx, by, 4, 0, 6.283); ctx.fill(); ctx.shadowBlur = 0; }
    // hologram links
    if (focus !== null) { const a = A[focus]; placeSats(a, t); ctx.strokeStyle = "rgba(46,230,197,.35)"; ctx.lineWidth = 1; sats.forEach(el => { const x = parseFloat(el.style.left), y = parseFloat(el.style.top); if (isNaN(x)) return; ctx.beginPath(); ctx.moveTo(a.X, a.Y); ctx.lineTo(x, y); ctx.stroke(); }); const panel = $(".holo-panel"); if (panel) { const pr = panel.getBoundingClientRect(), wr = wrap.getBoundingClientRect(); ctx.strokeStyle = "rgba(46,230,197,.5)"; ctx.lineWidth = 1.2; ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.moveTo(a.X, a.Y); ctx.lineTo(pr.left - wr.left, pr.top - wr.top + pr.height * .5); ctx.stroke(); ctx.setLineDash([]); }
      for (let k = 0; k < 2; k++) { const rr = (48 + k * 22) * Math.sqrt(zoom) + 6 * Math.sin(t * 2.4 + k); ctx.beginPath(); ctx.arc(a.X, a.Y, rr, 0, 6.283); ctx.strokeStyle = `rgba(46,230,197,${(.35 - k * .15) + .15 * Math.sin(t * 3 + k)})`; ctx.lineWidth = 1.2; ctx.stroke(); } }
    $$(".neuron").forEach((el, i) => { const a = A[i], depth = 1 - (a.z + 1) / 2; el.style.left = a.X + "px"; el.style.top = a.Y + "px";
      const s = (focus === null ? .72 + depth * .5 : (i === focus ? 1.7 : .5)); el.style.transform = `translate(-50%,-50%) scale(${s.toFixed(3)})`;
      el.style.opacity = focus === null ? (.55 + depth * .45).toFixed(2) : (i === focus ? 1 : .1); el.style.zIndex = Math.round(depth * 10) + 2; el.classList.toggle('is-focus', i === focus); });
    requestAnimationFrame(frame);
  }
  let stemTo = 0; const sigS = t => reduced ? -9 : (t * 1.25) % 9.5;
  window.BrainInfo = () => { const r = wrap.getBoundingClientRect(); return { S: baseS * zoom, rect: r, cY, probe: drawProbe, x: r.left + cX + offX, STEM, pts: stemPts, edges: stemEdges, point: stemPoint, proj: projStem, axisAt, draw: drawCloud, sigS, resting: focus === null && !wrap.classList.contains("focused") }; };
  window.BrainRender = () => { const u = ui(); $$("[data-v3]").forEach(el => el.textContent = u[el.dataset.v3] ?? ""); const g = $("#hlghost"); if (g) g.textContent = C().headlines.reduce((m, x) => x.length > m.length ? x : m, ""); clearInterval(hlTimer); hlIdx = 0; typeLine(); if (!reduced) hlTimer = setInterval(() => { hlIdx++; typeLine(); }, 5600); buildNeurons(); if (focus !== null) unfocus(); };
  requestAnimationFrame(frame);
})();

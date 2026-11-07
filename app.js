(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;
  let lang = localStorage.getItem("lang") || ((navigator.language || "en").toLowerCase().startsWith("tr") ? "tr" : "en");

  /* ---------- i18n render ---------- */
  const t = () => I18N[lang];
  const get = (obj, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fmt = n => n.toLocaleString(lang === "tr" ? "tr-TR" : "en-US");

  function render() {
    document.documentElement.lang = lang;
    $$("[data-i18n]").forEach(el => { const v = get(t(), el.dataset.i18n); if (typeof v === "string") el.textContent = v; });
    $$(".lang button").forEach(b => b.classList.toggle("on", b.dataset.lang === lang));

    $("#kpis").innerHTML = t().kpis.map(k => `
      <div class="kpi"><div class="v" data-count="${k.v}" data-prefix="${esc(k.prefix)}" data-suffix="${esc(k.suffix)}">${esc(k.prefix)}0<small>${esc(k.suffix)}</small></div>
      <div class="l">${esc(k.label)}</div><div class="s">${esc(k.sub)}</div></div>`).join("");

    $("#tllist").innerHTML = t().timeline.map(e => `
      <li><div class="meta"><span class="y">${esc(e.y)}</span><span class="tag ${/now|şimdi/i.test(e.tag) ? "now" : ""}">${esc(e.tag)}</span></div>
      <h3>${esc(e.t)}</h3><p>${esc(e.d)}</p></li>`).join("");

    $("#grid").innerHTML = t().projects.map(p => `
      <article class="card"><div class="top"><div><h3>${esc(p.n)}</h3><div class="k">${esc(p.k)}</div></div><span class="badge">${esc(p.badge)}</span></div>
      <p>${esc(p.d)}</p><div class="tags">${p.tags.map(x => `<span>${esc(x)}</span>`).join("")}</div></article>`).join("");

    $("#stackgrid").innerHTML = t().stack_groups.map(g => `<div class="sg"><h4>${esc(g.h)}</h4><ul>${g.items.map(i => `<li>${esc(i)}</li>`).join("")}</ul></div>`).join("");
    const all = t().stack_groups.flatMap(g => g.items);
    $("#marquee").innerHTML = [...all, ...all].map(i => `<span>${esc(i)}</span>`).join("");

    const r = t().receipt, tl = t().timeline;
    $("#receipt").innerHTML = `<div class="c"><b>${esc(r.title)}</b><br>${esc(r.line1)}<br>${esc(r.line2)}</div><hr>
      ${tl.slice().reverse().map(e => `<div class="row"><span>${esc(e.y)}</span><span>${esc(e.t.split(" — ")[0])}</span></div>`).join("")}
      <hr><div class="row"><b>${esc(r.total)}</b><b>${esc(r.total_v)}</b></div><hr><div class="c">${esc(r.thanks)}</div><div class="bar"></div>`;

    $("#year").textContent = new Date().getFullYear();
    observe(); countersSeen = new WeakSet(); bindCards();
  }

  $$(".lang button").forEach(b => b.addEventListener("click", () => {
    if (b.dataset.lang === lang) return;
    lang = b.dataset.lang; localStorage.setItem("lang", lang);
    document.body.classList.add("switching");
    setTimeout(() => { render(); requestAnimationFrame(() => document.body.classList.remove("switching")); }, 180);
  }));

  /* ---------- reveal + counters ---------- */
  let io, countersSeen = new WeakSet();
  function observe() {
    io && io.disconnect();
    io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      $$("[data-count]", e.target.closest(".kpis") || e.target).forEach(countUp);
      if (e.target.matches(".kpi")) countUp($(".v", e.target));
    }), { threshold: 0.15 });
    $$(".reveal, .kpi, .card, .sg").forEach(el => { if (!el.classList.contains("reveal")) el.classList.add("reveal"); io.observe(el); });
  }
  function countUp(el) {
    if (!el || countersSeen.has(el)) return; countersSeen.add(el);
    const target = parseFloat(el.dataset.count), pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
    const dec = String(target).includes(".") ? 1 : 0, dur = reduced ? 0 : 1400, t0 = performance.now();
    const step = now => {
      const p = Math.min(1, (now - t0) / (dur || 1)), e = 1 - Math.pow(1 - p, 3), v = target * e;
      el.innerHTML = `${esc(pre)}${dec ? v.toFixed(dec).replace(".", lang === "tr" ? "," : ".") : fmt(Math.round(v))}<small>${esc(suf)}</small>`;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- scroll: progress, nav, timeline rail ---------- */
  const nav = $("#nav"), prog = $("#progress"), fill = $("#tlfill");
  const links = $$(".links a");
  function onScroll() {
    const h = document.documentElement, max = h.scrollHeight - innerHeight;
    prog.style.transform = `scaleX(${max ? h.scrollTop / max : 0})`;
    nav.classList.toggle("scrolled", h.scrollTop > 20);
    const tl = $("#tl"); if (tl) {
      const r = tl.getBoundingClientRect(), p = Math.min(1, Math.max(0, (innerHeight * 0.7 - r.top) / r.height));
      fill.style.transform = `scaleY(${p})`;
      $$("#tllist li").forEach(li => { const b = li.getBoundingClientRect(); li.classList.toggle("lit", b.top < innerHeight * 0.72); });
    }
    let cur = "top"; $$("main section[id]").forEach(s => { if (s.getBoundingClientRect().top < innerHeight * 0.4) cur = s.id; });
    links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + cur));
  }
  addEventListener("scroll", onScroll, { passive: true }); addEventListener("resize", onScroll);

  /* ---------- pointer effects: cursor glow, spotlight, tilt, magnetic ---------- */
  const cursor = $("#cursor");
  if (fine && !reduced) {
    document.body.classList.add("has-cursor");
    let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
    addEventListener("pointermove", e => { tx = e.clientX; ty = e.clientY; });
    (function loop() { cx += (tx - cx) * .12; cy += (ty - cy) * .12; cursor.style.transform = `translate(${cx - 180}px,${cy - 180}px)`; requestAnimationFrame(loop); })();
  }
  function bindCards() {
    $$(".card, .kpi").forEach(el => {
      el.addEventListener("pointermove", e => {
        const r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        el.style.setProperty("--mx", x + "px"); el.style.setProperty("--my", y + "px");
        if (el.classList.contains("card") && fine && !reduced) {
          const rx = ((y / r.height) - .5) * -6, ry = ((x / r.width) - .5) * 8;
          el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
        }
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }
  if (fine && !reduced) $$(".magnetic").forEach(b => {
    b.addEventListener("pointermove", e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px,${(e.clientY - r.top - r.height / 2) * .28}px)`; });
    b.addEventListener("pointerleave", () => { b.style.transform = ""; });
  });

  /* ---------- clock (Istanbul) ---------- */
  const clock = $("#clock");
  const tick = () => { clock.textContent = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }).format(new Date()) + " IST"; };
  tick(); setInterval(tick, 15000);

  /* ---------- background: flowing gradient field + grid ---------- */
  const cv = $("#bg"), ctx = cv.getContext("2d");
  let W, H, px = 0, py = 0, tpx = 0, tpy = 0;
  const blobs = [
    { x: .2, y: .25, r: .45, c: [58, 123, 213], s: .00017, o: 0 },
    { x: .8, y: .3, r: .40, c: [79, 209, 197], s: .00013, o: 2 },
    { x: .55, y: .85, r: .50, c: [159, 122, 234], s: .00011, o: 4 },
  ];
  function size() { W = cv.width = innerWidth * devicePixelRatio; H = cv.height = innerHeight * devicePixelRatio; }
  size(); addEventListener("resize", size);
  addEventListener("pointermove", e => { tpx = (e.clientX / innerWidth - .5); tpy = (e.clientY / innerHeight - .5); });
  function draw(now) {
    px += (tpx - px) * .03; py += (tpy - py) * .03;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0b0e14"; ctx.fillRect(0, 0, W, H);
    const sc = scrollY * 0.25 * devicePixelRatio;
    ctx.globalCompositeOperation = "lighter";
    blobs.forEach((b, i) => {
      const x = (b.x + Math.sin(now * b.s + b.o) * .08 + px * .06 * (i + 1)) * W;
      const y = (b.y + Math.cos(now * b.s * 1.3 + b.o) * .08 + py * .06 * (i + 1)) * H - sc * (i * .3 + .2);
      const r = b.r * Math.max(W, H) * .9;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${b.c.join(",")},.16)`); g.addColorStop(.5, `rgba(${b.c.join(",")},.05)`); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalCompositeOperation = "source-over";
    // fine grid, drifting with scroll
    const step = 56 * devicePixelRatio, off = (sc * .4) % step;
    ctx.strokeStyle = "rgba(255,255,255,.035)"; ctx.lineWidth = 1; ctx.beginPath();
    for (let x = (W / 2) % step; x < W; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = -off; y < H; y += step) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
    // vignette
    const v = ctx.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, Math.max(W, H) * .75);
    v.addColorStop(0, "rgba(11,14,20,0)"); v.addColorStop(1, "rgba(11,14,20,.85)"); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    if (!reduced) requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);

  render(); onScroll();
})();

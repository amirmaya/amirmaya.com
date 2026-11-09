(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  history.scrollRestoration = "manual";
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  scrollTo(0, 0);
  let lang = localStorage.getItem("lang") || ((navigator.language || "en").toLowerCase().startsWith("tr") ? "tr" : "en");
  const C = () => CONTENT[lang];
  const logo = (s, cls = "") => `<span class="${cls}"><img src="assets/logos/${s.logo}" alt="${esc(s.name)}"></span>`;
  const smooth = sel => { const t = $(sel); t && t.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" }); };

  /* theme */
  const root = document.documentElement;
  root.dataset.theme = "dark";
  

  /* headline rotator */
  let hlTimer, hlIdx = 0;
  function setHeadline(i, animate = true) {
    const lines = C().headlines; hlIdx = (i + lines.length) % lines.length; const h = $("#hl");
    const dots = () => $$(".hl-dot").forEach((d, k) => d.classList.toggle("on", k === hlIdx));
    if (document.body.classList.contains("neural") && !reduced) {
      const txt = lines[hlIdx]; let i = 0; h.textContent = ""; dots(); clearInterval(h._tw);
      h._tw = setInterval(() => { h.textContent = txt.slice(0, ++i); if (i >= txt.length) clearInterval(h._tw); }, 28); return;
    }
    const swap = () => { h.textContent = lines[hlIdx]; h.classList.remove("is-fading"); dots(); };
    if (animate && !reduced) { h.classList.add("is-fading"); setTimeout(swap, 350); } else swap();
  }
  function startHeadlines() {
    clearInterval(hlTimer);
    $("#hldots").innerHTML = C().headlines.map((_, k) => `<button class="hl-dot" aria-label="Line ${k + 1}"></button>`).join("");
    $$(".hl-dot").forEach((d, k) => d.addEventListener("click", () => { setHeadline(k); restart(); }));
    setHeadline(hlIdx, false);
    const restart = () => { clearInterval(hlTimer); if (!reduced) hlTimer = setInterval(() => setHeadline(hlIdx + 1), 5200); };
    restart();
  }

  /* route */
  const DESK = [[.09,.6],[.3,.3],[.5,.62],[.7,.3],[.91,.58]];
  const MOB  = [[.26,.08],[.74,.28],[.26,.5],[.74,.7],[.5,.92]];
  const pts = () => innerWidth <= 1000 ? MOB : DESK;
  function pathD(P, w, h) {
    const p = P.map(([x, y]) => [x * w, y * h]); let d = `M ${p[0][0]} ${p[0][1]}`;
    for (let i = 1; i < p.length; i++) { const [x0, y0] = p[i - 1], [x1, y1] = p[i], cx = (x0 + x1) / 2; d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`; }
    return d;
  }
  function layoutRoute(animate) {
    const route = $("#route"), w = route.clientWidth, h = route.clientHeight, P = pts();
    $("#routeSvg").setAttribute("viewBox", `0 0 ${w} ${h}`);
    const d = pathD(P, w, h), rp = $("#routePath"); rp.setAttribute("d", d); $("#routeGhost").setAttribute("d", d);
    const len = rp.getTotalLength(); rp.style.strokeDasharray = len; rp.style.strokeDashoffset = animate && !reduced ? len : 0;
    $$(".stop").forEach((el, i) => { el.style.left = P[i][0] * 100 + "%"; el.style.top = P[i][1] * 100 + "%"; });
    if (animate && !reduced) {
      rp.style.transition = "none"; requestAnimationFrame(() => { rp.style.transition = "stroke-dashoffset 2.2s cubic-bezier(.3,0,.2,1)"; rp.style.strokeDashoffset = 0; });
      $$(".stop").forEach((el, i) => setTimeout(() => el.classList.add("in"), 200 + i * 240));
    } else $$(".stop").forEach(el => el.classList.add("in"));
  }
  function renderRoute() {
    $("#stops").innerHTML = C().stops.map((s, i) => `<a class="stop ${i === C().stops.length - 1 ? "big" : ""}" href="#${s.id}" data-i="${i}">${logo(s, "disc")}<span class="lbl"><b>${esc(s.name)}</b><span class="yr">${esc(s.years)}</span></span></a>`).join("");
    const tip = $("#tip");
    $$(".stop").forEach(el => {
      el.addEventListener("click", e => { e.preventDefault(); smooth(el.getAttribute("href")); });
      el.addEventListener("pointerenter", () => { const s = C().stops[+el.dataset.i]; $("#tipK").textContent = s.kicker; $("#tipT").textContent = s.lead; tip.style.left = el.style.left; tip.style.top = `calc(${el.style.top} - 66px)`; tip.classList.add("show"); });
      el.addEventListener("pointerleave", () => tip.classList.remove("show"));
    });
  }

  /* story */
  const fig = (src, b, note) => `<figure class="fig card" data-full="assets/img/${src}"><div class="img"><img src="assets/img/${src}" alt="${esc(b)}" loading="lazy"></div><figcaption class="cap2"><b>${esc(b)}</b><span>${esc(note)}</span></figcaption></figure>`;
  function layoutCord() {
    const brain = $("#brain"), list = $("#storyList"); if (!brain || !list) return;
    if (innerWidth <= 980) { list.style.removeProperty("--spine-x"); return; }
    const br = brain.getBoundingClientRect(), lr = list.getBoundingClientRect();
    list.style.setProperty("--spine-x", (br.left + br.width / 2 - lr.left) + "px");          // chapter neurons sit exactly on the brain's axis
  }
  addEventListener("resize", layoutCord);
  function renderStory() {
    const ui = C().ui;
    $("#storyList").innerHTML = C().stops.map((s, i) => `
      <article class="stopsec" id="${s.id}" style="--i:${i}">
        <div class="bigyear" aria-hidden="true">${esc(s.years.split(/\s|–/)[0])}</div>
        <aside class="side"><div class="reveal">${logo(s, "biglogo")}</div><div class="chap reveal"><span class="n">${String(i + 1).padStart(2, "0")}</span><span class="eyebrow">${esc(s.years)}</span></div></aside>
        <div class="main">
          <div class="reveal"><h2>${esc(s.name)}</h2><p class="kicker">${esc(s.kicker)}</p><p class="lead">${esc(s.lead)}</p><div class="body">${s.body.map(p => `<p>${esc(p)}</p>`).join("")}</div>
          ${s.stats ? `<div class="stats">${s.stats.map(([b, l]) => `<div><b>${esc(b)}</b><span>${esc(l)}</span></div>`).join("")}</div>` : ""}</div>
          ${s.internships ? `<p class="eyebrow sub-h reveal">${esc(ui.internships)}</p><div class="interns">${s.internships.map(x => `<div class="intern card"><span class="lg"><img src="assets/logos/${x.logo}" alt="${esc(x.name)}"></span><b>${esc(x.name)} — ${esc(x.role)}</b><span class="when">${esc(x.when)}</span><p>${esc(x.d)}</p></div>`).join("")}</div>` : ""}
          ${s.press ? `<p class="eyebrow sub-h reveal">${esc(ui.press)}</p><div class="press">${s.press.map(p => fig(p.img, p.outlet, p.note)).join("")}</div>` : ""}
          ${s.apps ? `<p class="eyebrow sub-h reveal">${esc(ui.apps)}</p><div class="apps">${s.apps.map(a => fig(a.img, "App Store", a.note)).join("")}</div>` : ""}
          ${s.awards ? `<p class="eyebrow sub-h reveal">${esc(ui.awards)}</p><div class="awards">${s.awards.map(a => fig(a.img, "Amazon", a.note)).join("")}</div>` : ""}
          ${s.tools ? `<p class="eyebrow sub-h reveal">${esc(ui.tools)}</p><div class="tools-grid">${s.tools.map(t => `<div class="tool card"><div class="shot">${t.icon ? `<img class="ticon" src="assets/logos/${t.icon}" alt="">` : ""}<img src="assets/img/${t.img}" alt="" loading="lazy"><span class="lock">${esc(ui.blur_note)}</span></div><div class="txt"><h4>${esc(t.name)}</h4><p>${esc(t.d)}</p>${t.bul ? `<ul class="plain tbul">${t.bul.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}${t.stack ? `<ul class="chips tstack">${t.stack.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}</div></div>`).join("")}</div>` : ""}
          ${s.small ? `<p class="eyebrow sub-h reveal">${esc(s.small_title)}</p><p class="small-sub reveal">${esc(s.small_sub)}</p><div class="smalls">${s.small.map(t => `<div class="small card"><div class="row"><b>${esc(t.n)}</b><span class="mono">${esc(t.t)}</span></div><p>${esc(t.d)}</p></div>`).join("")}</div>` : ""}
        </div>
      </article>`).join("");
    requestAnimationFrame(layoutCord); setTimeout(layoutCord, 600); addEventListener("load", layoutCord, { once: true });
    $("#wall").innerHTML = C().stops.map(s => `<img src="assets/logos/${s.logo}" alt="${esc(s.name)}" title="${esc(s.name)}">`).join("");
    const me = C().me;
    $$("[data-me]").forEach(el => el.textContent = me[el.dataset.me]);
    $("#dutyFacts").innerHTML = C().duty_facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("");
    $("#skills").innerHTML = me.skills.map(([k, v]) => `<div class="skill card"><b>${esc(k)}</b><p>${esc(v)}</p></div>`).join("");
    $("#edu").innerHTML = C().education.map(e => `
      <div class="edu-item card"><span class="lg"><img src="assets/logos/${e.logo}" alt="${esc(e.name)}"></span>
        <div><b>${esc(e.name)}</b><span class="eyebrow">${esc(e.years)} · ${esc(e.kicker)}</span><p>${esc(e.lead)}</p>
        ${e.internships ? `<div class="edu-interns">${e.internships.map(x => `<span class="ei" title="${esc(x.d)}"><img src="assets/logos/${x.logo}" alt=""><span><b>${esc(x.name)}</b> ${esc(x.role)} · ${esc(x.when)}</span></span>`).join("")}</div>` : ""}</div></div>`).join("");
    $("#langbars").innerHTML = me.langs.map(l => `<li><div class="row"><b>${esc(l[0])}</b><span>${esc(l[1])}</span></div><div class="bar"><i style="--w:${l[2]}%"></i></div></li>`).join("");
    $("#certs").innerHTML = me.certs.map(c => c.u ? `<li><a href="${esc(c.u)}" target="_blank" rel="noopener"><b>${esc(c.t)}</b><span class="eyebrow">${esc(c.o)} · ${esc(c.d)} ↗</span></a></li>` : `<li><b>${esc(c.t)}</b><span class="eyebrow">${esc(c.o)} · ${esc(c.d)}</span></li>`).join("");
    $("#interests").innerHTML = me.interests.map(c => `<li>${esc(c)}</li>`).join("");
    $("#langbars").classList.add("reveal"); $$(".fcol").forEach(f => f.classList.add("reveal"));
  }

  function render(first) {
    document.documentElement.lang = lang;
    $$("[data-ui]").forEach(el => { el.textContent = C().ui[el.dataset.ui] ?? ""; });
    $$("[data-ui-title]").forEach(el => { el.title = C().ui[el.dataset.uiTitle] ?? ""; });
    $$(".seg button").forEach(b => b.classList.toggle("on", b.dataset.lang === lang));
    renderStory(); if (window.BrainRender) BrainRender();
    $("#year").textContent = new Date().getFullYear();
    observe(); bindLightbox();
  }
  $$(".seg button").forEach(b => b.addEventListener("click", () => {
    if (b.dataset.lang === lang) return; lang = b.dataset.lang; localStorage.setItem("lang", lang);
    $("main").classList.add("switching"); setTimeout(() => { render(false); requestAnimationFrame(() => $("main").classList.remove("switching")); }, 200);
  }));
  
  
  $$(".dir a, .ctas a[href^='#']").forEach(l => l.addEventListener("click", e => { e.preventDefault(); smooth(l.getAttribute("href")); }));

  /* reveal + scroll */
  let io;
  function observe() {
    io && io.disconnect();
    io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add("in")), { threshold: .1 });
    $$(".interns, .press, .awards, .apps, .smalls, .tools-grid, .stats").forEach(g => [...g.children].forEach((c, i) => { c.classList.add("reveal"); c.style.setProperty("--rd", (i * .07) + "s"); }));
    $$(".section-head, .stopsec").forEach(el => { el.classList.add("reveal-watch"); io.observe(el); });
    $$(".reveal").forEach(el => io.observe(el));
  }
  const links = $$(".dir a");
  function onScroll() {
    const h = document.documentElement, max = h.scrollHeight - innerHeight;
    $("#progress").style.transform = `scaleX(${max ? h.scrollTop / max : 0})`;
    let cur = -1; $$(".stopsec").forEach((s, i) => { if (s.getBoundingClientRect().top < innerHeight * .5) cur = i; });
    const sec = ["#facts", "#contact"].find(id => $(id).getBoundingClientRect().top < innerHeight * .5) || (cur >= 4 ? "#work" : cur >= 0 ? "#story" : "");
    links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === sec));
  }
  addEventListener("scroll", onScroll, { passive: true });

  function bindLightbox() {
    /* proof thumbnails are handled by gallery.js (delegated click) */
  }
  const tick = () => { $("#clock").textContent = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }).format(new Date()) + " IST"; };
  tick(); setInterval(tick, 20000);

  document.body.classList.add("booting"); render(true); onScroll(); setTimeout(() => document.body.classList.remove("booting"), 350);
})();

// Proof viewer: any thumbnail (press, awards, App Store, tool screenshots, panel images) expands from where it sits into a
// centred hologram frame (FLIP), with caption, group navigation (← →), click-to-zoom with pan, Esc / backdrop to close.
(() => {
  const $ = (s, r = document) => r.querySelector(s), reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ui = () => (window.CONTENT && CONTENT[document.documentElement.lang === "tr" ? "tr" : "en"].ui) || {};
  let root = null, items = [], idx = 0, zoomed = false, origin = null;
  function build() {
    root = document.createElement("div"); root.className = "gal"; root.setAttribute("aria-hidden", "true");
    root.innerHTML = `<div class="gal-bg"></div><div class="gal-frame"><span class="gal-c tl"></span><span class="gal-c tr"></span><span class="gal-c bl"></span><span class="gal-c br"></span><img alt=""></div>
      <div class="gal-cap"><span class="eyebrow gal-k"></span><b class="gal-t"></b><span class="gal-n mono"></span></div>
      <button class="gal-btn gal-prev" aria-label="Previous">←</button><button class="gal-btn gal-next" aria-label="Next">→</button><button class="gal-btn gal-x" aria-label="Close">✕</button>`;
    document.body.appendChild(root);
    $(".gal-bg", root).onclick = close; $(".gal-x", root).onclick = close; $(".gal-prev", root).onclick = e => { e.stopPropagation(); step(-1); }; $(".gal-next", root).onclick = e => { e.stopPropagation(); step(1); };
    const fr = $(".gal-frame", root), img = $("img", fr);
    fr.onclick = e => { e.stopPropagation(); zoomed = !zoomed; fr.classList.toggle("zoom", zoomed); pan(e); };
    fr.onpointermove = e => zoomed && pan(e);
    function pan(e) { const r = fr.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height; img.style.transformOrigin = `${(x * 100).toFixed(1)}% ${(y * 100).toFixed(1)}%`; }
    addEventListener("keydown", e => { if (!root.classList.contains("on")) return; if (e.key === "Escape") close(); if (e.key === "ArrowRight") step(1); if (e.key === "ArrowLeft") step(-1); });
  }
  function collect(el) {
    // group = siblings in the same grid (press / awards / apps / tools / panel images); each item: thumb element, full src, kicker, title
    const grid = el.closest(".press, .awards, .apps, .tools-grid, .hd-imgs") || el.parentElement;
    const thumbs = [...grid.querySelectorAll(".fig, .tool .shot, img[data-full]")].filter(t => !(t.tagName === "IMG" && t.closest(".fig, .shot")));
    items = thumbs.map(t => { const im = t.tagName === "IMG" ? t : t.querySelector("img:not(.ticon)"); const cap = t.querySelector?.(".cap2"); const tool = t.closest?.(".tool");
      return { el: im, src: t.dataset.full || im.dataset.full || im.currentSrc || im.src, k: cap ? cap.querySelector("span")?.textContent : tool ? (ui().tools || "") : (ui().g_l3 || "Proof"), t: cap ? cap.querySelector("b")?.textContent : tool ? tool.querySelector("h4, h3")?.textContent || "" : (im.alt || ""), blur: !!tool }; });
    idx = Math.max(0, items.findIndex(i => i.el === (el.tagName === "IMG" ? el : el.querySelector("img:not(.ticon)"))));
  }
  function show(animate) {
    const it = items[idx], fr = $(".gal-frame", root), img = $("img", fr); zoomed = false; fr.classList.remove("zoom");
    $(".gal-k", root).textContent = it.k || ""; $(".gal-t", root).textContent = it.t || ""; $(".gal-n", root).textContent = items.length > 1 ? `${idx + 1} / ${items.length}` : "";
    root.classList.toggle("multi", items.length > 1); root.classList.toggle("blur", !!it.blur);
    img.onload = () => { fit(); if (animate && !reduced && origin) flip(origin); fr.classList.add("ready"); };
    img.src = it.src; if (img.complete && img.naturalWidth) img.onload();
    function fit() { const W = innerWidth, H = innerHeight, maxW = Math.min(W * .86, 1500), maxH = H * .80, ar = img.naturalWidth / img.naturalHeight; let w = maxW, h = w / ar; if (h > maxH) { h = maxH; w = h * ar; } fr.style.width = w + "px"; fr.style.height = h + "px"; }
    function flip(o) { const r = fr.getBoundingClientRect(), sx = o.width / r.width, sy = o.height / r.height, dx = (o.left + o.width / 2) - (r.left + r.width / 2), dy = (o.top + o.height / 2) - (r.top + r.height / 2);
      fr.style.transition = "none"; fr.style.transform = `translate(${dx}px,${dy}px) scale(${sx},${sy})`; fr.style.opacity = ".6"; fr.getBoundingClientRect(); fr.style.transition = ""; fr.style.transform = ""; fr.style.opacity = ""; }
  }
  function open(el) {
    if (!root) build(); collect(el); if (!items.length) return;
    const src = items[idx].el; origin = src.getBoundingClientRect(); src.classList.add("gal-src");
    root.classList.add("on"); root.setAttribute("aria-hidden", "false"); document.body.classList.add("gal-open"); show(true);
  }
  function step(d) { if (items.length < 2) return; items[idx].el.classList.remove("gal-src"); idx = (idx + d + items.length) % items.length; origin = null; $(".gal-frame", root).classList.remove("ready"); show(false); items[idx].el.classList.add("gal-src"); }
  function close() {
    if (!root || !root.classList.contains("on")) return; const fr = $(".gal-frame", root), it = items[idx];
    const o = it && it.el.getBoundingClientRect(), r = fr.getBoundingClientRect();
    if (o && !reduced && o.width > 0) { fr.style.transform = `translate(${(o.left + o.width / 2) - (r.left + r.width / 2)}px,${(o.top + o.height / 2) - (r.top + r.height / 2)}px) scale(${o.width / r.width},${o.height / r.height})`; fr.style.opacity = "0"; }
    root.classList.remove("on"); document.body.classList.remove("gal-open"); root.setAttribute("aria-hidden", "true");
    setTimeout(() => { fr.style.transform = ""; fr.style.opacity = ""; fr.classList.remove("ready", "zoom"); items.forEach(i => i.el.classList.remove("gal-src")); }, 420);
  }
  // delegate: any proof thumbnail opens the viewer
  document.addEventListener("click", e => { const t = e.target.closest(".fig, .tool .shot, .hd-imgs img"); if (!t || e.target.closest("a, button")) return; e.preventDefault(); e.stopPropagation(); open(t); }, true);
  window.Gallery = { open, close };
})();

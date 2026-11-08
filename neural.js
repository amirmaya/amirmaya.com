// Neural layer: a slow, sparse node graph behind the page. Toggle with body.neural (see app.js NEURAL flag).
(() => {
  if (!document.body.classList.contains("neural") || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cv = document.createElement("canvas"); cv.id = "neural"; document.body.prepend(cv);
  const ctx = cv.getContext("2d"); let W, H, dpr = Math.min(2, devicePixelRatio || 1), nodes = [], mx = -1e4, my = -1e4, t0 = performance.now();
  const ink = () => getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#121211";
  const acc = () => getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#FF4F1F";
  function size() { W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr; cv.style.width = innerWidth + "px"; cv.style.height = innerHeight + "px"; seed(); }
  function seed() { const n = Math.round((innerWidth * innerHeight) / 11000); nodes = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .12 * dpr, vy: (Math.random() - .5) * .12 * dpr, r: (1.4 + Math.random() * 2.2) * dpr, ph: Math.random() * 6.28 })); }
  addEventListener("resize", size); addEventListener("pointermove", e => { mx = e.clientX * dpr; my = e.clientY * dpr; }); addEventListener("pointerleave", () => { mx = my = -1e4; });
  size();
  function hubs() { return [...document.querySelectorAll(".stop .disc")].map(d => { const r = d.getBoundingClientRect(); return { x: (r.left + r.width / 2) * dpr, y: (r.top + r.height / 2) * dpr, r: r.width * dpr / 2 }; }).filter(h => h.y > -200 && h.y < H + 200); }
  function frame(now) {
    const t = (now - t0) / 1000, sy = 0;
    const hb = hubs();
    ctx.clearRect(0, 0, W, H); const col = ink(), a = acc();
    const link = 170 * dpr, L2 = link * link;
    for (const n of nodes) { n.x += n.vx; n.y += n.vy; if (n.x < 0 || n.x > W) n.vx *= -1; if (n.y < 0 || n.y > H) n.vy *= -1; }
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) { const p = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) { const q = nodes[j], dx = p.x - q.x, dy = p.y - q.y, d2 = dx * dx + dy * dy; if (d2 > L2) continue;
        const near = Math.min(1, Math.max(0, 1 - Math.hypot((p.x + q.x) / 2 - mx, (p.y + q.y) / 2 - (my + sy)) / (260 * dpr)));
        const al = (1 - d2 / L2) * (0.22 + near * 0.6);
        ctx.strokeStyle = near > .05 ? a : col; ctx.globalAlpha = al; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        if (near > .3 && ((i + j) % 7 === 0)) { const k = (t * .6 + p.ph) % 1; ctx.globalAlpha = near * .9; ctx.fillStyle = a; ctx.beginPath(); ctx.arc(p.x + (q.x - p.x) * k, p.y + (q.y - p.y) * k, 1.6 * dpr, 0, 6.28); ctx.fill(); }
      }
      const pulse = .5 + .5 * Math.sin(t * 1.3 + p.ph); const near = Math.max(0, 1 - Math.hypot(p.x - mx, p.y - (my + sy)) / (220 * dpr));
      ctx.globalAlpha = .45 + pulse * .35 + near * .3; ctx.fillStyle = near > .05 ? a : col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + near * .8), 0, 6.28); ctx.fill();
    }
    // hub links: nearby nodes attach to the logo discs, and discs link to each other
    ctx.lineWidth = 1.2;
    for (const h of hb) for (const p of nodes) { const d = Math.hypot(p.x - h.x, p.y - h.y); if (d < h.r + 150 * dpr && d > h.r) { ctx.globalAlpha = (1 - (d - h.r) / (150 * dpr)) * .45; ctx.strokeStyle = a; ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(p.x, p.y); ctx.stroke(); } }
    ctx.globalAlpha = 1; requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  // synapse: a dot travelling along the route path, repeating
  const path = document.getElementById("routePath"); if (!path) return;
  const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle"); dot.setAttribute("r", "4"); dot.setAttribute("fill", "var(--accent)"); dot.setAttribute("class", "synapse"); path.parentNode.appendChild(dot);
  const glow = dot.cloneNode(); glow.setAttribute("r", "10"); glow.setAttribute("opacity", ".18"); path.parentNode.appendChild(glow);
  (function run(ts) { const L = path.getTotalLength(); if (L > 0) { const k = ((ts / 6000) % 1), pt = path.getPointAtLength(k * L); for (const d of [dot, glow]) { d.setAttribute("cx", pt.x); d.setAttribute("cy", pt.y); } } requestAnimationFrame(run); })(0);
})();

// Spine: the brain stem continues below the hero as a vertebral column drawn in the same material as the brain
// (points, thin edges, one glowing cord). It sits on the brain's axis, each chapter's neuron is a vertebra on it,
// and a nerve root branches from the column to each chapter panel. A signal travels down the cord and lights the
// nerve root it passes. Sticky, viewport-sized canvas: cheap on memory, drawn only while the story is on screen.
(() => {
  const cv = document.getElementById("spine"), sec = document.getElementById("story"), list = document.getElementById("storyList");
  if (!cv || !sec || !list || !window.BrainInfo) return;
  const ctx = cv.getContext("2d"), dpr = Math.min(2, devicePixelRatio || 1), reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const C = "46,230,197";
  let W = 0, H = 0; const size = () => { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px"; }; size(); addEventListener("resize", size);
  const flash = new Map();                                                   // chapter id -> last time the signal passed (s)
  function frame(now) {
    requestAnimationFrame(frame); if (document.hidden) return;
    const t = now / 1000, sr = sec.getBoundingClientRect();
    if (innerWidth <= 980 || sr.bottom < 0 || sr.top > H) { if (cv.dataset.on) { ctx.clearRect(0, 0, cv.width, cv.height); cv.dataset.on = ""; } return; }
    const B = BrainInfo(); if (!B.resting) { ctx.clearRect(0, 0, cv.width, cv.height); return; }
    cv.dataset.on = "1"; const cr = cv.getBoundingClientRect(); ctx.setTransform(dpr, 0, 0, dpr, 0, -cr.top * dpr); ctx.clearRect(0, cr.top, W, H);   // draw in viewport coordinates wherever the sticky canvas sits
    const x0 = B.x, pitch = B.pitch, r0 = B.r, n = B.n, lr = list.getBoundingClientRect();
    const yTop = sr.top, yEnd = lr.bottom - 56;                              // viewport y where the column starts (hero edge) and tapers out
    if (yEnd <= yTop) return;
    // phase: continue the stem's ring sequence across the hero edge
    const last = B.rings.length ? B.rings[B.rings.length - 1] : yTop - pitch; let y = last + pitch; while (y < yTop - pitch) y += pitch; let k = B.rings.length;
    const rot = reduced ? 0 : t * .35, chapters = [...list.querySelectorAll(".stopsec")].map(a => { const d = a.querySelector(".biglogo").getBoundingClientRect(), m = a.querySelector(".main").getBoundingClientRect(); return { id: a.id, y: d.top + d.height / 2, dl: d.left, mr: m.right, in: a.classList.contains("in"), top: a.getBoundingClientRect().top }; });
    const sigY = reduced ? -1 : yTop + ((t * .11) % 1) * (yEnd - yTop);    // travelling signal (viewport y)
    const hide = (yy) => chapters.some(c => Math.abs(yy - c.y) < 46);        // the vertebra behind a chapter's neuron disc is the disc itself
    // --- column: alternating vertebra / disc rings, slight natural curve, tapering towards the end
    let prev = null;
    for (; y < yEnd; y += pitch, k++) {
      const taper = Math.min(1, (yEnd - y) / 260), w = (k % 2 ? 1 : .72) * taper, rr = r0 * w, ry = rr * .34;
      const cx = x0 + Math.sin((y - yTop) / 520) * 6 * taper;                 // gentle lordosis, 6px, returns to the axis
      const P = []; for (let i = 0; i < n; i++) { const a = i / n * 6.2832 + rot; P.push({ X: cx + Math.cos(a) * rr, Y: y + Math.sin(a) * ry, d: (Math.sin(a) + 1) / 2 }); }
      if (y > -40 && y < H + 40 && !hide(y)) {
        ctx.lineWidth = 1; ctx.beginPath(); P.forEach((q, i) => i ? ctx.lineTo(q.X, q.Y) : ctx.moveTo(q.X, q.Y)); ctx.closePath(); ctx.strokeStyle = `rgba(${C},${.2 * taper})`; ctx.stroke();
        if (prev && !hide(y - pitch)) { ctx.beginPath(); for (let i = 0; i < n; i += 2) { ctx.moveTo(prev[i].X, prev[i].Y); ctx.lineTo(P[i].X, P[i].Y); } ctx.strokeStyle = `rgba(${C},${.12 * taper})`; ctx.stroke(); }
        if (k % 2) { ctx.beginPath(); ctx.moveTo(cx - rr * 1.7, y); ctx.lineTo(cx - rr, y); ctx.moveTo(cx + rr, y); ctx.lineTo(cx + rr * 1.7, y); ctx.strokeStyle = `rgba(${C},${.18 * taper})`; ctx.stroke(); } // transverse processes
        P.forEach(q => { ctx.fillStyle = `rgba(${C},${(.3 + q.d * .55) * taper})`; ctx.beginPath(); ctx.arc(q.X, q.Y, (1 + q.d) * Math.sqrt(B.S / 300) * taper, 0, 6.283); ctx.fill(); });
      }
      prev = P;
    }
    // --- cord
    const g = ctx.createLinearGradient(0, yEnd - 220, 0, yEnd); g.addColorStop(0, `rgba(${C},.55)`); g.addColorStop(1, `rgba(${C},0)`);
    ctx.save(); ctx.strokeStyle = g; ctx.lineWidth = 1.5; ctx.shadowColor = `rgba(${C},.9)`; ctx.shadowBlur = 12; ctx.beginPath(); ctx.moveTo(x0, Math.max(-10, yTop)); ctx.lineTo(x0, Math.min(H + 10, yEnd)); ctx.stroke(); ctx.restore();
    // --- nerve roots: column -> chapter panel, brighter while the chapter is in view, flashing when the signal passes
    for (const c of chapters) {
      if (c.y < -80 || c.y > H + 80) continue;
      if (Math.abs(sigY - c.y) < 10) flash.set(c.id, t);
      const f = Math.max(0, 1 - (t - (flash.get(c.id) ?? -9)) / 1.6), a = (c.in ? .5 : .22) + f * .5;
      const x1 = c.dl - 2, x2 = c.mr + 2, ym = c.y;                          // from the disc's left edge to the panel's right edge
      for (const dy of [-5, 5]) { ctx.beginPath(); ctx.moveTo(x1, ym + dy * .3); ctx.bezierCurveTo(x1 - (x1 - x2) * .45, ym + dy * 1.6, x2 + (x1 - x2) * .3, ym + dy, x2, ym + dy * .6); ctx.strokeStyle = `rgba(${C},${a})`; ctx.lineWidth = 1; ctx.stroke(); }
      for (let i = 1; i <= 4; i++) { const u = i / 5, X = x1 + (x2 - x1) * u; ctx.fillStyle = `rgba(${C},${a})`; ctx.beginPath(); ctx.arc(X, ym + Math.sin(u * 3.14) * 1.5, 1.4 + f, 0, 6.283); ctx.fill(); }
      if (f > 0) { ctx.save(); ctx.shadowColor = `rgba(${C},1)`; ctx.shadowBlur = 18 * f; ctx.fillStyle = `rgba(220,255,247,${.9 * f})`; ctx.beginPath(); ctx.arc(x1 - (x1 - x2) * (1 - f), ym, 2.4, 0, 6.283); ctx.fill(); ctx.restore(); }
    }
    // --- signal on the cord
    if (sigY > -10 && sigY < H + 10) { ctx.save(); ctx.shadowColor = `rgba(${C},1)`; ctx.shadowBlur = 16; ctx.fillStyle = "rgba(220,255,247,.95)"; ctx.beginPath(); ctx.arc(x0, sigY, 2.6, 0, 6.283); ctx.fill(); const tr = ctx.createLinearGradient(0, sigY - 90, 0, sigY); tr.addColorStop(0, `rgba(${C},0)`); tr.addColorStop(1, `rgba(${C},.8)`); ctx.strokeStyle = tr; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, sigY - 90); ctx.lineTo(x0, sigY); ctx.stroke(); ctx.restore(); }
  }
  requestAnimationFrame(frame);
})();

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
    const rot = reduced ? 0 : t * .35, chapters = [...list.querySelectorAll(".stopsec")].map(a => { const d = a.querySelector(".biglogo").getBoundingClientRect(), m = a.querySelector(".main").getBoundingClientRect(); return { id: a.id, y: d.top + d.height / 2, dl: d.right, mr: m.left, in: a.classList.contains("in"), top: a.getBoundingClientRect().top }; });
    const sigY = reduced ? -1 : yTop + ((t * .09) % 1) * (yEnd - yTop);    // travelling signal (viewport y)
    const hide = (yy) => chapters.some(c => Math.abs(yy - c.y) < 46);        // the vertebra behind a chapter's neuron disc is the disc itself
    // --- halo along the column
    const hg = ctx.createLinearGradient(x0 - r0 * 3.2, 0, x0 + r0 * 3.2, 0); hg.addColorStop(0, `rgba(${C},0)`); hg.addColorStop(.5, `rgba(${C},.07)`); hg.addColorStop(1, `rgba(${C},0)`);
    ctx.fillStyle = hg; ctx.fillRect(x0 - r0 * 3.2, Math.max(-10, yTop), r0 * 6.4, Math.min(H + 10, yEnd) - Math.max(-10, yTop));
    // --- column: each vertebra = body (two rings, a short cylinder) + thinner disc; rings turn slowly, slight natural curve, taper at the end
    let prev = null; const sz = Math.sqrt(B.S / 300);
    for (; y < yEnd; y += pitch, k++) {
      const taper = Math.min(1, (yEnd - y) / 300), rr = r0 * taper;
      const cx = x0 + Math.sin((y - yTop) / 520) * 5 * taper;
      for (const [dy, ww, kind] of [[0, 1, "body"], [.42, 1, "body"], [.72, .6, "disc"]]) {
        const yy = y + dy * pitch, R = rr * ww, ry = R * .36, P = [];
        for (let i = 0; i < n; i++) { const a = i / n * 6.2832 + rot; P.push({ X: cx + Math.cos(a) * R, Y: yy + Math.sin(a) * ry, d: (Math.sin(a) + 1) / 2 }); }
        const vis = yy > -40 && yy < H + 40 && !hide(yy), fire = Math.max(0, 1 - Math.abs(sigY - yy) / 70);
        if (vis) {
          const al = (kind === "body" ? .24 : .16) * taper + fire * .5;
          ctx.lineWidth = 1; ctx.beginPath(); P.forEach((q, i) => i ? ctx.lineTo(q.X, q.Y) : ctx.moveTo(q.X, q.Y)); ctx.closePath(); ctx.strokeStyle = `rgba(${C},${al})`; ctx.stroke();
          if (prev && !hide(prev.y)) { const full = kind === "body" && prev.kind === "body" && prev.k === k; ctx.beginPath(); for (let i = 0; i < n; i += full ? 1 : 2) { ctx.moveTo(prev.P[i].X, prev.P[i].Y); ctx.lineTo(P[i].X, P[i].Y); } ctx.strokeStyle = `rgba(${C},${(full ? .2 : .1) * taper + fire * .3})`; ctx.stroke(); }
          P.forEach(q => { ctx.fillStyle = `rgba(${C},${Math.min(1, (.3 + q.d * .55) * taper + fire * .4)})`; ctx.beginPath(); ctx.arc(q.X, q.Y, (1 + q.d) * sz * (kind === "body" ? 1 : .8), 0, 6.283); ctx.fill(); });
          if (kind === "body" && dy > 0) { const ym = yy - .21 * pitch; ctx.beginPath(); ctx.moveTo(cx - R, ym); ctx.lineTo(cx - R * 1.9, ym); ctx.moveTo(cx + R, ym); ctx.lineTo(cx + R * 1.9, ym); ctx.strokeStyle = `rgba(${C},${.2 * taper + fire * .3})`; ctx.stroke();
            for (const ex of [cx - R * 1.9, cx + R * 1.9]) { ctx.fillStyle = `rgba(${C},${.6 * taper})`; ctx.beginPath(); ctx.arc(ex, ym, 1.3 * sz, 0, 6.283); ctx.fill(); } }
        }
        prev = { P, kind, k, y: yy };
      }
    }
    // --- cord
    const g = ctx.createLinearGradient(0, yEnd - 220, 0, yEnd); g.addColorStop(0, `rgba(${C},.55)`); g.addColorStop(1, `rgba(${C},0)`);
    ctx.save(); ctx.strokeStyle = g; ctx.lineWidth = 1.5; ctx.shadowColor = `rgba(${C},.9)`; ctx.shadowBlur = 12; ctx.beginPath(); ctx.moveTo(x0, Math.max(-10, yTop)); ctx.lineTo(x0, Math.min(H + 10, yEnd)); ctx.stroke(); ctx.restore();
    // --- nerve roots: column -> chapter panel, brighter while the chapter is in view, flashing when the signal passes
    for (const c of chapters) {
      if (c.y < -80 || c.y > H + 80) continue;
      if (Math.abs(sigY - c.y) < 10) flash.set(c.id, t);
      const f = Math.max(0, 1 - (t - (flash.get(c.id) ?? -9)) / 1.6), a = (c.in ? .5 : .22) + f * .5;
      const x1 = c.dl + 2, x2 = c.mr - 2, ym = c.y;                          // from the disc's right edge to the panel's left edge
      for (const dy of [-5, 5]) { ctx.beginPath(); ctx.moveTo(x1, ym + dy * .3); ctx.bezierCurveTo(x1 - (x1 - x2) * .45, ym + dy * 1.6, x2 + (x1 - x2) * .3, ym + dy, x2, ym + dy * .6); ctx.strokeStyle = `rgba(${C},${a})`; ctx.lineWidth = 1; ctx.stroke(); }
      for (let i = 1; i <= 4; i++) { const u = i / 5, X = x1 + (x2 - x1) * u; ctx.fillStyle = `rgba(${C},${a})`; ctx.beginPath(); ctx.arc(X, ym + Math.sin(u * 3.14) * 1.5, 1.4 + f, 0, 6.283); ctx.fill(); }
      if (f > 0) { ctx.save(); ctx.shadowColor = `rgba(${C},1)`; ctx.shadowBlur = 18 * f; ctx.fillStyle = `rgba(220,255,247,${.9 * f})`; ctx.beginPath(); ctx.arc(x1 - (x1 - x2) * (1 - f), ym, 2.4, 0, 6.283); ctx.fill(); ctx.restore(); }
    }
    // --- signal on the cord
    if (sigY > -10 && sigY < H + 10) { ctx.save(); ctx.shadowColor = `rgba(${C},1)`; ctx.shadowBlur = 16; ctx.fillStyle = "rgba(220,255,247,.95)"; ctx.beginPath(); ctx.arc(x0, sigY, 2.6, 0, 6.283); ctx.fill(); const tr = ctx.createLinearGradient(0, sigY - 90, 0, sigY); tr.addColorStop(0, `rgba(${C},0)`); tr.addColorStop(1, `rgba(${C},.8)`); ctx.strokeStyle = tr; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, sigY - 90); ctx.lineTo(x0, sigY); ctx.stroke(); ctx.restore(); }
  }
  requestAnimationFrame(frame);
})();

// Spinal column below the hero: the continuation of the brain stem, drawn with the brain's own point cloud, edges and
// projection (it even sways with the brain). Chapter neurons sit on it; a nerve strand branches to each chapter panel;
// the neural-link cord runs inside and carries a signal that fires the strands it passes.
(() => {
  const cv = document.getElementById("spine"), sec = document.getElementById("story"), list = document.getElementById("storyList");
  if (!cv || !sec || !list || !window.BrainInfo) return;
  const ctx = cv.getContext("2d"), dpr = Math.min(2, devicePixelRatio || 1), reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W = 0, H = 0; const size = () => { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px"; }; size(); addEventListener("resize", size);
  const flash = new Map();
  function frame(now) {
    requestAnimationFrame(frame); if (document.hidden) return;
    const t = now / 1000, sr = sec.getBoundingClientRect(), cr = cv.getBoundingClientRect();
    const off = () => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); };
    if (innerWidth <= 980 || sr.bottom < 0 || sr.top > H) { off(); return; }
    const B = BrainInfo(); if (!B.resting) { off(); return; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, -cr.top * dpr); ctx.clearRect(0, cr.top, W, H);
    const r = B.rect, S = B.S, lr = list.getBoundingClientRect();
    const toV = q => ({ X: q.X + r.left, Y: q.Y + r.top, z: q.z, f: q.f });                            // stage -> viewport
    const sOf = yv => (yv - r.top - B.cY) / S + B.STEM.top;                                             // page y -> arc length (yaw does not move y)
    const sEnd = sOf(lr.bottom - 70), s0 = Math.max(sOf(Math.max(sr.top, -30)), 0), s1 = Math.min(sOf(H + 30), sEnd);
    if (s1 <= s0) return;
    const pts = B.pts; let from = 0, to = pts.length; { let lo = 0, hi = pts.length; while (lo < hi) { const m = (lo + hi) >> 1; pts[m].s < s0 - .3 ? lo = m + 1 : hi = m; } from = lo; lo = from; hi = pts.length; while (lo < hi) { const m = (lo + hi) >> 1; pts[m].s < s1 + .3 ? lo = m + 1 : hi = m; } to = lo; }
    const taper = s => Math.max(0, Math.min(1, (sEnd - s) / 1.4));
    const P = []; for (let i = from; i < to; i++) { const p = pts[i], tp = taper(p.s); P.push(toV(B.proj(B.point(p, .15 + .85 * tp)))); }
    const sig = B.sigS(t);
    B.draw(ctx, P, pts, B.edges, from, to, i => (pts[i].s < s0 - .25 ? 0 : 1) * (.25 + .75 * taper(pts[i].s)), i => Math.max(0, 1 - Math.abs(pts[i].s - sig) / .14) * taper(pts[i].s));
    // cord: the neural link, fading out with the column
    ctx.save(); ctx.lineWidth = 1.6; ctx.shadowColor = "rgba(46,230,197,.8)"; ctx.shadowBlur = 10;
    const cs = Math.max(0, s0 - .2), ce = Math.min(sEnd, s1 + .2), a0 = B.axisAt(cs), q0 = toV(B.proj({ x: a0.x, y: B.STEM.top - cs, z: a0.z })), a1 = B.axisAt(ce), q1 = toV(B.proj({ x: a1.x, y: B.STEM.top - ce, z: a1.z }));
    const g = ctx.createLinearGradient(0, q0.Y, 0, q1.Y); g.addColorStop(0, "rgba(46,230,197,.5)"); g.addColorStop(Math.max(0, Math.min(1, (ce - cs - 1.2) / (ce - cs))), "rgba(46,230,197,.5)"); g.addColorStop(1, "rgba(46,230,197,0)"); ctx.strokeStyle = g;
    ctx.beginPath(); for (let ss = cs, first = true; ss <= ce; ss += .2) { const a = B.axisAt(ss), q = toV(B.proj({ x: a.x, y: B.STEM.top - ss, z: a.z })); first ? ctx.moveTo(q.X, q.Y) : ctx.lineTo(q.X, q.Y); first = false; } ctx.stroke(); ctx.restore();
    // nerve strands: from the column's surface at each chapter to the chapter panel
    for (const a of list.querySelectorAll(".stopsec")) {
      const d = a.querySelector(".biglogo").getBoundingClientRect(), m = a.querySelector(".main").getBoundingClientRect(), yc = d.top + d.height / 2; if (yc < -80 || yc > H + 80) continue;
      const sc = sOf(yc); if (Math.abs(sig - sc) < .12) flash.set(a.id, t);
      const f = Math.max(0, 1 - (t - (flash.get(a.id) ?? -9)) / 1.6), on = a.classList.contains("in"), base = on ? .9 : .5;
      const x1 = d.right + 2, x2 = m.left - 2, n = 9, pts2 = [];
      for (let i = 0; i <= n; i++) { const u = i / n, X = x1 + (x2 - x1) * u, Y = yc + Math.sin(u * 3.1416) * 7 - u * 2 + Math.sin(t * 1.3 + u * 6) * .8; pts2.push({ X, Y, z: Math.sin(u * 3.1416) * .4 - .2, f: 1 }); }
      for (let i = 1; i <= n; i++) { const p = pts2[i - 1], q = pts2[i], al = (.12 + .25 * (1 - i / n)) * base + f * .4; ctx.strokeStyle = `rgba(124,156,255,${al.toFixed(3)})`; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(p.X, p.Y); ctx.lineTo(q.X, q.Y); ctx.stroke(); }
      pts2.forEach((q, i) => { const al = (.35 + .4 * (1 - i / n)) * base + f * .5, rr = (.7 + (1 - i / n) * .9) * (1 + f * .8); ctx.fillStyle = `rgba(124,156,255,${(al * .2).toFixed(3)})`; ctx.beginPath(); ctx.arc(q.X, q.Y, rr * 3, 0, 6.283); ctx.fill(); ctx.fillStyle = `rgba(214,226,255,${al.toFixed(3)})`; ctx.beginPath(); ctx.arc(q.X, q.Y, rr, 0, 6.283); ctx.fill(); });
      if (f > 0) { const u = 1 - f, X = x1 + (x2 - x1) * u, Y = yc + Math.sin(u * 3.1416) * 7 - u * 2; ctx.save(); ctx.shadowColor = "rgba(46,230,197,1)"; ctx.shadowBlur = 18 * f; ctx.fillStyle = `rgba(220,255,247,${(.95 * f).toFixed(2)})`; ctx.beginPath(); ctx.arc(X, Y, 2.4, 0, 6.283); ctx.fill(); ctx.restore(); }
    }
    // the signal on the cord
    if (!reduced && sig > s0 && sig < Math.min(s1, sEnd)) { const a = B.axisAt(sig), q = toV(B.proj({ x: a.x, y: B.STEM.top - sig, z: a.z })); ctx.save(); ctx.shadowColor = "rgba(46,230,197,1)"; ctx.shadowBlur = 18; ctx.fillStyle = "rgba(220,255,247,.95)"; ctx.beginPath(); ctx.arc(q.X, q.Y, 2.6, 0, 6.283); ctx.fill(); ctx.restore(); }
  }
  requestAnimationFrame(frame);
})();

// Stimulus probe: a hot red light under the pointer, everywhere on the page. Neural clouds (brain, spine) react to it on
// their own canvases; this layer draws the light itself with a short fading trail. Screen-blended, so it glows on anything.
(() => {
  if (matchMedia("(pointer:coarse)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cv = document.createElement("canvas"); cv.className = "probe"; cv.setAttribute("aria-hidden", "true"); document.body.appendChild(cv);
  const ctx = cv.getContext("2d"), dpr = Math.min(2, devicePixelRatio || 1); let W = 0, H = 0, mx = -1e4, my = -1e4, seen = false;
  const size = () => { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; }; size(); addEventListener("resize", size);
  addEventListener("pointermove", e => { mx = e.clientX; my = e.clientY; seen = true; }, { passive: true });
  document.addEventListener("pointerleave", () => { mx = my = -1e4; }); addEventListener("blur", () => { mx = my = -1e4; });
  const trail = []; let x = -1e4, y = -1e4;
  function frame(now) {
    requestAnimationFrame(frame); if (document.hidden) return; const t = now / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); if (!seen || mx < -1e3) { x = y = -1e4; trail.length = 0; return; }
    x = x < -1e3 ? mx : x + (mx - x) * .45; y = y < -1e3 ? my : y + (my - y) * .45;           // slight lag: the light follows the hand
    trail.push([x, y]); if (trail.length > 10) trail.shift();
    trail.forEach(([tx, ty], i) => { const k = (i + 1) / trail.length; ctx.fillStyle = `rgba(255,70,60,${(.05 * k).toFixed(3)})`; ctx.beginPath(); ctx.arc(tx, ty, 26 * k, 0, 6.283); ctx.fill(); });
    const R = 95, g = ctx.createRadialGradient(x, y, 0, x, y, R); g.addColorStop(0, "rgba(255,80,70,.28)"); g.addColorStop(.45, "rgba(255,60,60,.09)"); g.addColorStop(1, "rgba(255,60,60,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, 6.283); ctx.fill();
    ctx.save(); ctx.shadowColor = "rgba(255,90,80,1)"; ctx.shadowBlur = 18 + 6 * Math.sin(t * 9); ctx.fillStyle = "rgba(255,230,225,.95)"; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 6.283); ctx.fill(); ctx.restore();
    ctx.strokeStyle = "rgba(255,110,100,.5)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 10 + 3 * Math.sin(t * 6), 0, 6.283); ctx.stroke();
  }
  requestAnimationFrame(frame);
})();

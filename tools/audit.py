"""Automated UI audit for amirmaya.com. Checks, per viewport and language:
console/page errors, horizontal overflow, text clipped (scrollWidth>clientWidth with overflow hidden / nowrap),
overlapping text leaves, broken images, offscreen interactive elements, tiny tap targets, low-contrast text.
Usage: python3 tools/audit.py [url] [--shots DIR]"""
import asyncio, sys, os, json
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1].startswith("http") else "http://127.0.0.1:8765/v3.html"
SHOTS = os.path.expanduser("~/Desktop/site-shots/_audit")
VIEWPORTS = [(1440, 790), (1280, 680), (1920, 1000), (390, 844)]
JS = r"""
() => {
  const issues = [];
  const vis = el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05; };
  const inDoc = el => { let e = el; while (e) { if (e.id === 'lightbox' || e.id === 'holo' || e.classList && e.classList.contains('tip')) return false; e = e.parentElement; } return true; };
  // horizontal overflow
  if (document.documentElement.scrollWidth > innerWidth + 1) issues.push({ t: 'overflow-x', d: `scrollWidth ${document.documentElement.scrollWidth} > ${innerWidth}` });
  // text clipped
  for (const el of document.querySelectorAll('h1,h2,h3,h4,p,b,span,a,button,li,dt,dd')) {
    if (!vis(el) || !inDoc(el)) continue; const cs = getComputedStyle(el);
    if ((cs.overflow === 'hidden' || cs.textOverflow === 'ellipsis') && el.scrollWidth > el.clientWidth + 2 && el.textContent.trim().length > 3 && !el.classList.contains('hc-t') && !el.closest('.holo-head'))
      issues.push({ t: 'text-clipped', d: `${el.tagName}.${[...el.classList].join('.')} "${el.textContent.trim().slice(0, 40)}" ${el.scrollWidth}>${el.clientWidth}` });
    if (cs.whiteSpace === 'nowrap' && el.scrollWidth > el.clientWidth + 2) issues.push({ t: 'nowrap-overflow', d: `${el.tagName}.${[...el.classList].join('.')} "${el.textContent.trim().slice(0, 40)}"` });
  }
  // broken images
  for (const im of document.querySelectorAll('img')) { if (im.complete && im.naturalWidth === 0 && vis(im)) issues.push({ t: 'broken-img', d: im.getAttribute('src') }); }
  // overlapping text leaves (same stacking context, both visible, both have own text)
  const leaves = [...document.querySelectorAll('h1,h2,h3,h4,p,b,span,a,button,li,dt,dd,figcaption')].filter(el => vis(el) && inDoc(el) && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && !el.closest('svg') && !el.closest('.neuron') );
  const rects = leaves.map(el => ({ el, r: el.getBoundingClientRect() }));
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const a = rects[i], b = rects[j]; if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
    const ox = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left), oy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
    if (ox > 6 && oy > 6) { const za = getComputedStyle(a.el).position, zb = getComputedStyle(b.el).position; if (a.el.closest('.fascia') && !b.el.closest('.fascia')) continue; if (b.el.closest('.fascia') && !a.el.closest('.fascia')) continue;
      issues.push({ t: 'overlap', d: `"${a.el.textContent.trim().slice(0, 30)}" × "${b.el.textContent.trim().slice(0, 30)}" (${Math.round(ox)}x${Math.round(oy)})` }); }
  }
  // offscreen / tiny targets
  for (const el of document.querySelectorAll('a,button')) { if (!vis(el) || !inDoc(el)) continue; const r = el.getBoundingClientRect(); if ((r.right < 0 || r.left > innerWidth) && !el.classList.contains('skip')) issues.push({ t: 'offscreen-x', d: `${el.tagName} "${el.textContent.trim().slice(0, 30)}" left=${Math.round(r.left)}` }); if ((r.width < 24 || r.height < 24) && !el.closest('.hl-dots')) issues.push({ t: 'tiny-target', d: `${el.tagName}.${[...el.classList].join('.')} ${Math.round(r.width)}x${Math.round(r.height)}` }); }
  // contrast (approx): text color vs nearest non-transparent bg
  const lum = c => { const m = c.match(/\d+(\.\d+)?/g); if (!m) return null; const [r, g, b, a] = m.map(Number); if (a === 0) return null; const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
  const bgOf = el => { let e = el; while (e) { const c = getComputedStyle(e).backgroundColor; if (c && !c.endsWith(', 0)') && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') return c; e = e.parentElement; } return 'rgb(7, 9, 15)'; };
  for (const el of leaves) { const cs = getComputedStyle(el); const L1 = lum(cs.color), L2 = lum(bgOf(el)); if (L1 == null || L2 == null) continue; const cr = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05); const size = parseFloat(cs.fontSize); const need = size >= 18 || (size >= 14 && +cs.fontWeight >= 700) ? 3 : 4.5; if (cr < need) issues.push({ t: 'contrast', d: `${el.tagName}.${[...el.classList].join('.')} "${el.textContent.trim().slice(0, 30)}" ${cr.toFixed(2)}:1 (${size}px)` }); }
  return issues;
}
"""
async def audit(pg, label):
    issues = await pg.evaluate(JS)
    agg = {}
    for i in issues: agg.setdefault(i["t"], []).append(i["d"])
    return agg
async def main():
    os.makedirs(SHOTS, exist_ok=True); report = {}
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, h in VIEWPORTS:
            for lang in ("en", "tr"):
                pg = await b.new_page(viewport={"width": w, "height": h}); errs = []
                await pg.route("**/amirmaya-stats.mayaamir96.workers.dev/**", lambda r: r.fulfill(status=200, headers={"access-control-allow-origin": "*", "content-type": "application/json"}, body='{"today":128,"online":3,"avg_visit":131}'))   # never spend the free KV write quota on audits
                pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)[:160])); pg.on("console", lambda m: errs.append("console: " + m.text[:160]) if m.type == "error" else None)
                await pg.add_init_script(f"localStorage.setItem('lang','{lang}')")
                await pg.goto(URL, wait_until="load"); await pg.wait_for_timeout(2500)
                key = f"{w}x{h}-{lang}"; found = {}
                # top
                found["top"] = await audit(pg, "top")
                if lang == "en": await pg.screenshot(path=f"{SHOTS}/{w}x{h}-top.png")
                # each section
                for sel in ["#story", "#hypemerch", "#amazon", "#facts", "#contact"]:
                    ok = await pg.evaluate(f"!!document.querySelector('{sel}')")
                    if not ok: found[sel] = {"missing": [sel]}; continue
                    await pg.evaluate(f"document.querySelector('{sel}').scrollIntoView()"); await pg.wait_for_timeout(900)
                    found[sel] = await audit(pg, sel)
                    if lang == "en": await pg.screenshot(path=f"{SHOTS}/{w}x{h}-{sel[1:]}.png")
                # focus mode
                await pg.evaluate("window.scrollTo(0,0)"); await pg.wait_for_timeout(500)
                if await pg.evaluate("!!document.querySelector('.neuron[data-i=\"4\"]')"):
                    await pg.evaluate("document.querySelector('.neuron[data-i=\"4\"]').click()"); await pg.wait_for_timeout(2400)
                    found["focus"] = await audit(pg, "focus")
                    if lang == "en": await pg.screenshot(path=f"{SHOTS}/{w}x{h}-focus.png")
                    await pg.keyboard.press("Escape"); await pg.wait_for_timeout(900)
                found["errors"] = errs
                report[key] = found; await pg.close()
        await b.close()
    # summary
    total = 0
    for key, found in report.items():
        for sec, agg in found.items():
            if sec == "errors":
                if agg: total += len(agg); print(f"[{key}] ERRORS: {agg[:3]}")
                continue
            for t, ds in agg.items():
                total += len(ds); print(f"[{key}] {sec} {t} ×{len(ds)}: " + " | ".join(ds[:3]))
    print(f"\nTOTAL ISSUES: {total}")
    json.dump(report, open(f"{SHOTS}/report.json", "w"), indent=1)
asyncio.run(main())

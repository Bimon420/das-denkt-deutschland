// Rendert die PNG-Aufträge aus aus/_jobs.json headless (kein Fenster). Aufruf durch bauen.py.
const path = require('path'); const fs = require('fs');
const { chromium } = require(path.join('C:/Users/Monster/desktop/claude-code/ki-pnp/node_modules', 'playwright'));
const EXE = 'C:/Users/Monster/AppData/Local/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe';
(async () => {
  const aus = process.argv[2];
  const jobs = JSON.parse(fs.readFileSync(path.join(aus, '_jobs.json'), 'utf8'));
  const b = await chromium.launch({ executablePath: EXE });
  for (const [datei, svg, w0, h, grund, rand] of jobs) {
    const quelle = fs.readFileSync(path.join(aus, svg), 'utf8');
    const url = 'data:image/svg+xml;base64,' + Buffer.from(quelle).toString('base64');
    const vb = quelle.match(/viewBox="([^"]+)"/)[1].trim().split(/\s+/).map(Number);
    const p = await b.newPage({ viewport: { width: 600, height: 600 }, deviceScaleFactor: 1 });
    const r = vb[2] / vb[3];
    const w = w0 || Math.round(h * r);
    const iw = w * (1 - 2 * rand), ih = h * (1 - 2 * rand);
    // einpassen, Seitenverhältnis halten, mittig
    const fw = Math.min(iw, ih * r), fh = fw / r;
    await p.setViewportSize({ width: w, height: h });
    await p.setContent(`<html><body style="margin:0;width:${w}px;height:${h}px;overflow:hidden;background:${grund || 'transparent'};display:flex;align-items:center;justify-content:center"><img src="${url}" style="width:${fw}px;height:${fh}px;display:block"></body></html>`);
    await p.waitForTimeout(150);
    await p.screenshot({ path: path.join(aus, datei), omitBackground: !grund, clip: { x: 0, y: 0, width: w, height: h } });
    await p.close();
  }
  await b.close();
})();

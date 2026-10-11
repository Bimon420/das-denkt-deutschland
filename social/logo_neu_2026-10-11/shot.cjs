const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ executablePath: process.argv[3] }); const p = await b.newPage({ viewport: { width: 1200, height: 520 }, deviceScaleFactor: 2 });
  await p.goto('file:///' + process.argv[2].replace(/\\/g,'/') + '/vorschau.html'); await p.waitForTimeout(400);
  const h = await p.evaluate(() => document.querySelector('.blatt').getBoundingClientRect().height);
  await p.setViewportSize({ width: 1200, height: Math.ceil(h) }); await p.screenshot({ path: process.argv[2] + '/vorschau.png' }); await b.close(); })();

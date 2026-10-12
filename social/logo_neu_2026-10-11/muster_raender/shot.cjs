const { chromium } = require('playwright');
const { pathToFileURL } = require('url');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.LOCALAPPDATA + '/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe' });
  const p = await b.newPage({ viewport: { width: 900, height: 340 }, deviceScaleFactor: 2 });
  await p.goto(pathToFileURL(__dirname + '/vergleich.html').href);
  await p.waitForTimeout(300);
  await p.screenshot({ path: __dirname + '/vergleich.png' });
  await b.close();
})();

// Prüfbogen aller Erzeugnisse auf hellem und dunklem Grund → aus/_pruefbogen.png
const path=require('path'),fs=require('fs');
const {chromium}=require('C:/Users/Monster/desktop/claude-code/ki-pnp/node_modules/playwright');
const A=path.join(__dirname,'aus');const d=f=>'data:'+(f.endsWith('svg')?'image/svg+xml':'image/png')+';base64,'+fs.readFileSync(path.join(A,f)).toString('base64');
const feld=(bg,fg,dk)=>`<div style="background:${bg};color:${fg};padding:20px;display:flex;flex-wrap:wrap;gap:22px;align-items:flex-end;font:12px sans-serif">
<img src="${d(dk?'logo-schriftzug-dunkel.svg':'logo-schriftzug.svg')}" style="height:110px"><img src="${d('logo-schriftzug.png')}" style="height:100px">
<img src="${d(dk?'logo-dunkel.svg':'logo.svg')}" style="height:120px"><img src="${d('logo.png')}" style="height:100px"><img src="${d('logo-dunkel.png')}" style="height:100px">
<img src="${d('icon-512.png')}" style="height:128px;border-radius:22%"><img src="${d('apple-touch-icon.png')}"><img src="${d('icon-192.png')}" style="height:96px">
<img src="${d('favicon-48.png')}"><img src="${d('favicon-32.png')}"><img src="${d('favicon-16.png')}"><img src="${d('favicon-16.png')}" style="height:64px;image-rendering:pixelated"></div>`;
(async()=>{const b=await chromium.launch({executablePath:'C:/Users/Monster/AppData/Local/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe'});
const p=await b.newPage({viewport:{width:1400,height:600}});await p.setContent(`<body style="margin:0">${feld('#fff','#111',0)}${feld('#111317','#eee',1)}${feld('#2b4a6b','#eee',1)}</body>`);await p.waitForTimeout(300);
await p.screenshot({path:path.join(A,'_pruefbogen.png'),fullPage:true});await b.close();})();

// DAS DENKT DEUTSCHLAND — Fehler-Melden-Weg (Simons Dauerregel 07.08.: jedes
// Projekt braucht eine Moeglichkeit, einen Fehler zu melden, gern mit Belohnung).
//
// Nimmt {text, pfad?} entgegen, legt die Meldung in der GETEILTEN, projekt-
// uebergreifenden Tabelle `bug_reports` der Supabase `monverse-talks` ab
// (site='das-denkt', message=text) — die FREMDE Lovable-Supabase der App bleibt
// unangetastet. Gibt eine ON-BRAND-BELOHNUNG zurueck.
//
// Doktrin von DAS DENKT DEUTSCHLAND: eine Plattform fuer Meinung, Buergervoting
// und Transparenz. Die Gegengabe ist darum KEIN Geld, kein Vorteil, sondern
// etwas Schoenes-ohne-Sinn im Ton des Hauses: eine seltene, gestempelte
// „Stimme des Volkes"-FEHLERSPAeHER-PLAKETTE mit fortlaufender Nummer
// (echt = DB-id) — eine Stimme, die wirklich gezaehlt wird.
//
// Kein Login noetig (niederschwellig). Rate-Limit best-effort ueber die im
// geteilten Projekt vorhandene generische Zaehl-RPC.

// ---- Belohnungs-Bausteine (im Ton der Buerger-/Meinungsplattform) ----
const DANK = [
  { de: "Ihre Meldung wurde zu Protokoll genommen. In einem Land, das gern aneinander vorbeiredet, ist ein genauer Hinweis eine seltene Stimme.",
    en: "Your report has been entered into the record. In a country fond of talking past one another, a precise notice is a rare voice." },
  { de: "Sie haben hingesehen, wo andere weiterscrollen. Das Denkt Deutschland vermerkt dies als das, was es ist: Bürgersinn.",
    en: "You looked where others keep scrolling. Das Denkt Deutschland notes this for what it is: civic spirit." },
  { de: "Ihr Befund gilt als begründet. Er wird geprüft, gewogen und — anders als so manche Wahlversprechen — nicht vergessen.",
    en: "Your finding is deemed justified. It will be examined, weighed, and — unlike many an election promise — not forgotten." },
  { de: "Ein Riss im Getriebe der Transparenz, den Sie meldeten, ist nun aktenkundig. Er bleibt vielleicht. Aber er steht im Protokoll.",
    en: "A crack in the machinery of transparency, which you reported, is now on record. It may remain. But it is in the minutes." },
  { de: "Eine Stimme zählt hier wirklich — Ihre eben. Kein Balken bewegt sich, und doch ist das Haus ein Stück ehrlicher geworden.",
    en: "One voice truly counts here — yours just now. No bar moves, and yet the house has grown a little more honest." },
  { de: "Was Sie meldeten, liegt jetzt im Bürgerarchiv, gleich neben den guten Vorsätzen der Demokratie. Danke fürs Hinsehen.",
    en: "What you reported now rests in the citizens' archive, right beside democracy's good intentions. Thank you for looking." },
  { de: "Zwischen linker, rechter und mittiger Meinung gibt es eine, die keine Partei kennt: die genaue. Sie haben sie gerade abgegeben.",
    en: "Between left, right and centre there is one opinion no party holds: the accurate one. You have just cast it." },
];

const AUSZEICHNUNG = [
  { de: "Fehlerspäher-Plakette »Stimme des Volkes«", en: "Fault-Scout Plaque »Voice of the People«" },
  { de: "Plakette des Wachsamen Bürgers",            en: "Plaque of the Vigilant Citizen" },
  { de: "Bürgergutachten für einen entdeckten Mangel", en: "Citizens' Report for a Discovered Defect" },
  { de: "Abzeichen »Ich sah es und schwieg nicht«",    en: "Badge »I Saw It and Did Not Stay Silent«" },
  { de: "Ehrennadel der Unabhängigen Beobachter",      en: "Honorary Pin of the Independent Observers" },
  { de: "Siegel der Genauen Stimme",                    en: "Seal of the Accurate Voice" },
  { de: "Verdienstkokarde für unbezahlte Sorgfalt",    en: "Merit Cockade for Unpaid Diligence" },
];

// deterministischer PRNG, damit dieselbe Marken-Nummer stets denselben Text traegt
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

function baueBelohnung(markeNr){
  const n = Number(markeNr) || 0;
  const r = mulberry32((n ^ 0x0DDD5701) >>> 0);
  const dank = DANK[Math.floor(r() * DANK.length)];
  const auszeichnung = AUSZEICHNUNG[Math.floor(r() * AUSZEICHNUNG.length)];
  const plaketten_nr = "DDD-" + new Date().getFullYear() + "-" + String(n).padStart(6, "0");
  return { marke: n, plaketten_nr, dank, auszeichnung };
}

// ---- Rate-Limit (best-effort; nutzt die im geteilten Projekt vorhandene generische RPC) ----
async function rateOk(req, limit){
  try{
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || '0';
    let h = 7; for(const c of ip + 'DDD!fehler') h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const key = 'ddd-fehler:' + h + ':' + new Date().toISOString().slice(0, 13);
    const r = await fetch(process.env.SB_URL + '/rest/v1/rpc/wf_rate_hit', {
      method: 'POST',
      headers: { 'content-type': 'application/json', apikey: process.env.SB_SERVICE_KEY, Authorization: 'Bearer ' + process.env.SB_SERVICE_KEY, 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify({ p_key: key })
    });
    const n = await r.json();
    return typeof n === 'number' ? n <= limit : true;
  }catch(e){ return true; }
}

export default async function handler(req, res){
  if(req.method !== 'POST'){ res.status(405).json({ ok:false }); return; }
  if(!process.env.SB_URL || !process.env.SB_SERVICE_KEY){ res.status(503).json({ ok:false, grund:'keine_db' }); return; }
  if(!await rateOk(req, 20)){ res.status(429).json({ ok:false, grund:'zu_oft' }); return; }
  try{
    const text = String((req.body && req.body.text) || '').trim().slice(0, 2000);
    if(text.length < 3){ res.status(400).json({ ok:false, grund:'zu_kurz' }); return; }
    const pfad = String((req.body && req.body.pfad) || '').slice(0, 300) || null;
    const ua = String(req.headers['user-agent'] || '').slice(0, 240);

    const r = await fetch(process.env.SB_URL + '/rest/v1/bug_reports', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        apikey: process.env.SB_SERVICE_KEY,
        Authorization: 'Bearer ' + process.env.SB_SERVICE_KEY,
        'User-Agent': 'Mozilla/5.0',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({ site:'das-denkt', message:text, page:pfad, user_agent:ua })
    });
    if(!r.ok){ res.status(500).json({ ok:false, grund:'abgelehnt' }); return; }
    const rows = await r.json();
    const marke = Array.isArray(rows) && rows[0] ? rows[0].id : 0;
    if(!marke){ res.status(500).json({ ok:false, grund:'keine_marke' }); return; }
    res.status(200).json({ ok:true, belohnung: baueBelohnung(marke) });
  }catch(e){
    res.status(500).json({ ok:false, grund:'fehler' });
  }
}

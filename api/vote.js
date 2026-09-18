// DAS DENKT DEUTSCHLAND — Abstimmen.
//
// WARUM ES DIESE DATEI GIBT (18.09.2026):
// Das Abstimmen lief über die Edge-Funktion `submit-vote`. Die lag im
// Supabase-Projekt, das bei der Zusammenlegung am 16.08. gelöscht wurde.
// Seitdem antwortet der Aufruf mit
//     {"code":"NOT_FOUND","message":"Requested function was not found"}
// und **niemand konnte mehr abstimmen** — auf der einzigen Seite des Hauses,
// die täglich Besucher hat (rund 15 Aufrufe/Tag, an 30 von 30 Tagen).
// Gemessen: die letzte Zeile in `topic_votes` stammt vom 15.08., während
// `page_views` ununterbrochen weiterläuft.
//
// WARUM NICHT DIREKT AUS DEM BROWSER:
// Gemessen mit dem öffentlichen Schlüssel — anon darf `topic_votes` LESEN
// (HTTP 200), aber nicht schreiben:
//     42501  new row violates row-level security policy
// Die alte Funktion umging RLS mit dem Dienstschlüssel. Ein reiner
// Frontend-Fix bräuchte also eine RLS-Änderung — und an Supabase soll nichts
// geändert werden.
//
// WARUM KEINE NEUE EDGE-FUNKTION:
// Diese Seite hat bereits eigene Serverfunktionen (`api/fehler.js`) und den
// Dienstschlüssel als `SB_SERVICE_KEY` in der Vercel-Umgebung. Es braucht also
// weder eine Supabase-Änderung noch ein Edge-Deployment — nur diese Datei.
//
// Die Prüfungen der alten Funktion bleiben erhalten (Thema muss existieren,
// Wert 0–100, Drossel je Absender). Die Drossel ist allerdings BESSER als
// vorher: die alte zählte im Arbeitsspeicher und war nach jedem Kaltstart
// leer. Diese zählt über `wf_rate_hit` in der Datenbank.

const GRENZE = 10; // Stimmen je Absender und Stunde, wie in der alten Funktion

function absender(req) {
  const f = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return f || String(req.headers['x-real-ip'] || '') || '0';
}

// Zählt in der Datenbank, überlebt also den Kaltstart. Bei JEDEM Fehler wird
// durchgelassen — eine klemmende Zählung darf das Abstimmen nicht abwürgen.
async function drosselOk(req) {
  try {
    let h = 7;
    for (const c of absender(req) + 'DDD!salz') h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const schluessel = h + ':vote:' + new Date().toISOString().slice(0, 13);
    const r = await fetch(process.env.SB_URL + '/rest/v1/rpc/wf_rate_hit', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        apikey: process.env.SB_SERVICE_KEY,
        Authorization: 'Bearer ' + process.env.SB_SERVICE_KEY,
        'Accept-Profile': 'app_monverse_talks',
        'Content-Profile': 'app_monverse_talks',
      },
      body: JSON.stringify({ p_key: schluessel }),
    });
    const n = await r.json();
    return typeof n === 'number' ? n <= GRENZE : true;
  } catch {
    return true;
  }
}

async function db(pfad, optionen = {}) {
  const r = await fetch(process.env.SB_URL + '/rest/v1/' + pfad, {
    ...optionen,
    headers: {
      'content-type': 'application/json',
      apikey: process.env.SB_SERVICE_KEY,
      Authorization: 'Bearer ' + process.env.SB_SERVICE_KEY,
      // Seit dem 16.08. liegen die Tabellen im Schema `app_ddd`, nicht in
      // `public`. Ohne diese beiden Zeilen sucht PostgREST am falschen Ort.
      'Accept-Profile': 'app_ddd',
      'Content-Profile': 'app_ddd',
      ...(optionen.headers || {}),
    },
  });
  return r;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }
  if (!process.env.SB_URL || !process.env.SB_SERVICE_KEY) {
    // Ehrlich melden statt stumm scheitern — genau daran lag es einen Monat.
    res.status(503).json({ error: 'Abstimmen ist gerade nicht möglich.' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { topic_id, value } = body;

    if (!topic_id || typeof topic_id !== 'string' || topic_id.length > 50) {
      res.status(400).json({ error: 'Ungültige Topic-ID' });
      return;
    }
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 100) {
      res.status(400).json({ error: 'Ungültiger Wert (0-100 erwartet)' });
      return;
    }

    if (!(await drosselOk(req))) {
      res.status(429).json({ error: 'Zu viele Abstimmungen. Bitte warte eine Stunde.' });
      return;
    }

    // Thema muss existieren — sonst sammeln sich Stimmen ins Leere.
    const pruef = await db('topics?select=id&id=eq.' + encodeURIComponent(topic_id));
    const themen = pruef.ok ? await pruef.json() : [];
    if (!Array.isArray(themen) || themen.length === 0) {
      res.status(404).json({ error: 'Thema nicht gefunden' });
      return;
    }

    const r = await db('topic_votes', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ topic_id, value }),
    });

    // Das Ergebnis wird GEPRÜFT. Die alte Kette hat genau hier geschwiegen.
    if (!r.ok) {
      const text = (await r.text()).slice(0, 200);
      console.error('[vote] Schreiben fehlgeschlagen: HTTP ' + r.status + ' ' + text);
      res.status(500).json({ error: 'Fehler beim Speichern' });
      return;
    }

    res.status(200).json({ success: true });
  } catch (e) {
    console.error('[vote] unerwartet:', e && e.message);
    res.status(500).json({ error: 'Interner Fehler' });
  }
}

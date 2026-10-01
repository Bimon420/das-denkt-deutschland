// Gemeinsame Netzhelfer für die Versand-Adapter.
// Fehlermeldungen werden gekürzt und von allem gereinigt, was wie ein Schlüssel aussieht —
// damit kein Token über eine API-Fehlermeldung ins Protokoll rutscht.
export function sauber(text) {
  return String(text)
    .replace(/(access_token|token|password|secret|key)=([^&\s"]+)/gi, "$1=***")
    .replace(/eyJ[A-Za-z0-9_\-.]{20,}/g, "***")
    .replace(/[A-Za-z0-9_\-]{40,}/g, "***")
    .slice(0, 500);
}

export async function abruf(url, opts = {}, wartezeitMs = 60000) {
  const ctrl = new AbortController();
  const uhr = setTimeout(() => ctrl.abort(), wartezeitMs);
  try {
    const r = await fetch(url, { ...opts, signal: ctrl.signal });
    const roh = await r.text();
    let daten = null;
    try { daten = roh ? JSON.parse(roh) : null; } catch { daten = null; }
    if (!r.ok) throw new Error(`HTTP ${r.status} ${new URL(url).pathname}: ${sauber(roh)}`);
    return daten ?? roh;
  } finally {
    clearTimeout(uhr);
  }
}

export const warte = (ms) => new Promise((r) => setTimeout(r, ms));

/** Einheitliche Antwort, wenn Zugangsdaten fehlen. */
export function uebersprungen(fehlend) {
  return { status: "übersprungen", grund: "Zugangsdaten fehlen: " + fehlend.join(", ") };
}

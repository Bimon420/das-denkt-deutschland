# Baut aus ddd_marke.svg (abgenommen 11.10.2026, weiße Ränder je Buchstabe seit 12.10.; Zeichen NICHT ohne Simon verändern) alle Logo-/Icon-Dateien.
#   python -X utf8 social/logo_neu_2026-10-11/bauen.py   → social/logo_neu_2026-10-11/aus/
# SVGs entstehen hier, PNGs rendert Chromium headless (render.cjs), die ICO packt dieses Skript.
import json, os, re, struct, subprocess, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

HIER = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.abspath(os.path.join(HIER, "..", ".."))
AUS = os.path.join(HIER, "aus")
os.makedirs(AUS, exist_ok=True)
MARKE = open(os.path.join(HIER, "ddd_marke.svg"), encoding="utf-8").read()

def schreib(name, text):
    with open(os.path.join(AUS, name), "w", encoding="utf-8", newline="\n") as f:
        f.write(text)

# 1) favicon.svg / logo.svg = das abgenommene Zeichen, unverändert
schreib("favicon.svg", MARKE)
schreib("logo.svg", MARKE)

# 2) Dunkle Fassung: gleiche Geometrie, aber die Fugen (Kontur 6) sind AUSGESCHNITTEN (Maske) statt weiß
#    gemalt — dort scheint der jeweilige dunkle Grund durch, egal welcher. Kein Aufkleber-Rand.
#    Die Innenräume bleiben deckend weiß: ohne sie verschwindet das schwarze D auf dunklem Grund
#    (geprüft 12.10. im Prüfbogen — ausgeschnittene Innenräume ergaben einen schwarzen Klumpen).
AUSSEN = "M0 0 H34 A44 56 0 0 1 34 112 H0 Z"
INNEN = "M22 24 H34 A24 32 0 0 1 34 88 H22 Z"
def d_dunkel(praefix=""):
    p = praefix
    return f"""<defs>
    <path id="{p}a" d="{AUSSEN}"/>
    <path id="{p}i" d="{INNEN}"/>
    <mask id="{p}mg" maskUnits="userSpaceOnUse" x="-10" y="-10" width="170" height="135">
      <rect x="-10" y="-10" width="170" height="135" fill="#fff"/>
      <use href="#{p}a" transform="translate(32 0)" fill="#000" stroke="#000" stroke-width="6"/>
      <use href="#{p}a" fill="#000" stroke="#000" stroke-width="6"/>
    </mask>
    <mask id="{p}mr" maskUnits="userSpaceOnUse" x="-10" y="-10" width="170" height="135">
      <rect x="-10" y="-10" width="170" height="135" fill="#fff"/>
      <use href="#{p}a" fill="#000" stroke="#000" stroke-width="6"/>
    </mask>
  </defs>
  <g mask="url(#{p}mg)"><g transform="translate(64 0)"><use href="#{p}a" fill="#FFCC00"/><use href="#{p}i" fill="#FFFFFF"/></g></g>
  <g mask="url(#{p}mr)"><g transform="translate(32 0)"><use href="#{p}a" fill="#DD0000"/><use href="#{p}i" fill="#FFFFFF"/></g></g>
  <g><use href="#{p}a" fill="#000000"/><use href="#{p}i" fill="#FFFFFF"/></g>"""
# Seit 12.10.2026 (weiße Ränder um jeden Buchstaben, Simon) ist der weiße Rand Teil des Zeichens — er hält
# auch das schwarze D auf dunklem Grund sichtbar. Die dunkle Fassung ist deshalb dasselbe Zeichen;
# d_dunkel() bleibt nur für bauen.vor_raender_1210.py-Vergleiche stehen.
schreib("logo-dunkel.svg", MARKE)

# 3) Schriftzug: Zeichen + „Das Denkt / Deutschland“ (Playfair Display Bold, OFL, liegt in public/fonts)
#    + kleines „DDD“ (Nunito Sans Bold) — Text als Pfade, keine Schrift nötig.
def text_pfad(fontdatei, text, x, y, groesse, sperrung=0.0):
    f = TTFont(fontdatei)
    gs, cmap, upm = f.getGlyphSet(), f.getBestCmap(), f["head"].unitsPerEm
    hmtx = f["hmtx"]
    s = groesse / upm
    pen = SVGPathPen(gs)
    cx = 0.0
    for ch in text:
        g = cmap[ord(ch)]
        gs[g].draw(TransformPen(pen, (s, 0, 0, -s, x + cx, y)))
        cx += hmtx[g][0] * s + sperrung * groesse
    return pen.getCommands(), cx - sperrung * groesse, f

PF = os.path.join(PROJ, "public", "fonts", "PlayfairDisplay-Bold.woff2")
NU = os.path.join(PROJ, "public", "fonts", "NunitoSans-Bold.woff2")
FS = 56            # Schriftgröße in Zeichen-Einheiten (Zeichen ist 112 hoch)
TX = 150 + 30      # Text beginnt rechts vom Zeichen
cap = TTFont(PF)["OS/2"].sCapHeight / TTFont(PF)["head"].unitsPerEm * FS
oben = -6
b1 = oben + cap
b2 = b1 + 60
p1, w1, _ = text_pfad(PF, "Das Denkt", TX, b1, FS)
p2, w2, _ = text_pfad(PF, "Deutschland", TX, b2, FS)
b3 = b2 + 40
p3, w3, _ = text_pfad(NU, "DDD", TX + 2, b3, 23, sperrung=0.18)
breite = TX + max(w1, w2, w3) + 6
unten = b3 + 8
def schriftzug(textfarbe, kleinfarbe, zeichen):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -8 {breite + 4:.1f} {unten + 8:.1f}" role="img" aria-label="DDD — Das Denkt Deutschland">
  <!-- Zeichen wie ddd_marke.svg; Schrift als Pfade: Playfair Display Bold + Nunito Sans Bold (beide OFL). -->
  {zeichen}
  <g fill="{textfarbe}"><path d="{p1}"/><path d="{p2}"/></g>
  <path fill="{kleinfarbe}" d="{p3}"/>
</svg>
"""
innen_hell = re.search(r"<defs>.*</svg>", MARKE, re.S).group(0).replace("</svg>", "").strip()
schreib("logo-schriftzug.svg", schriftzug("#111111", "#6e6e73", innen_hell))
schreib("logo-schriftzug-dunkel.svg", schriftzug("#F2F2F0", "#9a9aa0", innen_hell))

# 4) PNG-Aufträge für Chromium: [datei, svg, breite, höhe, grund|None, rand_anteil]
JOBS = [
    ["favicon-16.png", "favicon.svg", 16, 16, None, 0.0],
    ["favicon-32.png", "favicon.svg", 32, 32, None, 0.0],
    ["favicon-48.png", "favicon.svg", 48, 48, None, 0.0],
    ["apple-touch-icon.png", "favicon.svg", 180, 180, "#FFFFFF", 0.12],
    ["icon-192.png", "favicon.svg", 192, 192, "#FFFFFF", 0.12],
    ["icon-512.png", "favicon.svg", 512, 512, "#FFFFFF", 0.12],
    ["favicon.png", "favicon.svg", 512, 512, None, 0.0],   # ersetzt das alte 1024er favicon.png
    ["logo.png", "logo.svg", 257, 200, None, 0.0],
    ["logo-dunkel.png", "logo-dunkel.svg", 257, 200, None, 0.0],
    ["logo-schriftzug.png", "logo-schriftzug.svg", 0, 200, None, 0.0],
]
json.dump(JOBS, open(os.path.join(AUS, "_jobs.json"), "w"))
subprocess.run(["node", os.path.join(HIER, "render.cjs"), AUS], check=True)

# 5) favicon.ico aus den nativ gerenderten 16/32/48 (PNG-Einträge, Vista+ / alle Browser)
teile = [open(os.path.join(AUS, f"favicon-{n}.png"), "rb").read() for n in (16, 32, 48)]
kopf = struct.pack("<HHH", 0, 1, len(teile))
off = 6 + 16 * len(teile)
eintraege = b""
for n, t in zip((16, 32, 48), teile):
    eintraege += struct.pack("<BBBBHHII", n, n, 0, 0, 1, 32, len(t), off)
    off += len(t)
open(os.path.join(AUS, "favicon.ico"), "wb").write(kopf + eintraege + b"".join(teile))
print("fertig:", sorted(os.listdir(AUS)))

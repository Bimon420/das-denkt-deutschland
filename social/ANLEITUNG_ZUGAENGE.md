# DDD auf X, Bluesky, Facebook, Instagram, TikTok — was du anlegen musst

Stand: **01.10.2026**. Die Plattform-Angaben stammen aus der offiziellen Doku von diesem Tag.
Was ich nicht selbst auf der Herstellerseite gelesen habe, ist als **ungeprüft** markiert.

## So funktioniert es (kurz)

- `node social/pipeline.mjs` liest die Themen des Tages von dasdenktdeutschland.de.
  Für jedes Thema baut es fünf Texte, ein Bild (1080×1350) und ein Hochkant-Video (1080×1920, 18,5 s, ohne Musik).
  Die Themen verteilt es über **08:00–21:00**. Jede Plattform kommt ein paar Minuten versetzt dran:
  X +0, Bluesky +4, Facebook +9, Instagram +15, TikTok +22 Minuten.
- `node social/dauerauftrag.mjs` läuft stündlich. Es baut neu dazugekommene Themen und sendet, was fällig ist.
  Ohne `--echt` sendet es **nichts** (Trockenlauf).
- Ein Beitrag wird nie doppelt gesendet:
  - Was im Protokoll als gesendet steht, wird übersprungen.
  - Ein abgebrochener Versand gilt als „unklar“ und wird nicht wiederholt.
  - Eine Sperre verhindert zwei Läufe gleichzeitig.
- Ist ein Beitrag mehr als 3 Stunden über seiner Zeit, wird er als „verpasst“ vermerkt und nicht nachgeschoben.
  Sonst kämen nach einem Ausfall zehn Posts auf einmal.
- Themen, die nach 20:30 eintreffen, laufen am nächsten Tag als Nachzügler mit. So fällt kein Thema heraus.
- Fehlen für eine Plattform die Zugangsdaten, meldet sie „übersprungen: Zugangsdaten fehlen“. Die anderen laufen weiter.

**Was du tun musst:** `social/.env.social.BEISPIEL` als `social/.env.social` kopieren und die Zeilen unten ausfüllen.
Diese Datei wird nie committet.

---

## 1. Bluesky — am einfachsten, kostenlos

1. In der Bluesky-App ein neues Konto anlegen, z. B. `dasdenktdeutschland.bsky.social`.
   Später lässt sich die eigene Domain als Handle eintragen, dann heißt das Konto `@dasdenktdeutschland.de`.
2. Einstellungen → Privatsphäre und Sicherheit → **App-Passwörter** → neues App-Passwort anlegen
   (direkt: https://bsky.app/settings/app-passwords). *Menüpfad ungeprüft, Drittquellen.*
3. In `.env.social` eintragen:
   - `BLUESKY_HANDLE=` dein Handle
   - `BLUESKY_APP_PASSWORT=` das App-Passwort, **nicht** das Konto-Passwort

**Hürden:**
- Keine. Bilder dürfen bis 2 MB groß sein, unsere haben ~200 KB.
  Belegt: Lexikon `app.bsky.embed.images`, https://github.com/bluesky-social/atproto.
- Die Grenzen sind großzügig: 5.000 Schreibpunkte pro Stunde, ein Post kostet 3 Punkte.
  Belegt: https://bsky.network/docs/rate-limits/.
- Eine „Bot“-Kennzeichnung im Profil wird empfohlen, ist aber keine Pflicht. *Ungeprüft.*

**Kosten:** keine.

## 2. Facebook-Seite — kostenlos, etwas Klickerei

1. Eine Facebook-**Seite** „Das Denkt Deutschland“ anlegen (kein Profil). Du brauchst dafür dein privates Facebook-Konto als Verwalter.
2. Auf https://developers.facebook.com eine **App** anlegen, Typ „Business“.
3. Im Graph-API-Explorer ein Nutzer-Token mit diesen Rechten holen: `pages_manage_posts`, `pages_read_engagement`, `pages_show_list`.
   Dann daraus das **Seiten-Token** der DDD-Seite ziehen (`/me/accounts`).
4. Das Token **langlebig** machen, sonst läuft es nach Stunden ab.
   Der saubere Weg ist ein System-Nutzer im Business Manager mit Seiten-Token ohne Ablauf. *Ungeprüft im Detail.*
5. In `.env.social` eintragen:
   - `FB_PAGE_ID=` die Seiten-ID
   - `FB_PAGE_TOKEN=` das Seiten-Token

**Hürden:**
- Eine App-Prüfung durch Meta ist nicht nötig. Solange nur Leute mit einer Rolle in der App sie benutzen (du), reicht der „Standard Access“.
  Belegt: https://developers.facebook.com/docs/graph-api/overview/access-levels.
- Gepostet wird über Graph API v26.0 vom 29.07.2026. Belegt: Changelog.

**Kosten:** keine.

## 3. Instagram (Reels) — kostenlos, braucht einen Medienablageort

1. Ein Instagram-Konto „dasdenktdeutschland“ anlegen und auf **Profi-Konto** umstellen (Business oder Creator).
2. Zwei Wege, Rechte belegt: https://developers.facebook.com/docs/instagram-platform:
   - **Mit Facebook-Login:** Instagram mit der DDD-Facebook-Seite verknüpfen, dieselbe Meta-App nutzen.
     Rechte: `instagram_basic`, `instagram_content_publish`, `pages_read_engagement`.
     In `.env.social`: `IG_API_HOST=graph.facebook.com` (Standard).
   - **Mit Instagram-Login:** Hier ist keine Facebook-Seite nötig.
     Rechte: `instagram_business_basic`, `instagram_business_content_publish`.
     In `.env.social`: `IG_API_HOST=graph.instagram.com`.
3. In `.env.social` eintragen:
   - `IG_USER_ID=` die Instagram-Konto-ID
   - `IG_TOKEN=` ein langlebiges Token
4. **Medienablage:** Instagram holt das Video selbst von einer öffentlichen Adresse ab.
   - In Supabase (Projekt `kkqxqnhwaallpliqkypl`) unter Storage einen **öffentlichen** Eimer anlegen, z. B. `ddd-social`.
   - In `.env.social` eintragen: `DDD_MEDIEN_EIMER=ddd-social`.
   - Dazu `SUPABASE_SERVICE_ROLE_KEY=`. Das ist der Service-Schlüssel, er ist geheim und steht in den Supabase-Einstellungen unter API.

**Hürden:**
- Höchstens 100 Posts pro 24 h. Wir brauchen höchstens 10.
- Bilder müssen JPEG sein. Unsere sind JPEG.
- Reels: MP4/H.264, 23–60 fps, 3 s bis 15 min, bis 300 MB. Unsere: H.264, 30 fps, 18,5 s, ~1,7 MB, mit stummer AAC-Tonspur.
- Alle drei Punkte belegt: Content-Publishing-Doku.

**Kosten:** keine. Der Speicher in Supabase fällt bei ~2 MB pro Tag nicht ins Gewicht.

## 4. TikTok — kostenlos, aber ohne Prüfung nur PRIVAT

1. Ein TikTok-Konto „dasdenktdeutschland“ anlegen.
2. Auf https://developers.tiktok.com eine App anlegen.
   Dort „Login Kit“ und „Content Posting API“ mit **Direct Post** und dem Recht `video.publish` hinzufügen.
3. Das DDD-Konto einmal über die App autorisieren. Dabei bekommst du einen Refresh-Token, der ~1 Jahr hält. *Laufzeit ungeprüft.*
4. In `.env.social` eintragen:
   - `TIKTOK_CLIENT_KEY=`
   - `TIKTOK_CLIENT_SECRET=`
   - `TIKTOK_REFRESH_TOKEN=`
   - Das Skript erneuert den Zugriffstoken selbst und legt ihn in `social/.tiktok_token.json` ab (nie committet).

**Hürden** (belegt: https://developers.tiktok.com/doc/content-posting-api-get-started):
- **Ohne Audit durch TikTok gehen Posts nur als „Nur ich“ (SELF_ONLY)**, und das Konto muss privat sein.
  Deshalb ist SELF_ONLY hier voreingestellt.
- Für öffentliche Posts muss TikTok die App prüfen (Audit).
  Für dieses Audit verlangt TikTok eine Oberfläche, in der ein Mensch vor jedem Upload eine Vorschau sieht, die Sichtbarkeit wählt und zustimmt.
  Belegt: https://developers.tiktok.com/doc/content-sharing-guidelines.
  **Ein vollautomatisches öffentliches Posten passt dazu kaum.** Das ist meine Schlussfolgerung, kein Zitat.
- Laut Doku sind es typischerweise etwa 15 Posts pro Tag und Konto.

**Ehrlicher Ausweg:**
- TikTok zuerst privat laufen lassen und die Videos von Hand in der App freigeben.
- Oder die fertigen MP4s aus `social/ausgabe/<datum>/` von Hand hochladen.

**Kosten:** keine.

## 5. X — kostet Geld pro Post

1. Ein X-Konto „DasDenktDeutschland“ anlegen.
2. In der **X Developer Console** ein Projekt und eine App anlegen, Rechte „Read and write“.
   Die Adresse console.x.com ist *ungeprüft*.
3. **Guthaben kaufen.** Einen Gratis-Tarif gibt es nicht mehr, X rechnet pro Aufruf ab.
4. Unter „Keys and tokens“ die vier Werte erzeugen und in `.env.social` eintragen:
   - `X_API_KEY=`, `X_API_SECRET=` (API Key und Secret)
   - `X_ACCESS_TOKEN=`, `X_ACCESS_SECRET=` (Access Token und Secret)
5. Im X-Konto unter Einstellungen → Dein Konto → **Automatisierung** das Konto als automatisiert kennzeichnen.
   Laut X-Richtlinien ist das Pflicht. *Nur über Suchtreffer belegt.*

**Kosten** (belegt: https://docs.x.com/x-api/getting-started/pricing, „prices are subject to change“):
- Ein Post kostet **0,015 $**, ein Post **mit Link 0,20 $**.
- **Simons Entscheidung 01.10.:** X bekommt nur Bild + Text, KEINEN Link und auch keine Adresse im Text
  (X verlinkt „dasdenktdeutschland.de" selbst → 0,20 $). Das Bild zeigt Thema, Positionen und Adresse.
  Die Textprüfung sperrt einen X-Text mit Link oder Adresse. Bei 3–10 Themen am Tag: **~1,50–4,50 $ im Monat**.
- Gilt genauso für die anderen Plattformen: nirgends ein Link, nur Bild/Video + Text.
- Ob der Bild-Upload extra kostet, ist *ungeprüft*.
- `X_OHNE_BILD=ja` schaltet das Bild ab.

**Hürden:**
- Die Upload-Abfolge (v2 media upload: initialize/append/finalize) ist nach der Doku gebaut, aber mangels Konto noch nie gegen X gelaufen.
  Beim ersten echten Lauf den Versand beobachten.

---

## Erster echter Versuch (Vorschlag)

Mit Bluesky anfangen: kostenlos, kein Prüfverfahren.

```
node social/dauerauftrag.mjs --echt --nur bluesky
```

Danach das Ergebnis im Protokoll `social/ausgabe/<datum>/protokoll.jsonl` und auf dem Profil ansehen.
Erst dann die nächste Plattform dazunehmen.

## Stündlich einplanen — unsichtbar, ohne aufpoppendes Fenster

**Noch nicht eingerichtet.** Das entscheidest du, wenn die Zugangsdaten stehen.

Der Starter `werkstatt\unsichtbar.vbs` startet ohne Konsolenfenster und reicht den Exitcode an die Aufgabenplanung durch.
Einrichten mit einer Zeile, in PowerShell oder cmd:

```
schtasks /Create /TN "DDD Social Dauerauftrag" /SC HOURLY /ST 07:05 /F /TR "wscript.exe //B C:\Users\Monster\desktop\claude-code\werkstatt\unsichtbar.vbs \"C:\Program Files\nodejs\node.exe\" C:\Users\Monster\desktop\claude-code\das-denkt-deutschland\social\dauerauftrag.mjs --echt"
```

- Läuft stündlich um :05. Posts mit einer Zeit bis :05 gehen sofort raus, spätere in der nächsten Stunde.
  Ein Post kommt also höchstens ~1 Stunde nach seiner Planzeit.
- Für kürzeren Abstand `/SC MINUTE /MO 15` nehmen. Doppelposts verhindert das Protokoll.
- **Abschalten:** `schtasks /Change /TN "DDD Social Dauerauftrag" /DISABLE`
- **Zuerst trocken laufen lassen:** dieselbe Zeile ohne `--echt`.
- **Grafikkarte:** wird nicht gebraucht. Chromium läuft unsichtbar (headless), ffmpeg ohne Fenster.
- **Dauer:** ~30 s Bauzeit je Thema, sonst wenige Sekunden.

## Was die Pipeline selbst prüft, bevor etwas in den Plan kommt

- **Länge:** X ≤ 280 (Adressen zählen 23), Bluesky ≤ 300 Grapheme. Außerdem muss der Abstimm-Link drinstehen.
- **Zitate:** Alles in Anführungszeichen muss wörtlich im Thema stehen. Sonst wird die Claude-Fassung verworfen und die Vorlage genommen.
- **Überlauf:** Läuft ein Textkasten im Bild oder Video über, wird das Thema gesperrt und nicht gepostet.
- Die Texte schreibt Claude (`claude-sonnet-5`). Fällt ein Feld zweimal durch, kommt es aus einer festen Vorlage, die nur Themen-Text verwendet.

Diese Prüfungen habe ich mit absichtlich falschen Eingaben gegengeprüft:
- Ein erfundenes Zitat wurde erkannt, ein echtes durchgelassen.
- Ein zu langer X-Text wurde erkannt.
- Ein überlaufender Bildtext wurde erkannt.

export const topics = [
  {
    topic: "Migration & Integration",
    tagType: "gegensaetzlich" as const,
    leftView: {
      position: "Offene Grenzen und bedingungsloses Aufnahmerecht für alle Schutzsuchenden.",
      quote: "Kein Mensch ist illegal. Grenzen sind ein Konstrukt der Unterdrückung.",
      speaker: "Aktivistennetzwerk "Seebrücke"",
      hiddenMeaning: "Klingt humanitär, ignoriert aber Kapazitätsgrenzen von Kommunen, Wohnungsmarkt und Bildungssystem. Kann als Instrument dienen, Kritik als 'rechts' zu framen.",
      negativeEffects: "Überlastung der Kommunen, wachsender Unmut in der Bevölkerung, politische Polarisierung statt Lösungen.",
      sources: [
        { type: "article" as const, label: "Seebrücke Positionspapier", url: "https://seebruecke.org" },
        { type: "video" as const, label: "ARD Doku", url: "https://www.ardmediathek.de" },
      ],
    },
    rightView: {
      position: "Sofortige Grenzschließung und Abschiebung aller abgelehnten Asylbewerber.",
      quote: "Unser Land zuerst. Wer nicht integriert ist, muss gehen.",
      speaker: "AfD-Parteitag 2024",
      hiddenMeaning: "Vereinfacht ein komplexes Problem zu einer Freund-Feind-Logik. Bedient Ängste, ohne Lösungen für bereits hier lebende Menschen anzubieten.",
      negativeEffects: "Menschenrechtsverletzungen, Isolation Deutschlands, Verlust von Fachkräften, gespaltene Gesellschaft.",
      sources: [
        { type: "document" as const, label: "AfD Grundsatzprogramm", url: "https://www.afd.de/grundsatzprogramm" },
        { type: "article" as const, label: "SPIEGEL Analyse", url: "https://www.spiegel.de" },
      ],
    },
    mitteView:
      "Humanität braucht Ordnung. Funktionierende Integration erfordert klare Regeln UND echte Chancen. Die meisten Deutschen wollen weder offene Grenzen noch geschlossene Herzen — sondern pragmatische Lösungen, die Menschenwürde achten und Gemeinschaft stärken.",
  },
  {
    topic: "Klimapolitik & Wirtschaft",
    tagType: "teilweise" as const,
    leftView: {
      position: "Sofortiger Kohleausstieg, Verbot von Inlandsflügen, Enteignung fossiler Konzerne.",
      quote: "System Change, not Climate Change! Der Kapitalismus zerstört unsere Zukunft.",
      speaker: "Fridays for Future Deutschland",
      hiddenMeaning: "Die Dringlichkeit ist real, aber radikale Sofortmaßnahmen ohne Übergangsplan gefährden Arbeitsplätze in strukturschwachen Regionen und treffen Geringverdiener am härtesten.",
      negativeEffects: "Deindustrialisierung, Arbeitsplatzverluste im Osten, steigende Energiepreise für einkommensschwache Haushalte.",
      sources: [
        { type: "article" as const, label: "FFF Forderungen", url: "https://fridaysforfuture.de" },
        { type: "video" as const, label: "ZDF Doku: Kohleausstieg", url: "https://www.zdf.de" },
      ],
    },
    rightView: {
      position: "Klimawandel überbewertet. Wirtschaft und Wohlstand haben Vorrang vor Klimazielen.",
      quote: "Ideologischer Klimawahn zerstört den Industriestandort Deutschland.",
      speaker: "Wirtschaftsvereinigung konservativ",
      hiddenMeaning: "Schützt kurzfristige Profitinteressen und ignoriert wissenschaftlichen Konsens. Verlagert die Kosten des Klimawandels auf zukünftige Generationen.",
      negativeEffects: "Langfristige Klimaschäden kosten ein Vielfaches der Transformationskosten. Deutschland verliert Innovationsvorsprung bei erneuerbaren Energien.",
      sources: [
        { type: "document" as const, label: "Studie: Kosten Klimawandel", url: "https://www.diw.de" },
        { type: "article" as const, label: "Handelsblatt", url: "https://www.handelsblatt.com" },
      ],
    },
    mitteView:
      "Klimaschutz ist kein Luxus, sondern Überlebensfrage — aber die Transformation muss sozial gerecht sein. Technologieoffenheit, faire Übergänge für betroffene Regionen und realistische Zeitpläne sind keine Schwäche, sondern Klugheit.",
  },
  {
    topic: "Meinungsfreiheit & Cancel Culture",
    tagType: "gleich" as const,
    leftView: {
      position: "Bestimmte Meinungen müssen zum Schutz von Minderheiten eingeschränkt werden.",
      quote: "Hassrede ist keine Meinung. Wer verletzt, verwirkt sein Rederecht.",
      speaker: "Netzaktivisten",
      hiddenMeaning: "Beginnt mit dem Schutz Verwundbarer, kann aber zur Zensur abweichender Meinungen mutieren. Wer definiert, was 'Hass' ist?",
      negativeEffects: "Selbstzensur, eingeschränkter gesellschaftlicher Diskurs, Misstrauen gegenüber Institutionen.",
      sources: [
        { type: "article" as const, label: "Amadeu Antonio Stiftung", url: "https://www.amadeu-antonio-stiftung.de" },
        { type: "quote" as const, label: "Bundestag-Debatte", url: "https://www.bundestag.de" },
      ],
    },
    rightView: {
      position: "Man darf nichts mehr sagen! Die Medien unterdrücken konservative Stimmen.",
      quote: "In diesem Land herrscht eine Meinungsdiktatur der linken Eliten.",
      speaker: "Konservative Kommentatoren",
      hiddenMeaning: "Instrumentalisiert berechtigte Sorgen über Diskursverengung, um auch diskriminierende Aussagen als 'unterdrückte Wahrheit' zu legitimieren.",
      negativeEffects: "Normalisierung von Extrempositionen, Unterminierung von Medienvertrauen, Opferinszenierung statt sachlicher Debatte.",
      sources: [
        { type: "video" as const, label: "WELT Debatte", url: "https://www.welt.de" },
        { type: "article" as const, label: "NZZ Gastbeitrag", url: "https://www.nzz.ch" },
      ],
    },
    mitteView:
      "Beide Seiten wollen die Meinungsfreiheit — aber nur für sich. Echte Meinungsfreiheit bedeutet, auch Unbequemes auszuhalten, ohne zu verstummen oder zu diffamieren. Zuhören ist kein Zeichen von Schwäche.",
  },
];

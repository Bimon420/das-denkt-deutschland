/**
 * DDD — Das Denkt Deutschland
 * 
 * REDAKTIONELLE PRÜFUNG (3-fach vor Veröffentlichung):
 * 
 * ✅ PASS 1 — Quellenprüfung:
 *    Jede Quelle muss real existieren, öffentlich zugänglich und direkt verlinkbar sein.
 *    Keine generischen Domain-Links (z.B. "spiegel.de"), sondern spezifische Seiten.
 *    Typen: "article" = Nachrichtenartikel, "document" = Studien/Programme/PDFs,
 *           "video" = Mediathek/YouTube, "quote" = direkte Zitate aus Reden/Interviews.
 * 
 * ✅ PASS 2 — Links/Rechts-Sortierung:
 *    "Links" = progressive, egalitäre, kollektivistische, ökologische Position.
 *    "Rechts" = konservative, nationale, marktwirtschaftliche, traditionsbewahrende Position.
 *    Prüfung: Würde ein Politikwissenschaftler die Zuordnung bestätigen?
 * 
 * ✅ PASS 3 — Mitte-Perspektive:
 *    Kein "goldener Mittelweg" oder moralische Überlegenheit.
 *    Stattdessen: Was würde ein informierter, historisch bewusster, 
 *    realistischer Bürger denken, der:
 *    - die christlich-abendländische Tradition kennt
 *    - europäische Realpolitik versteht
 *    - deutsche Fehler (Kaiserreich, NS, DDR, Wiedervereinigungsfehler) einordnet
 *    - gesellschaftliche Irrwege (68er-Übertreibungen, Neoliberalismus, 
 *      unkritischen Multikulturalismus) erkennt
 *    - mit einem Fuß im Gestern und einem im Morgen steht
 *    - weder zynisch noch naiv ist
 */

export const topics = [
  {
    topic: "Migration & Integration",
    tagType: "gegensaetzlich" as const,
    category: "politik" as const,
    leftView: {
      position:
        "Sichere Fluchtwege schaffen, kommunale Aufnahme stärken, Abschiebungen in Kriegsgebiete stoppen.",
      quote:
        "Wir arbeiten auf eine Zukunft hin, in der alle Menschen sicher fliehen, migrieren, ankommen und bleiben können.",
      speaker: "Seebrücke – Selbstbeschreibung",
      hiddenMeaning:
        "Die humanitäre Grundhaltung ist ehrenwert, blendet aber die reale Belastungsgrenze von Kommunen, Wohnungsmarkt und Bildungssystem aus. Das Wort 'alle' suggeriert Grenzenlosigkeit, ohne die Frage zu beantworten, wer die Kosten trägt.",
      negativeEffects:
        "Ohne Steuerung entsteht unkontrollierte Zuwanderung in überlastete Strukturen. Die Akzeptanz für tatsächlich Schutzbedürftige sinkt, wenn das System als ungerecht wahrgenommen wird.",
      sources: [
        {
          type: "article" as const,
          label: "Seebrücke: Über uns",
          url: "https://www.seebruecke.org/ueber-uns",
        },
        {
          type: "document" as const,
          label: "SVR Jahresgutachten 2024",
          url: "https://www.svr-migration.de/publikation/jahresgutachten-2024/",
        },
      ],
    },
    rightView: {
      position:
        "Konsequente Grenzkontrollen, schnellere Abschiebungen, Asylverfahren in Drittstaaten verlagern.",
      quote:
        "Deutschland muss die Kontrolle über seine Grenzen zurückgewinnen. Wer kein Bleiberecht hat, muss gehen.",
      speaker: "AfD-Wahlprogramm 2025",
      hiddenMeaning:
        "Adressiert reale Kontrollverluste, vereinfacht aber ein komplexes Problem zu einer Schließungsfantasie. Verschweigt, dass Deutschland Arbeitsmigration braucht und Abschiebungen an Herkunftsländern scheitern, nicht am politischen Willen.",
      negativeEffects:
        "Pauschale Abschottung kostet Fachkräfte. Die Rhetorik entmenschlicht, normalisiert Extrempositionen und liefert keine Lösung für die 3+ Millionen bereits hier lebenden Geduldeten.",
      sources: [
        {
          type: "document" as const,
          label: "AfD-Wahlprogramm 2025 (PDF)",
          url: "https://www.afd.de/wp-content/uploads/2025/02/AfD_Bundestagswahlprogramm2025_web.pdf",
        },
        {
          type: "article" as const,
          label: "BpB: Asylpolitik",
          url: "https://www.bpb.de/themen/migration-integration/",
        },
      ],
    },
    mitteView:
      "Deutschland war immer Einwanderungsland — von den Hugenotten über die Gastarbeiter bis heute. Wer das leugnet, verkennt die eigene Geschichte. Aber jede funktionierende Gesellschaft braucht Regeln, die durchgesetzt werden. Humanität ohne Ordnung ist Überforderung, Ordnung ohne Humanität ist Kälte. Die eigentliche Frage ist keine moralische, sondern eine organisatorische: Wie schaffen wir Integration, die funktioniert — mit Sprachkursen, Arbeitsmarktzugang und klaren Pflichten auf beiden Seiten?",
  },
  {
    topic: "Klimapolitik & Wirtschaft",
    tagType: "teilweise" as const,
    category: "politik" as const,
    leftView: {
      position:
        "Sofortiger Kohleausstieg, massiver Ausbau erneuerbarer Energien, Klimageld für soziale Gerechtigkeit.",
      quote:
        "Wir haben keine Zeit, auf die Apokalypse zu warten, bis wir endlich handeln.",
      speaker: "Fridays for Future — Forderungen 2025",
      hiddenMeaning:
        "Die wissenschaftliche Dringlichkeit ist unbestritten. Aber 'sofort' bedeutet in der Praxis: ohne Ersatzinfrastruktur, ohne Übergangsjobs, ohne Rücksicht auf die Lausitz oder das Ruhrgebiet. Maximalforderungen können Verbündete verschrecken.",
      negativeEffects:
        "Überhasteter Ausstieg ohne Netzstabilität führt zu Energieimporten aus autoritären Staaten. Geringverdiener tragen die höchsten relativen Kosten der Transformation.",
      sources: [
        {
          type: "article" as const,
          label: "FFF: Forderungen 2025",
          url: "https://fridaysforfuture.de/forderungen/forderungen-2025/",
        },
        {
          type: "article" as const,
          label: "FFF: Kohleausstieg Lausitz",
          url: "https://fridaysforfuture.de/kohleabbauplaene-fuer-die-lausitz-muessen-drastisch-ueberarbeitet-werden/",
        },
      ],
    },
    rightView: {
      position:
        "Technologieoffenheit statt Verbote, keine Deindustrialisierung, Kernenergie als Option.",
      quote:
        "Der ideologische Klimawahn gefährdet den Industriestandort Deutschland und den Wohlstand unserer Bürger.",
      speaker: "AfD-Wahlprogramm 2025, Kap. Energie",
      hiddenMeaning:
        "'Technologieoffenheit' klingt vernünftig, meint aber oft: weitermachen wie bisher. Die Leugnung des wissenschaftlichen Konsenses ist keine konservative Position, sondern Realitätsverweigerung im Interesse fossiler Industrien.",
      negativeEffects:
        "Verzögerter Klimaschutz wird exponentiell teurer. Deutschland verliert den Innovationsvorsprung bei Erneuerbaren an China und die USA. Extremwetter verursacht jetzt schon Milliardenschäden.",
      sources: [
        {
          type: "document" as const,
          label: "DIW: Klimakostenforschung 2025",
          url: "https://www.diw.de/de/diw_01.c.974540.de/publikationen/wochenberichte/2025_38_3/zwei_jahrzehnte_klimakostenforschung__praeventiver_klimaschutz_als_volkswirtschaftlicher_vorteil.html",
        },
        {
          type: "article" as const,
          label: "AfD-Wahlprogramm: Energie",
          url: "https://www.bundestagswahl-bw.de/wahlprogramm-afd",
        },
      ],
    },
    mitteView:
      "Der Klimawandel ist keine Meinung, sondern Physik. Aber die Art, wie wir darauf reagieren, ist Politik — und Politik heißt Abwägen. Ein Stahlarbeiter in Duisburg hat genauso recht auf eine Zukunft wie ein Klimaaktivist in Berlin. Die deutsche Ingenieurskunst hat zwei Weltkriege überlebt und ein Land wiederaufgebaut — sie wird auch die Energiewende schaffen, wenn man sie lässt, statt sie mit Ideologie von links oder Verweigerung von rechts zu blockieren. Transformation braucht Tempo und Augenmaß.",
  },
  {
    topic: "Meinungsfreiheit & Diskursklima",
    tagType: "teilweise" as const,
    category: "politik" as const,
    leftView: {
      position:
        "Hassrede ist keine Meinung. Plattformen und Staat müssen Betroffene aktiv schützen.",
      quote:
        "Hate Speech bedroht die Meinungsfreiheit — darum müssen alle dagegen aktiv werden.",
      speaker: "Amadeu Antonio Stiftung",
      hiddenMeaning:
        "Der Schutz vor Hassrede ist berechtigt. Aber die Grenze zwischen Hassrede und unbequemer Meinung ist fließend — und wer diese Grenze definiert, hat enorme Macht. 'Schutz' kann zur Waffe gegen Andersdenkende werden.",
      negativeEffects:
        "Überregulierung führt zu Selbstzensur. Laut Allensbach (2024) glauben 44% der Deutschen, man müsse vorsichtig sein, seine politische Meinung frei zu äußern. Das ist ein Alarmsignal für eine Demokratie.",
      sources: [
        {
          type: "article" as const,
          label: "Amadeu Antonio: Hate Speech & Meinungsfreiheit",
          url: "https://www.amadeu-antonio-stiftung.de/menschenwuerde-online-verteidigen-social-media-tipps-fuer-die-zivilgesellschaft/hate-speech/tipp-1/",
        },
        {
          type: "article" as const,
          label: "Allensbach: 44% raten zu Vorsicht",
          url: "https://evangelische-zeitung.de/allensbach-umfrage-44-prozent-raten-zu-vorsicht-bei-meinungsaeusserung",
        },
      ],
    },
    rightView: {
      position:
        "Meinungsfreiheit wird durch politische Korrektheit und Cancel Culture systematisch eingeschränkt.",
      quote:
        "In diesem Land wird man als Rechter diffamiert, sobald man Probleme beim Namen nennt.",
      speaker: "Konservative Publizistik (div.)",
      hiddenMeaning:
        "Die Klage über Meinungsunterdrückung kommt oft von Stimmen, die maximale Reichweite haben — in Talkshows, Bestsellerlisten, Social Media. 'Man darf nichts mehr sagen' ist selbst ein millionenfach verbreiteter Satz. Die eigentliche Strategie: Widerspruch als Zensur umdeuten.",
      negativeEffects:
        "Die pauschale Opfererzählung untergräbt das Vertrauen in Medien und Institutionen. Sie gibt echten Extremisten Deckung, indem sie jede Kritik an radikalen Positionen als 'Cancel Culture' abtut.",
      sources: [
        {
          type: "article" as const,
          label: "Allensbach: Meinungsfreiheit-Umfrage",
          url: "https://evangelische-zeitung.de/allensbach-umfrage-44-prozent-raten-zu-vorsicht-bei-meinungsaeusserung",
        },
        {
          type: "article" as const,
          label: "Amadeu Antonio: FAQ Hassrede",
          url: "https://www.amadeu-antonio-stiftung.de/ueber-uns/faq-die-amadeu-antonio-stiftung-zum-thema-hassrede-im-netz/",
        },
      ],
    },
    mitteView:
      "Artikel 5 Grundgesetz ist nicht verhandelbar — in keine Richtung. Die Aufklärung hat 300 Jahre gekämpft, damit Menschen frei denken und reden dürfen, auch Unbequemes. Gleichzeitig hat Europa aus bitterer Erfahrung gelernt, dass Worte Waffen sein können — die Weimarer Republik ging auch an Hetzreden zugrunde. Die Lösung ist weder Zensur noch Zügellosigkeit, sondern eine streitbare Demokratie, die Kontroverse aushält, ohne Menschenwürde zur Disposition zu stellen. Wer widerspricht, zensiert nicht. Wer beleidigt, diskutiert nicht.",
  },
];

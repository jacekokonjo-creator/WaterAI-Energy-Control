// ─────────────────────────────────────────────────────────────────────────
// i18n-uwagi-protokolu.js — klucze dodane przy naprawie opisu protokołu TYM.
//
// Powód: rozdzielono dwa mylące się pola formularza Protokołu TYM
// („Notatka wewnętrzna" — robocza, oraz „Uwagi do protokołu" — trafiające do
// metryki analizy 1.1 i raportu ESCO). Zmiana etykiet i placeholderów tworzy
// nowe klucze; bez nich te napisy zostawały po polsku w EN/DE/CS/SK/ES/AT.
//
// Format jak w i18n-ui-core-*: krotki [PL, SK, CS, EN, DE, ES], AT po DE.
// Klucze muszą być znak w znak — łącznie z cudzysłowami „ ” i myślnikiem —.
// ─────────────────────────────────────────────────────────────────────────
(function () {
  'use strict';

  // [ PL, SK, CS, EN, DE, ES ]
  const T = [
    ["Notatka wewnętrzna (krótka)",
     "Interná poznámka (krátka)",
     "Interní poznámka (krátká)",
     "Internal note (short)",
     "Interne Notiz (kurz)",
     "Nota interna (breve)"],

    ["Krótka notatka robocza — dłuższy opis wpisz w „Uwagi do protokołu” niżej.",
     "Krátka pracovná poznámka — dlhší popis zadajte v „Poznámky k protokolu” nižšie.",
     "Krátká pracovní poznámka — delší popis zadejte v „Poznámky k protokolu” níže.",
     "Short working note — enter a longer description in “Protocol notes” below.",
     "Kurze Arbeitsnotiz — längere Beschreibung unten unter „Anmerkungen zum Protokoll“ eintragen.",
     "Nota de trabajo breve — introduzca la descripción más extensa en «Notas del protocolo» abajo."],

    ["— trafiają do analizy (sekcja 1.1) i raportu ESCO",
     "— prenášajú sa do analýzy (sekcia 1.1) a správy ESCO",
     "— přenášejí se do analýzy (sekce 1.1) a zprávy ESCO",
     "— carried over to the analysis (section 1.1) and the ESCO report",
     "— werden in die Analyse (Abschnitt 1.1) und den ESCO-Bericht übernommen",
     "— se trasladan al análisis (sección 1.1) y al informe ESCO"],

    ["Metodyka, założenia, wydzielenie c.w.u., źródło danych, nietypowy okres itp.",
     "Metodika, predpoklady, vyčlenenie TÚV, zdroj údajov, netypické obdobie a pod.",
     "Metodika, předpoklady, vyčlenění TUV, zdroj dat, atypické období apod.",
     "Methodology, assumptions, DHW separation, data source, unusual period, etc.",
     "Methodik, Annahmen, Trennung des Warmwassers, Datenquelle, untypischer Zeitraum usw.",
     "Metodología, supuestos, separación de ACS, fuente de datos, periodo atípico, etc."],

    ["Opis w języku oryginału",
     "Popis v pôvodnom jazyku",
     "Popis v původním jazyce",
     "Description in the original language",
     "Beschreibung in der Originalsprache",
     "Descripción en el idioma original"]
  ];

  const LANGS = ['sk', 'cs', 'en', 'de', 'es'];

  function install() {
    const api = window.DomainI18n;
    if (!api || !api.dict) {
      console.warn('[i18n-uwagi-protokolu] Brak window.DomainI18n — plik musi być ładowany PO i18n-domain.js.');
      return false;
    }
    const stats = {};
    LANGS.forEach((lang, idx) => {
      const d = api.dict[lang] || (api.dict[lang] = {});
      let added = 0;
      for (const row of T) {
        const pl = row[0], tr = row[idx + 1];
        if (tr && !(pl in d)) { d[pl] = tr; added++; }
      }
      stats[lang] = added;
    });
    const at = api.dict.at || (api.dict.at = {});
    let addedAt = 0;
    for (const row of T) if (row[4] && !(row[0] in at)) { at[row[0]] = row[4]; addedAt++; }
    stats.at = addedAt;

    console.info('[i18n-uwagi-protokolu] Dopisano kluczy:', stats);
    if (typeof api.apply === 'function') api.apply();
    return true;
  }

  if (!install()) document.addEventListener('DOMContentLoaded', install);
})();

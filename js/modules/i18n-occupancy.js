// ─────────────────────────────────────────────────────────────────────────
// i18n-occupancy.js — teksty Korekty obłożenia (okres bazowy, analiza, raport).
//
// Metoda została dobudowana po ostatnim wyrównaniu słowników, więc jej etykiety
// nie miały żadnego tłumaczenia — w EN/DE/CZ/SK/ES/AT wyświetlały się po polsku.
// Ładowany PO i18n-domain.js; nie nadpisuje kluczy już znanych innym plikom.
//
// Klucz = dokładny tekst polski widoczny w interfejsie.
// ─────────────────────────────────────────────────────────────────────────
(function () {
  'use strict';

  // pl → [en, de, es, cs, sk]; austriacki (at) dostaje zestaw niemiecki.
  const T = {
    "Korekta obłożenia": [
      "Occupancy correction", "Belegungskorrektur", "Corrección por ocupación",
      "Korekce obsazenosti", "Korekcia obsadenosti"],
    "Podstawa obłożenia": [
      "Occupancy basis", "Belegungsbasis", "Base de ocupación",
      "Základ obsazenosti", "Základ obsadenosti"],
    "Parametry metody (Załącznik nr 3, równanie 2a)": [
      "Method parameters (Annex 3, equation 2a)", "Methodenparameter (Anlage 3, Gleichung 2a)",
      "Parámetros del método (Anexo 3, ecuación 2a)", "Parametry metody (Příloha č. 3, rovnice 2a)",
      "Parametre metódy (Príloha č. 3, rovnica 2a)"],
    "Parametry metody — wspólne dla PRZED i PO": [
      "Method parameters — shared by BEFORE and AFTER", "Methodenparameter — gemeinsam für VORHER und NACHHER",
      "Parámetros del método — comunes a ANTES y DESPUÉS", "Parametry metody — společné pro PŘED a PO",
      "Parametre metódy — spoločné pre PRED a PO"],
    "Parametry korekty obłożenia": [
      "Occupancy correction parameters", "Parameter der Belegungskorrektur",
      "Parámetros de la corrección por ocupación", "Parametry korekce obsazenosti",
      "Parametre korekcie obsadenosti"],
    "tᵢ — pokoje użytkowane [°C]": [
      "tᵢ — occupied rooms [°C]", "tᵢ — belegte Räume [°C]", "tᵢ — habitaciones ocupadas [°C]",
      "tᵢ — obsazené pokoje [°C]", "tᵢ — obsadené izby [°C]"],
    "tᵢ,red — pokoje puste [°C]": [
      "tᵢ,red — vacant rooms [°C]", "tᵢ,red — leere Räume [°C]", "tᵢ,red — habitaciones vacías [°C]",
      "tᵢ,red — prázdné pokoje [°C]", "tᵢ,red — prázdne izby [°C]"],
    "f_wsp — powierzchnie wspólne [%]": [
      "f_com — common areas [%]", "f_gem — Gemeinschaftsflächen [%]", "f_com — zonas comunes [%]",
      "f_spol — společné prostory [%]", "f_spol — spoločné priestory [%]"],
    "O_ref — obłożenie referencyjne [%]": [
      "O_ref — reference occupancy [%]", "O_ref — Referenzbelegung [%]", "O_ref — ocupación de referencia [%]",
      "O_ref — referenční obsazenost [%]", "O_ref — referenčná obsadenosť [%]"],
    "projektowa, zwykle 20": [
      "design value, usually 20", "Auslegungswert, meist 20", "valor de diseño, normalmente 20",
      "projektová, obvykle 20", "projektová, zvyčajne 20"],
    "obniżona, zwykle 17": [
      "setback, usually 17", "abgesenkt, meist 17", "reducida, normalmente 17",
      "snížená, obvykle 17", "znížená, zvyčajne 17"],
    "grzane niezależnie od obłożenia": [
      "heated regardless of occupancy", "unabhängig von der Belegung beheizt",
      "calefactadas con independencia de la ocupación", "vytápěné nezávisle na obsazenosti",
      "vykurované nezávisle od obsadenosti"],
    "dla sezonu standardowego": [
      "for the standard season", "für die Standardsaison", "para la temporada estándar",
      "pro standardní sezónu", "pre štandardnú sezónu"],
    "Okres rzeczywisty": [
      "Actual period", "Ist-Zeitraum", "Periodo real", "Skutečné období", "Skutočné obdobie"],
    "Sezon standardowy (TYM)": [
      "Standard season (TMY)", "Standardsaison (TMY)", "Temporada estándar (TMY)",
      "Standardní sezóna (TMY)", "Štandardná sezóna (TMY)"],
    "Miesiąc": ["Month", "Monat", "Mes", "Měsíc", "Mesiac"],
    "po odliczeniach": [
      "after deductions", "nach Abzügen", "tras deducciones", "po odpočtech", "po odpočtoch"],
    "Okres bazowy — PRZED instalacją": [
      "Baseline period — BEFORE installation", "Basiszeitraum — VOR der Installation",
      "Periodo de referencia — ANTES de la instalación", "Základní období — PŘED instalací",
      "Základné obdobie — PRED inštaláciou"],
    "Okres analizowany — PO instalacji": [
      "Analysed period — AFTER installation", "Analysezeitraum — NACH der Installation",
      "Periodo analizado — DESPUÉS de la instalación", "Analyzované období — PO instalaci",
      "Analyzované obdobie — PO inštalácii"],
    "Podgląd okresu bazowego — 🏨 Korekta obłożenia": [
      "Baseline period preview — 🏨 Occupancy correction",
      "Vorschau Basiszeitraum — 🏨 Belegungskorrektur",
      "Vista previa del periodo de referencia — 🏨 Corrección por ocupación",
      "Náhled základního období — 🏨 Korekce obsazenosti",
      "Náhľad základného obdobia — 🏨 Korekcia obsadenosti"],
    "Wybierz okres bazowy obłożenia": [
      "Select an occupancy baseline period", "Belegungs-Basiszeitraum wählen",
      "Seleccione un periodo de referencia de ocupación", "Vyberte základní období obsazenosti",
      "Vyberte základné obdobie obsadenosti"],
    "Wybierz okres bazowy intensywności": [
      "Select an intensity baseline period", "Intensitäts-Basiszeitraum wählen",
      "Seleccione un periodo de referencia de intensidad", "Vyberte základní období intenzity",
      "Vyberte základné obdobie intenzity"],
    "Zużycie skorygowane (równanie 1)": [
      "Corrected consumption (equation 1)", "Korrigierter Verbrauch (Gleichung 1)",
      "Consumo corregido (ecuación 1)", "Korigovaná spotřeba (rovnice 1)",
      "Korigovaná spotreba (rovnica 1)"],
    "Współczynnik korekcyjny (równanie 3)": [
      "Correction factor (equation 3)", "Korrekturfaktor (Gleichung 3)",
      "Factor de corrección (ecuación 3)", "Korekční součinitel (rovnice 3)",
      "Korekčný súčiniteľ (rovnica 3)"],
    "Efektywna temperatura wewnętrzna (równanie 2a)": [
      "Effective indoor temperature (equation 2a)", "Effektive Innentemperatur (Gleichung 2a)",
      "Temperatura interior efectiva (ecuación 2a)", "Efektivní vnitřní teplota (rovnice 2a)",
      "Efektívna vnútorná teplota (rovnica 2a)"],
    "Stopniodni z uwzględnieniem obłożenia (równanie 2)": [
      "Degree days including occupancy (equation 2)", "Gradtage unter Berücksichtigung der Belegung (Gleichung 2)",
      "Grados-día considerando la ocupación (ecuación 2)", "Denostupně se zohledněním obsazenosti (rovnice 2)",
      "Dennostupne so zohľadnením obsadenosti (rovnica 2)"],
    "Ustaw daty okresu, aby wygenerować miesiące.": [
      "Set the period dates to generate months.", "Zeitraumdaten setzen, um Monate zu erzeugen.",
      "Defina las fechas del periodo para generar los meses.", "Nastavte data období pro vygenerování měsíců.",
      "Nastavte dátumy obdobia na vygenerovanie mesiacov."],
    "Ustaw zakres dat okresu.": [
      "Set the period date range.", "Zeitraum festlegen.", "Defina el rango de fechas del periodo.",
      "Nastavte rozsah dat období.", "Nastavte rozsah dátumov obdobia."],
    "Odliczenia od Qc.o.": [
      "Deductions from Qheat", "Abzüge von Qheiz", "Deducciones de Qcal",
      "Odpočty od Qvyt", "Odpočty od Qvyk"]
  };

  function install() {
    const api = window.DomainI18n;
    if (!api || !api.dict) {
      console.warn('[i18n-occupancy] Brak window.DomainI18n — plik musi być ładowany PO i18n-domain.js.');
      return false;
    }
    const put = (lang, key, val) => {
      const d = api.dict[lang] || (api.dict[lang] = {});
      if (key in d) return 0;          // nie nadpisujemy istniejących tłumaczeń
      d[key] = val;
      return 1;
    };

    const stats = { en: 0, de: 0, es: 0, cs: 0, sk: 0, at: 0 };
    for (const pl in T) {
      const v = T[pl];
      stats.en += put('en', pl, v[0]);
      stats.de += put('de', pl, v[1]);
      stats.es += put('es', pl, v[2]);
      stats.cs += put('cs', pl, v[3]);
      stats.sk += put('sk', pl, v[4]);
      stats.at += put('at', pl, v[1]);   // austriacki = niemiecki
    }

    console.info('[i18n-occupancy] Dopisano kluczy:', stats);
    if (typeof api.apply === 'function') api.apply();
    return true;
  }

  if (!install()) document.addEventListener('DOMContentLoaded', install);
})();

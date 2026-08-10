// ─────────────────────────────────────────────────────────────────────────
// i18n-cs-backfill-5.js — czeski, PARTIA 5 z 6.
// Zakres: statusy dokumentów i zadań, typy dokumentów i załączników, priorytety,
// podpowiedzi (placeholdery) formularzy, fragmenty raportów ESCO, komunikaty
// modułu Dokumenty i kopii zapasowej.
//
// Placeholdery są lokalizowane, nie tłumaczone dosłownie: „np. Warszawa" →
// „např. Praha", „np. PL1234567890" → „např. CZ1234567890", „Sp. z o.o." → „s.r.o."
// — czeski użytkownik ma zobaczyć przykład ze swojego kraju.
// ─────────────────────────────────────────────────────────────────────────
(function () {
  'use strict';

  const CS = {
    'Kod pocztowy': 'PSČ',
    'Kontakt': 'Kontakt',
    'Kontrola danych': 'Kontrola dat',
    'Krytyczny': 'Kritický',
    'Kwartalny': 'Čtvrtletní',
    'Liczba dni okresu': 'Počet dní období',
    'Lokalizacja': 'Lokalita',
    'Model rozliczenia': 'Model vyúčtování',
    'Nie stanowi podstawy do wystawienia faktury': 'Není podkladem pro vystavení faktury',
    'Niski': 'Nízká',
    'Normalny': 'Normální',
    'Notatka': 'Poznámka',
    'Nr analizy': 'Č. analýzy',
    'Nr analizy:': 'Č. analýzy:',
    'Nr budynku': 'Č. budovy',
    'Nr lokalu': 'Č. jednotky',
    'Nr raportu': 'Č. zprávy',
    'Numer faktury': 'Číslo faktury',
    'Oczekuje': 'Čeká',
    'Ogrzewanie elektryczne': 'Elektrické vytápění',
    'Ogrzewanie': 'Vytápění',
    'Opis': 'Popis',
    'Osoba kontaktowa': 'Kontaktní osoba',
    'Osoby kontaktowe': 'Kontaktní osoby',
    'Oznacz jako wykonane': 'Označit jako provedené',
    'Parametry energetyczne i rozliczenie': 'Energetické parametry a vyúčtování',
    'Plik': 'Soubor',
    'Plik:': 'Soubor:',
    'Podpisany': 'Podepsaný',
    'Podstawa umowna (do rozliczenia)': 'Smluvní základ (pro vyúčtování)',
    'Poziom referencyjny (ref)': 'Referenční úroveň (ref)',
    'Poziom referencyjny': 'Referenční úroveň',
    'Priorytet': 'Priorita',
    'Projekt': 'Návrh',
    'Przedszkole': 'Mateřská škola',
    'Hotel': 'Hotel',
    'Szpital': 'Nemocnice',
    'Przygotuj FV ESCO': 'Připravit fakturu ESCO',
    'Przypomnij przed terminem (dni)': 'Připomenout před termínem (dny)',
    'Redukcja [%]': 'Redukce [%]',
    'Roczny': 'Roční',
    'Rola odpowiedzialna': 'Odpovědná role',
    'Rozliczenia': 'Vyúčtování',
    'Separator:': 'Oddělovač:',
    'Serwis': 'Servis',
    'Sezonowo': 'Sezonně',
    'Stacja meteo': 'Meteostanice',
    'Stacja meteo:': 'Meteostanice:',
    'Stacja meteorologiczna': 'Meteorologická stanice',
    'Szkic': 'Koncept',
    'Roboczy': 'Pracovní',
    'Ukończony': 'Dokončený',
    'Wystawiona': 'Vystavená',
    'Zatwierdzony': 'Schválený',
    'Opłacona': 'Uhrazená',
    'Częściowo opłacona': 'Částečně uhrazená',
    'Po terminie': 'Po splatnosti',
    'T powrotu [°C]': 'T zpátečky [°C]',
    'T zasilania [°C]': 'T přívodu [°C]',
    'T zewn. [°C]': 'Venk. T [°C]',
    'Tagi': 'Štítky',
    'Temp. TYM (°C)': 'Teplota TMR (°C)',
    'Termin wykonania': 'Termín provedení',
    'Termin': 'Termín',
    'Tryb pogodowy (PRZED)': 'Ekvitermní režim (PŘED)',
    'Tryb pogodowy (baza)': 'Ekvitermní režim (základ)',
    'Tryb pogodowy': 'Ekvitermní režim',
    'Typ': 'Typ',
    'W okresie rozliczeniowym': 'V zúčtovacím období',
    'W trakcie': 'Probíhá',
    'Wg wskazanych dat': 'Podle zadaných dat',
    'Wierszy:': 'Řádků:',
    'Workflow / Przypomnienie': 'Workflow / Připomínka',
    'Wpisywana kwota to': 'Zadávaná částka je',
    'Wstrzymany': 'Pozastavený',
    'Wygeneruj raport': 'Vygenerovat zprávu',
    'Wykonane': 'Provedené',
    'Wykonywany przez WAI': 'Provádí WAI',
    'Wymaga uwagi': 'Vyžaduje pozornost',
    'Wysoki': 'Vysoká',
    'Zakres danych:': 'Rozsah dat:',
    'Zakres okresu rozliczeniowego': 'Rozsah zúčtovacího období',
    'Zakres:': 'Rozsah:',
    'Zastosuj': 'Použít',
    'Znaczenie': 'Význam',
    'Zostaw wszystkie': 'Ponechat všechny',
    'Zostaw': 'Ponechat',
    'Zweryfikuj FV': 'Ověřit fakturu',
    'NIP / VAT ID': 'DIČ / VAT ID',
    'NIP/IČO:': 'DIČ/IČO:',

    // ── typy dokumentów ──
    'Aneks': 'Dodatek',
    'Certyfikat': 'Certifikát',
    'Deklaracja zgodności': 'Prohlášení o shodě',
    'Dokumentacja techniczna': 'Technická dokumentace',
    'Faktura za ciepło': 'Faktura za teplo',
    'Faktura za energię': 'Faktura za energii',
    'Faktura za gaz': 'Faktura za plyn',
    'Faktura za wodę': 'Faktura za vodu',
    'Faktura zaliczkowa': 'Zálohová faktura',
    'Faktura': 'Faktura',
    'Faktury od klienta': 'Faktury od klienta',
    'Instrukcja techniczna': 'Technický návod',
    'Karta katalogowa': 'Katalogový list',
    'Taryfa': 'Tarif',
    'Umowa energetyczna': 'Energetická smlouva',
    'Umowa na ciepło': 'Smlouva na teplo',
    'Umowy': 'Smlouvy',
    'Zdjęcia': 'Fotografie',
    'Zdjęcie licznika': 'Fotografie měřidla',
    'Zdjęcie obiektu': 'Fotografie objektu',
    'Zdjęcie po montażu': 'Fotografie po montáži',
    'Zdjęcie przed montażem': 'Fotografie před montáží',
    'Zdjęcie urządzenia': 'Fotografie zařízení',
    'Termin analizy': 'Termín analýzy',
    'Termin odczytu': 'Termín odečtu',
    'Korekta': 'Korekce',
    'Co rok': 'Každý rok',

    '• Wyniki a, b: zapisane': '• Výsledky a, b: uloženy',
    'Po ponownym otwarciu tego okresu wszystko wczyta się automatycznie.':
      'Po opětovném otevření tohoto období se vše načte automaticky.',

    // ── podpowiedzi formularzy (lokalizowane na czeskie realia) ──
    'np. ABC Sp. z o.o.': 'např. ABC s.r.o.',
    'np. Hotel Warszawa': 'např. Hotel Praha',
    'np. PL1234567890': 'např. CZ1234567890',
    'np. Prosta': 'např. Hlavní',
    'np. Warszawa': 'např. Praha',
    'np. WeatherOnline / Robot Klimatu': 'např. WeatherOnline / Robot Klimatu',
    'np. ksiegowosc@firma.pl': 'např. ucetnictvi@firma.cz',
    'np. SUPLA, Modbus TCP, licznik Kamstrup...': 'např. SUPLA, Modbus TCP, měřidlo Kamstrup...',
    'opcjonalnie': 'volitelné',
    'SD_rzecz': 'SD_skut',
    'Wsk_rzecz': 'Uk_skut',

    '" już istnieje. Wybierz inny numer.': '„ již existuje. Zvolte jiné číslo.',
    '". Kliknij „+ Nowa analiza", aby utworzyć pierwszą.':
      '". Klikněte na „+ Nová analýza" pro vytvoření první.',
    '&nbsp;·&nbsp; Udział klienta =': '&nbsp;·&nbsp; Podíl klienta =',
    '(po filtrze dat)': '(po filtru dat)',
    ') i wykazane w części dowodowej niniejszego raportu.':
      ') a doložené v dokladové části této zprávy.',
    '): dla każdego stopnia odczytuje się wartość z obu prostych i liczy ich różnicę, a wyniki uśrednia.':
      '): pro každý stupeň se odečte hodnota z obou přímek, vypočte se jejich rozdíl a výsledky se zprůměrují.',
    '+ Dodaj obiekt dla tego klienta': '+ Přidat objekt pro tohoto klienta',
    ', w którym instalacja pracowała w dotychczasowym trybie pogodowym — dane z czujników nie istnieją sprzed montażu, dlatego okres odniesienia regresji jest krótszy niż okres bazowy metody rozliczeniowej, oparty na danych rozliczeniowych z pełnego okresu poprzedzającego wdrożenie':
      ', ve kterém soustava pracovala v dosavadním ekvitermním režimu — údaje ze snímačů z doby před montáží neexistují, proto je vztažné období regrese kratší než základní období zúčtovací metody, opřené o zúčtovací data z celého období předcházejícího nasazení',
    '. Oszczędność = Qs(PRZED) − Qs(PO) — różnica liczona przy tej samej, referencyjnej intensywności, więc wynik jest niezależny od zmian obłożenia/produkcji.':
      '. Úspora = Qs(PŘED) − Qs(PO) — rozdíl počítaný při stejné referenční intenzitě, výsledek je proto nezávislý na změnách obsazenosti/produkce.',
    '. Wartość oszczędności = koszt bazowy × procent oszczędności:':
      '. Hodnota úspor = základní náklad × procento úspor:',
    '. Wartość oszczędności = koszt bazowy × procent oszczędności; dopiero ta kwota jest dzielona pomiędzy WaterAI/ESCO i klienta.':
      '. Hodnota úspor = základní náklad × procento úspor; teprve tato částka se dělí mezi WaterAI/ESCO a klienta.',
    '. Weryfikacja regresją obejmuje część okna rozliczeniowego, według danych pomiarowych dostępnych na dzień sporządzenia analizy technicznej.':
      '. Ověření regresí pokrývá část zúčtovacího okna, podle měřených dat dostupných ke dni zpracování technické analýzy.',
    '. Załączniki zawierają pełne wyprowadzenia, tabele danych źródłowych i wykresy; wyniki końcowe oraz rozliczenie przedstawiono w części głównej raportu.':
      '. Přílohy obsahují úplná odvození, tabulky zdrojových dat a grafy; konečné výsledky a vyúčtování jsou uvedeny v hlavní části zprávy.',
    'Automatycznie po dodaniu protokołu TYM z dn.': 'Automaticky po přidání protokolu TMR ze dne',
    'Automatycznie wygenerowane na podstawie cyklu rozliczeniowego obiektu.':
      'Automaticky vygenerováno na základě zúčtovacího cyklu objektu.',
    'Baza PRZED→PO': 'Základ PŘED→PO',
    'Baza regresji obejmuje okres od montażu urządzenia do aktywacji optymalizacji':
      'Základ regrese zahrnuje období od montáže zařízení do aktivace optimalizace',
    'Całkowity koszt energii w okresie bazowym:': 'Celkový náklad na energii v základním období:',
    'Cena stała:': 'Fixní cena:',
    'Dane i obliczenia': 'Data a výpočty',
    'Dane wejściowe: temperatury i dni z okresu porównawczego protokołu TYM.':
      'Vstupní data: teploty a dny ze srovnávacího období protokolu TMR.',
    'Dostępny zakres danych:': 'Dostupný rozsah dat:',
    'Dowolny model definiowany przez analityka.': 'Libovolný model definovaný analytikem.',
    'Koszt zmienny całościowy (koszt bazowy:': 'Celkový variabilní náklad (základní náklad:',
    'Linię WaterAI wyznaczono z': 'Přímka WaterAI byla stanovena z',
    'Metoda TYM stanowi podstawę rozliczeń kontraktowych oraz wyliczenia oszczędności będących podstawą wystawienia faktury.':
      'Metoda TMR tvoří základ smluvního vyúčtování a výpočtu úspor, které jsou podkladem pro vystavení faktury.',
    'Okres bazowy intensywności': 'Základní období intenzity',
    'Okres bazowy — PRZED instalacją (rzecz) &nbsp;·&nbsp; Poziom referencyjny intensywności (ref)':
      'Základní období — PŘED instalací (skut) &nbsp;·&nbsp; Referenční úroveň intenzity (ref)',
    'Okres bazowy — PRZED instalacją (rzecz) &nbsp;·&nbsp; Standardowy sezon ogrzewczy (stand)':
      'Základní období — PŘED instalací (skut) &nbsp;·&nbsp; Standardní otopná sezona (stand)',
    'Opracował:': 'Vypracoval:',
    'Oszczędność energii — baza sprowadzona do okresu PO [': 'Úspora energie — základ převeden na období PO [',
    'Plik jest za duży (max': 'Soubor je příliš velký (max',
    'Podawany przez Klienta': 'Uváděný Klientem',
    'Redukcja wykazana regresją zmienia się z temperaturą zewnętrzną — od ok.':
      'Redukce prokázaná regresí se mění s venkovní teplotou — od cca',
    'System grzewczy i rozliczeniowy': 'Otopný a zúčtovací systém',
    'Szczegółowe wyprowadzenia i dane źródłowe zawierają załączniki dowodowe.':
      'Podrobná odvození a zdrojová data obsahují dokladové přílohy.',
    'Szkielet kreatora jest gotowy. Arkusz obliczeniowy tej metody dodamy w kolejnym kroku.':
      'Kostra průvodce je hotová. Výpočtový list této metody doplníme v dalším kroku.',
    'Ustaw okres bazowy (data od / do).': 'Nastavte základní období (datum od / do).',
    'Usunąć folder i przenieść': 'Odstranit složku a přesunout',
    'Utrzymanie uzyskanej charakterystyki oznacza prognozowaną oszczędność około':
      'Udržení dosažené charakteristiky znamená prognózovanou úsporu přibližně',
    'W. Brytania': 'V. Británie',
    'WaterAI policzono z': 'WaterAI vypočteno z',
    'Wszystkie odczyty usunięte.': 'Všechny odečty odstraněny.',
    'Wynik potwierdziła niezależna analiza regresji liniowej: średnie obniżenie intensywności zużycia ciepła o':
      'Výsledek potvrdila nezávislá analýza lineární regrese: průměrné snížení intenzity spotřeby tepla o',
    'Zapisano regresję.': 'Regrese uložena.',
    'Zbieranie danych dla analizy': 'Sběr dat pro analýzu',
    'Zmiany pozostały zapisane lokalnie w tej przeglądarce.': 'Změny zůstaly uloženy lokálně v tomto prohlížeči.',
    'Zużycie bazowe:': 'Základní spotřeba:',
    'b) WaterAI (po)': 'b) WaterAI (po)',
    'a) Tryb pogodowy (baza)': 'a) Ekvitermní režim (základ)',
    'a) Stopniodni rzeczywiste': 'a) Skutečné denostupně',
    'b) Stopniodni standardowe': 'b) Standardní denostupně',
    'dokumentów do folderu głównego?': 'dokumentů do hlavní složky?',
    'konta utworzone tutaj przez administratora. Konto założone poza aplikacją (bez profilu) jest blokowane przy wejściu.':
      'účty vytvořené zde administrátorem. Účet založený mimo aplikaci (bez profilu) je při vstupu blokován.',
    'korekta do Typowego Roku Meteorologicznego (TYM)': 'korekce na Typický meteorologický rok (TMR)',
    'linia PO': 'přímka PO',
    'linia PRZED': 'přímka PŘED',
    'między odczytami': 'mezi odečty',
    'na pojedynczy odczyt': 'na jednotlivý odečet',
    'netto. Termin płatności:': 'netto. Splatnost:'
  };

  function install() {
    const api = window.DomainI18n;
    if (!api || !api.dict) {
      console.warn('[i18n-cs-backfill-5] Brak window.DomainI18n — ładuj PO i18n-domain.js.');
      return false;
    }
    const d = api.dict.cs || (api.dict.cs = {});
    let added = 0;
    for (const k in CS) if (!(k in d)) { d[k] = CS[k]; added++; }
    console.info('[i18n-cs-backfill-5] Dopisano kluczy czeskich: ' + added +
                 ' (razem cs: ' + Object.keys(d).length + ')');
    if (typeof api.apply === 'function') api.apply();
    return true;
  }

  if (!install()) document.addEventListener('DOMContentLoaded', install);
})();

// ─────────────────────────────────────────────────────────────────────────
// i18n-cs-backfill-2.js — czeski, PARTIA 2 z 5.
// Zakres: okresy bazowe i protokoły regresji, załączniki dowodowe raportów ESCO,
// kreator analiz, import CSV, komunikaty modułu Użytkownicy i workflow.
// Zasady jak w partii 1: tłumaczenie, nie kalka ze słowackiego; „okres bazowy" =
// Základní období, TYM = TMR, wdrożenie = nasazení, czujniki = snímače.
// ─────────────────────────────────────────────────────────────────────────
(function () {
  'use strict';

  const CS = {
    'faktur': 'faktur',
    '— analizowany okres był chłodniejszy od warunków standardowych, a zużycie należy skorygować w dół,':
      '— analyzované období bylo chladnější než standardní podmínky a spotřebu je třeba korigovat směrem dolů,',
    '— analizowany okres był cieplejszy od warunków standardowych, a zużycie należy skorygować w górę,':
      '— analyzované období bylo teplejší než standardní podmínky a spotřebu je třeba korigovat směrem nahoru,',
    'Brak zapisanych okresów bazowych intensywności dla tego obiektu. Kliknij „+ Nowy okres bazowy".':
      'Pro tento objekt nejsou uložena žádná základní období intenzity. Klikněte na „+ Nové základní období".',
    'odczytów + dane klimatyczne i okres. Edytuj wg potrzeb i zapisz, aby utworzyć nowy protokół.':
      'odečtů + klimatická data a období. Upravte podle potřeby a uložte pro vytvoření nového protokolu.',
    'Wynik metody rozliczeniowej mieści się wewnątrz przedziału wskazywanego przez regresję.':
      'Výsledek zúčtovací metody leží uvnitř intervalu, který udává regrese.',
    'Sugerowany format: K{nr klienta}-O{nr obiektu}-{kolejny nr}. Można edytować ręcznie.':
      'Doporučený formát: K{č. klienta}-O{č. objektu}-{pořadové č.}. Lze upravit ručně.',
    'Kliknij „+ Nowy okres bazowy", aby utworzyć protokół i wprowadzić dane z czujników.':
      'Klikněte na „+ Nové základní období" pro vytvoření protokolu a zadání dat ze snímačů.',
    'Okres bazowy — PRZED instalacją (rzecz)  ·  Poziom referencyjny intensywności (ref)':
      'Základní období — PŘED instalací (skut.)  ·  Referenční úroveň intenzity (ref)',
    'Za mało danych (min. 2 miesiące z temperaturą i zużyciem) aby wyliczyć regresję.':
      'Příliš málo dat (min. 2 měsíce s teplotou a spotřebou) pro výpočet regrese.',
    'Okres bazowy — PRZED instalacją (rzecz)  ·  Standardowy sezon ogrzewczy (stand)':
      'Základní období — PŘED instalací (skut.)  ·  Standardní otopná sezona (stand.)',
    'Rozliczenie obejmuje oszczędności energii wyznaczone metodą rozliczeniową (':
      'Vyúčtování zahrnuje úspory energie stanovené zúčtovací metodou (',
    'Z danych pomiarowych obu okresów otrzymano poniższe równania prostych. Wartość':
      'Z měřených dat obou období byly získány následující rovnice přímek. Hodnota',
    'Wybierz metodę i kliknij „Kopiuj dane", aby wczytać linie bazowe y = ax + b.':
      'Zvolte metodu a klikněte na „Kopírovat data" pro načtení základních přímek y = ax + b.',
    'Numer protokołu jest wymagany. Bez niego nie można zapisać okresu bazowego.':
      'Číslo protokolu je povinné. Bez něj nelze základní období uložit.',
    'Jeśli wartość jest już sumą miesięczną, wpisz dni z₀ = 1 → wtedy Wsk = I.':
      'Pokud je hodnota již měsíčním součtem, zadejte dny z₀ = 1 → potom Uk = I.',
    '(Plik → Zapisz jako → CSV UTF-8), nagłówki jak wyżej; bezpośredni import':
      '(Soubor → Uložit jako → CSV UTF-8), hlavičky jako výše; přímý import',
    '— wyraz wolny: teoretyczna wartość y przy temperaturze zewnętrznej 0 °C.':
      '— absolutní člen: teoretická hodnota y při venkovní teplotě 0 °C.',
    '⚠ Niezapisane — kliknij „Zapisz regresję", aby zachować zakres i wyniki.':
      '⚠ Neuloženo — klikněte na „Uložit regresi" pro zachování rozsahu a výsledků.',
    'Brak okresów bazowych dla tego obiektu. Kliknij „+ Dodaj okres bazowy".':
      'Pro tento objekt nejsou žádná základní období. Klikněte na „+ Přidat základní období".',
    'Faktyczne zużycie = różnica wskazań licznika między kolejnymi odczytami':
      'Skutečná spotřeba = rozdíl stavů měřidla mezi po sobě jdoucími odečty',
    'Jednostkowe zużycie energii na jeden standardowy stopniodzień:  q = Qs':
      'Jednotková spotřeba energie na jeden standardní denostupeň:  q = Qs',
    'Wybierz typ okresu bazowego. Typy i opisy są spójne z modułem Analizy.':
      'Zvolte typ základního období. Typy a popisy jsou shodné s modulem Analýzy.',
    'Kliknij „✏️ Edytuj", wykonaj 4 wykresy i na dole „💾 Zapisz regresję".':
      'Klikněte na „✏️ Upravit", vytvořte 4 grafy a dole „💾 Uložit regresi".',
    '— suma stopniodni z temperatur Typowego Roku Meteorologicznego (TYM),':
      '— součet denostupňů z teplot Typického meteorologického roku (TMR),',
    'Zmigrowano z poprzedniej wersji (jeden zestaw danych → protokół #1)':
      'Migrováno z předchozí verze (jedna sada dat → protokol č. 1)',
    'zgodnie z zawartą umową o poprawę efektywności energetycznej (ESCO)':
      'v souladu s uzavřenou smlouvou o zlepšení energetické účinnosti (ESCO)',
    'Dodatkowe uwagi, zastrzeżenia, źródło danych, nietypowy okres itp.':
      'Doplňující poznámky, výhrady, zdroj dat, netypické období apod.',
    'Metoda regresji (dotyczy obu wielkości: zużycie + temp. zasilania)':
      'Metoda regrese (týká se obou veličin: spotřeba + teplota přívodu)',
    'Brak danych. Dodaj wiersze ręcznie lub zaimportuj plik CSV/Excel.':
      'Žádná data. Přidejte řádky ručně nebo importujte soubor CSV/Excel.',
    'Brak zapisanych danych źródłowych regresji (CSV) dla tej analizy.':
      'Pro tuto analýzu nejsou uložena zdrojová data regrese (CSV).',
    'Sprowadzenie zużycia do standardowego sezonu metodą stopniodni.':
      'Převedení spotřeby na standardní sezonu metodou denostupňů.',
    'Kliknij "+ Dodaj okres bazowy" aby rozpocząć rozliczenie ESCO.':
      'Klikněte na „+ Přidat základní období" pro zahájení vyúčtování ESCO.',
    'Wartość oszczędności = koszt bazowy × procent oszczędności:':
      'Hodnota úspor = základní náklad × procento úspor:',
    'Brak poprzedniego protokołu okresu bazowego dla tego obiektu.':
      'Pro tento objekt chybí předchozí protokol základního období.',
    'Metoda pomocnicza (weryfikacyjna) – analiza regresji liniowej':
      'Pomocná metoda (ověřovací) – analýza lineární regrese',
    'Zakres temperatur do porównania i uśrednienia przyjęto na':
      'Rozsah teplot pro porovnání a zprůměrování byl zvolen na',
    '; Załącznik B — dowód metody pomocniczej (regresja liniowa)':
      '; Příloha B — doklad pomocné metody (lineární regrese)',
    '— temperatura wewnętrzna przyjęta do obliczeń [°C]  (PRZED:':
      '— vnitřní teplota zvolená pro výpočty [°C]  (PŘED:',
    '📊 Redukcja temperatury zasilania wg temperatury zewnętrznej':
      '📊 Redukce teploty přívodu podle venkovní teploty',
    'Konto e-mail utworzone, ale zapis profilu się nie powiódł:':
      'E-mailový účet byl vytvořen, ale uložení profilu se nezdařilo:',
    'Stopniodni grzewcze (SD) — rzeczywiste i standardowe (TYM)':
      'Topné denostupně (SD) — skutečné a standardní (TMR)',
    'brak okresów bazowych regresji (utwórz w arkuszu regresji)':
      'žádná základní období regrese (vytvořte v regresním listu)',
    'Podaj przynajmniej datę odczytu i temperaturę zewnętrzną.':
      'Zadejte alespoň datum odečtu a venkovní teplotu.',
    'Wybierz obiekt, aby zarządzać okresami bazowymi regresji.':
      'Zvolte objekt pro správu základních období regrese.',
    'Metoda 1 — dopasowanie do wszystkich punktów pomiarowych':
      'Metoda 1 — proložení všemi měřenými body',
    'Okres bazowy musi być przypisany do konkretnego obiektu.':
      'Základní období musí být přiřazeno ke konkrétnímu objektu.',
    'Uwagi do protokołu, źródło danych, nietypowy okres itd.':
      'Poznámky k protokolu, zdroj dat, netypické období atd.',
    '🌡️ Zakres temperatur — tabela i wykresy okresu bazowego':
      '🌡️ Rozsah teplot — tabulka a grafy základního období',
    '→ klient/obiekt/okres bazowy → dane → „Wykonaj analizę':
      '→ klient/objekt/základní období → data → „Provést analýzu',
    'Brak aktywnego obiektu — otwórz okres bazowy z listy.':
      'Žádný aktivní objekt — otevřete základní období ze seznamu.',
    'Link do źródła danych (WeatherOnline / Robot Klimatu)':
      'Odkaz na zdroj dat (WeatherOnline / Robot Klimatu)',
    'Normalizacja względem wolumenu / intensywności pracy.':
      'Normalizace vůči objemu / intenzitě provozu.',
    'Nie udało się odtworzyć pełnego raportu tej analizy.':
      'Nepodařilo se obnovit úplnou zprávu této analýzy.',
    'Podgląd własnych obiektów, pomiarów i raportów ESCO.':
      'Náhled vlastních objektů, měření a zpráv ESCO.',
    'Porównanie techniczne PRZED/PO wg równań y = ax + b.':
      'Technické porovnání PŘED/PO podle rovnic y = ax + b.',
    'intensywność pracy (goście / m³ / produkcja / osoby)':
      'intenzita provozu (hosté / m³ / produkce / osoby)',
    '📉 Punkty pomiarowe i linie regresji — zużycie ciepła':
      '📉 Měřené body a regresní přímky — spotřeba tepla',
    '📊 Redukcja zużycia ciepła wg temperatury zewnętrznej':
      '📊 Redukce spotřeby tepla podle venkovní teploty',
    'Dodaj pierwszy okres bazowy w module Okresy bazowe.':
      'Přidejte první základní období v modulu Základní období.',
    'Temperatury rzeczywiste i normy standardowe (TYM) —':
      'Skutečné teploty a standardní normy (TMR) —',
    'wg udziałów przypisanych w poszczególnych analizach':
      'podle podílů přiřazených v jednotlivých analýzách',
    '📐 Wynik regresji — 4 wykresy (2 metryki × 2 metody)':
      '📐 Výsledek regrese — 4 grafy (2 metriky × 2 metody)',
    'Brak zadań workflow. Dodaj pierwsze przypomnienie.':
      'Žádné workflow úlohy. Přidejte první připomínku.',
    'Załącznik B · Dowód — metoda pomocnicza (regresja)':
      'Příloha B · Doklad — pomocná metoda (regrese)',
    '— regresja przez wszystkie punkty (klasyczny OLS).':
      '— regrese přes všechny body (klasický OLS).',
    '— usunięcie odczytu tylko zdejmuje go z tej listy,':
      '— odstranění odečtu jej pouze vyřadí z tohoto seznamu,',
    'Nie udało się odtworzyć pełnego raportu regresji.':
      'Nepodařilo se obnovit úplnou zprávu regrese.',
    'Wybierz klienta i obiekt, aby zobaczyć protokoły.':
      'Vyberte klienta a objekt pro zobrazení protokolů.',
    '📉 Zużycie ciepła — linie Tryb pogodowy vs WaterAI':
      '📉 Spotřeba tepla — přímky Ekvitermní režim vs WaterAI',
    ', wykonaj 4 wykresy i na dole „💾 Zapisz regresję':
      ', vytvořte 4 grafy a dole „💾 Uložit regresi',
    'Normalizacja zużycia względem obłożenia obiektu.':
      'Normalizace spotřeby vůči obsazenosti objektu.',
    'Brak okresów bazowych regresji dla tego obiektu':
      'Pro tento objekt nejsou žádná základní období regrese',
    'Najpierw wykonaj analizę („⚡ Wykonaj analizę").':
      'Nejprve proveďte analýzu („⚡ Provést analýzu").',
    'Wskaźniki zużycia na m² powierzchni ogrzewanej.':
      'Ukazatele spotřeby na m² vytápěné plochy.',
    'Zapisano regresję.\n\n• Zakres okresu bazowego:':
      'Regrese uložena.\n\n• Rozsah základního období:',
    'dwie wzajemnie uzupełniające się metody analizy':
      'dvě vzájemně se doplňující metody analýzy',
    'obłożenie (osobonoce / % / liczba użytkowników)':
      'obsazenost (osobonoci / % / počet uživatelů)',
    '— za mało punktów (min. 2). Poszerz zakres dat.':
      '— příliš málo bodů (min. 2). Rozšiřte rozsah dat.',
    'Prognozowane zużycie energii dla okresu PO:  Q':
      'Prognózovaná spotřeba energie pro období PO:  Q',
    'Rejestracja nie zwróciła identyfikatora konta.':
      'Registrace nevrátila identifikátor účtu.',
    'Dla każdego miesiąca liczony jest wskaźnik':
      'Pro každý měsíc se počítá ukazatel',
    'Dodaj pierwszy okres bazowy dla tego obiektu.':
      'Přidejte první základní období pro tento objekt.',
    'Plik CSV jest pusty lub nie zawiera nagłówka.':
      'Soubor CSV je prázdný nebo neobsahuje hlavičku.',
    'Wybrany okres bazowy nie ma żadnych odczytów.':
      'Zvolené základní období nemá žádné odečty.',
    'Zakres temperatur — tabela zbiorcza i wykresy':
      'Rozsah teplot — souhrnná tabulka a grafy',
    'Brak poprzedniego protokołu do skopiowania.':
      'Chybí předchozí protokol ke zkopírování.',
    'Prognoza roczna oszczędności (orientacyjna)':
      'Roční prognóza úspor (orientační)',
    'Szukaj po nazwie, kraju, mieście, VAT ID...':
      'Hledat podle názvu, země, města, DIČ...',
    'Załącznik A — dowód metody rozliczeniowej (':
      'Příloha A — doklad zúčtovací metody (',
    'skopiuj dane z okresu bazowego (Metoda 1/2)':
      'zkopírujte data ze základního období (Metoda 1/2)',
    '📉 Zużycie ciepła — Tryb pogodowy vs WaterAI':
      '📉 Spotřeba tepla — Ekvitermní režim vs WaterAI',
    'Dodaj dokument lub przenieś tu istniejący.':
      'Přidejte dokument nebo sem přesuňte existující.',
    'Edytuj protokół (dane, selekcja, regresja)':
      'Upravit protokol (data, výběr, regrese)',
    '• Selekcja danych: zapisana (usuniętych:':
      '• Výběr dat: uložen (odstraněno:',
    'Brak klientów — dodaj pierwszego poniżej.':
      'Žádní klienti — přidejte prvního níže.',
    'Ten adres e-mail jest już zarejestrowany.':
      'Tato e-mailová adresa je již zaregistrována.',
    'Uwzględnienie harmonogramu pracy obiektu.':
      'Zohlednění harmonogramu provozu objektu.',
    '📅 Zakres okresu bazowego (data i godzina)':
      '📅 Rozsah základního období (datum a čas)',
    '— liczba stopniodni grzewczych [°C·dni],':
      '— počet topných denostupňů [°C·dny],',
    'Brak obiektów — dodaj pierwszy poniżej.':
      'Žádné objekty — přidejte první níže.',
    'Czy na pewno usunąć protokół pomiarowy?':
      'Opravdu odstranit měřicí protokol?',
    'Hasło startowe musi mieć min. 6 znaków.':
      'Počáteční heslo musí mít min. 6 znaků.',
    'Obiekt musi być przypisany do klienta.':
      'Objekt musí být přiřazen ke klientovi.',
    'wykazała redukcję zużycia energii o':
      'prokázala snížení spotřeby energie o',
    'Analiza techniczna — regresja liniowa':
      'Technická analýza — lineární regrese',
    'Czy na pewno usunąć zadanie workflow?':
      'Opravdu odstranit workflow úlohu?',
    'Wartość oszczędności (łącznie, netto)':
      'Hodnota úspor (celkem, netto)',
    'Załącznik A · Dowód — metoda główna (':
      'Příloha A · Doklad — hlavní metoda (',
    '[users] Nie udało się pobrać profili:':
      '[users] Nepodařilo se načíst profily:',
    'dowolna; brakujące pola zostaw puste.':
      'libovolné; chybějící pole nechte prázdná.',
    '✏️ Edytuj nagłówek / dane klimatyczne':
      '✏️ Upravit hlavičku / klimatická data',
    '📋 Kopiuj TYM z poprzedniego protokołu':
      '📋 Kopírovat TMR z předchozího protokolu',
    '🔗 Link do źródła danych klimatycznych':
      '🔗 Odkaz na zdroj klimatických dat',
    'Okres bazowy intensywności zapisany.':
      'Základní období intenzity uloženo.',
    'Wartość oszczędności łącznie (netto)':
      'Hodnota úspor celkem (netto)',
    'już istnieje. Wybierz inny numer.':
      'již existuje. Zvolte jiné číslo.',
    '2 · Okres bazowy (PRZED instalacją)':
      '2 · Základní období (PŘED instalací)',
    '= regresja okresu bazowego (PRZED).':
      '= regrese základního období (PŘED).',
    'Biblioteka supabase-js niedostępna.':
      'Knihovna supabase-js není dostupná.',
    'Wynik analizy regresji (PRZED / PO)':
      'Výsledek regresní analýzy (PŘED / PO)',
    'Nie wymaga podpisu ani pieczęci.':
      'Nevyžaduje podpis ani razítko.',
    'Brak połączenia z bazą (Supabase).':
      'Chybí připojení k databázi (Supabase).',
    'Data pobrania danych klimatycznych':
      'Datum stažení klimatických dat',
    'Okres bazowy — PRZED (rzecz) · Tᵢ=':
      'Základní období — PŘED (skut.) · Tᵢ=',
    'Rozliczenia ESCO — WaterAI Energy.':
      'Vyúčtování ESCO — WaterAI Energy.',
    'Tᵢ bazowa — okres analizowany [°C]':
      'Tᵢ základní — analyzované období [°C]',
    'Wybierz daty aby zobaczyć miesiące':
      'Zvolte data pro zobrazení měsíců',
    'np. Poproś klienta o FV za energię':
      'např. Požádat klienta o fakturu za energii',
    '🌍 Typowy rok meteorologiczny (TYM)':
      '🌍 Typický meteorologický rok (TMR)',
    '📈 Okresy bazowe — regresja liniowa':
      '📈 Základní období — lineární regrese',
    'Brak protokołów dla tego obiektu.':
      'Pro tento objekt nejsou žádné protokoly.',
    'Metodyka rozliczenia oszczędności':
      'Metodika vyúčtování úspor',
    'Okres analizowany — PO instalacji':
      'Analyzované období — PO instalaci',
    'przecinek, średnik lub tabulator.':
      'čárka, středník nebo tabulátor.',
    'średnie obniżenie temp. zasilania':
      'průměrné snížení teploty přívodu',
    '📈 Okres bazowy — regresja liniowa':
      '📈 Základní období — lineární regrese',
    '📋 Kopiuj z poprzedniego protokołu':
      '📋 Kopírovat z předchozího protokolu',
    'Brak odczytów z parsowalną datą.':
      'Žádné odečty s rozpoznatelným datem.',
    'brak zapisanych okresów bazowych':
      'žádná uložená základní období',
    'średnie obniżenie zużycia ciepła':
      'průměrné snížení spotřeby tepla',
    'Dane zapisują się w analizie.':
      'Data se ukládají v analýze.',
    'Dane z czujników — dane czasowe':
      'Data ze snímačů — časová data',
    'Najpierw dodaj klienta i obiekt':
      'Nejprve přidejte klienta a objekt',
    'Okres bazowy (PRZED instalacją)':
      'Základní období (PŘED instalací)',
    'Okres bazowy — regresja (PRZED)':
      'Základní období — regrese (PŘED)',
    'Standardowy sezon (stand) · Tᵢ=':
      'Standardní sezona (stand.) · Tᵢ=',
    'średnia różnica temp. zasilania':
      'průměrný rozdíl teploty přívodu',
    '🌡️ T zasilania — Tryb pogodowy:':
      '🌡️ T přívodu — Ekvitermní režim:',
    '📉 Zużycie ciepła — okres bazowy':
      '📉 Spotřeba tepla — základní období',
    'Brak obiektów dla tego klienta':
      'Pro tohoto klienta nejsou žádné objekty',
    'Klient · obiekt · okres bazowy':
      'Klient · objekt · základní období',
    'Korekta intensywności (VOLUME)':
      'Korekce intenzity (VOLUME)',
    'Odczyt z instalacji / Water AI':
      'Odečet ze soustavy / Water AI',
    'Okres bazowy (regresja, PRZED)':
      'Základní období (regrese, PŘED)',
    'metodę analizy opisaną poniżej':
      'metodu analýzy popsanou níže',
    '▶ Wykonaj regresję (4 wykresy)':
      '▶ Provést regresi (4 grafy)',
    'Data pierwszego przypomnienia':
      'Datum první připomínky',
    'Nie udało się usunąć profilu:':
      'Nepodařilo se odstranit profil:',
    'Wybierz obiekt dla protokołu.':
      'Zvolte objekt pro protokol.',
    'Wybierz okres bazowy regresji':
      'Zvolte základní období regrese',
    '📎 Załączniki — część dowodowa':
      '📎 Přílohy — dokladová část',
    'Czy na pewno usunąć klienta?':
      'Opravdu odstranit klienta?',
    'Okres bazowy — PRZED (rzecz)':
      'Základní období — PŘED (skut.)',
    'Podaj poprawny adres e-mail.':
      'Zadejte platnou e-mailovou adresu.',
    'Sortuj po wielkości odchyłki':
      'Seřadit podle velikosti odchylky',
    '— najpierw wybierz klienta —':
      '— nejprve vyberte klienta —',
    '➕ Nowy okres bazowy regresji':
      '➕ Nové základní období regrese',
    '📈 Regresja — Protokół z dnia':
      '📈 Regrese — Protokol ze dne',
    'Czy na pewno usunąć obiekt?':
      'Opravdu odstranit objekt?',
    'Data pierwszego rozliczenia':
      'Datum prvního vyúčtování',
    'Metoda 1 — wszystkie punkty':
      'Metoda 1 — všechny body',
    'Sporządził (Energy Analyst)':
      'Vypracoval (Energy Analyst)',
    'Sporządził — Energy Analyst':
      'Vypracoval — Energy Analyst',
    'np. Księgowość / Techniczny':
      'např. Účetnictví / Technický'
  };

  function install() {
    const api = window.DomainI18n;
    if (!api || !api.dict) {
      console.warn('[i18n-cs-backfill-2] Brak window.DomainI18n — ładuj PO i18n-domain.js.');
      return false;
    }
    const d = api.dict.cs || (api.dict.cs = {});
    let added = 0;
    for (const k in CS) if (!(k in d)) { d[k] = CS[k]; added++; }
    console.info('[i18n-cs-backfill-2] Dopisano kluczy czeskich: ' + added +
                 ' (razem cs: ' + Object.keys(d).length + ')');
    if (typeof api.apply === 'function') api.apply();
    return true;
  }

  if (!install()) document.addEventListener('DOMContentLoaded', install);
})();

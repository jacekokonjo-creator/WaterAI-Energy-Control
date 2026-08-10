// ─────────────────────────────────────────────────────────────────────────
// i18n-cs-backfill.js — uzupełnienie czeskiego słownika.
//
// Powód: DICT.cs w i18n-domain.js miał 840 kluczy przy 1914 słowackich, więc te
// same ekrany, które po słowacku były przetłumaczone, po czesku pokazywały polski
// tekst — także w treściach, które widzi klient (analizy, opisy metodyki, raporty ESCO).
//
// Czeski i słowacki są bliskie, ale NIE tożsame — każdy wpis jest tłumaczeniem,
// nie kopią słowackiego. Terminologia zgodna z tym, co już jest w DICT.cs
// (m.in. „Základní období" na okresy bazowe).
//
// PARTIA 1 z 5 — pomiary, regresja liniowa, opisy metodyki korekt.
// Ładowany PO i18n-domain.js. Nie nadpisuje kluczy, które czeski już zna.
// ─────────────────────────────────────────────────────────────────────────
(function () {
  'use strict';

  const CS = {
    // ── pomiary / odczyty ──
    'widoczne:': 'zobrazeno:',
    'ogółem)': 'celkem)',
    'pomiarów również ze wspólnej bazy. Operacji nie można cofnąć.': 'měření také ze společné databáze. Operaci nelze vrátit zpět.',
    '⚠ Wykryto': '⚠ Zjištěno',
    'Zostawić po jednym i usunąć resztę?': 'Ponechat po jednom a zbytek odstranit?',
    '🔥 Przelicznik gazu m³ → kWh': '🔥 Přepočet plynu m³ → kWh',
    'Pelet': 'Pelety',
    'Pozycja': 'Položka',
    'Jedn. ceny': 'Jedn. ceny',
    'Koszt zmienny (Z) netto': 'Variabilní náklady (Z) netto',
    'Koszt stały (S) netto': 'Fixní náklady (S) netto',
    '🧾 DANE Z FAKTURY / ODCZYTU': '🧾 ÚDAJE Z FAKTURY / ODEČTU',
    '💰 ROZPISANE KOSZTY NETTO — co za co idzie': '💰 ROZEPSANÉ NÁKLADY NETTO — co za co jde',
    'Szczegóły (opcjonalnie)': 'Podrobnosti (volitelné)',
    'data odczytu · źródło · typ wartości · energia po przeliczeniu · VAT i brutto · kto odczytał · uwagi':
      'datum odečtu · zdroj · typ hodnoty · energie po přepočtu · DPH a brutto · kdo odečetl · poznámky',
    'Medium': 'Médium',
    'Ciepło sieciowe': 'Dálkové teplo',
    'Energia elektryczna': 'Elektrická energie',
    'Woda': 'Voda',
    'Inne': 'Jiné',
    'Gaz': 'Plyn',
    'Zużycie / wskazanie': 'Spotřeba / stav měřidla',
    'Nr faktury': 'Č. faktury',
    '(jeśli wpis z FV)': '(pokud zápis z faktury)',
    'Dostawca': 'Dodavatel',
    'Koszt zmienny (Z)': 'Variabilní náklady (Z)',
    'Koszt stały (S)': 'Fixní náklady (S)',
    'Razem netto': 'Celkem netto',
    'Koszt jedn. zmienny': 'Jedn. variabilní náklady',
    '(z pozycji)': '(z položek)',
    '(auto)': '(auto)',
    '(np. kWh z FV za gaz)': '(např. kWh z faktury za plyn)',
    'Podaj zużycie / wskazanie.': 'Zadejte spotřebu / stav měřidla.',
    'Typ wartości': 'Typ hodnoty',
    'Energia po przeliczeniu': 'Energie po přepočtu',
    'VAT %': 'DPH %',
    'Koszt netto': 'Náklady netto',
    'Koszt brutto': 'Náklady brutto',
    'Wskazanie licznika': 'Stav měřidla',
    'Zużycie w okresie': 'Spotřeba za období',
    'Odczyt z licznika': 'Odečet z měřidla',
    'Zdalny odczyt z licznika': 'Dálkový odečet z měřidla',
    'Wskazanie z FV': 'Údaj z faktury',
    'Odczyt klienta': 'Odečet klienta',
    '≡ Wpis seryjny': '≡ Sériový zápis',
    'Nowy pomiar': 'Nové měření',
    'Edycja pomiaru': 'Úprava měření',
    'Zapisz pomiar': 'Uložit měření',
    'Pliki': 'Soubory',

    // ── wykresy regresji ──
    'Δ zużycie ciepła [MJ]': 'Δ spotřeba tepla [MJ]',
    'Metoda 1: wszystkie punkty (OLS)': 'Metoda 1: všechny body (OLS)',
    'Metoda 2: średnie per °C': 'Metoda 2: průměry na °C',
    'punkty = średnie per °C': 'body = průměry na °C',
    'Zużycie ciepła [MJ]': 'Spotřeba tepla [MJ]',
    'Zużycie ciepła vs T zewnętrzna': 'Spotřeba tepla vs venkovní T',
    'Temperatura zasilania vs T zewnętrzna': 'Teplota přívodu vs venkovní T',
    'Intensywność: rzeczywista vs referencyjna': 'Intenzita: skutečná vs referenční',
    'Koszty: wartość oszczędności i podział': 'Náklady: hodnota úspor a rozdělení',
    'Oszczędność energii (baza sprowadzona do okresu PO)': 'Úspora energie (základ převeden na období PO)',
    'Zużycie skorygowane do warunków standardowych (Qs)': 'Spotřeba korigovaná na standardní podmínky (Qs)',
    'Zużycie sprowadzone do referencyjnej intensywności (Qs)': 'Spotřeba převedená na referenční intenzitu (Qs)',
    'PRZED': 'PŘED',
    'PRZED→PO': 'PŘED→PO',

    // ── skróty miesięcy ──
    'Sty': 'Led',
    'Lut': 'Úno',
    'Kwi': 'Dub',
    'Cze': 'Čvn',
    'Lip': 'Čvc',
    'Sie': 'Srp',
    'Wrz': 'Zář',
    'Paź': 'Říj',
    'Lis': 'Lis',
    'Gru': 'Pro',

    // ── odmiany okresów (dopasowanie podłańcuchowe) ──
    'okresu bazowego': 'základního období',
    'okresie bazowym': 'základním období',
    'okresy bazowe': 'základní období',
    'okresów bazowych': 'základních období',
    'okres bazowy': 'základní období',
    'okresu analizowanego': 'analyzovaného období',
    'okres analizowany': 'analyzované období',
    'okresu rozliczeniowego': 'zúčtovacího období',
    'okres rozliczeniowy': 'zúčtovací období',
    'okresie rozliczeniowym': 'zúčtovacím období',

    // ── rzeczowniki w dopełniaczu (liczniki „ile czegoś") ──
    'Wartości': 'Hodnoty',
    'wartości': 'hodnoty',
    'klientów': 'klientů',
    'obiektów': 'objektů',
    'odczytów': 'odečtů',
    'pomiarów': 'měření',
    'analiz': 'analýz',
    'protokołów': 'protokolů',
    'protokołu': 'protokolu',
    'miesięcy': 'měsíců',
    'punktów': 'bodů',
    'stopniodni': 'denostupňů',
    'stopniodzień': 'denostupeň',
    'zużycia': 'spotřeby',
    'zużyciem': 'spotřebou',
    'temperatura zasilania': 'teplota přívodu',
    'temperatury zasilania': 'teploty přívodu',
    'temperatura zewnętrzna': 'venkovní teplota',
    'temperatury zewnętrznej': 'venkovní teploty',
    'oszczędności': 'úspor',
    'oszczędność': 'úspora',
    'cieplejszy': 'teplejší',
    'rzeczywiste': 'skutečné',
    'standardowe': 'standardní',

    // ── opisy metodyki (treść trafiająca do raportów ESCO) ──
    'Na podstawie zużycia skorygowanego okresu PRZED wyznacza się jednostkowe zużycie energii przypadające na jeden standardowy stopniodzień. Następnie jednostkowe zużycie mnoży się przez liczbę standardowych stopniodni okresu PO, otrzymując prognozowane zużycie energii, jakie wystąpiłoby w okresie PO przy zachowaniu charakterystyki energetycznej okresu PRZED.':
      'Na základě korigované spotřeby období PŘED se stanoví jednotková spotřeba energie připadající na jeden standardní denostupeň. Jednotková spotřeba se následně vynásobí počtem standardních denostupňů období PO, čímž se získá prognózovaná spotřeba energie, která by nastala v období PO při zachování energetické charakteristiky období PŘED.',
    'Analogiczne zestawienie dla temperatury zasilania instalacji: chmura punktów z liniami regresji, wygładzone linie obu trybów oraz wykres redukcji dla każdego stopnia. Niższa temperatura zasilania przy tej samej temperaturze zewnętrznej oznacza łagodniejszą pracę źródła ciepła, mniejsze straty przesyłu i potencjalnie wyższą sprawność wytwarzania.':
      'Obdobný přehled pro teplotu přívodu otopné soustavy: mrak bodů s regresními přímkami, vyhlazené křivky obou režimů a graf redukce pro každý stupeň. Nižší teplota přívodu při stejné venkovní teplotě znamená mírnější provoz zdroje tepla, menší ztráty při rozvodu a potenciálně vyšší účinnost výroby.',
    'Regresja liniowa opisuje zależność wybranego parametru pracy instalacji od temperatury zewnętrznej. Pozwala porównać, jak obiekt reaguje na warunki pogodowe PRZED i PO wdrożeniu — niezależnie od tego, że oba okresy mogły mieć inny przebieg temperatur. Dzięki temu efekt optymalizacji ocenia się technicznie, a nie tylko przez surowe sumy zużycia.':
      'Lineární regrese popisuje závislost zvoleného provozního parametru soustavy na venkovní teplotě. Umožňuje porovnat, jak objekt reaguje na povětrnostní podmínky PŘED a PO nasazení — nezávisle na tom, že obě období mohla mít odlišný průběh teplot. Efekt optimalizace se tak hodnotí technicky, a nikoli pouze podle hrubých součtů spotřeby.',
    'Po sprowadzeniu zużycia obu okresów do wspólnej bazy (TYM) oszczędność energii wynika wprost z różnicy zużycia skorygowanego PRZED i PO wdrożeniu — niezależnie od tego, czy dany sezon był cieplejszy, czy chłodniejszy od normy. Wartość oszczędności oraz jej podział pomiędzy WaterAI/ESCO a klienta zależą od przyjętego sposobu wyceny energii.':
      'Po převedení spotřeby obou období na společný základ (TMR) vyplývá úspora energie přímo z rozdílu korigované spotřeby PŘED a PO nasazení — bez ohledu na to, zda byla daná sezona teplejší či chladnější než norma. Hodnota úspor a její rozdělení mezi WaterAI/ESCO a klienta závisí na zvoleném způsobu ocenění energie.',
    'W celu zapewnienia porównywalności wyników zużycie ciepła w analizowanych okresach przelicza się do warunków standardowych, odpowiadających Typowemu Rokowi Meteorologicznemu (TYM). Korekta polega na przemnożeniu rzeczywistego zużycia ciepła na potrzeby centralnego ogrzewania przez współczynnik korekcyjny φ.':
      'Pro zajištění srovnatelnosti výsledků se spotřeba tepla v analyzovaných obdobích přepočítává na standardní podmínky odpovídající Typickému meteorologickému roku (TMR). Korekce spočívá ve vynásobení skutečné spotřeby tepla pro potřeby ústředního vytápění korekčním součinitelem φ.',
    'Dzięki temu zużycie energii w okresie bazowym (PRZED) oraz po wdrożeniu systemu (PO) zostaje sprowadzone do porównywalnego poziomu obłożenia. Eliminuje to wpływ różnic w intensywności użytkowania obiektu pomiędzy analizowanymi okresami i pozwala na wiarygodne określenie rzeczywistych efektów wdrożenia.':
      'Spotřeba energie v základním období (PŘED) a po nasazení systému (PO) se tím převede na srovnatelnou úroveň obsazenosti. Odstraní se tak vliv rozdílů v intenzitě užívání objektu mezi analyzovanými obdobími a umožní se věrohodné určení skutečných přínosů nasazení.',
    'Podstawą rozliczenia finansowego jest metoda korekty zużycia do poziomu obłożenia obiektu. Wykorzystuje ona rzeczywiste dane o zużyciu energii pozyskane z liczników lub faktur, które są normalizowane względem miary obłożenia (np. liczby osobodni lub udziału wykorzystanych pokoi) w analizowanym okresie.':
      'Základem finančního vyúčtování je metoda korekce spotřeby na úroveň obsazenosti objektu. Využívá skutečné údaje o spotřebě energie získané z měřidel nebo faktur, které se normalizují vůči míře obsazenosti (např. počtu osobodnů nebo podílu využitých pokojů) v analyzovaném období.',
    'p.p. jest oczekiwana i nie świadczy o błędzie żadnej z metod — mierzą one różne wielkości: metoda rozliczeniowa porównuje całkowite zużycie okresu (wraz z efektami harmonogramów i dni bez ogrzewania), regresja — czystą intensywność na jednostkę temperatury zewnętrznej, uśrednioną po przyjętym zakresie.':
      'p. b. je očekávaný a nesvědčí o chybě žádné z metod — měří rozdílné veličiny: zúčtovací metoda porovnává celkovou spotřebu období (včetně vlivu harmonogramů a dnů bez vytápění), regrese pak čistou intenzitu na jednotku venkovní teploty, zprůměrovanou přes zvolený rozsah.',
    'Dzięki temu zużycie energii w okresie bazowym (PRZED) oraz po wdrożeniu systemu (PO) zostaje sprowadzone do porównywalnej powierzchni odniesienia. Eliminuje to wpływ zmian zakresu ogrzewanej powierzchni pomiędzy analizowanymi okresami i pozwala na wiarygodne określenie rzeczywistych efektów wdrożenia.':
      'Spotřeba energie v základním období (PŘED) a po nasazení systému (PO) se tím převede na srovnatelnou vztažnou plochu. Odstraní se tak vliv změn rozsahu vytápěné plochy mezi analyzovanými obdobími a umožní se věrohodné určení skutečných přínosů nasazení.',
    'Dzięki temu zużycie energii w okresie bazowym (PRZED) oraz po wdrożeniu systemu (PO) zostaje sprowadzone do porównywalnego harmonogramu pracy. Eliminuje to wpływ różnic w czasie eksploatacji obiektu pomiędzy analizowanymi okresami i pozwala na wiarygodne określenie rzeczywistych efektów wdrożenia.':
      'Spotřeba energie v základním období (PŘED) a po nasazení systému (PO) se tím převede na srovnatelný harmonogram provozu. Odstraní se tak vliv rozdílů v době provozu objektu mezi analyzovanými obdobími a umožní se věrohodné určení skutečných přínosů nasazení.',
    'Do kwoty udziału WaterAI/ESCO zostanie doliczony podatek VAT według stawki obowiązującej w dniu wystawienia faktury. Kwota udziału WaterAI/ESCO stanowi podstawę do wystawienia faktury za oszczędności osiągnięte w okresie rozliczeniowym; pozostała część wartości oszczędności przypada klientowi.':
      'K částce podílu WaterAI/ESCO bude připočtena DPH podle sazby platné ke dni vystavení faktury. Částka podílu WaterAI/ESCO tvoří základ pro vystavení faktury za úspory dosažené v zúčtovacím období; zbývající část hodnoty úspor připadá klientovi.',
    'Dzięki temu zużycie energii w okresie bazowym (PRZED) oraz po wdrożeniu systemu (PO) zostaje przeliczone do identycznych warunków pogodowych. Eliminuje to wpływ różnic klimatycznych pomiędzy analizowanymi sezonami grzewczymi i pozwala na wiarygodne określenie rzeczywistych efektów wdrożenia.':
      'Spotřeba energie v základním období (PŘED) a po nasazení systému (PO) se tím přepočte na shodné povětrnostní podmínky. Odstraní se tak vliv klimatických rozdílů mezi analyzovanými otopnými sezonami a umožní se věrohodné určení skutečných přínosů nasazení.',
    'Dzięki temu zużycie energii w okresie bazowym (PRZED) oraz po wdrożeniu systemu (PO) zostaje sprowadzone do porównywalnych warunków odniesienia. Eliminuje to wpływ różnic warunków eksploatacji pomiędzy analizowanymi okresami i pozwala na wiarygodne określenie rzeczywistych efektów wdrożenia.':
      'Spotřeba energie v základním období (PŘED) a po nasazení systému (PO) se tím převede na srovnatelné vztažné podmínky. Odstraní se tak vliv rozdílů provozních podmínek mezi analyzovanými obdobími a umožní se věrohodné určení skutečných přínosů nasazení.',
    'Dzięki temu zużycie energii w okresie bazowym (PRZED) oraz po wdrożeniu systemu (PO) zostaje sprowadzone do porównywalnej intensywności pracy. Eliminuje to wpływ różnic w obciążeniu obiektu pomiędzy analizowanymi okresami i pozwala na wiarygodne określenie rzeczywistych efektów wdrożenia.':
      'Spotřeba energie v základním období (PŘED) a po nasazení systému (PO) se tím převede na srovnatelnou intenzitu provozu. Odstraní se tak vliv rozdílů v zatížení objektu mezi analyzovanými obdobími a umožní se věrohodné určení skutečných přínosů nasazení.',
    'Podstawą rozliczenia finansowego jest metoda korekty zużycia do harmonogramu pracy obiektu. Wykorzystuje ona rzeczywiste dane o zużyciu energii pozyskane z liczników lub faktur, normalizowane względem czasu i trybu pracy instalacji (np. godzin lub dni eksploatacji) w analizowanym okresie.':
      'Základem finančního vyúčtování je metoda korekce spotřeby na harmonogram provozu objektu. Využívá skutečné údaje o spotřebě energie získané z měřidel nebo faktur, normalizované vůči době a režimu provozu soustavy (např. hodinám nebo dnům provozu) v analyzovaném období.',
    'w którym instalacja pracowała w dotychczasowym trybie pogodowym — dane z czujników nie istnieją sprzed montażu, dlatego okres odniesienia regresji jest krótszy niż okres bazowy metody rozliczeniowej, oparty na danych rozliczeniowych z pełnego okresu poprzedzającego wdrożenie':
      've kterém soustava pracovala v dosavadním ekvitermním režimu — údaje ze snímačů z doby před montáží neexistují, proto je vztažné období regrese kratší než základní období zúčtovací metody, opřené o zúčtovací data z celého období předcházejícího nasazení',
    'Podstawą rozliczenia finansowego jest metoda korekty zużycia do intensywności pracy obiektu. Wykorzystuje ona rzeczywiste dane o zużyciu energii pozyskane z liczników lub faktur, normalizowane względem przyjętej bazy intensywności charakteryzującej obciążenie cieplne obiektu.':
      'Základem finančního vyúčtování je metoda korekce spotřeby na intenzitu provozu objektu. Využívá skutečné údaje o spotřebě energie získané z měřidel nebo faktur, normalizované vůči zvolenému základu intenzity charakterizujícímu tepelné zatížení objektu.',
    'Podstawą rozliczenia finansowego jest metoda korekty zużycia do warunków Typowego Roku Meteorologicznego (TYM). Wykorzystuje ona rzeczywiste dane o zużyciu energii pozyskane z liczników lub faktur, które następnie są normalizowane z wykorzystaniem stopniodni grzewczych (HDD).':
      'Základem finančního vyúčtování je metoda korekce spotřeby na podmínky Typického meteorologického roku (TMR). Využívá skutečné údaje o spotřebě energie získané z měřidel nebo faktur, které se následně normalizují pomocí topných denostupňů (HDD).',
    '— obliczane na podstawie średnich temperatur zewnętrznych pochodzących z Typowego Roku Meteorologicznego (TYM) dla lokalizacji obiektu. Wartość ta odzwierciedla standardowe warunki pogodowe, do których przelicza się zużycie ciepła w celu zapewnienia porównywalności wyników.':
      '— počítané na základě průměrných venkovních teplot z Typického meteorologického roku (TMR) pro lokalitu objektu. Tato hodnota vyjadřuje standardní povětrnostní podmínky, na které se spotřeba tepla přepočítává, aby byly výsledky srovnatelné.',
    'Podstawą rozliczenia finansowego jest indywidualnie zdefiniowana metoda korekty zużycia, dobrana do specyfiki obiektu. Wykorzystuje ona rzeczywiste dane o zużyciu energii pozyskane z liczników lub faktur, normalizowane względem przyjętej w analizie bazy odniesienia.':
      'Základem finančního vyúčtování je individuálně definovaná metoda korekce spotřeby, přizpůsobená specifikům objektu. Využívá skutečné údaje o spotřebě energie získané z měřidel nebo faktur, normalizované vůči vztažnému základu zvolenému v analýze.',
    'Podstawą rozliczenia finansowego jest metoda korekty zużycia do powierzchni ogrzewanej obiektu. Wykorzystuje ona rzeczywiste dane o zużyciu energii pozyskane z liczników lub faktur, odniesione do powierzchni użytkowej (zużycie na jednostkę powierzchni).':
      'Základem finančního vyúčtování je metoda korekce spotřeby na vytápěnou plochu objektu. Využívá skutečné údaje o spotřebě energie získané z měřidel nebo faktur, vztažené k užitné ploše (spotřeba na jednotku plochy).',
    'prognozowane zużycie roczne = q × suma standardowych stopniodni pełnego sezonu. Zestawienie porównuje zużycie roczne przy charakterystyce energetycznej okresu bazowego (bez technologii) i okresu po wdrożeniu (z technologią WaterAI).':
      'prognózovaná roční spotřeba = q × součet standardních denostupňů celé sezony. Přehled porovnává roční spotřebu při energetické charakteristice základního období (bez technologie) a období po nasazení (s technologií WaterAI).',
    'Po sprowadzeniu obu okresów do warunków Typowego Roku Meteorologicznego wynik nie zależy już od różnic pogody między sezonami. Pozostaje jednak różnica długości — okres PRZED (baza) obejmuje znacznie dłuższy przedział niż okres PO.':
      'Po převedení obou období na podmínky Typického meteorologického roku již výsledek nezávisí na rozdílech počasí mezi sezonami. Zůstává však rozdíl délky — období PŘED (základ) zahrnuje podstatně delší interval než období PO.',
    '(energia + przesył i pozostałe składowe redukowane przez WaterAI). Wartość oszczędności = koszt bazowy × procent oszczędności; dopiero ta kwota jest dzielona pomiędzy WaterAI/ESCO i klienta. Opis trafia do analizy i raportu ESCO.':
      '(energie + rozvod a ostatní složky snižované systémem WaterAI). Hodnota úspor = základní náklad × procento úspor; teprve tato částka se dělí mezi WaterAI/ESCO a klienta. Popis se přenáší do analýzy a zprávy ESCO.',
    'Tabela i wykresy budują się dla wybranego zakresu T zewnętrznej. Domyślnie −15…+10°C, krok 1°C — dostosuj wedle potrzeby. Wartości to przewidywania linii bazowej (PRZED) y = a·t + b oraz ich średnie.':
      'Tabulka a grafy se sestavují pro zvolený rozsah venkovní T. Výchozí nastavení −15…+10 °C, krok 1 °C — upravte podle potřeby. Hodnoty jsou predikce základní přímky (PŘED) y = a·t + b a jejich průměry.',
    'Dla każdego miesiąca stopniodni oblicza się jako iloczyn liczby dni ogrzewania w danym miesiącu oraz różnicy pomiędzy przyjętą temperaturą wewnętrzną w obiekcie a średnią temperaturą zewnętrzną:':
      'Pro každý měsíc se denostupně počítají jako součin počtu topných dnů v daném měsíci a rozdílu mezi zvolenou vnitřní teplotou v objektu a průměrnou venkovní teplotou:',
    'Metoda techniczna PRZED/PO (równania y = ax + b dla temperatury zasilania i zużycia). Arkusz zostanie podpięty do tego kreatora — przepływ typ → klient/obiekt → dane → wykonaj jest już wspólny.':
      'Technická metoda PŘED/PO (rovnice y = ax + b pro teplotu přívodu a spotřebu). List bude připojen k tomuto průvodci — postup typ → klient/objekt → data → provést je již společný.',
    'Wskaż osobę wykonującą analizę w polu „Wykonał — Energy Analyst". Analizę może wykonać wyłącznie użytkownik z rolą Energy Analyst (dodaj go w module Użytkownicy, jeśli lista jest pusta).':
      'Určete osobu provádějící analýzu v poli „Provedl — Energy Analyst". Analýzu může provést výhradně uživatel s rolí Energy Analyst (přidejte jej v modulu Uživatelé, pokud je seznam prázdný).',
    'Upewnij się, że okres bazowy ma policzone linie (przycisk „Kopiuj dane", Metoda 1/2) i że zaimportowany okres analizowany ma kolumny temperatury zewnętrznej, zasilania oraz zużycia.':
      'Ujistěte se, že základní období má vypočtené přímky (tlačítko „Kopírovat data", Metoda 1/2) a že importované analyzované období má sloupce venkovní teploty, teploty přívodu a spotřeby.',
    'Wskaż zapisany okres bazowy z arkusza regresji. Następnie wybierzesz metodę (1/2), skopiujesz dane bazowe, zaimportujesz okres analizowany (CSV) i podasz zakres rozliczeniowy.':
      'Vyberte uložené základní období z regresního listu. Následně zvolíte metodu (1/2), zkopírujete základní data, naimportujete analyzované období (CSV) a zadáte zúčtovací rozsah.',
    'Załączniki zawierają pełne wyprowadzenia, tabele danych źródłowych i wykresy; wyniki końcowe oraz rozliczenie przedstawiono w części głównej raportu.':
      'Přílohy obsahují úplná odvození, tabulky zdrojových dat a grafy; konečné výsledky a vyúčtování jsou uvedeny v hlavní části zprávy.',
    'Wybierz klienta i obiekt, zaznacz powiązane analizy (TYM, regresja, obłożenie itd.) i wykonaj raport ESCO. Raport jest podstawą do wystawienia faktury za oszczędności.':
      'Vyberte klienta a objekt, označte související analýzy (TMR, regrese, obsazenost atd.) a vytvořte zprávu ESCO. Zpráva je podkladem pro vystavení faktury za úspory.',
    'porównuje CAŁKOWITE zużycie sprowadzone do tego samego poziomu obłożenia obiektu — obejmuje pełny efekt eksploatacyjny; to podstawa faktur.':
      'porovnává CELKOVOU spotřebu převedenou na stejnou úroveň obsazenosti objektu — zahrnuje plný provozní efekt; je to podklad faktur.',
    'porównuje CAŁKOWITE zużycie sprowadzone do tego samego harmonogramu pracy — obejmuje pełny efekt eksploatacyjny; to podstawa faktur.':
      'porovnává CELKOVOU spotřebu převedenou na stejný harmonogram provozu — zahrnuje plný provozní efekt; je to podklad faktur.',
    'Dla korekty intensywności okres PRZED instalacją oraz zakres dat zostaną wczytane z wybranego protokołu bazowego. Możesz też wybrać „✏️ Ręczne wprowadzenie".':
      'Pro korekci intenzity se období PŘED instalací a rozsah dat načtou ze zvoleného základního protokolu. Můžete také zvolit „✏️ Ruční zadání".',
    'Brak policzonych linii bazowych lub danych okresu analizowanego. Otwórz analizę w kreatorze i uzupełnij dane (Metoda 1/2 + import CSV okresu analizowanego).':
      'Chybí vypočtené základní přímky nebo data analyzovaného období. Otevřete analýzu v průvodci a doplňte data (Metoda 1/2 + import CSV analyzovaného období).',
    'Oszczędność = Qs(PRZED) − Qs(PO) — różnica liczona przy tej samej, referencyjnej intensywności, więc wynik jest niezależny od zmian obłożenia/produkcji.':
      'Úspora = Qs(PŘED) − Qs(PO) — rozdíl počítaný při stejné referenční intenzitě, výsledek je proto nezávislý na změnách obsazenosti/produkce.',
    'Standardowy sezon ogrzewczy oraz dane okresu PRZED instalacją zostaną wczytane z wybranego protokołu bazowego. Możesz też wybrać „✏️ Ręczne wprowadzenie".':
      'Standardní otopná sezona a data období PŘED instalací se načtou ze zvoleného základního protokolu. Můžete také zvolit „✏️ Ruční zadání".',
    'porównuje CAŁKOWITE zużycie sprowadzone do tej samej intensywności pracy obiektu — obejmuje pełny efekt; to podstawa faktur.':
      'porovnává CELKOVOU spotřebu převedenou na stejnou intenzitu provozu objektu — zahrnuje plný efekt; je to podklad faktur.',
    'porównuje CAŁKOWITE zużycie sprowadzone do tych samych warunków pogodowych — obejmuje efekty dzienne i sezonowe; to podstawa faktur.':
      'porovnává CELKOVOU spotřebu převedenou na stejné povětrnostní podmínky — zahrnuje denní i sezonní efekty; je to podklad faktur.',
    'w każdej metryce (Zużycie / Temperatura zasilania) — nie wpływa to na drugą tabelę ani jej wykresy. Kliknij „Odczyt" lub „Odchyłka", aby sortować ↑/↓.':
      'v každé metrice (Spotřeba / Teplota přívodu) — neovlivňuje to druhou tabulku ani její grafy. Klikněte na „Odečet" nebo „Odchylka" pro řazení ↑/↓.',
    'Weryfikacja regresją obejmuje część okna rozliczeniowego, według danych pomiarowych dostępnych na dzień sporządzenia analizy technicznej.':
      'Ověření regresí zahrnuje část zúčtovacího okna, podle měřených dat dostupných ke dni zpracování technické analýzy.',
    'porównuje CAŁKOWITE zużycie odniesione do tej samej powierzchni ogrzewanej — obejmuje pełny efekt; to podstawa faktur.':
      'porovnává CELKOVOU spotřebu vztaženou ke stejné vytápěné ploše — zahrnuje plný efekt; je to podklad faktur.',
    'porównuje CAŁKOWITE zużycie sprowadzone do przyjętej bazy odniesienia — obejmuje pełny efekt; to podstawa faktur.':
      'porovnává CELKOVOU spotřebu převedenou na zvolený vztažný základ — zahrnuje plný efekt; je to podklad faktur.',
    'Zgodność dwóch niezależnych metod, opartych na różnych źródłach danych (licznik główny vs czujniki), wzajemnie potwierdza wiarygodność wyniku.':
      'Shoda dvou nezávislých metod, opřených o různé zdroje dat (hlavní měřidlo vs snímače), vzájemně potvrzuje věrohodnost výsledku.',
    '— regresja przez średnie wartości per stopień T zewnętrznej (jak linia trendu w Excelu; czarne kropki = średnie). Zużycie = przyrost licznika':
      '— regrese přes průměrné hodnoty na stupeň venkovní T (jako spojnice trendu v Excelu; černé tečky = průměry). Spotřeba = přírůstek měřidla',
    'Metoda 2 — dopasowanie do średnich wartości na każdy zaokrąglony stopień temperatury zewnętrznej (jak linia trendu w arkuszu referencyjnym)':
      'Metoda 2 — proložení průměrných hodnot pro každý zaokrouhlený stupeň venkovní teploty (jako spojnice trendu v referenčním listu)',
    'Import plików Excel (.xlsx) wymaga biblioteki SheetJS — aktualnie wspierany format to CSV. Zapisz plik Excel jako CSV i spróbuj ponownie.':
      'Import souborů Excel (.xlsx) vyžaduje knihovnu SheetJS — aktuálně podporovaný formát je CSV. Uložte soubor Excel jako CSV a zkuste to znovu.',
    'Metoda korekty intensywności stanowi podstawę rozliczeń kontraktowych oraz wyliczenia oszczędności będących podstawą wystawienia faktury.':
      'Metoda korekce intenzity tvoří základ smluvního vyúčtování a výpočtu úspor, které jsou podkladem pro vystavení faktury.',
    'Metoda korekty harmonogramu stanowi podstawę rozliczeń kontraktowych oraz wyliczenia oszczędności będących podstawą wystawienia faktury.':
      'Metoda korekce harmonogramu tvoří základ smluvního vyúčtování a výpočtu úspor, které jsou podkladem pro vystavení faktury.',
    'Metoda korekty powierzchni stanowi podstawę rozliczeń kontraktowych oraz wyliczenia oszczędności będących podstawą wystawienia faktury.':
      'Metoda korekce plochy tvoří základ smluvního vyúčtování a výpočtu úspor, které jsou podkladem pro vystavení faktury.',
    'Metoda korekty obłożenia stanowi podstawę rozliczeń kontraktowych oraz wyliczenia oszczędności będących podstawą wystawienia faktury.':
      'Metoda korekce obsazenosti tvoří základ smluvního vyúčtování a výpočtu úspor, které jsou podkladem pro vystavení faktury.',
    'Wartość oszczędności = koszt bazowy × procent oszczędności; dopiero ta kwota jest dzielona pomiędzy WaterAI/ESCO i klienta.':
      'Hodnota úspor = základní náklad × procento úspor; teprve tato částka se dělí mezi WaterAI/ESCO a klienta.',
    'Wpisz ręcznie średnie temperatury miesięczne z WeatherOnline / Robot Klimatu. Dni uzupełniane automatycznie, można korygować.':
      'Zadejte ručně průměrné měsíční teploty z WeatherOnline / Robot Klimatu. Dny se doplňují automaticky, lze je upravit.',
    'Przyjęta metoda stanowi podstawę rozliczeń kontraktowych oraz wyliczenia oszczędności będących podstawą wystawienia faktury.':
      'Zvolená metoda tvoří základ smluvního vyúčtování a výpočtu úspor, které jsou podkladem pro vystavení faktury.',
    'Najpierw określ metodę. Po wyborze typu kliknij „+ Nowa analiza", aby przejść do wyboru klienta, obiektu i okresu bazowego.':
      'Nejprve určete metodu. Po výběru typu klikněte na „+ Nová analýza" a přejděte k výběru klienta, objektu a základního období.',
    '2 · Uzupełnij klienta, obiekt i okres bazowy, wprowadź dane, a następnie kliknij „Wykonaj analizę" na dole.':
      '2 · Doplňte klienta, objekt a základní období, zadejte data a poté klikněte dole na „Provést analýzu".',
    'Na teraz wspierany jest import CSV (jak w „Dane z czujników"). Zapisz Excel jako CSV i spróbuj ponownie.':
      'Zatím je podporován import CSV (jako v „Data ze snímačů"). Uložte Excel jako CSV a zkuste to znovu.',
    'Wsk = I·z₀ · φ = ΣWsk_ref / ΣWsk_rzecz · Qs = Q·φ (zużycie sprowadzone do referencyjnej intensywności)':
      'Uk = I·z₀ · φ = ΣUk_ref / ΣUk_skut · Qs = Q·φ (spotřeba převedená na referenční intenzitu)',
    'Odchyłki = błędne/odstające odczyty (odporna detekcja MAD względem stabilnego trendu). Lista liczona':
      'Odchylky = chybné/odlehlé odečty (robustní detekce MAD vůči stabilnímu trendu). Seznam počítán',
    'dla każdego stopnia odczytuje się wartość z obu prostych i liczy ich różnicę, a wyniki uśrednia.':
      'pro každý stupeň se odečte hodnota z obou přímek, vypočte se jejich rozdíl a výsledky se zprůměrují.',
    'Bez profilu to konto NIE zaloguje się do aplikacji — spróbuj dodać je ponownie lub zgłoś problem.':
      'Bez profilu se tento účet NEPŘIHLÁSÍ do aplikace — zkuste jej přidat znovu nebo nahlaste problém.'
  };

  function install() {
    const api = window.DomainI18n;
    if (!api || !api.dict) {
      console.warn('[i18n-cs-backfill] Brak window.DomainI18n — ładuj PO i18n-domain.js.');
      return false;
    }
    const d = api.dict.cs || (api.dict.cs = {});
    let added = 0;
    for (const k in CS) if (!(k in d)) { d[k] = CS[k]; added++; }
    console.info('[i18n-cs-backfill] Dopisano kluczy czeskich: ' + added +
                 ' (razem cs: ' + Object.keys(d).length + ')');
    if (typeof api.apply === 'function') api.apply();
    return true;
  }

  if (!install()) document.addEventListener('DOMContentLoaded', install);
})();

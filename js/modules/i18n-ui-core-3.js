// ─────────────────────────────────────────────────────────────────────────
// i18n-ui-core-3.js — korekta spójności akronimów w słowackim.
//
// Audyt po partii 2 pokazał, że 32 słowackie tłumaczenia (ze starszych plików
// słownikowych) zostawiały POLSKI akronim „TYM" — Typowy Rok Meteorologiczny.
// Czeski, angielski, niemiecki i hiszpański miały już swoje odpowiedniki
// (TMR / TMY / TRJ), więc słowacka faktura i raport ESCO wyglądały tak, jakby
// część terminologii została po polsku. Ten plik nadpisuje te 32 wpisy
// wersjami z „TMR" (Typický meteorologický rok).
//
// UWAGA: w odróżnieniu od pozostałych plików i18n ten ŚWIADOMIE NADPISUJE
// istniejące klucze — po to powstał. Musi być ładowany jako OSTATNI słownik.
// ─────────────────────────────────────────────────────────────────────────
(function () {
  'use strict';

  // [ klucz polski, poprawione tłumaczenie słowackie ]
  const SK_TMR = [
    ["Po sprowadzeniu zużycia obu okresów do wspólnej bazy (TYM) oszczędność energii wynika wprost z różnicy zużycia skorygowanego PRZED i PO wdrożeniu — niezależnie od tego, czy dany sezon był cieplejszy, czy chłodniejszy od normy. Wartość oszczędności oraz jej podział pomiędzy WaterAI/ESCO a klienta zależą od przyjętego sposobu wyceny energii.", "Po prevedení spotreby oboch období na spoločnú bázu (TMR) vyplýva úspora energie priamo z rozdielu korigovanej spotreby PRED a PO implementácii — nezávisle od toho, či bola daná sezóna teplejšia alebo chladnejšia ako norma. Hodnota úspor a jej rozdelenie medzi WaterAI/ESCO a klienta závisia od prijatého spôsobu ocenenia energie."],
    ["W celu zapewnienia porównywalności wyników zużycie ciepła w analizowanych okresach przelicza się do warunków standardowych, odpowiadających Typowemu Rokowi Meteorologicznemu (TYM). Korekta polega na przemnożeniu rzeczywistego zużycia ciepła na potrzeby centralnego ogrzewania przez współczynnik korekcyjny φ.", "Na zabezpečenie porovnateľnosti výsledkov sa spotreba tepla v analyzovaných obdobiach prepočítava na štandardné podmienky zodpovedajúce Typickému meteorologickému roku (TMR). Korekcia spočíva vo vynásobení skutočnej spotreby tepla na potreby ústredného vykurovania korekčným koeficientom φ."],
    ["Współczynnik korekcyjny φ służy do przeliczenia zużycia energii cieplnej z warunków rzeczywistych na warunki standardowe, odpowiadające Typowemu Rokowi Meteorologicznemu (TYM). Uwzględnia różnice pomiędzy rzeczywistymi warunkami pogodowymi w analizowanym okresie a warunkami standardowymi.", "Korekčný koeficient φ slúži na prepočet spotreby tepelnej energie zo skutočných podmienok na štandardné podmienky zodpovedajúce Typickému meteorologickému roku (TMR). Zohľadňuje rozdiely medzi skutočnými poveternostnými podmienkami v analyzovanom období a štandardnými podmienkami."],
    ["Podstawą rozliczenia finansowego jest metoda korekty zużycia do warunków Typowego Roku Meteorologicznego (TYM). Wykorzystuje ona rzeczywiste dane o zużyciu energii pozyskane z liczników lub faktur, które następnie są normalizowane z wykorzystaniem stopniodni grzewczych (HDD).", "Základom finančného vyúčtovania je metóda korekcie spotreby na podmienky Typického meteorologického roka (TMR). Využíva skutočné údaje o spotrebe energie získané z meračov alebo faktúr, ktoré sú následne normalizované s využitím vykurovacích dennostupňov (HDD)."],
    ["— obliczane na podstawie średnich temperatur zewnętrznych pochodzących z Typowego Roku Meteorologicznego (TYM) dla lokalizacji obiektu. Wartość ta odzwierciedla standardowe warunki pogodowe, do których przelicza się zużycie ciepła w celu zapewnienia porównywalności wyników.", "— počítané na základe priemerných vonkajších teplôt pochádzajúcich z Typického meteorologického roka (TMR) pre lokalitu objektu. Táto hodnota odráža štandardné poveternostné podmienky, na ktoré sa prepočítava spotreba tepla s cieľom zabezpečiť porovnateľnosť výsledkov."],
    ["Wyświetlane są wszystkie analizy przypisane do wybranego obiektu (korekta TYM, regresja liniowa, korekta obłożenia, powierzchni i pozostałe). Zaznacz te, które mają wejść do raportu.", "Zobrazujú sa všetky analýzy priradené k zvolenému objektu (korekcia TMR, lineárna regresia, korekcia obsadenosti, plochy a ostatné). Označte tie, ktoré majú vstúpiť do reportu."],
    ["Wybierz klienta i obiekt, zaznacz powiązane analizy (TYM, regresja, obłożenie itd.) i wykonaj raport ESCO. Raport jest podstawą do wystawienia faktury za oszczędności.", "Vyberte klienta a objekt, označte súvisiace analýzy (TMR, regresia, obsadenosť atď.) a vykonajte ESCO report. Report je základom pre vystavenie faktúry za úspory."],
    ["Zbiorcze rozliczenie oszczędności energii — metoda główna TYM (stopniodni), weryfikacja metodą pomocniczą (regresja liniowa)", "Súhrnné vyúčtovanie úspor energie — hlavná metóda TMR (dennostupne), overenie pomocnou metódou (lineárna regresia)"],
    ["— zakłada utrzymanie charakterystyki energetycznej obu okresów oraz typowe warunki pogodowe (TYM).", "— predpokladá zachovanie energetickej charakteristiky oboch období a typické poveternostné podmienky (TMR)."],
    ["— suma stopniodni z temperatur Typowego Roku Meteorologicznego (TYM),", "— súčet dennostupňov z teplôt Typického meteorologického roka (TMR),"],
    ["Metoda korekty stopniodni — Typowy Rok Meteorologiczny (TYM)", "Metóda korekcie dennostupňov — Typický meteorologický rok (TMR)"],
    ["Stopniodni grzewcze (SD) — rzeczywiste i standardowe (TYM)", "Vykurovacie dennostupne (SD) — skutočné a štandardné (TMR)"],
    ["Temperatury rzeczywiste i normy standardowe (TYM) —", "Skutočné teploty a štandardné normy (TMR) —"],
    ["Pomiary, analizy, protokoły TYM, raporty ESCO.", "Merania, analýzy, protokoly TMR, ESCO reporty."],
    ["📋 Kopiuj TYM z poprzedniego protokołu", "📋 Kopírovať TMR z predchádzajúceho protokolu"],
    ["🌍 Typowy rok meteorologiczny (TYM)", "🌍 Typický meteorologický rok (TMR)"],
    ["Okres TYM do (rok)", "Obdobie TMR do (rok)"],
    ["Okres TYM od (rok)", "Obdobie TMR od (rok)"],
    ["Śr. temp. TYM (°C)", "Priem. teplota TMR (°C)"],
    ["Źródło danych TYM", "Zdroj údajov TMR"],
    ["Korekta TYM", "Korekcia TMR"],
    ["Typowy rok meteorologiczny (TYM)", "Typický meteorologický rok (TMR)"],
    ["Dane klimatyczne (TYM)", "Klimatické údaje (TMR)"],
    ["Temp. TYM (°C)", "Teplota TMR (°C)"],
    ["Automatycznie po dodaniu protokołu TYM z dn.", "Automaticky po pridaní protokolu TMR z dňa"],
    ["Dane wejściowe: temperatury i dni z okresu porównawczego protokołu TYM.", "Vstupné údaje: teploty a dni z porovnávacieho obdobia protokolu TMR."],
    ["Metoda TYM stanowi podstawę rozliczeń kontraktowych oraz wyliczenia oszczędności będących podstawą wystawienia faktury.", "Metóda TMR je základom zmluvných vyúčtovaní a výpočtu úspor, ktoré sú podkladom pre vystavenie faktúry."],
    ["korekta do Typowego Roku Meteorologicznego (TYM)", "korekcia na Typický meteorologický rok (TMR)"],
    ["SD standard (TYM)", "SD štandard (TMR)"],
    ["Stopniodni: rzeczywiste vs standard (TYM)", "Dennostupne: skutočné vs štandard (TMR)"],
    ["t TYM", "t TMR"],
    ["🔥 HDD TYM:", "🔥 HDD TMR:"]
  ];

  function install() {
    const api = window.DomainI18n;
    if (!api || !api.dict) {
      console.warn('[i18n-ui-core-3] Brak window.DomainI18n — plik musi być ładowany PO i18n-domain.js.');
      return false;
    }
    const d = api.dict.sk || (api.dict.sk = {});
    let n = 0;
    for (const [pl, sk] of SK_TMR) { d[pl] = sk; n++; }   // nadpisanie zamierzone
    console.info('[i18n-ui-core-3] Ujednolicono akronim TYM→TMR w słowackim:', n, 'wpisów');
    if (typeof api.apply === 'function') api.apply();
    return true;
  }

  if (!install()) document.addEventListener('DOMContentLoaded', install);
})();

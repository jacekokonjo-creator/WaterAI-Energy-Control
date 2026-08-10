// ─────────────────────────────────────────────────────────────────────────
// i18n-invoicing.js — słowacki i czeski dla modułu Faktury, panelu Podmiotów
// i dokumentu do druku (moduły powstałe 2026-08-08, nieobjęte i18n-domain.js).
//
// Rozszerza słowniki z i18n-domain.js zamiast je duplikować: dopisuje klucze do
// window.DomainI18n.dict.<lang>. Ładowany PO i18n-domain.js.
// Klucz = dokładny tekst polski widoczny w interfejsie.
//
// Terminologia zgodna z istniejącym słownikiem (Netto/Brutto zostają, „Správy/Zprávy
// ESCO", „Splatnosť/Splatnost"), a nazwy stron faktury wg praktyki SK/CZ:
// Sprzedawca → Dodávateľ / Dodavatel, Nabywca → Odberateľ / Odběratel.
// ─────────────────────────────────────────────────────────────────────────
(function () {
  'use strict';

  const SK = {
    // ── moduł Faktury: lista i formularz ──
    'Faktura': 'Faktúra',
    'Korekta': 'Opravná faktúra',
    'Faktura zaliczkowa': 'Zálohová faktúra',
    'Rozliczenie ESCO': 'Vyúčtovanie ESCO',
    'Projekt': 'Návrh',
    'Wystawiona': 'Vystavená',
    'Opłacona': 'Uhradená',
    'Częściowo opłacona': 'Čiastočne uhradená',
    'Po terminie': 'Po splatnosti',
    'Nr faktury': 'Č. faktúry',
    'Numer faktury': 'Číslo faktúry',
    'Typ faktury': 'Typ faktúry',
    'Podmiot': 'Subjekt',
    'Data wyst.': 'Dátum vyst.',
    'Termin płat.': 'Splatnosť',
    'Akcje': 'Akcie',
    'Zapisz fakturę': 'Uložiť faktúru',
    'Edytuj fakturę': 'Upraviť faktúru',
    'Usuń fakturę?': 'Odstrániť faktúru?',
    'Wybierz klienta.': 'Vyberte klienta.',
    'Podaj kwotę netto.': 'Zadajte sumu netto.',
    '✓ Oznacz jako opłaconą': '✓ Označiť ako uhradenú',
    'Obiekt (opcjonalnie)': 'Objekt (voliteľné)',
    'Uwagi': 'Poznámky',
    'Kraj': 'Krajina',
    'Kwota netto': 'Suma netto',
    'Telefon': 'Telefón',

    // ── podstawa faktury (analiza / raport ESCO) ──
    'Podmiot wystawiający (sprzedawca)': 'Vystavovateľ (dodávateľ)',
    '— nie wskazano —': '— neurčené —',
    'Podstawa faktury — analiza / raport ESCO (opcjonalnie)': 'Podklad faktúry — analýza / správa ESCO (voliteľné)',
    '— brak (faktura ręczna) —': '— žiadny (ručná faktúra) —',
    'PODPOWIEDŹ Z:': 'NÁVRH Z:',
    'Sugerowane netto': 'Navrhovaná suma netto',
    'Udział WaterAI/ESCO': 'Podiel WaterAI/ESCO',
    'Pola na żółtym tle są podpowiedziami — możesz je swobodnie nadpisać, zapisana zostanie Twoja wartość.':
      'Polia so žltým pozadím sú návrhy — pokojne ich prepíšte, uloží sa vaša hodnota.',
    '⚠ Ta podstawa nie ma policzonej kwoty udziału ESCO': '⚠ Tento podklad nemá vypočítanú sumu podielu ESCO',
    '(analizy w raporcie mają różne udziały)': '(analýzy v správe majú rôzne podiely)',
    '— wpisz kwotę netto ręcznie.': '— zadajte sumu netto ručne.',
    '⚠ Z tej podstawy wystawiono już': '⚠ Z tohto podkladu už bola vystavená',
    'Raport ESCO': 'Správa ESCO',
    'faktur': 'faktúr',
    'podmiotów wystawiających': 'vystavovateľov',
    'Podstawa faktury': 'Podklad faktúry',
    'Podstawa rozliczenia': 'Podklad vyúčtovania',
    '— klient:': '— klient:',
    '— klient nie ma ustawionej liczby dni': '— klient nemá nastavený počet dní',

    // ── dokument do druku ──
    'FAKTURA': 'FAKTÚRA',
    'KOREKTA': 'OPRAVNÁ FAKTÚRA',
    'FAKTURA ZALICZKOWA': 'ZÁLOHOVÁ FAKTÚRA',
    'ROZLICZENIE ESCO': 'VYÚČTOVANIE ESCO',
    'Data sprzedaży': 'Dátum dodania',
    'Sposób zapłaty': 'Spôsob úhrady',
    'Przelew': 'Prevodom',
    'Sprzedawca': 'Dodávateľ',
    'Nabywca': 'Odberateľ',
    'Lp.': 'P. č.',
    'Nazwa usługi': 'Názov služby',
    'Cena netto': 'Jedn. cena netto',
    'Wartość netto': 'Hodnota netto',
    'Obiekt:': 'Objekt:',
    'okres': 'obdobie',
    'Kwota VAT': 'Suma DPH',
    'Wartość brutto': 'Hodnota brutto',
    '1 usł.': '1 sl.',
    'Razem': 'Spolu',
    'Do zapłaty': 'Na úhradu',
    'Słownie:': 'Slovom:',
    'Płatność': 'Platba',
    'Bank': 'Banka',
    'Numer konta / IBAN': 'Číslo účtu / IBAN',
    'SWIFT / BIC': 'SWIFT / BIC',
    'Termin': 'Splatnosť',
    'Tytułem': 'Účel platby',
    'Osoba upoważniona do wystawienia': 'Osoba oprávnená vystaviť',
    'Osoba upoważniona do odbioru': 'Osoba oprávnená prevziať',
    'Wygenerowano w WaterAI Energy Control —': 'Vygenerované vo WaterAI Energy Control —',
    '← Podgląd faktury': '← Náhľad faktúry',
    'Lista faktur': 'Zoznam faktúr',
    '🖨 Drukuj / zapisz PDF': '🖨 Tlačiť / uložiť PDF',
    '🖨 Drukuj': '🖨 Tlačiť',
    'Drukuj / PDF': 'Tlačiť / PDF',
    'W oknie drukowania wybierz „Zapisz jako PDF", żeby dostać plik.':
      'V okne tlače zvoľte „Uložiť ako PDF", ak chcete získať súbor.',
    'Dokument niepełny': 'Neúplný dokument',
    'brak zdefiniowanego podmiotu wystawiającego (Sprzedawca)': 'nie je určený vystavovateľ (Dodávateľ)',
    'podmiot wystawiający nie ma uzupełnionego numeru podatkowego': 'vystavovateľ nemá vyplnené daňové číslo',
    'brak danych nabywcy': 'chýbajú údaje odberateľa',
    '. Uzupełnij dane przed wysłaniem faktury do klienta.': '. Doplňte údaje pred odoslaním faktúry klientovi.',

    // ── panel Podmioty ──
    '⚙ Podmioty': '⚙ Subjekty',
    'Firmy wystawiające faktury': 'Firmy vystavujúce faktúry',
    'Podmioty wystawiające faktury': 'Subjekty vystavujúce faktúry',
    'Firmy, w imieniu których wystawiacie FV. Dane stąd trafiają w blok „Sprzedawca" na wydruku faktury. Lista jest wspólna dla całego zespołu — zapisywać mogą Administrator i Back Office.':
      'Firmy, v mene ktorých vystavujete faktúry. Údaje odtiaľto idú do bloku „Dodávateľ" na tlačenej faktúre. Zoznam je spoločný pre celý tím — ukladať môžu Administrátor a Back Office.',
    '+ Dodaj podmiot': '+ Pridať subjekt',
    'Dodaj podmiot': 'Pridať subjekt',
    '🏢 Dodaj spółki grupy (PL / SK / CZ / CH)': '🏢 Pridať spoločnosti skupiny (PL / SK / CZ / CH)',
    'Nowy podmiot': 'Nový subjekt',
    'Edytuj podmiot': 'Upraviť subjekt',
    'Nazwa firmy': 'Názov firmy',
    'Ulica i numer': 'Ulica a číslo',
    'Kod pocztowy i miasto': 'PSČ a mesto',
    'Waluta domyślna': 'Predvolená mena',
    'Domyślny VAT (%)': 'Predvolená DPH (%)',
    'Prefiks numeru FV': 'Predpona čísla faktúry',
    'Stopka na fakturze': 'Pätička na faktúre',
    'Podmiot domyślny (podpowiadany przy nowej fakturze)': 'Predvolený subjekt (navrhovaný pri novej faktúre)',
    'Brak podmiotów': 'Žiadne subjekty',
    'Dodaj firmę, w imieniu której wystawiacie faktury — bez tego wydruk FV nie ma bloku „Sprzedawca".':
      'Pridajte firmu, v mene ktorej vystavujete faktúry — bez toho tlačená faktúra nemá blok „Dodávateľ".',
    '⭐ domyślny': '⭐ predvolený',
    'Ustaw jako domyślny': 'Nastaviť ako predvolený',
    '⚠ Brak danych rejestrowych — faktura wydrukowana z tym podmiotem będzie niepełna.':
      '⚠ Chýbajú registračné údaje — faktúra vytlačená s týmto subjektom bude neúplná.',
    'Podaj nazwę firmy.': 'Zadajte názov firmy.',
    'Usunąć podmiot?': 'Odstrániť subjekt?',
    '← Lista faktur': '← Zoznam faktúr',
    'Nic nie dodano — te spółki są już na liście.': 'Nič sa nepridalo — tieto spoločnosti už v zozname sú.',

    // ── kraje ──
    'Polska': 'Poľsko',
    'Słowacja': 'Slovensko',
    'Czechy': 'Česko',
    'Niemcy': 'Nemecko',
    'Austria': 'Rakúsko',
    'Anglia (UK)': 'Anglicko (UK)',
    'Szwajcaria': 'Švajčiarsko'
  };

  const CS = {
    'Faktura': 'Faktura',
    'Korekta': 'Opravný daňový doklad',
    'Faktura zaliczkowa': 'Zálohová faktura',
    'Rozliczenie ESCO': 'Vyúčtování ESCO',
    'Projekt': 'Návrh',
    'Wystawiona': 'Vystavená',
    'Opłacona': 'Uhrazená',
    'Częściowo opłacona': 'Částečně uhrazená',
    'Po terminie': 'Po splatnosti',
    'Nr faktury': 'Č. faktury',
    'Numer faktury': 'Číslo faktury',
    'Typ faktury': 'Typ faktury',
    'Podmiot': 'Subjekt',
    'Data wyst.': 'Datum vyst.',
    'Termin płat.': 'Splatnost',
    'Akcje': 'Akce',
    'Zapisz fakturę': 'Uložit fakturu',
    'Edytuj fakturę': 'Upravit fakturu',
    'Usuń fakturę?': 'Smazat fakturu?',
    'Wybierz klienta.': 'Vyberte klienta.',
    'Podaj kwotę netto.': 'Zadejte částku bez DPH.',
    '✓ Oznacz jako opłaconą': '✓ Označit jako uhrazenou',
    'Obiekt (opcjonalnie)': 'Objekt (volitelné)',
    'Uwagi': 'Poznámky',
    'Kraj': 'Země',
    'Kwota netto': 'Částka netto',
    'Telefon': 'Telefon',

    'Podmiot wystawiający (sprzedawca)': 'Vystavovatel (dodavatel)',
    '— nie wskazano —': '— neurčeno —',
    'Podstawa faktury — analiza / raport ESCO (opcjonalnie)': 'Podklad faktury — analýza / zpráva ESCO (volitelné)',
    '— brak (faktura ręczna) —': '— žádný (ruční faktura) —',
    'PODPOWIEDŹ Z:': 'NÁVRH Z:',
    'Sugerowane netto': 'Navrhovaná částka netto',
    'Udział WaterAI/ESCO': 'Podíl WaterAI/ESCO',
    'Pola na żółtym tle są podpowiedziami — możesz je swobodnie nadpisać, zapisana zostanie Twoja wartość.':
      'Pole se žlutým pozadím jsou návrhy — klidně je přepište, uloží se vaše hodnota.',
    '⚠ Ta podstawa nie ma policzonej kwoty udziału ESCO': '⚠ Tento podklad nemá vypočtenou částku podílu ESCO',
    '(analizy w raporcie mają różne udziały)': '(analýzy ve zprávě mají různé podíly)',
    '— wpisz kwotę netto ręcznie.': '— zadejte částku netto ručně.',
    '⚠ Z tej podstawy wystawiono już': '⚠ Z tohoto podkladu už byla vystavena',
    'Raport ESCO': 'Zpráva ESCO',
    'faktur': 'faktur',
    'podmiotów wystawiających': 'vystavovatelů',
    'Podstawa faktury': 'Podklad faktury',
    'Podstawa rozliczenia': 'Podklad vyúčtování',
    '— klient:': '— klient:',
    '— klient nie ma ustawionej liczby dni': '— klient nemá nastavený počet dní',

    'FAKTURA': 'FAKTURA',
    'KOREKTA': 'OPRAVNÝ DAŇOVÝ DOKLAD',
    'FAKTURA ZALICZKOWA': 'ZÁLOHOVÁ FAKTURA',
    'ROZLICZENIE ESCO': 'VYÚČTOVÁNÍ ESCO',
    'Data sprzedaży': 'Datum zdanitelného plnění',
    'Sposób zapłaty': 'Způsob úhrady',
    'Przelew': 'Převodem',
    'Sprzedawca': 'Dodavatel',
    'Nabywca': 'Odběratel',
    'Lp.': 'Č.',
    'Nazwa usługi': 'Název služby',
    'Cena netto': 'Jedn. cena netto',
    'Wartość netto': 'Hodnota netto',
    'Obiekt:': 'Objekt:',
    'okres': 'období',
    'Kwota VAT': 'Částka DPH',
    'Wartość brutto': 'Hodnota brutto',
    '1 usł.': '1 sl.',
    'Razem': 'Celkem',
    'Do zapłaty': 'K úhradě',
    'Słownie:': 'Slovy:',
    'Płatność': 'Platba',
    'Bank': 'Banka',
    'Numer konta / IBAN': 'Číslo účtu / IBAN',
    'SWIFT / BIC': 'SWIFT / BIC',
    'Termin': 'Splatnost',
    'Tytułem': 'Účel platby',
    'Osoba upoważniona do wystawienia': 'Osoba oprávněná vystavit',
    'Osoba upoważniona do odbioru': 'Osoba oprávněná převzít',
    'Wygenerowano w WaterAI Energy Control —': 'Vygenerováno ve WaterAI Energy Control —',
    '← Podgląd faktury': '← Náhled faktury',
    'Lista faktur': 'Seznam faktur',
    '🖨 Drukuj / zapisz PDF': '🖨 Tisk / uložit PDF',
    '🖨 Drukuj': '🖨 Tisk',
    'Drukuj / PDF': 'Tisk / PDF',
    'W oknie drukowania wybierz „Zapisz jako PDF", żeby dostać plik.':
      'V okně tisku zvolte „Uložit jako PDF", chcete-li získat soubor.',
    'Dokument niepełny': 'Neúplný dokument',
    'brak zdefiniowanego podmiotu wystawiającego (Sprzedawca)': 'není určen vystavovatel (Dodavatel)',
    'podmiot wystawiający nie ma uzupełnionego numeru podatkowego': 'vystavovatel nemá vyplněné daňové číslo',
    'brak danych nabywcy': 'chybí údaje odběratele',
    '. Uzupełnij dane przed wysłaniem faktury do klienta.': '. Doplňte údaje před odesláním faktury klientovi.',

    '⚙ Podmioty': '⚙ Subjekty',
    'Firmy wystawiające faktury': 'Firmy vystavující faktury',
    'Podmioty wystawiające faktury': 'Subjekty vystavující faktury',
    'Firmy, w imieniu których wystawiacie FV. Dane stąd trafiają w blok „Sprzedawca" na wydruku faktury. Lista jest wspólna dla całego zespołu — zapisywać mogą Administrator i Back Office.':
      'Firmy, jejichž jménem vystavujete faktury. Údaje odtud jdou do bloku „Dodavatel" na tištěné faktuře. Seznam je společný pro celý tým — ukládat mohou Administrátor a Back Office.',
    '+ Dodaj podmiot': '+ Přidat subjekt',
    'Dodaj podmiot': 'Přidat subjekt',
    '🏢 Dodaj spółki grupy (PL / SK / CZ / CH)': '🏢 Přidat společnosti skupiny (PL / SK / CZ / CH)',
    'Nowy podmiot': 'Nový subjekt',
    'Edytuj podmiot': 'Upravit subjekt',
    'Nazwa firmy': 'Název firmy',
    'Ulica i numer': 'Ulice a číslo',
    'Kod pocztowy i miasto': 'PSČ a město',
    'Waluta domyślna': 'Výchozí měna',
    'Domyślny VAT (%)': 'Výchozí DPH (%)',
    'Prefiks numeru FV': 'Předpona čísla faktury',
    'Stopka na fakturze': 'Patička na faktuře',
    'Podmiot domyślny (podpowiadany przy nowej fakturze)': 'Výchozí subjekt (navrhovaný u nové faktury)',
    'Brak podmiotów': 'Žádné subjekty',
    'Dodaj firmę, w imieniu której wystawiacie faktury — bez tego wydruk FV nie ma bloku „Sprzedawca".':
      'Přidejte firmu, jejímž jménem vystavujete faktury — bez toho tištěná faktura nemá blok „Dodavatel".',
    '⭐ domyślny': '⭐ výchozí',
    'Ustaw jako domyślny': 'Nastavit jako výchozí',
    '⚠ Brak danych rejestrowych — faktura wydrukowana z tym podmiotem będzie niepełna.':
      '⚠ Chybí registrační údaje — faktura vytištěná s tímto subjektem bude neúplná.',
    'Podaj nazwę firmy.': 'Zadejte název firmy.',
    'Usunąć podmiot?': 'Smazat subjekt?',
    '← Lista faktur': '← Seznam faktur',
    'Nic nie dodano — te spółki są już na liście.': 'Nic se nepřidalo — tyto společnosti už v seznamu jsou.',

    'Polska': 'Polsko',
    'Słowacja': 'Slovensko',
    'Czechy': 'Česko',
    'Niemcy': 'Německo',
    'Austria': 'Rakousko',
    'Anglia (UK)': 'Anglie (UK)',
    'Szwajcaria': 'Švýcarsko'
  };

  function install() {
    const api = window.DomainI18n;
    if (!api || !api.dict) {
      console.warn('[i18n-invoicing] Brak window.DomainI18n — plik musi być ładowany PO i18n-domain.js.');
      return false;
    }
    // Nie nadpisujemy kluczy, które i18n-domain.js już zna — tam jest źródło prawdy.
    const merge = (lang, src) => {
      const d = api.dict[lang] || (api.dict[lang] = {});
      let added = 0;
      for (const k in src) if (!(k in d)) { d[k] = src[k]; added++; }
      return added;
    };
    const a = merge('sk', SK), b = merge('cs', CS);
    console.info('[i18n-invoicing] Dopisano kluczy — sk: ' + a + ', cs: ' + b);
    if (typeof api.apply === 'function') api.apply();
    return true;
  }

  if (!install()) {
    // i18n-domain.js startuje na DOMContentLoaded — spróbuj ponownie po załadowaniu.
    document.addEventListener('DOMContentLoaded', install);
  }
})();

// ─────────────────────────────────────────────────────────────────────────
// amount-words.js — kwota słownie na wydruku faktury, w sześciu językach.
//
// Po co osobny moduł: kwota słownie powstaje w locie z liczby, więc słownik
// i18n jej nie naprawi — nie ma stałej frazy do podmiany. Do 2026-08-10 blok
// „Słownie" drukował się wyłącznie po polsku, a na fakturach słowackich,
// czeskich, niemieckich i hiszpańskich był po prostu pomijany.
//
// Trudność nie leży w samych liczebnikach, tylko w uzgodnieniu z walutą:
//   • PL/SK/CS mają trzy formy liczby mnogiej (1 / 2–4 / 5+, z wyjątkiem 12–14),
//   • rodzaj waluty zmienia liczebnik: „dwa złote" ale „dwie korony",
//     „dva eurá" ale „dve koruny", „dvě eura" ale „dvě koruny",
//   • hiszpański skraca „uno"→„un" przed rzeczownikiem męskim i uzgadnia setki:
//     „doscientos euros" ale „doscientas coronas",
//   • niemiecki skleja liczebnik w jedno słowo aż do miliona:
//     „zweihundertzweiundachtzig", a miliony pisze osobno: „eine Million".
//
// Format wyniku jest wspólny dla wszystkich języków i zgodny z praktyką
// fakturową: <liczba słownie> <waluta> <NN>/100, np.
//   PL  dwieście osiemdziesiąt dwa euro 69/100
//   SK  dvestoosemdesiatdva eur 69/100
//   CS  dvě stě osmdesát dva eur 69/100
//   EN  two hundred eighty-two euros 69/100
//   DE  zweihundertzweiundachtzig Euro 69/100
//   ES  doscientos ochenta y dos euros 69/100
//
// API:
//   AmountWords.toWords(n, lang, gender)   — sama liczba całkowita słownie
//   AmountWords.amount(value, currency, lang) — pełna kwota z nazwą waluty
//
// Zakres: do 999 999 999 999 (miliardy). Powyżej zwraca samą liczbę.
// Testy: node narzedzia/test-kwota-slownie.js
// ─────────────────────────────────────────────────────────────────────────
(function () {
  'use strict';

  // ── Odmiana słowiańska: 1 / 2–4 / 5+ (12–14 idą do formy „wiele") ──
  function slavPlural(n, one, few, many) {
    n = Math.abs(Math.floor(n));
    if (n === 1) return one;
    const l = n % 10, ll = n % 100;
    return (l >= 2 && l <= 4 && !(ll >= 12 && ll <= 14)) ? few : many;
  }

  // SK/CS: po liczebniku złożonym (22, 102, 282…) rzeczownik idzie w dopełniaczu
  // mnogim, tak samo jak po „päť/pět". Forma bliższa („eurá", „eura") należy się
  // wyłącznie czystym 2, 3 i 4 — inaczej niż w polskim, gdzie decyduje ostatnia
  // cyfra („dwadzieścia dwa złote"). Faktury SK/CZ stosują właśnie ten zapis.
  function slavPluralStrict(n, one, few, many) {
    n = Math.abs(Math.floor(n));
    if (n === 1) return one;
    return (n >= 2 && n <= 4) ? few : many;
  }

  function enPlural(n, one, many) {
    return Math.abs(Math.floor(n)) === 1 ? one : many;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // POLSKI
  // ═══════════════════════════════════════════════════════════════════════
  const PL = {
    // rodzaj: 'm' męski, 'f' żeński, 'n' nijaki — dotyczy tylko 1 i 2
    unit: (u, gender) => {
      if (u === 1) return gender === 'f' ? 'jedna' : gender === 'n' ? 'jedno' : 'jeden';
      if (u === 2) return gender === 'f' ? 'dwie' : 'dwa';
      return ['', '', '', 'trzy', 'cztery', 'pięć', 'sześć', 'siedem', 'osiem', 'dziewięć'][u];
    },
    teen: ['dziesięć', 'jedenaście', 'dwanaście', 'trzynaście', 'czternaście', 'piętnaście',
           'szesnaście', 'siedemnaście', 'osiemnaście', 'dziewiętnaście'],
    ten: ['', '', 'dwadzieścia', 'trzydzieści', 'czterdzieści', 'pięćdziesiąt',
          'sześćdziesiąt', 'siedemdziesiąt', 'osiemdziesiąt', 'dziewięćdziesiąt'],
    hundred: ['', 'sto', 'dwieście', 'trzysta', 'czterysta', 'pięćset',
              'sześćset', 'siedemset', 'osiemset', 'dziewięćset'],
    zero: 'zero',
    // grupy: [rodzaj liczebnika w tej grupie, forma 1, forma 2–4, forma 5+]
    groups: [null,
      ['m', 'tysiąc', 'tysiące', 'tysięcy'],
      ['m', 'milion', 'miliony', 'milionów'],
      ['m', 'miliard', 'miliardy', 'miliardów']],
    // „tysiąc", nie „jeden tysiąc"
    skipOne: true,
    // polski uzgadnia rodzaj także w liczebnikach złożonych:
    // „dwadzieścia dwie korony", nie „dwadzieścia dwa korony"
    compoundAgrees: true,
    plural: slavPlural
  };

  // ═══════════════════════════════════════════════════════════════════════
  // SŁOWACKI — liczebnik składany w jedno słowo (dvadsaťjeden, dvestotri)
  // ═══════════════════════════════════════════════════════════════════════
  const SK = {
    unit: (u, gender) => {
      if (u === 1) return gender === 'f' ? 'jedna' : gender === 'n' ? 'jedno' : 'jeden';
      if (u === 2) return (gender === 'f' || gender === 'n') ? 'dve' : 'dva';
      return ['', '', '', 'tri', 'štyri', 'päť', 'šesť', 'sedem', 'osem', 'deväť'][u];
    },
    teen: ['desať', 'jedenásť', 'dvanásť', 'trinásť', 'štrnásť', 'pätnásť',
           'šestnásť', 'sedemnásť', 'osemnásť', 'devätnásť'],
    ten: ['', '', 'dvadsať', 'tridsať', 'štyridsať', 'päťdesiat',
          'šesťdesiat', 'sedemdesiat', 'osemdesiat', 'deväťdesiat'],
    hundred: ['', 'sto', 'dvesto', 'tristo', 'štyristo', 'päťsto',
              'šesťsto', 'sedemsto', 'osemsto', 'deväťsto'],
    zero: 'nula',
    groups: [null,
      ['m', 'tisíc', 'tisíce', 'tisíc'],
      ['m', 'milión', 'milióny', 'miliónov'],
      ['f', 'miliarda', 'miliardy', 'miliárd']],
    skipOne: true,
    glue: '',            // dvadsaťjeden — bez spacji wewnątrz grupy setek
    thousandWord: 'tisíc',
    // W liczebnikach złożonych słowacki nie odmienia „dva" wg rodzaju
    // („dvadsaťdva eur", nie „dvadsaťdve eur") — zgoda tylko przy czystym 1 i 2.
    compoundAgrees: false,
    plural: slavPluralStrict
  };

  // ═══════════════════════════════════════════════════════════════════════
  // CZESKI — liczebnik pisany osobno (dvacet jedna, dvě stě tři)
  // ═══════════════════════════════════════════════════════════════════════
  const CS = {
    unit: (u, gender) => {
      if (u === 1) return gender === 'f' ? 'jedna' : gender === 'n' ? 'jedno' : 'jeden';
      if (u === 2) return (gender === 'f' || gender === 'n') ? 'dvě' : 'dva';
      return ['', '', '', 'tři', 'čtyři', 'pět', 'šest', 'sedm', 'osm', 'devět'][u];
    },
    teen: ['deset', 'jedenáct', 'dvanáct', 'třináct', 'čtrnáct', 'patnáct',
           'šestnáct', 'sedmnáct', 'osmnáct', 'devatenáct'],
    ten: ['', '', 'dvacet', 'třicet', 'čtyřicet', 'padesát',
          'šedesát', 'sedmdesát', 'osmdesát', 'devadesát'],
    // sto jest rodzaju nijakiego: „dvě stě", potem „tři sta", od pięciu „pět set"
    hundred: ['', 'sto', 'dvě stě', 'tři sta', 'čtyři sta', 'pět set',
              'šest set', 'sedm set', 'osm set', 'devět set'],
    zero: 'nula',
    groups: [null,
      ['m', 'tisíc', 'tisíce', 'tisíc'],
      ['m', 'milion', 'miliony', 'milionů'],
      ['f', 'miliarda', 'miliardy', 'miliard']],
    skipOne: true,
    compoundAgrees: false,
    plural: slavPluralStrict
  };

  // ═══════════════════════════════════════════════════════════════════════
  // ANGIELSKI
  // ═══════════════════════════════════════════════════════════════════════
  const EN = {
    unit: u => ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'][u],
    teen: ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
           'sixteen', 'seventeen', 'eighteen', 'nineteen'],
    ten: ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'],
    zero: 'zero',
    hundredWord: 'hundred',
    hundredSep: ' ',                        // one hundred (niemiecki skleja)
    tensHyphen: true,                       // twenty-one
    groups: [null,
      ['', 'thousand', 'thousand', 'thousand'],
      ['', 'million', 'million', 'million'],
      ['', 'billion', 'billion', 'billion']],
    skipOne: false,                         // one thousand, one million
    plural: (n, one) => one
  };

  // ═══════════════════════════════════════════════════════════════════════
  // NIEMIECKI — sklejone w jedno słowo do miliona włącznie
  // ═══════════════════════════════════════════════════════════════════════
  const DE = {
    // „eins" samodzielnie, „ein/eine" przed rzeczownikiem (ein Euro, eine Krone)
    unit: (u, gender, standalone) =>
      (u === 1)
        ? (standalone ? 'eins' : (gender === 'f' ? 'eine' : 'ein'))
        : ['', '', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun'][u],
    teen: ['zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn',
           'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'],
    ten: ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig',
          'sechzig', 'siebzig', 'achtzig', 'neunzig'],
    zero: 'null',
    hundredWord: 'hundert',
    hundredSep: '',
    thousandWord: 'tausend',
    glue: '',                               // zweihundertzweiundachtzig — jedno słowo
    germanOrder: true,                      // jednostki przed dziesiątkami, spójnik „und"
    // Milionów niemiecki NIE skleja: „eine Million zweihundert…"
    groups: [null, null,
      ['f', 'eine Million', 'Millionen', 'Millionen'],
      ['f', 'eine Milliarde', 'Milliarden', 'Milliarden']]
  };

  // ═══════════════════════════════════════════════════════════════════════
  // HISZPAŃSKI
  // ═══════════════════════════════════════════════════════════════════════
  const ES = {
    unit: (u, gender, standalone) => {
      if (u === 1) return standalone ? 'uno' : (gender === 'f' ? 'una' : 'un');
      return ['', '', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'][u];
    },
    teen: ['diez', 'once', 'doce', 'trece', 'catorce', 'quince',
           'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'],
    // 21–29 to jedno słowo: veintiuno, veintidós…
    twenties: ['veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro',
               'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'],
    ten: ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta',
          'sesenta', 'setenta', 'ochenta', 'noventa'],
    // setki uzgadniają rodzaj: doscientos euros / doscientas coronas
    hundredM: ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos',
               'seiscientos', 'setecientos', 'ochocientos', 'novecientos'],
    hundredF: ['', 'ciento', 'doscientas', 'trescientas', 'cuatrocientas', 'quinientas',
               'seiscientas', 'setecientas', 'ochocientas', 'novecientas'],
    zero: 'cero'
  };

  // ═══════════════════════════════════════════════════════════════════════
  // Wspólny silnik dla PL / SK / CS / EN
  // ═══════════════════════════════════════════════════════════════════════
  function words3(L, part, gender, standalone) {
    // 1–999 słownie. `gender` uzgadnia 1 i 2 z rzeczownikiem (pusty = brak zgody),
    // `standalone` włącza formę samodzielną („eins", „uno") zamiast przydawkowej.
    const out = [];
    const h = Math.floor(part / 100), rest = part % 100;
    const t = Math.floor(rest / 10), u = rest % 10;

    if (h) {
      out.push(L.hundred
        ? L.hundred[h]
        : L.unit(h, '', false) + (L.hundredSep || '') + L.hundredWord);
    }

    if (rest >= 10 && rest < 20) {
      out.push(L.teen[rest - 10]);
    } else if (L.germanOrder && t >= 2 && u) {
      // niemiecki odwraca kolejność: vierundzwanzig = „cztery i dwadzieścia"
      out.push(L.unit(u, gender, false) + 'und' + L.ten[t]);
    } else if (t && u && L.tensHyphen) {
      out.push(L.ten[t] + '-' + L.unit(u, gender, standalone));
    } else {
      if (t) out.push(L.ten[t]);
      if (u) out.push(L.unit(u, gender, standalone));
    }
    return out.filter(Boolean).join(L.glue == null ? ' ' : L.glue);
  }

  function wordsSlavEn(L, n, gender) {
    if (n === 0) return L.zero;
    // Zgoda rodzaju w liczebniku złożonym: polski tak („dwadzieścia dwie korony"),
    // słowacki i czeski nie („dvadsaťdva eur").
    const agree = L.compoundAgrees || n <= 2;
    const chunks = [];
    let g = 0;
    while (n > 0 && g < 4) {
      const part = n % 1000;
      n = Math.floor(n / 1000);
      if (part > 0) {
        const grp = L.groups[g];
        // rodzaj: w grupie jedności z waluty, wyżej z nazwy grupy (tysiąc — m, miliarda — f)
        const gd = g === 0 ? (agree ? gender : '') : (grp ? grp[0] : '');
        let w;
        if (g > 0 && part === 1 && L.skipOne) w = grp[1];            // „tysiąc", nie „jeden tysiąc"
        else if (g > 0) w = words3(L, part, gd, false) + ' ' + L.plural(part, grp[1], grp[2], grp[3]);
        else w = words3(L, part, gd, !gender);
        chunks.unshift(w.trim());
      }
      g++;
    }
    return chunks.join(' ').replace(/\s+/g, ' ').trim();
  }

  // ── Niemiecki: sklejanie do miliona, miliony osobno ──
  function wordsDe(n, gender) {
    if (n === 0) return DE.zero;
    // Niemiecki skleja liczebnik w jedno słowo do miliona; miliony i miliardy
    // pisze osobno i z wielkiej litery („eine Million zweihundert…").
    const mld = Math.floor(n / 1e9), mln = Math.floor((n % 1e9) / 1e6), low = n % 1e6;
    const out = [];
    if (mld) out.push(mld === 1 ? 'eine Milliarde' : deBelowMillion(mld, false, 'f') + ' Milliarden');
    if (mln) out.push(mln === 1 ? 'eine Million' : deBelowMillion(mln, false, 'f') + ' Millionen');
    // forma samodzielna („eins") tylko wtedy, gdy po liczbie NIE stoi rzeczownik
    if (low) out.push(deBelowMillion(low, !gender, gender));
    return out.join(' ').trim();
  }

  function deBelowMillion(n, standalone, gender) {
    const th = Math.floor(n / 1000), rest = n % 1000;
    let s = '';
    if (th) s += (th === 1 ? 'ein' : words3(DE, th, '', false)) + DE.thousandWord;
    if (rest) s += words3(DE, rest, gender || '', standalone && !th);
    return s;
  }

  // ── Słowacki: sklejanie liczebnika w jedno słowo do miliona ──
  // Pravidlá slovenského pravopisu każą pisać liczebnik łącznie:
  // „tisícdva", „dvetisíc", „dvestotridsaťštyritisícpäťstošesťdesiatsedem".
  // Miliony i miliardy zostają osobno i odmieniają się jak rzeczowniki.
  // W formie sklejonej „tisíc" nie przybiera liczby mnogiej: dvetisíc, päťtisíc.
  // Rodzaj wpływa na liczebnik TYLKO gdy liczba to czyste 1 albo 2. W złożeniach
  // słowacki trzyma formę męską: „dvetisíc" (2 tisíc), ale „dvadsaťdvatisíc" (22).
  function skGender(n, gender) { return (n === 1 || n === 2) ? (gender || 'm') : 'm'; }

  function wordsSk(n, gender) {
    if (n === 0) return SK.zero;
    const mld = Math.floor(n / 1e9), mln = Math.floor((n % 1e9) / 1e6), low = n % 1e6;
    const out = [];
    if (mld) {
      const g = SK.groups[3];
      out.push(mld === 1 ? g[1]
        : skBelowMillion(mld, skGender(mld, g[0])) + ' ' + slavPluralStrict(mld, g[1], g[2], g[3]));
    }
    if (mln) {
      const g = SK.groups[2];
      out.push(mln === 1 ? g[1]
        : skBelowMillion(mln, skGender(mln, g[0])) + ' ' + slavPluralStrict(mln, g[1], g[2], g[3]));
    }
    if (low) out.push(skBelowMillion(low, skGender(low, gender)));
    return out.join(' ').trim();
  }

  function skBelowMillion(n, gender) {
    const th = Math.floor(n / 1000), rest = n % 1000;
    let s = '';
    // „tisíc", nie „jedentisíc"; wyżej liczebnik przykleja się wprost.
    // tisíc jest rodzaju męskiego, ale skodyfikowana forma to „dvetisíc" —
    // stąd rodzaj nijaki wyłącznie dla czystej dwójki.
    if (th) s += (th === 1 ? '' : words3(SK, th, th === 2 ? 'n' : 'm', false)) + SK.thousandWord;
    if (rest) s += words3(SK, rest, gender, false);
    return s;
  }

  // ── Hiszpański ──
  // `gHund` uzgadnia setki z liczonym rzeczownikiem (doscientas coronas),
  // `gUnit` — samo „uno" (un euro / una corona). Rozdzielone, bo w tysiącach
  // setki idą za walutą („doscientas mil coronas"), a jedność zostaje męska
  // („veintiún mil"), zgodnie z normą RAE.
  function esBelow1000(n, gHund, gUnit, standalone) {
    if (n === 100) return 'cien';
    const out = [];
    const h = Math.floor(n / 100), rest = n % 100;
    if (h) out.push((gHund === 'f' ? ES.hundredF : ES.hundredM)[h]);
    if (rest >= 10 && rest < 20) out.push(ES.teen[rest - 10]);
    else if (rest >= 20 && rest < 30) {
      // veintiuno samodzielnie, veintiún/veintiuna przed rzeczownikiem
      out.push(rest === 21
        ? (standalone ? 'veintiuno' : (gUnit === 'f' ? 'veintiuna' : 'veintiún'))
        : ES.twenties[rest - 20]);
    } else {
      const t = Math.floor(rest / 10), u = rest % 10;
      if (t && u) out.push(ES.ten[t] + ' y ' + ES.unit(u, gUnit, standalone));
      else if (t) out.push(ES.ten[t]);
      else if (u) out.push(ES.unit(u, gUnit, standalone));
    }
    return out.filter(Boolean).join(' ');
  }

  function wordsEs(n, gender) {
    if (n === 0) return ES.zero;
    const standalone = !gender;
    const g = gender || 'm';
    const mln = Math.floor(n / 1e6), th = Math.floor((n % 1e6) / 1000), rest = n % 1000;
    const out = [];
    // millón jest rzeczownikiem męskim — „un millón", „dos millones"
    if (mln) out.push(mln === 1 ? 'un millón' : esBelow1000(mln, 'm', 'm', false) + ' millones');
    // „mil", nie „un mil"; setki uzgadniają się z walutą, jedność zostaje męska
    if (th) out.push(th === 1 ? 'mil' : esBelow1000(th, g, 'm', false) + ' mil');
    if (rest) out.push(esBelow1000(rest, g, g, standalone && !mln && !th));
    return out.join(' ').trim();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // WALUTY — nazwa, rodzaj gramatyczny, formy liczby mnogiej
  // Kolejność form dla PL/SK/CS: [1, 2–4, 5+]; dla EN/ES: [1, mnoga];
  // dla DE: [1, mnoga] (Euro, Franken i Pfund są nieodmienne w tym użyciu).
  // ═══════════════════════════════════════════════════════════════════════
  const CURRENCY = {
    EUR: {
      pl: { g: 'n', f: ['euro', 'euro', 'euro'] },
      sk: { g: 'n', f: ['euro', 'eurá', 'eur'] },
      cs: { g: 'n', f: ['euro', 'eura', 'eur'] },
      en: { g: '', f: ['euro', 'euros'] },
      de: { g: 'm', f: ['Euro', 'Euro'] },
      es: { g: 'm', f: ['euro', 'euros'] }
    },
    PLN: {
      pl: { g: 'm', f: ['złoty', 'złote', 'złotych'] },
      sk: { g: 'm', f: ['zlotý', 'zloté', 'zlotých'] },
      cs: { g: 'm', f: ['zlotý', 'zloté', 'zlotých'] },
      en: { g: '', f: ['zloty', 'zlotys'] },
      de: { g: 'm', f: ['Zloty', 'Zloty'] },
      es: { g: 'm', f: ['esloti', 'eslotis'] }
    },
    CZK: {
      pl: { g: 'f', f: ['korona czeska', 'korony czeskie', 'koron czeskich'] },
      sk: { g: 'f', f: ['česká koruna', 'české koruny', 'českých korún'] },
      cs: { g: 'f', f: ['koruna česká', 'koruny české', 'korun českých'] },
      en: { g: '', f: ['Czech koruna', 'Czech korunas'] },
      de: { g: 'f', f: ['Tschechische Krone', 'Tschechische Kronen'] },
      es: { g: 'f', f: ['corona checa', 'coronas checas'] }
    },
    CHF: {
      pl: { g: 'm', f: ['frank szwajcarski', 'franki szwajcarskie', 'franków szwajcarskich'] },
      sk: { g: 'm', f: ['švajčiarsky frank', 'švajčiarske franky', 'švajčiarskych frankov'] },
      cs: { g: 'm', f: ['švýcarský frank', 'švýcarské franky', 'švýcarských franků'] },
      en: { g: '', f: ['Swiss franc', 'Swiss francs'] },
      de: { g: 'm', f: ['Schweizer Franken', 'Schweizer Franken'] },
      es: { g: 'm', f: ['franco suizo', 'francos suizos'] }
    },
    GBP: {
      pl: { g: 'm', f: ['funt szterling', 'funty szterlingi', 'funtów szterlingów'] },
      sk: { g: 'f', f: ['britská libra', 'britské libry', 'britských libier'] },
      cs: { g: 'f', f: ['britská libra', 'britské libry', 'britských liber'] },
      en: { g: '', f: ['pound sterling', 'pounds sterling'] },
      de: { g: 'n', f: ['Britisches Pfund', 'Britische Pfund'] },
      es: { g: 'f', f: ['libra esterlina', 'libras esterlinas'] }
    }
  };

  const SLAV = { pl: PL, sk: SK, cs: CS };

  function normLang(lang) {
    const l = String(lang || 'pl').toLowerCase();
    return l === 'at' ? 'de' : l;          // austriacki = niemiecki
  }

  // Liczba całkowita słownie. `gender` ('m'/'f'/'n') uzgadnia 1 i 2 z rzeczownikiem.
  function toWords(n, lang, gender) {
    const l = normLang(lang);
    n = Math.floor(Math.abs(Number(n) || 0));
    if (!isFinite(n) || n > 999999999999) return String(n);
    if (l === 'de') return wordsDe(n, gender);
    if (l === 'es') return wordsEs(n, gender);
    if (l === 'sk') return wordsSk(n, gender);
    if (l === 'en') return wordsSlavEn(EN, n, '');
    return wordsSlavEn(SLAV[l] || PL, n, gender);
  }

  // Nazwa waluty w odpowiedniej formie dla danej liczby.
  function currencyName(int, currency, lang) {
    const l = normLang(lang);
    const c = CURRENCY[String(currency || '').toUpperCase()];
    if (!c || !c[l]) return { name: String(currency || '').toUpperCase(), gender: 'm' };
    const e = c[l];
    // polski dobiera formę wg ostatniej cyfry („dwadzieścia dwa złote"),
    // słowacki i czeski wg całej liczby („dvadsaťdva eur")
    const slav = (l === 'pl') ? slavPlural : slavPluralStrict;
    const name = (e.f.length === 3)
      ? slav(int, e.f[0], e.f[1], e.f[2])
      : enPlural(int, e.f[0], e.f[1]);
    return { name: name, gender: e.g || 'm' };
  }

  // Pełna kwota słownie: „<liczba> <waluta> <NN>/100".
  // Grosze/centy zostają cyframi — tak wygląda standardowy zapis na fakturze
  // i unika się drugiej odmiany (grosz/haléř/Cent/céntimo) w pięciu językach.
  function amount(value, currency, lang) {
    const total = Math.round(Math.abs(Number(value) || 0) * 100);
    const int = Math.floor(total / 100), frac = total % 100;
    const cn = currencyName(int, currency, lang);
    return toWords(int, lang, cn.gender) + ' ' + cn.name + ' ' + String(frac).padStart(2, '0') + '/100';
  }

  window.AmountWords = {
    toWords: toWords,
    amount: amount,
    currencyName: currencyName,
    CURRENCY: CURRENCY
  };
})();

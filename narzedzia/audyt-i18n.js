#!/usr/bin/env node
/**
 * Audyt tłumaczeń — WaterAI Energy Control
 * ─────────────────────────────────────────────────────────────────────────────
 * Po co: silnik i18n (js/modules/i18n-domain.js) tłumaczy tekst dopasowując
 * POLSKI napis do klucza w słowniku. Napis, którego w słowniku nie ma, zostaje
 * po polsku — i tak powstają ekrany „pół po słowacku, pół po polsku". Ten skrypt
 * znajduje takie napisy ZANIM zobaczy je klient.
 *
 * Jak działa: wyciąga z kodu kandydatów na napisy widoczne dla użytkownika
 * (tekst między znacznikami HTML, atrybuty placeholder/title/alt, literały),
 * przepuszcza każdy przez PRAWDZIWY silnik tłumaczenia dla każdego języka
 * i zgłasza te, w których po tłumaczeniu nadal siedzą polskie znaki.
 *
 * Użycie:
 *   node narzedzia/audyt-i18n.js              — podsumowanie
 *   node narzedzia/audyt-i18n.js --lista sk   — pełna lista braków dla języka
 *   node narzedzia/audyt-i18n.js --json       — wynik maszynowo (do CI)
 *
 * WERSJA 2 (2026-08-10) — zmiana reguly oceny.
 * Wersja 1 uznawala za kandydata tylko napis ZAWIERAJACY polskie znaki
 * diakrytyczne. To zostawialo ogromna dziure: „Sprzedawca", „Nabywca", „Status",
 * „Data", „Termin", „Razem", „Bank", „Netto", „Klient", „Obiekt" nie maja ani
 * jednej takiej litery, wiec audyt ich nie widzial — a to wlasnie one zostawaly
 * po polsku na slowackiej fakturze. Sprawdzano 904 napisy i raportowano 97%
 * pokrycia przy realnych brakach.
 *
 * Regula w wersji 2: KAZDY napis widoczny w interfejsie musi byc KLUCZEM
 * w slowniku kazdego jezyka — rowniez wtedy, gdy tlumaczenie jest identyczne
 * jak polski oryginal („Status" → „Status"). Wpis tozsamosciowy jest swiadoma
 * decyzja tlumacza i widac go w kodzie; brak wpisu to zawsze luka.
 *
 * Dodatkowo napisy wyciaga teraz prawdziwy tokenizer JS, a nie wyrazenia
 * regularne — apostrof w komentarzu otwieral falszywy string ciagnacy sie przez
 * pol pliku i zasmiecal wynik fragmentami kodu.
 *
 *   node narzedzia/audyt-i18n.js --pliki     — braki w rozbiciu na pliki
 *
 * Uwaga: to heurystyka. Wyłapuje realne braki, ale potrafi też zgłosić napis,
 * który nigdy nie trafia na ekran (komunikat konsoli, fragment kodu). Lista
 * IGNORUJ niżej odsiewa znane przypadki — dopisuj do niej, zamiast luzować filtr.
 */

'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const LANGS = ['sk', 'cs', 'en', 'de', 'es'];   // at === de (ten sam obiekt słownika)
// Pliki, w których szukamy napisów. Kolejność bez znaczenia.
const PLIKI = [
  'index.html',
  'js/app.build.js',
  'js/modules/app-v2.js',
  'js/modules/readings.js',
  'js/modules/simulations.js',
  'js/modules/shares.js',
  'js/modules/users.js',
  'js/modules/backup.js',
  'js/modules/instructions.js',
  'js/modules/role-preview.js',
  'js/modules/billing-entities.js',
  'js/modules/clients.js',
  'js/modules/objects.js',
  'js/modules/invoicing.js',
  'js/modules/analyses.js',
  'js/modules/esco-reports.js',
  'js/modules/measurements.js',
  'js/modules/calendar.js',
  'js/modules/documents.js',
  'js/modules/doc-folders.js',
  'js/modules/workflow.js',
  'js/modules/migration.js'
];

// Pliki słowników — ładowane w tej kolejności co w index.html.
const SLOWNIKI = [
  'js/modules/i18n-domain.js',
  'js/modules/i18n-invoicing.js',
  'js/modules/i18n-cs-backfill.js',
  'js/modules/i18n-cs-backfill-2.js',
  'js/modules/i18n-cs-backfill-3.js',
  'js/modules/i18n-cs-backfill-4.js',
  'js/modules/i18n-cs-backfill-5.js',
  'js/modules/i18n-cs-backfill-6.js',
  'js/modules/i18n-ui-core.js',
  'js/modules/i18n-ui-core-2.js',
  'js/modules/i18n-ui-core-3.js'
];

// ── Ładowanie silnika i słowników poza przeglądarką ──────────────────────────
function zaladujSilnik() {
  const sandbox = {
    console: { log() {}, info() {}, warn() {}, error() {} },
    setTimeout, clearTimeout,
    NodeFilter: { SHOW_TEXT: 4, FILTER_REJECT: 2, FILTER_ACCEPT: 1 },
    MutationObserver: function () { this.observe = function () {}; },
    CanvasRenderingContext2D: null,
    alert() {}, confirm() {},
    currentLanguage: 'pl'
  };
  sandbox.window = sandbox;
  sandbox.document = {
    readyState: 'complete',
    addEventListener() {},
    createTreeWalker() { return { nextNode() { return null; } }; },
    body: {},
    querySelectorAll() { return []; }
  };
  vm.createContext(sandbox);
  for (const f of SLOWNIKI) {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) continue;               // pliki opcjonalne (backfille)
    vm.runInContext(fs.readFileSync(p, 'utf8'), sandbox, { filename: f });
  }
  if (!sandbox.window.DomainI18n) throw new Error('Nie udało się załadować DomainI18n.');
  return sandbox;
}

// ── Tokenizer: rozdziela kod na komentarze, stringi i literały szablonowe ────
// Regexem się tego nie zrobi — apostrof w komentarzu („nie ma") otwierał fałszywy
// string ciągnący się przez pół pliku i zaśmiecał wynik fragmentami kodu.
function tokenizuj(kod) {
  const stringi = [], szablony = [];
  let i = 0;
  const n = kod.length;
  while (i < n) {
    const c = kod[i];
    if (c === '/' && kod[i + 1] === '/') {
      const k = kod.indexOf('\n', i);
      i = k === -1 ? n : k + 1;
    } else if (c === '/' && kod[i + 1] === '*') {
      const k = kod.indexOf('*/', i);
      i = k === -1 ? n : k + 2;
    } else if (c === "'" || c === '"') {
      const q = c; let j = i + 1, buf = '';
      while (j < n && kod[j] !== q) {
        if (kod[j] === '\\') { buf += kod[j + 1] === 'n' ? '\n' : kod[j + 1]; j += 2; }
        else if (kod[j] === '\n') break;
        else { buf += kod[j]; j++; }
      }
      stringi.push(buf); i = j + 1;
    } else if (c === '`') {
      let j = i + 1, buf = '', glebokosc = 0;
      while (j < n) {
        if (kod[j] === '\\') { buf += kod[j + 1]; j += 2; continue; }
        if (kod[j] === '$' && kod[j + 1] === '{') { glebokosc++; buf += '\u0000'; j += 2; continue; }
        if (kod[j] === '}' && glebokosc) { glebokosc--; j++; continue; }
        if (kod[j] === '`' && !glebokosc) break;
        if (!glebokosc) buf += kod[j];
        j++;
      }
      szablony.push(buf); i = j + 1;
    } else i++;
  }
  return { stringi, szablony };
}

// ── Wyciąganie napisów z fragmentu HTML ─────────────────────────────────────
function zHtml(html, dodaj) {
  for (const m of html.matchAll(/\b(?:placeholder|title|alt)\s*=\s*"([^"\u0000]{2,220})"/g)) dodaj(m[1]);
  html = html.replace(/<style\b[\s\S]*?<\/style>/gi, ' ').replace(/<script\b[\s\S]*?<\/script>/gi, ' ');
  for (const kawalek of html.split(/<[^>]*>/)) {
    for (const linia of kawalek.split('\n')) dodaj(linia);
  }
}

// Napisy, które NIE trafiają na ekran — nie ma sensu ich tłumaczyć.
const IGNORUJ = [
  /^\[[a-zA-Z_-]+\]/,                        // komunikaty konsoli: [shares] …
  /\u0000/,                                  // fragment urwany przez ${…} — nie jest pełnym węzłem
  /=>|window\.|document\.|console\.|function\s*\(|return\s|typeof\s|\bvar\b|\bconst\b|\blet\b|\bnull\b|\bundefined\b/,
  /^[a-zA-Z_$][\w$]*\s*[:(=]/,               // fragment kodu: nazwa: wartość
  /^[-\w.]+\.(js|css|png|jpg|jpeg|svg|html|json|xlsx|pdf|md|sql)$/i,
  /^(https?|data|mailto|tel|blob|javascript):/i,
  /^[#.]?[\w-]+$/,                           // selektory CSS, klasy, gołe identyfikatory
  /^[\d\s.,:;%/+()–—-]+$/,                   // same liczby i separatory
  /^(px|em|rem|vh|vw|fr|auto|none|flex|grid|block|inline|bold|left|right|center|middle|nowrap|pointer|hidden|visible|solid|dashed|dotted|absolute|relative|fixed|sticky|border-box|transparent|currentColor|inherit|initial|unset)\b/,
  /^[—·,.;}\])'"+]/,                         // urwane kawałki dłuższych zdań
  // liczebniki z _fvWords(): kwota słownie jest drukowana WYŁĄCZNIE po polsku
  /^(zero|jeden|jedna|dwa|dwie|trzy|cztery|pięć|sześć|siedem|osiem|dziewięć|dziesięć|jedenaście|dwanaście|trzynaście|czternaście|piętnaście|szesnaście|siedemnaście|osiemnaście|dziewiętnaście|dwadzieścia|trzydzieści|czterdzieści|pięćdziesiąt|sześćdziesiąt|siedemdziesiąt|osiemdziesiąt|dziewięćdziesiąt|sto|dwieście|trzysta|czterysta|pięćset|sześćset|siedemset|osiemset|dziewięćset|tysiąc|tysiące|tysięcy|milion|miliony|milionów|miliard|miliardy|miliardów|złoty|złote|złotych|grosz|grosze|groszy)$/,
  /^(Polski|Angielski|Niemiecki|Czeski|Słowacki|Hiszpański)$/,     // nazwy języków w przełączniku
  /^(Facturación|Cerrar sesión|Iniciar sesión|Gestión|Módulo)/,    // hiszpańskie napisy z data-i18n
  // marki, jednostki i skróty jednakowe we wszystkich językach
  /^(WaterAI|Water AI|Supabase|Excel|PDF|CSV|JSON|XML|IBAN|SWIFT|BIC|VAT|DPH|USt|NIP|IČO|DIČ|REGON|EUR|PLN|CZK|CHF|GBP|HDD|CDD|TYM|TMY|ESCO|CO2|kWh|MWh|GJ|MJ|m³|m2|m3|°C|API|URL|ID|OK|SQL|RLS|UUID)$/,
  /^(ów|podmiot\(ów\)\.|lub „Odchyłka|ul\. Szczęsna 26)$/,         // urwane fragmenty i przykładowy adres
  // ── sygnatury kodu, który tokenizer wyciągnął jako string ──
  /[;=\[\]|]|&&|\|\||\+\+|--\s|\?\s*[a-zA-Z_$]|\b[a-zA-Z_$][\w$]*\.[a-zA-Z_$]/,
  /_[a-zA-Z]|[a-zA-Z]_/,                     // identyfikatory z podkreśleniem: _invSug, fv_doc
  /^[({[]|[,({[]$/,                          // urwane wyrażenia
  /\?v=\d/,                                  // adresy skryptów z cache-busterem
  /^\s*\/\//,                                // komentarz wciągnięty jako tekst
  /\$\{/,                                    // niepodstawiony placeholder
  /^\w+\/\w+([;+]|$)/,                       // typy MIME: application/json
  /^\d+(px|em|rem|%)\s/,                     // skróty CSS: „10px sans-serif"
  // dane rzeczywiste spółek grupy (adresy, numery rejestrowe) — nie są etykietami
  /^(ul\.|ulica|nám\.|Nám\.|Bahnhofstrasse|MONETA|Tatra|mBank|Raiffeisen|Komerční|Slovenská)/,
  /^[A-Z]{2,3}-?\d[\d.\- ]{5,}/,
  /<\/[a-z]|\/>|&nbsp;/,                     // urwane znaczniki HTML
  /^[a-z][\w-]*( [a-z][\w-]*)+$/,            // listy klas CSS: „icon-btn icon-btn-del"
  /^\d+ \d+px [\w-]+$/,                      // skróty font: „600 10px sans-serif"
  /^(Times New Roman|Cambria Math|Arial|Helvetica|Georgia|Verdana)$/,
  /^(Obchodný register|Zapsáno v obchodním|Commercial Register)/,   // wypisy z rejestrów spółek
  /^(Blue Boson AG|PostFinance AG|WaterAI Energy)$/,
  /^\d{2,3}[ -]?\d{2,3} [A-ZĽŠČ]/,           // adresy: „110 00 Praha 1", „02-454 Warszawa"
  /^(readTime|std,|anw-|OB-INT|clients v|objects v|workflow items)/,  // identyfikatory techniczne
  // ── symbole i skróty wzorów: takie same w każdym języku ──
  /^[A-ZΣ∑Δ]{1,3}[.\/#]?$/,
  /^(Tᵢ|ΣSD|∑SD|\/ ΣSD|\/ ∑SD|− Qs|Qs po|Qs przed|t TYM|t rzecz\.|HDD TYM|°C·dni|dni z₀|Dni z₀|PRZED→PO|T Outdoor|−15…\+10 ?°C|id, data|v[\d.]+)$/,
  // ── etykiety identyfikatorów podatkowych: zależą od KRAJU spółki, nie od języka UI ──
  /^(DIČ \(CZ…\)|IČ DPH \(SK…\)|VAT-UE \(PL…\)|USt-IdNr \(DE…\)|VAT Reg\. No\. \(GB…\)|Company No\.|Firmenbuchnr\.)$/,
  /^FV\/\d{4}\/\d{2}\/\d{3}$/,               // przykładowy numer faktury w podpowiedzi
  /^#[\w-]+ [a-z]+$/,                        // selektory CSS: „#module-content form"
  /^text-align:|^no-cache,/,                 // reguła CSS i nagłówek HTTP
  /^application\/[\w.+-]+$/,                 // typy MIME
  /^A\/#$/,                                  // symbol wzoru
  /^szt\.\)\?$/,                             // ogon zdania rozbitego przez ${…}
  // adresy i numery rejestrowe spółek grupy — dane, nie etykiety interfejsu
  /^(CH-\d{4} |Gartenstrasse |\d{8} \(IČO\))/
];
const pomijac = t => IGNORUJ.some(re => re.test(t));

// ── Zbieranie kandydatów ────────────────────────────────────────────────────
function zbierzNapisy() {
  const mapa = new Map();                          // napis -> Set(plik)
  for (const plik of PLIKI) {
    const p = path.join(ROOT, plik);
    if (!fs.existsSync(p)) continue;
    const kod = fs.readFileSync(p, 'utf8');
    const dodaj = (tekst) => {
      const t = String(tekst).replace(/\s+/g, ' ').trim();
      if (t.length < 2 || t.length > 220) return;
      if (!/[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]/.test(t)) return;
      if (pomijac(t)) return;
      if (!mapa.has(t)) mapa.set(t, new Set());
      mapa.get(t).add(plik);
    };

    if (plik.endsWith('.html')) zHtml(kod, dodaj);
    const { stringi, szablony } = tokenizuj(kod);
    for (const s of szablony) zHtml(s, dodaj);
    for (const s of stringi) {
      if (/<[a-z][^>]*>/i.test(s)) zHtml(s, dodaj);
      else for (const linia of s.split('\n')) dodaj(linia);
    }
  }
  return mapa;
}

// Dwa starsze, KOMPLETNE zestawy tłumaczeń w index.html:
//   `const translations` — ekran logowania i nagłówki, obsługa przez t()/data-i18n,
//   `const moduleLabels`  — nazwy i opisy kafelków modułów.
// Oba mają komplet języków (pl/en/de/cs/sk/es/at), więc ich wartości to gotowe
// teksty obce („Odhlásit se", „Energy use, costs, HDD and degree days."), a nie
// polskie napisy czekające na tłumaczenie. Bez tego odsiewu zalewały raport.
function wartosciStarychTlumaczen() {
  const kod = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const out = [];
  for (const nazwa of ['const translations = {', 'const moduleLabels = {']) {
    const start = kod.indexOf(nazwa);
    if (start === -1) continue;
    let i = kod.indexOf('{', start), depth = 0, k = i;
    while (k < kod.length) {
      if (kod[k] === '{') depth++;
      else if (kod[k] === '}' && --depth === 0) break;
      k++;
    }
    const blok = kod.slice(i, k + 1);
    for (const m of blok.matchAll(/"((?:[^"\\]|\\.)*)"/g)) out.push(m[1].replace(/\\"/g, '"'));
    for (const m of blok.matchAll(/'((?:[^'\\]|\\.)*)'/g)) out.push(m[1].replace(/\\'/g, "'"));
  }
  return out;
}

// ── Główna część ─────────────────────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2);
  const jsonOut = args.includes('--json');
  const listaFlag = args.indexOf('--lista');
  const listaLang = listaFlag !== -1 ? args[listaFlag + 1] : null;

  const W = zaladujSilnik().window;
  const dict = W.DomainI18n.dict;
  // Napis będący WARTOŚCIĄ w którymkolwiek słowniku to gotowe tłumaczenie wpisane
  // wprost w kod (np. hiszpańskie etykiety data-i18n w index.html), a nie polski
  // oryginał do przetłumaczenia.
  const tlumaczenia = new Set();
  for (const l of Object.keys(dict)) for (const k of Object.keys(dict[l])) tlumaczenia.add(dict[l][k]);
  // Drugi, starszy system tłumaczeń: obiekt `translations` w index.html obsługiwany
  // przez t() i atrybuty data-i18n. Jego wartości to gotowe teksty obce (np. „Odhlásit se"),
  // a nie polskie napisy do przetłumaczenia.
  for (const w of wartosciStarychTlumaczen()) tlumaczenia.add(w);
  const wszystkie = [...zbierzNapisy()].filter(([t]) => !tlumaczenia.has(t) || (t in (dict.sk || {})));

  // Brak = napisu nie ma wśród KLUCZY słownika danego języka. Wpis tożsamościowy
  // („Status" → „Status") liczy się jako pokryty — świadoma decyzja tłumacza.
  const wynik = {};
  for (const lang of LANGS) {
    const d = dict[lang] || {};
    wynik[lang] = wszystkie
      .filter(([t]) => !(t in d))
      .map(([t, pliki]) => ({ tekst: t, pliki: [...pliki] }));
  }

  if (jsonOut) {
    process.stdout.write(JSON.stringify({ sprawdzono: wszystkie.length, braki: wynik }, null, 2));
    return;
  }

  if (listaLang) {
    const b = wynik[listaLang];
    if (!b) { console.error('Nieznany język: ' + listaLang + '. Dostępne: ' + LANGS.join(', ')); process.exit(2); }
    console.log('Braki dla „' + listaLang + '" — ' + b.length + ' napisów:\n');
    b.sort((x, y) => x.tekst.localeCompare(y.tekst, 'pl'))
     .forEach(x => console.log('  ' + JSON.stringify(x.tekst) + '   [' + x.pliki.map(f => path.basename(f)).join(', ') + ']'));
    return;
  }

  console.log('Audyt tłumaczeń — sprawdzono ' + wszystkie.length + ' napisów widocznych w interfejsie\n');
  let suma = 0;
  for (const lang of LANGS) {
    const n = wynik[lang].length;
    suma += n;
    const pokrycie = ((1 - n / wszystkie.length) * 100).toFixed(1);
    console.log('  ' + lang.toUpperCase() + '  pokrycie ' + String(pokrycie).padStart(5) + '%   braków: ' + n);
  }
  console.log('\n  at = de (wspólny obiekt słownika)');
  console.log('\nSzczegóły: node narzedzia/audyt-i18n.js --lista sk');
  process.exitCode = suma === 0 ? 0 : 1;           // przydatne w CI
}

main();

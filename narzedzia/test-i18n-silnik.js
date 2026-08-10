#!/usr/bin/env node
/**
 * Testy silnika tłumaczeń — WaterAI Energy Control
 * ─────────────────────────────────────────────────────────────────────────────
 * Audyt (narzedzia/audyt-i18n.js) sprawdza, czy napis JEST w słowniku.
 * Ten skrypt sprawdza, czy silnik faktycznie go PODMIENIA — to dwie różne rzeczy
 * i rozjechały się na raporcie ESCO: klucze były w słowniku, a tekst zostawał
 * po polsku, bo węzeł w DOM nie był w całości kluczem.
 *
 * Sprawdza trzy rzeczy:
 *
 *  1. WĘZŁY SKLEJONE Z INTERPOLACJI — w kodzie napis przerywa ${…}, ale w DOM
 *     to jeden węzeł tekstowy: „Data raportu: 22.08.2026". Dopasowanie dokładne
 *     tu nie zadziała, musi zadziałać pass podłańcuchowy.
 *
 *  2. IDEMPOTENCJA — MutationObserver uruchamia apply() wielokrotnie, więc silnik
 *     przejeżdża po tekście, który JUŻ jest przetłumaczony. Drugi przebieg nie
 *     może niczego zmienić. To zabezpieczenie zastąpiło dawną listę polskich
 *     rdzeni, która blokowała pass podłańcuchowy i gubiła napisy bez znaków
 *     diakrytycznych.
 *
 *  3. BRAK KANIBALIZACJI — tłumaczenie jednego języka nie może być przerobione
 *     przez klucze polskie przy przełączeniu na inny język.
 *
 * Użycie: node narzedzia/test-i18n-silnik.js [--pokaz]
 */

'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const LANGS = ['sk', 'cs', 'en', 'de', 'es'];
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
  'js/modules/i18n-ui-core-4.js',
  'js/modules/i18n-ui-core-5.js',
  'js/modules/i18n-ui-core-3.js'
];

function zaladuj() {
  const sandbox = {
    console: { log() {}, info() {}, warn() {}, error() {} },
    setTimeout, clearTimeout,
    NodeFilter: { SHOW_TEXT: 4, FILTER_REJECT: 2, FILTER_ACCEPT: 1 },
    MutationObserver: function () { this.observe = function () {}; },
    CanvasRenderingContext2D: null,
    alert() {}, confirm() {}, prompt() {},
    currentLanguage: 'pl'
  };
  sandbox.window = sandbox;
  sandbox.document = {
    readyState: 'complete', addEventListener() {},
    createTreeWalker() { return { nextNode() { return null; } }; },
    body: {}, querySelectorAll() { return []; }
  };
  vm.createContext(sandbox);
  for (const f of SLOWNIKI) {
    const p = path.join(ROOT, f);
    if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), sandbox, { filename: f });
  }
  return sandbox.window.DomainI18n;
}

const I = zaladuj();
// Litery WYŁĄCZNIE polskie. Bez „ó" — tej używa też hiszpański („Cálculo" ma „á",
// „reducción" ma „ó"), więc jej obecność nie dowodzi, że napis został po polsku.
const POLSKIE = /[ąćęłńśźżĄĆĘŁŃŚŹŻ]/;
let bledy = 0;
function blad(msg) { bledy++; console.log('  ✗ ' + msg); }

// ── 1. Węzły sklejone z interpolacji ─────────────────────────────────────────
// Tak wyglądają w DOM po wstawieniu wartości — dokładnie te, które użytkownik
// zgłosił jako nieprzetłumaczone na słowackim raporcie ESCO.
const WEZLY = [
  'Data raportu: 22.08.2026',
  'Prognoza zakłada dodatkowo: ',
  ', niezmieniony sposób użytkowania obiektu oraz',
  'rocznie wg normy TYM dla lokalizacji obiektu. Wyliczenie:',
  'Korekta TYM · Restauracja · Pri Lipe',
  '35,6% redukcji',
  'Wydruk z dnia: 22.08.2026',
  'Okres bazowy: 12.03.2026 – 20.04.2026',
  'Zużycie bazowe: 1047,00 m³',
  'Termin płatności: 22.08.2026'
];

console.log('1. Węzły sklejone z interpolacji ${…}:');
for (const lang of LANGS) {
  for (const w of WEZLY) {
    const t = I.translateTo(w, lang);
    if (POLSKIE.test(t)) blad(lang + '  ' + JSON.stringify(w) + '\n        → ' + JSON.stringify(t));
  }
}

// ── Atrapa DOM: tyle, ile potrzebuje silnik ─────────────────────────────────
// Silnik chodzi po węzłach tekstowych przez TreeWalker i podmienia nodeValue.
// Odtwarzamy minimalne API, żeby przetestować PEŁNĄ ścieżkę — z pamięcią
// oryginałów włącznie — a nie samą funkcję tłumaczącą.
function zrobDom(teksty) {
  const wezly = teksty.map(t => ({ nodeValue: t, parentNode: { nodeName: 'DIV', hasAttribute: () => false } }));
  return {
    wezly,
    body: {
      querySelectorAll: () => [],
      _wezly: wezly
    }
  };
}

function silnikZDom(dom) {
  const sandbox = {
    console: { log() {}, info() {}, warn() {}, error() {} },
    setTimeout, clearTimeout,
    NodeFilter: { SHOW_TEXT: 4, FILTER_REJECT: 2, FILTER_ACCEPT: 1 },
    MutationObserver: function () { this.observe = function () {}; },
    CanvasRenderingContext2D: null,
    alert() {}, confirm() {}, prompt() {},
    currentLanguage: 'pl'
  };
  sandbox.window = sandbox;
  sandbox.document = {
    readyState: 'complete',
    addEventListener() {},
    body: dom.body,
    querySelectorAll: () => [],
    createTreeWalker(root, what, filtr) {
      let i = -1;
      return {
        nextNode() {
          while (++i < dom.wezly.length) {
            const n = dom.wezly[i];
            if (!filtr || filtr.acceptNode(n) === 1) return n;
          }
          return null;
        }
      };
    }
  };
  vm.createContext(sandbox);
  for (const f of SLOWNIKI) {
    const p = path.join(ROOT, f);
    if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), sandbox, { filename: f });
  }
  return sandbox;
}

// Realistyczna zawartość ekranu: etykiety, węzły sklejone i tekst wielozdaniowy.
const EKRAN = [
  'Data raportu: 22.08.2026',
  'Korekta TYM · Restauracja · Pri Lipe',
  'Termin płatności',
  'Sprzedawca',
  'Nabywca',
  'Rola',
  'Role',
  'Termin',
  'Okres bazowy: 12.03.2026 – 20.04.2026',
  'Zużycie bazowe: 1047,00 m³',
  'Klient',
  'Status'
];

// ── 2. Idempotencja: apply() biegnie po każdym renderze ──────────────────────
// MutationObserver wywołuje apply() wielokrotnie na tym samym drzewie. Drugi
// i trzeci przebieg nie mogą już niczego zmienić.
console.log('2. Idempotencja — trzy kolejne przebiegi apply() na tym samym DOM:');
for (const lang of LANGS) {
  const dom = zrobDom(EKRAN);
  const sb = silnikZDom(dom);
  sb.currentLanguage = lang; sb.window.currentLanguage = lang;
  sb.window.DomainI18n.apply();
  const po1 = dom.wezly.map(n => n.nodeValue);
  sb.window.DomainI18n.apply();
  sb.window.DomainI18n.apply();
  const po3 = dom.wezly.map(n => n.nodeValue);
  for (let i = 0; i < po1.length; i++) {
    if (po1[i] !== po3[i]) {
      blad(lang + '  ' + JSON.stringify(EKRAN[i]) +
           '\n        1. przebieg: ' + JSON.stringify(po1[i]) +
           '\n        3. przebieg: ' + JSON.stringify(po3[i]));
    }
  }
  // po przetłumaczeniu nie może zostać polski znak diakrytyczny
  for (let i = 0; i < po1.length; i++) {
    if (POLSKIE.test(po1[i]) && !POLSKIE.test(EKRAN[i].replace(/[^\wąćęłńóśźżĄĆĘŁŃÓŚŹŻ ]/g, ''))) continue;
    if (POLSKIE.test(po1[i])) blad(lang + '  zostało po polsku: ' + JSON.stringify(po1[i]));
  }
}

// ── 3. Przełączanie języka tam i z powrotem ─────────────────────────────────
// PL → SK → DE → PL. Każdy język musi dać ten sam wynik co tłumaczenie wprost
// z polskiego, a powrót na PL — dokładnie oryginał. To był realny błąd: tekst
// słowacki podawany na wejście czeskiego dawał hybrydę („dni" → „dny").
console.log('3. Przełączanie języka PL → SK → DE → ES → PL:');
{
  const dom = zrobDom(EKRAN);
  const sb = silnikZDom(dom);
  const wprost = {};
  for (const l of ['sk', 'de', 'es']) {
    const d2 = zrobDom(EKRAN), s2 = silnikZDom(d2);
    s2.currentLanguage = l; s2.window.currentLanguage = l;
    s2.window.DomainI18n.apply();
    wprost[l] = d2.wezly.map(n => n.nodeValue);
  }
  for (const l of ['sk', 'de', 'es']) {
    sb.currentLanguage = l; sb.window.currentLanguage = l;
    sb.window.DomainI18n.apply();
    const teraz = dom.wezly.map(n => n.nodeValue);
    for (let i = 0; i < teraz.length; i++) {
      if (teraz[i] !== wprost[l][i]) {
        blad('po przełączeniu na ' + l + ': ' + JSON.stringify(EKRAN[i]) +
             '\n        oczekiwano: ' + JSON.stringify(wprost[l][i]) +
             '\n        otrzymano:  ' + JSON.stringify(teraz[i]));
      }
    }
  }
  sb.currentLanguage = 'pl'; sb.window.currentLanguage = 'pl';
  sb.window.DomainI18n.apply();
  const powrot = dom.wezly.map(n => n.nodeValue);
  for (let i = 0; i < powrot.length; i++) {
    if (powrot[i] !== EKRAN[i]) {
      blad('powrót na PL: ' + JSON.stringify(EKRAN[i]) + '\n        otrzymano: ' + JSON.stringify(powrot[i]));
    }
  }
}

if (process.argv.includes('--pokaz')) {
  console.log('\nPodgląd — zgłoszone węzły raportu ESCO po słowacku:');
  for (const w of WEZLY) console.log('  ' + JSON.stringify(w) + '\n    → ' + JSON.stringify(I.translateTo(w, 'sk')));
}

console.log('\n' + (bledy === 0 ? '✓ Wszystkie testy przeszły.' : '✗ Błędów: ' + bledy));
process.exitCode = bledy === 0 ? 0 : 1;

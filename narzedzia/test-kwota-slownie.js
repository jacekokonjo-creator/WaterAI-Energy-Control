#!/usr/bin/env node
/**
 * Testy kwoty słownie — WaterAI Energy Control
 * ─────────────────────────────────────────────────────────────────────────────
 * Sprawdza js/modules/amount-words.js: liczebniki, odmianę walut i uzgodnienie
 * rodzaju gramatycznego w sześciu językach (pl, sk, cs, en, de, es; at = de).
 *
 * Użycie:
 *   node narzedzia/test-kwota-slownie.js            — testy (kod wyjścia 0/1)
 *   node narzedzia/test-kwota-slownie.js --pokaz    — podgląd przykładowych kwot
 */

'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const sandbox = { console };
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/modules/amount-words.js'), 'utf8'), sandbox);
const A = sandbox.window.AmountWords;

let bledy = 0;
function sprawdz(opis, otrzymano, oczekiwano) {
  if (otrzymano !== oczekiwano) {
    bledy++;
    console.log('  ✗ ' + opis + '\n      oczekiwano: ' + JSON.stringify(oczekiwano) +
                '\n      otrzymano:  ' + JSON.stringify(otrzymano));
  }
}

// ── Liczebniki: progi, na których łamią się reguły odmiany ──
const LICZBY = {
  pl: { 0: 'zero', 1: 'jeden', 2: 'dwa', 5: 'pięć', 12: 'dwanaście', 21: 'dwadzieścia jeden',
        100: 'sto', 101: 'sto jeden', 200: 'dwieście', 999: 'dziewięćset dziewięćdziesiąt dziewięć',
        1000: 'tysiąc', 2000: 'dwa tysiące', 5000: 'pięć tysięcy',
        21000: 'dwadzieścia jeden tysięcy', 1000000: 'milion', 2000000: 'dwa miliony' },
  // słowacki skleja liczebnik w jedno słowo aż do miliona (Pravidlá slov. pravopisu)
  sk: { 0: 'nula', 1: 'jeden', 2: 'dva', 5: 'päť', 12: 'dvanásť', 21: 'dvadsaťjeden',
        100: 'sto', 101: 'stojeden', 200: 'dvesto', 999: 'deväťstodeväťdesiatdeväť',
        1000: 'tisíc', 1002: 'tisícdva', 2000: 'dvetisíc', 5000: 'päťtisíc',
        21000: 'dvadsaťjedentisíc', 22000: 'dvadsaťdvatisíc',
        234000: 'dvestotridsaťštyritisíc',
        1000000: 'milión', 2000000: 'dva milióny',
        1234567: 'milión dvestotridsaťštyritisícpäťstošesťdesiatsedem' },
  cs: { 0: 'nula', 1: 'jeden', 2: 'dva', 5: 'pět', 12: 'dvanáct', 21: 'dvacet jeden',
        100: 'sto', 101: 'sto jeden', 200: 'dvě stě', 999: 'devět set devadesát devět',
        1000: 'tisíc', 2000: 'dva tisíce', 5000: 'pět tisíc',
        21000: 'dvacet jeden tisíc', 1000000: 'milion', 2000000: 'dva miliony' },
  en: { 0: 'zero', 1: 'one', 2: 'two', 5: 'five', 12: 'twelve', 21: 'twenty-one',
        100: 'one hundred', 101: 'one hundred one', 200: 'two hundred',
        999: 'nine hundred ninety-nine', 1000: 'one thousand', 2000: 'two thousand',
        5000: 'five thousand', 21000: 'twenty-one thousand',
        1000000: 'one million', 2000000: 'two million' },
  de: { 0: 'null', 1: 'eins', 2: 'zwei', 5: 'fünf', 12: 'zwölf', 21: 'einundzwanzig',
        100: 'einhundert', 101: 'einhunderteins', 200: 'zweihundert',
        999: 'neunhundertneunundneunzig', 1000: 'eintausend', 2000: 'zweitausend',
        5000: 'fünftausend', 21000: 'einundzwanzigtausend',
        1000000: 'eine Million', 2000000: 'zwei Millionen' },
  es: { 0: 'cero', 1: 'uno', 2: 'dos', 5: 'cinco', 12: 'doce', 21: 'veintiuno',
        100: 'cien', 101: 'ciento uno', 200: 'doscientos',
        999: 'novecientos noventa y nueve', 1000: 'mil', 2000: 'dos mil',
        5000: 'cinco mil', 21000: 'veintiún mil',
        1000000: 'un millón', 2000000: 'dos millones' }
};

console.log('Liczebniki:');
for (const lang of Object.keys(LICZBY)) {
  for (const n of Object.keys(LICZBY[lang])) {
    // standalone: pojedyncza liczba bez rzeczownika (stąd „eins", „uno")
    sprawdz(lang + ' ' + n, A.toWords(Number(n), lang), LICZBY[lang][n]);
  }
}

// ── Uzgodnienie rodzaju: „dwa złote" vs „dwie korony" ──
console.log('Rodzaj gramatyczny waluty:');
const RODZAJ = [
  ['pl', 2, 'PLN', 'dwa złote 00/100'],
  ['pl', 2, 'CZK', 'dwie korony czeskie 00/100'],
  ['pl', 2, 'EUR', 'dwa euro 00/100'],
  ['pl', 1, 'CZK', 'jedna korona czeska 00/100'],
  ['sk', 2, 'EUR', 'dve eurá 00/100'],
  ['sk', 2, 'PLN', 'dva zloté 00/100'],
  ['sk', 1, 'CZK', 'jedna česká koruna 00/100'],
  ['cs', 2, 'EUR', 'dvě eura 00/100'],
  ['cs', 2, 'PLN', 'dva zloté 00/100'],
  ['cs', 5, 'CZK', 'pět korun českých 00/100'],
  ['es', 1, 'EUR', 'un euro 00/100'],
  ['es', 1, 'CZK', 'una corona checa 00/100'],
  ['es', 200, 'CZK', 'doscientas coronas checas 00/100'],
  ['es', 200, 'EUR', 'doscientos euros 00/100'],
  // 21 przed rzeczownikiem skraca się: veintiún / veintiuna
  ['es', 21, 'EUR', 'veintiún euros 00/100'],
  ['es', 21, 'CZK', 'veintiuna coronas checas 00/100'],
  ['de', 1, 'CZK', 'eine Tschechische Krone 00/100'],
  ['de', 21, 'EUR', 'einundzwanzig Euro 00/100'],
  ['de', 1, 'GBP', 'ein Britisches Pfund 00/100'],
  // 21 przed rzeczownikiem skraca się: veintiún / veintiuna
  ['es', 21, 'EUR', 'veintiún euros 00/100'],
  ['es', 21, 'CZK', 'veintiuna coronas checas 00/100'],
  ['de', 1, 'CZK', 'eine Tschechische Krone 00/100'],
  ['de', 21, 'EUR', 'einundzwanzig Euro 00/100'],
  ['en', 1, 'EUR', 'one euro 00/100'],
  ['en', 2, 'EUR', 'two euros 00/100'],
  ['de', 1, 'EUR', 'ein Euro 00/100'],
  ['de', 2, 'EUR', 'zwei Euro 00/100']
];
for (const [lang, v, cur, oczek] of RODZAJ) {
  sprawdz(lang + ' ' + v + ' ' + cur, A.amount(v, cur, lang), oczek);
}

// ── Kwota z groszami — realna faktura z ekranu ──
console.log('Pełne kwoty:');
const KWOTY = [
  ['pl', 282.69, 'EUR', 'dwieście osiemdziesiąt dwa euro 69/100'],
  ['sk', 282.69, 'EUR', 'dvestoosemdesiatdva eur 69/100'],
  ['cs', 282.69, 'EUR', 'dvě stě osmdesát dva eur 69/100'],
  ['en', 282.69, 'EUR', 'two hundred eighty-two euros 69/100'],
  ['de', 282.69, 'EUR', 'zweihundertzweiundachtzig Euro 69/100'],
  ['es', 282.69, 'EUR', 'doscientos ochenta y dos euros 69/100'],
  ['at', 282.69, 'EUR', 'zweihundertzweiundachtzig Euro 69/100'],
  // zaokrąglenie setnych nie może zgubić grosza
  ['pl', 0.005, 'PLN', 'zero złotych 01/100'],
  ['pl', 1234.5, 'PLN', 'tysiąc dwieście trzydzieści cztery złote 50/100'],
  // waluta spoza tabeli — zostaje kod ISO, liczba nadal słownie
  ['pl', 5, 'USD', 'pięć USD 00/100']
];
for (const [lang, v, cur, oczek] of KWOTY) {
  sprawdz(lang + ' ' + v + ' ' + cur, A.amount(v, cur, lang), oczek);
}

if (process.argv.includes('--pokaz')) {
  console.log('\nPodgląd — 1 234 567,89 w każdym języku:');
  for (const l of ['pl', 'sk', 'cs', 'en', 'de', 'es']) {
    console.log('  ' + l.toUpperCase() + '  ' + A.amount(1234567.89, 'EUR', l));
  }
}

console.log('\n' + (bledy === 0 ? '✓ Wszystkie testy przeszły.' : '✗ Błędów: ' + bledy));
process.exitCode = bledy === 0 ? 0 : 1;

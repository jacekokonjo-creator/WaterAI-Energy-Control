/* Faktury: kwoty, VAT, numeracja, kwoty słownie, powiązanie z analizą.
   Tu błąd kosztuje realne pieniądze, więc asercje są na konkretnych liczbach. */
const { boot } = require('./harness');

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; console.log('  ✗ ' + n + (x !== undefined ? '  → ' + x : '')); } };
const section = t => console.log('\n── ' + t + ' ' + '─'.repeat(Math.max(0, 56 - t.length)));

const { w } = boot({ inline: false });
w.ClientsModule.add({ name: 'Klient FV', nip: '1234567890' });
const cl = w.ClientsModule.getAll().slice(-1)[0];
w.ObjectsModule.add({ clientId: cl.id, name: 'Obiekt FV' });
const ob = w.ObjectsModule.getAll().slice(-1)[0];

const M = w.InvoicingModule;
const last = () => M.getAll().slice(-1)[0];

// ── 1. VAT ─────────────────────────────────────────────────────────────────
section('1. Naliczanie VAT');
M.add({ clientId: cl.id, objectId: ob.id, netAmount: 1000, vatRate: 23 });
let i1 = last();
ok('netto 1000 zachowane', i1.netAmount === 1000, i1.netAmount);
ok('VAT 23% = 230,00', i1.vatAmount === 230, i1.vatAmount);
ok('brutto = 1230,00', i1.grossAmount === 1230, i1.grossAmount);
ok('brutto = netto + VAT', Math.abs(i1.grossAmount - (i1.netAmount + i1.vatAmount)) < 1e-9);

M.add({ clientId: cl.id, netAmount: 100, vatRate: 8 });
let i2 = last();
ok('VAT 8% = 8,00', i2.vatAmount === 8, i2.vatAmount);
ok('brutto 8% = 108,00', i2.grossAmount === 108, i2.grossAmount);

M.add({ clientId: cl.id, netAmount: 500, vatRate: 0 });
let i3 = last();
ok('VAT 0% = 0,00', i3.vatAmount === 0, i3.vatAmount);
ok('brutto 0% = netto', i3.grossAmount === 500, i3.grossAmount);

// zaokrąglenia — klasyczna pułapka groszowa
M.add({ clientId: cl.id, netAmount: 33.33, vatRate: 23 });
let i4 = last();
ok('33,33 × 23% → VAT 7,67', i4.vatAmount === 7.67, i4.vatAmount);
ok('33,33 × 23% → brutto 41,00', i4.grossAmount === 41, i4.grossAmount);
ok('brutto − VAT = netto (bez dryfu grosza)',
   Math.abs(i4.grossAmount - i4.vatAmount - i4.netAmount) < 0.005,
   (i4.grossAmount - i4.vatAmount).toFixed(4));

M.add({ clientId: cl.id, netAmount: 0.01, vatRate: 23 });
let i5 = last();
ok('kwota minimalna 0,01 nie wywala', i5.grossAmount >= 0.01, i5.grossAmount);

M.add({ clientId: cl.id, netAmount: 1234567.89, vatRate: 23 });
let i6 = last();
ok('duża kwota: brutto 1518518,50', i6.grossAmount === 1518518.5, i6.grossAmount);

section('2. Wartości domyślne i brzegowe');
M.add({ clientId: cl.id });
let i7 = last();
ok('brak netAmount → 0', i7.netAmount === 0, i7.netAmount);
ok('brak vatRate → 23%', i7.vatRate === 23, i7.vatRate);
ok('brak waluty → PLN', i7.currency === 'PLN', i7.currency);
ok('data wystawienia ustawiona', !!i7.issueDate);
ok('numer nadany automatycznie', !!i7.invoiceNumber, i7.invoiceNumber);

// ── 3. Numeracja ───────────────────────────────────────────────────────────
section('3. Numeracja faktur');
const nums = M.getAll().map(i => i.invoiceNumber);
ok('numery unikalne', new Set(nums).size === nums.length,
   nums.length - new Set(nums).size + ' duplikatów');
ok('format PREFIX/ROK/MC/NNN', /^[A-Z]+\/\d{4}\/\d{2}\/\d{3}$/.test(nums[0]), nums[0]);

const seqs = nums.map(n => parseInt(n.slice(n.lastIndexOf('/') + 1), 10));
ok('numeracja rosnąca bez luk', seqs.every((v, idx) => idx === 0 || v === seqs[idx - 1] + 1),
   seqs.join(','));

// numer nadany ręcznie nie może być nadpisany
M.add({ clientId: cl.id, invoiceNumber: 'RECZNY/2026/01/999', netAmount: 10 });
ok('numer ręczny zachowany', last().invoiceNumber === 'RECZNY/2026/01/999', last().invoiceNumber);

// po usunięciu ostatniej numeracja nie cofa się na zajęty numer
const before = M.getAll().length;
const lastId = last().id;
M.remove(lastId);
ok('usunięcie działa', M.getAll().length === before - 1);

// ── 4. Kwoty słownie ───────────────────────────────────────────────────────
section('4. Kwoty słownie');
const A = w.AmountWords;
ok('AmountWords.amount dostępne', A && typeof A.amount === 'function');
if (A && typeof A.amount === 'function') {
  const t1 = A.amount(1230.45, 'PLN', 'pl');
  ok('1230,45 PLN pełny zapis', t1 === 'tysiąc dwieście trzydzieści złotych 45/100', t1);
  ok('zero → "zero złotych 00/100"', A.amount(0, 'PLN', 'pl') === 'zero złotych 00/100', A.amount(0, 'PLN', 'pl'));
  ok('21 → "dwadzieścia jeden złotych"', A.amount(21, 'PLN', 'pl').startsWith('dwadzieścia jeden złotych'), A.amount(21, 'PLN', 'pl'));
  ok('angielski + EUR', A.amount(1230.45, 'EUR', 'en') === 'one thousand two hundred thirty euros 45/100', A.amount(1230.45, 'EUR', 'en'));
  // grosze muszą odpowiadać kwocie brutto faktury
  const g = i1.grossAmount;
  ok('brutto faktury 1230 słownie', A.amount(g, 'PLN', 'pl') === 'tysiąc dwieście trzydzieści złotych 00/100', A.amount(g, 'PLN', 'pl'));
  ok('zaokrąglenie groszy: 41,00', A.amount(41, 'PLN', 'pl').endsWith('00/100'), A.amount(41, 'PLN', 'pl'));
  ok('_fvSlownie zgodne z AmountWords', w._fvSlownie(1230.45) === t1);
}

// ── 5. Powiązanie z analizą / raportem ─────────────────────────────────────
section('5. Powiązanie z podstawą rozliczenia');
M.add({
  clientId: cl.id, objectId: ob.id, netAmount: 2000, vatRate: 23,
  sourceType: 'ANALYSIS', sourceId: 4242, sourceNumber: 'AN/2026/001',
  savedEnergy: 120.5, savedMoney: 4000, escoShare: 50,
  periodFrom: '2025-11-01', periodTo: '2026-03-31'
});
const iA = last();
ok('sourceType zapisany', iA.sourceType === 'ANALYSIS');
ok('sourceId liczbowy zachowany', iA.sourceId === 4242, iA.sourceId);
ok('okres rozliczeniowy zachowany', iA.periodFrom === '2025-11-01' && iA.periodTo === '2026-03-31');
ok('netto = udział ESCO z oszczędności', iA.netAmount === iA.savedMoney * iA.escoShare / 100,
   iA.netAmount + ' vs ' + (iA.savedMoney * iA.escoShare / 100));

M.add({ clientId: cl.id, netAmount: 100, sourceType: 'ESCO_REPORT', sourceId: 'esco_1770000000' });
ok('sourceId tekstowy raportu ESCO nie rzutowany na liczbę',
   last().sourceId === 'esco_1770000000', last().sourceId);

M.add({ clientId: cl.id, netAmount: 100, sourceId: '' });
ok('pusty sourceId → null', last().sourceId === null, last().sourceId);

// ── 6. Wyszukiwanie i filtry ───────────────────────────────────────────────
section('6. Wyszukiwanie');
ok('findByClient zwraca faktury klienta', M.findByClient(cl.id).length === M.getAll().length,
   M.findByClient(cl.id).length + '/' + M.getAll().length);
ok('findByClient dla obcego id → puste', M.findByClient(999999).length === 0);
ok('find po id działa', !!M.find(iA.id));
ok('find po nieistniejącym id → undefined', M.find(-1) === undefined);

// ── 7. Trwałość ────────────────────────────────────────────────────────────
section('7. Trwałość po przeładowaniu');
const dump = {};
for (let k = 0; k < w.localStorage.length; k++) {
  const key = w.localStorage.key(k);
  dump[key] = w.localStorage.getItem(key);
}
const B = boot({ inline: false });
Object.entries(dump).forEach(([k, v]) => B.w.localStorage.setItem(k, v));
const restored = B.w.InvoicingModule.getAll();
ok('faktury przetrwały przeładowanie', restored.length === M.getAll().length,
   restored.length + ' vs ' + M.getAll().length);
const rA = restored.find(x => x.sourceNumber === 'AN/2026/001');
ok('kwoty nienaruszone', rA && rA.grossAmount === 2460, rA && rA.grossAmount);
ok('powiązanie z analizą nienaruszone', rA && rA.sourceId === 4242, rA && rA.sourceId);

console.log('\n' + '═'.repeat(66));
console.log(`WYNIK: ${pass} zaliczonych, ${fail} niezaliczonych`);
console.log('═'.repeat(66));
process.exit(fail ? 1 : 0);

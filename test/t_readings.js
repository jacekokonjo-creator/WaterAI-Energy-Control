/* Odczyty: przeliczniki jednostek, normalizacja pól, identyfikatory.
   Odczyty zasilają regresję i podsumowania kosztów, więc błąd tutaj
   wchodzi wprost w wyniki rozliczeniowe. */
const { boot } = require('./harness');

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; console.log('  ✗ ' + n + (x !== undefined ? '  → ' + x : '')); } };
const section = t => console.log('\n── ' + t + ' ' + '─'.repeat(Math.max(0, 56 - t.length)));

const { w } = boot({ inline: false });
const R = w.ReadingsModule;

w.ClientsModule.add({ name: 'Klient Odczyty', nip: '4444444444' });
const cl = w.ClientsModule.getAll().slice(-1)[0];
w.ObjectsModule.add({ clientId: cl.id, name: 'Obiekt O', energyUnit: 'GJ' });
const ob = w.ObjectsModule.getAll().slice(-1)[0];

// ── 1. Przeliczniki jednostek energii ──────────────────────────────────────
section('1. Przeliczniki jednostek (wartości fizyczne)');
// 1 GJ = 10^9 J; 1 kWh = 3,6·10^6 J  →  1 GJ = 277,777… kWh
const GJ_TO_KWH = 1e9 / 3.6e6;
const used = w.eval("(function(){ var s=String(_rdEscoSummaryHtml); var m=s.match(/GJ:\\s*([0-9.]+)/); return m?Number(m[1]):null; })()");
ok('tabela przeliczników odczytana z kodu', used != null, used);
if (used != null) {
  ok('1 GJ → kWh (dokładnie 277,777…)', Math.abs(used - GJ_TO_KWH) < 0.01,
     'w kodzie ' + used + ', poprawnie ' + GJ_TO_KWH.toFixed(4));
  // błąd względny na typowym rocznym zużyciu 2000 GJ
  const errKWh = Math.abs(used - GJ_TO_KWH) * 2000;
  ok('błąd na 2000 GJ poniżej 10 kWh', errKWh < 10, errKWh.toFixed(2) + ' kWh');
}
const mwh = w.eval("(function(){ var m=String(_rdEscoSummaryHtml).match(/MWh:\\s*([0-9.]+)/); return m?Number(m[1]):null; })()");
ok('1 MWh = 1000 kWh', mwh === 1000, mwh);
const kwh = w.eval("(function(){ var m=String(_rdEscoSummaryHtml).match(/kWh:\\s*([0-9.]+)/); return m?Number(m[1]):null; })()");
ok('1 kWh = 1 kWh', kwh === 1, kwh);

// ── 2. Normalizacja rekordu ────────────────────────────────────────────────
section('2. Normalizacja pól');
R.add({ objectId: ob.id, date: '2026-01-15', value: 123.45, unit: 'GJ', medium: 'HEAT' });
let r1 = R.getAll().slice(-1)[0];
ok('wartość zachowana', Number(r1.value) === 123.45, r1.value);
ok('jednostka zachowana', r1.unit === 'GJ', r1.unit);
ok('id nadane', !!r1.id);

R.add({ objectId: ob.id, date: '2026-01-16', value: 0, unit: 'GJ' });
let r0 = R.getAll().slice(-1)[0];
ok('wartość 0 nie zamienia się na null/domyślną', Number(r0.value) === 0, r0.value);

R.add({ objectId: ob.id, date: '2026-01-17', value: 10, unit: 'GJ', unitCost: 0 });
ok('unitCost = 0 zachowany (nie null)', Number(R.getAll().slice(-1)[0].unitCost) === 0,
   R.getAll().slice(-1)[0].unitCost);

R.add({ objectId: ob.id, date: '2026-01-18', value: 10, unit: 'GJ', unitCost: '' });
ok('unitCost pusty → null', R.getAll().slice(-1)[0].unitCost === null,
   R.getAll().slice(-1)[0].unitCost);

// ── 3. Przelicznik gazu ────────────────────────────────────────────────────
section('3. Przelicznik gazu m³ → kWh');
// typowy współczynnik dla gazu E w Polsce ≈ 11,0–11,5 kWh/m³
const kwhZ = 1000 * 11.2;
ok('1000 m³ × 11,2 = 11 200 kWh', Math.abs(kwhZ - 11200) < 1e-9, kwhZ);
R.add({ objectId: ob.id, date: '2026-02-01', value: 11200, unit: 'kWh', medium: 'GAS',
        gasMeterM3: 1000, gasFactor: 11.2 });
const rg = R.getAll().slice(-1)[0];
ok('m³ z licznika zapisane', Number(rg.gasMeterM3) === 1000, rg.gasMeterM3);
ok('współczynnik zapisany', Number(rg.gasFactor) === 11.2, rg.gasFactor);
ok('m³ × współczynnik = zapisana energia',
   Math.abs(Number(rg.gasMeterM3) * Number(rg.gasFactor) - Number(rg.value)) < 1e-6,
   rg.gasMeterM3 + '×' + rg.gasFactor + ' vs ' + rg.value);

// ── 4. Identyfikatory ──────────────────────────────────────────────────────
section('4. Identyfikatory (import seryjny)');
for (let i = 0; i < 300; i++) {
  R.add({ objectId: ob.id, date: '2026-03-' + String((i % 28) + 1).padStart(2, '0'), value: i, unit: 'GJ' });
}
const ids = R.getAll().map(x => x.id);
ok('300 odczytów w pętli → unikalne id', new Set(ids).size === ids.length,
   (ids.length - new Set(ids).size) + ' duplikatów');
const nBefore = R.getAll().length;
R.remove(ids[100]);
ok('usunięcie jednego usuwa dokładnie jeden', R.getAll().length === nBefore - 1, R.getAll().length);
ok('find po id trafia we właściwy rekord', R.find(ids[5]) && R.find(ids[5]).id === ids[5]);

// ── 5. Filtrowanie po obiekcie ─────────────────────────────────────────────
section('5. Separacja obiektów');
w.ObjectsModule.add({ clientId: cl.id, name: 'Obiekt B', energyUnit: 'GJ' });
const ob2 = w.ObjectsModule.getAll().slice(-1)[0];
R.add({ objectId: ob2.id, date: '2026-04-01', value: 999, unit: 'GJ' });
const byObj = typeof R.findByObject === 'function' ? R.findByObject(ob.id) : R.getAll().filter(x => Number(x.objectId) === Number(ob.id));
ok('odczyty obiektu A nie zawierają wartości z B',
   !byObj.some(x => Number(x.value) === 999), 'przeciek między obiektami');
const byObj2 = typeof R.findByObject === 'function' ? R.findByObject(ob2.id) : R.getAll().filter(x => Number(x.objectId) === Number(ob2.id));
ok('obiekt B ma swój odczyt', byObj2.some(x => Number(x.value) === 999));

// ── 6. Aktualizacja ────────────────────────────────────────────────────────
section('6. Aktualizacja rekordu');
const target = R.getAll()[0];
R.update(target.id, { value: 555 });
ok('update zmienia wartość', Number(R.find(target.id).value) === 555, R.find(target.id).value);
ok('update zachowuje id', R.find(target.id).id === target.id);
ok('update nie mnoży rekordów', R.getAll().filter(x => x.id === target.id).length === 1);

// ── 7. Trwałość ────────────────────────────────────────────────────────────
section('7. Trwałość po przeładowaniu');
const dump = {};
for (let k = 0; k < w.localStorage.length; k++) { const key = w.localStorage.key(k); dump[key] = w.localStorage.getItem(key); }
const B = boot({ inline: false });
Object.entries(dump).forEach(([k, v]) => B.w.localStorage.setItem(k, v));
ok('odczyty przetrwały', B.w.ReadingsModule.getAll().length === R.getAll().length,
   B.w.ReadingsModule.getAll().length + ' vs ' + R.getAll().length);
const rgB = B.w.ReadingsModule.getAll().find(x => x.medium === 'GAS');
ok('dane przelicznika gazu przetrwały', rgB && Number(rgB.gasFactor) === 11.2, rgB && rgB.gasFactor);

console.log('\n' + '═'.repeat(66));
console.log(`WYNIK: ${pass} zaliczonych, ${fail} niezaliczonych`);
console.log('═'.repeat(66));
process.exit(fail ? 1 : 0);

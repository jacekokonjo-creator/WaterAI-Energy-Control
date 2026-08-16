/* Symulacje: silniki finansowe (kaucja, opłata, opłata stała), KPI, spójność.
   Symulacje trafiają do klienta jako oferta — błędny CAGR albo okres zwrotu
   to zła decyzja inwestycyjna po jego stronie. */
const { boot } = require('./harness');

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; console.log('  ✗ ' + n + (x !== undefined ? '  → ' + x : '')); } };
const section = t => console.log('\n── ' + t + ' ' + '─'.repeat(Math.max(0, 56 - t.length)));

const { w } = boot({ inline: false });
const S = w.SimulationsModule;

const P = { years: 10, investment: 100000, heatingCost: 200000,
            priceGrowthPct: 0, clientSharePct: 50, paybackReturnPct: 25 };

section('1. Silnik kaucyjny — wielkości podstawowe');
const d = w._simEngineDeposit(P, 20);
ok('10 wierszy dla 10 lat', d.rows.length === 10, d.rows.length);
ok('rok 1: oszczędność = koszt × 20%', Math.abs(d.rows[0].F - 40000) < 1e-6, d.rows[0].F);
ok('rok 1: udział klienta = F × 50%', Math.abs(d.rows[0].K - 20000) < 1e-6, d.rows[0].K);
ok('rok 1: rata zwrotu = F × 25%', Math.abs(d.rows[0].M - 10000) < 1e-6, d.rows[0].M);
ok('bez wzrostu cen E stałe', Math.abs(d.rows[9].E - d.rows[0].E) < 1e-6, d.rows[9].E);
ok('H rośnie monotonicznie', d.rows.every((r, i) => i === 0 || r.H >= d.rows[i-1].H));
ok('I = H − inwestycja', Math.abs(d.rows[9].I - (d.rows[9].H - 100000)) < 1e-6);

section('2. Zwrot raty ograniczony do wysokości inwestycji');
const sumM = d.rows.reduce((a, r) => a + r.M, 0);
ok('suma rat nie przekracza inwestycji', sumM <= 100000 + 1e-6, sumM);
ok('suma rat równa dokładnie inwestycji', Math.abs(sumM - 100000) < 1e-6, sumM);
// inwestycja 35 000 przy racie 10 000/rok: 10+10+10+5, potem zera
const cap = w._simEngineDeposit({ ...P, investment: 35000 }, 20);
ok('rata ostatniej spłaty przycięta do reszty', Math.abs(cap.rows[3].M - 5000) < 1e-6, cap.rows[3].M);
ok('po pełnej spłacie rata = 0', cap.rows[4].M === 0 && cap.rows[9].M === 0, cap.rows[4].M);
ok('suma rat = inwestycja (35 000)',
   Math.abs(cap.rows.reduce((a, r) => a + r.M, 0) - 35000) < 1e-6,
   cap.rows.reduce((a, r) => a + r.M, 0));

section('3. Wzrost cen energii');
const g = w._simEngineDeposit({ ...P, priceGrowthPct: 5 }, 20);
ok('rok 2 = rok 1 × 1,05', Math.abs(g.rows[1].E - g.rows[0].E * 1.05) < 1e-6, g.rows[1].E);
ok('rok 10 = rok 1 × 1,05^9', Math.abs(g.rows[9].E - 200000 * Math.pow(1.05, 9)) < 1e-3, g.rows[9].E);
ok('wzrost cen zwiększa wpływy', g.rows[9].H > d.rows[9].H, g.rows[9].H + ' vs ' + d.rows[9].H);

section('4. CAGR — liczony od krotności kapitału');
// Kapitał podwojony w 10 lat to 7,177 % rocznie, nie 0 %.
const mk = I => Math.pow((I + 100000) / 100000, 1 / 10) - 1;
[[100000, 0.0717735], [25000, 0.0225651], [300000, 0.1486984]].forEach(([I, expected]) => {
  ok(`zysk ${I.toLocaleString('pl')} → CAGR ${(expected*100).toFixed(2)} %`,
     Math.abs(mk(I) - expected) < 1e-6, (mk(I)*100).toFixed(4));
});
ok('CAGR nigdy ujemny przy dodatnim zysku',
   d.kpi.cagr === null || d.kpi.cagr > 0, d.kpi.cagr);
if (d.kpi.cagr !== null) {
  ok('CAGR zgodny ze wzorem od krotności',
     Math.abs(d.kpi.cagr - (Math.pow((d.kpi.netProfit + 100000) / 100000, 1/10) - 1)) < 1e-9,
     d.kpi.cagr);
}

section('5. Spójność trzech silników');
const fns = ['_simEngineDeposit', '_simEngineFee', '_simEngineFeeFixed']
  .filter(n => typeof w[n] === 'function');
ok('silniki dostępne', fns.length >= 2, fns.join(','));
const src = w.eval("[_simEngineDeposit, _simEngineFee].map(String).join('\\n')");
ok('żaden silnik nie liczy CAGR od samego zysku',
   !/Math\.pow\(last\.I \/ (inv|fee)/.test(src),
   'formuła (I/kapitał) daje ujemny CAGR przy realnym zysku');

section('6. Okres zwrotu');
ok('paybackYear wyznaczony', d.kpi.paybackYear !== null, d.kpi.paybackYear);
if (d.kpi.paybackYear !== null) {
  const py = d.kpi.paybackYear;
  ok('w roku zwrotu I ≥ 0', d.rows[py-1].I >= 0, d.rows[py-1].I);
  ok('rok wcześniej I < 0', py === 1 || d.rows[py-2].I < 0, py > 1 ? d.rows[py-2].I : 'rok 1');
}
const noPay = w._simEngineDeposit({ ...P, investment: 99999999 }, 1);
ok('brak zwrotu → paybackYear null', noPay.kpi.paybackYear === null, noPay.kpi.paybackYear);

section('7. Przypadki brzegowe');
ok('0 % oszczędności → brak wpływów', w._simEngineDeposit(P, 0).rows[0].G === 0);
ok('inwestycja 0 → CAGR null', w._simEngineDeposit({ ...P, investment: 0 }, 20).kpi.cagr === null);
// years:0 jest traktowane jako „nie podano" → domyślne 10 lat (Number(x)||10)
ok('years 0 → domyślne 10 lat', w._simEngineDeposit({ ...P, years: 0 }, 20).rows.length === 10);
ok('years ujemne podnoszone do 1', w._simEngineDeposit({ ...P, years: -5 }, 20).rows.length === 1);
ok('lata powyżej 30 ograniczane', w._simEngineDeposit({ ...P, years: 99 }, 20).rows.length === 30);
ok('brak parametrów nie wywala', (() => { try { w._simEngineDeposit({}, 0); return true; } catch (e) { return e.message; } })() === true);

section('8. Magazyn');
w.ClientsModule.add({ name: 'Klient Sym' });
const cl = w.ClientsModule.getAll().slice(-1)[0];
for (let i = 0; i < 150; i++) S.add({ clientId: cl.id, name: 'Sym ' + i });
const ids = S.getAll().map(s => s.id);
ok('150 symulacji → unikalne id', new Set(ids).size === ids.length,
   (ids.length - new Set(ids).size) + ' duplikatów');
ok('domyślny status DRAFT', S.getAll()[0].status === 'DRAFT', S.getAll()[0].status);
const n = S.getAll().length;
S.remove(ids[7]);
ok('usunięcie jednego usuwa jeden', S.getAll().length === n - 1, S.getAll().length);
S.update(ids[8], { status: 'SENT' });
ok('update zmienia status', S.find(ids[8]).status === 'SENT', S.find(ids[8]).status);

console.log('\n' + '═'.repeat(66));
console.log(`WYNIK: ${pass} zaliczonych, ${fail} niezaliczonych`);
console.log('═'.repeat(66));
process.exit(fail ? 1 : 0);

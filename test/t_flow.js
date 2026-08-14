const { boot } = require('./harness');
const { w, errors } = boot({ inline: false });

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? '  → ' + extra : '')); }
};
const section = t => console.log('\n── ' + t + ' ' + '─'.repeat(Math.max(0, 60 - t.length)));

// ── dane bazowe ────────────────────────────────────────────────────────────
section('Przygotowanie: klient + obiekt');
w.ClientsModule.add({ name: 'Test Sp. z o.o.', nip: '1234567890' });
const cl = w.ClientsModule.getAll().slice(-1)[0];
w.ObjectsModule.add({ clientId: cl.id, name: 'Akademik A', baseTemperature: 20 });
const ob = w.ObjectsModule.getAll().slice(-1)[0];
ok('klient utworzony', !!cl && !!cl.id);
ok('obiekt utworzony', !!ob && !!ob.id);

// ── 1. OKRES BAZOWY: obłożenie ─────────────────────────────────────────────
section('1. Okres bazowy — Korekta obłożenia');
const bpOcc = w.BasePeriodModule.add({
  type: 'occupancy',
  protocolNumber: 'OB-OBL/2026/001',
  protocolDate: '2026-02-01',
  clientId: cl.id, objectId: ob.id,
  periodFrom: '2024-11-01', periodTo: '2025-03-31',
  consumption: 1200, energyUnit: 'GJ',
  occBasis: '% pokoi zajętych wg recepcji',
  occParams: { ti: 20, tiRed: 17, fCommon: 0, oRef: 100 },
  months: [
    { month: 11, name: 'Listopad 2024', days: 30, tme: 1.3, occ: 70, tmeStd: 1.3 },
    { month: 12, name: 'Grudzień 2024', days: 31, tme: -2.1, occ: 65, tmeStd: -2.1 },
    { month: 1, name: 'Styczeń 2025', days: 31, tme: -4.0, occ: 60, tmeStd: -2.6 },
    { month: 2, name: 'Luty 2025', days: 28, tme: -1.0, occ: 55, tmeStd: -1.9 },
    { month: 3, name: 'Marzec 2025', days: 31, tme: 3.5, occ: 68, tmeStd: 3.2 }
  ]
});
ok('protokół zapisany', !!bpOcc.id);
ok('odczytany z magazynu', !!w.BasePeriodModule.find(bpOcc.id));
ok('widoczny przez findByObjectType', w.BasePeriodModule.findByObjectType(ob.id, 'occupancy').length === 1);

const c = w._occCalc(bpOcc);
ok('φ policzone', c.phi != null, 'φ=' + c.phi);
ok('φ w sensownym zakresie (0.5–2)', c.phi > 0.5 && c.phi < 2, 'φ=' + (c.phi || 0).toFixed(4));
ok('Qs = Q·φ', Math.abs(c.qs - 1200 * c.phi) < 1e-9);
// ręczna kontrola stycznia: ti,eff = 0.6*20+0.4*17 = 18.8; SD = 31*(18.8+4) = 706.8
const sty = c.rows.find(r => r.name.startsWith('Styczeń'));
ok('tᵢ,eff stycznia = 18,80', Math.abs(sty.tiEff - 18.8) < 1e-9, sty.tiEff);
ok('SD stycznia = 706,8', Math.abs(sty.sdR - 706.8) < 1e-6, sty.sdR);

// podgląd protokołu
let viewHtml = '';
try { viewHtml = w._bpViewHtml(bpOcc); } catch (e) { viewHtml = 'ERR:' + e.message; }
ok('podgląd renderuje się', !viewHtml.startsWith('ERR:'), viewHtml.slice(0, 80));
ok('podgląd zawiera φ', viewHtml.includes('φ ='));
ok('podgląd zawiera podstawę obłożenia', viewHtml.includes('% pokoi zajętych'));

// ── 2. OKRES BAZOWY: intensywność ──────────────────────────────────────────
section('2. Okres bazowy — Korekta intensywności');
const bpVol = w.BasePeriodModule.add({
  type: 'volume',
  protocolNumber: 'OB-INT/2026/001',
  protocolDate: '2026-02-01',
  clientId: cl.id, objectId: ob.id,
  periodFrom: '2024-11-01', periodTo: '2025-01-31',
  consumption: 900, energyUnit: 'GJ',
  months: [
    { month: 11, name: 'Listopad 2024', days: 30, intRzecz: 120, intRef: 150 },
    { month: 12, name: 'Grudzień 2024', days: 31, intRzecz: 110, intRef: 150 },
    { month: 1, name: 'Styczeń 2025', days: 31, intRzecz: 130, intRef: 150 }
  ]
});
ok('protokół intensywności zapisany', !!bpVol.id);
const phiVol = w._bpPhi(bpVol);
ok('φ intensywności policzone', phiVol != null && phiVol > 0, 'φ=' + phiVol);

// zakładka okresu bazowego (regresja z placeholderem 🚧)
w.activeMeasurementsTab = 'volume';
let volTab = '';
try { volTab = w.renderPlaceholderMeasTab('⚙️', 'Korekta intensywności', 'volume', 'opis', '#eee', '#ccc', '#000'); }
catch (e) { volTab = 'ERR:' + e.message; }
ok('zakładka volume nie jest placeholderem 🚧', !volTab.includes('Moduł w przygotowaniu'), volTab.slice(0, 90));

w.activeMeasurementsTab = 'occupancy';
let occTab = '';
try { occTab = w.renderPlaceholderMeasTab('🏨', 'Korekta obłożenia', 'occupancy', 'opis', '#eee', '#ccc', '#000'); }
catch (e) { occTab = 'ERR:' + e.message; }
ok('zakładka occupancy nie jest placeholderem 🚧', !occTab.includes('Moduł w przygotowaniu'));

// ── 3. ANALIZA obłożenia ───────────────────────────────────────────────────
section('3. Analiza — Korekta obłożenia');
w.eval('if (typeof _analResetState === "function") _analResetState();');
w.eval('ANAL = ANAL || {}; ANAL.type = "OCCUPANCY";');
w.eval(`ANAL.clientId = ${cl.id}; ANAL.objectId = ${ob.id};`);
const A = () => w.eval('ANAL');
w.analOnBasePeriod('occ:' + bpOcc.id);
ok('okres bazowy wczytany do PRZED', (A().before.months || []).length === 5, (A().before.months || []).length);
ok('obłożenie przeniesione', A().before.months[0].occ === 70, A().before.months[0].occ);
ok('occParams przeniesione', A().occParams && Number(A().occParams.ti) === 20);
ok('occBasis przeniesione', A().occBasis === '% pokoi zajętych wg recepcji');
ok('std zbudowane z tmeStd', Number(A().std[1][0]) === -2.6, A().std[1]);

// okres PO
A().after.from = '2025-11-01';
A().after.to = '2026-03-31';
A().after.months = [
  { month: 11, name: 'Listopad 2025', days: 30, tme: 1.5, occ: 92, ded: '' },
  { month: 12, name: 'Grudzień 2025', days: 31, tme: -1.8, occ: 95, ded: '' },
  { month: 1, name: 'Styczeń 2026', days: 31, tme: -3.5, occ: 96, ded: '' },
  { month: 2, name: 'Luty 2026', days: 28, tme: -0.8, occ: 94, ded: '' },
  { month: 3, name: 'Marzec 2026', days: 31, tme: 3.8, occ: 90, ded: '' }
];
A().after.consumption = 950;
A().energy = Object.assign({}, A().energy, { unit: 'GJ', currency: 'PLN', price: 90, escoShare: 50 });

const rb = w._analComputePeriod('before');
const ra = w._analComputePeriod('after');
ok('φ PRZED policzone', rb.phi != null, rb.phi);
ok('φ PO policzone', ra.phi != null, ra.phi);
ok('Qs PRZED > 0', rb.qs > 0, rb.qs);
ok('Qs PO > 0', ra.qs > 0, ra.qs);

// arkusz kreatora
let sheet = '';
try { sheet = w._analOCCSheet(); } catch (e) { sheet = 'ERR:' + e.message; }
ok('arkusz analizy renderuje się', !sheet.startsWith('ERR:'), sheet.slice(0, 120));
ok('arkusz ma kolumnę O', sheet.includes('O [%]'));
ok('arkusz ma kolumnę odliczeń', sheet.includes('odlicz.'));
ok('arkusz ma pole Podstawa obłożenia', sheet.includes('Podstawa obłożenia'));

// zapis analizy
let saved = null;
try {
  A().author = 'Tester';
  w.analRun(); w.analSave();
  const list = w.AnalysesModule.findByObject(ob.id).filter(a => a.analysisType === 'OCCUPANCY');
  saved = list[0] || null;
} catch (e) { console.log('    (analRun/analSave: ' + e.message + ')'); }
ok('analiza zapisana', !!saved, saved ? saved.name : 'brak');
if (saved) {
  ok('inputParams zawiera occParams', !!(saved.inputParams && saved.inputParams.occParams));
  ok('inputParams zawiera occBasis', (saved.inputParams || {}).occBasis === '% pokoi zajętych wg recepcji');
  ok('miesiące PO mają occ', ((saved.inputParams || {}).after || {}).months[0].occ === 92);
}

// ── 4. RAPORT z zapisanej analizy ──────────────────────────────────────────
section('4. Raport / PDF — z zapisanej analizy');
if (saved) {
  let d = null;
  try { d = w._analReportData({ saved }); } catch (e) { console.log('    _analReportData: ' + e.message); }
  ok('_analReportData zwraca dane', !!d);
  if (d) {
    ok('typ zachowany', d.type === 'OCCUPANCY', d.type);
    ok('wiersze mają tiEff', d.before.rows[0].tiEff != null, d.before.rows[0].tiEff);
    ok('wiersze mają occ', d.before.rows[0].occ === 70, d.before.rows[0].occ);
    ok('φ raportu = φ kreatora (PRZED)', Math.abs(d.before.phi - rb.phi) < 1e-9,
       'raport=' + d.before.phi + ' kreator=' + rb.phi);
    ok('φ raportu = φ kreatora (PO)', Math.abs(d.after.phi - ra.phi) < 1e-9,
       'raport=' + d.after.phi + ' kreator=' + ra.phi);
    ok('savedPct policzone', d.savedPct != null, d.savedPct);
    ok('escoAmount policzone', d.escoAmount != null, d.escoAmount);

    let body = '';
    try { body = w._analReportBody(d); } catch (e) { body = 'ERR:' + e.message; }
    ok('raport renderuje się', !body.startsWith('ERR:'), body.slice(0, 140));
    ok('raport ma kolumnę O', body.includes('<th>O</th>'));
    ok('raport ma kolumnę tᵢ,eff', body.includes('<th>tᵢ,eff</th>'));
    ok('raport ma blok metodyczny', body.includes('Parametry korekty obłożenia'));
    ok('raport podaje podstawę', body.includes('% pokoi zajętych'));
    ok('flaga trybu wyczyszczona', !w._occRepMode);

    // TYM nie może dostać kolumn obłożenia
    let tymBody = '';
    try { tymBody = w._analReportBody(Object.assign({}, d, { type: 'TYM' })); } catch (e) { tymBody = 'ERR:' + e.message; }
    ok('TYM bez kolumn obłożenia', !tymBody.includes('<th>tᵢ,eff</th>'));
  }
}

// ── 5. Zgodność degeneracyjna: obłożenie 100% == TYM ───────────────────────
section('5. Kontrola: obłożenie przy O=100% daje wynik TYM');
const mm = [
  { month: 12, name: 'Grudzień', days: 31, tme: -2.1 },
  { month: 1, name: 'Styczeń', days: 31, tme: -4.0 }
];
const stdX = { 12: [-2.1, 31], 1: [-2.6, 31] };
A().type = 'TYM'; A().baseTi = 20; A().std = stdX;
A().before = { from: '', to: '', consumption: 1000, months: mm.map(x => ({ ...x })) };
A().after = { from: '', to: '', consumption: 800, months: mm.map(x => ({ ...x })), baseTi: 20 };
const tymB = w._analComputePeriod('before'), tymA = w._analComputePeriod('after');

A().type = 'OCCUPANCY';
A().occParams = { ti: 20, tiRed: 17, fCommon: 0, oRef: 100 };
A().before.months = mm.map(x => ({ ...x, occ: 100, ded: '' }));
A().after.months = mm.map(x => ({ ...x, occ: 100, ded: '' }));
const occB = w._analComputePeriod('before'), occA = w._analComputePeriod('after');
ok('ΣSD rzecz. identyczne', Math.abs(tymB.sumR - occB.sumR) < 1e-9, tymB.sumR + ' vs ' + occB.sumR);
ok('ΣSD std. identyczne', Math.abs(tymB.sumS - occB.sumS) < 1e-9, tymB.sumS + ' vs ' + occB.sumS);
ok('Qs PRZED identyczne', Math.abs(tymB.qs - occB.qs) < 1e-9, tymB.qs + ' vs ' + occB.qs);
ok('Qs PO identyczne', Math.abs(tymA.qs - occA.qs) < 1e-9, tymA.qs + ' vs ' + occA.qs);

// ── 6. Przypadki brzegowe ──────────────────────────────────────────────────
section('6. Przypadki brzegowe');
const empty = w._occCalc({ type: 'occupancy', consumption: '', occParams: {}, months: [] });
ok('pusty protokół nie wywala', empty.phi === null && empty.qs === null);

const zeroDays = w._occCalc({ type: 'occupancy', consumption: 100, occParams: { ti: 20, tiRed: 17, fCommon: 0, oRef: 100 },
  months: [{ month: 7, name: 'Lipiec', days: 0, tme: 19, occ: 10, tmeStd: 19 }] });
ok('z₀=0 → miesiąc pominięty', zeroDays.sumR === 0 && zeroDays.phi === null);

const warm = w._occCalc({ type: 'occupancy', consumption: 100, occParams: { ti: 20, tiRed: 17, fCommon: 0, oRef: 100 },
  months: [{ month: 5, name: 'Maj', days: 12, tme: 13.5, occ: 60, tmeStd: 13.5 }] });
ok('ciepły miesiąc z z₀>0 liczony', warm.sumR > 0, warm.sumR);

const noOcc = w._occCalc({ type: 'occupancy', consumption: 100, occParams: { ti: 20, tiRed: 17, fCommon: 0, oRef: 100 },
  months: [{ month: 1, name: 'Sty', days: 31, tme: -2, occ: '', tmeStd: -2 }] });
ok('brak O → fallback O_ref (bez awarii)', noOcc.phi != null && Math.abs(noOcc.rows[0].tiEff - 20) < 1e-9);

const fc = w._occTiEff(50, { ti: 20, tiRed: 17, fCommon: 40, oRef: 100 });
ok('f_wsp=40%, O=50% → 19,10 °C', Math.abs(fc - 19.1) < 1e-9, fc);
ok('f_wsp nieistotne przy O=100%', Math.abs(w._occTiEff(100, { ti: 20, tiRed: 17, fCommon: 40, oRef: 100 }) - 20) < 1e-9);

const ded = w._occNetQ({ consumption: 100, months: [{ ded: 10 }, { ded: 5 }, { ded: '' }] });
ok('odliczenia sumowane (100-15=85)', ded === 85, ded);

// ── 7. Zmiana dat nie kasuje danych ────────────────────────────────────────
section('7. Trwałość danych przy zmianie dat');
A().type = 'OCCUPANCY';
A().before.months = [{ month: 12, name: 'Gru', days: 31, tme: -2, occ: 77, ded: 9 }];
A().before.from = '2024-12-01'; A().before.to = '2024-12-31';
w.analOnDates('before', 'to', '2024-12-31');
const m0 = A().before.months[0] || {};
ok('obłożenie przetrwało zmianę daty', String(m0.occ) === '77', m0.occ);
ok('odliczenie przetrwało zmianę daty', String(m0.ded) === '9', m0.ded);

// ── podsumowanie ───────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(66));
console.log(`WYNIK: ${pass} zaliczonych, ${fail} niezaliczonych`);
if (errors.length) { console.log('\nBŁĘDY ŁADOWANIA:'); errors.forEach(e => console.log('  ' + e)); }
console.log('═'.repeat(66));
process.exit(fail ? 1 : 0);

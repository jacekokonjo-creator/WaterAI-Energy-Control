/* Trwałość: czy dane przeżywają zapis → przeładowanie → odczyt,
   oraz czy kopia zapasowa obejmuje nowe typy okresów bazowych. */
const { boot } = require('./harness');

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; console.log('  ✗ ' + n + (x ? '  → ' + x : '')); } };
const section = t => console.log('\n── ' + t + ' ' + '─'.repeat(Math.max(0, 58 - t.length)));

section('Zapis → przeładowanie → odczyt');
const A = boot({ inline: false });
A.w.ClientsModule.add({ name: 'Trwały Klient', nip: '9999999999' });
const cl = A.w.ClientsModule.getAll().slice(-1)[0];
A.w.ObjectsModule.add({ clientId: cl.id, name: 'Obiekt Trwały', baseTemperature: 21 });
const ob = A.w.ObjectsModule.getAll().slice(-1)[0];

const bp = A.w.BasePeriodModule.add({
  type: 'occupancy', protocolNumber: 'OB-OBL/2026/007', protocolDate: '2026-03-01',
  clientId: cl.id, objectId: ob.id, periodFrom: '2024-11-01', periodTo: '2025-01-31',
  consumption: 1500, energyUnit: 'GJ', occBasis: '% miejsc noclegowych',
  occParams: { ti: 21, tiRed: 16.5, fCommon: 25, oRef: 90 },
  months: [
    { month: 12, name: 'Grudzień 2024', days: 31, tme: -2.1, occ: 63, tmeStd: -2.1, ded: 12 },
    { month: 1, name: 'Styczeń 2025', days: 31, tme: -4.0, occ: 58, tmeStd: -2.6, ded: '' }
  ]
});
const phiA = A.w._occCalc(bp).phi;

// zrzut localStorage → nowa instancja (symulacja przeładowania strony)
const dump = {};
for (let i = 0; i < A.w.localStorage.length; i++) {
  const k = A.w.localStorage.key(i);
  dump[k] = A.w.localStorage.getItem(k);
}
const B = boot({ inline: false });
Object.entries(dump).forEach(([k, v]) => B.w.localStorage.setItem(k, v));
B.w.eval('if (window._basePeriodsStore && _basePeriodsStore._cache) _basePeriodsStore._cache = null;');

const bp2 = B.w.BasePeriodModule.getAll().find(x => x.protocolNumber === 'OB-OBL/2026/007');
ok('protokół przetrwał przeładowanie', !!bp2);
if (bp2) {
  ok('occParams zachowane', bp2.occParams && Number(bp2.occParams.fCommon) === 25, JSON.stringify(bp2.occParams));
  ok('occBasis zachowane', bp2.occBasis === '% miejsc noclegowych', bp2.occBasis);
  ok('obłożenie miesięczne zachowane', Number(bp2.months[0].occ) === 63, bp2.months[0].occ);
  ok('odliczenie zachowane', Number(bp2.months[0].ded) === 12, bp2.months[0].ded);
  const phiB = B.w._occCalc(bp2).phi;
  ok('φ identyczne po przeładowaniu', Math.abs(phiA - phiB) < 1e-12, phiA + ' vs ' + phiB);
  // 0,25·21 + 0,75·(0,63·21 + 0,37·16,5) = 5,25 + 0,75·19,335 = 19,75125
  ok('nietypowe parametry (tᵢ=21, tᵢ,red=16,5, f_wsp=25%) → 19,75125',
     Math.abs(B.w._occTiEff(63, { ti: 21, tiRed: 16.5, fCommon: 25, oRef: 90 }) - 19.75125) < 1e-9,
     B.w._occTiEff(63, { ti: 21, tiRed: 16.5, fCommon: 25, oRef: 90 }));
}

section('Kopia zapasowa obejmuje nowe typy');
try {
  const keys = B.w.eval("Object.keys(localStorage).filter(k=>k.indexOf('base_periods')>=0)");
  ok('okresy bazowe w localStorage', keys.length > 0, keys.join(','));
  const bm = B.w.BackupModule;
  ok('BackupModule dostępny', !!bm);
  const obj = bm.buildBackupObject();
  const asText = JSON.stringify(obj);
  ok('kopia zawiera klucz okresów bazowych', asText.includes('base_periods'));
  ok('kopia zawiera treść protokołu obłożenia', asText.includes('OB-OBL/2026/007'));
  ok('kopia zawiera occParams', asText.includes('occParams'));
  ok('kopia niepusta', obj.keyCount > 0, 'keyCount=' + obj.keyCount);
} catch (e) { fail++; console.log('  ✗ kopia zapasowa → ' + e.message); }

section('Analiza: zapis → odczyt → raport');
const C = boot({ inline: false });
Object.entries(dump).forEach(([k, v]) => C.w.localStorage.setItem(k, v));
C.w.eval(`
  if (typeof _analResetState === 'function') _analResetState();
  ANAL.type = 'OCCUPANCY'; ANAL.clientId = ${cl.id}; ANAL.objectId = ${ob.id};
`);
C.w.analOnBasePeriod('occ:' + bp.id);
C.w.eval(`
  ANAL.after.from='2025-11-01'; ANAL.after.to='2026-01-31';
  ANAL.after.months=[{month:12,name:'Grudzień 2025',days:31,tme:-1.9,occ:88,ded:''},
                     {month:1,name:'Styczeń 2026',days:31,tme:-3.6,occ:91,ded:''}];
  ANAL.after.consumption=1150;
  ANAL.energy=Object.assign({},ANAL.energy,{unit:'GJ',currency:'PLN',price:95,escoShare:40});
  ANAL.author='Tester';
`);
const live = C.w._analComputePeriod('before');
C.w.analRun(); C.w.analSave();
const saved = C.w.AnalysesModule.findByObject(ob.id).find(a => a.analysisType === 'OCCUPANCY');
ok('analiza zapisana', !!saved);
if (saved) {
  const d = C.w._analReportData({ saved });
  ok('φ raportu = φ kreatora', Math.abs(d.before.phi - live.phi) < 1e-9, d.before.phi + ' vs ' + live.phi);
  ok('parametry nietypowe dotarły do raportu', Math.abs(Number(d.occParams.fCommon) - 25) < 1e-9, d.occParams.fCommon);
  ok('udział ESCO 40% policzony', Math.abs(d.escoAmount - d.savedMoney * 0.4) < 1e-6);
  ok('udział klienta = reszta', Math.abs(d.clientAmount - (d.savedMoney - d.escoAmount)) < 1e-6);
  const body = C.w._analReportBody(d);
  ok('raport renderuje się', body.length > 500);
  ok('raport podaje f_wsp', body.includes('f_wsp = <b>25%'), 'brak f_wsp w bloku metodycznym');
}

console.log('\n' + '═'.repeat(66));
console.log(`WYNIK: ${pass} zaliczonych, ${fail} niezaliczonych`);
console.log('═'.repeat(66));
process.exit(fail ? 1 : 0);

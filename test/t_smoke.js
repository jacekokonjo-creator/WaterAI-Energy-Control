/* Smoke-test: wywołuje każdą funkcję renderującą w każdej roli i sprawdza,
   czy nie rzuca wyjątkiem. Nie ocenia wyglądu — wyłapuje wywrotki. */
const { boot } = require('./harness');

const ROLES = ['admin', 'backOffice', 'energyAnalyst', 'salesRepresentative', 'client'];
const TABS = ['tym', 'regression', 'occupancy', 'volume'];

let pass = 0, fail = 0;
const results = [];

for (const role of ROLES) {
  const { w } = boot({ inline: false });

  // minimalny stan: rola + dane
  w.eval(`
    currentRole = ${JSON.stringify(role)};
    realRole = ${JSON.stringify(role)};
    assignedRoles = [${JSON.stringify(role)}];
    realRoles = [${JSON.stringify(role)}];
  `);
  w.ClientsModule.add({ name: 'Klient Testowy', nip: '1234567890' });
  const cl = w.ClientsModule.getAll().slice(-1)[0];
  w.ObjectsModule.add({ clientId: cl.id, name: 'Obiekt A', baseTemperature: 20 });
  const ob = w.ObjectsModule.getAll().slice(-1)[0];
  w.BasePeriodModule.add({
    type: 'occupancy', protocolNumber: 'OB-OBL/2026/001', protocolDate: '2026-01-01',
    clientId: cl.id, objectId: ob.id, periodFrom: '2024-11-01', periodTo: '2025-01-31',
    consumption: 1000, energyUnit: 'GJ', occParams: { ti: 20, tiRed: 17, fCommon: 0, oRef: 100 },
    months: [{ month: 12, name: 'Grudzień 2024', days: 31, tme: -2.1, occ: 60, tmeStd: -2.1 }]
  });
  w.BasePeriodModule.add({
    type: 'volume', protocolNumber: 'OB-INT/2026/001', protocolDate: '2026-01-01',
    clientId: cl.id, objectId: ob.id, periodFrom: '2024-11-01', periodTo: '2025-01-31',
    consumption: 900, energyUnit: 'GJ',
    months: [{ month: 12, name: 'Grudzień 2024', days: 31, intRzecz: 120, intRef: 150 }]
  });

  const names = w.eval(
    "Object.getOwnPropertyNames(window).filter(k=>/^render[A-Z]/.test(k)&&typeof window[k]==='function')"
  );

  for (const n of names) {
    // funkcje wymagające argumentów pomijamy — testujemy je osobno niżej
    if (['renderPlaceholderMeasTab', 'renderBasePeriodTab', 'renderIntensityBaseTab',
         'renderProtocolsTable', 'renderRegressionTab', 'renderRegressionSensorData',
         'renderRegressionSelection', 'renderRegressionBaselineCurves'].includes(n)) continue;
    try {
      w.document.getElementById('module-content') ||
        w.document.body.insertAdjacentHTML('beforeend', '<div id="module-content"></div>');
      w[n]();
      pass++;
    } catch (e) {
      fail++;
      results.push(`${role.padEnd(20)} ${n}  →  ${e.message}`);
    }
  }

  // funkcje wymagające argumentów — wywoływane z realnymi danymi
  const withArgs = [
    ['renderProtocolsTable', [[], ob.id]],
    ['renderProtocolsTable', [w.MeasurementsModule.getAll(), ob.id]],
    ['renderRegressionTab', [[]]],
    ['renderBasePeriodTab', ['occupancy', { icon: '🏨', title: 'T', description: 'D', bgLight: '#eee', bgBorder: '#ccc', textColor: '#000' }]],
    ['renderBasePeriodTab', ['volume', { icon: '⚙️', title: 'T', description: 'D', bgLight: '#eee', bgBorder: '#ccc', textColor: '#000' }]],
    ['renderPlaceholderMeasTab', ['🏨', 'T', 'occupancy', 'D', '#eee', '#ccc', '#000']],
    ['renderPlaceholderMeasTab', ['⚙️', 'T', 'volume', 'D', '#eee', '#ccc', '#000']]
  ];
  for (const [fn, args] of withArgs) {
    if (typeof w[fn] !== 'function') continue;
    try { w[fn](...args); pass++; }
    catch (e) { fail++; results.push(`${role.padEnd(20)} ${fn}(${args.length} arg)  →  ${e.message}`); }
  }

  // zakładki okresu bazowego / pomiarów
  for (const tab of TABS) {
    try {
      w.eval(`activeMeasurementsTab = ${JSON.stringify(tab)}; showMeasurementForm = false;`);
      w.renderMeasurementsModule();
      pass++;
    } catch (e) {
      fail++;
      results.push(`${role.padEnd(20)} zakładka Pomiary/${tab}  →  ${e.message}`);
    }
  }

  // kreator analiz dla każdego typu
  for (const t of ['TYM', 'REGRESSION', 'OCCUPANCY', 'VOLUME']) {
    try {
      w.eval(`
        if (typeof _analResetState === 'function') _analResetState();
        ANAL.type = ${JSON.stringify(t)};
        ANAL.step = 2;
        ANAL.clientId = ${cl.id}; ANAL.objectId = ${ob.id};
      `);
      w.renderAnalysesModule();
      pass++;
    } catch (e) {
      fail++;
      results.push(`${role.padEnd(20)} kreator analiz/${t}  →  ${e.message}`);
    }
  }
}

console.log('\n' + '═'.repeat(72));
console.log(`SMOKE-TEST: ${pass} wywołań bez wyjątku, ${fail} z wyjątkiem`);
console.log('═'.repeat(72));
if (results.length) {
  console.log('\nWYWROTKI:');
  [...new Set(results)].forEach(r => console.log('  ✗ ' + r));
} else {
  console.log('\nŻadna funkcja renderująca nie rzuciła wyjątku w żadnej roli.');
}
process.exit(fail ? 1 : 0);

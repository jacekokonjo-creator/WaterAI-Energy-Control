/* Widoczność (resource_shares): typy zasobów, uprawnienia, spójność z RLS.
   SharesModule pisze do Supabase, więc bez bazy testujemy warstwę, która
   działa lokalnie: listę typów, wyliczanie zasobów, cache uprawnień. */
const { boot } = require('./harness');
const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; console.log('  ✗ ' + n + (x !== undefined ? '  → ' + x : '')); } };
const section = t => console.log('\n── ' + t + ' ' + '─'.repeat(Math.max(0, 56 - t.length)));

const { w } = boot({ inline: false });
const S = w.SharesModule;

// ── 1. Typy zasobów zgodne z migracją RLS ──────────────────────────────────
section('1. Typy zasobów a polityki RLS');
const types = w.eval('_shTypes.map(t => t.key)');
// Migracja 003 dodaje has_share dla sześciu typów (KONTEKST 2026-07-12)
const RLS_TYPES = ['measurement', 'analysis', 'esco_report', 'base_period', 'invoice', 'simulation'];
RLS_TYPES.forEach(t => ok(`typ "${t}" ma zakładkę w Widoczności`, types.includes(t), types.join(',')));
ok('brak typów bez odpowiednika w RLS',
   types.every(t => RLS_TYPES.includes(t)),
   types.filter(t => !RLS_TYPES.includes(t)).join(','));

// ── 2. Lista zasobów dla każdego typu ──────────────────────────────────────
section('2. Wyliczanie zasobów');
w.ClientsModule.add({ name: 'Klient Widoczność', nip: '1111111111' });
const cl = w.ClientsModule.getAll().slice(-1)[0];
w.ObjectsModule.add({ clientId: cl.id, name: 'Obiekt W' });
const ob = w.ObjectsModule.getAll().slice(-1)[0];

w.MeasurementsModule.add({ objectId: ob.id, protocolNumber: 'TYM/2026/001', protocolDate: '2026-01-10' });
w.BasePeriodModule.add({
  type: 'occupancy', protocolNumber: 'OB-OBL/2026/001', protocolDate: '2026-01-11',
  clientId: cl.id, objectId: ob.id, consumption: 100, occParams: { ti: 20, tiRed: 17, fCommon: 0, oRef: 100 }, months: []
});
w.BasePeriodModule.add({
  type: 'volume', protocolNumber: 'OB-INT/2026/001', protocolDate: '2026-01-12',
  clientId: cl.id, objectId: ob.id, consumption: 90, months: []
});
w.AnalysesModule.add({ clientId: cl.id, objectId: ob.id, analysisType: 'OCCUPANCY', name: 'Analiza obłożenia' });
// EscoReportsModule pochodzi z _mkStore — API to getAll/saveAll, nie add()
{ const a = w.EscoReportsModule.getAll();
  a.push({ id: w._waNextIdFor(a), clientId: cl.id, objectId: ob.id, reportNumber: 'ESCO/2026/001', createdAt: '2026-01-13T00:00:00Z' });
  w.EscoReportsModule.saveAll(a); }
w.InvoicingModule.add({ clientId: cl.id, objectId: ob.id, netAmount: 100, invoiceNumber: 'FV/2026/01/001' });

const listFor = k => w.eval(`JSON.stringify(_shListResources(${JSON.stringify(k)}) || [])`);
RLS_TYPES.forEach(t => {
  let r = null;
  try { r = JSON.parse(listFor(t)); } catch (e) { r = null; }
  ok(`"${t}" zwraca listę bez wyjątku`, Array.isArray(r), r === null ? 'wyjątek' : typeof r);
});

const bpList = JSON.parse(listFor('base_period'));
ok('okresy bazowe: oba typy na liście', bpList.length === 2, bpList.length);
ok('okres obłożenia widoczny po numerze',
   bpList.some(r => r.name === 'OB-OBL/2026/001'), bpList.map(r => r.name).join(','));
ok('okres intensywności widoczny po numerze',
   bpList.some(r => r.name === 'OB-INT/2026/001'), bpList.map(r => r.name).join(','));
ok('okresy bazowe mają przypisanego klienta',
   bpList.every(r => Number(r.clientId) === Number(cl.id)), JSON.stringify(bpList.map(r => r.clientId)));

const measList = JSON.parse(listFor('measurement'));
ok('protokoły TYM oddzielone od okresów bazowych',
   measList.length === 1 && measList[0].name === 'TYM/2026/001',
   JSON.stringify(measList.map(r => r.name)));

// ── 3. Uprawnienia w cache ─────────────────────────────────────────────────
section('3. Uprawnienia (cache)');
S._cache = [
  { id: 1, resource_type: 'base_period', resource_id: 'uuid-bp-1', user_id: 'user-A', permission: 'view' },
  { id: 2, resource_type: 'base_period', resource_id: 'uuid-bp-1', user_id: 'user-B', permission: 'edit' },
  { id: 3, resource_type: 'invoice', resource_id: 'uuid-inv-1', user_id: 'user-A', permission: 'view' }
];
ok('permFor: view', S.permFor('base_period', 'uuid-bp-1', 'user-A') === 'view');
ok('permFor: edit', S.permFor('base_period', 'uuid-bp-1', 'user-B') === 'edit');
ok('permFor: brak udostępnienia → null', S.permFor('base_period', 'uuid-bp-1', 'user-C') === null);
ok('permFor: inny typ zasobu → null', S.permFor('analysis', 'uuid-bp-1', 'user-A') === null);
ok('permFor: inny zasób tego typu → null', S.permFor('base_period', 'uuid-bp-9', 'user-A') === null);
ok('typy nie mieszają się między sobą', S.permFor('invoice', 'uuid-inv-1', 'user-A') === 'view');
ok('getAll zwraca kopię, nie referencję', (() => {
  const a = S.getAll(); a[0].permission = 'ZMIENIONE';
  return S.permFor('base_period', 'uuid-bp-1', 'user-A') === 'view';
})());

// ── 4. Zapis bez bazy musi zawieść jawnie ──────────────────────────────────
section('4. Zachowanie bez połączenia z bazą');
let threw = false, msg = '';
S.setShare('base_period', 'uuid-bp-1', 'user-C', 'view').catch(e => { threw = true; msg = e.message; });
setTimeout(() => {
  ok('setShare bez bazy rzuca czytelny błąd', threw && /baz/i.test(msg), msg || 'nie rzucił');

  // ── 5. Spójność z SQL ────────────────────────────────────────────────────
  section('5. Spójność z plikiem migracji');
  const sqlPath = path.resolve(__dirname, '..', 'sql', '008_rls_role_scoping.sql');
  if (fs.existsSync(sqlPath)) {
    const sql = fs.readFileSync(sqlPath, 'utf8');
    ok('migracja 008 obecna', true);
    ok('008 nie włącza polityk bez owner_id (zakomentowane)',
       sql.includes('-- drop policy if exists p_obj_internal_all'),
       'polityki odkomentowane — sprawdź, czy owner_id jest uzupełnione!');
  } else {
    ok('migracja 008 obecna', false, 'brak pliku');
  }

  console.log('\n' + '═'.repeat(66));
  console.log(`WYNIK: ${pass} zaliczonych, ${fail} niezaliczonych`);
  console.log('═'.repeat(66));
  process.exit(fail ? 1 : 0);
}, 50);

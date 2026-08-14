/* Audyt uprawnień: co każda rola widzi w interfejsie i czy zgadza się to
   z docelowym modelem ról (KONTEKST 2026-07-12).

   To NIE zastępuje RLS — interfejs można obejść. Test pokazuje, gdzie UI
   obiecuje coś, czego baza nie egzekwuje, albo odwrotnie. Rozbieżność w tę
   pierwszą stronę to przeciek danych; w drugą — martwa funkcja. */
const { boot } = require('./harness');

let pass = 0, fail = 0, warn = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; console.log('  ✗ ' + n + (x !== undefined ? '  → ' + x : '')); } };
const info = (n, x) => { warn++; console.log('  ⚠ ' + n + (x !== undefined ? '  → ' + x : '')); };
const section = t => console.log('\n── ' + t + ' ' + '─'.repeat(Math.max(0, 56 - t.length)));

const { w } = boot({ inline: false });
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

// roleModules jest w inline'owym skrypcie index.html — czytamy z pliku
const m = html.match(/const roleModules = \{([\s\S]*?)\};/);
const RM = {};
if (m) {
  m[1].split('\n').forEach(line => {
    const r = line.match(/(\w+)\s*:\s*\[([^\]]*)\]/);
    if (r) RM[r[1]] = r[2].split(',').map(s => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
  });
}

section('1. Odczyt mapy ról');
['admin', 'backOffice', 'energyAnalyst', 'salesRepresentative', 'client'].forEach(r => {
  ok(`rola "${r}" ma zdefiniowane kafelki`, Array.isArray(RM[r]) && RM[r].length > 0,
     RM[r] ? RM[r].length : 'brak');
});

// ── 2. Docelowy model ról (KONTEKST 2026-07-12) ────────────────────────────
section('2. Zgodność z docelowym modelem ról');

// Administrator — wszystko
ok('admin ma moduł Użytkownicy (zakłada konta)', RM.admin.includes('users'));
ok('admin ma Widoczność (zarządza udostępnianiem)', RM.admin.includes('visibility'));
ok('admin ma Faktury', RM.admin.includes('invoicing'));

// Back Office — pełny dostęp operacyjno-rozliczeniowy, NIE zakłada kont
ok('backOffice ma Faktury (wystawia)', RM.backOffice.includes('invoicing'));
ok('backOffice ma Symulacje (tworzy)', RM.backOffice.includes('simulation'));
ok('backOffice ma Widoczność (docelowo zarządza udostępnianiem)',
   RM.backOffice.includes('visibility'));
if (RM.backOffice.includes('users')) {
  // Sprawdzamy realne uprawnienie, nie sam kafelek.
  const boCanManage = w.eval(`(function(){
    try { realRoles = ['backOffice']; realRole = 'backOffice'; currentRole = 'backOffice';
          return _usrCanManage(); } catch (e) { return 'błąd: ' + e.message; }
  })()`);
  // Ustalenie z użytkownikiem 2026-08-14: Back Office ZAKŁADA konta.
  // Zastępuje wcześniejszy zapis z 2026-07-12 („nie zakłada kont").
  // Źródło prawdy: sekcja „Model ról" w KONTEKST_PROJEKTU.md.
  ok('backOffice MOŻE zakładać konta (zgodnie z modelem)', boCanManage === true, boCanManage);
  const eaCanManage = w.eval(`(function(){
    try { realRoles = ['energyAnalyst']; realRole = 'energyAnalyst'; currentRole = 'energyAnalyst';
          return _usrCanManage(); } catch (e) { return 'błąd: ' + e.message; }
  })()`);
  ok('energyAnalyst NIE może zakładać kont', eaCanManage === false, eaCanManage);
  const srCanManage = w.eval(`(function(){
    try { realRoles = ['salesRepresentative']; realRole = 'salesRepresentative'; currentRole = 'salesRepresentative';
          return _usrCanManage(); } catch (e) { return 'błąd: ' + e.message; }
  })()`);
  ok('salesRep NIE może zakładać kont', srCanManage === false, srCanManage);
  const clCanManage = w.eval(`(function(){
    try { realRoles = ['client']; realRole = 'client'; currentRole = 'client';
          return _usrCanManage(); } catch (e) { return 'błąd: ' + e.message; }
  })()`);
  ok('klient NIE może zakładać kont', clCanManage === false, clCanManage);
  w.eval("realRoles = ['admin']; realRole = 'admin'; currentRole = 'admin';");
}

// Energy Analyst — dane energetyczne, nie zakłada kont, nie fakturuje
ok('energyAnalyst ma Analizy', RM.energyAnalyst.includes('analyses'));
ok('energyAnalyst ma Pomiary', RM.energyAnalyst.includes('measurements'));
ok('energyAnalyst NIE ma Faktur', !RM.energyAnalyst.includes('invoicing'),
   'analityk nie wystawia faktur');
ok('energyAnalyst NIE ma Użytkowników', !RM.energyAnalyst.includes('users'));

// Sales Representative — rola ZEWNĘTRZNA
ok('salesRep NIE ma Faktur', !RM.salesRepresentative.includes('invoicing'));
ok('salesRep NIE ma Użytkowników', !RM.salesRepresentative.includes('users'));
ok('salesRep NIE ma Widoczności (narzędzie wewnętrzne)',
   !RM.salesRepresentative.includes('visibility'));
ok('salesRep NIE ma Analiz (narzędzie wewnętrzne)',
   !RM.salesRepresentative.includes('analyses'));
ok('salesRep NIE ma Pomiarów (narzędzie wewnętrzne)',
   !RM.salesRepresentative.includes('measurements'));
ok('salesRep ma Klientów i Obiekty (dodaje je)',
   RM.salesRepresentative.includes('clients') && RM.salesRepresentative.includes('objects'));

// Klient — rola ZEWNĘTRZNA, tylko własne dane
const clientOwn = RM.client.every(k => k.startsWith('my') || k === 'instructions');
ok('klient ma wyłącznie moduły "my*" + Instrukcja', clientOwn, RM.client.join(','));
ok('klient NIE ma Widoczności', !RM.client.includes('visibility'));
ok('klient NIE ma Analiz', !RM.client.includes('analyses'));
ok('klient NIE ma Użytkowników', !RM.client.includes('users'));

// ── 2b. Spójność z dokumentacją ────────────────────────────────────────────
section('2b. Spójność z KONTEKST_PROJEKTU.md');
const ctxPath = path.resolve(__dirname, '..', 'KONTEKST_PROJEKTU.md');
if (fs.existsSync(ctxPath)) {
  const ctx = fs.readFileSync(ctxPath, 'utf8');
  ok('dokumentacja zawiera sekcję Model ról', ctx.includes('### Model ról'));
  ok('dokumentacja potwierdza: Back Office zakłada konta',
     /Back Office zakłada konta/.test(ctx),
     'sekcja Model ról musi być zgodna z _usrCanManage()');
  ok('dokumentacja nie zawiera już nieaktualnego zapisu',
     !/Back Office[^|]*nie zakłada kont/.test(ctx),
     'znaleziono sprzeczny zapis');
} else {
  info('brak KONTEKST_PROJEKTU.md');
}

// ── 3. Hierarchia ról (musi być zgodna z SQL expand_roles) ─────────────────
section('3. Hierarchia ról — UI vs SQL');
const expand = rs => w.eval(`(${html.match(/function expandRoles\(rs\)\s*\{[\s\S]*?\n    \}/)[0]})(${JSON.stringify(rs)})`);
let ex;
try { ex = expand(['admin']); } catch (e) { ex = null; }
if (ex) {
  ok('admin ⇒ backOffice', ex.includes('backOffice'), ex.join(','));
  ok('admin ⇒ energyAnalyst', ex.includes('energyAnalyst'));
  ok('admin ⇒ salesRepresentative', ex.includes('salesRepresentative'));
  const bo = expand(['backOffice']);
  ok('backOffice ⇒ energyAnalyst', bo.includes('energyAnalyst'), bo.join(','));
  ok('backOffice NIE ⇒ admin', !bo.includes('admin'), bo.join(','));
  const sr = expand(['salesRepresentative']);
  ok('salesRep nie dziedziczy niczego', sr.length === 1, sr.join(','));
  const cli = expand(['client']);
  ok('klient nie dziedziczy niczego', cli.length === 1, cli.join(','));
} else {
  info('nie udało się odczytać expandRoles z index.html');
}

// ── 4. Instrukcja dostępna wszystkim ───────────────────────────────────────
section('4. Instrukcja');
Object.keys(RM).forEach(r => {
  ok(`rola "${r}" ma kafelek Instrukcja`, RM[r].includes('instructions'), RM[r].join(','));
});

// ── 5. Ostrzeżenia: rozbieżność UI ↔ RLS ───────────────────────────────────
section('5. Znane rozbieżności UI ↔ baza danych');
const sqlPath = path.resolve(__dirname, '..', 'sql', '008_rls_role_scoping.sql');
const sqlExists = fs.existsSync(sqlPath);
ok('migracja 008 przygotowana', sqlExists);
if (sqlExists) {
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const zakomentowane = sql.includes('-- create policy p_obj_scoped');
  if (zakomentowane) {
    info('RLS NIE zawęża jeszcze Sales Repa — polityki w 008 są zakomentowane',
         'salesRepresentative widzi w bazie WSZYSTKICH klientów, obiekty, pomiary i faktury');
    info('UI pokazuje mu Klientów i Obiekty bez ograniczenia do przypisanych',
         'wymaga uzupełnienia objects.owner_id przed włączeniem polityk');
  } else {
    ok('polityki zawężające Sales Repa są aktywne w 008', true);
  }
  ok('008 rozszerza is_analyst_or_admin o backOffice',
     sql.includes("'backOffice'") && sql.includes('is_analyst_or_admin'));
}

console.log('\n' + '═'.repeat(66));
console.log(`WYNIK: ${pass} zaliczonych, ${fail} niezaliczonych, ${warn} ostrzeżeń`);
console.log('═'.repeat(66));
if (warn) console.log('Ostrzeżenia (⚠) to znane, świadome rozbieżności — nie psują testu.');
process.exit(fail ? 1 : 0);

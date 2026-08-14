/* Dokumenty i foldery: hierarchia, usuwanie kaskadowe, brak osieroconych
   plików, przenoszenie, przypisanie do klienta. Tu błąd = znikające pliki. */
const { boot } = require('./harness');

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; console.log('  ✗ ' + n + (x !== undefined ? '  → ' + x : '')); } };
const section = t => console.log('\n── ' + t + ' ' + '─'.repeat(Math.max(0, 56 - t.length)));

const { w } = boot({ inline: false });
const F = w.DocFoldersModule, D = w.DocumentsModule;

w.ClientsModule.add({ name: 'Klient Dok', nip: '2222222222' });
const cl = w.ClientsModule.getAll().slice(-1)[0];
w.ClientsModule.add({ name: 'Klient Obcy', nip: '3333333333' });
const cl2 = w.ClientsModule.getAll().slice(-1)[0];

const addF = (name, parentId, type, clientId) => {
  F.add({ clientId: clientId || cl.id, name, type: type || 'custom', parentId: parentId || null });
  return F.getAll().slice(-1)[0];
};
const addD = (name, folderId, clientId) => {
  D.add({ clientId: clientId || cl.id, name, folderId: folderId || null });
  return D.getAll().slice(-1)[0];
};

// ── 1. Hierarchia ──────────────────────────────────────────────────────────
section('1. Hierarchia folderów');
const root = addF('Klient Dok', null, 'client');
const umowy = addF('Umowy', root.id);
const aneksy = addF('Aneksy', umowy.id);
const zalaczniki = addF('Załączniki', aneksy.id);
ok('folder główny bez rodzica', root.parentId === null, root.parentId);
ok('zagnieżdżenie 3 poziomy', Number(zalaczniki.parentId) === Number(aneksy.id));
ok('findByClient zwraca tylko foldery klienta', F.findByClient(cl.id).length === 4, F.findByClient(cl.id).length);
addF('Obcy folder', null, 'client', cl2.id);
ok('foldery obcego klienta odseparowane', F.findByClient(cl.id).length === 4, F.findByClient(cl.id).length);
ok('descendantIds obejmuje całe poddrzewo', F.descendantIds(umowy.id).length === 3, F.descendantIds(umowy.id).length);
ok('descendantIds liścia = sam liść', F.descendantIds(zalaczniki.id).length === 1);

// ── 2. Usuwanie kaskadowe bez osieroceń ────────────────────────────────────
section('2. Usuwanie folderu z zawartością');
const dRoot = addD('umowa.pdf', root.id);
const dUmowy = addD('umowa-2024.pdf', umowy.id);
const dAneksy = addD('aneks-1.pdf', aneksy.id);
const dZal = addD('zalacznik-3.pdf', zalaczniki.id);
ok('4 dokumenty dodane', D.findByClient(cl.id).length === 4, D.findByClient(cl.id).length);

const removed = F.remove(umowy.id);
ok('usunięto folder + 2 podfoldery', removed.length === 3, removed.length);
ok('folder główny nienaruszony', !!F.find(root.id));
ok('dokumenty NIE zostały skasowane', D.findByClient(cl.id).length === 4, D.findByClient(cl.id).length);

const orphans = D.getAll().filter(d => d.folderId != null && !F.find(d.folderId));
ok('brak osieroconych dokumentów', orphans.length === 0, orphans.map(o => o.name).join(','));
ok('plik z usuniętego folderu trafił do korzenia',
   Number(D.find(dUmowy.id).folderId) === Number(root.id), D.find(dUmowy.id).folderId);
ok('plik z PODfolderu też trafił do korzenia',
   Number(D.find(dAneksy.id).folderId) === Number(root.id), D.find(dAneksy.id).folderId);
ok('plik z 3. poziomu też trafił do korzenia',
   Number(D.find(dZal.id).folderId) === Number(root.id), D.find(dZal.id).folderId);
ok('plik już w korzeniu nietknięty',
   Number(D.find(dRoot.id).folderId) === Number(root.id));

// ── 3. Odporność na cykl parentId ──────────────────────────────────────────
section('3. Odporność na uszkodzone dane');
const a = addF('A'), b = addF('B', null);
F.update(a.id, { parentId: b.id });
F.update(b.id, { parentId: a.id });   // cykl
let cycleOk = true, ids = [];
try {
  const t = setTimeout(() => { cycleOk = false; }, 0);
  ids = F.descendantIds(a.id);
  clearTimeout(t);
} catch (e) { cycleOk = false; }
ok('cykl parentId nie zawiesza descendantIds', cycleOk && ids.length === 2, ids.length);

// ── 4. Przenoszenie dokumentów ─────────────────────────────────────────────
section('4. Przenoszenie dokumentów');
const nowy = addF('Nowy', root.id);
D.move(dRoot.id, nowy.id);
ok('move przenosi', Number(D.find(dRoot.id).folderId) === Number(nowy.id), D.find(dRoot.id).folderId);
D.move(dRoot.id, null);
ok('move(null) → poza folderem', !D.find(dRoot.id).folderId, D.find(dRoot.id).folderId);
ok('findByFolder(null) łapie pliki bez folderu',
   D.findByFolder(null).some(d => Number(d.id) === Number(dRoot.id)));
ok('findByFolder(id) nie łapie cudzych',
   D.findByFolder(nowy.id).every(d => Number(d.folderId) === Number(nowy.id)));

// ── 5. Separacja klientów ──────────────────────────────────────────────────
section('5. Separacja między klientami');
addD('obcy.pdf', null, cl2.id);
const mine = D.findByClient(cl.id).map(d => d.name);
ok('dokumenty obcego klienta niewidoczne', !mine.includes('obcy.pdf'), mine.join(','));
ok('findByClient obcego zwraca jego plik',
   D.findByClient(cl2.id).some(d => d.name === 'obcy.pdf'));

// ── 6. Identyfikatory ──────────────────────────────────────────────────────
section('6. Identyfikatory');
const many = [];
for (let i = 0; i < 200; i++) many.push(addD('seria-' + i + '.pdf', root.id));
const dids = D.getAll().map(d => d.id);
ok('200 dokumentów w pętli → unikalne id', new Set(dids).size === dids.length,
   (dids.length - new Set(dids).size) + ' duplikatów');
const nBefore = D.getAll().length;
D.remove(many[50].id);
ok('usunięcie jednego usuwa dokładnie jeden', D.getAll().length === nBefore - 1, D.getAll().length);

const fids = [];
for (let i = 0; i < 100; i++) fids.push(addF('f-' + i, root.id).id);
ok('100 folderów w pętli → unikalne id', new Set(fids).size === 100, new Set(fids).size);

// ── 7. Trwałość ────────────────────────────────────────────────────────────
section('7. Trwałość po przeładowaniu');
const dump = {};
for (let k = 0; k < w.localStorage.length; k++) { const key = w.localStorage.key(k); dump[key] = w.localStorage.getItem(key); }
const B = boot({ inline: false });
Object.entries(dump).forEach(([k, v]) => B.w.localStorage.setItem(k, v));
ok('dokumenty przetrwały', B.w.DocumentsModule.getAll().length === D.getAll().length,
   B.w.DocumentsModule.getAll().length + ' vs ' + D.getAll().length);
ok('foldery przetrwały', B.w.DocFoldersModule.getAll().length === F.getAll().length,
   B.w.DocFoldersModule.getAll().length + ' vs ' + F.getAll().length);
const orph2 = B.w.DocumentsModule.getAll().filter(d => d.folderId != null && !B.w.DocFoldersModule.find(d.folderId));
ok('nadal brak osieroconych po przeładowaniu', orph2.length === 0, orph2.length);

console.log('\n' + '═'.repeat(66));
console.log(`WYNIK: ${pass} zaliczonych, ${fail} niezaliczonych`);
console.log('═'.repeat(66));
process.exit(fail ? 1 : 0);

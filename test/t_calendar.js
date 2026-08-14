/* Kalendarz: terminy, zaległości, strefa czasowa, odporność na uszkodzone dane.
   Przypomnienia sterują terminami płatności — fałszywa zaległość lub zgubiony
   termin to realny problem operacyjny. */
const { boot } = require('./harness');

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; console.log('  ✗ ' + n + (x !== undefined ? '  → ' + x : '')); } };
const section = t => console.log('\n── ' + t + ' ' + '─'.repeat(Math.max(0, 56 - t.length)));

const { w } = boot({ inline: false });
const C = w.CalendarModule;

const d = new Date();
const iso = x => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
const plus = n => { const x = new Date(d); x.setDate(x.getDate() + n); return iso(x); };

section('1. Klasyfikacja terminów');
C.add({ title: 'Dziś', dueDate: iso(d) });
C.add({ title: 'Wczoraj', dueDate: plus(-1) });
C.add({ title: 'Za 3 dni', dueDate: plus(3) });
C.add({ title: 'Za 60 dni', dueDate: plus(60) });
C.add({ title: 'Bez terminu', dueDate: '' });

const names = f => f.map(e => e.title).sort().join(',');
ok('getToday zawiera tylko dzisiejsze', names(C.getToday()) === 'Dziś', names(C.getToday()));
ok('getOverdue zawiera wczorajsze', C.getOverdue().some(e => e.title === 'Wczoraj'));
ok('getOverdue NIE zawiera zadań bez terminu',
   !C.getOverdue().some(e => e.title === 'Bez terminu'),
   'puste dueDate udaje zaległość');
ok('getOverdue nie zawiera dzisiejszych', !C.getOverdue().some(e => e.title === 'Dziś'));
ok('getUpcoming(7) łapie za 3 dni', C.getUpcoming(7).some(e => e.title === 'Za 3 dni'));
ok('getUpcoming(7) nie łapie za 60 dni', !C.getUpcoming(7).some(e => e.title === 'Za 60 dni'));
ok('getUpcoming nie łapie dzisiejszych', !C.getUpcoming(7).some(e => e.title === 'Dziś'));
ok('getUndated pokazuje zadania bez terminu', C.getUndated().some(e => e.title === 'Bez terminu'));

section('2. Strefa czasowa');
ok('_today zgodne z lokalną datą', C._today() === iso(d), C._today() + ' vs ' + iso(d));
ok('_today nie używa UTC przy przesunięciu',
   C._today() === new Date().toLocaleDateString('sv-SE'), C._today());

section('3. Odporność na uszkodzone dane');
const all = C.getAll();
all.push({ id: 900001, title: 'Brak pola dueDate', status: 'PENDING' });
all.push({ id: 900002, title: 'Śmieć w dacie', status: 'PENDING', dueDate: 'wkrótce' });
all.push({ id: 900003, title: 'null w dacie', status: 'PENDING', dueDate: null });
C.saveAll(all);
let threw = null;
try { C.getByMonth(d.getFullYear(), d.getMonth() + 1); } catch (e) { threw = e.message; }
ok('getByMonth nie rzuca na braku dueDate', threw === null, threw);
try { C.getOverdue(); C.getUpcoming(7); C.getToday(); } catch (e) { threw = e.message; }
ok('pozostałe filtry też nie rzucają', threw === null, threw);
ok('uszkodzone rekordy nie trafiają do zaległości',
   !C.getOverdue().some(e => String(e.id).startsWith('9000')),
   C.getOverdue().map(e => e.title).join(','));

section('4. Zamykanie zadań');
const todayEv = C.getToday()[0];
C.markDone(todayEv.id, 'Tester');
ok('markDone ustawia status', C.find(todayEv.id).status === 'DONE');
ok('markDone zapisuje osobę', C.find(todayEv.id).completedBy === 'Tester');
ok('zamknięte znika z getToday', !C.getToday().some(e => Number(e.id) === Number(todayEv.id)));
ok('zamknięte nie wraca jako zaległe', !C.getOverdue().some(e => Number(e.id) === Number(todayEv.id)));

section('5. Identyfikatory i trwałość');
for (let i = 0; i < 200; i++) C.add({ title: 'seria ' + i, dueDate: plus(i % 30) });
const ids = C.getAll().map(e => e.id);
ok('200 zdarzeń → unikalne id', new Set(ids).size === ids.length,
   (ids.length - new Set(ids).size) + ' duplikatów');
const n = C.getAll().length;
C.remove(ids[20]);
ok('usunięcie jednego usuwa jeden', C.getAll().length === n - 1, C.getAll().length);

const dump = {};
for (let k = 0; k < w.localStorage.length; k++) { const key = w.localStorage.key(k); dump[key] = w.localStorage.getItem(key); }
const B = boot({ inline: false });
Object.entries(dump).forEach(([k, v]) => B.w.localStorage.setItem(k, v));
ok('zdarzenia przetrwały przeładowanie',
   B.w.CalendarModule.getAll().length === C.getAll().length,
   B.w.CalendarModule.getAll().length + ' vs ' + C.getAll().length);

console.log('\n' + '═'.repeat(66));
console.log(`WYNIK: ${pass} zaliczonych, ${fail} niezaliczonych`);
console.log('═'.repeat(66));
process.exit(fail ? 1 : 0);

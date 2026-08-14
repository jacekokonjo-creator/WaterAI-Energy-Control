/* ═══════════════════════════════════════════════════════════════════════════
   Bezpieczne identyfikatory rekordów
   ───────────────────────────────────────────────────────────────────────────
   Wszystkie moduły danych nadawały id przez `Date.now()`. Dwa rekordy dodane
   w tej samej milisekundzie dostawały IDENTYCZNE id, a wtedy:
     • remove(id)  kasuje OBA rekordy (utrata danych),
     • find(id)    zwraca przypadkowy z nich,
     • update(id)  nadpisuje oba.

   Zdarza się przy imporcie, wklejaniu serii pomiarów, kopiowaniu rekordów
   i wszędzie, gdzie rekordy powstają pętlą, a nie kliknięciem.

   `nextId()` gwarantuje ścisłą monotoniczność: nigdy nie zwróci wartości
   mniejszej ani równej poprzedniej, także po przeładowaniu strony (bo bierze
   pod uwagę maksimum już istniejących id).

   Ładowany PRZED modułami danych.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var _last = 0;

  function nextId() {
    var now = Date.now();
    _last = (now > _last) ? now : (_last + 1);
    return _last;
  }

  /* Podbija licznik ponad najwyższe id widziane w kolekcji — wywoływane przez
     moduły przy dodawaniu, żeby po przeładowaniu strony nie zacząć od zera
     i nie trafić w id zapisane wcześniej. */
  function nextIdFor(collection) {
    var max = 0;
    (collection || []).forEach(function (r) {
      var v = Number(r && r.id);
      if (!isNaN(v) && v > max) max = v;
    });
    if (max >= _last) _last = max;
    return nextId();
  }

  window.WaterAIIds = { nextId: nextId, nextIdFor: nextIdFor };
  window._waNextId = nextId;
  window._waNextIdFor = nextIdFor;
})();

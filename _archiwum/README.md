# Archiwum — kod wycofany z użycia

Pliki przeniesione tu **nie były ładowane** przez `index.html` w momencie
przenoszenia (2026-08-14). Nie są usunięte na stałe, żeby dało się do nich
wrócić, ale nie należy ich reaktywować bez przeglądu — zawierają starsze
wersje funkcji, które w międzyczasie zostały przepisane w `app-v2.js`.

| Plik | Rozmiar | Uwagi |
|---|---|---|
| `app.js.bak` | ~222 kB, 248 funkcji | poprzednik `app.build.js` / `app-v2.js` |
| `translations.js.bak` | 16 B | zaślepka, zastąpiona serią `i18n-*.js` |
| `imports.js.bak` | 10 B | pusta zaślepka |
| `reports.js.bak` | 12 B | pusta zaślepka, funkcję pełni `esco-reports.js` |

**Dlaczego to ma znaczenie.** Ten projekt stracił już sporo czasu na czytaniu
kodu, który nie startuje: `shares.js` i `simulations.js` bez znaczników
`<script>` (lipiec 2026), arkusze `_analVOLUMESheet` bez gałęzi w dispatchu,
router zakładek nadpisany późniejszą definicją. Trzymanie martwych plików
obok żywych utrwala ten wzorzec.

**Jedyne źródło prawdy o tym, co faktycznie startuje, to kolejność
znaczników `<script>` w `index.html`.**

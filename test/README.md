# Testy automatyczne

Uruchamiają **realny kod aplikacji** w symulowanym DOM (jsdom), w tej samej
kolejności co `index.html`. Supabase jest niedostępny, więc `_mkStore` spada
do trybu lokalnego na `localStorage` — ta sama ścieżka co offline w przeglądarce.

## Uruchomienie

```bash
npm install jsdom
node test/t_flow.js
```

## Co pokrywają

`t_flow.js` — 55 asercji przechodzących pełną ścieżkę:
okres bazowy → analiza → zapis → raport/PDF, dla Korekty obłożenia
i Korekty intensywności, plus przypadki brzegowe i kontrola degeneracyjna
(obłożenie przy O=100 % musi dać wynik identyczny z TYM).

## Dlaczego harness wstrzykuje `<script>`, a nie `eval()`

`eval()` nadaje deklaracjom `let`/`const` zasięg eval-a — znikają, zamiast
trafić do globalnego środowiska leksykalnego. Semantyka musi odpowiadać
przeglądarce, bo **na tym polegał realny błąd** wykryty 2026-08-14:
`ANAL` jest zadeklarowane jako `let` na poziomie pliku, więc `window.ANAL`
jest zawsze `undefined`. Strażniki `if (window.ANAL && ...)` były zawsze
fałszywe i silnik korekty obłożenia w analizie nigdy się nie uruchamiał —
liczył zwykły TYM, dając wiarygodnie wyglądające, ale błędne kwoty faktur.

Odwołania do zmiennych `let`/`const` z poziomu pliku muszą iść przez gołą
nazwę (z osłoną `typeof X !== 'undefined'`), nigdy przez `window.X`.

## Pliki

| Plik | Zakres | Asercji |
|---|---|---|
| `t_flow.js` | okres bazowy → analiza → zapis → raport (obłożenie + intensywność), przypadki brzegowe | 62 |
| `t_smoke.js` | każda funkcja `render*` × 5 ról × 4 zakładki × 4 typy analiz | 170 wywołań |
| `t_persist.js` | zapis → przeładowanie → odczyt, kopia zapasowa, kwoty ESCO | 20 |
| `t_invoicing.js` | VAT, numeracja, kwoty słownie, powiązanie z analizą, trwałość | 44 |

Uruchamiane automatycznie przy każdym push na `main`
(`.github/workflows/testy.yml`) — **przed** wdrożeniem.

## CI — do dodania ręcznie

Plik `test/CI-testy.yml.txt` zawiera gotowy workflow. Token użyty do wypchnięcia
tych zmian nie ma uprawnienia `workflow`, więc trzeba go dodać samodzielnie:
skopiować zawartość do `.github/workflows/testy.yml` przez interfejs GitHuba
albo wypchnąć tokenem z zakresem `workflow`.

Uruchamia kontrolę składni i wszystkie trzy zestawy testów przy każdym push
na `main` — **przed** wdrożeniem, więc błąd nie trafi na produkcję.

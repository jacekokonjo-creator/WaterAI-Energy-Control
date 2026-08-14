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

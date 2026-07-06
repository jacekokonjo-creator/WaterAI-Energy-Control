# WaterAI Energy Control

System do pomiaru, analizy i rozliczania oszczędności energii w modelu ESCO.

**Live:** https://control.waterai.cloud (GitHub Pages z gałęzi `main`)

## Stan (2026-07)

Aplikacja działa produkcyjnie: czysty HTML/CSS/JS (bez buildu), dane w **Supabase**
(Postgres + Auth + Storage) z lustrem `localStorage` (tryb offline), logowanie przez
Supabase Auth z rolami (admin / backOffice / energyAnalyst / salesRepresentative / client).

Główne funkcje: klienci i obiekty, pomiary/odczyty z załącznikami, protokoły TYM,
regresja liniowa, silnik rozliczeń ESCO z korektą pogodową (HDD/TYM), raporty ESCO
z zamrażaniem treści, fakturowanie i podmioty rozliczeniowe, dokumenty, kalendarz,
kopie zapasowe, 5 języków UI (PL/EN/DE/CZ/SK — słowacki łącznie z treścią domenową i wykresami).

## Dokumentacja

- **`KONTEKST_PROJEKTU.md`** — pierwsze źródło prawdy: architektura, model danych,
  workflow deployów, konwencje, roadmapa, changelog. **Czytaj najpierw.**
- `WATERAI_ARCHITEKTURA_PLAN.md` — szczegółowy plan architektury (częściowo historyczny).
- `supabase/README.md` — decyzje dot. bazy: RLS, macierz uprawnień, plan integracji EspoCRM.

## Deploy

Commit na `main` → GitHub Pages buduje automatycznie (~1–2 min).
Skrypty mają cache-busting `?v=...` — po zmianie pliku JS podbij numer w `index.html`.

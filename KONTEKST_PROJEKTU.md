# WaterAI Energy Control — Kontekst projektu (czytaj najpierw)

> Ten plik to **pierwsze źródło prawdy** dla każdego nowego czatu w tym projekcie.
> Po jego przeczytaniu wiadomo: czym jest aplikacja, gdzie żyje, jak się ją wdraża,
> co już działa, co jest w planie i jak należy w niej pracować.
>
> Ostatnia aktualizacja: **2026-07-06** · Wersja aplikacji (stopka UI): **v0.7.0** · Generacja modułów: **v2**
>
> ⚠️ **Duża zmiana od poprzedniej wersji dokumentu (2026-06-24):** aplikacja przeszła
> z czystego `localStorage` na **model hybrydowy Supabase + lustro localStorage**
> (2026-07-05), ma **prawdziwe konta użytkowników** (Supabase Auth), nowy moduł
> **Pomiary** (readings), moduł **kopii zapasowych** oraz **pełne słowackie
> tłumaczenie treści domenowych** łącznie z wykresami (2026-07-06).
> Wszystkie fakty poniżej zweryfikowano wprost w repo.

---

## 1. Czym jest projekt

**WaterAI Energy Control** — system do pomiaru i rozliczania oszczędności energii w modelu **ESCO**
(Energy Service Company). Mierzy zużycie ciepła/energii w obiektach klientów, koryguje je o warunki
pogodowe (HDD/regresja), wylicza oszczędności względem okresu bazowego i generuje raporty oraz
rozliczenia ESCO (podział oszczędności między firmę a klienta).

Główne pojęcia domenowe:
- **Klient** → ma **obiekty** (budynki) → obiekty mają **pomiary/odczyty**, **analizy**, **protokoły** i **raporty ESCO**.
- **Model rozliczeń**: ESCO (udział % w oszczędnościach), FLAT (abonament), PROJECT.
- **Korekta pogodowa**: HDD (Heating Degree Days) + regresja liniowa zużycia względem temperatury.
- **Okres bazowy** (PRZED) vs **okres rozliczeniowy** (PO); korekta TYM (Typowy Rok Meteorologiczny).

---

## 2. Gdzie to żyje (hosting i adresy)

| Co | Adres |
|---|---|
| Strona produkcyjna (live) | **https://control.waterai.cloud** |
| Stary domyślny adres (ten sam deploy) | https://jacekokonjo-creator.github.io/WaterAI-Energy-Control/ |
| Repozytorium | `jacekokonjo-creator/WaterAI-Energy-Control` (gałąź `main`) |
| Backend danych | **Supabase** (Postgres + Auth + Storage; konfiguracja w `js/supabase-client.js`) |
| CRM (planowana integracja) | EspoCRM self-hosted: `office.waterai.cloud` |

`control.waterai.cloud` i adres `github.io` to **ten sam kod** — własna domena podpięta do
GitHub Pages. Front jest serwowany wprost z repo; dane idą do Supabase.

---

## 3. Stack i struktura (ZWERYFIKOWANE z kodem, stan main 2026-07-06)

- **Czysty HTML/CSS/JS, bez buildu i bez frameworka** — skorupa + rdzeń + moduły.
- **Dane: model hybrydowy.** Moduły danych korzystają z fabryki mostków
  **`WaterAIBridge.makeStore()`** (`js/supabase-bridge.js`): po zalogowaniu `load()` zaciąga
  tabelę do pamięci podręcznej (jedyne `await`), a `getAll()`/`saveAll()` działają dalej
  **synchronicznie** na cache; zapis do bazy leci w tle (diff insert/update/delete), a
  **lustro w `localStorage`** utrzymuje tryb offline i kopie. Klucze obce: legacy id → uuid (opcja `fk`).
  ⚠️ Lekcja z incydentu 2026-07-05: **migawka danych lokalnych powstaje ZANIM lustro cokolwiek nadpisze**.
- **Logowanie: Supabase Auth** + tabela `profiles` (rola, przypisany klient). Konta zakłada
  admin z poziomu aplikacji; konto bez profilu jest blokowane przy wejściu. Reset/zmiana hasła w UI.
- **Wielojęzyczność:** PL / EN / DE / CZ / SK — skorupa przez obiekt `translations` w `index.html`;
  **treści domenowe (moduły, protokoły, raporty, wykresy) po słowacku przez `js/modules/i18n-domain.js`**
  (szczegóły w sekcji 8).
- **Role:** `admin`, `backOffice`, `energyAnalyst`, `salesRepresentative`, `client` (+ macierz RLS w bazie, sekcja 6).

### Pliki i kolejność ładowania (z `index.html`, ~1360 linii)

| # | Plik | Rola |
|---|---|---|
| 0 | CDN `supabase-js@2` → `js/supabase-client.js` → `js/supabase-bridge.js` | Klient Supabase + fabryka mostków sync→async |
| 1 | `js/modules/migration.js` | Migracje danych v1→v2 (jednorazowe, znacznikowane) |
| 2 | `js/modules/clients.js` | `ClientsModule` v3 — tabela `clients` przez mostek |
| 3 | `js/modules/objects.js` | `ObjectsModule` v3 — tabela `objects` (FK client_id) |
| 4 | `js/modules/esco-reports.js` | `EscoReportsModule` + magazyny okresów bazowych i baz intensywności (spłata długu techn.) |
| 5 | `js/modules/workflow.js` | LEGACY (zastępowany przez kalendarz) |
| 6 | `js/modules/measurements.js` | Protokoły TYM — tabela `measurements` |
| 7 | `js/modules/analyses.js` | Analizy — tabela `analyses` |
| 8 | `js/modules/documents.js` + `doc-folders.js` | Magazyn dokumentów + foldery (lokalnie) |
| 9 | `js/modules/invoicing.js` | Faktury (lokalnie) |
| 10 | `js/modules/billing-entities.js` | Podmioty wystawiające faktury (kilka spółek, kraje PL/SK/CZ/DE…, stawki VAT) |
| 11 | `js/modules/calendar.js` | Kalendarz zdarzeń (lokalnie) |
| 12 | `js/modules/users.js` (~20 kB) | Użytkownicy: Supabase Auth + `profiles`, tworzenie/edycja/blokada, reset hasła, sortowanie |
| 13 | `js/app.build.js` (~264 kB) | **Rdzeń**: regresja (`buildRegressionData`, `calcLinearRegression`), ESCO (`calcESCOResults`, `kBilling`, `kComparison`, HDD), wykresy Canvas, CRUD-y UI |
| 14 | `js/modules/app-v2.js` (~343 kB) | **Rozszerzenie v2**: raporty ESCO (generowanie, podgląd, zamrażanie treści), `IntensityBaseModule`, `BasePeriodModule`, render analiz |
| 15 | `js/modules/i18n-domain.js` (~133 kB) | **Tłumaczenia domenowe SK** — słownik ~1470 wpisów + silnik (sekcja 8) |
| 16 | `js/modules/readings.js` (~49 kB) | **Pomiary** — rejestr odczytów/zużycia per obiekt, wpis seryjny, załączniki (Storage), pozycje FV, szablony gaz/prąd |
| 17 | `js/modules/backup.js` | Eksport/import WSZYSTKICH kluczy `waterai_*` do pliku JSON |

Inne: `supabase/` (schema.sql, 002_auth.sql, 003_grants.sql, migration_002_readings.sql, README.md
z decyzjami architektonicznymi), `narzedzia/zasil.html` (jednorazowe zasilenie bazy danymi lokalnymi),
`js/app.js` (stary rdzeń — nieładowany), `js/translations.js`, `js/modules/imports.js`, `js/modules/reports.js` (puste stuby).

Plik referencyjny: `Regresja_liniowa__PREMIUM.xlsx` — wzorzec obliczeniowy regresji
(zakładki `supply temp` i `heat consumption`), porównanie „Tryb pogodowy" vs „WaterAI". Nie są to dane produkcyjne.

---

## 4. Jak się to wdraża (DEPLOY) — kluczowe dla pracy w czacie

GitHub Pages **buduje stronę automatycznie po każdym commicie na `main`**. Workflow zmiany:

1. Pobierz **aktualny, realny** plik z repo (surowy):
   `https://raw.githubusercontent.com/jacekokonjo-creator/WaterAI-Energy-Control/main/<ścieżka>`.
2. Nanieś **minimalne, punktowe zmiany** (nie przepisuj całości — łatwiej o regresję).
3. Wypchnij commit na `main` przez **GitHub Contents API** (PUT `/repos/.../contents/<ścieżka>`
   z aktualnym `sha` pliku).
4. Poczekaj ~1–2 min (zakładka **Actions**), potem **twardy refresh** (`Ctrl+Shift+R`).
   Skrypty mają `?v=...` (cache-busting) — **przy zmianie pliku JS podbij ten numer w `index.html`**.

**Token do commitów** jest w pliku `token.txt` (w wiedzy projektu):
- Fine-grained PAT, ograniczony **tylko do tego repo**, uprawnienie **Contents: Read and write**, z datą wygaśnięcia.
- Nie kopiować do innych plików, nie commitować do repo.

Zmiany w schemacie bazy: pliki SQL w `supabase/` uruchamia się ręcznie w SQL Editorze Supabase
(kolejność: schema → 002_auth → 003_grants → migration_002_readings).

---

## 5. Co już działa (NIE psuć przy zmianach)

Warstwa danych i konta:
- **Mostek Supabase** (`WaterAIBridge`) — klienci, obiekty, protokoły TYM, analizy, raporty ESCO,
  okresy bazowe, bazy intensywności, dane regresji (`regression_sensors`), pomiary (`readings`) w bazie;
  lustro localStorage; tryb awaryjny lokalny gdy brak mostka; jednorazowa migracja danych lokalnych (pyta tylko admina).
- **Użytkownicy v2**: Supabase Auth + `profiles`; tworzenie/edycja/blokada kont, reset i zmiana hasła,
  twarda blokada kont bez profilu; zalogowany użytkownik widoczny w nagłówku; RLS przycina widok roli `client`.
- **Kopia zapasowa** (`BackupModule`): eksport/import wszystkich kluczy `waterai_*` do JSON.

Domenowo:
- Pełny CRUD klientów i obiektów (pola v2: regon, status, daty współpracy, dane FV, `settlementModel`, `escoShare`).
- **Pomiary** (`ReadingsModule`): rejestr odczytów per obiekt, wpis seryjny, załączniki (bucket
  `reading-attachments`), pozycje FV z typem kosztu zmienna/stała, szablony gazowe i prądowe,
  sortowanie, L.p. chronologiczne, podsumowanie ESCO kosztów zmiennych na jednostkę paliwa.
- Protokoły TYM (`realMonthly`, `comparisonMonthly`, `tymMonthly`, HDD).
- Silnik ESCO (`calcESCOResults`, `kBilling`, `kComparison`, korekta HDD) i regresja liniowa
  (pełna edycja protokołu okresu bazowego: dane + selekcja + regresja).
- **Raporty ESCO**: podsumowanie wykonawcze, scalona sekcja wyników obu metod, kwoty rozliczenia
  liczone na żywo, % redukcji per analiza, linia źródła danych klimatycznych,
  **zamrażanie treści** przy statusie Finalny/Podpisany (snapshot), adres i NIP/IČO klienta na okładce, druk/PDF.
- Analizy (typy TYM / REGRESSION / OCCUPANCY / AREA / VOLUME / SCHEDULE / CUSTOM; statusy DRAFT / COMPLETE / APPROVED).
- Fakturowanie + **podmioty rozliczeniowe** (kilka spółek, różne kraje/waluty/VAT).
- Dokumenty + foldery, kalendarz, wielojęzyczny sidebar i nawigacja.
- **Pełne tłumaczenie SK** treści domenowych, raportów i wykresów (sekcja 8).

---

## 6. Model danych — stan obecny

### Tabele Supabase (model hybrydowy: kolumny relacyjne dla RLS/FK + reszta w `data jsonb` 1:1 z localStorage)

| Tabela | Moduł | Lustro localStorage |
|---|---|---|
| `clients` | `ClientsModule` | `waterai_clients_v2` |
| `objects` | `ObjectsModule` (FK client_id) | `waterai_objects_v2` |
| `measurements` | `MeasurementsModule` (FK object_id) | `waterai_measurements_v2` |
| `analyses` | `AnalysesModule` (FK object_id) | `waterai_analyses_v1` |
| `esco_reports` | `EscoReportsModule` | `waterai_esco_reports_v1` |
| `base_periods` / `intensity_bases` | `BasePeriodModule` / `IntensityBaseModule` (delegują do esco-reports.js) | `waterai_base_periods_v1` / `waterai_intensity_base_v1` |
| `regression_sensors` | `RegressionBaseModule` (protokoły okresów bazowych + odczyty regresji) | `waterai_regression_*` |
| `readings` (+ bucket `reading-attachments`) | `ReadingsModule` (FK object_id) | `waterai_readings_v1` |
| `profiles` | `UsersModule` (Auth) | `waterai_users_v1` |

**Macierz uprawnień (RLS, egzekwowana w bazie — decyzje z `supabase/README.md`):**
admin pełne; energyAnalyst pełne + zatwierdzanie pomiarów; backOffice dodaje/edytuje własne pomiary,
pełne faktury; salesRepresentative odczyt; client dodaje odczyty na swoich obiektach (`verified=false`),
widzi swoje. Do obliczeń wchodzą **wyłącznie** pomiary `verified=true` (trigger `guard_verify`).

### Moduły nadal wyłącznie lokalne (do przeniesienia na mostek)

`waterai_invoices_v1` (faktury), `waterai_documents_v1` + `waterai_doc_folders_v1` (dokumenty),
`waterai_calendar_v1` (kalendarz), `waterai_billing_entities_v1` (podmioty), `waterai_workflow_v1` (legacy).

### Klucze legacy / techniczne

`waterai_clients_v1`, `waterai_objects_v1`, `waterai_reminders_v1` + znaczniki `*_migrated*`.

---

## 7. Plan — co przed nami (roadmapa)

Krótkoterminowo:
1. **Dokończenie migracji na mostek**: invoicing, documents, doc-folders, calendar, billing-entities
   (wzorzec gotowy — `WaterAIBridge.makeStore` + tabela hybrydowa + RLS).
2. **Udostępnianie zasobów**: tabela `resource_shares` (konto × zasób × view/edit) + modal
   z checkboxami przy raporcie ESCO / okresie bazowym / analizie; kolumna `emailed_at` pod wysyłkę mailem.
3. **Integracja EspoCRM** (droga A): gotowy raport pchany do EspoCRM przez REST API
   **przez Supabase Edge Function** (klucz API nie może być widoczny we froncie);
   w EspoCRM użytkownik API z minimalnymi uprawnieniami (Documents + Accounts).
4. Tabele z planu: `waterai_measurements_v3` (czyste pomiary źródłowe — częściowo realizuje to
   `readings`) i `waterai_protocols_v1` (formalne protokoły z numeracją/wersjonowaniem) — do rewizji,
   czy nadal potrzebne po module Pomiarów.

Średnioterminowo:
5. Import danych z PDF; audyt zmian; panel klienta (rozbudowa widoków roli `client`).
6. **i18n**: słowniki CZ / DE / EN treści domenowych tym samym wzorcem (`DICT.cs`, `DICT.de`… w `i18n-domain.js`).
7. Wysyłka raportów mailem (po `resource_shares` i EspoCRM).

Pełny plan architektury: **`WATERAI_ARCHITEKTURA_PLAN.md`** w repo (część o „braku backendu"
zdezaktualizowana — mostek już istnieje).

---

## 8. Tłumaczenia domenowe (i18n-domain.js) — jak to działa i jak rozszerzać

Skorupa (login, dashboard, menu) tłumaczy się przez `translations` w `index.html` (5 języków, kompletne).
Moduły domenowe mają **polskie teksty na sztywno** w ~10 tys. linii — zamiast refaktoryzacji działa
**warstwa tłumaczeń runtime** w `js/modules/i18n-domain.js`:

- **Słownik `DICT.sk`** (~1470 wpisów): klucz = dokładny polski tekst **na poziomie węzła tekstowego DOM**
  (zdania raportów są pocięte przez `${...}` i tagi HTML — klucze odpowiadają tym kawałkom).
  Encje HTML w kluczach są zdekodowane (`&nbsp;`→`\u00a0` itd.).
- **Silnik**: `MutationObserver` na `document.body` tłumaczy węzły tekstowe + atrybuty
  (`placeholder`, `title`, `value` przycisków) po każdym renderze; dopasowanie dokładne (Map),
  potem pass podłańcuchowy (klucze ≥6 znaków, najdłuższe najpierw, kontrola granic słowa);
  opakowane `alert()`/`confirm()`; **wrapper na `CanvasRenderingContext2D.fillText/strokeText`**
  tłumaczy napisy na wykresach w momencie rysowania. Aktywny tylko gdy `currentLanguage`
  ma słownik (dziś: `sk`); PL/EN/DE/CZ nietknięte.
- **Konwencje**: nowe teksty UI pisz po polsku jak dotąd i **dopisz parę PL→SK do `DICT.sk`**;
  brakująca fraza = jedna linia w słowniku. Nowy język = nowy obiekt `DICT.xx` w tym samym pliku.
  Po zmianie pliku podbij `?v=` w `index.html` (obecnie `v=3`).

---

## 9. Jak Claude ma pracować w tym projekcie (konwencje)

1. **Najpierw przeczytaj realny kod** z `raw.githubusercontent.com/.../main/<plik>` — nie zgaduj
   z pamięci. Logika jest rozproszona po wielu plikach (sekcja 3).
2. **Zmiany minimalne i punktowe.** Pokaż które linie się zmieniają.
3. **Dostęp do danych zawsze przez moduł / mostek** (`XModule…`, `WaterAIBridge.makeStore`),
   nigdy bezpośrednio do `localStorage` (wyjątek: `BackupModule` — celowo operuje na całym magazynie).
4. Po zmianie: commit na `main` przez API (token z `token.txt`), **podbij `?v=...`** zmienionych JS,
   przypomnij o twardym refreshu.
5. **Nie ruszaj** rzeczy z sekcji 5, chyba że o to wprost chodzi. Szczególna ostrożność:
   kolejność migawka→lustro w mostku (incydent 2026-07-05) i zamrażanie raportów ESCO.
6. Nowe teksty UI: po polsku + wpis do `DICT.sk` (sekcja 8).
7. Zmiany schematu bazy: nowy plik SQL w `supabase/` + instrukcja uruchomienia; RLS zgodnie z macierzą (sekcja 6).
8. Język domeny i UI: **polski**. Kod i nazwy zmiennych: jak w istniejącym kodzie.

---

## 10. Changelog (skondensowany)

- **2026-07-06** — **Pełne tłumaczenie SK**: moduł `i18n-domain.js` (słownik ~1470 wpisów, observer,
  alert/confirm, dekodowanie encji, granice słów) + **tłumaczenie wykresów canvas**
  (wrapper `fillText`/`strokeText`). Pomiary: typy kosztów Z/S w pozycjach FV, szablony gazowe
  (SOPo/SOPs/punkt poboru) i prądowe, sortowanie, L.p. chronologiczne, podsumowanie ESCO kosztów zmiennych.
- **2026-07-05** — **Migracja na Supabase (rdzeń)**: klient+Auth+profiles, fabryka mostków
  `WaterAIBridge` (sync→async, lustro, FK legacy→uuid), moduły clients/objects/measurements/analyses/
  esco-reports/base-periods/intensity/regression_sensors na mostku; **incydent i fix**: lustro
  nadpisywało lokalnych klientów przed migracją → migawka zawsze przed lustrem. **Users v2**:
  prawdziwe konta, blokada kont bez profilu, reset/zmiana hasła, e-mail w nagłówku.
  **Nowy moduł Pomiary** (`readings` + bucket załączników) — kafelek zastąpił Dokumenty na dashboardzie.
  Narzędzie `narzedzia/zasil.html` (jednorazowe zasilenie bazy).
- **2026-07-04** — `supabase/schema.sql` + README z decyzjami (RLS/macierz uprawnień, odczyty klienta
  `verified=false`, resource_shares, EspoCRM przez Edge Function, model hybrydowy jsonb, czas w UTC).
  Przebudowa raportu ESCO: podsumowanie wykonawcze, scalona sekcja wyników.
- **2026-07-02** — Raport ESCO: zamrażanie treści (Finalny/Podpisany), kwoty rozliczenia na żywo,
  % redukcji per analiza, linia źródła danych klimatycznych, NIP/IČO na okładce. Pełna edycja
  protokołu okresu bazowego regresji.
- **2026-06-24** — Synchronizacja dokumentacji z kodem (13 plików JS, 12 modułów danych);
  fix trybu testowego roli (`realRole`).

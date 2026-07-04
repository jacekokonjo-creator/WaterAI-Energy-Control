# Supabase — plan migracji i decyzje (2026-07-05)

> Ten folder to grunt pod migrację z `localStorage` na Supabase.
> `schema.sql` jest gotowy do uruchomienia — koduje decyzje podjęte 2026-07-05.

## Decyzje (ustalone, nie zmieniać bez powodu)

1. **Macierz uprawnień** (egzekwowana przez RLS w bazie, nie tylko w UI):

   | Rola | Pomiary źródłowe | Analizy / raporty ESCO / okresy bazowe | Faktury |
   |---|---|---|---|
   | admin | pełne | pełne | pełne |
   | energyAnalyst | pełne + **zatwierdzanie** | pełne | odczyt |
   | backOffice | dodawanie, edycja własnych | odczyt | pełne |
   | salesRepresentative | odczyt | odczyt | odczyt |
   | client | **dodaje odczyty na swoich obiektach** (wchodzą jako `verified=false`), odczyt swoich | odczyt swoich + udostępnione | odczyt swoich |

2. **Odczyty klienta**: trafiają do `source_measurements` z `verified=false`.
   Do obliczeń (regresja, ESCO) wchodzą **wyłącznie** pomiary `verified=true`.
   Zatwierdza analityk/admin (pilnuje trigger `guard_verify`, nie tylko UI).

3. **Udostępnianie**: tabela `resource_shares` — macierz konto × zasób ×
   uprawnienie (`view`/`edit`). UI: modal z tabelą kont i checkboxami przy
   raporcie ESCO / okresie bazowym / analizie. Kolumna `emailed_at` pod
   przyszłą wysyłkę mailem.

4. **EspoCRM** (self-hosted, `office.waterai.cloud`) — integracja drogą A:
   WaterAI jest źródłem danych i obliczeń; gotowy raport jest **pchany do
   EspoCRM** przez REST API (dokument/załącznik przypięty do konta klienta),
   wysyłka maili po stronie CRM. Wywołania do EspoCRM idą przez **Supabase
   Edge Function** (nie z przeglądarki!), bo klucz `X-Api-Key` nie może być
   widoczny we froncie. W EspoCRM: Administracja → API Users → utworzyć
   użytkownika API z kluczem i minimalnymi uprawnieniami (Documents +
   Accounts).

5. **Model hybrydowy tabel**: kolumny relacyjne tylko tam, gdzie potrzebuje
   ich RLS/filtrowanie; reszta pól w `data jsonb` w kształcie 1:1 z obecnym
   localStorage → podmiana `getAll`/`saveAll` w modułach jest minimalna.

6. **Czas**: wszystkie znaczniki w UTC (`timestamptz`), UI wyświetla lokalnie.
   Grupa działa w wielu krajach — to zasada od pierwszej tabeli.

7. **Region projektu**: Frankfurt `eu-central-1` (grupa europejska, RODO).

## Kroki uruchomienia (jednorazowo, ~30 min)

1. Konto na supabase.com → **New project**, region **Frankfurt (eu-central-1)**.
2. SQL Editor → wkleić całość `schema.sql` → **Run**.
3. Storage → utworzyć **prywatne** buckety `measurement-photos` i `documents`
   (polityki wg komentarza w sekcji 7 schematu).
4. Authentication → Providers → włączyć **Email** (zaproszenia dla kont
   klientów przyjdą później).
5. Settings → API → skopiować `Project URL` i `anon key` — trafią do
   `index.html` (anon key jest publiczny z założenia; bezpieczeństwo daje RLS).

## Kolejność migracji kodu (po uruchomieniu projektu)

1. Klient supabase-js przez CDN w `index.html` + logowanie przez Supabase Auth.
2. Pilot: `ClientsModule` — podmiana wnętrza `getAll`/`saveAll` na zapytania
   do tabeli `clients` + `await` w miejscach wołających (ćwiczy wzorzec
   sync→async przed resztą modułów).
3. Pozostałe moduły wg tabeli z `KONTEKST_PROJEKTU` sekcja 6; przy okazji
   dług techniczny: raporty ESCO i czujniki regresji dostają moduły
   (`EscoReportsModule`, `RegressionSensorsModule`) nad tabelami z schematu.
4. Transfer danych: eksport JSON z `BackupModule` → skrypt importu do tabel
   (mapowanie klucz localStorage → tabela jest w komentarzach `schema.sql`).
5. Nowa zakładka **Pomiary** (`SourceMeasurementsModule`) — budowana już na
   Supabase, zdjęcia w Storage, `<input capture="environment">` na telefonie,
   kolejka „do zatwierdzenia" dla analityka.
6. Macierz udostępnień (UI nad `resource_shares`).
7. Edge Function `push-report-to-espocrm` + przycisk „Wyślij do CRM".

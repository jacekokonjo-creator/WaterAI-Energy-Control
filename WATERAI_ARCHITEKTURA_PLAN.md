# WaterAI Energy Control — Plan Architektury v2.0

## ANALIZA OBECNEJ STRUKTURY (v0.7.0)

### Istniejące moduły i dane w localStorage

| Klucz localStorage | Moduł | Opis |
|---|---|---|
| `waterai_clients_v1` | ClientsModule | Klienci: nazwa, vatId, adres, kontakty, model rozliczeń |
| `waterai_objects_v1` | ObjectsModule | Obiekty: przypisanie do klienta, źródła ciepła, dane TYM |
| `waterai_measurements_v2` | MeasurementsModule | Protokoły TYM: okresy rozliczeniowe i porównawcze, HDD, dane miesięczne |
| `waterai_workflow_v1` | WorkflowModule | Zadania cykliczne: typ, rola, status, daty |
| `waterai_reminders_v1` | inline w index.html | Proste przypomnienia (legacy) |

### Co już działa (NIE RUSZAMY):
- ✅ Pełny CRUD klientów z zakładkami kontaktów
- ✅ Pełny CRUD obiektów z przypisaniem do klienta
- ✅ Protokoły TYM z danymi miesięcznymi (realMonthly, comparisonMonthly, tymMonthly)
- ✅ Silnik obliczeń ESCO (calcESCOResults, kBilling, kComparison, HDD)
- ✅ Regresja liniowa (buildRegressionData, calcLinearRegression)
- ✅ Generowanie raportów ESCO z wykresami Canvas
- ✅ System ról (Super Admin, Back Office, Energy Analyst, Client)
- ✅ Wielojęzyczność (PL, EN, DE, CZ, SK)
- ✅ Sidebar + moduły nawigacyjne
- ✅ WorkflowModule z zadaniami (szkielet kalendarza)

### Co wymaga rozbudowy lub dodania:
- ❌ Brak modułu Pomiarów jako osobnej warstwy (oddzielone od Protokołów TYM)
- ❌ Brak modułu Analiz (typy: TYM, regresja, obłożenie, powierzchnia, wolumen)
- ❌ Brak magazynu Dokumentów (faktury od klienta, umowy, dokumentacja techniczna, zdjęcia)
- ❌ Brak modułu Fakturowania (wystawianie FV, statusy, dashboard należności)
- ❌ Brak pełnego Kalendarza (widoki: dzień/tydzień/miesiąc, typy zdarzeń, powiadomienia)
- ❌ Brak REGON, statusu klienta, daty współpracy w klientach
- ❌ Brak powierzchni, roku budowy, opisu w obiektach

---

## DOCELOWY MODEL DANYCH

### Relacje nadrzędne

```
clients (klienci)
  └── objects (obiekty)            clientId → clients.id
        └── measurements (pomiary) objectId → objects.id
              └── analyses (analizy) measurementId → measurements.id
                    └── protocols (protokoły) analysisId → analyses.id

clients
  └── documents (dokumenty)        clientId → clients.id, [objectId → objects.id]
  └── invoices (faktury)           clientId → clients.id, [objectId → objects.id]

clients / objects
  └── calendar_events (zdarzenia)  clientId, [objectId], eventType, dueDate

esco_reports (raporty ESCO)
  └── esco_report_items            reportId → esco_reports.id
      zawierają: protocolIds[], analysisIds[], measurementIds[]
```

---

## TABELE / KOLUMNY (kompatybilne z localStorage i Supabase)

### 1. KLIENCI — `waterai_clients_v2`

```json
{
  "id": 1720000000000,
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-01T00:00:00Z",

  // Dane podstawowe
  "name": "ABC Sp. z o.o.",
  "vatId": "PL1234567890",
  "regon": "123456789",
  "status": "ACTIVE",                    // ACTIVE | INACTIVE | PROSPECT | SUSPENDED
  "cooperationStartDate": "2024-01-01",
  "notes": "",

  // Adres
  "country": "PL",
  "postalCode": "00-001",
  "city": "Warszawa",
  "street": "Prosta",
  "buildingNumber": "10",
  "apartmentNumber": "",
  "googleMapsUrl": "",

  // Kontakt
  "invoiceEmail": "ksiegowosc@abc.pl",
  "language": "pl",
  "contacts": [
    { "name": "Jan Kowalski", "role": "Dyrektor", "email": "j.kowalski@abc.pl", "phone": "+48 600 000 000" }
  ],

  // Rozliczenia
  "settlementModel": "ESCO",             // ESCO | FLAT | PROJECT
  "escoShare": 50,
  "paymentDays": 14
}
```

**Migracja:** `waterai_clients_v1` → dodać `regon`, `status`, `cooperationStartDate`, `notes` (domyślnie `""`)

---

### 2. OBIEKTY — `waterai_objects_v2`

```json
{
  "id": 1720000000001,
  "createdAt": "...",
  "updatedAt": "...",

  "clientId": 1720000000000,
  "name": "Hotel Centrum",
  "objectType": "HOTEL",
  "status": "ACTIVE",                    // IMPLEMENTATION | ACTIVE | PAUSED | FINISHED

  // Adres
  "country": "PL", "postalCode": "", "city": "", "street": "", "buildingNumber": "", "apartmentNumber": "", "googleMapsUrl": "",

  // Parametry budynku (NOWE)
  "totalArea": 0,                        // m² - powierzchnia całkowita
  "heatedArea": 0,                       // m² - powierzchnia ogrzewana
  "cooledArea": 0,                       // m² - powierzchnia chłodzona
  "yearBuilt": null,                     // rok budowy
  "description": "",                     // opis obiektu

  // Ogrzewanie (istniejące)
  "heatingSourceCO": "NONE",
  "heatingSourceCWU": "NONE",
  "heatConsumptionReading": "INVOICE",
  "heatConsumptionReadingDetails": "",
  "heatSources": [],

  // Dane klimatyczne (istniejące)
  "weatherStation": "",
  "weatherSource": "WeatherOnline / Robot Klimatu",
  "weatherSourceUrl": "",
  "weatherDataDownloadDate": "",
  "baseTemperature": 21,

  // Dane energetyczne (istniejące)
  "energyUnit": "GJ",
  "currency": "PLN",
  "energyPrice": 0,

  // Harmonogram (istniejące)
  "billingCycle": "MONTHLY",
  "billingStartDate": "",
  "manualBillingDates": [],
  "reminderDaysBefore": 14,

  // Właściciele (istniejące)
  "backOfficeOwner": "",
  "energyAnalystOwner": ""
}
```

**Migracja:** `waterai_objects_v1` → dodać `totalArea`, `heatedArea`, `cooledArea`, `yearBuilt`, `description` (domyślnie `0`/`null`/`""`)

---

### 3. POMIARY — `waterai_measurements_v3` (NOWA TABELA — czyste dane źródłowe)

```json
{
  "id": 1720000000002,
  "createdAt": "...",
  "updatedAt": "...",

  "clientId": 1720000000000,
  "objectId": 1720000000001,

  // Okres
  "periodFrom": "2026-01-01",
  "periodTo": "2026-01-31",
  "periodDays": 31,
  "periodLabel": "Styczeń 2026",

  // Energia
  "heatConsumption": 0,                  // GJ/MWh
  "electricityConsumption": 0,           // kWh
  "gasConsumption": 0,                   // m³
  "oilConsumption": 0,                   // litrów
  "waterConsumption": 0,                 // m³
  "energyUnit": "GJ",
  "currency": "PLN",

  // Pogoda
  "hdd": 0,                              // Heating Degree Days
  "cdd": 0,                              // Cooling Degree Days
  "avgTemperature": null,                // °C średnia

  // Parametry obiektu w danym okresie
  "heatedArea": 0,
  "cooledArea": 0,
  "occupants": null,
  "beds": null,
  "students": null,
  "guests": null,

  // Eksploatacja
  "occupancyRate": null,                 // %
  "workHours": null,
  "productionVolume": null,
  "userCount": null,

  // Koszty
  "energyCost": 0,
  "unitPrice": 0,

  // Status i źródło
  "source": "MANUAL",                    // MANUAL | INVOICE | METER | EXCEL | CSV | PDF
  "notes": "",

  // Załączniki (referencje)
  "attachments": []                      // [{ name, type, url, uploadedAt }]
}
```

**Uwaga:** `waterai_measurements_v2` zawiera dane protokołów TYM (miesięczne tablice). Ta tabela to czyste pomiary. Protokoły TYM pozostają w `waterai_measurements_v2`.

---

### 4. ANALIZY — `waterai_analyses_v1` (NOWA)

```json
{
  "id": 1720000000003,
  "createdAt": "...",
  "updatedAt": "...",

  "clientId": 1720000000000,
  "objectId": 1720000000001,
  "measurementIds": [1720000000002],     // może bazować na wielu pomiarach

  // Metadata
  "name": "Analiza TYM – Styczeń 2026",
  "analysisType": "TYM",                 // TYM | REGRESSION | OCCUPANCY | AREA | VOLUME | SCHEDULE | CUSTOM
  "executedAt": "2026-02-01",
  "author": "Jan Nowak",
  "status": "DRAFT",                     // DRAFT | COMPLETE | APPROVED

  // Parametry wejściowe (zależne od typu)
  "inputParams": {
    "baseTemperature": 21,
    "weatherStation": "Warszawa-Okęcie",
    "tymData": []
  },

  // Wyniki
  "results": {
    "correctedConsumption": 0,
    "correctionFactor": 0,
    "savedEnergy": 0,
    "savedEnergyPct": 0,
    "savedMoney": 0,
    "details": {}
  },

  // Dane do wykresów
  "chartData": {},

  "comments": "",

  // Rozszerzalność: dowolny typ bez przebudowy
  "customFields": {}
}
```

---

### 5. PROTOKOŁY — `waterai_protocols_v1` (NOWA — oddzielone od protokołów TYM)

```json
{
  "id": 1720000000004,
  "createdAt": "...",
  "updatedAt": "...",
  "version": 1,

  "clientId": 1720000000000,
  "objectId": 1720000000001,
  "analysisIds": [1720000000003],        // z jakich analiz pochodzi

  // Numer i dane formalne
  "protocolNumber": "PROT/2026/001",
  "periodFrom": "2026-01-01",
  "periodTo": "2026-01-31",
  "method": "TYM",                       // TYM | REGRESSION | CUSTOM
  "preparedBy": "Jan Nowak",
  "approvedBy": "",

  // Wyniki (kopiowane z analiz — readonly)
  "results": {
    "savedEnergy": 0,
    "savedEnergyPct": 0,
    "savedMoney": 0
  },

  "comments": "",

  // Status dokumentu
  "status": "DRAFT",                     // DRAFT | FINAL | SIGNED | ARCHIVED

  // Historia wersji
  "history": [
    { "version": 1, "changedAt": "...", "changedBy": "...", "changes": "" }
  ],

  // Eksport
  "pdfUrl": "",
  "docxUrl": "",
  "attachments": []
}
```

---

### 6. DOKUMENTY — `waterai_documents_v1` (NOWA)

```json
{
  "id": 1720000000005,
  "createdAt": "...",
  "updatedAt": "...",

  // Powiązania
  "clientId": 1720000000000,
  "objectId": null,                      // null = dokument klienta, id = dokument obiektu

  // Dane dokumentu
  "name": "Faktura za ciepło 01/2026",
  "category": "INVOICE_ENERGY",          // INVOICE_HEAT | INVOICE_ELECTRICITY | INVOICE_GAS | INVOICE_WATER | CONTRACT_ENERGY | CONTRACT_HEAT | TECHNICAL_DOC | PHOTO | OTHER
  "subcategory": "",                     // np. "przed montażem", "po montażu"
  "documentDate": "2026-01-31",
  "description": "",
  "tags": [],

  // Plik
  "fileName": "faktura-styczen-2026.pdf",
  "fileType": "application/pdf",
  "fileSize": 0,
  "fileUrl": "",                         // localStorage: base64 | Supabase: Storage URL

  // Dla zdjęć
  "thumbnailUrl": "",

  "uploadedBy": ""
}
```

---

### 7. FAKTURY — `waterai_invoices_v1` (NOWA)

```json
{
  "id": 1720000000006,
  "createdAt": "...",
  "updatedAt": "...",

  "clientId": 1720000000000,
  "objectId": null,                      // może dotyczyć całego klienta lub konkretnego obiektu

  // Dane formalne
  "invoiceNumber": "FV/2026/001",
  "invoiceType": "INVOICE",             // INVOICE | CORRECTION | ADVANCE | ESCO_SETTLEMENT
  "issueDate": "2026-02-01",
  "dueDate": "2026-02-15",

  // Kwoty
  "netAmount": 0,
  "vatRate": 23,
  "vatAmount": 0,
  "grossAmount": 0,
  "currency": "PLN",

  // Powiązane dane ESCO
  "protocolIds": [],
  "savedEnergy": 0,
  "savedMoney": 0,
  "escoShare": 50,

  // Status płatności
  "status": "DRAFT",                    // DRAFT | ISSUED | PAID | PARTIAL | OVERDUE
  "paidAmount": 0,
  "paidAt": null,

  "notes": "",
  "attachments": []
}
```

---

### 8. KALENDARZ — `waterai_calendar_v1` (NOWA — rozbudowuje workflow)

```json
{
  "id": 1720000000007,
  "createdAt": "...",
  "updatedAt": "...",

  "clientId": 1720000000000,
  "objectId": null,

  "title": "Termin odczytu – Hotel Centrum",
  "description": "",
  "eventType": "MEASUREMENT_DUE",        // MEASUREMENT_DUE | NEXT_READING | ANALYSIS_DUE | PROTOCOL_DUE | ESCO_REPORT_DUE | INVOICE_DUE | PAYMENT_DUE | CONTRACT_EXPIRY | INSPECTION | SERVICE | REMINDER

  "dueDate": "2026-02-05",
  "reminderDays": [0, 1, 7, 30],        // powiadomienia: dziś, jutro, 7 dni, 30 dni

  "status": "PENDING",                   // PENDING | DONE | OVERDUE | CANCELLED
  "completedAt": null,
  "completedBy": "",

  // Cykliczność
  "recurrence": "MONTHLY",              // ONE_TIME | MONTHLY | BIMONTHLY | QUARTERLY | HALF_YEAR | YEARLY
  "recurrenceEndDate": null,

  // Odpowiedzialność
  "responsibleRole": "BACK_OFFICE",
  "responsiblePerson": "",

  // Powiązania
  "linkedDocumentId": null,
  "linkedInvoiceId": null,
  "linkedMeasurementId": null,
  "linkedProtocolId": null,

  // Integracja zewnętrzna (EspoCRM etc.)
  "externalSystem": "",
  "externalTaskId": "",
  "syncStatus": "NOT_SYNCED"
}
```

---

### 9. RAPORTY ESCO — `waterai_esco_reports_v1` (NOWA)

```json
{
  "id": 1720000000008,
  "createdAt": "...",
  "updatedAt": "...",

  "clientId": 1720000000000,
  "objectIds": [1720000000001],          // jeden lub wiele obiektów

  // Zakres raportu
  "reportNumber": "ESCO/2026/Q1/001",
  "periodFrom": "2026-01-01",
  "periodTo": "2026-03-31",
  "preparedBy": "Jan Nowak",
  "approvedBy": "",

  // Źródła danych
  "measurementIds": [],
  "analysisIds": [],
  "protocolIds": [],

  // Wyniki zagregowane
  "results": {
    "savedEnergyTotal": 0,
    "savedEnergyPct": 0,
    "savedMoneyTotal": 0,
    "co2ReductionKg": 0,
    "roi": 0,
    "escoShareAmount": 0,
    "clientShareAmount": 0
  },

  "status": "DRAFT",                     // DRAFT | FINAL | SIGNED

  // Eksport
  "pdfUrl": "",
  "excelUrl": "",

  "notes": ""
}
```

---

## PLAN MIGRACJI DANYCH

### Faza 1 — Rozbudowa istniejących (zachowanie kompatybilności)
1. `waterai_clients_v1` → `waterai_clients_v2`: dodanie `regon`, `status`, `cooperationStartDate`, `notes`
2. `waterai_objects_v1` → `waterai_objects_v2`: dodanie `totalArea`, `heatedArea`, `cooledArea`, `yearBuilt`, `description`
3. `waterai_measurements_v2` → bez zmian (protokoły TYM pozostają)

### Faza 2 — Nowe tabele
4. `waterai_measurements_v3` — czyste pomiary źródłowe
5. `waterai_analyses_v1` — analizy
6. `waterai_protocols_v1` — protokoły (formalne dokumenty)
7. `waterai_documents_v1` — magazyn dokumentów
8. `waterai_invoices_v1` — faktury
9. `waterai_calendar_v1` — kalendarz (zastępuje `waterai_workflow_v1`)
10. `waterai_esco_reports_v1` — raporty ESCO (oddzielne od inline raportów)

### Logika migracji (przy starcie aplikacji)
```javascript
function migrateData() {
  // v1 → v2 clients
  const oldClients = JSON.parse(localStorage.getItem('waterai_clients_v1') || '[]');
  if (oldClients.length && !localStorage.getItem('waterai_clients_v2')) {
    const migrated = oldClients.map(c => ({
      ...c,
      regon: c.regon || '',
      status: c.status || 'ACTIVE',
      cooperationStartDate: c.cooperationStartDate || '',
      notes: c.notes || ''
    }));
    localStorage.setItem('waterai_clients_v2', JSON.stringify(migrated));
  }

  // v1 → v2 objects
  const oldObjects = JSON.parse(localStorage.getItem('waterai_objects_v1') || '[]');
  if (oldObjects.length && !localStorage.getItem('waterai_objects_v2')) {
    const migrated = oldObjects.map(o => ({
      ...o,
      totalArea: o.totalArea || 0,
      heatedArea: o.heatedArea || 0,
      cooledArea: o.cooledArea || 0,
      yearBuilt: o.yearBuilt || null,
      description: o.description || ''
    }));
    localStorage.setItem('waterai_objects_v2', JSON.stringify(migrated));
  }
}
```

---

## ARCHITEKTURA MODUŁÓW JS (nowe pliki)

```
js/modules/
  clients.js         ← istniejący (rozbudować o v2)
  objects.js         ← istniejący (rozbudować o v2)
  measurements.js    ← istniejący (protokoły TYM - ZACHOWAĆ)
  workflow.js        ← istniejący (zastąpić calendar.js)
  analyses.js        ← NOWY
  protocols.js       ← NOWY (formalne dokumenty)
  documents.js       ← NOWY
  invoicing.js       ← NOWY
  calendar.js        ← NOWY (rozbudowuje workflow.js)
  esco-reports.js    ← NOWY (formalne raporty)
  migration.js       ← NOWY (jednorazowa migracja danych)
```

---

## PLAN INTERFEJSU

### Nowe zakładki w module Klienci
- Dane podstawowe (rozbudowane o REGON, status, datę współpracy, notatki)
- Obiekty
- Dokumenty
- Faktury
- Raporty ESCO
- Kalendarz

### Nowe zakładki w module Obiekty
- Informacje (rozbudowane o powierzchnie, rok budowy, opis)
- Pomiary (nowe — czyste pomiary z importem)
- Analizy (nowe)
- Protokoły (formalne dokumenty)
- Dokumenty
- Zdjęcia

### Nowe moduły w menu
| Ikona | Moduł | Role |
|---|---|---|
| 📐 | Analizy | Super Admin, Energy Analyst |
| 📋 | Protokoły | Super Admin, Back Office, Energy Analyst |
| 🗂️ | Dokumenty | Super Admin, Back Office |
| 🧾 | Faktury | Super Admin, Back Office |
| 📅 | Kalendarz | Wszystkie role |
| 📈 | Raporty ESCO | Wszystkie role |

---

## PRZYGOTOWANIE POD NEXT.JS + SUPABASE

### Mapowanie localStorage → Supabase tabele

| localStorage key | Tabela Supabase | RLS Policy |
|---|---|---|
| `waterai_clients_v2` | `clients` | user_id, org_id |
| `waterai_objects_v2` | `objects` | client_id |
| `waterai_measurements_v2` | `tym_protocols` | object_id |
| `waterai_measurements_v3` | `measurements` | object_id |
| `waterai_analyses_v1` | `analyses` | object_id |
| `waterai_protocols_v1` | `protocols` | analysis_id |
| `waterai_documents_v1` | `documents` + `storage` | client_id, object_id |
| `waterai_invoices_v1` | `invoices` | client_id |
| `waterai_calendar_v1` | `calendar_events` | client_id |
| `waterai_esco_reports_v1` | `esco_reports` | client_id |

### Wzorzec API-ready (każdy moduł)
```javascript
const AnalysesModule = {
  storageKey: "waterai_analyses_v1",

  // Metody CRUD identyczne z przyszłym API
  getAll() { /* localStorage lub fetch('/api/analyses') */ },
  add(item) { /* localStorage lub POST('/api/analyses') */ },
  update(id, item) { /* localStorage lub PATCH('/api/analyses/:id') */ },
  remove(id) { /* localStorage lub DELETE('/api/analyses/:id') */ },
  findByObject(objectId) { /* filter lub GET('/api/analyses?objectId=') */ },
  findByMeasurement(measurementId) { /* filter lub GET */ }
};
```

Taka architektura pozwala podmienić implementację CRUD z localStorage na fetch() bez zmiany reszty kodu.

---

## NOWE MODUŁY JS DO IMPLEMENTACJI

Po zatwierdzeniu planu zostaną stworzone następujące pliki:

1. **`js/modules/migration.js`** — migracja danych przy starcie
2. **`js/modules/clients-v2.js`** — rozbudowany moduł klientów
3. **`js/modules/objects-v2.js`** — rozbudowany moduł obiektów
4. **`js/modules/raw-measurements.js`** — czyste pomiary (nowe)
5. **`js/modules/analyses.js`** — analizy z rozszerzalnym systemem typów
6. **`js/modules/documents.js`** — magazyn dokumentów
7. **`js/modules/invoicing.js`** — fakturowanie
8. **`js/modules/calendar.js`** — pełny kalendarz z widokami
9. **`js/modules/esco-reports.js`** — formalne raporty ESCO

---

*Plan przygotowany dla WaterAI Energy Control v2.0*
*Kompatybilny z: localStorage (teraz) → Next.js + Supabase (przyszłość)*

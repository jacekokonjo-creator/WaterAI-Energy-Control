// WaterAI Energy Control
// Main Application v1.0.0

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getClients() {
  return ClientsModule.getAll();
}

function getObjects() {
  return ObjectsModule.getAll();
}

function getClientName(clientId) {
  const client = ClientsModule.find(Number(clientId));
  return client ? client.name : "Nieznany klient";
}

function createClient(form) {
  const contacts = [];

  document.querySelectorAll(".contact-row").forEach(row => {
    const name = row.querySelector("[name='contactName']").value.trim();
    const role = row.querySelector("[name='contactRole']").value.trim();
    const email = row.querySelector("[name='contactEmail']").value.trim();
    const phone = row.querySelector("[name='contactPhone']").value.trim();

    if (name || role || email || phone) {
      contacts.push({ name, role, email, phone });
    }
  });

  ClientsModule.add({
    name: form.name.value.trim(),
     vatId: form.vatId.value.trim(),
    country: form.country.value,
    language: form.language.value,
    postalCode: form.postalCode.value.trim(),
    city: form.city.value.trim(),
    street: form.street.value.trim(),
    buildingNumber: form.buildingNumber.value.trim(),
    apartmentNumber: form.apartmentNumber.value.trim(),
    googleMapsUrl: form.googleMapsUrl.value.trim(),
    invoiceEmail: form.invoiceEmail.value.trim(),
    paymentDays: Number(form.paymentDays.value),
    settlementModel: form.settlementModel.value,
    escoShare: Number(form.escoShare.value),
    contacts,
  });

  form.reset();
  renderClientsList();
}

function deleteClient(id) {
  if (!confirm("Czy na pewno usunąć klienta?")) return;
  ClientsModule.remove(id);
  renderClientsList();
}

function addContactRow() {
  const container = document.getElementById("contacts-container");
  if (!container) return;

  const row = document.createElement("div");
  row.className = "contact-row calendar-form";
  row.style.gridColumn = "1 / -1";
  row.style.marginTop = "10px";

  row.innerHTML = `
    <div>
      <label>Osoba kontaktowa</label>
      <input name="contactName" type="text" placeholder="Imię i nazwisko" />
    </div>

    <div>
      <label>Funkcja</label>
      <input name="contactRole" type="text" placeholder="np. Księgowość / Techniczny" />
    </div>

    <div>
      <label>Email</label>
      <input name="contactEmail" type="email" />
    </div>

    <div>
      <label>Telefon</label>
      <input name="contactPhone" type="text" />
    </div>
  `;

  container.appendChild(row);
}

function renderClientsList() {
  const container = document.getElementById("clients-list");
  if (!container) return;

  const clients = getClients();

  if (clients.length === 0) {
    container.innerHTML = `<p>Brak klientów. Dodaj pierwszego klienta.</p>`;
    return;
  }

  container.innerHTML = clients.map(client => `
    <div class="reminder-card">
      <strong>${escapeHtml(client.name)}</strong>

      <div class="reminder-meta">
        VAT ID: ${escapeHtml(client.vatId)}<br />
        Kraj: ${escapeHtml(client.country)}<br />
        Język: ${escapeHtml(client.language)}<br />
        Adres: ${escapeHtml(client.postalCode)} ${escapeHtml(client.city)}, 
        ${escapeHtml(client.street)} ${escapeHtml(client.buildingNumber)}
        ${client.apartmentNumber ? "/" + escapeHtml(client.apartmentNumber) : ""}<br />
        Google Maps: ${
          client.googleMapsUrl
            ? `<a href="${escapeHtml(client.googleMapsUrl)}" target="_blank">Otwórz lokalizację</a>`
            : "brak"
        }<br />
        Email FV: ${escapeHtml(client.invoiceEmail)}<br />
        Termin płatności: ${escapeHtml(client.paymentDays)} dni<br />
        Model rozliczeń: ${escapeHtml(client.settlementModel)}<br />
        Udział WaterAI: ${escapeHtml(client.escoShare)}%<br />
      </div>

      <div class="reminder-meta" style="margin-top: 12px;">
        <strong>Kontakty:</strong><br />
        ${
          client.contacts && client.contacts.length
            ? client.contacts.map(contact => `
                ${escapeHtml(contact.name)} — ${escapeHtml(contact.role)}<br />
                ${escapeHtml(contact.email)} | ${escapeHtml(contact.phone)}<br />
              `).join("")
            : "brak"
        }
      </div>

      <div style="margin-top: 12px;">
        <button class="small-button" onclick="deleteClient(${client.id})">Usuń</button>
      </div>
    </div>
  `).join("");
}

function createObject(form) {
  ObjectsModule.add({
    clientId: form.clientId.value,
    name: form.name.value.trim(),
    objectType: form.objectType.value,
    status: form.status.value,

    country: form.country.value,
    postalCode: form.postalCode.value.trim(),
    city: form.city.value.trim(),
    street: form.street.value.trim(),
    buildingNumber: form.buildingNumber.value.trim(),
    apartmentNumber: form.apartmentNumber.value.trim(),
    googleMapsUrl: form.googleMapsUrl.value.trim(),

    heatedArea: Number(form.heatedArea.value),
    volume: Number(form.volume.value),
    constructionYear: Number(form.constructionYear.value),
    usersCount: Number(form.usersCount.value),

   billingCycle: form.billingCycle.value,
   billingStartDate: form.billingStartDate.value,
   manualBillingDates: getManualBillingDates(),
   reminderDaysBefore: Number(form.reminderDaysBefore.value),

    backOfficeOwner: form.backOfficeOwner.value.trim(),
    energyAnalystOwner: form.energyAnalystOwner.value.trim(),

    heatSources: []
  });

  form.reset();
  renderObjectsModule();
}

function deleteObject(id) {
  if (!confirm("Czy na pewno usunąć obiekt?")) return;
  ObjectsModule.remove(id);
  renderObjectsModule();
}

function renderObjectsModule() {
  const container = document.getElementById("module-content");
  if (!container) return;

  const clients = getClients();

  if (clients.length === 0) {
    container.innerHTML = `
      <div class="reminder-card">
        <strong>Najpierw dodaj klienta</strong>
        <div class="reminder-meta">
          Obiekt musi być przypisany do klienta. Wejdź w moduł Klienci i dodaj pierwszego klienta.
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <form onsubmit="createObject(this); return false;" class="calendar-form">
      <div style="grid-column: 1 / -1;">
        <h3>Dane podstawowe obiektu</h3>
      </div>

      <div>
        <label>Klient</label>
        <select name="clientId" required>
          ${clients.map(client => `
            <option value="${client.id}">${escapeHtml(client.name)}</option>
          `).join("")}
        </select>
      </div>

      <div>
        <label>Nazwa obiektu</label>
        <input name="name" required placeholder="np. Hotel Warszawa" />
      </div>

      <div>
        <label>Typ obiektu</label>
        <select name="objectType">
          <option value="HOTEL">Hotel</option>
          <option value="SCHOOL">Szkoła</option>
          <option value="KINDERGARTEN">Przedszkole</option>
          <option value="OFFICE">Urząd / administracja</option>
          <option value="HOUSING_COMMUNITY">Wspólnota mieszkaniowa</option>
          <option value="COOPERATIVE">Spółdzielnia</option>
          <option value="INDUSTRY">Zakład przemysłowy</option>
          <option value="OFFICE_BUILDING">Biurowiec</option>
          <option value="HOSPITAL">Szpital</option>
          <option value="OTHER">Inne</option>
        </select>
      </div>

      <div>
        <label>Status obiektu</label>
        <select name="status">
          <option value="IMPLEMENTATION">Wdrożenie</option>
          <option value="ACTIVE">Aktywny</option>
          <option value="PAUSED">Wstrzymany</option>
          <option value="FINISHED">Zakończony</option>
        </select>
      </div>

      <div style="grid-column: 1 / -1;">
        <h3>Adres obiektu</h3>
      </div>

      <div>
        <label>Kraj</label>
        <select name="country">
          <option value="PL">Polska</option>
          <option value="CZ">Czechy</option>
          <option value="SK">Słowacja</option>
          <option value="AT">Austria</option>
          <option value="DE">Niemcy</option>
          <option value="GB">Anglia</option>
        </select>
      </div>

      <div>
        <label>Kod pocztowy</label>
        <input name="postalCode" placeholder="np. 00-001" />
      </div>

      <div>
        <label>Miasto</label>
        <input name="city" placeholder="np. Warszawa" />
      </div>

      <div>
        <label>Ulica</label>
        <input name="street" placeholder="np. Prosta" />
      </div>

      <div>
        <label>Nr budynku</label>
        <input name="buildingNumber" placeholder="np. 10" />
      </div>

      <div>
        <label>Nr lokalu</label>
        <input name="apartmentNumber" placeholder="opcjonalnie" />
      </div>

      <div style="grid-column: 1 / -1;">
        <label>Google Maps URL</label>
        <input name="googleMapsUrl" type="url" placeholder="https://maps.google.com/..." />
      </div>

      <div style="grid-column: 1 / -1;">
        <h3>Parametry budynku</h3>
      </div>

      <div>
        <label>Powierzchnia ogrzewana [m²]</label>
        <input name="heatedArea" type="number" min="0" step="0.01" />
      </div>

      <div>
        <label>Kubatura [m³]</label>
        <input name="volume" type="number" min="0" step="0.01" />
      </div>

      <div>
        <label>Rok budowy</label>
        <input name="constructionYear" type="number" min="1800" max="2100" />
      </div>

      <div>
        <label>Liczba użytkowników</label>
        <input name="usersCount" type="number" min="0" />
      </div>

      <div style="grid-column: 1 / -1;">
        <h3>Rozliczenia i opiekunowie</h3>
      </div>

     <div>
  <label>Cykl rozliczeniowy</label>
  <select name="billingCycle" id="billingCycle" onchange="toggleBillingFields()">
    <option value="MONTHLY">Miesięczny</option>
    <option value="TWO_MONTHS">Co 2 miesiące</option>
    <option value="QUARTERLY">Kwartalny</option>
    <option value="HALF_YEAR">Półroczny</option>
    <option value="YEARLY">Roczny</option>
    <option value="MANUAL_DATES">Wg wskazanych dat</option>
  </select>
</div>

<div id="billingStartDateContainer">
  <label>Data pierwszego rozliczenia</label>
  <input name="billingStartDate" type="date" />
</div>

<div id="manualDatesContainer" style="display:none;">
  <label>Daty rozliczeń</label>

  <div id="manualDatesList"></div>

  <button
    type="button"
    class="small-button"
    onclick="addManualBillingDate()">
    Dodaj datę
  </button>
</div>

<div>
  <label>Przypomnij przed terminem (dni)</label>
  <input
    name="reminderDaysBefore"
    type="number"
    min="0"
    value="14"
  />
</div>

      <div>
        <label>Data od</label>
        <input name="customPeriodFrom" type="date" />
      </div>

      <div>
        <label>Data do</label>
        <input name="customPeriodTo" type="date" />
      </div>

      <div>
        <label>Opiekun Back Office</label>
        <input name="backOfficeOwner" placeholder="np. Anna Kowalska" />
      </div>

      <div>
        <label>Opiekun Energy Analyst</label>
        <input name="energyAnalystOwner" placeholder="np. Petr Novak" />
      </div>

      <div class="calendar-actions">
        <button class="primary-button" type="submit">Dodaj obiekt</button>
      </div>
    </form>

    <div id="objects-list"></div>
  `;

  renderObjectsList();
}

function renderObjectsList() {
  const container = document.getElementById("objects-list");
  if (!container) return;

  const objects = getObjects();

  if (objects.length === 0) {
    container.innerHTML = `<p>Brak obiektów. Dodaj pierwszy obiekt dla wybranego klienta.</p>`;
    return;
  }

  container.innerHTML = objects.map(object => `
    <div class="reminder-card">
      <strong>${escapeHtml(object.name)}</strong>

      <div class="reminder-meta">
        Klient: ${escapeHtml(getClientName(object.clientId))}<br />
        Typ obiektu: ${escapeHtml(object.objectType)}<br />
        Status: ${escapeHtml(object.status)}<br />
        Adres: ${escapeHtml(object.postalCode)} ${escapeHtml(object.city)}, 
        ${escapeHtml(object.street)} ${escapeHtml(object.buildingNumber)}
        ${object.apartmentNumber ? "/" + escapeHtml(object.apartmentNumber) : ""}<br />
        Google Maps: ${
          object.googleMapsUrl
            ? `<a href="${escapeHtml(object.googleMapsUrl)}" target="_blank">Otwórz lokalizację</a>`
            : "brak"
        }<br />
        Powierzchnia ogrzewana: ${escapeHtml(object.heatedArea)} m²<br />
        Kubatura: ${escapeHtml(object.volume)} m³<br />
        Rok budowy: ${escapeHtml(object.constructionYear)}<br />
        Liczba użytkowników: ${escapeHtml(object.usersCount)}<br />
        Cykl rozliczeniowy: ${escapeHtml(object.billingCycle)}<br />
        Okres własny: ${escapeHtml(object.customPeriodFrom)} - ${escapeHtml(object.customPeriodTo)}<br />
        Back Office: ${escapeHtml(object.backOfficeOwner)}<br />
        Energy Analyst: ${escapeHtml(object.energyAnalystOwner)}
      </div>

      <div style="margin-top: 12px;">
        <button class="small-button" onclick="deleteObject(${object.id})">Usuń</button>
      </div>
    </div>
  `).join("");
}
function getWorkflowItems() {
  return WorkflowModule.getAll();
}

function getObjectName(objectId) {
  const object = ObjectsModule.find(Number(objectId));
  return object ? object.name : "Nieznany obiekt";
}

function createWorkflowItem(form) {
  WorkflowModule.add({
    clientId: form.clientId.value,
    objectId: form.objectId.value,
    title: form.title.value.trim(),
    description: form.description.value.trim(),
    taskType: form.taskType.value,
    responsibleRole: form.responsibleRole.value,
    priority: form.priority.value,
    status: form.status.value,
    scheduleType: form.scheduleType.value,
    firstReminderDate: form.firstReminderDate.value,
    dueDate: form.dueDate.value,
    documentRequired: form.documentRequired.checked
  });

  form.reset();
  renderWorkflowModule();
}

function deleteWorkflowItem(id) {
  if (!confirm("Czy na pewno usunąć zadanie workflow?")) return;
  WorkflowModule.remove(id);
  renderWorkflowModule();
}

function markWorkflowDone(id) {
  WorkflowModule.markDone(id);
  renderWorkflowModule();
}

function renderWorkflowModule() {
  const container = document.getElementById("module-content");
  if (!container) return;

  const clients = getClients();
  const objects = getObjects();

  if (clients.length === 0 || objects.length === 0) {
    container.innerHTML = `
      <div class="reminder-card">
        <strong>Najpierw dodaj klienta i obiekt</strong>
        <div class="reminder-meta">
          Workflow musi być przypisany do konkretnego obiektu.
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <form onsubmit="createWorkflowItem(this); return false;" class="calendar-form">
      <div style="grid-column: 1 / -1;">
        <h3>Workflow / Przypomnienie</h3>
      </div>

      <div>
        <label>Klient</label>
        <select name="clientId" required>
          ${clients.map(client => `
            <option value="${client.id}">${escapeHtml(client.name)}</option>
          `).join("")}
        </select>
      </div>

      <div>
        <label>Obiekt</label>
        <select name="objectId" required>
          ${objects.map(object => `
            <option value="${object.id}">${escapeHtml(getClientName(object.clientId))} — ${escapeHtml(object.name)}</option>
          `).join("")}
        </select>
      </div>

      <div>
        <label>Tytuł zadania</label>
        <input name="title" required placeholder="np. Poproś klienta o FV za energię" />
      </div>

      <div>
        <label>Typ zadania</label>
        <select name="taskType">
          <option value="REQUEST_INVOICE">Pobierz FV od klienta</option>
          <option value="ENTER_INVOICE">Wprowadź FV</option>
          <option value="VERIFY_INVOICE">Zweryfikuj FV</option>
          <option value="GENERATE_REPORT">Wygeneruj raport</option>
          <option value="PREPARE_ESCO_INVOICE">Przygotuj FV ESCO</option>
          <option value="SEND_REPORT">Wyślij raport</option>
          <option value="INSTALLATION">Montaż</option>
          <option value="SERVICE">Serwis</option>
          <option value="DATA_CHECK">Kontrola danych</option>
          <option value="OTHER">Inne</option>
        </select>
      </div>

      <div>
        <label>Rola odpowiedzialna</label>
        <select name="responsibleRole">
          <option value="BACK_OFFICE">Back Office</option>
          <option value="ENERGY_ANALYST">Energy Analyst</option>
          <option value="CLIENT">Client</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>
      </div>

      <div>
        <label>Priorytet</label>
        <select name="priority">
          <option value="LOW">Niski</option>
          <option value="NORMAL" selected>Normalny</option>
          <option value="HIGH">Wysoki</option>
          <option value="CRITICAL">Krytyczny</option>
        </select>
      </div>

      <div>
        <label>Status</label>
        <select name="status">
          <option value="NEW">Nowe</option>
          <option value="IN_PROGRESS">W trakcie</option>
          <option value="WAITING">Oczekuje</option>
          <option value="DONE">Wykonane</option>
          <option value="CANCELLED">Anulowane</option>
        </select>
      </div>

      <div>
        <label>Harmonogram</label>
        <select name="scheduleType">
          <option value="ONE_TIME">Jednorazowo</option>
          <option value="MONTHLY">Miesięcznie</option>
          <option value="TWO_MONTHS">Co 2 miesiące</option>
          <option value="QUARTERLY">Kwartalnie</option>
          <option value="HALF_YEAR">Półrocznie</option>
          <option value="YEARLY">Rocznie</option>
          <option value="SEASONAL">Sezonowo</option>
          <option value="CUSTOM_DATE_RANGE">Od daty do daty</option>
        </select>
      </div>

      <div>
        <label>Data pierwszego przypomnienia</label>
        <input name="firstReminderDate" type="date" />
      </div>

      <div>
        <label>Termin wykonania</label>
        <input name="dueDate" type="date" />
      </div>

      <div style="grid-column: 1 / -1;">
        <label>Opis</label>
        <input name="description" placeholder="Dodatkowe informacje do zadania" />
      </div>

      <div style="grid-column: 1 / -1;">
        <label>
          <input name="documentRequired" type="checkbox" style="width:auto;" />
          Wymagany dokument
        </label>
      </div>

      <div class="calendar-actions">
        <button class="primary-button" type="submit">Dodaj zadanie workflow</button>
      </div>
    </form>

    <div id="workflow-list"></div>
  `;

  renderWorkflowList();
}

function renderWorkflowList() {
  const container = document.getElementById("workflow-list");
  if (!container) return;

  const items = getWorkflowItems();

  if (items.length === 0) {
    container.innerHTML = `<p>Brak zadań workflow. Dodaj pierwsze przypomnienie.</p>`;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="reminder-card">
      <strong>${escapeHtml(item.title)}</strong>

      <div class="reminder-meta">
        Klient: ${escapeHtml(getClientName(item.clientId))}<br />
        Obiekt: ${escapeHtml(getObjectName(item.objectId))}<br />
        Typ: ${escapeHtml(item.taskType)}<br />
        Rola: ${escapeHtml(item.responsibleRole)}<br />
        Priorytet: ${escapeHtml(item.priority)}<br />
        Status: ${escapeHtml(item.status)}<br />
        Harmonogram: ${escapeHtml(item.scheduleType)}<br />
        Pierwsze przypomnienie: ${escapeHtml(item.firstReminderDate)}<br />
        Termin: ${escapeHtml(item.dueDate)}<br />
        Dokument wymagany: ${item.documentRequired ? "TAK" : "NIE"}<br />
        EspoCRM sync: ${escapeHtml(item.syncStatus)}
      </div>

      <div style="margin-top: 12px;">
        <button class="small-button" onclick="markWorkflowDone(${item.id})">Oznacz jako wykonane</button>
        <button class="small-button" onclick="deleteWorkflowItem(${item.id})">Usuń</button>
      </div>
    </div>
  `).join("");
}
function toggleBillingFields() {
  const cycle = document.getElementById("billingCycle")?.value;

  const manual = document.getElementById("manualDatesContainer");
  const start = document.getElementById("billingStartDateContainer");

  if (!manual || !start) return;

  if (cycle === "MANUAL_DATES") {
    manual.style.display = "block";
    start.style.display = "none";
  } else {
    manual.style.display = "none";
    start.style.display = "block";
  }
}

function addManualBillingDate() {
  const container = document.getElementById("manualDatesList");
  if (!container) return;

  const row = document.createElement("div");

  row.innerHTML = `
    <input
      type="date"
      class="manual-billing-date"
      style="margin-top:8px;"
    />
  `;

  container.appendChild(row);
}

function getManualBillingDates() {
  return Array.from(
    document.querySelectorAll(".manual-billing-date")
  ).map(item => item.value).filter(Boolean);
}

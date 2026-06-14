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

  const clientData = {
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
    contacts
  };

  if (editingClientId) {
    ClientsModule.update(editingClientId, clientData);
    editingClientId = null;
  } else {
    ClientsModule.add(clientData);
  }

  form.reset();

  const submitButton = form.querySelector("button[type='submit']");
  if (submitButton) {
    submitButton.textContent = "Dodaj klienta";
  }

  renderClientsList();
}
let editingClientId = null;
let editingObjectId = null;

function editClient(id) {
  const client = ClientsModule.find(id);

  if (!client) return;

  editingClientId = id;

  const form = document.querySelector(
    "#module-content form"
  );

  if (!form) return;

  form.name.value = client.name || "";
  form.vatId.value = client.vatId || "";
  form.country.value = client.country || "PL";
  form.language.value = client.language || "pl";

  form.postalCode.value = client.postalCode || "";
  form.city.value = client.city || "";
  form.street.value = client.street || "";
  form.buildingNumber.value = client.buildingNumber || "";
  form.apartmentNumber.value = client.apartmentNumber || "";
  form.googleMapsUrl.value = client.googleMapsUrl || "";

  form.invoiceEmail.value = client.invoiceEmail || "";
  form.paymentDays.value = client.paymentDays || 14;
  form.settlementModel.value = client.settlementModel || "ESCO";
  form.escoShare.value = client.escoShare || 50;

  const contactsContainer =
    document.getElementById("contacts-container");

  if (contactsContainer) {
    contactsContainer.innerHTML = "";
  }

  if (client.contacts && client.contacts.length) {
    client.contacts.forEach(contact => {
      addContactRow();

      const rows =
        document.querySelectorAll(".contact-row");

      const row = rows[rows.length - 1];

      row.querySelector("[name='contactName']").value =
        contact.name || "";

      row.querySelector("[name='contactRole']").value =
        contact.role || "";

      row.querySelector("[name='contactEmail']").value =
        contact.email || "";

      row.querySelector("[name='contactPhone']").value =
        contact.phone || "";
    });
  } else {
    addContactRow();
  }

  const submitButton =
    form.querySelector("button[type='submit']");

  if (submitButton) {
    submitButton.textContent = "Zapisz zmiany";
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
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
       <button
  class="small-button"
  onclick="editClient(${client.id})">
  Edytuj
</button>

<button
  class="small-button"
  onclick="deleteClient(${client.id})">
  Usuń
</button>
      </div>
    </div>
  `).join("");
}

function createObject(form) {
  console.log("editingObjectId =", editingObjectId);
  const objectData = {
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

    heatingSourceCO: form.heatingSourceCO
      ? form.heatingSourceCO.value
      : "NONE",

    heatingSourceCWU: form.heatingSourceCWU
      ? form.heatingSourceCWU.value
      : "NONE",

    heatConsumptionReading: form.heatConsumptionReading
      ? form.heatConsumptionReading.value
      : "INVOICE",

    heatConsumptionReadingDetails: form.heatConsumptionReadingDetails
      ? form.heatConsumptionReadingDetails.value.trim()
      : "",

    billingCycle: form.billingCycle.value,

    billingStartDate: form.billingStartDate
      ? form.billingStartDate.value
      : "",

    manualBillingDates:
      typeof getManualBillingDates === "function"
        ? getManualBillingDates()
        : [],

   reminderDaysBefore: form.reminderDaysBefore
      ? Number(form.reminderDaysBefore.value)
      : 14,

    backOfficeOwner: form.backOfficeOwner.value.trim(),
    energyAnalystOwner: form.energyAnalystOwner.value.trim()
  };

  console.log("TRYB EDYCJI?", !!editingObjectId);

  if (editingObjectId) {
    console.log("UPDATE", editingObjectId);
    ObjectsModule.update(editingObjectId, objectData);
    editingObjectId = null;
  } else {
    console.log("ADD");
    ObjectsModule.add(objectData);
  }

  form.reset();

  const submitButton = form.querySelector("button[type='submit']");
  if (submitButton) {
    submitButton.textContent = "Dodaj obiekt";
  }

  if (typeof renderObjectsModule === "function") {
    renderObjectsModule();
  }
}

function editObject(id) {
  const object = ObjectsModule.find(id);
  if (!object) return;

  editingObjectId = id;

  const form = document.querySelector("#module-content form");
  if (!form) return;

  form.clientId.value = object.clientId || "";
  form.name.value = object.name || "";
  form.objectType.value = object.objectType || "HOTEL";
  form.status.value = object.status || "IMPLEMENTATION";

  form.country.value = object.country || "PL";
  form.postalCode.value = object.postalCode || "";
  form.city.value = object.city || "";
  form.street.value = object.street || "";
  form.buildingNumber.value = object.buildingNumber || "";
  form.apartmentNumber.value = object.apartmentNumber || "";
  form.googleMapsUrl.value = object.googleMapsUrl || "";

  form.heatingSourceCO.value = object.heatingSourceCO || "NONE";
  form.heatingSourceCWU.value = object.heatingSourceCWU || "NONE";
  form.heatConsumptionReading.value = object.heatConsumptionReading || "INVOICE";
  form.heatConsumptionReadingDetails.value = object.heatConsumptionReadingDetails || "";

  form.billingCycle.value = object.billingCycle || "MONTHLY";
  toggleBillingFields();

  if (form.billingStartDate) {
    form.billingStartDate.value = object.billingStartDate || "";
  }

  if (form.reminderDaysBefore) {
    form.reminderDaysBefore.value = object.reminderDaysBefore || 14;
  }

  form.backOfficeOwner.value = object.backOfficeOwner || "";
  form.energyAnalystOwner.value = object.energyAnalystOwner || "";

  const submitButton = form.querySelector("button[type='submit']");
  if (submitButton) {
    submitButton.textContent = "Zapisz zmiany";
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
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

<div style="grid-column: 1 / -1;">
  <h3>System grzewczy</h3>
</div>

<div>
  <label>Źródło ciepła</label>

 <select name="heatingSourceCO">
    <option value="NONE">Brak</option>
    <option value="HEAT_PUMP">Pompa ciepła</option>
    <option value="HEAT_RECOVERY">Ciepło z odzysku</option>
    <option value="SOLID_FUEL_BOILER">Kocioł na paliwo stałe</option>
    <option value="OIL_BOILER">Kocioł olejowy</option>
    <option value="GAS_BOILER">Kocioł gazowy</option>
    <option value="BIOMASS">Inna biomasa</option>
    <option value="PELLET_BOILER">Kocioł na pellet</option>
    <option value="DISTRICT_HEATING">Sieć ciepłownicza</option>
    <option value="SOLAR_HEATING">Słoneczne systemy grzewcze</option>
    <option value="ELECTRIC_HEATING">Ogrzewanie elektryczne</option>
  </select>
</div>

<div>
  <label>Źródło ciepła C.W.U.</label>
  <select name="heatingSourceCWU">
    <option value="NONE">Brak</option>
    <option value="HEAT_PUMP">Pompa ciepła</option>
    <option value="HEAT_RECOVERY">Ciepło z odzysku</option>
    <option value="SOLID_FUEL_BOILER">Kocioł na paliwo stałe</option>
    <option value="OIL_BOILER">Kocioł olejowy</option>
    <option value="GAS_BOILER">Kocioł gazowy</option>
    <option value="BIOMASS">Inna biomasa</option>
    <option value="PELLET_BOILER">Kocioł na pellet</option>
    <option value="DISTRICT_HEATING">Sieć ciepłownicza</option>
    <option value="SOLAR_HEATING">Słoneczne systemy grzewcze</option>
    <option value="ELECTRIC_HEATING">Ogrzewanie elektryczne</option>
  </select>
</div>
<div>
  <label>Odczyt zużycia ciepła</label>

  <select name="heatConsumptionReading">
    <option value="ONLINE">On-line</option>
    <option value="CLIENT">Podawany przez Klienta</option>
    <option value="WATERAI">Wykonywany przez WAI</option>
    <option value="INVOICE">Z FV</option>
  </select>
</div>

<div style="grid-column: 1 / -1;">
  <label>Szczegóły odczytu</label>

  <input
    name="heatConsumptionReadingDetails"
    placeholder="np. SUPLA, Modbus TCP, licznik Kamstrup, aplikacja dostawcy ciepła..."
    />
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
        Źródło ciepła C.O.: ${escapeHtml(object.heatingSourceCO)}<br />
        Źródło ciepła C.W.U.: ${escapeHtml(object.heatingSourceCWU)}<br />
        Odczyt zużycia: ${escapeHtml(object.heatConsumptionReading)}<br />
        Szczegóły odczytu:
        ${escapeHtml(object.heatConsumptionReadingDetails)}<br />
        Cykl rozliczeniowy: ${escapeHtml(object.billingCycle)}<br />
        Back Office: ${escapeHtml(object.backOfficeOwner)}<br />
        Energy Analyst: ${escapeHtml(object.energyAnalystOwner)}
      </div>

      <div style="margin-top: 12px;">
       <button class="small-button" onclick="openObjectMeasurements(${object.id})">Pomiary</button>
       <button class="small-button" onclick="editObject(${object.id})">Edytuj</button>
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
  <select name="clientId" required onchange="updateWorkflowObjectOptions(this.value)">
    ${clients.map(client => `
      <option value="${client.id}">${escapeHtml(client.name)}</option>
    `).join("")}
  </select>
</div>

<div>
  <label>Obiekt</label>
  <select name="objectId" id="workflow-object-select" required>
    ${ObjectsModule.findByClient(clients[0].id).map(object => `
      <option value="${object.id}">${escapeHtml(object.name)}</option>
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

function updateWorkflowObjectOptions(clientId) {
  const select = document.getElementById("workflow-object-select");
  if (!select) return;

  const objects = ObjectsModule.findByClient(Number(clientId));

  if (objects.length === 0) {
    select.innerHTML = `<option value="">Brak obiektów dla tego klienta</option>`;
    return;
  }

  select.innerHTML = objects.map(object => `
    <option value="${object.id}">${escapeHtml(object.name)}</option>
  `).join("");
}

// ─────────────────────────────────────────────
// Measurements / Pomiary / Protokół ESCO
// ─────────────────────────────────────────────

let editingMeasurementId = null;
let selectedMeasurementObjectId = null;

const MONTHS_PL = [
"Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
"Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
];

function getMeasurements() {
return MeasurementsModule.getAll();
}

function getDaysInMonth(month, year) {
return new Date(year, month, 0).getDate();
}

function openObjectMeasurements(objectId) {
selectedMeasurementObjectId = Number(objectId);
openModule("measurements");
}

function updateMeasurementObjectOptions(clientId) {
const select = document.getElementById("measurement-object-select");
if (!select) return;

const objects = ObjectsModule.findByClient(Number(clientId));

if (objects.length === 0) {
selectedMeasurementObjectId = null;
select.innerHTML = `<option value="">Brak obiektów dla tego klienta</option>`;
renderMeasurementsList();
return;
}

selectedMeasurementObjectId = Number(objects[0].id);

select.innerHTML = objects.map(object => `     <option value="${object.id}">
      ${escapeHtml(object.name || "Obiekt bez nazwy")}     </option>
  `).join("");

select.value = String(selectedMeasurementObjectId);
renderMeasurementsList();
}

function buildTymMonthlyFromForm(form) {
return MONTHS_PL.map((monthName, index) => {
const month = index + 1;

```
return {
  month,
  monthName,
  temperature: Number(form[`tymTemp_${month}`]?.value || 0),
  days: Number(form[`tymDays_${month}`]?.value || 0)
};
```

});
}

function createMeasurement(form) {
const object = ObjectsModule.find(Number(form.objectId.value));

if (!object) {
alert("Wybierz obiekt dla protokołu.");
return;
}

const billingStart = Number(form.billingPeriodStartReading.value || 0);
const billingEnd = Number(form.billingPeriodEndReading.value || 0);
const comparisonStart = Number(form.comparisonPeriodStartReading.value || 0);
const comparisonEnd = Number(form.comparisonPeriodEndReading.value || 0);

const protocolData = {
clientId: object.clientId,
objectId: form.objectId.value,

```
weatherStation: form.weatherStation.value.trim(),
energyAnalystOwner: form.energyAnalystOwner.value.trim(),
protocolDate: form.protocolDate.value,

billingPeriodStartDate: form.billingPeriodStartDate.value,
billingPeriodStartReading: billingStart,
billingPeriodEndDate: form.billingPeriodEndDate.value,
billingPeriodEndReading: billingEnd,
billingConsumption: billingEnd - billingStart,

comparisonPeriodStartDate: form.comparisonPeriodStartDate.value,
comparisonPeriodStartReading: comparisonStart,
comparisonPeriodEndDate: form.comparisonPeriodEndDate.value,
comparisonPeriodEndReading: comparisonEnd,
comparisonConsumption: comparisonEnd - comparisonStart,

baseTemperature: Number(form.baseTemperature.value || 21),
realAverageTempBilling: Number(form.realAverageTempBilling.value || 0),
realAverageTempComparison: Number(form.realAverageTempComparison.value || 0),

tymMonthly: buildTymMonthlyFromForm(form),
note: form.note.value.trim()
```

};

if (editingMeasurementId) {
MeasurementsModule.update(editingMeasurementId, protocolData);
editingMeasurementId = null;
} else {
MeasurementsModule.add(protocolData);
}

selectedMeasurementObjectId = Number(form.objectId.value);
renderMeasurementsModule();
}

function editMeasurement(id) {
const protocol = MeasurementsModule.find(id);
if (!protocol) return;

editingMeasurementId = Number(id);
selectedMeasurementObjectId = Number(protocol.objectId);

renderMeasurementsModule();

const form = document.querySelector("#module-content form");
if (!form) return;

form.clientId.value = String(protocol.clientId || "");
updateMeasurementObjectOptions(protocol.clientId);
form.objectId.value = String(protocol.objectId || "");

form.weatherStation.value = protocol.weatherStation || "";
form.energyAnalystOwner.value = protocol.energyAnalystOwner || "";
form.protocolDate.value = protocol.protocolDate || "";

form.billingPeriodStartDate.value = protocol.billingPeriodStartDate || "";
form.billingPeriodStartReading.value = protocol.billingPeriodStartReading || "";
form.billingPeriodEndDate.value = protocol.billingPeriodEndDate || "";
form.billingPeriodEndReading.value = protocol.billingPeriodEndReading || "";

form.comparisonPeriodStartDate.value = protocol.comparisonPeriodStartDate || "";
form.comparisonPeriodStartReading.value = protocol.comparisonPeriodStartReading || "";
form.comparisonPeriodEndDate.value = protocol.comparisonPeriodEndDate || "";
form.comparisonPeriodEndReading.value = protocol.comparisonPeriodEndReading || "";

form.baseTemperature.value = protocol.baseTemperature || 21;
form.realAverageTempBilling.value = protocol.realAverageTempBilling || "";
form.realAverageTempComparison.value = protocol.realAverageTempComparison || "";
form.note.value = protocol.note || "";

if (protocol.tymMonthly && protocol.tymMonthly.length) {
protocol.tymMonthly.forEach(item => {
if (form[`tymTemp_${item.month}`]) form[`tymTemp_${item.month}`].value = item.temperature || "";
if (form[`tymDays_${item.month}`]) form[`tymDays_${item.month}`].value = item.days || "";
});
}

const submitButton = form.querySelector("button[type='submit']");
if (submitButton) submitButton.textContent = "Zapisz protokół";

window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteMeasurement(id) {
if (!confirm("Czy na pewno usunąć protokół pomiarowy?")) return;
MeasurementsModule.remove(id);
renderMeasurementsModule();
}

function cancelMeasurementEdit() {
editingMeasurementId = null;
renderMeasurementsModule();
}

function renderMeasurementsModule() {
const container = document.getElementById("module-content");
if (!container) return;

const clients = getClients();
const objects = getObjects();

if (clients.length === 0 || objects.length === 0) {
container.innerHTML = `       <div class="reminder-card">         <strong>Najpierw dodaj klienta i obiekt</strong>         <div class="reminder-meta">
          Protokół pomiarowy musi być przypisany do konkretnego obiektu.         </div>       </div>
    `;
return;
}

let selectedObject = selectedMeasurementObjectId
? ObjectsModule.find(selectedMeasurementObjectId)
: objects[0];

if (!selectedObject) selectedObject = objects[0];

const selectedClientId = Number(selectedObject.clientId);
const objectsForClient = ObjectsModule.findByClient(selectedClientId);
selectedMeasurementObjectId = Number(selectedObject.id);

const currentYear = new Date().getFullYear();

container.innerHTML = ` <form onsubmit="createMeasurement(this); return false;" class="calendar-form">

```
  <div style="grid-column: 1 / -1;">
    <h3>Protokół pomiarowy ESCO</h3>
    <p class="reminder-meta">
      Dane z tego formularza będą później podstawą do raportu ESCO i wyliczenia oszczędności.
    </p>
  </div>

  <div>
    <label>Klient</label>
    <select name="clientId" required onchange="updateMeasurementObjectOptions(this.value)">
      ${clients.map(client => `
        <option value="${client.id}" ${Number(client.id) === Number(selectedClientId) ? "selected" : ""}>
          ${escapeHtml(client.name)}
        </option>
      `).join("")}
    </select>
  </div>

  <div>
    <label>Obiekt</label>
    <select name="objectId" id="measurement-object-select" required onchange="selectedMeasurementObjectId = Number(this.value); renderMeasurementsList();">
      ${objectsForClient.map(object => `
        <option value="${object.id}" ${Number(object.id) === Number(selectedObject.id) ? "selected" : ""}>
          ${escapeHtml(object.name || "Obiekt bez nazwy")}
        </option>
      `).join("")}
    </select>
  </div>

  <div>
    <label>Stacja meteorologiczna</label>
    <input name="weatherStation" placeholder="np. Warszawa-Okęcie / Lublin-Radawiec" />
  </div>

  <div>
    <label>Opracował / Energy Analyst</label>
    <input name="energyAnalystOwner" value="${escapeHtml(selectedObject.energyAnalystOwner || "")}" placeholder="Imię i nazwisko analityka" />
  </div>

  <div>
    <label>Data protokołu</label>
    <input name="protocolDate" type="date" required />
  </div>

  <div>
    <label>Temperatura bazowa °C</label>
    <input name="baseTemperature" type="number" step="0.1" value="21" />
  </div>

  <div style="grid-column: 1 / -1;">
    <h3>Okres rozliczeniowy</h3>
  </div>

  <div>
    <label>Start okresu rozliczeniowego — data</label>
    <input name="billingPeriodStartDate" type="date" required />
  </div>

  <div>
    <label>Start okresu rozliczeniowego — odczyt</label>
    <input name="billingPeriodStartReading" type="number" step="0.001" required />
  </div>

  <div>
    <label>Koniec okresu rozliczeniowego — data</label>
    <input name="billingPeriodEndDate" type="date" required />
  </div>

  <div>
    <label>Koniec okresu rozliczeniowego — odczyt</label>
    <input name="billingPeriodEndReading" type="number" step="0.001" required />
  </div>

  <div>
    <label>Średnia temperatura rzeczywista w okresie rozliczeniowym</label>
    <input name="realAverageTempBilling" type="number" step="0.01" />
  </div>

  <div style="grid-column: 1 / -1;">
    <h3>Okres porównawczy</h3>
  </div>

  <div>
    <label>Start okresu porównawczego — data</label>
    <input name="comparisonPeriodStartDate" type="date" required />
  </div>

  <div>
    <label>Start okresu porównawczego — odczyt</label>
    <input name="comparisonPeriodStartReading" type="number" step="0.001" required />
  </div>

  <div>
    <label>Koniec okresu porównawczego — data</label>
    <input name="comparisonPeriodEndDate" type="date" required />
  </div>

  <div>
    <label>Koniec okresu porównawczego — odczyt</label>
    <input name="comparisonPeriodEndReading" type="number" step="0.001" required />
  </div>

  <div>
    <label>Średnia temperatura rzeczywista w okresie porównawczym</label>
    <input name="realAverageTempComparison" type="number" step="0.01" />
  </div>

  <div style="grid-column: 1 / -1;">
    <h3>Średnia temperatura TYM</h3>
    <p class="reminder-meta">
      Dni kalendarzowe są uzupełnione automatycznie dla bieżącego roku, ale możesz je zmienić ręcznie.
    </p>
  </div>

  ${MONTHS_PL.map((monthName, index) => {
    const month = index + 1;
    return `
      <div>
        <label>${monthName} — średnia temperatura TYM</label>
        <input name="tymTemp_${month}" type="number" step="0.01" />
      </div>

      <div>
        <label>${monthName} — dni kalendarzowe</label>
        <input name="tymDays_${month}" type="number" value="${getDaysInMonth(month, currentYear)}" />
      </div>
    `;
  }).join("")}

  <div style="grid-column: 1 / -1;">
    <label>Notatka</label>
    <input name="note" placeholder="Uwagi do protokołu, źródło danych, nietypowy okres itd." />
  </div>

  <div class="calendar-actions">
    <button class="primary-button" type="submit">
      ${editingMeasurementId ? "Zapisz protokół" : "Dodaj protokół"}
    </button>
    ${editingMeasurementId ? `<button class="small-button" type="button" onclick="cancelMeasurementEdit()">Anuluj edycję</button>` : ""}
  </div>
</form>

<div id="measurements-list"></div>
```

`;

renderMeasurementsList();
}

function renderMeasurementsList() {
const container = document.getElementById("measurements-list");
if (!container) return;

if (!selectedMeasurementObjectId) {
container.innerHTML = `       <div class="reminder-card">         <strong>Brak wybranego obiektu</strong>         <div class="reminder-meta">Wybierz klienta i obiekt, aby zobaczyć protokoły.</div>       </div>
    `;
return;
}

const protocols = MeasurementsModule.findByObject(selectedMeasurementObjectId);

if (protocols.length === 0) {
container.innerHTML = `       <div class="reminder-card">         <strong>Brak protokołów</strong>         <div class="reminder-meta">Dodaj pierwszy protokół pomiarowy dla tego obiektu.</div>       </div>
    `;
return;
}

container.innerHTML = protocols.map(item => ` <div class="reminder-card"> <strong>Protokół z dnia: ${escapeHtml(item.protocolDate || "brak daty")}</strong> <div class="reminder-meta">
Klient: ${escapeHtml(getClientName(item.clientId))}<br />
Obiekt: ${escapeHtml(getObjectName(item.objectId))}<br />
Stacja meteorologiczna: ${escapeHtml(item.weatherStation)}<br />
Opracował: ${escapeHtml(item.energyAnalystOwner)}<br /><br />

```
    Okres rozliczeniowy: ${escapeHtml(item.billingPeriodStartDate)} → ${escapeHtml(item.billingPeriodEndDate)}<br />
    Zużycie rozliczeniowe: <strong>${Number(item.billingConsumption || 0).toFixed(3)}</strong><br />

    Okres porównawczy: ${escapeHtml(item.comparisonPeriodStartDate)} → ${escapeHtml(item.comparisonPeriodEndDate)}<br />
    Zużycie porównawcze: <strong>${Number(item.comparisonConsumption || 0).toFixed(3)}</strong><br />

    Temperatura bazowa: ${escapeHtml(item.baseTemperature)}°C<br />
    Śr. temp. rzeczywista rozliczeniowa: ${escapeHtml(item.realAverageTempBilling)}°C<br />
    Śr. temp. rzeczywista porównawcza: ${escapeHtml(item.realAverageTempComparison)}°C
  </div>

  <div style="margin-top: 12px;">
    <button class="small-button" onclick="editMeasurement(${item.id})">Edytuj</button>
    <button class="small-button" onclick="deleteMeasurement(${item.id})">Usuń</button>
  </div>
</div>
```

`).join("");
}


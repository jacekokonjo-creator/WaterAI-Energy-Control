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
// Measurements / Pomiary
// ─────────────────────────────────────────────

let editingMeasurementId = null;
let selectedMeasurementObjectId = null;

const MEASUREMENT_TYPES = {
  HEAT_CO: "Ciepło C.O.",
  HEAT_CWU: "Ciepła woda C.W.U.",
  ELECTRICITY: "Energia elektryczna",
  GAS: "Gaz",
  WATER: "Woda",
  TEMP_SUPPLY: "Temperatura zasilania",
  TEMP_RETURN: "Temperatura powrotu",
  TEMP_INSIDE: "Temperatura wewnętrzna",
  TEMP_OUTSIDE: "Temperatura zewnętrzna",
  OTHER: "Inne"
};

const MEASUREMENT_UNITS = [
  "GJ",
  "kWh",
  "MWh",
  "m3",
  "°C",
  "PLN",
  "inne"
];

function getMeasurementTypeLabel(type) {
  return MEASUREMENT_TYPES[type] || type || "Inne";
}

function getMeasurements() {
  return MeasurementsModule.getAll();
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
    select.innerHTML = `<option value="">Brak obiektów dla tego klienta</option>`;
    return;
  }

  select.innerHTML = objects.map(object => `
    <option value="${object.id}">${escapeHtml(object.name || "Obiekt bez nazwy")}</option>
  `).join("");

  if (selectedMeasurementObjectId && objects.some(object => object.id === Number(selectedMeasurementObjectId))) {
    select.value = String(selectedMeasurementObjectId);
  } else {
    selectedMeasurementObjectId = Number(objects[0].id);
    select.value = String(objects[0].id);
  }
}
function createMeasurement(form) {
  const object = ObjectsModule.find(Number(form.objectId.value));

  if (!object) {
    alert("Wybierz obiekt dla pomiaru.");
    return;
  }

  const measurementData = {
    clientId: object.clientId,
    objectId: form.objectId.value,
    measurementDate: form.measurementDate.value,
    measurementType: form.measurementType.value,
    value: form.value.value,
    unit: form.unit.value,
    source: form.source.value,
    note: form.note.value.trim()
  };

  if (editingMeasurementId) {
    MeasurementsModule.update(editingMeasurementId, measurementData);
    editingMeasurementId = null;
  } else {
    MeasurementsModule.add(measurementData);
  }

  selectedMeasurementObjectId = Number(form.objectId.value);
  form.reset();

  const submitButton = form.querySelector("button[type='submit']");
  if (submitButton) submitButton.textContent = "Dodaj pomiar";

  renderMeasurementsModule();
}

function editMeasurement(id) {
  const measurement = MeasurementsModule.find(id);
  if (!measurement) return;

  editingMeasurementId = Number(id);
  selectedMeasurementObjectId = Number(measurement.objectId);

  const form = document.querySelector("#module-content form");
  if (!form) return;

  form.clientId.value = String(measurement.clientId || "");
  updateMeasurementObjectOptions(measurement.clientId);
  form.objectId.value = String(measurement.objectId || "");
  form.measurementDate.value = measurement.measurementDate || "";
  form.measurementType.value = measurement.measurementType || "HEAT_CO";
  form.value.value = measurement.value ?? "";
  form.unit.value = measurement.unit || "GJ";
  form.source.value = measurement.source || "MANUAL";
  form.note.value = measurement.note || "";

  const submitButton = form.querySelector("button[type='submit']");
  if (submitButton) submitButton.textContent = "Zapisz pomiar";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteMeasurement(id) {
  if (!confirm("Czy na pewno usunąć pomiar?")) return;
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
    container.innerHTML = `
      <div class="reminder-card">
        <strong>Najpierw dodaj klienta i obiekt</strong>
        <div class="reminder-meta">
          Pomiar musi być przypisany do konkretnego obiektu.
        </div>
      </div>
    `;
    return;
  }

let selectedObject = selectedMeasurementObjectId
  ? ObjectsModule.find(selectedMeasurementObjectId)
  : null;

let selectedClientId = selectedObject
  ? Number(selectedObject.clientId)
  : Number(clients[0].id);

let objectsForClient = ObjectsModule.findByClient(selectedClientId);

if (!selectedObject && objectsForClient.length > 0) {
  selectedObject = objectsForClient[0];
  selectedMeasurementObjectId = Number(selectedObject.id);
}

  container.innerHTML = `
    <form onsubmit="createMeasurement(this); return false;" class="calendar-form">
      <div style="grid-column: 1 / -1;">
        <h3>Dodaj pomiar / odczyt</h3>
        <p class="reminder-meta">
          Każdy pomiar jest przypisany do obiektu. Na tej podstawie później policzymy zużycie, HDD, oszczędności i ESCO.
        </p>
      </div>

      <div>
        <label>Klient</label>
        <select name="clientId" required onchange="selectedMeasurementObjectId=null; updateMeasurementObjectOptions(this.value)">
          ${clients.map(client => `
            <option value="${client.id}" ${Number(client.id) === Number(selectedClientId) ? "selected" : ""}>
              ${escapeHtml(client.name)}
            </option>
          `).join("")}
        </select>
      </div>

      <div>
        <label>Obiekt</label>
        <select name="objectId" id="measurement-object-select" required onchange="selectedMeasurementObjectId=Number(this.value); renderMeasurementsList();">
          ${objectsForClient.map(object => `
            <option value="${object.id}" ${Number(object.id) === Number(selectedObject?.id) ? "selected" : ""}>
             ${escapeHtml(object.name || "Obiekt bez nazwy")}
            </option>
          `).join("")}
        </select>
      </div>

      <div>
        <label>Data pomiaru</label>
        <input name="measurementDate" type="date" required />
      </div>

      <div>
        <label>Rodzaj pomiaru</label>
        <select name="measurementType" required>
          ${Object.entries(MEASUREMENT_TYPES).map(([value, label]) => `
            <option value="${value}">${escapeHtml(label)}</option>
          `).join("")}
        </select>
      </div>

      <div>
        <label>Wartość / stan licznika</label>
        <input name="value" type="number" step="0.001" required placeholder="np. 1250" />
      </div>

      <div>
        <label>Jednostka</label>
        <select name="unit" required>
          ${MEASUREMENT_UNITS.map(unit => `
            <option value="${escapeHtml(unit)}">${escapeHtml(unit)}</option>
          `).join("")}
        </select>
      </div>

      <div>
        <label>Źródło danych</label>
        <select name="source">
          <option value="MANUAL">Ręczny odczyt</option>
          <option value="INVOICE">Faktura</option>
          <option value="ONLINE">Online / system</option>
          <option value="CLIENT">Podane przez klienta</option>
          <option value="WATERAI">Odczyt WaterAI</option>
        </select>
      </div>

      <div style="grid-column: 1 / -1;">
        <label>Notatka</label>
        <input name="note" placeholder="np. odczyt z licznika, zdjęcie w dokumentach, nietypowy okres rozliczeniowy..." />
      </div>

      <div class="calendar-actions">
        <button class="primary-button" type="submit">Dodaj pomiar</button>
        ${editingMeasurementId ? `<button class="small-button" type="button" onclick="cancelMeasurementEdit()">Anuluj edycję</button>` : ""}
      </div>
    </form>

    <div id="measurements-list"></div>
  `;

  renderMeasurementsList();
}

function renderMeasurementsList() {
  const container = document.getElementById("measurements-list");
  const objectSelect = document.getElementById("measurement-object-select");
  if (!container || !objectSelect) return;

  const objectId = Number(objectSelect.value || selectedMeasurementObjectId);
  selectedMeasurementObjectId = objectId;

  const object = ObjectsModule.find(objectId);
  const measurements = MeasurementsModule.findByObject(objectId);

  if (!object) {
    container.innerHTML = `<p>Wybierz obiekt, aby zobaczyć pomiary.</p>`;
    return;
  }

  if (measurements.length === 0) {
    container.innerHTML = `
      <div class="reminder-card">
        <strong>Pomiary dla obiektu: ${escapeHtml(object.name)}</strong>
        <div class="reminder-meta">Brak pomiarów. Dodaj pierwszy odczyt.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="reminder-card">
      <strong>Pomiary dla obiektu: ${escapeHtml(object.name)}</strong>
      <div class="reminder-meta">Liczba pomiarów: ${measurements.length}</div>
      <div style="overflow-x:auto; margin-top: 12px;">
        <table style="width:100%; border-collapse: collapse; min-width: 760px;">
          <thead>
            <tr>
              <th style="text-align:left; padding:8px; border-bottom:1px solid rgba(11,116,201,0.16);">Data</th>
              <th style="text-align:left; padding:8px; border-bottom:1px solid rgba(11,116,201,0.16);">Typ</th>
              <th style="text-align:right; padding:8px; border-bottom:1px solid rgba(11,116,201,0.16);">Wartość</th>
              <th style="text-align:left; padding:8px; border-bottom:1px solid rgba(11,116,201,0.16);">Jedn.</th>
              <th style="text-align:left; padding:8px; border-bottom:1px solid rgba(11,116,201,0.16);">Źródło</th>
              <th style="text-align:left; padding:8px; border-bottom:1px solid rgba(11,116,201,0.16);">Notatka</th>
              <th style="text-align:left; padding:8px; border-bottom:1px solid rgba(11,116,201,0.16);">Akcje</th>
            </tr>
          </thead>
          <tbody>
            ${measurements.map(item => `
              <tr>
                <td style="padding:8px; border-bottom:1px solid rgba(11,116,201,0.08);">${escapeHtml(item.measurementDate)}</td>
                <td style="padding:8px; border-bottom:1px solid rgba(11,116,201,0.08);">${escapeHtml(getMeasurementTypeLabel(item.measurementType))}</td>
                <td style="padding:8px; text-align:right; border-bottom:1px solid rgba(11,116,201,0.08);">${escapeHtml(item.value)}</td>
                <td style="padding:8px; border-bottom:1px solid rgba(11,116,201,0.08);">${escapeHtml(item.unit)}</td>
                <td style="padding:8px; border-bottom:1px solid rgba(11,116,201,0.08);">${escapeHtml(item.source)}</td>
                <td style="padding:8px; border-bottom:1px solid rgba(11,116,201,0.08);">${escapeHtml(item.note)}</td>
                <td style="padding:8px; border-bottom:1px solid rgba(11,116,201,0.08); white-space:nowrap;">
                  <button class="small-button" onclick="editMeasurement(${item.id})">Edytuj</button>
                  <button class="small-button" onclick="deleteMeasurement(${item.id})">Usuń</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

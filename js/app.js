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
    energyAnalystOwner: form.energyAnalystOwner.value.trim(),

    // DANE KLIMATYCZNE TYM
    weatherStation: form.weatherStation ? form.weatherStation.value.trim() : "",
    weatherSource: form.weatherSource ? form.weatherSource.value.trim() : "WeatherOnline / Robot Klimatu",
    weatherSourceUrl: form.weatherSourceUrl ? form.weatherSourceUrl.value.trim() : "",
    weatherDataDownloadDate: form.weatherDataDownloadDate ? form.weatherDataDownloadDate.value : "",
    baseTemperature: form.baseTemperature ? Number(form.baseTemperature.value || 21) : 21,

    // DANE ENERGETYCZNE
    energyUnit: form.energyUnit ? form.energyUnit.value : "GJ",
    currency: form.currency ? form.currency.value : "PLN",
    energyPrice: form.energyPrice ? Number(form.energyPrice.value || 0) : 0
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

  if (form.weatherStation) form.weatherStation.value = object.weatherStation || "";
  if (form.weatherSource) form.weatherSource.value = object.weatherSource || "WeatherOnline / Robot Klimatu";
  if (form.weatherSourceUrl) form.weatherSourceUrl.value = object.weatherSourceUrl || "";
  if (form.weatherDataDownloadDate) form.weatherDataDownloadDate.value = object.weatherDataDownloadDate || "";
  if (form.baseTemperature) form.baseTemperature.value = object.baseTemperature || 21;
  if (form.energyUnit) form.energyUnit.value = object.energyUnit || "GJ";
  if (form.currency) form.currency.value = object.currency || "PLN";
  if (form.energyPrice) form.energyPrice.value = object.energyPrice || "";

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

      <div style="grid-column: 1 / -1;">
        <h3>Dane klimatyczne (TYM)</h3>
        <p class="reminder-meta">Dane źródła klimatycznego — zwykle stałe dla obiektu.</p>
      </div>

      <div>
        <label>Stacja meteorologiczna</label>
        <input name="weatherStation" placeholder="np. Warszawa-Okęcie" />
      </div>

      <div>
        <label>Źródło danych klimatycznych</label>
        <input name="weatherSource" value="WeatherOnline / Robot Klimatu" placeholder="np. WeatherOnline / Robot Klimatu" />
      </div>

      <div style="grid-column: 1 / -1;">
        <label>Link do źródła danych (WeatherOnline / Robot Klimatu)</label>
        <input name="weatherSourceUrl" type="url" placeholder="https://..." />
      </div>

      <div>
        <label>Data pobrania danych klimatycznych</label>
        <input name="weatherDataDownloadDate" type="date" />
      </div>

      <div>
        <label>Temperatura bazowa °C</label>
        <input name="baseTemperature" type="number" step="0.1" value="21" />
      </div>

      <div style="grid-column: 1 / -1;">
        <h3>Dane energetyczne</h3>
        <p class="reminder-meta">Jednostka, waluta i cena energii — zwykle stałe dla obiektu.</p>
      </div>

      <div>
        <label>Jednostka energii</label>
        <select name="energyUnit">
          <option value="GJ">GJ</option>
          <option value="MWh">MWh</option>
          <option value="kWh">kWh</option>
          <option value="m3">m³</option>
          <option value="Gcal">Gcal</option>
        </select>
      </div>

      <div>
        <label>Waluta</label>
        <select name="currency">
          <option value="PLN">PLN</option>
          <option value="EUR">EUR</option>
          <option value="CZK">CZK</option>
          <option value="GBP">GBP</option>
        </select>
      </div>

      <div>
        <label>Cena energii (za jednostkę)</label>
        <input name="energyPrice" type="number" step="0.01" min="0" placeholder="np. 85.00" />
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

  select.innerHTML = objects.map(object => `
    <option value="${object.id}">
      ${escapeHtml(object.name || "Obiekt bez nazwy")}
    </option>
  `).join("");

  select.value = String(selectedMeasurementObjectId);
  renderMeasurementsList();
}

function buildTymMonthlyFromForm(form) {
  return MONTHS_PL.map((monthName, index) => {
    const month = index + 1;

    return {
      month,
      monthName,
      tymTemperature: Number(form[`tymTemp_${month}`]?.value ?? ""),
      tymDays: Number(form[`tymDays_${month}`]?.value || 0)
    };
  });
}

function buildRealMonthlyFromForm(form) {
  return MONTHS_PL.map((monthName, index) => {
    const month = index + 1;

    return {
      month,
      monthName,
      realTemperature: Number(form[`realTemp_${month}`]?.value ?? ""),
      realDays: Number(form[`realDays_${month}`]?.value || 0)
    };
  });
}

function calcHDD(months, tempField, daysField, baseTemp) {
  return months.reduce((sum, m) => {
    const diff = baseTemp - Number(m[tempField]);
    return sum + Math.max(0, diff) * Number(m[daysField]);
  }, 0);
}

function calcESCOResults(protocol) {
  const base = Number(protocol.baseTemperature || 21);
  const tymMonthly = protocol.tymMonthly || [];
  const realMonthly = protocol.comparisonMonthly || protocol.realMonthly || [];

  const hddTym = calcHDD(tymMonthly, "tymTemperature", "tymDays", base);
  const hddReal = calcHDD(realMonthly, "temperature", "days", base);

  const billingConsumption = Number(protocol.billingConsumption || 0);
  const comparisonConsumption = Number(protocol.comparisonConsumption || 0);
  const energyPrice = Number(protocol.energyPrice || 0);
  const waterAiSharePct = Number(protocol.waterAiShare || 0);

  const climateCorrectionFactor = hddReal > 0 ? hddTym / hddReal : 0;
  const correctedComparisonConsumption = comparisonConsumption * climateCorrectionFactor;
  const savedEnergy = correctedComparisonConsumption - billingConsumption;
  const savedEnergyPercent = correctedComparisonConsumption > 0
    ? (savedEnergy / correctedComparisonConsumption) * 100
    : 0;
  const savedMoney = savedEnergy * energyPrice;
  const waterAiShare = savedMoney * (waterAiSharePct / 100);

  return {
    hddTym,
    hddReal,
    climateCorrectionFactor,
    correctedComparisonConsumption,
    savedEnergy,
    savedEnergyPercent,
    savedMoney,
    waterAiShare
  };
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

  const tymMonthly = buildTymMonthlyFromForm(form);
  const realMonthly = buildPeriodMonthlyFromForm("billing");
  const comparisonMonthly = buildPeriodMonthlyFromForm("comparison");

  const protocolData = {
    clientId: object.clientId,
    objectId: form.objectId.value,

    protocolDate: form.protocolDate.value,
    preparedBy: form.preparedBy ? form.preparedBy.value.trim() : "",

    weatherStation: form.weatherStation.value.trim(),
    weatherSource: form.weatherSource.value.trim(),
    weatherSourceUrl: form.weatherSourceUrl.value.trim(),
    weatherDataDownloadDate: form.weatherDataDownloadDate.value,
    baseTemperature: Number(form.baseTemperature.value || 21),

    energyUnit: form.energyUnit.value,
    currency: form.currency.value,
    energyPrice: Number(form.energyPrice.value || 0),
    waterAiShare: Number(form.waterAiShare.value || 0),

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

    tymPeriodStart: form.tymPeriodStart ? form.tymPeriodStart.value.trim() : "",
    tymPeriodEnd: form.tymPeriodEnd ? form.tymPeriodEnd.value.trim() : "",
    tymDataSource: form.tymDataSource ? form.tymDataSource.value.trim() : "",

    tymMonthly,
    realMonthly,
    comparisonMonthly,

    includeLinearRegression: form.includeLinearRegression
      ? form.includeLinearRegression.checked
      : false,

    note: form.note.value.trim()
  };

  // automatyczne wyniki ESCO
  protocolData.escoResults = calcESCOResults(protocolData);

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

  form.protocolDate.value = protocol.protocolDate || "";
  if (form.preparedBy) form.preparedBy.value = protocol.preparedBy || "";

  form.weatherStation.value = protocol.weatherStation || "";
  if (form.weatherSource) form.weatherSource.value = protocol.weatherSource || "WeatherOnline / Robot Klimatu";
  if (form.weatherSourceUrl) form.weatherSourceUrl.value = protocol.weatherSourceUrl || "";
  if (form.weatherDataDownloadDate) form.weatherDataDownloadDate.value = protocol.weatherDataDownloadDate || "";
  form.baseTemperature.value = protocol.baseTemperature || 21;

  if (form.energyUnit) form.energyUnit.value = protocol.energyUnit || "GJ";
  if (form.currency) form.currency.value = protocol.currency || "PLN";
  if (form.energyPrice) form.energyPrice.value = protocol.energyPrice || "";
  if (form.waterAiShare) form.waterAiShare.value = protocol.waterAiShare || "";

  form.billingPeriodStartDate.value = protocol.billingPeriodStartDate || "";
  form.billingPeriodStartReading.value = protocol.billingPeriodStartReading || "";
  form.billingPeriodEndDate.value = protocol.billingPeriodEndDate || "";
  form.billingPeriodEndReading.value = protocol.billingPeriodEndReading || "";

  form.comparisonPeriodStartDate.value = protocol.comparisonPeriodStartDate || "";
  form.comparisonPeriodStartReading.value = protocol.comparisonPeriodStartReading || "";
  form.comparisonPeriodEndDate.value = protocol.comparisonPeriodEndDate || "";
  form.comparisonPeriodEndReading.value = protocol.comparisonPeriodEndReading || "";

  form.note.value = protocol.note || "";

  if (form.includeLinearRegression) {
    form.includeLinearRegression.checked = !!protocol.includeLinearRegression;
  }

  if (protocol.tymMonthly && protocol.tymMonthly.length) {
    protocol.tymMonthly.forEach(item => {
      if (form[`tymTemp_${item.month}`]) {
        form[`tymTemp_${item.month}`].value = item.tymTemperature ?? "";
      }
      if (form[`tymDays_${item.month}`]) {
        form[`tymDays_${item.month}`].value = item.tymDays || "";
      }
    });
  }

  if (protocol.realMonthly && protocol.realMonthly.length) {
    protocol.realMonthly.forEach(item => {
      if (form[`realTemp_${item.month}`]) {
        form[`realTemp_${item.month}`].value = item.realTemperature ?? "";
      }
      if (form[`realDays_${item.month}`]) {
        form[`realDays_${item.month}`].value = item.realDays || "";
      }
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

// ─── helpers dla dynamicznych tabelek miesięcznych ───────────────────────────

function buildMonthsFromDates(startDate, endDate) {
  if (!startDate || !endDate) return [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start) || isNaN(end) || end < start) return [];

  const months = [];
  let cur = new Date(start.getFullYear(), start.getMonth(), 1);

  while (cur <= end) {
    const year = cur.getFullYear();
    const month = cur.getMonth(); // 0-based
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);

    const dayFrom = (firstOfMonth < start) ? start.getDate() : 1;
    const dayTo   = (lastOfMonth > end)    ? end.getDate()   : lastOfMonth.getDate();
    const days    = dayTo - dayFrom + 1;

    months.push({
      year,
      month: month + 1, // 1-based
      monthName: MONTHS_PL[month] + " " + year,
      days
    });

    cur = new Date(year, month + 1, 1);
  }

  return months;
}

function refreshPeriodTable(prefix) {
  const startDateEl = document.querySelector(`[name="${prefix}PeriodStartDate"]`);
  const endDateEl   = document.querySelector(`[name="${prefix}PeriodEndDate"]`);
  const tbody       = document.getElementById(`${prefix}-months-tbody`);
  const hddEl       = document.getElementById(`${prefix}-hdd-display`);
  const consEl      = document.getElementById(`${prefix}-consumption-display`);
  if (!tbody) return;

  const startDate = startDateEl ? startDateEl.value : "";
  const endDate   = endDateEl   ? endDateEl.value   : "";
  const months    = buildMonthsFromDates(startDate, endDate);

  const baseTempEl = document.querySelector("[name='baseTemperature']");
  const baseTemp   = baseTempEl ? Number(baseTempEl.value || 21) : 21;

  if (months.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--color-text-tertiary);padding:14px;font-size:13px;">Wybierz daty aby zobaczyć miesiące</td></tr>`;
    if (hddEl) hddEl.textContent = "—";
    return;
  }

  // zachowaj istniejące wartości temp jeśli wiersze już są
  const existingTemps = {};
  tbody.querySelectorAll("tr[data-key]").forEach(tr => {
    const key   = tr.dataset.key;
    const tInput = tr.querySelector("input.month-temp");
    const dInput = tr.querySelector("input.month-days");
    if (tInput) existingTemps[key] = { temp: tInput.value, days: dInput ? dInput.value : "" };
  });

  tbody.innerHTML = months.map(m => {
    const key  = `${m.year}-${m.month}`;
    const prev = existingTemps[key] || {};
    const tempVal = prev.temp !== undefined ? prev.temp : "";
    const daysVal = prev.days !== undefined ? prev.days : m.days;
    const hddAuto = tempVal !== "" ? Math.max(0, baseTemp - Number(tempVal)) * Number(daysVal) : null;

    return `<tr data-key="${key}">
      <td style="padding:5px 8px;font-size:13px;color:var(--color-text-secondary);">${m.monthName}</td>
      <td style="padding:3px 6px;"><input class="month-temp" type="number" step="0.01" placeholder="°C"
        name="${prefix}Temp_${m.year}_${m.month}" value="${tempVal}"
        style="width:90px;font-size:13px;padding:3px 6px;"
        oninput="refreshPeriodHDD('${prefix}')" /></td>
      <td style="padding:3px 6px;"><input class="month-days" type="number" min="1" max="31"
        name="${prefix}Days_${m.year}_${m.month}" value="${daysVal}"
        style="width:60px;font-size:13px;padding:3px 6px;"
        oninput="refreshPeriodHDD('${prefix}')" /></td>
      <td style="padding:5px 8px;font-size:13px;color:var(--color-text-tertiary);" class="hdd-cell">
        ${hddAuto !== null ? hddAuto.toFixed(1) : "—"}
      </td>
    </tr>`;
  }).join("");

  refreshPeriodHDD(prefix);
  if (consEl) refreshConsumption(prefix);
}

function refreshPeriodHDD(prefix) {
  const tbody  = document.getElementById(`${prefix}-months-tbody`);
  const hddEl  = document.getElementById(`${prefix}-hdd-display`);
  if (!tbody) return;

  const baseTempEl = document.querySelector("[name='baseTemperature']");
  const baseTemp   = baseTempEl ? Number(baseTempEl.value || 21) : 21;

  let total = 0;
  tbody.querySelectorAll("tr[data-key]").forEach(tr => {
    const tInput = tr.querySelector("input.month-temp");
    const dInput = tr.querySelector("input.month-days");
    const hddCell = tr.querySelector(".hdd-cell");
    if (!tInput || tInput.value === "") {
      if (hddCell) hddCell.textContent = "—";
      return;
    }
    const hdd = Math.max(0, baseTemp - Number(tInput.value)) * Number(dInput ? dInput.value : 0);
    total += hdd;
    if (hddCell) hddCell.textContent = hdd.toFixed(1);
  });

  if (hddEl) hddEl.textContent = total.toFixed(2);
}

function refreshConsumption(prefix) {
  const startEl = document.querySelector(`[name="${prefix}PeriodStartReading"]`);
  const endEl   = document.querySelector(`[name="${prefix}PeriodEndReading"]`);
  const dispEl  = document.getElementById(`${prefix}-consumption-display`);
  if (!dispEl) return;
  if (!startEl || !endEl || startEl.value === "" || endEl.value === "") {
    dispEl.textContent = "—";
    return;
  }
  const cons = Number(endEl.value) - Number(startEl.value);
  dispEl.textContent = cons.toFixed(3);
}

// ─── TYM (12 miesięcy stałych) ────────────────────────────────────────────────

function refreshTymHDD() {
  const baseTempEl = document.querySelector("[name='baseTemperature']");
  const baseTemp   = baseTempEl ? Number(baseTempEl.value || 21) : 21;
  const hddEl      = document.getElementById("tym-hdd-display");

  let total = 0;
  for (let m = 1; m <= 12; m++) {
    const tInput = document.querySelector(`[name="tymTemp_${m}"]`);
    const dInput = document.querySelector(`[name="tymDays_${m}"]`);
    const hddCell = document.getElementById(`tym-hdd-cell-${m}`);
    if (!tInput || tInput.value === "") {
      if (hddCell) hddCell.textContent = "—";
      continue;
    }
    const hdd = Math.max(0, baseTemp - Number(tInput.value)) * Number(dInput ? dInput.value : 0);
    total += hdd;
    if (hddCell) hddCell.textContent = hdd.toFixed(1);
  }
  if (hddEl) hddEl.textContent = total.toFixed(2);
}

// ─── Odczytanie danych tabelek z formularza ───────────────────────────────────

function buildPeriodMonthlyFromForm(prefix) {
  const tbody = document.getElementById(`${prefix}-months-tbody`);
  if (!tbody) return [];
  const rows = [];
  tbody.querySelectorAll("tr[data-key]").forEach(tr => {
    const [year, month] = tr.dataset.key.split("-").map(Number);
    const tInput = tr.querySelector("input.month-temp");
    const dInput = tr.querySelector("input.month-days");
    rows.push({
      year, month,
      monthName: MONTHS_PL[month - 1] + " " + year,
      temperature: tInput ? Number(tInput.value || 0) : 0,
      days: dInput ? Number(dInput.value || 0) : 0
    });
  });
  return rows;
}

// ─── GŁÓWNA FUNKCJA RENDER ────────────────────────────────────────────────────

function renderMeasurementsModule() {
  const container = document.getElementById("module-content");
  if (!container) return;

  const clients = getClients();
  const objects = getObjects();

  if (clients.length === 0 || objects.length === 0) {
    container.innerHTML = `
      <div class="reminder-card">
        <strong>Najpierw dodaj klienta i obiekt</strong>
        <div class="reminder-meta">Protokół TYM musi być przypisany do konkretnego obiektu.</div>
      </div>
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

  const secStyle = (bg, border) =>
    `border:1px solid ${border};border-radius:10px;margin-bottom:20px;overflow:hidden;`;
  const headerStyle = (bg, color) =>
    `background:${bg};padding:12px 16px;display:flex;align-items:center;gap:10px;`;
  const h3Style = (color) =>
    `margin:0;font-size:15px;font-weight:500;color:${color};`;
  const badgeStyle = (bg, color) =>
    `font-size:11px;padding:2px 8px;border-radius:20px;background:${bg};color:${color};`;
  const bodyStyle = `padding:16px;background:var(--color-background-primary);`;
  const tableStyle = `width:100%;border-collapse:collapse;font-size:13px;margin-top:8px;`;
  const thStyle = `text-align:left;padding:6px 8px;font-weight:500;font-size:11px;color:var(--color-text-secondary);border-bottom:0.5px solid var(--color-border-tertiary);`;
  const chipStyle = (bg, color) =>
    `display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:500;padding:4px 12px;border-radius:20px;margin-top:10px;background:${bg};color:${color};`;
  const row2 = `display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;`;

  const tymMonthsRows = MONTHS_PL.map((monthName, idx) => {
    const m = idx + 1;
    const days = getDaysInMonth(m, currentYear);
    return `<tr>
      <td style="padding:5px 8px;color:var(--color-text-secondary);">${monthName}</td>
      <td style="padding:3px 6px;"><input name="tymTemp_${m}" type="number" step="0.01" placeholder="°C"
        style="width:90px;font-size:13px;padding:3px 6px;" oninput="refreshTymHDD()" /></td>
      <td style="padding:3px 6px;"><input name="tymDays_${m}" type="number" value="${days}"
        style="width:60px;font-size:13px;padding:3px 6px;" oninput="refreshTymHDD()" /></td>
      <td style="padding:5px 8px;color:var(--color-text-tertiary);" id="tym-hdd-cell-${m}">—</td>
    </tr>`;
  }).join("");

  container.innerHTML = `
  <style>
    .tym-section { margin-bottom:20px; border-radius:10px; overflow:hidden; }
    .tym-field label { font-size:12px;color:var(--color-text-secondary);display:block;margin-bottom:4px; }
    .tym-grid2 { display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px; }
    .tym-grid4 { display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;margin-bottom:12px; }
    .tym-body { padding:16px;background:var(--color-background-primary); }
    .tym-table { width:100%;border-collapse:collapse;font-size:13px;margin-top:8px; }
    .tym-table th { text-align:left;padding:6px 8px;font-size:11px;font-weight:500;color:var(--color-text-secondary);border-bottom:0.5px solid var(--color-border-tertiary); }
    .tym-note { font-size:11px;color:var(--color-text-tertiary);margin-top:6px; }
    .tym-summary { display:flex;gap:16px;margin-top:12px;flex-wrap:wrap;align-items:center; }
  </style>

  <form onsubmit="createMeasurement(this); return false;">

    <!-- ═══ DANE PODSTAWOWE ═══ -->
    <div style="margin-bottom:20px;">
      <h3 style="font-size:16px;font-weight:500;margin-bottom:12px;">Protokół TYM — Rozliczenie ESCO</h3>
      <div class="tym-grid4">
        <div class="tym-field">
          <label>Klient</label>
          <select name="clientId" required onchange="updateMeasurementObjectOptions(this.value)" style="width:100%;">
            ${clients.map(c => `<option value="${c.id}" ${Number(c.id) === selectedClientId ? "selected" : ""}>${escapeHtml(c.name)}</option>`).join("")}
          </select>
        </div>
        <div class="tym-field">
          <label>Obiekt</label>
          <select name="objectId" id="measurement-object-select" required onchange="selectedMeasurementObjectId=Number(this.value);renderMeasurementsList();" style="width:100%;">
            ${objectsForClient.map(o => `<option value="${o.id}" ${Number(o.id) === selectedMeasurementObjectId ? "selected" : ""}>${escapeHtml(o.name || "Obiekt bez nazwy")}</option>`).join("")}
          </select>
        </div>
        <div class="tym-field">
          <label>Data protokołu</label>
          <input name="protocolDate" type="date" required style="width:100%;box-sizing:border-box;" />
        </div>
        <div class="tym-field">
          <label>Opracował / Energy Analyst</label>
          <input name="preparedBy" value="${escapeHtml(selectedObject.energyAnalystOwner || "")}" placeholder="Imię i nazwisko" style="width:100%;box-sizing:border-box;" />
        </div>
      </div>

      <div class="tym-grid4">
        <div class="tym-field">
          <label>Stacja meteorologiczna</label>
          <input name="weatherStation" value="${escapeHtml(selectedObject.weatherStation || "")}" placeholder="np. Warszawa-Okęcie" style="width:100%;box-sizing:border-box;" />
        </div>
        <div class="tym-field">
          <label>Źródło danych</label>
          <input name="weatherSource" value="${escapeHtml(selectedObject.weatherSource || "WeatherOnline / Robot Klimatu")}" style="width:100%;box-sizing:border-box;" />
        </div>
        <div class="tym-field">
          <label>Data pobrania danych</label>
          <input name="weatherDataDownloadDate" type="date" value="${escapeHtml(selectedObject.weatherDataDownloadDate || "")}" style="width:100%;box-sizing:border-box;" />
        </div>
        <div class="tym-field">
          <label>Temperatura bazowa °C</label>
          <input name="baseTemperature" type="number" step="0.1" value="${escapeHtml(String(selectedObject.baseTemperature ?? 21))}"
            style="width:100%;box-sizing:border-box;" oninput="refreshPeriodHDD('billing');refreshPeriodHDD('comparison');refreshTymHDD();" />
        </div>
      </div>
      <div class="tym-field" style="margin-bottom:12px;">
        <label>Link do źródła danych</label>
        <input name="weatherSourceUrl" type="url" value="${escapeHtml(selectedObject.weatherSourceUrl || "")}" placeholder="https://..." style="width:100%;box-sizing:border-box;" />
      </div>

      <div class="tym-grid4">
        <div class="tym-field">
          <label>Jednostka energii</label>
          <select name="energyUnit" style="width:100%;">
            ${["GJ","MWh","kWh","m3","Gcal"].map(u => `<option value="${u}" ${(selectedObject.energyUnit||"GJ")===u?"selected":""}>${u==="m3"?"m³":u}</option>`).join("")}
          </select>
        </div>
        <div class="tym-field">
          <label>Waluta</label>
          <select name="currency" style="width:100%;">
            ${["PLN","EUR","CZK","GBP"].map(c => `<option value="${c}" ${(selectedObject.currency||"PLN")===c?"selected":""}>${c}</option>`).join("")}
          </select>
        </div>
        <div class="tym-field">
          <label>Cena energii (za jednostkę)</label>
          <input name="energyPrice" type="number" step="0.01" min="0" value="${escapeHtml(String(selectedObject.energyPrice||""))}" placeholder="np. 85.00" style="width:100%;box-sizing:border-box;" />
        </div>
        <div class="tym-field">
          <label>Udział WaterAI / ESCO (%)</label>
          <input name="waterAiShare" type="number" step="0.01" min="0" max="100" placeholder="np. 50" style="width:100%;box-sizing:border-box;" />
        </div>
      </div>
    </div>

    <!-- ═══ OKRES ROZLICZENIOWY — niebieski ═══ -->
    <div class="tym-section" style="border:1px solid #B5D4F4;">
      <div style="background:#E6F1FB;padding:12px 16px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;color:#185FA5;">📅</span>
        <h3 style="margin:0;font-size:15px;font-weight:500;color:#0C447C;">Okres rozliczeniowy</h3>
        <span style="font-size:11px;padding:2px 8px;border-radius:20px;background:#B5D4F4;color:#0C447C;">bieżący</span>
      </div>
      <div class="tym-body">
        <div class="tym-grid4">
          <div class="tym-field">
            <label>Data od</label>
            <input name="billingPeriodStartDate" type="date" required style="width:100%;box-sizing:border-box;"
              oninput="refreshPeriodTable('billing')" />
          </div>
          <div class="tym-field">
            <label>Data do</label>
            <input name="billingPeriodEndDate" type="date" required style="width:100%;box-sizing:border-box;"
              oninput="refreshPeriodTable('billing')" />
          </div>
          <div class="tym-field">
            <label>Odczyt startowy</label>
            <input name="billingPeriodStartReading" type="number" step="0.001" required style="width:100%;box-sizing:border-box;"
              oninput="refreshConsumption('billing')" />
          </div>
          <div class="tym-field">
            <label>Odczyt końcowy</label>
            <input name="billingPeriodEndReading" type="number" step="0.001" required style="width:100%;box-sizing:border-box;"
              oninput="refreshConsumption('billing')" />
          </div>
        </div>
        <table class="tym-table">
          <thead><tr>
            <th style="width:30%;">Miesiąc</th>
            <th style="width:22%;">Śr. temp. (°C)</th>
            <th style="width:18%;">Dni</th>
            <th style="width:30%;">HDD</th>
          </tr></thead>
          <tbody id="billing-months-tbody">
            <tr><td colspan="4" style="text-align:center;color:var(--color-text-tertiary);padding:14px;font-size:13px;">Wybierz daty aby zobaczyć miesiące</td></tr>
          </tbody>
        </table>
        <div class="tym-summary">
          <span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:500;padding:4px 12px;border-radius:20px;background:#B5D4F4;color:#0C447C;">
            🔥 HDD: <strong id="billing-hdd-display">—</strong>
          </span>
          <span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:500;padding:4px 12px;border-radius:20px;background:#E6F1FB;color:#0C447C;">
            ⚡ Zużycie: <strong id="billing-consumption-display">—</strong>
          </span>
        </div>
      </div>
    </div>

    <!-- ═══ OKRES PORÓWNAWCZY — zielony ═══ -->
    <div class="tym-section" style="border:1px solid #C0DD97;">
      <div style="background:#EAF3DE;padding:12px 16px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;color:#3B6D11;">📊</span>
        <h3 style="margin:0;font-size:15px;font-weight:500;color:#27500A;">Okres porównawczy</h3>
        <span style="font-size:11px;padding:2px 8px;border-radius:20px;background:#C0DD97;color:#27500A;">bazowy</span>
      </div>
      <div class="tym-body">
        <div class="tym-grid4">
          <div class="tym-field">
            <label>Data od</label>
            <input name="comparisonPeriodStartDate" type="date" required style="width:100%;box-sizing:border-box;"
              oninput="refreshPeriodTable('comparison')" />
          </div>
          <div class="tym-field">
            <label>Data do</label>
            <input name="comparisonPeriodEndDate" type="date" required style="width:100%;box-sizing:border-box;"
              oninput="refreshPeriodTable('comparison')" />
          </div>
          <div class="tym-field">
            <label>Odczyt startowy</label>
            <input name="comparisonPeriodStartReading" type="number" step="0.001" required style="width:100%;box-sizing:border-box;"
              oninput="refreshConsumption('comparison')" />
          </div>
          <div class="tym-field">
            <label>Odczyt końcowy</label>
            <input name="comparisonPeriodEndReading" type="number" step="0.001" required style="width:100%;box-sizing:border-box;"
              oninput="refreshConsumption('comparison')" />
          </div>
        </div>
        <table class="tym-table">
          <thead><tr>
            <th style="width:30%;">Miesiąc</th>
            <th style="width:22%;">Śr. temp. (°C)</th>
            <th style="width:18%;">Dni</th>
            <th style="width:30%;">HDD</th>
          </tr></thead>
          <tbody id="comparison-months-tbody">
            <tr><td colspan="4" style="text-align:center;color:var(--color-text-tertiary);padding:14px;font-size:13px;">Wybierz daty aby zobaczyć miesiące</td></tr>
          </tbody>
        </table>
        <div class="tym-summary">
          <span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:500;padding:4px 12px;border-radius:20px;background:#C0DD97;color:#27500A;">
            🔥 HDD: <strong id="comparison-hdd-display">—</strong>
          </span>
          <span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:500;padding:4px 12px;border-radius:20px;background:#EAF3DE;color:#27500A;">
            ⚡ Zużycie: <strong id="comparison-consumption-display">—</strong>
          </span>
        </div>
      </div>
    </div>

    <!-- ═══ TYM — pomarańczowy ═══ -->
    <div class="tym-section" style="border:1px solid #FAC775;">
      <div style="background:#FAEEDA;padding:12px 16px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;color:#854F0B;">❄️</span>
        <h3 style="margin:0;font-size:15px;font-weight:500;color:#633806;">Typowy rok meteorologiczny (TYM)</h3>
        <span style="font-size:11px;padding:2px 8px;border-radius:20px;background:#FAC775;color:#633806;">długoletni</span>
      </div>
      <div class="tym-body">
        <div class="tym-grid4">
          <div class="tym-field">
            <label>Okres TYM od (rok)</label>
            <input name="tymPeriodStart" type="text" placeholder="np. 1991" style="width:100%;box-sizing:border-box;" />
          </div>
          <div class="tym-field">
            <label>Okres TYM do (rok)</label>
            <input name="tymPeriodEnd" type="text" placeholder="np. 2020" style="width:100%;box-sizing:border-box;" />
          </div>
          <div class="tym-field" style="grid-column:span 2;">
            <label>Źródło danych TYM</label>
            <input name="tymDataSource" value="${escapeHtml(selectedObject.weatherSource || "WeatherOnline / Robot Klimatu")}" style="width:100%;box-sizing:border-box;" />
          </div>
        </div>
        <p class="tym-note">Wpisz ręcznie średnie temperatury miesięczne z WeatherOnline / Robot Klimatu. Dni uzupełniane automatycznie, można korygować.</p>
        <table class="tym-table">
          <thead><tr>
            <th style="width:30%;">Miesiąc</th>
            <th style="width:22%;">Śr. temp. TYM (°C)</th>
            <th style="width:18%;">Dni</th>
            <th style="width:30%;">HDD TYM</th>
          </tr></thead>
          <tbody>${tymMonthsRows}</tbody>
        </table>
        <div class="tym-summary">
          <span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:500;padding:4px 12px;border-radius:20px;background:#FAC775;color:#633806;">
            🔥 HDD TYM: <strong id="tym-hdd-display">—</strong>
          </span>
        </div>
      </div>
    </div>

    <!-- REGRESJA + NOTATKA + SUBMIT -->
    <div style="margin-bottom:16px;">
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;">
        <input name="includeLinearRegression" type="checkbox" />
        Dołącz analizę regresji liniowej jako załącznik do raportu
      </label>
      <p style="font-size:11px;color:var(--color-text-tertiary);margin:4px 0 0 24px;">
        Regresja liniowa to moduł analityczny — nie jest podstawą rozliczenia ESCO.
      </p>
    </div>

    <div style="margin-bottom:16px;">
      <label style="font-size:12px;color:var(--color-text-secondary);display:block;margin-bottom:4px;">Notatka</label>
      <input name="note" placeholder="Uwagi do protokołu, źródło danych, nietypowy okres itd." style="width:100%;box-sizing:border-box;" />
    </div>

    <div style="display:flex;gap:12px;">
      <button class="primary-button" type="submit">
        ${editingMeasurementId ? "Zapisz protokół" : "Dodaj protokół TYM"}
      </button>
      ${editingMeasurementId ? `<button class="small-button" type="button" onclick="cancelMeasurementEdit()">Anuluj edycję</button>` : ""}
    </div>

  </form>

  <div id="measurements-list" style="margin-top:24px;"></div>
  `;

  renderMeasurementsList();
}

function renderMeasurementsList() {
  const container = document.getElementById("measurements-list");
  if (!container) return;

  if (!selectedMeasurementObjectId) {
    container.innerHTML = `
      <div class="reminder-card">
        <strong>Brak wybranego obiektu</strong>
        <div class="reminder-meta">Wybierz klienta i obiekt, aby zobaczyć protokoły.</div>
      </div>
    `;
    return;
  }

  const protocols = MeasurementsModule.findByObject(selectedMeasurementObjectId);

  if (protocols.length === 0) {
    container.innerHTML = `
      <div class="reminder-card">
        <strong>Brak protokołów TYM</strong>
        <div class="reminder-meta">Dodaj pierwszy protokół TYM dla tego obiektu.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = protocols.map(item => {
    const r = item.escoResults || calcESCOResults(item);
    const unit = item.energyUnit || "GJ";
    const currency = item.currency || "PLN";
    const fmt2 = v => Number(v || 0).toFixed(2);
    const fmt3 = v => Number(v || 0).toFixed(3);

    return `
    <div class="reminder-card">
      <strong>Protokół TYM z dnia: ${escapeHtml(item.protocolDate || "brak daty")}</strong>

      <div class="reminder-meta">
        Klient: ${escapeHtml(getClientName(item.clientId))}<br />
        Obiekt: ${escapeHtml(getObjectName(item.objectId))}<br />
        Opracował: ${escapeHtml(item.preparedBy || item.energyAnalystOwner || "")}<br />
        Stacja met.: ${escapeHtml(item.weatherStation || "")}<br />
        Źródło danych: ${escapeHtml(item.weatherSource || "")}<br />
        ${item.weatherSourceUrl ? `<a href="${escapeHtml(item.weatherSourceUrl)}" target="_blank" rel="noopener">Link do danych klimatycznych</a><br />` : ""}
        Temperatura bazowa: ${escapeHtml(String(item.baseTemperature || 21))} °C
      </div>

      <div class="reminder-meta" style="margin-top:8px;">
        <strong>Okresy:</strong><br />
        Rozliczeniowy: ${escapeHtml(item.billingPeriodStartDate || "")} → ${escapeHtml(item.billingPeriodEndDate || "")}<br />
        Zużycie rozliczeniowe: <strong>${fmt3(item.billingConsumption)} ${unit}</strong><br /><br />
        Porównawczy: ${escapeHtml(item.comparisonPeriodStartDate || "")} → ${escapeHtml(item.comparisonPeriodEndDate || "")}<br />
        Zużycie porównawcze: <strong>${fmt3(item.comparisonConsumption)} ${unit}</strong>
      </div>

      <div class="reminder-meta" style="margin-top:8px;background:#f0f7f0;padding:8px;border-radius:4px;">
        <strong>Wyniki ESCO:</strong><br />
        HDD TYM: ${fmt2(r.hddTym)}<br />
        HDD rzeczywiste: ${fmt2(r.hddReal)}<br />
        Współczynnik korekcji klimatycznej: ${fmt2(r.climateCorrectionFactor)}<br />
        Zużycie porównawcze po korekcji: <strong>${fmt3(r.correctedComparisonConsumption)} ${unit}</strong><br />
        Oszczędność energii: <strong>${fmt3(r.savedEnergy)} ${unit}</strong><br />
        Oszczędność energii: <strong>${fmt2(r.savedEnergyPercent)} %</strong><br />
        Oszczędność finansowa: <strong>${fmt2(r.savedMoney)} ${currency}</strong><br />
        Udział WaterAI / ESCO: <strong>${fmt2(r.waterAiShare)} ${currency}</strong>
      </div>

      ${item.includeLinearRegression ? `
        <div class="reminder-meta" style="margin-top:6px;color:#666;">
          ☑ Analiza regresji liniowej dołączona jako załącznik
        </div>
      ` : ""}

      <div style="margin-top: 12px;">
        <button class="small-button" onclick="editMeasurement(${item.id})">Edytuj</button>
        <button class="small-button" onclick="deleteMeasurement(${item.id})">Usuń</button>
      </div>
    </div>
  `}).join("");
}

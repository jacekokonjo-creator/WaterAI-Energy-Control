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
  hideClientForm();
}
let editingClientId = null;
let editingObjectId = null;
let showObjectForm = false;

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

  showClientForm(true);
  window.scrollTo({ top: 0, behavior: "smooth" });
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


function viewClient(id) {
  const client = ClientsModule.find(id);
  if (!client) return;

  const countryLabel = { PL:"Polska", CZ:"Czechy", SK:"Słowacja", DE:"Niemcy", EN:"Inny" };
  const modelLabel = { ESCO:"ESCO", FLAT:"Abonament", PROJECT:"Projekt" };

  const contacts = (client.contacts || []).map(c => `
    <tr>
      <td style="padding:6px 10px;font-size:13px;">${escapeHtml(c.name||"")}</td>
      <td style="padding:6px 10px;font-size:13px;">${escapeHtml(c.role||"")}</td>
      <td style="padding:6px 10px;font-size:13px;">${escapeHtml(c.email||"")}</td>
      <td style="padding:6px 10px;font-size:13px;">${escapeHtml(c.phone||"")}</td>
    </tr>`).join("");

  const container = document.getElementById("module-content");
  if (!container) return;

  container.innerHTML = `
    <div style="max-width:720px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h2 style="margin:0;font-size:18px;font-weight:600;color:var(--color-text-primary);">
          👤 ${escapeHtml(client.name)}
        </h2>
        <div style="display:flex;gap:8px;">
          <button class="small-button" onclick="editClient(${client.id})">✏️ Edytuj</button>
          <button class="small-button" onclick="openModule('clients')">← Wróć</button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">

        <div style="border:1px solid var(--color-border-tertiary);border-radius:10px;padding:16px;">
          <div style="font-size:11px;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px;">Dane podstawowe</div>
          <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:4px;">NIP / VAT ID</div>
          <div style="font-size:14px;margin-bottom:12px;">${escapeHtml(client.vatId||"—")}</div>
          <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:4px;">Kraj</div>
          <div style="font-size:14px;margin-bottom:12px;">${escapeHtml(countryLabel[client.country]||client.country||"—")}</div>
          <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:4px;">Język</div>
          <div style="font-size:14px;">${escapeHtml(client.language||"—")}</div>
        </div>

        <div style="border:1px solid var(--color-border-tertiary);border-radius:10px;padding:16px;">
          <div style="font-size:11px;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px;">Adres</div>
          <div style="font-size:14px;line-height:1.7;">
            ${escapeHtml(client.street||"")} ${escapeHtml(client.buildingNumber||"")}${client.apartmentNumber?" / "+escapeHtml(client.apartmentNumber):""}<br/>
            ${escapeHtml(client.postalCode||"")} ${escapeHtml(client.city||"")}<br/>
            ${escapeHtml(countryLabel[client.country]||client.country||"")}
          </div>
          ${client.googleMapsUrl ? `<a href="${escapeHtml(client.googleMapsUrl)}" target="_blank" rel="noopener" style="font-size:12px;margin-top:8px;display:inline-block;">🗺️ Google Maps</a>` : ""}
        </div>

        <div style="border:1px solid var(--color-border-tertiary);border-radius:10px;padding:16px;">
          <div style="font-size:11px;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px;">Rozliczenia</div>
          <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:4px;">Model rozliczenia</div>
          <div style="font-size:14px;margin-bottom:12px;">${escapeHtml(modelLabel[client.settlementModel]||client.settlementModel||"—")}</div>
          <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:4px;">Udział ESCO (%)</div>
          <div style="font-size:14px;margin-bottom:12px;"><strong>${escapeHtml(String(client.escoShare||"—"))} %</strong></div>
          <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:4px;">Termin płatności</div>
          <div style="font-size:14px;">${escapeHtml(String(client.paymentDays||"—"))} dni</div>
        </div>

        <div style="border:1px solid var(--color-border-tertiary);border-radius:10px;padding:16px;">
          <div style="font-size:11px;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px;">Kontakt</div>
          <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:4px;">E-mail do faktur</div>
          <div style="font-size:14px;">${escapeHtml(client.invoiceEmail||"—")}</div>
        </div>

      </div>

      ${contacts ? `
      <div style="border:1px solid var(--color-border-tertiary);border-radius:10px;padding:16px;margin-bottom:16px;">
        <div style="font-size:11px;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px;">Osoby kontaktowe</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead><tr style="border-bottom:1px solid var(--color-border-tertiary);">
            <th style="text-align:left;padding:6px 10px;font-weight:500;color:var(--color-text-secondary);">Imię i nazwisko</th>
            <th style="text-align:left;padding:6px 10px;font-weight:500;color:var(--color-text-secondary);">Rola</th>
            <th style="text-align:left;padding:6px 10px;font-weight:500;color:var(--color-text-secondary);">E-mail</th>
            <th style="text-align:left;padding:6px 10px;font-weight:500;color:var(--color-text-secondary);">Telefon</th>
          </tr></thead>
          <tbody>${contacts}</tbody>
        </table>
      </div>` : ""}

      <div style="display:flex;gap:8px;margin-top:8px;">
        <button class="primary-button" onclick="openClientObjects(${client.id})">🏗️ Obiekty klienta</button>
        <button class="small-button" onclick="editClient(${client.id})">✏️ Edytuj klienta</button>
      </div>
    </div>
  `;
}

function showClientForm(editing) {
  const fc = document.getElementById("client-form-container");
  const cl = document.getElementById("clients-list");
  const title = document.getElementById("client-form-title");
  if (!fc) return;
  fc.style.display = "block";
  if (cl) cl.style.display = "none";
  if (title) title.textContent = editing ? "Edytuj klienta" : "Nowy klient";
  const btn = document.getElementById("client-submit-btn");
  if (btn) btn.textContent = editing ? "Zapisz zmiany" : "Dodaj klienta";
}

function hideClientForm() {
  const fc = document.getElementById("client-form-container");
  const cl = document.getElementById("clients-list");
  if (fc) fc.style.display = "none";
  if (cl) cl.style.display = "block";
  editingClientId = null;
  const form = document.querySelector("#client-form-container form");
  if (form) form.reset();
  const btn = document.getElementById("client-submit-btn");
  if (btn) btn.textContent = "Dodaj klienta";
  const title = document.getElementById("client-form-title");
  if (title) title.textContent = "Nowy klient";
  // re-render list
  renderClientsList();
}

function renderClientsList() {
  const container = document.getElementById("clients-list");
  if (!container) return;

  const clients = getClients();

  // Always show Add button + table
  const countryLabel = { PL:"Polska", CZ:"Czechy", SK:"Słowacja", DE:"Niemcy", EN:"Inny" };

  const tableRows = clients.length === 0
    ? `<tr><td colspan="4" style="padding:20px;text-align:center;color:var(--color-text-secondary);font-size:13px;">Brak klientów — dodaj pierwszego.</td></tr>`
    : clients.map(client => {
        const objCount = ObjectsModule.findByClient(client.id).length;
        return `<tr style="cursor:pointer;" onclick="openClientObjects(${client.id})">
          <td class="td-name" style="padding:10px 12px;">
            ${escapeHtml(client.name)}
            <div class="td-sub">${escapeHtml(client.city || "")}${client.city && client.postalCode ? ", " : ""}${escapeHtml(client.postalCode || "")}</div>
          </td>
          <td style="padding:10px 12px;font-size:13px;">${escapeHtml(client.vatId || "—")}</td>
          <td style="padding:10px 12px;font-size:13px;">${escapeHtml(countryLabel[client.country] || client.country || "—")}</td>
          <td style="padding:10px 12px;">
            <button class="small-button" onclick="event.stopPropagation();openClientObjects(${client.id})" style="background:#185FA5;color:#fff;border-color:#185FA5;white-space:nowrap;">
              🏗️ Obiekty (${objCount})
            </button>
            <button class="small-button" onclick="event.stopPropagation();viewClient(${client.id});openModule('clients')" style="white-space:nowrap;">Podgląd</button>
            <button class="small-button" onclick="event.stopPropagation();editClient(${client.id})" style="white-space:nowrap;">Edytuj</button>
            <button class="small-button" onclick="event.stopPropagation();deleteClient(${client.id})" style="white-space:nowrap;">Usuń</button>
          </td>
        </tr>`;
      }).join("");

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
      <h3 style="margin:0;font-size:15px;font-weight:500;color:var(--color-text-primary);">
        Klienci <span style="font-size:12px;color:var(--color-text-secondary);font-weight:400;">(${clients.length})</span>
      </h3>
      <button class="primary-button" onclick="showClientForm(false)" style="font-size:13px;padding:7px 16px;">
        + Dodaj klienta
      </button>
    </div>
    <div style="overflow-x:auto;border:1px solid var(--color-border-tertiary);border-radius:10px;">
      <table class="cli-table">
        <thead>
          <tr>
            <th>Nazwa klienta</th>
            <th>VAT ID</th>
            <th>Kraj</th>
            <th style="width:220px;">Akcje</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>
  `;
}

// ─── Widok obiektów konkretnego klienta (drill-down) ─────────────────────────

let currentClientViewId = null;

function openClientObjects(clientId) {
  currentClientViewId = Number(clientId);
  const client = ClientsModule.find(clientId);
  const container = document.getElementById("clients-list");
  if (!container) return;

  const objects = ObjectsModule.findByClient(clientId);

  const objectCards = objects.length === 0
    ? `<div class="reminder-card"><strong>Brak obiektów</strong><div class="reminder-meta">Ten klient nie ma jeszcze żadnych obiektów. Dodaj obiekt w module Obiekty.</div></div>`
    : objects.map(obj => {
        const protocols = MeasurementsModule.findByObject(obj.id);
        const protCount = protocols.length;
        return `
        <div class="reminder-card" style="border-left:4px solid #185FA5;">
          <strong>${escapeHtml(obj.name || "Obiekt bez nazwy")}</strong>
          <div class="reminder-meta">
            Typ: ${escapeHtml(obj.objectType || "")}<br />
            Status: ${escapeHtml(obj.status || "")}<br />
            Adres: ${escapeHtml(obj.postalCode || "")} ${escapeHtml(obj.city || "")}, ${escapeHtml(obj.street || "")} ${escapeHtml(obj.buildingNumber || "")}<br />
            Energy Analyst: ${escapeHtml(obj.energyAnalystOwner || "—")}<br />
            Protokołów TYM: <strong>${protCount}</strong>
          </div>
          <div style="margin-top:10px;">
            <button class="small-button" onclick="openObjectProtocols(${obj.id})" style="background:#27500A;color:#fff;border-color:#27500A;">
              📋 Protokoły TYM (${protCount})
            </button>
            <button class="small-button" onclick="editObject(${obj.id});openModule('objects');">Edytuj obiekt</button>
          </div>
        </div>
        `;
      }).join("");

  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
      <button class="small-button" onclick="renderClientsList()" style="font-size:13px;">← Wszyscy klienci</button>
      <h3 style="margin:0;font-size:16px;color:#0C447C;">🏢 ${escapeHtml(client ? client.name : "Klient")}</h3>
    </div>
    ${objectCards}
  `;
}

function openObjectProtocols(objectId) {
  selectedMeasurementObjectId = Number(objectId);
  const obj = ObjectsModule.find(objectId);
  const clientId = obj ? obj.clientId : null;
  const container = document.getElementById("clients-list");
  if (!container) return;

  const protocols = MeasurementsModule.findByObject(objectId);
  const unit = (obj && obj.energyUnit) || "GJ";
  const currency = (obj && obj.currency) || "PLN";
  const fmt2 = v => Number(v || 0).toFixed(2);
  const fmt3 = v => Number(v || 0).toFixed(3);

  const protocolCards = protocols.length === 0
    ? `<div class="reminder-card"><strong>Brak protokołów TYM</strong><div class="reminder-meta">Dodaj pierwszy protokół w module Pomiary / Protokół TYM.</div></div>`
    : protocols.map(item => {
        const r = item.escoResults || calcESCOResults(item);
        const u = item.energyUnit || unit;
        const cur = item.currency || currency;
        return `
        <div class="reminder-card" style="border-left:4px solid #27500A;">
          <strong>📋 Protokół TYM: ${escapeHtml(item.protocolDate || "brak daty")}</strong>
          <div class="reminder-meta">
            Opracował: ${escapeHtml(item.preparedBy || "")}<br />
            Rozliczeniowy: ${escapeHtml(item.billingPeriodStartDate || "")} → ${escapeHtml(item.billingPeriodEndDate || "")}<br />
            Zużycie rozliczeniowe: <strong>${fmt3(item.billingConsumption)} ${u}</strong><br />
            Porównawczy: ${escapeHtml(item.comparisonPeriodStartDate || "")} → ${escapeHtml(item.comparisonPeriodEndDate || "")}<br />
            Zużycie porównawcze: <strong>${fmt3(item.comparisonConsumption)} ${u}</strong>
          </div>
          <div class="reminder-meta" style="margin-top:8px;background:#f0f7f0;padding:10px;border-radius:6px;">
            <strong>Wyniki ESCO:</strong><br />
            Oszczędność energii: <strong>${fmt3(r.savedEnergy)} ${u} (${fmt2(r.savedEnergyPct)} %)</strong><br />
            Oszczędność finansowa: <strong>${fmt2(r.savedMoney)} ${cur}</strong><br />
            Udział WaterAI: <strong>${fmt2(r.waterAiShare)} ${cur}</strong>
          </div>
          <div style="margin-top:10px;">
            <button class="small-button" onclick="editMeasurement(${item.id});openModule('measurements');">Edytuj protokół</button>
            <button class="small-button" onclick="if(confirm('Usuń protokół?')){MeasurementsModule.remove(${item.id});openObjectProtocols(${objectId});}">Usuń</button>
          </div>
        </div>
        `;
      }).join("");

  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
      <button class="small-button" onclick="openClientObjects(${clientId})" style="font-size:13px;">← Obiekty klienta</button>
      <h3 style="margin:0;font-size:16px;color:#27500A;">📋 ${escapeHtml(obj ? obj.name : "Obiekt")} — Protokoły TYM</h3>
    </div>
    <div style="margin-bottom:16px;">
      <button class="primary-button" onclick="selectedMeasurementObjectId=${objectId};openModule('measurements');" style="font-size:13px;">
        + Dodaj nowy protokół TYM
      </button>
    </div>
    ${protocolCards}
  `;
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
  showObjectForm = false;
  editingObjectId = null;
  renderObjectsModule();
}


function viewObject(id) {
  const obj = ObjectsModule.find(id);
  if (!obj) return;

  const client = ClientsModule.find(obj.clientId);
  const protocols = MeasurementsModule.findByObject(id);

  const objTypeLabel = {
    HOTEL:"Hotel", SCHOOL:"Szkoła", KINDERGARTEN:"Przedszkole",
    OFFICE:"Urząd/administracja", HOUSING_COMMUNITY:"Wspólnota mieszkaniowa",
    COOPERATIVE:"Spółdzielnia", INDUSTRY:"Zakład przemysłowy",
    OFFICE_BUILDING:"Biurowiec", HOSPITAL:"Szpital", OTHER:"Inne"
  };
  const objStatusLabel = { IMPLEMENTATION:"Wdrożenie", ACTIVE:"Aktywny", PAUSED:"Wstrzymany", FINISHED:"Zakończony" };
  const objStatusColor = { IMPLEMENTATION:"#185FA5", ACTIVE:"#27500A", PAUSED:"#7A4A00", FINISHED:"#666" };
  const heatLabel = { NONE:"Brak", GAS:"Gaz", COAL:"Węgiel", OIL:"Olej", ELECTRIC:"Elektryczne", HEAT_PUMP:"Pompa ciepła", DISTRICT:"Ciepło sieciowe", OTHER:"Inne" };
  const readingLabel = { INVOICE:"Faktura", METER:"Licznik", SUBSTATION:"Węzeł cieplny" };

  const statusColor = objStatusColor[obj.status] || "#666";
  const fmt2 = v => Number(v||0).toFixed(2);

  const protRows = protocols.map(p => {
    const r = p.escoResults || calcESCOResults(p);
    return `<tr>
      <td style="padding:7px 10px;font-size:13px;">${escapeHtml(p.protocolDate||"—")}</td>
      <td style="padding:7px 10px;font-size:13px;">${escapeHtml(p.billingPeriodStartDate||"")} → ${escapeHtml(p.billingPeriodEndDate||"")}</td>
      <td style="padding:7px 10px;font-size:13px;text-align:right;">${Number(p.billingConsumption||0).toFixed(3)} ${escapeHtml(p.energyUnit||"")}</td>
      <td style="padding:7px 10px;font-size:13px;text-align:right;color:${r.savedEnergyPct>=0?"#27500A":"#c00"};">
        ${fmt2(r.savedEnergyPct)} %
      </td>
      <td style="padding:7px 10px;white-space:nowrap;">
        <button class="small-button" onclick="viewProtocol(${p.id})">Podgląd</button>
        <button class="small-button" onclick="editMeasurement(${p.id});openModule('measurements')">Edytuj</button>
      </td>
    </tr>`;
  }).join("");

  const container = document.getElementById("module-content");
  if (!container) return;

  container.innerHTML = `
    <div style="max-width:720px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <div>
          <div style="font-size:12px;color:var(--color-text-secondary);margin-bottom:4px;">
            ${escapeHtml(client ? client.name : "")}
          </div>
          <h2 style="margin:0;font-size:18px;font-weight:600;color:var(--color-text-primary);">
            🏗️ ${escapeHtml(obj.name||"—")}
            <span style="font-size:12px;font-weight:600;padding:2px 10px;border-radius:20px;background:${statusColor}22;color:${statusColor};margin-left:8px;">
              ${escapeHtml(objStatusLabel[obj.status]||obj.status||"")}
            </span>
          </h2>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="small-button" onclick="showObjectForm=true;editingObjectId=null;editObject(${obj.id})">✏️ Edytuj</button>
          <button class="small-button" onclick="openModule('objects')">← Wróć</button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">

        <div style="border:1px solid var(--color-border-tertiary);border-radius:10px;padding:16px;">
          <div style="font-size:11px;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px;">Lokalizacja</div>
          <div style="font-size:14px;line-height:1.7;">
            ${escapeHtml(obj.street||"")} ${escapeHtml(obj.buildingNumber||"")}${obj.apartmentNumber?" / "+escapeHtml(obj.apartmentNumber):""}<br/>
            ${escapeHtml(obj.postalCode||"")} ${escapeHtml(obj.city||"")}
          </div>
          ${obj.googleMapsUrl ? `<a href="${escapeHtml(obj.googleMapsUrl)}" target="_blank" rel="noopener" style="font-size:12px;margin-top:8px;display:inline-block;">🗺️ Google Maps</a>` : ""}
          <div style="margin-top:12px;font-size:13px;color:var(--color-text-secondary);">Typ obiektu</div>
          <div style="font-size:14px;">${escapeHtml(objTypeLabel[obj.objectType]||obj.objectType||"—")}</div>
        </div>

        <div style="border:1px solid var(--color-border-tertiary);border-radius:10px;padding:16px;">
          <div style="font-size:11px;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px;">Ogrzewanie</div>
          <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:4px;">Źródło CO</div>
          <div style="font-size:14px;margin-bottom:10px;">${escapeHtml(heatLabel[obj.heatingSourceCO]||obj.heatingSourceCO||"—")}</div>
          <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:4px;">Źródło CWU</div>
          <div style="font-size:14px;margin-bottom:10px;">${escapeHtml(heatLabel[obj.heatingSourceCWU]||obj.heatingSourceCWU||"—")}</div>
          <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:4px;">Odczyt zużycia</div>
          <div style="font-size:14px;">${escapeHtml(readingLabel[obj.heatConsumptionReading]||obj.heatConsumptionReading||"—")}</div>
        </div>

        <div style="border:1px solid var(--color-border-tertiary);border-radius:10px;padding:16px;">
          <div style="font-size:11px;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px;">Dane klimatyczne</div>
          <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:4px;">Stacja meteo</div>
          <div style="font-size:14px;margin-bottom:10px;">${escapeHtml(obj.weatherStation||"—")}</div>
          <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:4px;">Źródło danych</div>
          <div style="font-size:14px;margin-bottom:10px;">${escapeHtml(obj.weatherSource||"—")}</div>
          <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:4px;">Temperatura bazowa</div>
          <div style="font-size:14px;">${escapeHtml(String(obj.baseTemperature??21))} °C</div>
        </div>

        <div style="border:1px solid var(--color-border-tertiary);border-radius:10px;padding:16px;">
          <div style="font-size:11px;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px;">Dane energetyczne</div>
          <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:4px;">Jednostka energii</div>
          <div style="font-size:14px;margin-bottom:10px;">${escapeHtml(obj.energyUnit||"—")}</div>
          <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:4px;">Waluta</div>
          <div style="font-size:14px;margin-bottom:10px;">${escapeHtml(obj.currency||"—")}</div>
          <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:4px;">Cena energii</div>
          <div style="font-size:14px;">${escapeHtml(String(obj.energyPrice||"—"))} ${escapeHtml(obj.currency||"")}</div>
        </div>

      </div>

      <div style="border:1px solid var(--color-border-tertiary);border-radius:10px;padding:16px;margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div style="font-size:11px;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:.5px;">
            Protokoły TYM (${protocols.length})
          </div>
          <button class="primary-button" style="font-size:12px;padding:5px 12px;" onclick="openObjectMeasurements(${obj.id})">
            + Dodaj protokół
          </button>
        </div>
        ${protocols.length === 0
          ? `<div style="font-size:13px;color:var(--color-text-secondary);">Brak protokołów dla tego obiektu.</div>`
          : `<table style="width:100%;border-collapse:collapse;font-size:13px;">
              <thead><tr style="border-bottom:1px solid var(--color-border-tertiary);">
                <th style="text-align:left;padding:7px 10px;font-weight:500;color:var(--color-text-secondary);">Data protokołu</th>
                <th style="text-align:left;padding:7px 10px;font-weight:500;color:var(--color-text-secondary);">Okres rozliczeniowy</th>
                <th style="text-align:right;padding:7px 10px;font-weight:500;color:var(--color-text-secondary);">Zużycie</th>
                <th style="text-align:right;padding:7px 10px;font-weight:500;color:var(--color-text-secondary);">Oszczędność</th>
                <th style="padding:7px 10px;"></th>
              </tr></thead>
              <tbody>${protRows}</tbody>
            </table>`
        }
      </div>

      <div style="display:flex;gap:8px;">
        <button class="small-button" onclick="showObjectForm=true;editingObjectId=null;editObject(${obj.id})">✏️ Edytuj obiekt</button>
        <button class="small-button" onclick="viewClient(${obj.clientId});openModule('clients')">👤 Podgląd klienta</button>
      </div>
    </div>
  `;
}

function editObject(id) {
  const object = ObjectsModule.find(id);
  if (!object) return;

  editingObjectId = id;
  showObjectForm = true;
  renderObjectsModule();

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

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteObject(id) {
  if (!confirm("Czy na pewno usunąć obiekt?")) return;
  ObjectsModule.remove(id);
  showObjectForm = false;
  editingObjectId = null;
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

  const allObjects = getObjects();
  const objTypeLabel = {
    HOTEL:"Hotel", SCHOOL:"Szkoła", KINDERGARTEN:"Przedszkole",
    OFFICE:"Urząd/administracja", HOUSING_COMMUNITY:"Wspólnota mieszkaniowa",
    COOPERATIVE:"Spółdzielnia", INDUSTRY:"Zakład przemysłowy",
    OFFICE_BUILDING:"Biurowiec", HOSPITAL:"Szpital", OTHER:"Inne"
  };
  const objStatusLabel = {
    IMPLEMENTATION:"Wdrożenie", ACTIVE:"Aktywny",
    PAUSED:"Wstrzymany", FINISHED:"Zakończony"
  };
  const objStatusColor = {
    IMPLEMENTATION:"#185FA5", ACTIVE:"#27500A", PAUSED:"#7A4A00", FINISHED:"#666"
  };

  const tableRows = allObjects.length === 0
    ? `<tr><td colspan="5" style="padding:20px;text-align:center;color:var(--color-text-secondary);font-size:13px;">Brak obiektów — kliknij "+ Dodaj obiekt".</td></tr>`
    : allObjects.map(obj => {
        const statusColor = objStatusColor[obj.status] || "#666";
        const protCount = MeasurementsModule.findByObject(obj.id).length;
        return `<tr style="cursor:pointer;" onclick="openObjectMeasurements(${obj.id})">
          <td style="padding:10px 12px;font-size:13px;">${escapeHtml(getClientName(obj.clientId))}</td>
          <td style="padding:10px 12px;font-size:13px;font-weight:500;">${escapeHtml(obj.name || "—")}</td>
          <td style="padding:10px 12px;font-size:13px;">${escapeHtml(objTypeLabel[obj.objectType] || obj.objectType || "—")}</td>
          <td style="padding:10px 12px;">
            <span style="font-size:11px;font-weight:600;padding:2px 9px;border-radius:20px;background:${statusColor}22;color:${statusColor};">
              ${escapeHtml(objStatusLabel[obj.status] || obj.status || "—")}
            </span>
          </td>
          <td style="padding:10px 12px;white-space:nowrap;">
            <button class="small-button" onclick="event.stopPropagation();openObjectMeasurements(${obj.id})" style="white-space:nowrap;">📋 Protokoły (${protCount})</button>
            <button class="small-button" onclick="event.stopPropagation();viewObject(${obj.id});openModule('objects')" style="white-space:nowrap;">Podgląd</button>
            <button class="small-button" onclick="event.stopPropagation();showObjectForm=true;editingObjectId=null;editObject(${obj.id});" style="white-space:nowrap;">Edytuj</button>
            <button class="small-button" onclick="event.stopPropagation();deleteObject(${obj.id})" style="white-space:nowrap;">Usuń</button>
          </td>
        </tr>`;
      }).join("");

  container.innerHTML = `
    <style>
      .obj-section { margin-bottom:20px; border-radius:10px; overflow:hidden; }
      .obj-body { padding:16px; background:var(--color-background-primary); }
      .obj-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px; }
      .obj-grid3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:12px; }
      .obj-grid4 { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:12px; margin-bottom:12px; }
      .obj-field label { font-size:12px; color:var(--color-text-secondary); display:block; margin-bottom:4px; }
      .obj-field input, .obj-field select { width:100%; box-sizing:border-box; }
    </style>

    <!-- TABELA OBIEKTÓW -->
    <div id="objects-table-view" style="${"display:" + (showObjectForm ? "none" : "block")}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <h3 style="margin:0;font-size:15px;font-weight:500;color:var(--color-text-primary);">
          Obiekty <span style="font-size:12px;color:var(--color-text-secondary);font-weight:400;">(${allObjects.length})</span>
        </h3>
        <button class="primary-button" onclick="showObjectForm=true;editingObjectId=null;renderObjectsModule();" style="font-size:13px;padding:7px 16px;">
          + Dodaj obiekt
        </button>
      </div>
      <div style="overflow-x:auto;border:1px solid var(--color-border-tertiary);border-radius:10px;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:var(--color-background-secondary);">
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Klient</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Nazwa obiektu</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Typ obiektu</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Status</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Akcje</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
    </div>

    <!-- FORMULARZ OBIEKTU -->
    <div id="objects-form-view" style="${"display:" + (showObjectForm ? "block" : "none")}">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <button class="small-button" type="button" onclick="showObjectForm=false;editingObjectId=null;renderObjectsModule();" style="font-size:13px;">← Wróć do listy</button>
        <h3 style="margin:0;font-size:16px;color:#0C447C;">${editingObjectId ? "Edytuj obiekt" : "Nowy obiekt"}</h3>
      </div>
      <form onsubmit="createObject(this); return false;">

      <!-- DANE PODSTAWOWE -->
      <div class="obj-section" style="border:1px solid #B5D4F4;">
        <div style="background:#E6F1FB;padding:12px 16px;display:flex;align-items:center;gap:10px;">
          <span style="font-size:18px;">🏗️</span>
          <h3 style="margin:0;font-size:15px;font-weight:500;color:#0C447C;">Dane podstawowe obiektu</h3>
        </div>
        <div class="obj-body">
          <div class="obj-grid4">
            <div class="obj-field">
              <label>Klient</label>
              <select name="clientId" required>
                ${clients.map(client => `<option value="${client.id}">${escapeHtml(client.name)}</option>`).join("")}
              </select>
            </div>
            <div class="obj-field">
              <label>Nazwa obiektu</label>
              <input name="name" required placeholder="np. Hotel Warszawa" />
            </div>
            <div class="obj-field">
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
            <div class="obj-field">
              <label>Status obiektu</label>
              <select name="status">
                <option value="IMPLEMENTATION">Wdrożenie</option>
                <option value="ACTIVE">Aktywny</option>
                <option value="PAUSED">Wstrzymany</option>
                <option value="FINISHED">Zakończony</option>
              </select>
            </div>
          </div>
          <div class="obj-grid2">
            <div class="obj-field">
              <label>Opiekun Back Office</label>
              <input name="backOfficeOwner" placeholder="np. Anna Kowalska" />
            </div>
            <div class="obj-field">
              <label>Opiekun Energy Analyst</label>
              <input name="energyAnalystOwner" placeholder="np. Petr Novak" />
            </div>
          </div>
        </div>
      </div>

      <!-- ADRES -->
      <div class="obj-section" style="border:1px solid #B8E0C8;">
        <div style="background:#E6F5EC;padding:12px 16px;display:flex;align-items:center;gap:10px;">
          <span style="font-size:18px;">📍</span>
          <h3 style="margin:0;font-size:15px;font-weight:500;color:#1A6B3C;">Adres obiektu</h3>
        </div>
        <div class="obj-body">
          <div class="obj-grid3">
            <div class="obj-field">
              <label>Kraj</label>
              <select name="country">
                <option value="PL">Polska</option>
                <option value="CZ">Czechy</option>
                <option value="SK">Słowacja</option>
                <option value="AT">Austria</option>
                <option value="DE">Niemcy</option>
                <option value="GB">Wielka Brytania</option>
              </select>
            </div>
            <div class="obj-field">
              <label>Kod pocztowy</label>
              <input name="postalCode" placeholder="np. 00-001" />
            </div>
            <div class="obj-field">
              <label>Miasto</label>
              <input name="city" placeholder="np. Warszawa" />
            </div>
            <div class="obj-field">
              <label>Ulica</label>
              <input name="street" placeholder="np. Prosta" />
            </div>
            <div class="obj-field">
              <label>Nr budynku</label>
              <input name="buildingNumber" placeholder="np. 10" />
            </div>
            <div class="obj-field">
              <label>Nr lokalu</label>
              <input name="apartmentNumber" placeholder="opcjonalnie" />
            </div>
          </div>
          <div class="obj-field">
            <label>Google Maps URL</label>
            <input name="googleMapsUrl" type="url" placeholder="https://maps.google.com/..." style="width:100%;box-sizing:border-box;" />
          </div>
        </div>
      </div>

      <!-- SYSTEM GRZEWCZY -->
      <div class="obj-section" style="border:1px solid #F4D4A0;">
        <div style="background:#FDF3E0;padding:12px 16px;display:flex;align-items:center;gap:10px;">
          <span style="font-size:18px;">🔥</span>
          <h3 style="margin:0;font-size:15px;font-weight:500;color:#7A4A00;">System grzewczy i rozliczeniowy</h3>
        </div>
        <div class="obj-body">
          <div class="obj-grid3">
            <div class="obj-field">
              <label>Źródło ciepła C.O.</label>
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
            <div class="obj-field">
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
            <div class="obj-field">
              <label>Odczyt zużycia ciepła</label>
              <select name="heatConsumptionReading">
                <option value="ONLINE">On-line</option>
                <option value="CLIENT">Podawany przez Klienta</option>
                <option value="WATERAI">Wykonywany przez WAI</option>
                <option value="INVOICE">Z FV</option>
              </select>
            </div>
          </div>
          <div class="obj-field" style="margin-bottom:12px;">
            <label>Szczegóły odczytu</label>
            <input name="heatConsumptionReadingDetails" placeholder="np. SUPLA, Modbus TCP, licznik Kamstrup..." style="width:100%;box-sizing:border-box;" />
          </div>
          <div class="obj-grid3">
            <div class="obj-field">
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
            <div class="obj-field" id="billingStartDateContainer">
              <label>Data pierwszego rozliczenia</label>
              <input name="billingStartDate" type="date" />
            </div>
            <div class="obj-field">
              <label>Przypomnij przed terminem (dni)</label>
              <input name="reminderDaysBefore" type="number" min="0" value="14" />
            </div>
          </div>
          <div id="manualDatesContainer" style="display:none;">
            <label style="font-size:12px;color:var(--color-text-secondary);">Daty rozliczeń</label>
            <div id="manualDatesList"></div>
            <button type="button" class="small-button" onclick="addManualBillingDate()">Dodaj datę</button>
          </div>
        </div>
      </div>

      <!-- DANE KLIMATYCZNE -->
      <div class="obj-section" style="border:1px solid #B5C8F4;">
        <div style="background:#E8EDFB;padding:12px 16px;display:flex;align-items:center;gap:10px;">
          <span style="font-size:18px;">🌡️</span>
          <h3 style="margin:0;font-size:15px;font-weight:500;color:#0C2C7C;">Dane klimatyczne (TYM)</h3>
          <span style="font-size:11px;color:#0C2C7C;">zwykle stałe dla obiektu</span>
        </div>
        <div class="obj-body">
          <div class="obj-grid3">
            <div class="obj-field">
              <label>Stacja meteorologiczna</label>
              <input name="weatherStation" placeholder="np. Warszawa-Okęcie" />
            </div>
            <div class="obj-field">
              <label>Źródło danych klimatycznych</label>
              <input name="weatherSource" value="WeatherOnline / Robot Klimatu" />
            </div>
            <div class="obj-field">
              <label>Temperatura bazowa (°C)</label>
              <input name="baseTemperature" type="number" step="0.1" value="21" />
            </div>
          </div>
          <div class="obj-grid2">
            <div class="obj-field">
              <label>Link do źródła danych (WeatherOnline / Robot Klimatu)</label>
              <input name="weatherSourceUrl" type="url" placeholder="https://..." />
            </div>
            <div class="obj-field">
              <label>Data pobrania danych klimatycznych</label>
              <input name="weatherDataDownloadDate" type="date" />
            </div>
          </div>
        </div>
      </div>

      <!-- DANE ENERGETYCZNE -->
      <div class="obj-section" style="border:1px solid #C8B5F4;">
        <div style="background:#EDE8FB;padding:12px 16px;display:flex;align-items:center;gap:10px;">
          <span style="font-size:18px;">⚡</span>
          <h3 style="margin:0;font-size:15px;font-weight:500;color:#3D0C7C;">Dane energetyczne</h3>
          <span style="font-size:11px;color:#3D0C7C;">zwykle stałe dla obiektu</span>
        </div>
        <div class="obj-body">
          <div class="obj-grid3">
            <div class="obj-field">
              <label>Jednostka energii</label>
              <select name="energyUnit">
                <option value="GJ">GJ</option>
                <option value="MWh">MWh</option>
                <option value="kWh">kWh</option>
                <option value="m3">m³</option>
                <option value="Gcal">Gcal</option>
              </select>
            </div>
            <div class="obj-field">
              <label>Waluta</label>
              <select name="currency">
                <option value="PLN">PLN</option>
                <option value="EUR">EUR</option>
                <option value="CZK">CZK</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <div class="obj-field">
              <label>Cena energii (za jednostkę)</label>
              <input name="energyPrice" type="number" step="0.01" min="0" placeholder="np. 85.00" />
            </div>
          </div>
        </div>
      </div>

      <div style="margin-top:8px;display:flex;gap:10px;">
        <button class="primary-button" type="submit">${editingObjectId ? "Zapisz zmiany" : "Dodaj obiekt"}</button>
        <button class="small-button" type="button" onclick="showObjectForm=false;editingObjectId=null;renderObjectsModule();">Anuluj</button>
      </div>

      </form>
    </div>
  `;
}

function renderObjectsList() {
  // Zastąpione przez tabelę w renderObjectsModule
  renderObjectsModule();
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
let activeMeasurementsTab = "tym"; // "tym" | "regression"
let showMeasurementForm = false;

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
    const tVal = form[`tymTemp_${month}`]?.value;
    const dVal = form[`tymDays_${month}`]?.value;
    return {
      month,
      monthName,
      tymTemperature: tVal !== "" && tVal !== undefined ? Number(tVal) : null,
      tymDays: dVal !== "" && dVal !== undefined ? Number(dVal) : 0
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
  const base = Number(protocol.baseTemperature ?? 21);

  // TYM — 12 miesięcy stałych (hddTym per okres rozliczeniowy i porównawczy)
  const tymMonthly        = protocol.tymMonthly        || [];
  const billingMonthly    = protocol.realMonthly        || [];  // temp rzecz. okresu rozliczeniowego
  const comparisonMonthly = protocol.comparisonMonthly  || [];  // temp rzecz. okresu porównawczego

  // HDD liczone tylko dla miesięcy z przypisanymi dniami > 0
  // calcHDD już obsługuje dni=0 (wynik 0 dla tego miesiąca) i temp ujemne (diff > base)

  // HDD TYM dla okresu ROZLICZENIOWEGO — używamy dni z tabelki rozliczeniowej, temp z TYM
  // Musimy dopasować miesiące: billingMonthly[month] × tymMonthly[month].tymTemperature
  const hddTymBilling = billingMonthly.reduce((sum, bm) => {
    // znajdź odpowiedni miesiąc TYM (1-based month)
    const tym = tymMonthly.find(t => t.month === bm.month);
    if (!tym) return sum;
    const tymTemp = Number(tym.tymTemperature ?? tym.temperature ?? 0);
    const days    = Number(bm.days ?? 0);
    return sum + Math.max(0, base - tymTemp) * days;
  }, 0);

  // HDD rzeczywiste dla okresu ROZLICZENIOWEGO
  const hddRealBilling = billingMonthly.reduce((sum, bm) => {
    const temp = Number(bm.temperature ?? 0);
    const days = Number(bm.days ?? 0);
    return sum + Math.max(0, base - temp) * days;
  }, 0);

  // HDD TYM dla okresu PORÓWNAWCZEGO — dni z tabelki porównawczej, temp z TYM
  const hddTymComparison = comparisonMonthly.reduce((sum, cm) => {
    const tym = tymMonthly.find(t => t.month === cm.month);
    if (!tym) return sum;
    const tymTemp = Number(tym.tymTemperature ?? tym.temperature ?? 0);
    const days    = Number(cm.days ?? 0);
    return sum + Math.max(0, base - tymTemp) * days;
  }, 0);

  // HDD rzeczywiste dla okresu PORÓWNAWCZEGO
  const hddRealComparison = comparisonMonthly.reduce((sum, cm) => {
    const temp = Number(cm.temperature ?? 0);
    const days = Number(cm.days ?? 0);
    return sum + Math.max(0, base - temp) * days;
  }, 0);

  const billingConsumption    = Number(protocol.billingConsumption    ?? 0);
  const comparisonConsumption = Number(protocol.comparisonConsumption ?? 0);
  const energyPrice           = Number(protocol.energyPrice           ?? 0);
  const waterAiSharePct       = Number(protocol.waterAiShare          ?? 0);

  // Liczba dni każdego okresu
  const billingDays    = billingMonthly.reduce((s, m) => s + Number(m.days ?? 0), 0);
  const comparisonDays = comparisonMonthly.reduce((s, m) => s + Number(m.days ?? 0), 0);

  // Współczynniki korekty klimatycznej k = HDD_TYM / HDD_rzecz  (per okres)
  const kBilling    = hddRealBilling    > 0 ? hddTymBilling    / hddRealBilling    : 0;
  const kComparison = hddRealComparison > 0 ? hddTymComparison / hddRealComparison : 0;

  // Zużycie skorygowane do TYM
  const billingCorrected    = billingConsumption    * kBilling;
  const comparisonCorrected = comparisonConsumption * kComparison;

  // Wskaźnik energetyczny E = zużycie_skor / HDD_TYM  [jednostka/HDD]
  const eBilling    = hddTymBilling    > 0 ? billingCorrected    / hddTymBilling    : 0;
  const eComparison = hddTymComparison > 0 ? comparisonCorrected / hddTymComparison : 0;

  // Zużycie dobowe skorygowane = zużycie_TYM / liczba_dni
  const dailyBilling    = billingDays    > 0 ? billingCorrected    / billingDays    : 0;
  const dailyComparison = comparisonDays > 0 ? comparisonCorrected / comparisonDays : 0;

  // OSZCZĘDNOŚĆ — porównawcze przeliczone proporcjonalnie na dni rozliczeniowego, oba skor. do TYM
  // (jak w Excelu: E_porówn × HDD_TYM_rozlicz)
  const comparisonCorrectedScaled = eComparison * hddTymBilling;
  const savedEnergy       = comparisonCorrectedScaled - billingCorrected;
  const savedEnergyPct    = comparisonCorrectedScaled > 0
    ? (savedEnergy / comparisonCorrectedScaled) * 100
    : 0;
  const savedMoney        = savedEnergy * energyPrice;
  const waterAiShare      = savedMoney * (waterAiSharePct / 100);

  // PROGNOZA ROCZNA — wskaźnik z rozliczeniowego × HDD_TYM porównawczego (pełny rok)
  const forecastConsumptionWith    = eBilling    * hddTymComparison;
  const forecastConsumptionWithout = comparisonConsumption; // bazowe zużycie (bez technologii)
  const forecastSavedEnergy        = forecastConsumptionWithout - forecastConsumptionWith;
  const forecastSavedEnergyPct     = forecastConsumptionWithout > 0
    ? (forecastSavedEnergy / forecastConsumptionWithout) * 100
    : 0;
  const forecastSavedMoney         = forecastSavedEnergy * energyPrice;

  return {
    // HDD
    hddTymBilling,
    hddRealBilling,
    hddTymComparison,
    hddRealComparison,
    // Współczynniki
    kBilling,
    kComparison,
    // Zużycie skorygowane
    billingCorrected,
    comparisonCorrected,
    // Wskaźniki E
    eBilling,
    eComparison,
    // Zużycie dobowe
    dailyBilling,
    dailyComparison,
    // Oszczędności
    comparisonCorrectedScaled,
    savedEnergy,
    savedEnergyPct,
    savedMoney,
    waterAiShare,
    // Prognoza roczna
    forecastDays: comparisonDays,
    forecastConsumptionWith,
    forecastConsumptionWithout,
    forecastSavedEnergy,
    forecastSavedEnergyPct,
    forecastSavedMoney
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

    protocolDate: form.elements["protocolDate"] ? form.elements["protocolDate"].value : "",
    preparedBy: form.preparedBy ? form.preparedBy.value.trim() : "",

    weatherStation: form.weatherStation ? form.weatherStation.value.trim() : "",
    weatherSource: form.weatherSource ? form.weatherSource.value.trim() : "",
    weatherSourceUrl: form.weatherSourceUrl ? form.weatherSourceUrl.value.trim() : "",
    weatherDataDownloadDate: form.elements["weatherDataDownloadDate"] ? form.elements["weatherDataDownloadDate"].value : "",
    baseTemperature: Number(form.baseTemperature.value || 21),

    energyUnit: form.energyUnit.value,
    currency: form.currency.value,
    energyPrice: Number(form.energyPrice.value || 0),
    waterAiShare: Number(form.waterAiShare.value || 0),

    billingPeriodStartDate: (form.elements["billingPeriodStartDate"] ? form.elements["billingPeriodStartDate"].value : "") || "",
    billingPeriodStartReading: billingStart,
    billingPeriodEndDate: (form.elements["billingPeriodEndDate"] ? form.elements["billingPeriodEndDate"].value : "") || "",
    billingPeriodEndReading: billingEnd,
    billingConsumption: billingEnd - billingStart,

    comparisonPeriodStartDate: (form.elements["comparisonPeriodStartDate"] ? form.elements["comparisonPeriodStartDate"].value : "") || "",
    comparisonPeriodStartReading: comparisonStart,
    comparisonPeriodEndDate: (form.elements["comparisonPeriodEndDate"] ? form.elements["comparisonPeriodEndDate"].value : "") || "",
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
  showMeasurementForm = false;
  renderMeasurementsModule();
}


function viewProtocol(id) {
  const p = MeasurementsModule.find(id);
  if (!p) return;

  const client = ClientsModule.find(p.clientId);
  const obj = ObjectsModule.find(p.objectId);
  const r = p.escoResults || calcESCOResults(p);
  const u = p.energyUnit || "GJ";
  const cur = p.currency || "PLN";
  const fmt2 = v => Number(v||0).toFixed(2);
  const fmt3 = v => Number(v||0).toFixed(3);
  const fmt4 = v => Number(v||0).toFixed(4);

  const tymRows = (p.tymMonthly||[]).map(m => `
    <tr>
      <td style="padding:5px 8px;font-size:13px;">${escapeHtml(m.monthName||("M"+m.month))}</td>
      <td style="padding:5px 8px;font-size:13px;text-align:right;">${m.tymTemperature!==null&&m.tymTemperature!==undefined?fmt2(m.tymTemperature):"—"}</td>
      <td style="padding:5px 8px;font-size:13px;text-align:right;">${escapeHtml(String(m.tymDays||m.days||""))}</td>
      <td style="padding:5px 8px;font-size:13px;text-align:right;">${fmt2(Math.max(0,(Number(p.baseTemperature||21)-Number(m.tymTemperature||m.temperature||0))*Number(m.tymDays||m.days||0)))}</td>
    </tr>`).join("");

  const billingRows = (p.realMonthly||[]).map(m => `
    <tr>
      <td style="padding:5px 8px;font-size:13px;">${escapeHtml(m.monthName||("M"+m.month))}</td>
      <td style="padding:5px 8px;font-size:13px;text-align:right;">${m.temperature!==null&&m.temperature!==undefined?fmt2(m.temperature):"—"}</td>
      <td style="padding:5px 8px;font-size:13px;text-align:right;">${escapeHtml(String(m.days||""))}</td>
      <td style="padding:5px 8px;font-size:13px;text-align:right;">${fmt2(Math.max(0,(Number(p.baseTemperature||21)-Number(m.temperature||0))*Number(m.days||0)))}</td>
    </tr>`).join("");

  const compRows = (p.comparisonMonthly||[]).map(m => `
    <tr>
      <td style="padding:5px 8px;font-size:13px;">${escapeHtml(m.monthName||("M"+m.month))}</td>
      <td style="padding:5px 8px;font-size:13px;text-align:right;">${m.temperature!==null&&m.temperature!==undefined?fmt2(m.temperature):"—"}</td>
      <td style="padding:5px 8px;font-size:13px;text-align:right;">${escapeHtml(String(m.days||""))}</td>
      <td style="padding:5px 8px;font-size:13px;text-align:right;">${fmt2(Math.max(0,(Number(p.baseTemperature||21)-Number(m.temperature||0))*Number(m.days||0)))}</td>
    </tr>`).join("");

  const savedColor = r.savedEnergyPct >= 0 ? "#27500A" : "#c00";

  const container = document.getElementById("module-content");
  if (!container) return;

  container.innerHTML = `
    <div style="max-width:760px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <div>
          <div style="font-size:12px;color:var(--color-text-secondary);margin-bottom:4px;">
            ${escapeHtml(client?client.name:"")} / ${escapeHtml(obj?obj.name:"")}
          </div>
          <h2 style="margin:0;font-size:18px;font-weight:600;color:var(--color-text-primary);">
            📋 Protokół TYM — ${escapeHtml(p.protocolDate||"brak daty")}
          </h2>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="small-button" onclick="editMeasurement(${p.id});openModule('measurements')">✏️ Edytuj</button>
          <button class="small-button" onclick="openModule('measurements')">← Wróć</button>
        </div>
      </div>

      <!-- Dane podstawowe -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">

        <div style="border:1px solid var(--color-border-tertiary);border-radius:10px;padding:16px;">
          <div style="font-size:11px;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px;">Dane protokołu</div>
          <div style="font-size:13px;color:var(--color-text-secondary);">Opracował</div>
          <div style="font-size:14px;margin-bottom:8px;">${escapeHtml(p.preparedBy||"—")}</div>
          <div style="font-size:13px;color:var(--color-text-secondary);">Jednostka</div>
          <div style="font-size:14px;margin-bottom:8px;">${escapeHtml(u)}</div>
          <div style="font-size:13px;color:var(--color-text-secondary);">Cena energii</div>
          <div style="font-size:14px;">${fmt2(p.energyPrice||0)} ${escapeHtml(cur)} / ${escapeHtml(u)}</div>
        </div>

        <div style="border:1px solid var(--color-border-tertiary);border-radius:10px;padding:16px;">
          <div style="font-size:11px;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px;">Dane klimatyczne</div>
          <div style="font-size:13px;color:var(--color-text-secondary);">Stacja meteo</div>
          <div style="font-size:14px;margin-bottom:8px;">${escapeHtml(p.weatherStation||"—")}</div>
          <div style="font-size:13px;color:var(--color-text-secondary);">Źródło danych</div>
          <div style="font-size:14px;margin-bottom:8px;">${escapeHtml(p.weatherSource||"—")}</div>
          <div style="font-size:13px;color:var(--color-text-secondary);">Temperatura bazowa</div>
          <div style="font-size:14px;">${escapeHtml(String(p.baseTemperature||21))} °C</div>
          ${p.weatherSourceUrl ? `<a href="${escapeHtml(p.weatherSourceUrl)}" target="_blank" rel="noopener" style="font-size:12px;margin-top:8px;display:inline-block;">🌡️ Link do danych klimatycznych</a>` : ""}
        </div>

      </div>

      <!-- Okresy -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">

        <div style="border:1px solid #B5D4F4;border-radius:10px;overflow:hidden;">
          <div style="background:#E6F1FB;padding:10px 14px;font-size:13px;font-weight:500;color:#0C447C;">
            📅 Okres rozliczeniowy
          </div>
          <div style="padding:14px;">
            <div style="font-size:13px;color:var(--color-text-secondary);">Okres</div>
            <div style="font-size:14px;font-weight:500;margin-bottom:8px;">${escapeHtml(p.billingPeriodStartDate||"?")} → ${escapeHtml(p.billingPeriodEndDate||"?")}</div>
            <div style="font-size:13px;color:var(--color-text-secondary);">Odczyt startowy</div>
            <div style="font-size:14px;margin-bottom:8px;">${fmt3(p.billingPeriodStartReading||0)} ${escapeHtml(u)}</div>
            <div style="font-size:13px;color:var(--color-text-secondary);">Odczyt końcowy</div>
            <div style="font-size:14px;margin-bottom:8px;">${fmt3(p.billingPeriodEndReading||0)} ${escapeHtml(u)}</div>
            <div style="font-size:13px;color:var(--color-text-secondary);">Zużycie</div>
            <div style="font-size:16px;font-weight:600;color:#0C447C;">${fmt3(p.billingConsumption||0)} ${escapeHtml(u)}</div>
          </div>
        </div>

        <div style="border:1px solid #C0DD97;border-radius:10px;overflow:hidden;">
          <div style="background:#EAF3DE;padding:10px 14px;font-size:13px;font-weight:500;color:#27500A;">
            📊 Okres porównawczy
          </div>
          <div style="padding:14px;">
            <div style="font-size:13px;color:var(--color-text-secondary);">Okres</div>
            <div style="font-size:14px;font-weight:500;margin-bottom:8px;">${escapeHtml(p.comparisonPeriodStartDate||"?")} → ${escapeHtml(p.comparisonPeriodEndDate||"?")}</div>
            <div style="font-size:13px;color:var(--color-text-secondary);">Odczyt startowy</div>
            <div style="font-size:14px;margin-bottom:8px;">${fmt3(p.comparisonPeriodStartReading||0)} ${escapeHtml(u)}</div>
            <div style="font-size:13px;color:var(--color-text-secondary);">Odczyt końcowy</div>
            <div style="font-size:14px;margin-bottom:8px;">${fmt3(p.comparisonPeriodEndReading||0)} ${escapeHtml(u)}</div>
            <div style="font-size:13px;color:var(--color-text-secondary);">Zużycie</div>
            <div style="font-size:16px;font-weight:600;color:#27500A;">${fmt3(p.comparisonConsumption||0)} ${escapeHtml(u)}</div>
          </div>
        </div>

      </div>

      <!-- Tabele temperatur -->
      ${tymRows ? `
      <div style="border:1px solid #FAC775;border-radius:10px;overflow:hidden;margin-bottom:16px;">
        <div style="background:#FEF3DC;padding:10px 14px;font-size:13px;font-weight:500;color:#633806;">
          🌡️ Temperatury TYM (rok standardowy)
        </div>
        <div style="padding:14px;">
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead><tr style="border-bottom:1px solid var(--color-border-tertiary);">
              <th style="text-align:left;padding:5px 8px;font-weight:500;color:var(--color-text-secondary);">Miesiąc</th>
              <th style="text-align:right;padding:5px 8px;font-weight:500;color:var(--color-text-secondary);">Temp TYM (°C)</th>
              <th style="text-align:right;padding:5px 8px;font-weight:500;color:var(--color-text-secondary);">Dni</th>
              <th style="text-align:right;padding:5px 8px;font-weight:500;color:var(--color-text-secondary);">HDD TYM</th>
            </tr></thead>
            <tbody>${tymRows}</tbody>
            <tfoot><tr style="border-top:1px solid var(--color-border-tertiary);">
              <td colspan="3" style="padding:6px 8px;font-weight:600;font-size:13px;">Suma HDD TYM (rozlicz.)</td>
              <td style="padding:6px 8px;font-weight:600;font-size:13px;text-align:right;">${fmt2(r.hddTymBilling)}</td>
            </tr></tfoot>
          </table>
        </div>
      </div>` : ""}

      ${billingRows ? `
      <div style="border:1px solid #B5D4F4;border-radius:10px;overflow:hidden;margin-bottom:16px;">
        <div style="background:#E6F1FB;padding:10px 14px;font-size:13px;font-weight:500;color:#0C447C;">
          🌡️ Temperatury rzeczywiste — okres rozliczeniowy
        </div>
        <div style="padding:14px;">
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead><tr style="border-bottom:1px solid var(--color-border-tertiary);">
              <th style="text-align:left;padding:5px 8px;font-weight:500;color:var(--color-text-secondary);">Miesiąc</th>
              <th style="text-align:right;padding:5px 8px;font-weight:500;color:var(--color-text-secondary);">Temp. śr. (°C)</th>
              <th style="text-align:right;padding:5px 8px;font-weight:500;color:var(--color-text-secondary);">Dni</th>
              <th style="text-align:right;padding:5px 8px;font-weight:500;color:var(--color-text-secondary);">HDD</th>
            </tr></thead>
            <tbody>${billingRows}</tbody>
            <tfoot><tr style="border-top:1px solid var(--color-border-tertiary);">
              <td colspan="3" style="padding:6px 8px;font-weight:600;font-size:13px;">Suma HDD rzecz. (rozlicz.)</td>
              <td style="padding:6px 8px;font-weight:600;font-size:13px;text-align:right;">${fmt2(r.hddRealBilling)}</td>
            </tr></tfoot>
          </table>
        </div>
      </div>` : ""}

      ${compRows ? `
      <div style="border:1px solid #C0DD97;border-radius:10px;overflow:hidden;margin-bottom:16px;">
        <div style="background:#EAF3DE;padding:10px 14px;font-size:13px;font-weight:500;color:#27500A;">
          🌡️ Temperatury rzeczywiste — okres porównawczy
        </div>
        <div style="padding:14px;">
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead><tr style="border-bottom:1px solid var(--color-border-tertiary);">
              <th style="text-align:left;padding:5px 8px;font-weight:500;color:var(--color-text-secondary);">Miesiąc</th>
              <th style="text-align:right;padding:5px 8px;font-weight:500;color:var(--color-text-secondary);">Temp. śr. (°C)</th>
              <th style="text-align:right;padding:5px 8px;font-weight:500;color:var(--color-text-secondary);">Dni</th>
              <th style="text-align:right;padding:5px 8px;font-weight:500;color:var(--color-text-secondary);">HDD</th>
            </tr></thead>
            <tbody>${compRows}</tbody>
            <tfoot><tr style="border-top:1px solid var(--color-border-tertiary);">
              <td colspan="3" style="padding:6px 8px;font-weight:600;font-size:13px;">Suma HDD rzecz. (porówn.)</td>
              <td style="padding:6px 8px;font-weight:600;font-size:13px;text-align:right;">${fmt2(r.hddRealComparison)}</td>
            </tr></tfoot>
          </table>
        </div>
      </div>` : ""}

      <!-- Wyniki ESCO -->
      <div style="border:1px solid #C0DD97;border-radius:10px;overflow:hidden;margin-bottom:16px;">
        <div style="background:#EAF3DE;padding:10px 14px;font-size:13px;font-weight:500;color:#27500A;">
          ⚡ Wyniki ESCO
        </div>
        <div style="padding:14px;display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div>
            <div style="font-size:12px;color:var(--color-text-secondary);margin-bottom:2px;">HDD TYM rozlicz. / rzecz.</div>
            <div style="font-size:14px;margin-bottom:10px;">${fmt2(r.hddTymBilling)} / ${fmt2(r.hddRealBilling)}</div>
            <div style="font-size:12px;color:var(--color-text-secondary);margin-bottom:2px;">Współczynnik korekty (k)</div>
            <div style="font-size:14px;margin-bottom:10px;">${fmt4(r.kBilling)}</div>
            <div style="font-size:12px;color:var(--color-text-secondary);margin-bottom:2px;">Zużycie rozlicz. skorygowane</div>
            <div style="font-size:14px;margin-bottom:10px;">${fmt3(r.billingCorrected)} ${escapeHtml(u)}</div>
            <div style="font-size:12px;color:var(--color-text-secondary);margin-bottom:2px;">Zużycie porówn. skalowane do TYM</div>
            <div style="font-size:14px;">${fmt3(r.comparisonCorrectedScaled)} ${escapeHtml(u)}</div>
          </div>
          <div>
            <div style="font-size:12px;color:var(--color-text-secondary);margin-bottom:2px;">Oszczędność energii</div>
            <div style="font-size:18px;font-weight:700;color:${savedColor};margin-bottom:4px;">${fmt3(r.savedEnergy)} ${escapeHtml(u)}</div>
            <div style="font-size:22px;font-weight:700;color:${savedColor};margin-bottom:12px;">${fmt2(r.savedEnergyPct)} %</div>
            <div style="font-size:12px;color:var(--color-text-secondary);margin-bottom:2px;">Oszczędność finansowa</div>
            <div style="font-size:18px;font-weight:700;color:${savedColor};margin-bottom:8px;">${fmt2(r.savedMoney)} ${escapeHtml(cur)}</div>
            <div style="font-size:12px;color:var(--color-text-secondary);margin-bottom:2px;">Udział WaterAI (${escapeHtml(String(p.waterAiShare||0))} %)</div>
            <div style="font-size:16px;font-weight:600;">${fmt2(r.waterAiShare)} ${escapeHtml(cur)}</div>
          </div>
        </div>
      </div>

      ${p.note ? `
      <div style="border:1px solid var(--color-border-tertiary);border-radius:10px;padding:14px;margin-bottom:16px;">
        <div style="font-size:11px;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">Notatka</div>
        <div style="font-size:14px;line-height:1.6;">${escapeHtml(p.note)}</div>
      </div>` : ""}

      <div style="display:flex;gap:8px;margin-top:8px;">
        <button class="small-button" onclick="editMeasurement(${p.id});openModule('measurements')">✏️ Edytuj protokół</button>
        ${obj ? `<button class="small-button" onclick="viewObject(${obj.id});openModule('objects')">🏗️ Podgląd obiektu</button>` : ""}
      </div>
    </div>
  `;
}

function editMeasurement(id) {
  const protocol = MeasurementsModule.find(id);
  if (!protocol) return;

  editingMeasurementId = Number(id);
  selectedMeasurementObjectId = Number(protocol.objectId);
  showMeasurementForm = true;

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

  // Daty — najpierw wstaw, potem zbuduj tabelki
  if (form.elements["billingPeriodStartDate"]) form.elements["billingPeriodStartDate"].value = protocol.billingPeriodStartDate || "";
  if (form.elements["billingPeriodEndDate"]) form.elements["billingPeriodEndDate"].value = protocol.billingPeriodEndDate || "";
  if (form.billingPeriodStartReading) form.billingPeriodStartReading.value = protocol.billingPeriodStartReading || "";
  if (form.billingPeriodEndReading) form.billingPeriodEndReading.value = protocol.billingPeriodEndReading || "";

  if (form.elements["comparisonPeriodStartDate"]) form.elements["comparisonPeriodStartDate"].value = protocol.comparisonPeriodStartDate || "";
  if (form.elements["comparisonPeriodEndDate"]) form.elements["comparisonPeriodEndDate"].value = protocol.comparisonPeriodEndDate || "";
  if (form.comparisonPeriodStartReading) form.comparisonPeriodStartReading.value = protocol.comparisonPeriodStartReading || "";
  if (form.comparisonPeriodEndReading) form.comparisonPeriodEndReading.value = protocol.comparisonPeriodEndReading || "";

  if (form.tymPeriodStart) form.tymPeriodStart.value = protocol.tymPeriodStart || "";
  if (form.tymPeriodEnd) form.tymPeriodEnd.value = protocol.tymPeriodEnd || "";
  if (form.tymDataSource) form.tymDataSource.value = protocol.tymDataSource || "";

  // Zbuduj tabelki miesięczne z dat
  refreshPeriodTable("billing");
  refreshPeriodTable("comparison");

  // Wstaw zapisane temperatury — pomocnicza funkcja
  function restoreTemps(tbodyId, data) {
    if (!data || data.length === 0) return;
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    data.forEach(item => {
      // szukaj po roku i miesiącu — jeśli brak roku szukaj tylko po miesiącu
      let tr = null;
      if (item.year) {
        tr = tbody.querySelector(`tr[data-key="${item.year}-${item.month}"]`);
      }
      if (!tr) {
        // fallback: znajdź pierwszy wiersz z tym miesiącem (dla danych bez roku)
        tbody.querySelectorAll("tr[data-key]").forEach(row => {
          const [, m] = row.dataset.key.split("-").map(Number);
          if (m === item.month && !tr) tr = row;
        });
      }
      if (!tr) return;
      const tInput = tr.querySelector("input.month-temp");
      const dInput = tr.querySelector("input.month-days");
      if (tInput) tInput.value = item.temperature ?? item.realTemperature ?? "";
      if (dInput && (item.days || item.realDays)) dInput.value = item.days ?? item.realDays ?? "";
    });
  }

  restoreTemps("billing-months-tbody",    protocol.realMonthly       || []);
  restoreTemps("comparison-months-tbody", protocol.comparisonMonthly || []);

  // Przelicz HDD po wstawieniu temperatur
  refreshPeriodHDD("billing");
  refreshPeriodHDD("comparison");
  refreshConsumption("billing");
  refreshConsumption("comparison");

  // TYM — 12 stałych miesięcy
  if (protocol.tymMonthly && protocol.tymMonthly.length) {
    protocol.tymMonthly.forEach(item => {
      const tInput = form[`tymTemp_${item.month}`];
      const dInput = form[`tymDays_${item.month}`];
      if (tInput) tInput.value = item.tymTemperature ?? item.temperature ?? "";
      if (dInput) dInput.value = item.tymDays ?? item.days ?? "";
    });
    refreshTymHDD();
  }

  if (form.note) form.note.value = protocol.note || "";
  if (form.includeLinearRegression) {
    form.includeLinearRegression.checked = !!protocol.includeLinearRegression;
  }

  const submitButton = form.querySelector("button[type='submit']");
  if (submitButton) submitButton.textContent = "Zapisz protokół";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteMeasurement(id) {
  if (!confirm("Czy na pewno usunąć protokół pomiarowy?")) return;
  MeasurementsModule.remove(id);
  showMeasurementForm = false;
  renderMeasurementsModule();
}

function cancelMeasurementEdit() {
  editingMeasurementId = null;
  showMeasurementForm = false;
  renderMeasurementsModule();
}

// ─── helpers dla dynamicznych tabelek miesięcznych ───────────────────────────

function buildMonthsFromDates(startDate, endDate) {
  if (!startDate || !endDate) return [];

  // Parsuj jako lokalny czas (split na części) żeby uniknąć przesunięć UTC
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);

  const start = new Date(sy, sm - 1, sd);
  const end   = new Date(ey, em - 1, ed);

  if (isNaN(start) || isNaN(end) || end < start) return [];

  const months = [];
  let curYear  = sy;
  let curMonth = sm - 1; // 0-based

  while (true) {
    const firstOfMonth = new Date(curYear, curMonth, 1);
    const lastOfMonth  = new Date(curYear, curMonth + 1, 0);

    if (firstOfMonth > end) break;

    const dayFrom = (firstOfMonth < start) ? start.getDate() : 1;
    const dayTo   = (lastOfMonth  > end)   ? end.getDate()   : lastOfMonth.getDate();
    const days    = dayTo - dayFrom + 1;

    months.push({
      year:      curYear,
      month:     curMonth + 1,
      monthName: MONTHS_PL[curMonth] + " " + curYear,
      days
    });

    curMonth++;
    if (curMonth > 11) { curMonth = 0; curYear++; }
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
      <td style="padding:3px 6px;"><input class="month-days" type="number" min="0" max="31"
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
  const baseTemp   = baseTempEl ? Number(baseTempEl.value ?? 21) : 21;

  let total = 0;
  tbody.querySelectorAll("tr[data-key]").forEach(tr => {
    const tInput  = tr.querySelector("input.month-temp");
    const dInput  = tr.querySelector("input.month-days");
    const hddCell = tr.querySelector(".hdd-cell");
    if (!tInput || tInput.value === "") {
      if (hddCell) hddCell.textContent = "—";
      return;
    }
    const days = Number(dInput ? dInput.value : 0);
    const hdd  = Math.max(0, baseTemp - Number(tInput.value)) * days;
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
  const baseTemp   = baseTempEl ? Number(baseTempEl.value ?? 21) : 21;
  const hddEl      = document.getElementById("tym-hdd-display");

  let total = 0;
  for (let m = 1; m <= 12; m++) {
    const tInput  = document.querySelector(`[name="tymTemp_${m}"]`);
    const dInput  = document.querySelector(`[name="tymDays_${m}"]`);
    const hddCell = document.getElementById(`tym-hdd-cell-${m}`);
    if (!tInput || tInput.value === "") {
      if (hddCell) hddCell.textContent = "—";
      continue;
    }
    const days = Number(dInput ? dInput.value : 0);
    const hdd  = Math.max(0, baseTemp - Number(tInput.value)) * days;
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
      temperature: tInput && tInput.value !== "" ? Number(tInput.value) : null,
      days: dInput ? Number(dInput.value) : 0
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
      <td style="padding:3px 6px;"><input name="tymDays_${m}" type="number" min="0" max="31" value="${days}"
        style="width:60px;font-size:13px;padding:3px 6px;" oninput="refreshTymHDD()" /></td>
      <td style="padding:5px 8px;color:var(--color-text-tertiary);" id="tym-hdd-cell-${m}">—</td>
    </tr>`;
  }).join("");

  // Check if any protocol for this object has regression enabled
  const protocolsForTabs = MeasurementsModule.findByObject(selectedMeasurementObjectId);
  const hasRegression = protocolsForTabs.some(p => p.includeLinearRegression);

  container.innerHTML = `
  <style>
    .tym-section { margin-bottom:20px; border-radius:10px; overflow:hidden; }
    .meas-tabs { display:flex; gap:0; margin-bottom:20px; border-bottom:2px solid var(--color-border-tertiary); }
    .meas-tab {
      padding:10px 22px; font-size:14px; font-weight:500; cursor:pointer;
      border:none; background:transparent; color:var(--color-text-secondary);
      border-bottom:3px solid transparent; margin-bottom:-2px; transition:all 0.15s;
    }
    .meas-tab.active { color:#0C447C; border-bottom-color:#0C447C; }
    .meas-tab:hover:not(.active) { color:var(--color-text-primary); background:var(--color-background-secondary); }
    .meas-tab-reg { color:#633806 !important; }
    .meas-tab-reg.active { color:#633806 !important; border-bottom-color:#FAC775 !important; }
    .tym-field label { font-size:12px;color:var(--color-text-secondary);display:block;margin-bottom:4px; }
    .tym-grid2 { display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px; }
    .tym-grid4 { display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;margin-bottom:12px; }
    .tym-body { padding:16px;background:var(--color-background-primary); }
    .tym-table { width:100%;border-collapse:collapse;font-size:13px;margin-top:8px; }
    .tym-table th { text-align:left;padding:6px 8px;font-size:11px;font-weight:500;color:var(--color-text-secondary);border-bottom:0.5px solid var(--color-border-tertiary); }
    .tym-note { font-size:11px;color:var(--color-text-tertiary);margin-top:6px; }
    .tym-summary { display:flex;gap:16px;margin-top:12px;flex-wrap:wrap;align-items:center; }
  </style>

  <div class="meas-tabs">
    <button type="button" class="meas-tab ${activeMeasurementsTab === 'tym' ? 'active' : ''}"
      onclick="activeMeasurementsTab='tym'; renderMeasurementsModule();">
      📋 Protokół TYM
    </button>
    ${hasRegression ? `<button type="button" class="meas-tab meas-tab-reg ${activeMeasurementsTab === 'regression' ? 'active' : ''}"
      onclick="activeMeasurementsTab='regression'; renderMeasurementsModule();">
      📈 Regresja liniowa
    </button>` : ''}
  </div>

  ${activeMeasurementsTab === 'regression' ? '' : (!showMeasurementForm ? '' : `<form onsubmit="createMeasurement(this); return false;">

    <!-- ═══ WYBÓR KLIENTA I OBIEKTU ═══ -->
    <div class="tym-section" style="border:1px solid #B5D4F4;">
      <div style="background:#E6F1FB;padding:12px 16px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;">🏢</span>
        <h3 style="margin:0;font-size:15px;font-weight:500;color:#0C447C;">Klient i obiekt</h3>
      </div>
      <div class="tym-body">
        <div class="tym-grid2">
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
        </div>
      </div>
    </div>

    <!-- ═══ DANE PODSTAWOWE PROTOKOŁU ═══ -->
    <div class="tym-section" style="border:1px solid #C8C8C8;">
      <div style="background:#F2F2F2;padding:12px 16px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;">📋</span>
        <h3 style="margin:0;font-size:15px;font-weight:500;color:#333;">Dane podstawowe protokołu</h3>
      </div>
      <div class="tym-body">
        <div class="tym-grid4">
          <div class="tym-field">
            <label>Data protokołu</label>
            <input name="protocolDate" type="date" required style="width:100%;box-sizing:border-box;" />
          </div>
          <div class="tym-field">
            <label>Opracował / Energy Analyst</label>
            <input name="preparedBy" value="${escapeHtml(selectedObject.energyAnalystOwner || "")}" placeholder="Imię i nazwisko" style="width:100%;box-sizing:border-box;" />
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ DANE KLIMATYCZNE PROTOKOŁU ═══ -->
    <div class="tym-section" style="border:1px solid #B5C8F4;">
      <div style="background:#E8EDFB;padding:12px 16px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;">🌡️</span>
        <h3 style="margin:0;font-size:15px;font-weight:500;color:#0C2C7C;">Dane klimatyczne</h3>
      </div>
      <div class="tym-body">
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
        <div class="tym-field">
          <label>Link do źródła danych (WeatherOnline / Robot Klimatu)</label>
          <input name="weatherSourceUrl" type="url" value="${escapeHtml(selectedObject.weatherSourceUrl || "")}" placeholder="https://..." style="width:100%;box-sizing:border-box;" />
        </div>
      </div>
    </div>

    <!-- ═══ DANE ENERGETYCZNE PROTOKOŁU ═══ -->
    <div class="tym-section" style="border:1px solid #C8B5F4;">
      <div style="background:#EDE8FB;padding:12px 16px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;">⚡</span>
        <h3 style="margin:0;font-size:15px;font-weight:500;color:#3D0C7C;">Dane energetyczne</h3>
      </div>
      <div class="tym-body">
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

    <div style="display:flex;gap:12px;align-items:center;">
      <button class="primary-button" type="submit">
        ${editingMeasurementId ? "Zapisz protokół" : "Dodaj protokół TYM"}
      </button>
      <button class="small-button" type="button" onclick="cancelMeasurementEdit()">
        ${editingMeasurementId ? "Anuluj edycję" : "← Wróć do listy"}
      </button>
    </div>

  </form>

  <div id="measurements-list" style="margin-top:24px;"></div>
  `)}

  ${activeMeasurementsTab === 'regression' ? renderRegressionTab(protocolsForTabs) : ''}
  ${(activeMeasurementsTab === 'tym' && !showMeasurementForm) ? renderProtocolsTable(protocolsForTabs, selectedMeasurementObjectId) : ''}
  `;

  if (activeMeasurementsTab === 'tym' && showMeasurementForm) renderMeasurementsList();
}

function renderProtocolsTable(protocols, objectId) {
  const obj = objectId ? ObjectsModule.find(objectId) : null;
  const unit = (obj && obj.energyUnit) || "GJ";

  const headerHtml = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;margin-top:8px;">
      <h3 style="margin:0;font-size:15px;font-weight:500;color:var(--color-text-primary);">
        Protokoły TYM
        <span style="font-size:12px;color:var(--color-text-secondary);font-weight:400;">(${protocols.length})</span>
      </h3>
      <button class="primary-button" onclick="showMeasurementForm=true;editingMeasurementId=null;renderMeasurementsModule();" style="font-size:13px;padding:7px 16px;">
        + Dodaj protokół TYM
      </button>
    </div>`;

  if (protocols.length === 0) {
    return headerHtml + `<div class="reminder-card"><strong>Brak protokołów TYM</strong>
      <div class="reminder-meta">Kliknij "+ Dodaj protokół TYM" aby rozpocząć rozliczenie ESCO.</div>
    </div>`;
  }

  const fmt2 = v => Number(v || 0).toFixed(2);
  const fmt3 = v => Number(v || 0).toFixed(3);

  const rows = protocols.map(item => {
    const r = item.escoResults || calcESCOResults(item);
    const u = item.energyUnit || unit;
    const cur = item.currency || "PLN";
    const savedPct = fmt2(r.savedEnergyPct);
    const savedMoney = fmt2(r.savedMoney);
    const pctColor = r.savedEnergyPct >= 0 ? "#27500A" : "#c00";
    return `<tr>
      <td style="padding:10px 12px;font-size:13px;font-weight:500;">${escapeHtml(item.protocolDate || "—")}</td>
      <td style="padding:10px 12px;font-size:13px;">${escapeHtml(item.billingPeriodStartDate || "")} → ${escapeHtml(item.billingPeriodEndDate || "")}</td>
      <td style="padding:10px 12px;font-size:13px;text-align:right;">${fmt3(item.billingConsumption)} ${escapeHtml(u)}</td>
      <td style="padding:10px 12px;font-size:13px;text-align:right;font-weight:600;color:${pctColor};">${savedPct} %</td>
      <td style="padding:10px 12px;font-size:13px;text-align:right;">${savedMoney} ${escapeHtml(cur)}</td>
      <td style="padding:10px 12px;">
        ${item.includeLinearRegression ? '<span style="font-size:11px;background:#FAEEDA;color:#633806;padding:2px 7px;border-radius:10px;">📈 Regresja</span>' : ''}
      </td>
      <td style="padding:10px 12px;white-space:nowrap;">
        <button class="small-button" onclick="viewProtocol(${item.id})" style="white-space:nowrap;">Podgląd</button>
        <button class="small-button" onclick="showMeasurementForm=true;editMeasurement(${item.id});" style="white-space:nowrap;">Edytuj</button>
        <button class="small-button" onclick="deleteMeasurement(${item.id})" style="white-space:nowrap;">Usuń</button>
      </td>
    </tr>`;
  }).join("");

  return headerHtml + `
    <div style="overflow-x:auto;border:1px solid var(--color-border-tertiary);border-radius:10px;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:var(--color-background-secondary);">
            <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Data protokołu</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Okres rozliczeniowy</th>
            <th style="padding:8px 12px;text-align:right;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Zużycie</th>
            <th style="padding:8px 12px;text-align:right;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Oszczędność %</th>
            <th style="padding:8px 12px;text-align:right;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Oszczędność fin.</th>
            <th style="padding:8px 12px;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Załączniki</th>
            <th style="padding:8px 12px;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Akcje</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderRegressionTab(protocols) {
  const regressionProtocols = protocols.filter(p => p.includeLinearRegression);

  if (regressionProtocols.length === 0) {
    return `<div class="reminder-card"><strong>Brak protokołów z regresją</strong>
      <div class="reminder-meta">Zaznacz "Dołącz analizę regresji liniowej" w protokole TYM aby aktywować ten moduł.</div>
    </div>`;
  }

  return regressionProtocols.map(p => {
    const unit = p.energyUnit || "GJ";
    const rows = buildRegressionData(p);
    if (rows.length < 2) {
      return `<div class="reminder-card" style="border-left:4px solid #FAC775;">
        <strong>📈 Regresja — Protokół z dnia ${escapeHtml(p.protocolDate || "")}</strong>
        <div class="reminder-meta">Za mało danych (min. 2 miesiące z temperaturą i zużyciem) aby wyliczyć regresję.</div>
      </div>`;
    }

    const lr = calcLinearRegression(rows);
    const fmt3 = v => Number(v || 0).toFixed(3);
    const fmt4 = v => Number(v || 0).toFixed(4);
    const fmt2 = v => Number(v || 0).toFixed(2);

    const tableRows = rows.map(r => {
      const yPred = lr.a * r.hdd + lr.b;
      const resid = r.consumption - yPred;
      return `<tr>
        <td style="padding:4px 8px;font-size:12px;">${escapeHtml(r.monthName)}</td>
        <td style="padding:4px 8px;font-size:12px;text-align:right;">${fmt2(r.avgTemp)}</td>
        <td style="padding:4px 8px;font-size:12px;text-align:right;">${r.days}</td>
        <td style="padding:4px 8px;font-size:12px;text-align:right;">${fmt2(r.hdd)}</td>
        <td style="padding:4px 8px;font-size:12px;text-align:right;">${fmt3(r.consumption)}</td>
        <td style="padding:4px 8px;font-size:12px;text-align:right;">${fmt3(yPred)}</td>
        <td style="padding:4px 8px;font-size:12px;text-align:right;color:${Math.abs(resid) > 0.5 * r.consumption ? '#c00' : '#666'};">${fmt3(resid)}</td>
      </tr>`;
    }).join("");

    const chartId = "reg-chart-" + p.id;

    const chartScript = `
    (function() {
      const canvas = document.getElementById('${chartId}');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      const pts = ${JSON.stringify(rows.map(r => ({ x: r.hdd, y: r.consumption, label: r.monthName })))};
      const a = ${lr.a}, b = ${lr.b};
      if (!pts.length) return;
      const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
      const xMin = Math.min(...xs), xMax = Math.max(...xs);
      const yMin = Math.min(...ys, a*xMin+b, a*xMax+b), yMax = Math.max(...ys, a*xMin+b, a*xMax+b);
      const pad = { l:52, r:16, t:16, b:36 };
      const scX = x => pad.l + (x - xMin) / (xMax - xMin || 1) * (W - pad.l - pad.r);
      const scY = y => H - pad.b - (y - yMin) / (yMax - yMin || 1) * (H - pad.t - pad.b);
      ctx.clearRect(0, 0, W, H);
      // grid
      ctx.strokeStyle = '#e8e8e8'; ctx.lineWidth = 0.5;
      for (let i = 0; i <= 4; i++) {
        const y = yMin + i*(yMax-yMin)/4;
        ctx.beginPath(); ctx.moveTo(pad.l, scY(y)); ctx.lineTo(W-pad.r, scY(y)); ctx.stroke();
        ctx.fillStyle='#999'; ctx.font='10px sans-serif'; ctx.textAlign='right';
        ctx.fillText(y.toFixed(2), pad.l-4, scY(y)+4);
      }
      for (let i = 0; i <= 4; i++) {
        const x = xMin + i*(xMax-xMin)/4;
        ctx.beginPath(); ctx.moveTo(scX(x), pad.t); ctx.lineTo(scX(x), H-pad.b); ctx.stroke();
        ctx.fillStyle='#999'; ctx.font='10px sans-serif'; ctx.textAlign='center';
        ctx.fillText(x.toFixed(0), scX(x), H-pad.b+14);
      }
      // regression line
      ctx.strokeStyle='#FAC775'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(scX(xMin), scY(a*xMin+b)); ctx.lineTo(scX(xMax), scY(a*xMax+b)); ctx.stroke();
      // points
      pts.forEach(pt => {
        ctx.beginPath(); ctx.arc(scX(pt.x), scY(pt.y), 5, 0, 2*Math.PI);
        ctx.fillStyle='#185FA5'; ctx.fill();
        ctx.fillStyle='#333'; ctx.font='10px sans-serif'; ctx.textAlign='left';
        ctx.fillText(pt.label.slice(0,3), scX(pt.x)+7, scY(pt.y)+4);
      });
      // axes labels
      ctx.fillStyle='#666'; ctx.font='11px sans-serif';
      ctx.textAlign='center'; ctx.fillText('HDD (°C·dni)', W/2, H-2);
      ctx.save(); ctx.translate(14, H/2); ctx.rotate(-Math.PI/2);
      ctx.fillText('Zużycie (${unit})', 0, 0); ctx.restore();
    })();`;

    return `
    <div class="reminder-card" style="border-left:4px solid #FAC775;margin-bottom:20px;">
      <strong>📈 Regresja liniowa — Protokół z dnia ${escapeHtml(p.protocolDate || "")}</strong>
      <div class="reminder-meta">
        Obiekt: ${escapeHtml(getObjectName(p.objectId))}<br />
        Okres porównawczy: ${escapeHtml(p.comparisonPeriodStartDate || "")} → ${escapeHtml(p.comparisonPeriodEndDate || "")}<br />
        Temperatura bazowa: ${p.baseTemperature || 21} °C
      </div>

      <div style="margin-top:12px;padding:12px;background:#FAEEDA;border-radius:8px;display:flex;gap:24px;flex-wrap:wrap;align-items:center;">
        <div style="font-size:15px;font-weight:600;color:#633806;">
          y = <strong>${fmt4(lr.a)}</strong> · x + <strong>${fmt4(lr.b)}</strong>
        </div>
        <div style="font-size:13px;color:#633806;">
          R² = <strong>${fmt4(lr.r2)}</strong>
          ${lr.r2 >= 0.9 ? ' ✅ bardzo dobra korelacja' : lr.r2 >= 0.75 ? ' 🟡 dobra korelacja' : ' 🔴 słaba korelacja'}
        </div>
        <div style="font-size:12px;color:#856030;">
          n = ${rows.length} miesięcy
        </div>
      </div>

      <div style="margin-top:12px;overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr style="background:#FDF3E0;">
              <th style="padding:6px 8px;text-align:left;font-weight:500;border-bottom:1px solid #FAC775;">Miesiąc</th>
              <th style="padding:6px 8px;text-align:right;font-weight:500;border-bottom:1px solid #FAC775;">Śr. temp (°C)</th>
              <th style="padding:6px 8px;text-align:right;font-weight:500;border-bottom:1px solid #FAC775;">Dni</th>
              <th style="padding:6px 8px;text-align:right;font-weight:500;border-bottom:1px solid #FAC775;">HDD</th>
              <th style="padding:6px 8px;text-align:right;font-weight:500;border-bottom:1px solid #FAC775;">Zużycie (${unit})</th>
              <th style="padding:6px 8px;text-align:right;font-weight:500;border-bottom:1px solid #FAC775;">y prognoza</th>
              <th style="padding:6px 8px;text-align:right;font-weight:500;border-bottom:1px solid #FAC775;">Odchyłka</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>

      <div style="margin-top:16px;">
        <canvas id="${chartId}" width="560" height="280"
          style="max-width:100%;border:1px solid #FAC775;border-radius:8px;background:#fff;display:block;"></canvas>
      </div>

      <div class="reminder-meta" style="margin-top:10px;font-size:11px;color:#856030;">
        Dane wejściowe: temperatury i dni z okresu porównawczego protokołu TYM.<br />
        x = HDD miesięczny, y = zużycie miesięczne (proporcjonalne do HDD okresu).
      </div>
    </div>
    <script>(function(){ setTimeout(function(){ ${chartScript} }, 80); })();<\/script>`;
  }).join("");
}

function buildRegressionData(protocol) {
  const base = Number(protocol.baseTemperature || 21);
  const compMonthly = protocol.comparisonMonthly || [];
  const totalDays = compMonthly.reduce((s, m) => s + Number(m.days || 0), 0);
  const totalCons = Number(protocol.comparisonConsumption || 0);
  if (totalDays === 0 || totalCons === 0) return [];

  return compMonthly
    .filter(m => m.temperature !== null && m.temperature !== undefined && Number(m.days || 0) > 0)
    .map(m => {
      const days = Number(m.days);
      const avgTemp = Number(m.temperature);
      const hdd = Math.max(0, base - avgTemp) * days;
      // allocate consumption proportionally by days
      const consumption = (days / totalDays) * totalCons;
      return {
        monthName: m.monthName || ("M" + m.month),
        avgTemp,
        days,
        hdd,
        consumption
      };
    })
    .filter(r => r.hdd > 0 || r.consumption > 0);
}

function calcLinearRegression(rows) {
  const n = rows.length;
  const xs = rows.map(r => r.hdd);
  const ys = rows.map(r => r.consumption);
  const xMean = xs.reduce((s, v) => s + v, 0) / n;
  const yMean = ys.reduce((s, v) => s + v, 0) / n;
  const ssXY = xs.reduce((s, x, i) => s + (x - xMean) * (ys[i] - yMean), 0);
  const ssXX = xs.reduce((s, x) => s + (x - xMean) ** 2, 0);
  const a = ssXX !== 0 ? ssXY / ssXX : 0;
  const b = yMean - a * xMean;
  const ssRes = ys.reduce((s, y, i) => s + (y - (a * xs[i] + b)) ** 2, 0);
  const ssTot = ys.reduce((s, y) => s + (y - yMean) ** 2, 0);
  const r2 = ssTot !== 0 ? 1 - ssRes / ssTot : 0;
  return { a, b, r2 };
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

      <div class="reminder-meta" style="margin-top:8px;background:#f0f7f0;padding:10px;border-radius:6px;">
        <strong>Wyniki ESCO:</strong><br /><br />

        <u>Stopniodni grzewcze (HDD):</u><br />
        HDD TYM — rozliczeniowy: ${fmt2(r.hddTymBilling)} °C·dni<br />
        HDD rzecz. — rozliczeniowy: ${fmt2(r.hddRealBilling)} °C·dni<br />
        HDD TYM — porównawczy: ${fmt2(r.hddTymComparison)} °C·dni<br />
        HDD rzecz. — porównawczy: ${fmt2(r.hddRealComparison)} °C·dni<br /><br />

        <u>Korekta klimatyczna:</u><br />
        k rozliczeniowy (HDD_TYM / HDD_rzecz): <strong>${fmt3(r.kBilling)}</strong>${r.kBilling > 1 ? " → rok cieplejszy od normy" : r.kBilling > 0 ? " → rok chłodniejszy od normy" : ""}<br />
        k porównawczy (HDD_TYM / HDD_rzecz): <strong>${fmt3(r.kComparison)}</strong><br /><br />

        <u>Zużycie skorygowane do TYM:</u><br />
        Rozliczeniowe skor.: <strong>${fmt3(r.billingCorrected)} ${unit}</strong><br />
        Porównawcze skor.: <strong>${fmt3(r.comparisonCorrected)} ${unit}</strong><br />
        Porównawcze skor. przeliczone na dni rozliczeniowe: <strong>${fmt3(r.comparisonCorrectedScaled)} ${unit}</strong><br /><br />

        <u>Wskaźnik energetyczny E = zużycie_TYM / HDD_TYM:</u><br />
        E rozliczeniowy: <strong>${fmt3(r.eBilling)} ${unit}/HDD</strong><br />
        E porównawczy: <strong>${fmt3(r.eComparison)} ${unit}/HDD</strong><br />
        Zmiana E: <strong>${r.eComparison > 0 ? fmt2((r.eBilling - r.eComparison) / r.eComparison * 100) : "—"} %</strong><br /><br />

        <u>Oszczędności (okres rozliczeniowy):</u><br />
        Oszczędność energii: <strong>${fmt3(r.savedEnergy)} ${unit}</strong><br />
        Oszczędność energii: <strong>${fmt2(r.savedEnergyPct)} %</strong><br />
        Oszczędność finansowa: <strong>${fmt2(r.savedMoney)} ${currency}</strong><br />
        Udział WaterAI: <strong>${fmt2(r.waterAiShare)} ${currency}</strong>
      </div>

      <div class="reminder-meta" style="margin-top:8px;background:#f5f0fa;padding:10px;border-radius:6px;">
        <strong>Prognoza roczna (${r.forecastDays} dni — jak okres porównawczy):</strong><br /><br />
        Prognoza z technologią: <strong>${fmt3(r.forecastConsumptionWith)} ${unit}</strong><br />
        Prognoza bez technologii: <strong>${fmt3(r.forecastConsumptionWithout)} ${unit}</strong><br />
        Prognoza oszczędności: <strong>${fmt3(r.forecastSavedEnergy)} ${unit}/rok</strong><br />
        Prognoza oszczędności: <strong>${fmt2(r.forecastSavedEnergyPct)} %</strong><br />
        Prognoza wartości: <strong>${fmt2(r.forecastSavedMoney)} ${currency}/rok</strong>
      </div>

      ${item.includeLinearRegression ? `
        <div class="reminder-meta" style="margin-top:6px;color:#666;">
          ☑ Analiza regresji liniowej dołączona jako załącznik
        </div>
      ` : ""}

      <div style="margin-top: 12px;">
        <button class="small-button" onclick="viewProtocol(${item.id})">Podgląd</button>
        <button class="small-button" onclick="editMeasurement(${item.id})">Edytuj</button>
        <button class="small-button" onclick="deleteMeasurement(${item.id})">Usuń</button>
      </div>
    </div>
  `}).join("");
}

// WaterAI Energy Control

// ─── helper: przełącz widok bez resetowania module-content ───────────────────
function switchToView(moduleName, viewFn) {
  const labels = typeof getModuleLabels === "function" ? getModuleLabels() : {};
  const item = labels[moduleName];
  if (item) {
    const titleEl = document.getElementById("module-title");
    if (titleEl) titleEl.textContent = item[1];
  }
  const modView = document.getElementById("module-view");
  if (modView) modView.classList.add("active");
  const descEl = document.getElementById("module-description");
  if (descEl) descEl.textContent = "";
  viewFn();
}

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
    contacts
  };

  if (editingClientId) {
    ClientsModule.update(editingClientId, clientData);
    // Update folder name if client name changed
    if (typeof DocFoldersModule !== 'undefined') {
      const folder = DocFoldersModule.getAll().find(f =>
        Number(f.clientId) === Number(editingClientId) && f.type === 'client' && !f.parentId
      );
      if (folder) DocFoldersModule.update(folder.id, { name: clientData.name });
    }
    editingClientId = null;
  } else {
    ClientsModule.add(clientData);
    // Auto-create root folder for new client
    if (typeof DocFoldersModule !== 'undefined') {
      const allClients = ClientsModule.getAll();
      const newClient = allClients[allClients.length - 1];
      if (newClient) DocFoldersModule.ensureClientFolder(newClient.id, newClient.name);
    }
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

  // Najpierw renderuj listę (żeby formularz był w DOM)
  renderClientsList();

  // Pokaż formularz
  const fc = document.getElementById("client-form-container");
  if (fc) fc.style.display = "block";
  const title = document.getElementById("client-form-title");
  if (title) title.textContent = "Edytuj klienta";
  const btn = document.getElementById("client-submit-btn");
  if (btn) btn.textContent = "Zapisz zmiany";

  const form = document.querySelector("#client-form-container form");
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

  const contactsContainer = document.getElementById("contacts-container");
  if (contactsContainer) {
    contactsContainer.innerHTML = "";
  }

  if (client.contacts && client.contacts.length) {
    client.contacts.forEach(contact => {
      addContactRow();
      const rows = document.querySelectorAll(".contact-row");
      const row = rows[rows.length - 1];
      row.querySelector("[name='contactName']").value = contact.name || "";
      row.querySelector("[name='contactRole']").value = contact.role || "";
      row.querySelector("[name='contactEmail']").value = contact.email || "";
      row.querySelector("[name='contactPhone']").value = contact.phone || "";
    });
  } else {
    addContactRow();
  }

  fc.scrollIntoView({ behavior: "smooth", block: "start" });
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
  const title = document.getElementById("client-form-title");
  if (!fc) return;
  fc.style.display = "block";
  if (title) title.textContent = editing ? "Edytuj klienta" : "Nowy klient";
  const btn = document.getElementById("client-submit-btn");
  if (btn) btn.textContent = editing ? "Zapisz zmiany" : "Dodaj klienta";
  fc.scrollIntoView({ behavior: "smooth", block: "start" });
}

function hideClientForm() {
  const fc = document.getElementById("client-form-container");
  if (fc) fc.style.display = "none";
  editingClientId = null;
  const form = document.querySelector("#client-form-container form");
  if (form) form.reset();
  const btn = document.getElementById("client-submit-btn");
  if (btn) btn.textContent = "Dodaj klienta";
  const title = document.getElementById("client-form-title");
  if (title) title.textContent = "Nowy klient";
  renderClientsList();
}

function renderClientsList() {
  const container = document.getElementById("clients-list");
  if (!container) return;

  const allClients = getClients();
  const q = (window._cliSearch || '').toLowerCase();
  const sort = window._cliSort || 'name_asc';
  const countryLabel = { PL:"Polska", CZ:"Czechy", SK:"Słowacja", DE:"Niemcy", EN:"Inny", AT:"Austria", GB:"W. Brytania" };

  let clients = allClients.filter(c => !q ||
    (c.name||'').toLowerCase().includes(q) ||
    (c.vatId||'').toLowerCase().includes(q) ||
    (c.city||'').toLowerCase().includes(q) ||
    (countryLabel[c.country]||c.country||'').toLowerCase().includes(q)
  );
  clients = [...clients].sort((a,b) => {
    if (sort === 'name_asc')    return (a.name||'').localeCompare(b.name||'');
    if (sort === 'name_desc')   return (b.name||'').localeCompare(a.name||'');
    if (sort === 'country_asc') return (countryLabel[a.country]||a.country||'').localeCompare(countryLabel[b.country]||b.country||'');
    if (sort === 'country_desc')return (countryLabel[b.country]||b.country||'').localeCompare(countryLabel[a.country]||a.country||'');
    if (sort === 'city_asc')    return (a.city||'').localeCompare(b.city||'');
    if (sort === 'city_desc')   return (b.city||'').localeCompare(a.city||'');
    if (sort === 'vat_asc')     return (a.vatId||'').localeCompare(b.vatId||'');
    if (sort === 'vat_desc')    return (b.vatId||'').localeCompare(a.vatId||'');
    if (sort === 'num_asc')     return (ClientsModule.getNumber(a.id)||0) - (ClientsModule.getNumber(b.id)||0);
    if (sort === 'num_desc')    return (ClientsModule.getNumber(b.id)||0) - (ClientsModule.getNumber(a.id)||0);
    return 0;
  });

  const thS = (col, label) => {
    const next = sort === col+'_asc' ? col+'_desc' : col+'_asc';
    const arrow = sort === col+'_asc' ? ' ↑' : sort === col+'_desc' ? ' ↓' : '';
    return `<th style="cursor:pointer;text-align:left;padding:8px 12px;font-size:11px;font-weight:600;color:var(--color-text-secondary);border-bottom:2px solid var(--color-border-tertiary);background:var(--color-background-secondary);white-space:nowrap;" onclick="window._cliSort='${next}';renderClientsList();">${label}${arrow}</th>`;
  };
  const thN = (label) =>
    `<th style="text-align:left;padding:8px 12px;font-size:11px;font-weight:600;color:var(--color-text-secondary);border-bottom:2px solid var(--color-border-tertiary);background:var(--color-background-secondary);">${label}</th>`;

  const tableRows = clients.length === 0
    ? `<tr><td colspan="6" style="padding:20px;text-align:center;color:var(--color-text-secondary);font-size:13px;">${q ? 'Brak wyników wyszukiwania.' : 'Brak klientów — dodaj pierwszego poniżej.'}</td></tr>`
    : clients.map(client => {
        const clientNum = ClientsModule.getNumber(client.id);
        return `<tr>
          <td style="padding:10px 12px;font-size:12px;font-weight:700;color:var(--color-text-tertiary);text-align:center;width:42px;">${clientNum||'—'}</td>
          <td style="padding:10px 12px;font-weight:500;color:var(--color-text-primary);">${escapeHtml(client.name)}</td>
          <td style="padding:10px 12px;font-size:13px;">${escapeHtml(countryLabel[client.country] || client.country || "—")}</td>
          <td style="padding:10px 12px;font-size:13px;">${escapeHtml(client.city || "—")}</td>
          <td style="padding:10px 12px;font-size:13px;">${escapeHtml(client.vatId || "—")}</td>
          <td style="padding:10px 12px;">
            <div class="action-icons">
              <button class="icon-btn" onclick="event.stopPropagation();switchToView('clients',()=>viewClient(${client.id}))" title="Podgląd">👁</button>
              <button class="icon-btn" onclick="event.stopPropagation();editClient(${client.id})" title="Edytuj">✏️</button>
              <button class="icon-btn icon-btn-del" onclick="event.stopPropagation();deleteClient(${client.id})" title="Usuń">🗑</button>
            </div>
          </td>
        </tr>`;
      }).join("");

  // Sprawdź czy formularz jest aktualnie otwarty
  const formContainer = document.getElementById("client-form-container");
  const formIsOpen = formContainer && formContainer.style.display !== "none";
  const formTitle = editingClientId ? "Edytuj klienta" : "Nowy klient";
  const formBtnLabel = editingClientId ? "Zapisz zmiany" : "Dodaj klienta";

  container.innerHTML = `
    <!-- TOOLBAR: licznik + szukaj + dodaj -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;gap:10px;flex-wrap:wrap;">
      <span style="font-size:13px;color:var(--color-text-secondary);">
        ${clients.length}${q ? ' z '+allClients.length : ''} klient${allClients.length === 1 ? '' : (allClients.length < 5 ? 'ów' : 'ów')}
      </span>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <input id="cli-search-input" type="search" placeholder="Szukaj po nazwie, kraju, mieście, VAT ID..."
          value="${escapeHtml(window._cliSearch||'')}"
          oninput="window._cliSearch=this.value;renderClientsList();document.getElementById('cli-search-input')&&document.getElementById('cli-search-input').focus();"
          style="font-size:13px;padding:6px 10px;border:1px solid var(--color-border-tertiary);border-radius:8px;width:280px;" />
        ${!formIsOpen ? `<button class="primary-button" onclick="showClientForm(false)" style="font-size:13px;padding:8px 18px;white-space:nowrap;">+ Dodaj klienta</button>` : ''}
      </div>
    </div>

    <!-- TABELA KLIENTÓW -->
    <div style="overflow-x:auto;border:1px solid var(--color-border-tertiary);border-radius:10px;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            ${thS('num','#')}
            ${thS('name','Nazwa klienta')}
            ${thS('country','Kraj')}
            ${thS('city','Miasto')}
            ${thS('vat','VAT ID')}
            ${thN('Akcje')}
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>

    <!-- FORMULARZ DODAJ/EDYTUJ KLIENTA -->
    <div id="client-form-container" style="display:${formIsOpen ? "block" : "none"};">
      <div style="border:2px solid rgba(11,116,201,0.25);border-radius:16px;background:rgba(11,116,201,0.03);overflow:hidden;">
        <!-- Nagłówek formularza -->
        <div style="background:rgba(11,116,201,0.08);border-bottom:1px solid rgba(11,116,201,0.15);padding:14px 20px;display:flex;justify-content:space-between;align-items:center;">
          <h3 id="client-form-title" style="margin:0;font-size:15px;font-weight:700;color:#0C447C;">👤 ${formTitle}</h3>
          <button class="icon-btn" type="button" onclick="hideClientForm()" title="Zamknij">✕</button>
        </div>
        <div style="padding:20px;">
          <style>
            .cli-section { margin-bottom:16px; border-radius:10px; overflow:hidden; }
            .cli-body { padding:16px; background:var(--color-background-primary); }
            .cli-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px; }
            .cli-grid3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:12px; }
            .cli-grid4 { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:12px; margin-bottom:12px; }
            .cli-field label { font-size:12px; color:var(--color-text-secondary); display:block; margin-bottom:4px; }
            .cli-field input, .cli-field select { width:100%; box-sizing:border-box; }
          </style>
          <form onsubmit="createClient(this); return false;">

            <!-- DANE PODSTAWOWE -->
            <div class="cli-section" style="border:1px solid #B5D4F4;">
              <div style="background:#E6F1FB;padding:12px 16px;display:flex;align-items:center;gap:10px;">
                <span style="font-size:18px;">👤</span>
                <h3 style="margin:0;font-size:15px;font-weight:500;color:#0C447C;">Dane podstawowe</h3>
              </div>
              <div class="cli-body">
                <div class="cli-grid4">
                  <div class="cli-field">
                    <label>Nazwa klienta</label>
                    <input name="name" required placeholder="np. ABC Sp. z o.o." />
                  </div>
                  <div class="cli-field">
                    <label>VAT ID / NIP</label>
                    <input name="vatId" placeholder="np. PL1234567890" />
                  </div>
                  <div class="cli-field">
                    <label>Kraj</label>
                    <select name="country">
                      <option value="PL">Polska</option>
                      <option value="CZ">Czechy</option>
                      <option value="SK">Słowacja</option>
                      <option value="AT">Austria</option>
                      <option value="DE">Niemcy</option>
                      <option value="GB">Wielka Brytania</option>
                      <option value="EN">Inny</option>
                    </select>
                  </div>
                  <div class="cli-field">
                    <label>Język</label>
                    <select name="language">
                      <option value="pl">Polski</option>
                      <option value="en">Angielski</option>
                      <option value="cs">Czeski</option>
                      <option value="sk">Słowacki</option>
                      <option value="de">Niemiecki</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- ADRES -->
            <div class="cli-section" style="border:1px solid #B8E0C8;">
              <div style="background:#E6F5EC;padding:12px 16px;display:flex;align-items:center;gap:10px;">
                <span style="font-size:18px;">📍</span>
                <h3 style="margin:0;font-size:15px;font-weight:500;color:#1A6B3C;">Adres</h3>
              </div>
              <div class="cli-body">
                <div class="cli-grid3">
                  <div class="cli-field">
                    <label>Kod pocztowy</label>
                    <input name="postalCode" placeholder="np. 00-001" />
                  </div>
                  <div class="cli-field">
                    <label>Miasto</label>
                    <input name="city" placeholder="np. Warszawa" />
                  </div>
                  <div class="cli-field">
                    <label>Ulica</label>
                    <input name="street" placeholder="np. Prosta" />
                  </div>
                  <div class="cli-field">
                    <label>Nr budynku</label>
                    <input name="buildingNumber" placeholder="np. 10" />
                  </div>
                  <div class="cli-field">
                    <label>Nr lokalu</label>
                    <input name="apartmentNumber" placeholder="opcjonalnie" />
                  </div>
                  <div class="cli-field">
                    <label>Google Maps URL</label>
                    <input name="googleMapsUrl" type="url" placeholder="https://maps.google.com/..." />
                  </div>
                </div>
              </div>
            </div>

            <!-- OSOBY KONTAKTOWE -->
            <div class="cli-section" style="border:1px solid #C8B5F4;">
              <div style="background:#EDE8FB;padding:12px 16px;display:flex;align-items:center;gap:10px;">
                <span style="font-size:18px;">👥</span>
                <h3 style="margin:0;font-size:15px;font-weight:500;color:#3D0C7C;">Osoby kontaktowe</h3>
              </div>
              <div class="cli-body">
                <div id="contacts-container"></div>
                <button type="button" class="small-button" onclick="addContactRow()" style="margin-top:4px;">+ Dodaj osobę kontaktową</button>
              </div>
            </div>

            <div style="display:flex;gap:10px;margin-top:8px;">
              <button class="primary-button" type="submit" id="client-submit-btn">${formBtnLabel}</button>
              <button class="small-button" type="button" onclick="hideClientForm()">Anuluj</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  // Przywróć focus w polu wyszukiwania jeśli był aktywny przed rerenderem
  if (q || document.activeElement && document.activeElement.type === 'search') {
    const inp = document.getElementById('cli-search-input');
    if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
  }
}

// ─── Widok obiektów konkretnego klienta (drill-down) ─────────────────────────

let currentClientViewId = null;

function openClientObjects(clientId) {
  currentClientViewId = Number(clientId);
  const client = ClientsModule.find(clientId);
  const container = document.getElementById("clients-list");
  if (!container) return;

  const objects = ObjectsModule.findByClient(clientId);

  const objTypeLabel = {
    HOTEL:"Hotel", SCHOOL:"Szkoła", KINDERGARTEN:"Przedszkole",
    OFFICE:"Urząd/administracja", HOUSING_COMMUNITY:"Wspólnota mieszkaniowa",
    COOPERATIVE:"Spółdzielnia", INDUSTRY:"Zakład przemysłowy",
    OFFICE_BUILDING:"Biurowiec", HOSPITAL:"Szpital", OTHER:"Inne"
  };
  const objStatusLabel = { IMPLEMENTATION:"Wdrożenie", ACTIVE:"Aktywny", PAUSED:"Wstrzymany", FINISHED:"Zakończony" };
  const objStatusColor = { IMPLEMENTATION:"#185FA5", ACTIVE:"#27500A", PAUSED:"#7A4A00", FINISHED:"#666" };

  const tableRows = objects.length === 0
    ? `<tr><td colspan="6" style="padding:20px;text-align:center;color:var(--color-text-secondary);font-size:13px;">
        Ten klient nie ma jeszcze żadnych obiektów.
       </td></tr>`
    : objects.map(obj => {
        const protCount = MeasurementsModule.findByObject(obj.id).length;
        const statusColor = objStatusColor[obj.status] || "#666";
        return `<tr>
          <td style="padding:10px 12px;font-size:13px;font-weight:500;">${escapeHtml(obj.name || "—")}</td>
          <td style="padding:10px 12px;font-size:13px;">${escapeHtml(objTypeLabel[obj.objectType] || obj.objectType || "—")}</td>
          <td style="padding:10px 12px;">
            <span style="font-size:11px;font-weight:600;padding:2px 9px;border-radius:20px;background:${statusColor}22;color:${statusColor};">
              ${escapeHtml(objStatusLabel[obj.status] || obj.status || "—")}
            </span>
          </td>
          <td style="padding:10px 12px;white-space:nowrap;">
            <div style="display:flex;gap:4px;flex-wrap:wrap;">
              <button class="small-button" onclick="switchToView('objects',()=>viewObject(${obj.id}))" class="icon-btn" title="Podgląd">👁</button>
              <button class="small-button" onclick="editObject(${obj.id});openModule('objects');" class="icon-btn" title="Edytuj">✏️</button>
              <button class="small-button" onclick="if(confirm('Usunąć obiekt?')){ObjectsModule.remove(${obj.id});openClientObjects(${clientId});}" class="icon-btn icon-btn-del" title="Usuń">🗑</button>
              <button class="small-button" onclick="openObjectProtocols(${obj.id})" style="background:#27500A;color:#fff;border-color:#27500A;white-space:nowrap;">📋 Protokoły (${protCount})</button>
            </div>
          </td>
        </tr>`;
      }).join("");

  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
      <button class="small-button" onclick="renderClientsList()" style="font-size:13px;">← Wszyscy klienci</button>
      <h3 style="margin:0;font-size:16px;color:#0C447C;">🏢 ${escapeHtml(client ? client.name : "Klient")} — Obiekty</h3>
      <span style="font-size:12px;color:var(--color-text-secondary);">(${objects.length})</span>
    </div>
    <div style="overflow-x:auto;border:1px solid var(--color-border-tertiary);border-radius:10px;margin-bottom:16px;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:var(--color-background-secondary);">
            <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Nazwa obiektu</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Typ obiektu</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Status</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Akcje</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>
    <button class="primary-button" onclick="editObject(null);openModule('objects');" style="font-size:13px;padding:10px 20px;">
      + Dodaj obiekt dla tego klienta
    </button>
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
    ? `<div class="reminder-card"><strong>Brak okresów bazowych</strong><div class="reminder-meta">Dodaj pierwszy okres bazowy w module Okresy bazowe.</div></div>`
    : protocols.map(item => {
        const u = item.energyUnit || unit;
        const fmt3 = v => Number(v || 0).toFixed(3);
        return `
        <div class="reminder-card" style="border-left:4px solid #27500A;">
          <strong>📋 Okres bazowy: ${escapeHtml(item.protocolDate || "brak daty")}</strong>
          <div class="reminder-meta">
            Opracował: ${escapeHtml(item.preparedBy || "")}<br />
            Rozliczeniowy: ${escapeHtml(item.billingPeriodStartDate || "")} → ${escapeHtml(item.billingPeriodEndDate || "")}<br />
            Zużycie rozliczeniowe: <strong>${fmt3(item.billingConsumption)} ${u}</strong><br />
            Porównawczy: ${escapeHtml(item.comparisonPeriodStartDate || "")} → ${escapeHtml(item.comparisonPeriodEndDate || "")}<br />
            Zużycie porównawcze: <strong>${fmt3(item.comparisonConsumption)} ${u}</strong>
          </div>
          <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
            <button class="small-button" style="background:#27500A;color:#fff;border-color:#27500A;" onclick="generateESCOReport(${item.id})">⚡ Raport ESCO</button>
            <button class="small-button" onclick="editMeasurement(${item.id});openModule('measurements');" class="icon-btn" title="Edytuj protokół">✏️</button>
            <button class="small-button" onclick="if(confirm('Usuń protokół?')){MeasurementsModule.remove(${item.id});openObjectProtocols(${objectId});}" class="icon-btn icon-btn-del" title="Usuń">🗑</button>
          </div>
        </div>
        `;
      }).join("");

  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
      <button class="small-button" onclick="openClientObjects(${clientId})" style="font-size:13px;">← Obiekty klienta</button>
      <h3 style="margin:0;font-size:16px;color:#27500A;">📋 ${escapeHtml(obj ? obj.name : "Obiekt")} — Okresy bazowe</h3>
    </div>
    <div style="margin-bottom:16px;">
      <button class="primary-button" onclick="selectedMeasurementObjectId=${objectId};openModule('measurements');" style="font-size:13px;">
        + Dodaj nowy okres bazowy
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
    salesRepresentative: form.salesRepresentative ? form.salesRepresentative.value.trim() : "",
    contractStartDate: form.contractStartDate ? form.contractStartDate.value : "",
    contractEndDate: form.contractEndDate ? form.contractEndDate.value : "",
    installationDate: form.installationDate ? form.installationDate.value : "",
    commissioningDate: form.commissioningDate ? form.commissioningDate.value : "",
    settlementModel: form.settlementModel ? form.settlementModel.value : "ESCO",
    escoShare: form.escoShare ? Number(form.escoShare.value) : 50,
    paymentDays: form.paymentDays ? Number(form.paymentDays.value) : 14,
    invoiceEmail: form.invoiceEmail ? form.invoiceEmail.value.trim() : "",

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

  const savedObjectId = editingObjectId || null;

  if (editingObjectId) {
    console.log("UPDATE", editingObjectId);
    ObjectsModule.update(editingObjectId, objectData);
    editingObjectId = null;
  } else {
    console.log("ADD");
    ObjectsModule.add(objectData);
  }

  // Sync billing dates → calendar
  const allObjs = ObjectsModule.getAll();
  const savedObj = savedObjectId
    ? allObjs.find(o => Number(o.id) === Number(savedObjectId))
    : allObjs[allObjs.length - 1];
  if (savedObj) syncObjectBillingToCalendar(savedObj);

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
        <button class="small-button" onclick="switchToView('measurements',()=>viewProtocol(${p.id}))" class="icon-btn" title="Podgląd">👁</button>
        <button class="small-button" onclick="editMeasurement(${p.id});openModule('measurements')" class="icon-btn" title="Edytuj">✏️</button>
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
            Okresy bazowe (${protocols.length})
          </div>
          <button class="primary-button" style="font-size:12px;padding:5px 12px;" onclick="openObjectMeasurements(${obj.id})">
            + Dodaj okres bazowy
          </button>
        </div>
        ${protocols.length === 0
          ? `<div style="font-size:13px;color:var(--color-text-secondary);">Brak protokołów dla tego obiektu.</div>`
          : `<table style="width:100%;border-collapse:collapse;font-size:13px;">
              <thead><tr style="border-bottom:1px solid var(--color-border-tertiary);">
                <th style="text-align:left;padding:7px 10px;font-weight:500;color:var(--color-text-secondary);">Data protokołu</th>
                <th style="text-align:left;padding:7px 10px;font-weight:500;color:var(--color-text-secondary);">Okres bazowy</th>
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
        <button class="small-button" onclick="switchToView('clients',()=>viewClient(${obj.clientId}))">👤 Podgląd klienta</button>
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

  // Restore manual billing dates
  if (object.billingCycle === 'MANUAL_DATES' && object.manualBillingDates && object.manualBillingDates.length > 0) {
    const container = document.getElementById("manualDatesList");
    if (container) {
      container.innerHTML = '';
      object.manualBillingDates.forEach(date => {
        const row = document.createElement("div");
        row.innerHTML = `<input type="date" class="manual-billing-date" style="margin-top:8px;" value="${date}" />`;
        container.appendChild(row);
      });
    }
  }

  form.backOfficeOwner.value = object.backOfficeOwner || "";
  form.energyAnalystOwner.value = object.energyAnalystOwner || "";
  if (form.salesRepresentative) form.salesRepresentative.value = object.salesRepresentative || "";

  if (form.weatherStation) form.weatherStation.value = object.weatherStation || "";
  if (form.weatherSource) form.weatherSource.value = object.weatherSource || "WeatherOnline / Robot Klimatu";
  if (form.weatherSourceUrl) form.weatherSourceUrl.value = object.weatherSourceUrl || "";
  if (form.weatherDataDownloadDate) form.weatherDataDownloadDate.value = object.weatherDataDownloadDate || "";
  if (form.baseTemperature) form.baseTemperature.value = object.baseTemperature || 21;
  if (form.energyUnit) form.energyUnit.value = object.energyUnit || "GJ";
  if (form.currency) form.currency.value = object.currency || "PLN";
  if (form.energyPrice) form.energyPrice.value = object.energyPrice || "";

  // Dane umowne i rozliczeniowe
  if (form.contractStartDate) form.contractStartDate.value = object.contractStartDate || "";
  if (form.contractEndDate) form.contractEndDate.value = object.contractEndDate || "";
  if (form.installationDate) form.installationDate.value = object.installationDate || "";
  if (form.commissioningDate) form.commissioningDate.value = object.commissioningDate || "";
  if (form.settlementModel) form.settlementModel.value = object.settlementModel || "ESCO";
  if (form.escoShare) form.escoShare.value = object.escoShare || 50;
  if (form.paymentDays) form.paymentDays.value = object.paymentDays || 14;
  if (form.invoiceEmail) form.invoiceEmail.value = object.invoiceEmail || "";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteObject(id) {
  if (!confirm("Czy na pewno usunąć obiekt?")) return;
  ObjectsModule.remove(id);
  showObjectForm = false;
  editingObjectId = null;
  renderObjectsModule();
}
function copyPeriodFromProtocol(type) {
  const allObjProtocols = MeasurementsModule.findByObject(selectedMeasurementObjectId)
    .filter(p => !editingMeasurementId || Number(p.id) !== Number(editingMeasurementId))
    .sort((a,b) => (b.protocolDate||'').localeCompare(a.protocolDate||''));
  const prev = allObjProtocols[0];
  if (!prev) { alert('Brak poprzedniego protokołu do skopiowania.'); return; }

  if (type === 'comparison') {
    // Copy comparison period dates + readings + monthly data
    const sd = document.querySelector('[name="comparisonPeriodStartDate"]');
    const ed = document.querySelector('[name="comparisonPeriodEndDate"]');
    const sr = document.querySelector('[name="comparisonPeriodStartReading"]');
    const er = document.querySelector('[name="comparisonPeriodEndReading"]');
    if (sd) sd.value = prev.comparisonPeriodStartDate || '';
    if (ed) ed.value = prev.comparisonPeriodEndDate || '';
    if (sr) sr.value = prev.comparisonPeriodStartReading !== undefined ? prev.comparisonPeriodStartReading : '';
    if (er) er.value = prev.comparisonPeriodEndReading !== undefined ? prev.comparisonPeriodEndReading : '';
    refreshPeriodTable('comparison');
    // Restore monthly temps + days after refreshPeriodTable rebuilds rows
    setTimeout(() => {
      (prev.comparisonMonthly || []).forEach(m => {
        const key = `${m.year}-${m.month}`;
        const tr = document.querySelector(`#comparison-months-tbody tr[data-key="${key}"]`);
        if (!tr) return;
        const tInput = tr.querySelector('input.month-temp');
        const dInput = tr.querySelector('input.month-days');
        if (tInput && m.temperature !== null && m.temperature !== undefined) tInput.value = m.temperature;
        if (dInput && m.days !== undefined) dInput.value = m.days;
      });
      refreshPeriodHDD('comparison');
      refreshConsumption('comparison');
      // Flash button
      const btn = document.querySelector('[onclick*="comparison"]');
      if (btn) { btn.textContent = '✅ Skopiowano!'; btn.style.background = '#EAF3DE'; setTimeout(() => { btn.textContent = '📋 Kopiuj z poprzedniego protokołu'; btn.style.background = 'white'; }, 2000); }
    }, 50);

  } else if (type === 'tym') {
    // Copy TYM data
    const tymSrc = document.querySelector('[name="tymPeriodStart"]');
    const tymEnd = document.querySelector('[name="tymPeriodEnd"]');
    const tymDS  = document.querySelector('[name="tymDataSource"]');
    if (tymSrc) tymSrc.value = prev.tymPeriodStart || '';
    if (tymEnd) tymEnd.value = prev.tymPeriodEnd || '';
    if (tymDS)  tymDS.value  = prev.tymDataSource || '';
    (prev.tymMonthly || []).forEach(m => {
      const tInput = document.querySelector(`[name="tymTemp_${m.month}"]`);
      const dInput = document.querySelector(`[name="tymDays_${m.month}"]`);
      const temp = m.tymTemperature !== undefined ? m.tymTemperature : m.temperature;
      const days = m.tymDays !== undefined ? m.tymDays : m.days;
      if (tInput && temp !== null && temp !== undefined) tInput.value = temp;
      if (dInput && days !== undefined) dInput.value = days;
    });
    refreshTymHDD();
    const btn = document.querySelector('[onclick*="tym"]');
    if (btn) { btn.textContent = '✅ Skopiowano!'; btn.style.background = '#FAEEDA'; setTimeout(() => { btn.textContent = '📋 Kopiuj TYM z poprzedniego protokołu'; btn.style.background = 'white'; }, 2000); }
  }
}

function copyClientAddress(btn) {
  const form = btn.closest('form');
  if (!form) return;
  const clientId = Number(form.clientId && form.clientId.value);
  if (!clientId) { alert('Najpierw wybierz klienta.'); return; }
  const clients = getClients();
  const client = clients.find(c => Number(c.id) === clientId);
  if (!client) { alert('Nie znaleziono klienta.'); return; }
  if (form.country) form.country.value = client.country || 'PL';
  if (form.postalCode) form.postalCode.value = client.postalCode || '';
  if (form.city) form.city.value = client.city || '';
  if (form.street) form.street.value = client.street || '';
  if (form.buildingNumber) form.buildingNumber.value = client.buildingNumber || '';
  if (form.apartmentNumber) form.apartmentNumber.value = client.apartmentNumber || '';
  if (form.googleMapsUrl && client.googleMapsUrl) form.googleMapsUrl.value = client.googleMapsUrl;
  btn.textContent = '✅ Skopiowano!';
  btn.style.background = '#E6F5EC';
  setTimeout(() => { btn.textContent = '📋 Kopiuj adres klienta'; btn.style.background = 'white'; }, 2000);
}

function renderObjectsModule() {
  const container = document.getElementById("module-content");
  if (!container) return;

  const clients = getClients();

  if (clients.length === 0) {
    container.innerHTML = `
      <div class="reminder-card">
        <strong>Najpierw dodaj klienta</strong>
        <div class="reminder-meta">Obiekt musi być przypisany do klienta.</div>
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
  const objStatusLabel = { IMPLEMENTATION:"Wdrożenie", ACTIVE:"Aktywny", PAUSED:"Wstrzymany", FINISHED:"Zakończony" };
  const objStatusColor = { IMPLEMENTATION:"#185FA5", ACTIVE:"#27500A", PAUSED:"#7A4A00", FINISHED:"#666" };

  const qObj = (window._objSearch || '').toLowerCase();
  const sortObj = window._objSort || 'num_asc';

  let displayObjects = allObjects.filter(obj => !qObj ||
    (obj.name||'').toLowerCase().includes(qObj) ||
    (getClientName(obj.clientId)||'').toLowerCase().includes(qObj) ||
    (objTypeLabel[obj.objectType]||obj.objectType||'').toLowerCase().includes(qObj) ||
    (objStatusLabel[obj.status]||'').toLowerCase().includes(qObj)
  );
  displayObjects = [...displayObjects].sort((a,b) => {
    if (sortObj === 'name_asc')    return (a.name||'').localeCompare(b.name||'');
    if (sortObj === 'name_desc')   return (b.name||'').localeCompare(a.name||'');
    if (sortObj === 'client_asc')  return (getClientName(a.clientId)||'').localeCompare(getClientName(b.clientId)||'');
    if (sortObj === 'client_desc') return (getClientName(b.clientId)||'').localeCompare(getClientName(a.clientId)||'');
    if (sortObj === 'type_asc')    return (objTypeLabel[a.objectType]||a.objectType||'').localeCompare(objTypeLabel[b.objectType]||b.objectType||'');
    if (sortObj === 'type_desc')   return (objTypeLabel[b.objectType]||b.objectType||'').localeCompare(objTypeLabel[a.objectType]||a.objectType||'');
    if (sortObj === 'status_asc')     return (a.status||'').localeCompare(b.status||'');
    if (sortObj === 'status_desc')    return (b.status||'').localeCompare(a.status||'');
    if (sortObj === 'backoffice_asc') return (a.backOfficeOwner||'').localeCompare(b.backOfficeOwner||'');
    if (sortObj === 'backoffice_desc')return (b.backOfficeOwner||'').localeCompare(a.backOfficeOwner||'');
    if (sortObj === 'sales_asc')      return (a.salesRepresentative||'').localeCompare(b.salesRepresentative||'');
    if (sortObj === 'sales_desc')     return (b.salesRepresentative||'').localeCompare(a.salesRepresentative||'');
    if (sortObj === 'analyst_asc')    return (a.energyAnalystOwner||'').localeCompare(b.energyAnalystOwner||'');
    if (sortObj === 'analyst_desc')   return (b.energyAnalystOwner||'').localeCompare(a.energyAnalystOwner||'');
    if (sortObj === 'num_asc') {
      const na = (ClientsModule.getNumber(a.clientId)||0)*1000 + (ObjectsModule.getNumber(a.id)||0);
      const nb = (ClientsModule.getNumber(b.clientId)||0)*1000 + (ObjectsModule.getNumber(b.id)||0);
      return na - nb;
    }
    if (sortObj === 'num_desc') {
      const na = (ClientsModule.getNumber(a.clientId)||0)*1000 + (ObjectsModule.getNumber(a.id)||0);
      const nb = (ClientsModule.getNumber(b.clientId)||0)*1000 + (ObjectsModule.getNumber(b.id)||0);
      return nb - na;
    }
    return 0;
  });

  const thObj = (col, label) => {
    const next = sortObj === col+'_asc' ? col+'_desc' : col+'_asc';
    const arrow = sortObj === col+'_asc' ? ' ↑' : sortObj === col+'_desc' ? ' ↓' : '';
    return `<th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);cursor:pointer;white-space:nowrap;"
      onclick="window._objSort='${next}';renderObjectsModule();">${label}${arrow}</th>`;
  };

  const tableRows = displayObjects.length === 0
    ? `<tr><td colspan="9" style="padding:20px;text-align:center;color:var(--color-text-secondary);font-size:13px;">${qObj ? 'Brak wyników wyszukiwania.' : 'Brak obiektów — dodaj pierwszy poniżej.'}</td></tr>`
    : displayObjects.map(obj => {
        const statusColor = objStatusColor[obj.status] || "#666";
        const protCount = MeasurementsModule.findByObject(obj.id).length;
        const objNum = ObjectsModule.getNumber(obj.id);
        const objClientNum = ClientsModule.getNumber(obj.clientId);
        const objLabel = (objClientNum != null && objNum != null) ? 'K'+objClientNum+'-'+objNum : '—';
        return `<tr style="border-bottom:1px solid var(--color-border-tertiary);">
          <td style="padding:10px 12px;font-size:12px;font-weight:600;color:var(--color-text-tertiary);text-align:center;">${objLabel}</td>
          <td style="padding:10px 12px;font-size:13px;font-weight:500;">${escapeHtml(obj.name || "—")}</td>
          <td style="padding:10px 12px;font-size:13px;">${escapeHtml(getClientName(obj.clientId))}</td>
          <td style="padding:10px 12px;font-size:13px;">${escapeHtml(objTypeLabel[obj.objectType] || obj.objectType || "—")}</td>
          <td style="padding:10px 12px;">
            <span style="font-size:11px;font-weight:600;padding:2px 9px;border-radius:20px;background:${statusColor}22;color:${statusColor};">
              ${escapeHtml(objStatusLabel[obj.status] || obj.status || "—")}
            </span>
          </td>
          <td style="padding:10px 12px;font-size:12px;color:var(--color-text-secondary);">${escapeHtml(obj.backOfficeOwner || "—")}</td>
          <td style="padding:10px 12px;font-size:12px;color:var(--color-text-secondary);">${escapeHtml(obj.salesRepresentative || "—")}</td>
          <td style="padding:10px 12px;font-size:12px;color:var(--color-text-secondary);">${escapeHtml(obj.energyAnalystOwner || "—")}</td>
          <td style="padding:6px 12px;white-space:nowrap;">
            <div style="display:flex;gap:4px;align-items:center;">
              <button class="icon-btn" onclick="event.stopPropagation();switchToView('objects',()=>viewObject(${obj.id}))" title="Podgląd">👁</button>
              <button class="icon-btn" onclick="event.stopPropagation();showObjectForm=true;editingObjectId=null;editObject(${obj.id});" title="Edytuj">✏️</button>
              <button class="icon-btn icon-btn-del" onclick="event.stopPropagation();deleteObject(${obj.id})" title="Usuń">🗑</button>
            </div>
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

    <!-- TABELA OBIEKTÓW — zawsze widoczna -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;gap:10px;flex-wrap:wrap;">
      <span style="font-size:13px;color:var(--color-text-secondary);">
        ${displayObjects.length}${qObj ? ' z '+allObjects.length : ''} obiekt${allObjects.length===1?'':allObjects.length<5?'y':'ów'}
      </span>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <input id="obj-search-input" type="search" placeholder="Szukaj po nazwie, kliencie, typie..." value="${escapeHtml(window._objSearch||'')}"
          oninput="window._objSearch=this.value;renderObjectsModule();setTimeout(()=>{const s=document.getElementById('obj-search-input');if(s){s.focus();s.setSelectionRange(s.value.length,s.value.length);}},0);"
          style="font-size:13px;padding:6px 10px;border:1px solid var(--color-border-tertiary);border-radius:8px;width:260px;" />
        ${!showObjectForm ? '<button class="primary-button" onclick="showObjectForm=true;editingObjectId=null;renderObjectsModule();" style="font-size:13px;padding:8px 18px;white-space:nowrap;">+ Dodaj obiekt</button>' : ''}
      </div>
    </div>
    <div style="overflow-x:auto;border:1px solid var(--color-border-tertiary);border-radius:10px;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:var(--color-background-secondary);">
            ${thObj('num','#')}
            ${thObj('name','Nazwa obiektu')}
            ${thObj('client','Klient')}
            ${thObj('type','Typ')}
            ${thObj('status','Status')}
            ${thObj('backoffice','Back Office')}
            ${thObj('sales','Sales Rep')}
            ${thObj('analyst','Energy Analyst')}
            <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Akcje</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>

    <!-- FORMULARZ DODAJ/EDYTUJ — pod tabelą -->
    <div id="objects-form-view" style="display:${showObjectForm ? "block" : "none"};">
      <div style="border:1px solid var(--color-border-tertiary);border-radius:14px;padding:20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h3 style="margin:0;font-size:16px;color:#0C447C;">${editingObjectId ? "Edytuj obiekt" : "Nowy obiekt"}</h3>
          <button class="small-button" type="button" onclick="showObjectForm=false;editingObjectId=null;renderObjectsModule();">✕ Zamknij</button>
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
            <div class="obj-grid3">
              <div class="obj-field">
                <label>Back Office</label>
                <select name="backOfficeOwner">
                  <option value="">— wybierz —</option>
                  ${(typeof UsersModule !== 'undefined' ? UsersModule.findByRole('backOffice') : [])
                    .map(u => `<option value="${escapeHtml(u.firstName + ' ' + u.lastName)}">${escapeHtml(u.firstName + ' ' + u.lastName)}</option>`).join('')}
                  ${editingObjectId && (() => { const o = ObjectsModule.find(editingObjectId); const v = o && o.backOfficeOwner; const exists = v && (typeof UsersModule !== 'undefined') && UsersModule.findByRole('backOffice').some(u => u.firstName + ' ' + u.lastName === v); return (v && !exists) ? `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>` : ''; })()}
                </select>
              </div>
              <div class="obj-field">
                <label>Sales Representative</label>
                <select name="salesRepresentative">
                  <option value="">— wybierz —</option>
                  ${(typeof UsersModule !== 'undefined' ? UsersModule.findByRole('salesRepresentative') : [])
                    .map(u => `<option value="${escapeHtml(u.firstName + ' ' + u.lastName)}">${escapeHtml(u.firstName + ' ' + u.lastName)}</option>`).join('')}
                  ${editingObjectId && (() => { const o = ObjectsModule.find(editingObjectId); const v = o && o.salesRepresentative; const exists = v && (typeof UsersModule !== 'undefined') && UsersModule.findByRole('salesRepresentative').some(u => u.firstName + ' ' + u.lastName === v); return (v && !exists) ? `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>` : ''; })()}
                </select>
              </div>
              <div class="obj-field">
                <label>Energy Analyst</label>
                <select name="energyAnalystOwner">
                  <option value="">— wybierz —</option>
                  ${(typeof UsersModule !== 'undefined' ? UsersModule.findByRole('energyAnalyst') : [])
                    .map(u => `<option value="${escapeHtml(u.firstName + ' ' + u.lastName)}">${escapeHtml(u.firstName + ' ' + u.lastName)}</option>`).join('')}
                  ${editingObjectId && (() => { const o = ObjectsModule.find(editingObjectId); const v = o && o.energyAnalystOwner; const exists = v && (typeof UsersModule !== 'undefined') && UsersModule.findByRole('energyAnalyst').some(u => u.firstName + ' ' + u.lastName === v); return (v && !exists) ? `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>` : ''; })()}
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- DANE UMOWNE I ROZLICZENIOWE -->
        <div class="obj-section" style="border:1px solid #F4D4F4;">
          <div style="background:#FBE8FB;padding:12px 16px;display:flex;align-items:center;gap:10px;">
            <span style="font-size:18px;">📋</span>
            <h3 style="margin:0;font-size:15px;font-weight:500;color:#6B0C7C;">Dane umowne i rozliczeniowe</h3>
          </div>
          <div class="obj-body">
            <div class="obj-grid4">
              <div class="obj-field">
                <label>Od kiedy umowa</label>
                <input name="contractStartDate" type="date" />
              </div>
              <div class="obj-field">
                <label>Do kiedy umowa</label>
                <input name="contractEndDate" type="date" />
              </div>
              <div class="obj-field">
                <label>Kiedy instalacja</label>
                <input name="installationDate" type="date" />
              </div>
              <div class="obj-field">
                <label>Kiedy uruchomienie</label>
                <input name="commissioningDate" type="date" />
              </div>
            </div>
            <div class="obj-grid4">
              <div class="obj-field">
                <label>Model rozliczenia</label>
                <select name="settlementModel">
                  <option value="ESCO">ESCO</option>
                  <option value="FLAT">Abonament</option>
                  <option value="PROJECT">Projekt</option>
                </select>
              </div>
              <div class="obj-field">
                <label>Udział ESCO (%)</label>
                <input name="escoShare" type="number" min="0" max="100" value="50" />
              </div>
              <div class="obj-field">
                <label>Termin płatności (dni)</label>
                <input name="paymentDays" type="number" min="0" value="14" />
              </div>
              <div class="obj-field">
                <label>E-mail do faktur</label>
                <input name="invoiceEmail" type="email" placeholder="np. ksiegowosc@firma.pl" />
              </div>
            </div>
          </div>
        </div>

        <!-- ADRES -->
        <div class="obj-section" style="border:1px solid #B8E0C8;">
          <div style="background:#E6F5EC;padding:12px 16px;display:flex;align-items:center;gap:10px;">
            <span style="font-size:18px;">📍</span>
            <h3 style="margin:0;font-size:15px;font-weight:500;color:#1A6B3C;">Adres obiektu</h3>
            <button type="button" onclick="copyClientAddress(this)" style="margin-left:auto;font-size:12px;padding:4px 12px;border:1px solid #1A6B3C;border-radius:6px;background:white;color:#1A6B3C;cursor:pointer;white-space:nowrap;">📋 Kopiuj adres klienta</button>
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

        <div style="display:flex;gap:10px;margin-top:8px;">
          <button class="primary-button" type="submit">${editingObjectId ? "Zapisz zmiany" : "Dodaj obiekt"}</button>
          <button class="small-button" type="button" onclick="showObjectForm=false;editingObjectId=null;renderObjectsModule();">Anuluj</button>
        </div>

        </form>
      </div>
    </div>

    <!-- PRZYCISK DODAJ — pod formularzem gdy zamknięty -->

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
        <button class="small-button" onclick="deleteWorkflowItem(${item.id})" class="icon-btn icon-btn-del" title="Usuń">🗑</button>
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

function syncObjectBillingToCalendar(obj) {
  if (!obj || !obj.billingCycle || obj.billingCycle === 'NONE') return;

  const objectId = Number(obj.id);
  const clientId = Number(obj.clientId);
  const reminderDays = Number(obj.reminderDaysBefore || 14);
  const today = new Date().toISOString().slice(0, 10);
  const clientName = (ClientsModule.find(clientId) || {}).name || '';

  // Remove existing MEASUREMENT_DUE events for this object (auto-generated ones)
  const existing = CalendarModule.getAll();
  CalendarModule.saveAll(
    existing.filter(e =>
      !(Number(e.objectId) === objectId &&
        e.eventType === 'MEASUREMENT_DUE' &&
        e.autoGenerated === true &&
        e.dueDate >= today)
    )
  );

  // Generate future billing dates (24 months ahead)
  const futureDates = [];

  if (obj.billingCycle === 'MANUAL_DATES') {
    (obj.manualBillingDates || []).filter(d => d >= today).forEach(d => futureDates.push(d));
  } else {
    const cycleMonths = { MONTHLY: 1, BIMONTHLY: 2, QUARTERLY: 3, HALF_YEAR: 6, YEARLY: 12 };
    const step = cycleMonths[obj.billingCycle] || 1;
    const start = obj.billingStartDate ? new Date(obj.billingStartDate) : new Date();
    // Advance start to next future occurrence
    const cur = new Date(start);
    const limit = new Date();
    limit.setMonth(limit.getMonth() + 24);
    while (cur <= limit) {
      const ds = cur.toISOString().slice(0, 10);
      if (ds >= today) futureDates.push(ds);
      cur.setMonth(cur.getMonth() + step);
    }
  }

  // Add calendar events for each future date
  futureDates.forEach(dueDate => {
    CalendarModule.add({
      clientId,
      objectId,
      title: `Termin rozliczenia — ${escapeHtml(obj.name || 'Obiekt')}${clientName ? ' / ' + clientName : ''}`,
      description: `Automatycznie wygenerowane na podstawie cyklu rozliczeniowego obiektu.`,
      eventType: 'MEASUREMENT_DUE',
      dueDate,
      reminderDays: [0, reminderDays].filter((v, i, a) => a.indexOf(v) === i),
      recurrence: 'ONE_TIME',
      responsibleRole: 'BACK_OFFICE',
      autoGenerated: true
    });
  });
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
let activeMeasurementsTab = "tym"; // "tym" | "regression" | "occupancy" | "area" | "volume" | "schedule" | "custom"
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

function refreshProtocolNumberSuggestion(objectId) {
  const inp = document.getElementById('protocol-number-input');
  if (!inp || inp.dataset.userEdited === '1') return;
  const suggested = MeasurementsModule.suggestProtocolNumber(objectId, null);
  if (suggested) inp.value = suggested;
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
  refreshProtocolNumberSuggestion(selectedMeasurementObjectId);

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

  const protocolNumberVal = form.protocolNumber ? form.protocolNumber.value.trim() : "";
  if (!protocolNumberVal) {
    alert("Numer protokołu jest wymagany. Bez niego nie można zapisać okresu bazowego.");
    if (form.protocolNumber) form.protocolNumber.focus();
    return;
  }
  const duplicateProtocol = MeasurementsModule.getAll().find(p =>
    String(p.protocolNumber || "").trim() === protocolNumberVal &&
    (!editingMeasurementId || Number(p.id) !== Number(editingMeasurementId))
  );
  if (duplicateProtocol) {
    alert("Numer protokołu \"" + protocolNumberVal + "\" już istnieje. Wybierz inny numer.");
    if (form.protocolNumber) form.protocolNumber.focus();
    return;
  }

  const billingStart = Number((form.billingPeriodStartReading ? form.billingPeriodStartReading.value : 0) || 0);
  const billingEnd = Number((form.billingPeriodEndReading ? form.billingPeriodEndReading.value : 0) || 0);
  const comparisonStart = Number((form.comparisonPeriodStartReading ? form.comparisonPeriodStartReading.value : 0) || 0);
  const comparisonEnd = Number((form.comparisonPeriodEndReading ? form.comparisonPeriodEndReading.value : 0) || 0);

  const tymMonthly = buildTymMonthlyFromForm(form);
  const realMonthly = buildPeriodMonthlyFromForm("billing");
  const comparisonMonthly = buildPeriodMonthlyFromForm("comparison");

  const protocolData = {
    clientId: object.clientId,
    objectId: form.objectId.value,

    protocolNumber: form.protocolNumber ? form.protocolNumber.value.trim() : "",
    protocolDate: form.elements["protocolDate"] ? form.elements["protocolDate"].value : "",
    protocolStatus: form.protocolStatus ? form.protocolStatus.value : "DRAFT",
    preparedBy: form.preparedBy ? form.preparedBy.value.trim() : "",
    approvedBy: form.approvedBy ? form.approvedBy.value.trim() : "",
    protocolNotes: form.protocolNotes ? form.protocolNotes.value.trim() : "",

    weatherStation: form.weatherStation ? form.weatherStation.value.trim() : "",
    weatherSource: form.weatherSource ? form.weatherSource.value.trim() : "",
    weatherSourceUrl: form.weatherSourceUrl ? form.weatherSourceUrl.value.trim() : "",
    weatherDataDownloadDate: form.elements["weatherDataDownloadDate"] ? form.elements["weatherDataDownloadDate"].value : "",
    baseTemperature: Number(form.baseTemperature.value || 21),

    energyUnit: (form.energyUnit ? form.energyUnit.value : null) || object.energyUnit || 'kWh',
    currency: (form.currency ? form.currency.value : null) || object.currency || 'PLN',
    energyPrice: Number((form.energyPrice ? form.energyPrice.value : null) || object.energyPrice || 0),
    waterAiShare: Number((form.waterAiShare ? form.waterAiShare.value : null) || object.escoShare || 0),

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

  let savedProtocol;
  if (editingMeasurementId) {
    MeasurementsModule.update(editingMeasurementId, protocolData);
    savedProtocol = MeasurementsModule.find(editingMeasurementId);
    editingMeasurementId = null;
  } else {
    MeasurementsModule.add(protocolData);
    const all = MeasurementsModule.getAll();
    savedProtocol = all[all.length - 1];
  }

  // Sync: mark matching MEASUREMENT_DUE calendar event as DONE
  if (savedProtocol && savedProtocol.billingPeriodEndDate) {
    const endDate = savedProtocol.billingPeriodEndDate;
    const objId = Number(savedProtocol.objectId);
    const eventsToClose = CalendarModule.getAll().filter(e =>
      Number(e.objectId) === objId &&
      e.eventType === 'MEASUREMENT_DUE' &&
      e.status === 'PENDING' &&
      e.dueDate <= endDate
    );
    eventsToClose.forEach(e => CalendarModule.markDone(e.id, 'auto'));
  }

  // Sync: create ANALYSIS_DUE reminder (next step after protocol)
  if (savedProtocol && savedProtocol.billingPeriodEndDate && !editingMeasurementId) {
    const obj = ObjectsModule.find(savedProtocol.objectId);
    const reminderDays = obj ? Number(obj.reminderDaysBefore || 14) : 14;
    const due = new Date(savedProtocol.billingPeriodEndDate);
    due.setDate(due.getDate() + reminderDays);
    const clientName = (ClientsModule.find(savedProtocol.clientId) || {}).name || '';
    CalendarModule.add({
      clientId: savedProtocol.clientId,
      objectId: savedProtocol.objectId,
      title: `Termin analizy — ${escapeHtml((obj || {}).name || 'Obiekt')}${clientName ? ' / ' + clientName : ''}`,
      description: `Automatycznie po dodaniu protokołu TYM z dn. ${savedProtocol.protocolDate || ''}.`,
      eventType: 'ANALYSIS_DUE',
      dueDate: due.toISOString().slice(0, 10),
      reminderDays: [0, 7],
      recurrence: 'ONE_TIME',
      responsibleRole: 'ENERGY_ANALYST',
      autoGenerated: true,
      linkedMeasurementId: savedProtocol.id
    });
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

  const tymMonthly = p.tymMonthly || [];
  const tymTotalDays = tymMonthly.reduce((s,m) => s + Number(m.tymDays ?? m.days ?? 0), 0);
  const tymRows = tymMonthly.map(m => {
    const days = m.tymDays ?? m.days ?? "";
    const temp = m.tymTemperature ?? m.temperature;
    const hdd = fmt2(Math.max(0,(Number(p.baseTemperature||21)-Number(temp||0))*Number(days||0)));
    return `<tr>
      <td style="padding:5px 8px;font-size:13px;">${escapeHtml(m.monthName||("M"+m.month))}</td>
      <td style="padding:5px 8px;font-size:13px;text-align:right;">${temp!==null&&temp!==undefined?fmt2(temp):"—"}</td>
      <td style="padding:5px 8px;font-size:13px;text-align:right;">${days !== "" ? days : "—"}</td>
      <td style="padding:5px 8px;font-size:13px;text-align:right;">${hdd}</td>
    </tr>`;
  }).join("");

  const billingMonthly = p.realMonthly || [];
  const billingTotalDays = billingMonthly.reduce((s,m) => s + Number(m.days ?? 0), 0);
  const billingRows = billingMonthly.map(m => {
    const days = m.days ?? "";
    const temp = m.temperature;
    const hdd = fmt2(Math.max(0,(Number(p.baseTemperature||21)-Number(temp||0))*Number(days||0)));
    return `<tr>
      <td style="padding:5px 8px;font-size:13px;">${escapeHtml(m.monthName||("M"+m.month))}</td>
      <td style="padding:5px 8px;font-size:13px;text-align:right;">${temp!==null&&temp!==undefined?fmt2(temp):"—"}</td>
      <td style="padding:5px 8px;font-size:13px;text-align:right;">${days !== "" ? days : "—"}</td>
      <td style="padding:5px 8px;font-size:13px;text-align:right;">${hdd}</td>
    </tr>`;
  }).join("");

  const compMonthly = p.comparisonMonthly || [];
  const compTotalDays = compMonthly.reduce((s,m) => s + Number(m.days ?? 0), 0);
  const compRows = compMonthly.map(m => {
    const days = m.days ?? "";
    const temp = m.temperature;
    const hdd = fmt2(Math.max(0,(Number(p.baseTemperature||21)-Number(temp||0))*Number(days||0)));
    return `<tr>
      <td style="padding:5px 8px;font-size:13px;">${escapeHtml(m.monthName||("M"+m.month))}</td>
      <td style="padding:5px 8px;font-size:13px;text-align:right;">${temp!==null&&temp!==undefined?fmt2(temp):"—"}</td>
      <td style="padding:5px 8px;font-size:13px;text-align:right;">${days !== "" ? days : "—"}</td>
      <td style="padding:5px 8px;font-size:13px;text-align:right;">${hdd}</td>
    </tr>`;
  }).join("");

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
            📋 Okres bazowy — ${escapeHtml(p.protocolDate||"brak daty")}
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
            <div style="font-size:13px;color:var(--color-text-secondary);">Liczba dni okresu</div>
            <div style="font-size:14px;font-weight:600;margin-bottom:8px;color:#0C447C;">${billingTotalDays} dni</div>
            <div style="font-size:13px;color:var(--color-text-secondary);">Odczyt startowy</div>
            <div style="font-size:14px;margin-bottom:8px;">${fmt3(p.billingPeriodStartReading??0)} ${escapeHtml(u)}</div>
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
            <div style="font-size:13px;color:var(--color-text-secondary);">Liczba dni okresu</div>
            <div style="font-size:14px;font-weight:600;margin-bottom:8px;color:#27500A;">${compTotalDays} dni</div>
            <div style="font-size:13px;color:var(--color-text-secondary);">Odczyt startowy</div>
            <div style="font-size:14px;margin-bottom:8px;">${fmt3(p.comparisonPeriodStartReading??0)} ${escapeHtml(u)}</div>
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
              <td style="padding:6px 8px;font-weight:600;font-size:13px;">Suma</td>
              <td style="padding:6px 8px;font-size:13px;text-align:right;">—</td>
              <td style="padding:6px 8px;font-weight:600;font-size:13px;text-align:right;">${tymTotalDays}</td>
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
              <td style="padding:6px 8px;font-weight:600;font-size:13px;">Suma</td>
              <td style="padding:6px 8px;font-size:13px;text-align:right;">—</td>
              <td style="padding:6px 8px;font-weight:600;font-size:13px;text-align:right;">${billingTotalDays}</td>
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
              <td style="padding:6px 8px;font-weight:600;font-size:13px;">Suma</td>
              <td style="padding:6px 8px;font-size:13px;text-align:right;">—</td>
              <td style="padding:6px 8px;font-weight:600;font-size:13px;text-align:right;">${compTotalDays}</td>
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

      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
        <button class="primary-button" style="background:#27500A;border-color:#27500A;" onclick="generateESCOReport(${p.id})">⚡ Generuj Raport ESCO</button>
        <button class="small-button" onclick="editMeasurement(${p.id});openModule('measurements')">✏️ Edytuj protokół</button>
        ${obj ? `<button class="small-button" onclick="switchToView('objects',()=>viewObject(${obj.id}))">🏗️ Podgląd obiektu</button>` : ""}
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
  if (form.billingPeriodStartReading) form.billingPeriodStartReading.value = protocol.billingPeriodStartReading ?? "";
  if (form.billingPeriodEndReading) form.billingPeriodEndReading.value = protocol.billingPeriodEndReading ?? "";

  if (form.elements["comparisonPeriodStartDate"]) form.elements["comparisonPeriodStartDate"].value = protocol.comparisonPeriodStartDate || "";
  if (form.elements["comparisonPeriodEndDate"]) form.elements["comparisonPeriodEndDate"].value = protocol.comparisonPeriodEndDate || "";
  if (form.comparisonPeriodStartReading) form.comparisonPeriodStartReading.value = protocol.comparisonPeriodStartReading ?? "";
  if (form.comparisonPeriodEndReading) form.comparisonPeriodEndReading.value = protocol.comparisonPeriodEndReading ?? "";

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

  // Sum of days
  const daysEl = document.getElementById(`${prefix}-days-display`);
  if (daysEl) {
    let totalDays = 0;
    tbody.querySelectorAll('tr[data-key]').forEach(tr => {
      const dInput = tr.querySelector('input.month-days');
      if (dInput) totalDays += Number(dInput.value || 0);
    });
    daysEl.textContent = totalDays;
  }
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

  // Sum of TYM days
  const tymDaysEl = document.getElementById('tym-days-display');
  if (tymDaysEl) {
    let totalDays = 0;
    for (let m = 1; m <= 12; m++) {
      const dInput = document.querySelector(`[name="tymDays_${m}"]`);
      if (dInput) totalDays += Number(dInput.value || 0);
    }
    tymDaysEl.textContent = totalDays;
  }
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
        <div class="reminder-meta">Okres bazowy musi być przypisany do konkretnego obiektu.</div>
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

  // For copy button: find most recent existing protocol for this object (not the one being edited)
  const allObjProtocols = MeasurementsModule.findByObject(selectedMeasurementObjectId)
    .filter(p => !editingMeasurementId || Number(p.id) !== Number(editingMeasurementId))
    .sort((a,b) => (b.protocolDate||'').localeCompare(a.protocolDate||''));
  const prevProtocol = allObjProtocols[0] || null;

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
      onclick="activeMeasurementsTab='tym'; showMeasurementForm=false; renderMeasurementsModule();">
      🌡️ Korekta TYM
    </button>
    <button type="button" class="meas-tab meas-tab-reg ${activeMeasurementsTab === 'regression' ? 'active' : ''}"
      onclick="activeMeasurementsTab='regression'; showMeasurementForm=false; renderMeasurementsModule();">
      📈 Regresja liniowa
    </button>
    <button type="button" class="meas-tab ${activeMeasurementsTab === 'occupancy' ? 'active' : ''}"
      onclick="activeMeasurementsTab='occupancy'; showMeasurementForm=false; renderMeasurementsModule();">
      🏨 Korekta obłożenia
    </button>
    <button type="button" class="meas-tab ${activeMeasurementsTab === 'area' ? 'active' : ''}"
      onclick="activeMeasurementsTab='area'; showMeasurementForm=false; renderMeasurementsModule();">
      📐 Korekta powierzchni
    </button>
    <button type="button" class="meas-tab ${activeMeasurementsTab === 'volume' ? 'active' : ''}"
      onclick="activeMeasurementsTab='volume'; showMeasurementForm=false; renderMeasurementsModule();">
      ⚙️ Korekta intensywności
    </button>
    <button type="button" class="meas-tab ${activeMeasurementsTab === 'schedule' ? 'active' : ''}"
      onclick="activeMeasurementsTab='schedule'; showMeasurementForm=false; renderMeasurementsModule();">
      📅 Harmonogram
    </button>
    <button type="button" class="meas-tab ${activeMeasurementsTab === 'custom' ? 'active' : ''}"
      onclick="activeMeasurementsTab='custom'; showMeasurementForm=false; renderMeasurementsModule();">
      🔬 Własna
    </button>
  </div>

  ${activeMeasurementsTab === 'regression' ? '' : activeMeasurementsTab !== 'tym' ? '' : (!showMeasurementForm ? '' : `<form onsubmit="createMeasurement(this); return false;">

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
              ${clients.map(c => { const cn = ClientsModule.getNumber(c.id); return `<option value="${c.id}" ${Number(c.id) === selectedClientId ? "selected" : ""}>${cn ? "K"+cn+" — " : ""}${escapeHtml(c.name)}</option>`; }).join("")}
            </select>
          </div>
          <div class="tym-field">
            <label>Obiekt</label>
            <select name="objectId" id="measurement-object-select" required onchange="selectedMeasurementObjectId=Number(this.value);refreshProtocolNumberSuggestion(selectedMeasurementObjectId);renderMeasurementsList();" style="width:100%;">
              ${objectsForClient.map(o => { const cn = ClientsModule.getNumber(o.clientId); const on = ObjectsModule.getNumber(o.id); return `<option value="${o.id}" ${Number(o.id) === selectedMeasurementObjectId ? "selected" : ""}>${(cn&&on) ? "K"+cn+"-"+on+" — " : ""}${escapeHtml(o.name || "Obiekt bez nazwy")}</option>`; }).join("")}
            </select>
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

<!-- ═══ OKRES PORÓWNAWCZY (BAZOWY) — zielony ═══ -->
    <div class="tym-section" style="border:1px solid #C0DD97;">
      <div style="background:#EAF3DE;padding:12px 16px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;color:#3B6D11;">📊</span>
        <h3 style="margin:0;font-size:15px;font-weight:500;color:#27500A;">Okres porównawczy (bazowy)</h3>
        <span style="font-size:11px;padding:2px 8px;border-radius:20px;background:#C0DD97;color:#27500A;">bazowy</span>
        ${prevProtocol ? '<button type="button" onclick="copyPeriodFromProtocol(\'comparison\')" style="margin-left:auto;font-size:12px;padding:4px 12px;border:1px solid #27500A;border-radius:6px;background:white;color:#27500A;cursor:pointer;white-space:nowrap;">📋 Kopiuj z poprzedniego protokołu</button>' : ''}
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
          <span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:500;padding:4px 12px;border-radius:20px;background:#EAF3DE;color:#27500A;">
            📅 Łącznie: <strong id="comparison-days-display">—</strong> dni
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
        ${prevProtocol ? '<button type="button" onclick="copyPeriodFromProtocol(\'tym\')" style="margin-left:auto;font-size:12px;padding:4px 12px;border:1px solid #633806;border-radius:6px;background:white;color:#633806;cursor:pointer;white-space:nowrap;">📋 Kopiuj TYM z poprzedniego protokołu</button>' : ''}
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
          <span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:500;padding:4px 12px;border-radius:20px;background:#FAEEDA;color:#633806;">
            📅 Łącznie: <strong id="tym-days-display">—</strong> dni
          </span>
        </div>
      </div>
    </div>



    <div style="margin-bottom:16px;">
      <label style="font-size:12px;color:var(--color-text-secondary);display:block;margin-bottom:4px;">Notatka</label>
      <input name="note" placeholder="Uwagi do protokołu, źródło danych, nietypowy okres itd." style="width:100%;box-sizing:border-box;" />
    </div>

    <div style="display:flex;gap:12px;align-items:center;">
      

<!-- ═══ SZCZEGÓŁY PROTOKOŁU ═══ -->
    <div class="tym-section" style="border:1px solid #C8C8C8;">
      <div style="background:#F2F2F2;padding:12px 16px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;">📋</span>
        <h3 style="margin:0;font-size:15px;font-weight:500;color:#333;">Szczegóły protokołu</h3>
      </div>
      <div class="tym-body">

        <div class="tym-grid4" style="margin-bottom:14px;">
          <div class="tym-field">
            <label>Numer protokołu <span style="color:#c00;">*</span></label>
            <input name="protocolNumber" id="protocol-number-input" type="text" required placeholder="np. K1-1-001" oninput="this.dataset.userEdited='1'"
              value="${editingMeasurementId
                ? escapeHtml((MeasurementsModule.find(editingMeasurementId)||{}).protocolNumber||'')
                : escapeHtml(MeasurementsModule.suggestProtocolNumber(selectedObject.id, null)||'')}"
              style="width:100%;box-sizing:border-box;" />
            <p style="font-size:10px;color:var(--color-text-tertiary);margin:4px 0 0;">Sugerowany format: K{nr klienta}-O{nr obiektu}-{kolejny nr}. Można edytować ręcznie.</p>
          </div>
          <div class="tym-field">
            <label>Data protokołu</label>
            <input name="protocolDate" type="date" required style="width:100%;box-sizing:border-box;" />
          </div>
          <div class="tym-field">
            <label>Status</label>
            <select name="protocolStatus" style="width:100%;box-sizing:border-box;">
              <option value="DRAFT">Szkic</option>
              <option value="FINAL">Finalny</option>
              <option value="SIGNED">Podpisany</option>
            </select>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 2fr;gap:12px;">
          <div class="tym-field">
            <label>Opracował / Energy Analyst</label>
            <select name="preparedBy" id="preparedBy_sel" style="width:100%;box-sizing:border-box;"
              onchange="(function(s){var w=document.getElementById('preparedBy_wrap');if(s.value==='__other__'){w.style.display='flex';s.removeAttribute('name');document.getElementById('preparedBy_inp').setAttribute('name','preparedBy');document.getElementById('preparedBy_inp').focus();}else{w.style.display='none';s.setAttribute('name','preparedBy');document.getElementById('preparedBy_inp').removeAttribute('name');}})(this)">
              <option value="">— wybierz analityka —</option>
              ${(window.UsersModule ? UsersModule.findByRole('energyAnalyst') : []).map(u => {
                const n = ((u.firstName||'')+' '+(u.lastName||'')).trim();
                const sel = n === (selectedObject.energyAnalystOwner||'') ? 'selected' : '';
                return '<option value="'+n+'" '+sel+'>'+n+'</option>';
              }).join('')}
              <option value="__other__">✏️ Inny (wpisz ręcznie)</option>
            </select>
            <div id="preparedBy_wrap" style="display:none;gap:4px;margin-top:4px;align-items:center;">
              <input id="preparedBy_inp" type="text" placeholder="Wpisz imię i nazwisko"
                style="flex:1;box-sizing:border-box;"/>
              <button type="button"
                onclick="document.getElementById('preparedBy_sel').value='';document.getElementById('preparedBy_sel').setAttribute('name','preparedBy');document.getElementById('preparedBy_inp').removeAttribute('name');document.getElementById('preparedBy_inp').value='';document.getElementById('preparedBy_wrap').style.display='none';"
                style="padding:4px 8px;font-size:11px;border:1px solid #ccc;border-radius:6px;background:#f5f5f5;cursor:pointer;">✕</button>
            </div>
          </div>
          <div class="tym-field">
            <label>Uwagi do protokołu</label>
            <textarea name="protocolNotes" rows="3" placeholder="Dodatkowe uwagi, zastrzeżenia, źródło danych, nietypowy okres itp."
              style="width:100%;box-sizing:border-box;resize:vertical;font-size:13px;padding:6px 8px;border:1px solid var(--color-border-tertiary);border-radius:6px;"></textarea>
          </div>
        </div>

      </div>
    </div>

    <!-- PRZYCISKI ZAPISU -->
    <div style="display:flex;gap:12px;align-items:center;padding:16px 0 4px 0;">
      <button class="primary-button" type="submit" style="padding:11px 32px;font-size:14px;font-weight:600;">
        ${editingMeasurementId ? "💾 Zapisz protokół" : "✅ Dodaj okres bazowy"}
      </button>
      <button class="small-button" type="button" onclick="cancelMeasurementEdit()" style="padding:11px 22px;font-size:13px;">
        ${editingMeasurementId ? "✕ Anuluj edycję" : "← Wróć do listy"}
      </button>
    </div>

  </form>

  <div id="measurements-list" style="margin-top:24px;${showMeasurementForm ? ' display:none;' : ''}"></div>
  `)}

  ${activeMeasurementsTab === 'regression' ? renderRegressionTab(protocolsForTabs) : ''}
  ${activeMeasurementsTab === 'occupancy' ? renderPlaceholderMeasTab('🏨', 'Korekta obłożenia', 'occupancy', 'Zbieranie danych o obłożeniu (osobonoce, % wypełnienia, liczba użytkowników) do korekty zużycia energii.', '#E6F1FB', '#B5D4F4', '#0C447C') : ''}
  ${activeMeasurementsTab === 'area' ? renderPlaceholderMeasTab('📐', 'Korekta powierzchni', 'area', 'Dane o powierzchni ogrzewanej/chłodzonej w poszczególnych okresach — podstawa korekty przy zmianach układu budynku.', '#E8F5E9', '#A5D6A7', '#2E7D32') : ''}
  ${activeMeasurementsTab === 'volume' ? renderPlaceholderMeasTab('⚙️', 'Korekta intensywności', 'volume', 'Dane produkcyjne, wolumen usług, godziny pracy — do normalizacji zużycia względem aktywności obiektu.', '#FFF3E0', '#FFCC80', '#E65100') : ''}
  ${activeMeasurementsTab === 'schedule' ? renderPlaceholderMeasTab('📅', 'Harmonogram', 'schedule', 'Planowane terminy odczytów, analiz i protokołów dla tego obiektu.', '#F3E5F5', '#CE93D8', '#6A1B9A') : ''}
  ${activeMeasurementsTab === 'custom' ? renderPlaceholderMeasTab('🔬', 'Własna analiza', 'custom', 'Dowolne dane pomiarowe i wskaźniki definiowane przez analityka energetycznego.', '#FCE4EC', '#F48FB1', '#880E4F') : ''}
  ${(activeMeasurementsTab === 'tym' && !showMeasurementForm) ? renderProtocolsTable(protocolsForTabs, selectedMeasurementObjectId) : ''}
  `;

  if (activeMeasurementsTab === 'tym' && showMeasurementForm) renderMeasurementsList();
}

function renderProtocolsTable(protocols, objectId) {
  const obj = objectId ? ObjectsModule.find(objectId) : null;

  // Apply search filter
  const q = (window._protSearch || '').toLowerCase();
  const sort = window._protSort || 'date_desc';

  let filtered = protocols.filter(item => {
    if (!q) return true;
    const client = ClientsModule.find(item.clientId);
    const object = ObjectsModule.find(item.objectId);
    return (
      (item.protocolDate || '').includes(q) ||
      ((client && client.name) || '').toLowerCase().includes(q) ||
      ((object && object.name) || '').toLowerCase().includes(q) ||
      (item.billingPeriodStartDate || '').includes(q) ||
      (item.billingPeriodEndDate || '').includes(q)
    );
  });

  // Sort
  filtered = [...filtered].sort((a, b) => {
    if (sort === 'date_desc') return (b.protocolDate || '').localeCompare(a.protocolDate || '');
    if (sort === 'date_asc')  return (a.protocolDate || '').localeCompare(b.protocolDate || '');
    if (sort === 'client')    return ((ClientsModule.find(a.clientId)||{}).name||'').localeCompare((ClientsModule.find(b.clientId)||{}).name||'');
    if (sort === 'object')    return ((ObjectsModule.find(a.objectId)||{}).name||'').localeCompare((ObjectsModule.find(b.objectId)||{}).name||'');
    return 0;
  });

  const thS = (col, label) => {
    const active = sort === col + '_asc' || sort === col + '_desc';
    const next = sort === col + '_asc' ? col + '_desc' : col + '_asc';
    const arrow = sort === col + '_asc' ? ' ↑' : sort === col + '_desc' ? ' ↓' : '';
    return `<th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);cursor:pointer;user-select:none;white-space:nowrap;${active ? 'color:#0C447C;' : ''}"
      onclick="window._protSort='${next}';renderMeasurementsModule();">${label}${arrow}</th>`;
  };

  const headerHtml = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;margin-top:8px;gap:10px;flex-wrap:wrap;">
      <h3 style="margin:0;font-size:15px;font-weight:500;color:var(--color-text-primary);">
        Okresy bazowe
        <span style="font-size:12px;color:var(--color-text-secondary);font-weight:400;">(${filtered.length}${q ? ' z ' + protocols.length : ''})</span>
      </h3>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <input type="search" placeholder="Szukaj okresu bazowego..." value="${escapeHtml(window._protSearch || '')}"
          oninput="window._protSearch=this.value;renderMeasurementsModule();"
          style="font-size:13px;padding:6px 10px;border:1px solid var(--color-border-tertiary);border-radius:8px;width:200px;" />
        <button class="primary-button" onclick="showMeasurementForm=true;editingMeasurementId=null;renderMeasurementsModule();" style="font-size:13px;padding:7px 16px;white-space:nowrap;">
          + Dodaj okres bazowy
        </button>
      </div>
    </div>`;

  if (filtered.length === 0) {
    return headerHtml + `<div class="reminder-card"><strong>${q ? 'Brak wyników wyszukiwania' : 'Brak okresów bazowych'}</strong>
      <div class="reminder-meta">${q ? 'Spróbuj innej frazy.' : 'Kliknij "+ Dodaj okres bazowy" aby rozpocząć rozliczenie ESCO.'}</div>
    </div>`;
  }

  const rows = filtered.map(item => {
    const client = ClientsModule.find(item.clientId);
    const object = ObjectsModule.find(item.objectId);
    return `<tr style="border-bottom:1px solid var(--color-border-tertiary);">
      <td style="padding:9px 12px;font-size:13px;font-weight:500;white-space:nowrap;">${escapeHtml(item.protocolDate || '—')}</td>
      <td style="padding:9px 12px;font-size:13px;">${escapeHtml((client && client.name) || '—')}</td>
      <td style="padding:9px 12px;font-size:13px;">${escapeHtml((object && object.name) || '—')}</td>
      <td style="padding:9px 12px;font-size:13px;white-space:nowrap;">${escapeHtml(item.billingPeriodStartDate || '')} → ${escapeHtml(item.billingPeriodEndDate || '')}</td>
      <td style="padding:9px 12px;white-space:nowrap;">
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          <button class="small-button" onclick="switchToView('measurements',()=>viewProtocol(${item.id}))" class="icon-btn" title="Podgląd">👁</button>
          <button class="small-button" onclick="showMeasurementForm=true;editMeasurement(${item.id});" class="icon-btn" title="Edytuj">✏️</button>
          <button class="small-button" onclick="deleteMeasurement(${item.id})" style="color:#c00;border-color:#c00;" class="icon-btn icon-btn-del" title="Usuń">🗑</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  return headerHtml + `
    <div style="overflow-x:auto;border:1px solid var(--color-border-tertiary);border-radius:10px;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:var(--color-background-secondary);">
            ${thS('date', 'Data protokołu')}
            ${thS('client', 'Klient')}
            ${thS('object', 'Obiekt')}
            <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Okres bazowy</th>
            <th style="padding:8px 12px;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Akcje</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderPlaceholderMeasTab(icon, title, type, description, bgLight, bgBorder, textColor) {
  return `
  <div style="border:1px solid ${bgBorder};border-radius:10px;overflow:hidden;margin-bottom:20px;">
    <div style="background:${bgLight};padding:14px 18px;display:flex;align-items:center;gap:12px;">
      <span style="font-size:22px;">${icon}</span>
      <div>
        <h3 style="margin:0;font-size:15px;font-weight:600;color:${textColor};">${title}</h3>
        <p style="margin:4px 0 0;font-size:12px;color:${textColor};opacity:0.75;">${description}</p>
      </div>
    </div>
    <div style="padding:32px 20px;background:var(--color-background-primary);text-align:center;">
      <div style="font-size:40px;margin-bottom:12px;">🚧</div>
      <p style="font-size:14px;font-weight:500;color:var(--color-text-primary);margin:0 0 8px;">Moduł w przygotowaniu</p>
      <p style="font-size:12px;color:var(--color-text-secondary);max-width:400px;margin:0 auto;">
        Zbieranie danych dla analizy <strong>${title}</strong> zostanie uruchomione w kolejnej wersji WaterAI.
      </p>
    </div>
  </div>`;
}

function renderRegressionSensorData(objectId) {
  const storageKey = 'waterai_regression_sensors_' + objectId;
  const rawRows = JSON.parse(localStorage.getItem(storageKey) || '[]');

  // Pagination state
  const pageSize = 50;
  window._regPage = window._regPage || 0;
  const totalPages = Math.max(1, Math.ceil(rawRows.length / pageSize));
  if (window._regPage >= totalPages) window._regPage = totalPages - 1;
  const page = window._regPage;
  const rows = rawRows.slice(page * pageSize, (page + 1) * pageSize);

  const fmtVal = v => (v === null || v === undefined || v === '') ? '—' : Number(v).toLocaleString('pl-PL', { maximumFractionDigits: 2 });

  const tableRows = rows.map((r, i) => {
    const absIdx = page * pageSize + i;
    return `<tr style="border-bottom:0.5px solid var(--color-border-tertiary);">
      <td style="padding:4px 8px;font-size:11px;color:var(--color-text-tertiary);">${escapeHtml(r.readTime || '—')}</td>
      <td style="padding:4px 8px;font-size:12px;text-align:right;">${fmtVal(r.tOutdoor)}</td>
      <td style="padding:4px 8px;font-size:12px;text-align:right;">${fmtVal(r.tSupply)}</td>
      <td style="padding:4px 8px;font-size:12px;text-align:right;">${fmtVal(r.tReturn)}</td>
      <td style="padding:4px 8px;font-size:12px;text-align:right;">${fmtVal(r.vFlow)}</td>
      <td style="padding:4px 8px;font-size:12px;text-align:right;">${fmtVal(r.heatPower)}</td>
      <td style="padding:4px 8px;font-size:12px;text-align:right;">${fmtVal(r.heatConsumption)}</td>
      <td style="padding:4px 8px;">
        <button class="small-button" onclick="deleteRegressionRow(${objectId}, ${absIdx})" style="font-size:10px;padding:2px 7px;color:#c00;border-color:#c00;">✕</button>
      </td>
    </tr>`;
  }).join('');

  const paginationHtml = totalPages > 1 ? `
    <div style="display:flex;align-items:center;gap:8px;margin-top:10px;font-size:12px;">
      <button class="small-button" onclick="window._regPage=Math.max(0,window._regPage-1);renderMeasurementsModule();" ${page === 0 ? 'disabled' : ''}>← Poprzednia</button>
      <span style="color:var(--color-text-secondary);">Strona ${page + 1} / ${totalPages} (${rawRows.length} wierszy)</span>
      <button class="small-button" onclick="window._regPage=Math.min(${totalPages-1},window._regPage+1);renderMeasurementsModule();" ${page === totalPages - 1 ? 'disabled' : ''}>Następna →</button>
    </div>` : rawRows.length > 0 ? `<p style="font-size:11px;color:var(--color-text-tertiary);margin-top:8px;">${rawRows.length} wierszy danych</p>` : '';

  return `
  <div style="border:1px solid #B5D4F4;border-radius:10px;overflow:hidden;margin-top:24px;">
    <div style="background:#E6F1FB;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;">📡</span>
        <h3 style="margin:0;font-size:14px;font-weight:600;color:#0C447C;">Dane z czujników — dane czasowe</h3>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <label style="font-size:12px;color:#0C447C;background:#fff;border:1px solid #B5D4F4;border-radius:6px;padding:5px 12px;cursor:pointer;font-weight:500;">
          📂 Importuj CSV/Excel
          <input type="file" accept=".csv,.xlsx,.xls" style="display:none;" onchange="importRegressionSensorFile(this, ${objectId})" />
        </label>
        <button class="small-button" onclick="clearRegressionSensorData(${objectId})" style="font-size:11px;color:#c00;border-color:#c00;" ${rawRows.length === 0 ? 'disabled' : ''}>🗑 Wyczyść wszystko</button>
      </div>
    </div>

    <!-- Formularz dodawania wiersza -->
    <div style="padding:14px 16px;background:#F7FAFE;border-bottom:1px solid #B5D4F4;">
      <div style="font-size:11px;font-weight:600;color:#0C447C;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;">Dodaj wiersz ręcznie</div>
      <div style="display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr 1fr 1.2fr 1.4fr auto;gap:6px;align-items:end;">
        <div>
          <label style="font-size:10px;color:var(--color-text-secondary);display:block;margin-bottom:2px;">Data i czas odczytu</label>
          <input id="reg-readTime" type="datetime-local" style="width:100%;font-size:12px;box-sizing:border-box;" />
        </div>
        <div>
          <label style="font-size:10px;color:var(--color-text-secondary);display:block;margin-bottom:2px;">T zewn. [°C]</label>
          <input id="reg-tOutdoor" type="number" step="0.01" placeholder="np. 0.4" style="width:100%;font-size:12px;box-sizing:border-box;" />
        </div>
        <div>
          <label style="font-size:10px;color:var(--color-text-secondary);display:block;margin-bottom:2px;">T zasilania [°C]</label>
          <input id="reg-tSupply" type="number" step="0.01" placeholder="np. 54.2" style="width:100%;font-size:12px;box-sizing:border-box;" />
        </div>
        <div>
          <label style="font-size:10px;color:var(--color-text-secondary);display:block;margin-bottom:2px;">T powrotu [°C]</label>
          <input id="reg-tReturn" type="number" step="0.01" placeholder="np. 43.7" style="width:100%;font-size:12px;box-sizing:border-box;" />
        </div>
        <div>
          <label style="font-size:10px;color:var(--color-text-secondary);display:block;margin-bottom:2px;">Przepływ [m³/h]</label>
          <input id="reg-vFlow" type="number" step="1" placeholder="np. 3827" style="width:100%;font-size:12px;box-sizing:border-box;" />
        </div>
        <div>
          <label style="font-size:10px;color:var(--color-text-secondary);display:block;margin-bottom:2px;">Moc cieplna [W]</label>
          <input id="reg-heatPower" type="number" step="0.01" placeholder="np. 46012" style="width:100%;font-size:12px;box-sizing:border-box;" />
        </div>
        <div>
          <label style="font-size:10px;color:var(--color-text-secondary);display:block;margin-bottom:2px;">Zużycie ciepła [kWh]</label>
          <input id="reg-heatConsumption" type="number" step="0.01" placeholder="np. 28263" style="width:100%;font-size:12px;box-sizing:border-box;" />
        </div>
        <div style="display:flex;align-items:flex-end;">
          <button class="primary-button" onclick="addRegressionSensorRow(${objectId})" style="font-size:12px;padding:6px 14px;white-space:nowrap;">+ Dodaj</button>
        </div>
      </div>
    </div>

    <!-- Tabela danych -->
    <div style="padding:12px 16px;background:var(--color-background-primary);">
      ${rawRows.length === 0 ? `
        <div style="text-align:center;padding:28px;color:var(--color-text-secondary);font-size:13px;">
          <div style="font-size:32px;margin-bottom:8px;">📊</div>
          Brak danych. Dodaj wiersze ręcznie lub zaimportuj plik CSV/Excel.
          <div style="font-size:11px;margin-top:8px;color:var(--color-text-tertiary);">
            Wymagane kolumny: <code>readTime, tOutdoor, tSupply, tReturn, vFlow, heatPower, heatConsumption</code>
          </div>
        </div>` : `
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:12px;min-width:700px;">
            <thead>
              <tr style="background:var(--color-background-secondary);">
                <th style="padding:6px 8px;text-align:left;font-size:10px;font-weight:600;border-bottom:1px solid var(--color-border-tertiary);color:var(--color-text-secondary);">Data odczytu</th>
                <th style="padding:6px 8px;text-align:right;font-size:10px;font-weight:600;border-bottom:1px solid var(--color-border-tertiary);color:var(--color-text-secondary);">T zewn. [°C]</th>
                <th style="padding:6px 8px;text-align:right;font-size:10px;font-weight:600;border-bottom:1px solid var(--color-border-tertiary);color:var(--color-text-secondary);">T zasil. [°C]</th>
                <th style="padding:6px 8px;text-align:right;font-size:10px;font-weight:600;border-bottom:1px solid var(--color-border-tertiary);color:var(--color-text-secondary);">T powrotu [°C]</th>
                <th style="padding:6px 8px;text-align:right;font-size:10px;font-weight:600;border-bottom:1px solid var(--color-border-tertiary);color:var(--color-text-secondary);">Przepływ [m³/h]</th>
                <th style="padding:6px 8px;text-align:right;font-size:10px;font-weight:600;border-bottom:1px solid var(--color-border-tertiary);color:var(--color-text-secondary);">Moc cieplna [W]</th>
                <th style="padding:6px 8px;text-align:right;font-size:10px;font-weight:600;border-bottom:1px solid var(--color-border-tertiary);color:var(--color-text-secondary);">Zużycie ciepła [kWh]</th>
                <th style="padding:6px 8px;border-bottom:1px solid var(--color-border-tertiary);"></th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
        ${paginationHtml}
      `}
    </div>
  </div>`;
}

function addRegressionSensorRow(objectId) {
  const readTime = document.getElementById('reg-readTime').value;
  const tOutdoor = document.getElementById('reg-tOutdoor').value;
  const tSupply = document.getElementById('reg-tSupply').value;
  const tReturn = document.getElementById('reg-tReturn').value;
  const vFlow = document.getElementById('reg-vFlow').value;
  const heatPower = document.getElementById('reg-heatPower').value;
  const heatConsumption = document.getElementById('reg-heatConsumption').value;

  if (!readTime && !tOutdoor && !tSupply) {
    alert('Podaj przynajmniej datę odczytu i temperaturę zewnętrzną.');
    return;
  }

  const storageKey = 'waterai_regression_sensors_' + objectId;
  const rows = JSON.parse(localStorage.getItem(storageKey) || '[]');
  rows.push({
    readTime: readTime || null,
    tOutdoor: tOutdoor !== '' ? Number(tOutdoor) : null,
    tSupply: tSupply !== '' ? Number(tSupply) : null,
    tReturn: tReturn !== '' ? Number(tReturn) : null,
    vFlow: vFlow !== '' ? Number(vFlow) : null,
    heatPower: heatPower !== '' ? Number(heatPower) : null,
    heatConsumption: heatConsumption !== '' ? Number(heatConsumption) : null,
  });
  localStorage.setItem(storageKey, JSON.stringify(rows));
  window._regPage = Math.floor((rows.length - 1) / 50);
  renderMeasurementsModule();
}

function deleteRegressionRow(objectId, index) {
  const storageKey = 'waterai_regression_sensors_' + objectId;
  const rows = JSON.parse(localStorage.getItem(storageKey) || '[]');
  rows.splice(index, 1);
  localStorage.setItem(storageKey, JSON.stringify(rows));
  renderMeasurementsModule();
}

function clearRegressionSensorData(objectId) {
  if (!confirm('Czy na pewno chcesz usunąć wszystkie dane z czujników dla tego obiektu?')) return;
  localStorage.removeItem('waterai_regression_sensors_' + objectId);
  window._regPage = 0;
  renderMeasurementsModule();
}

function importRegressionSensorFile(input, objectId) {
  const file = input.files[0];
  if (!file) return;
  const ext = file.name.split('.').pop().toLowerCase();

  const storageKey = 'waterai_regression_sensors_' + objectId;

  if (ext === 'csv') {
    const reader = new FileReader();
    reader.onload = function(e) {
      const text = e.target.result;
      const lines = text.trim().split(/\r?\n/);
      if (lines.length < 2) { alert('Plik CSV jest pusty lub nie zawiera nagłówka.'); return; }

      const header = lines[0].split(/[,;\t]/).map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
      const colMap = { readtime: 'readTime', toutdoor: 'tOutdoor', tsupply: 'tSupply', treturn: 'tReturn', vflow: 'vFlow', heatpower: 'heatPower', heatconsumption: 'heatConsumption' };

      const existingRows = JSON.parse(localStorage.getItem(storageKey) || '[]');
      let added = 0;

      for (let i = 1; i < lines.length; i++) {
        const cells = lines[i].split(/[,;\t]/);
        if (cells.length < 2) continue;
        const row = {};
        header.forEach((h, idx) => {
          const key = colMap[h];
          if (!key) return;
          const val = (cells[idx] || '').trim().replace(',', '.');
          if (key === 'readTime') row[key] = val || null;
          else row[key] = val !== '' && !isNaN(Number(val)) ? Number(val) : null;
        });
        if (Object.keys(row).length > 0) { existingRows.push(row); added++; }
      }

      localStorage.setItem(storageKey, JSON.stringify(existingRows));
      window._regPage = Math.floor((existingRows.length - 1) / 50);
      renderMeasurementsModule();
      alert(`Zaimportowano ${added} wierszy z pliku CSV.`);
    };
    reader.readAsText(file);
  } else {
    alert('Import plików Excel (.xlsx) wymaga biblioteki SheetJS — aktualnie wspierany format to CSV. Zapisz plik Excel jako CSV i spróbuj ponownie.');
  }
  input.value = '';
}

function renderRegressionTab(protocols) {
  const regressionProtocols = protocols.filter(p => p.includeLinearRegression);

  if (regressionProtocols.length === 0) {
    return `<div class="reminder-card"><strong>Brak protokołów z regresją</strong>
      <div class="reminder-meta">Zaznacz "Dołącz analizę regresji liniowej" w protokole TYM aby aktywować ten moduł.</div>
    </div>` + renderRegressionSensorData(selectedMeasurementObjectId);
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
    <div style="border:1px solid #FAC775;border-radius:10px;overflow:hidden;margin-bottom:20px;">
      <div style="padding:12px;background:#FAEEDA;display:flex;gap:24px;flex-wrap:wrap;align-items:center;">
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

      <div style="padding:12px 16px;background:var(--color-background-primary);">
      <div style="margin-top:0;overflow-x:auto;">
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
    </div>
    <script>(function(){ setTimeout(function(){ ${chartScript} }, 80); })();<\/script>`;
  }).join("") + renderRegressionSensorData(selectedMeasurementObjectId);
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
      </div>`;
    return;
  }

  const protocols = MeasurementsModule.findByObject(selectedMeasurementObjectId);

  if (protocols.length === 0) {
    container.innerHTML = `
      <div class="reminder-card">
        <strong>Brak okresów bazowych</strong>
        <div class="reminder-meta">Dodaj pierwszy okres bazowy dla tego obiektu.</div>
      </div>`;
    return;
  }

  const rows = protocols.map(item => {
    const clientNum = ClientsModule.getNumber(item.clientId);
    const objNum    = ObjectsModule.getNumber(item.objectId);
    const clientLabel = (clientNum ? 'K'+clientNum+' — ' : '') + escapeHtml(getClientName(item.clientId));
    const objLabel    = (clientNum && objNum ? 'K'+clientNum+'-'+objNum+' — ' : '') + escapeHtml(getObjectName(item.objectId));
    const periodFrom  = item.comparisonPeriodStartDate || item.billingPeriodStartDate || '—';
    const periodTo    = item.comparisonPeriodEndDate   || item.billingPeriodEndDate   || '—';
    const period      = periodFrom !== '—' ? periodFrom + ' → ' + periodTo : '—';

    return `<tr style="border-bottom:1px solid var(--color-border-tertiary);">
      <td style="padding:10px 12px;font-size:13px;font-weight:600;white-space:nowrap;">${escapeHtml(item.protocolNumber||'—')}</td>
      <td style="padding:10px 12px;font-size:13px;white-space:nowrap;">${escapeHtml(item.protocolDate||'—')}</td>
      <td style="padding:10px 12px;font-size:13px;">${clientLabel}</td>
      <td style="padding:10px 12px;font-size:13px;">${objLabel}</td>
      <td style="padding:10px 12px;font-size:13px;white-space:nowrap;">${escapeHtml(period)}</td>
      <td style="padding:10px 12px;">
        <div style="display:flex;gap:6px;">
          <button class="icon-btn" onclick="switchToView('measurements',()=>viewProtocol(${item.id}))" title="Podgląd">👁</button>
          <button class="icon-btn" onclick="editMeasurement(${item.id})" title="Edytuj">✏️</button>
          <button class="icon-btn icon-btn-del" onclick="deleteMeasurement(${item.id})" title="Usuń">🗑</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  container.innerHTML = `
    <div style="overflow-x:auto;border:1px solid var(--color-border-tertiary);border-radius:10px;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:var(--color-background-secondary);">
            <th style="padding:9px 12px;text-align:left;font-size:11px;font-weight:600;color:var(--color-text-secondary);border-bottom:2px solid var(--color-border-tertiary);white-space:nowrap;">Nr protokołu</th>
            <th style="padding:9px 12px;text-align:left;font-size:11px;font-weight:600;color:var(--color-text-secondary);border-bottom:2px solid var(--color-border-tertiary);white-space:nowrap;">Data protokołu</th>
            <th style="padding:9px 12px;text-align:left;font-size:11px;font-weight:600;color:var(--color-text-secondary);border-bottom:2px solid var(--color-border-tertiary);">Klient</th>
            <th style="padding:9px 12px;text-align:left;font-size:11px;font-weight:600;color:var(--color-text-secondary);border-bottom:2px solid var(--color-border-tertiary);">Obiekt</th>
            <th style="padding:9px 12px;text-align:left;font-size:11px;font-weight:600;color:var(--color-text-secondary);border-bottom:2px solid var(--color-border-tertiary);white-space:nowrap;">Okres bazowy</th>
            <th style="padding:9px 12px;text-align:left;font-size:11px;font-weight:600;color:var(--color-text-secondary);border-bottom:2px solid var(--color-border-tertiary);">Akcje</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}


function generateESCOReport(protocolId) {
  const p = MeasurementsModule.find(protocolId);
  if (!p) { alert("Nie znaleziono protokołu."); return; }

  // Sync: mark pending PROTOCOL_DUE events for this object as DONE
  const today = new Date().toISOString().slice(0, 10);
  CalendarModule.getAll()
    .filter(e =>
      Number(e.objectId) === Number(p.objectId) &&
      e.eventType === 'PROTOCOL_DUE' &&
      e.status === 'PENDING' &&
      e.dueDate <= today
    )
    .forEach(e => CalendarModule.markDone(e.id, 'auto'));

  // Sync: create ESCO_REPORT_DUE reminder if not already pending
  const alreadyPending = CalendarModule.getAll().some(e =>
    Number(e.objectId) === Number(p.objectId) &&
    e.eventType === 'ESCO_REPORT_DUE' &&
    e.status === 'PENDING' &&
    e.dueDate >= today
  );
  if (!alreadyPending) {
    const obj = ObjectsModule.find(p.objectId);
    const clientName = (ClientsModule.find(p.clientId) || {}).name || '';
    const due = new Date();
    due.setDate(due.getDate() + 7);
    CalendarModule.add({
      clientId: Number(p.clientId),
      objectId: Number(p.objectId),
      title: `Termin wysyłki raportu ESCO — ${(obj || {}).name || 'Obiekt'}${clientName ? ' / ' + clientName : ''}`,
      description: `Raport ESCO wygenerowany z protokołu z dn. ${p.protocolDate || ''}. Do wysłania do klienta.`,
      eventType: 'ESCO_REPORT_DUE',
      dueDate: due.toISOString().slice(0, 10),
      reminderDays: [0, 3],
      recurrence: 'ONE_TIME',
      responsibleRole: 'BACK_OFFICE',
      autoGenerated: true,
      linkedMeasurementId: p.id
    });
  }

  // Upewnij się że panel modułu jest widoczny
  const modView = document.getElementById("module-view");
  if (modView) modView.classList.add("active");
  const descEl = document.getElementById("module-description");
  if (descEl) descEl.textContent = "";
  const titleEl = document.getElementById("module-title");
  if (titleEl) titleEl.textContent = "Raport ESCO";

  const client = ClientsModule.find(p.clientId);
  const obj    = ObjectsModule.find(p.objectId);
  const r      = calcESCOResults(p);
  const u      = p.energyUnit  || "GJ";
  const cur    = p.currency    || "PLN";
  const base   = Number(p.baseTemperature || 21);

  const fmt2 = v => Number(v ?? 0).toFixed(2);
  const fmt3 = v => Number(v ?? 0).toFixed(3);
  const fmt4 = v => Number(v ?? 0).toFixed(4);

  const savedColor = r.savedEnergyPct >= 0 ? "#27500A" : "#c00";

  // ── Tabelka TYM ──
  const tymRows = (p.tymMonthly || []).map(m => {
    const temp = m.tymTemperature ?? m.temperature;
    const days = m.tymDays ?? m.days ?? 0;
    const hdd  = Math.max(0, base - Number(temp || 0)) * Number(days);
    return `<tr>
      <td style="padding:5px 8px;">${escapeHtml(m.monthName || "M"+m.month)}</td>
      <td style="padding:5px 8px;text-align:right;">${temp !== null && temp !== undefined ? fmt2(temp) : "—"}</td>
      <td style="padding:5px 8px;text-align:right;">${days}</td>
      <td style="padding:5px 8px;text-align:right;font-weight:500;">${fmt2(hdd)}</td>
    </tr>`;
  }).join("");

  // ── Tabelka rozliczeniowa ──
  const billRows = (p.realMonthly || []).map(m => {
    const temp   = m.temperature;
    const days   = Number(m.days ?? 0);
    const hddR   = Math.max(0, base - Number(temp || 0)) * days;
    const tym    = (p.tymMonthly || []).find(t => t.month === m.month);
    const tymT   = tym ? Number(tym.tymTemperature ?? tym.temperature ?? 0) : 0;
    const hddT   = Math.max(0, base - tymT) * days;
    return `<tr>
      <td style="padding:5px 8px;">${escapeHtml(m.monthName || "M"+m.month)}</td>
      <td style="padding:5px 8px;text-align:right;">${temp !== null && temp !== undefined ? fmt2(temp) : "—"}</td>
      <td style="padding:5px 8px;text-align:right;">${days}</td>
      <td style="padding:5px 8px;text-align:right;">${fmt2(hddR)}</td>
      <td style="padding:5px 8px;text-align:right;color:#633806;">${fmt2(hddT)}</td>
    </tr>`;
  }).join("");

  // ── Tabelka porównawcza ──
  const compRows = (p.comparisonMonthly || []).map(m => {
    const temp = m.temperature;
    const days = Number(m.days ?? 0);
    const hddR = Math.max(0, base - Number(temp || 0)) * days;
    const tym  = (p.tymMonthly || []).find(t => t.month === m.month);
    const tymT = tym ? Number(tym.tymTemperature ?? tym.temperature ?? 0) : 0;
    const hddT = Math.max(0, base - tymT) * days;
    return `<tr>
      <td style="padding:5px 8px;">${escapeHtml(m.monthName || "M"+m.month)}</td>
      <td style="padding:5px 8px;text-align:right;">${temp !== null && temp !== undefined ? fmt2(temp) : "—"}</td>
      <td style="padding:5px 8px;text-align:right;">${days}</td>
      <td style="padding:5px 8px;text-align:right;">${fmt2(hddR)}</td>
      <td style="padding:5px 8px;text-align:right;color:#633806;">${fmt2(hddT)}</td>
    </tr>`;
  }).join("");

  // ── Dane do wykresów (JSON) ──
  const tymData     = JSON.stringify((p.tymMonthly || []).map(m => ({
    name: (m.monthName || "M"+m.month).slice(0,6),
    temp: Number(m.tymTemperature ?? m.temperature ?? 0)
  })));
  const billData    = JSON.stringify((p.realMonthly || []).map(m => ({
    name: (m.monthName || "M"+m.month).slice(0,6),
    temp: Number(m.temperature ?? 0)
  })));
  const compData    = JSON.stringify((p.comparisonMonthly || []).map(m => ({
    name: (m.monthName || "M"+m.month).slice(0,6),
    temp: Number(m.temperature ?? 0)
  })));

  // HDD per miesiąc dla wykresów
  const billHDDData = JSON.stringify((p.realMonthly || []).map(m => {
    const days = Number(m.days ?? 0);
    const tym  = (p.tymMonthly || []).find(t => t.month === m.month);
    const tymT = tym ? Number(tym.tymTemperature ?? tym.temperature ?? 0) : 0;
    return {
      name: (m.monthName || "M"+m.month).slice(0,6),
      hddReal: Math.max(0, base - Number(m.temperature ?? 0)) * days,
      hddTym:  Math.max(0, base - tymT) * days
    };
  }));
  const compHDDData = JSON.stringify((p.comparisonMonthly || []).map(m => {
    const days = Number(m.days ?? 0);
    const tym  = (p.tymMonthly || []).find(t => t.month === m.month);
    const tymT = tym ? Number(tym.tymTemperature ?? tym.temperature ?? 0) : 0;
    return {
      name: (m.monthName || "M"+m.month).slice(0,6),
      hddReal: Math.max(0, base - Number(m.temperature ?? 0)) * days,
      hddTym:  Math.max(0, base - tymT) * days
    };
  }));

  const container = document.getElementById("module-content");
  if (!container) return;

  container.innerHTML = `
  <style>
    .esco-section { border:1px solid var(--color-border-tertiary); border-radius:10px; margin-bottom:20px; overflow:hidden; }
    .esco-section-head { padding:12px 16px; font-size:14px; font-weight:600; display:flex; align-items:center; gap:8px; }
    .esco-section-body { padding:16px; background:var(--color-background-primary); }
    .esco-table { width:100%; border-collapse:collapse; font-size:13px; }
    .esco-table th { text-align:left; padding:6px 8px; font-weight:500; font-size:11px; color:var(--color-text-secondary); border-bottom:1px solid var(--color-border-tertiary); }
    .esco-table td { padding:5px 8px; border-bottom:0.5px solid var(--color-border-tertiary); }
    .esco-table tfoot td { font-weight:600; border-top:2px solid var(--color-border-tertiary); border-bottom:none; }
    .esco-kv { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .esco-kv-item { background:var(--color-background-secondary); border-radius:8px; padding:12px; }
    .esco-kv-label { font-size:11px; color:var(--color-text-secondary); margin-bottom:4px; }
    .esco-kv-value { font-size:15px; font-weight:600; }
    .esco-formula { background:#f7f7f7; border-left:3px solid #B5D4F4; border-radius:4px; padding:10px 14px; font-family:monospace; font-size:13px; margin:8px 0; color:#333; }
    .esco-step-num { display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; border-radius:50%; background:#0C447C; color:#fff; font-size:12px; font-weight:700; flex-shrink:0; }
    canvas.esco-chart { width:100%; height:220px; display:block; }
  </style>

  <div style="max-width:820px;">

    <!-- NAGŁÓWEK -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;">
      <div>
        <div style="font-size:12px;color:var(--color-text-secondary);margin-bottom:4px;">
          ${escapeHtml(client ? client.name : "")} / ${escapeHtml(obj ? obj.name : "")}
        </div>
        <h2 style="margin:0 0 4px;font-size:20px;font-weight:700;color:var(--color-text-primary);">
          ⚡ Raport ESCO
        </h2>
        <div style="font-size:13px;color:var(--color-text-secondary);">
          Okres bazowy z dnia ${escapeHtml(p.protocolDate || "—")} &nbsp;·&nbsp;
          Opracował: ${escapeHtml(p.preparedBy || "—")} &nbsp;·&nbsp;
          Temperatura bazowa: ${base} °C
        </div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="small-button" onclick="switchToView('measurements',()=>viewProtocol(${p.id}))">← Pomiary</button>
        <button class="small-button" onclick="renderMeasurementsModule()">← Lista protokołów</button>
      </div>
    </div>

    <!-- DANE ŹRÓDŁOWE -->
    <div class="esco-section">
      <div class="esco-section-head" style="background:#E6F1FB;color:#0C447C;">
        <span class="esco-step-num">0</span> Dane źródłowe protokołu
      </div>
      <div class="esco-section-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div>
            <div style="font-size:11px;font-weight:600;color:var(--color-text-secondary);margin-bottom:8px;text-transform:uppercase;">Okres rozliczeniowy (bieżący)</div>
            <div style="font-size:13px;line-height:1.8;">
              Daty: <strong>${escapeHtml(p.billingPeriodStartDate||"?")} → ${escapeHtml(p.billingPeriodEndDate||"?")}</strong><br/>
              Odczyt startowy: ${fmt3(p.billingPeriodStartReading ?? 0)} ${u}<br/>
              Odczyt końcowy: ${fmt3(p.billingPeriodEndReading || 0)} ${u}<br/>
              <strong>Zużycie E_R = ${fmt3(p.billingConsumption || 0)} ${u}</strong>
            </div>
          </div>
          <div>
            <div style="font-size:11px;font-weight:600;color:var(--color-text-secondary);margin-bottom:8px;text-transform:uppercase;">Okres porównawczy (bazowy)</div>
            <div style="font-size:13px;line-height:1.8;">
              Daty: <strong>${escapeHtml(p.comparisonPeriodStartDate||"?")} → ${escapeHtml(p.comparisonPeriodEndDate||"?")}</strong><br/>
              Odczyt startowy: ${fmt3(p.comparisonPeriodStartReading ?? 0)} ${u}<br/>
              Odczyt końcowy: ${fmt3(p.comparisonPeriodEndReading || 0)} ${u}<br/>
              <strong>Zużycie E_P = ${fmt3(p.comparisonConsumption || 0)} ${u}</strong>
            </div>
          </div>
        </div>
        <div style="margin-top:12px;font-size:12px;color:var(--color-text-secondary);">
          Źródło danych klimatycznych: ${escapeHtml(p.weatherSource || "—")} &nbsp;|&nbsp; Stacja: ${escapeHtml(p.weatherStation || "—")}
          ${p.weatherSourceUrl ? ` &nbsp;|&nbsp; <a href="${escapeHtml(p.weatherSourceUrl)}" target="_blank" rel="noopener">🔗 Link</a>` : ""}
          &nbsp;|&nbsp; Data pobrania: ${escapeHtml(p.weatherDataDownloadDate || "—")}
        </div>
      </div>
    </div>

    <!-- KROK 1 — TYM -->
    <div class="esco-section">
      <div class="esco-section-head" style="background:#FEF3DC;color:#633806;">
        <span class="esco-step-num" style="background:#633806;">1</span> Temperatury TYM — rok standardowy
      </div>
      <div class="esco-section-body">
        <p style="font-size:13px;color:var(--color-text-secondary);margin:0 0 12px;">
          TYM (Typowy Meteorologiczny Rok) to uśrednione wieloletnie dane temperaturowe dla danej stacji.
          Służą jako punkt odniesienia — niezmienny dla każdego protokołu tego obiektu.
        </p>
        ${tymRows ? `
        <table class="esco-table">
          <thead><tr>
            <th>Miesiąc</th><th style="text-align:right;">Temp TYM (°C)</th>
            <th style="text-align:right;">Dni</th><th style="text-align:right;">HDD TYM</th>
          </tr></thead>
          <tbody>${tymRows}</tbody>
          <tfoot><tr>
            <td>Suma</td><td></td>
            <td style="text-align:right;">${(p.tymMonthly||[]).reduce((s,m)=>s+Number(m.tymDays??m.days??0),0)}</td>
            <td style="text-align:right;">${fmt2(r.hddTymBilling + r.hddTymComparison > 0 ? (p.realMonthly||[]).reduce((s,m)=>{const t=(p.tymMonthly||[]).find(x=>x.month===m.month);return s+Math.max(0,base-Number(t?.(t.tymTemperature??t.temperature)??0))*Number(m.days??0);},0) : 0)}</td>
          </tr></tfoot>
        </table>
        <canvas class="esco-chart" id="chart-tym" style="margin-top:16px;height:180px;"></canvas>` : '<p style="color:var(--color-text-secondary);font-size:13px;">Brak danych TYM.</p>'}
      </div>
    </div>

    <!-- KROK 2 — HDD -->
    <div class="esco-section">
      <div class="esco-section-head" style="background:#E6F1FB;color:#0C447C;">
        <span class="esco-step-num">2</span> Stopniodni grzewcze (HDD)
      </div>
      <div class="esco-section-body">
        <p style="font-size:13px;color:var(--color-text-secondary);margin:0 0 10px;">
          HDD (Heating Degree Days) mierzy zapotrzebowanie na ogrzewanie. Dla każdego miesiąca:
        </p>
        <div class="esco-formula">HDD = max(0, T_baza − T_średnia) × liczba_dni &nbsp;&nbsp; [T_baza = ${base} °C]</div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px;">
          <div>
            <div style="font-size:12px;font-weight:600;color:#0C447C;margin-bottom:8px;">📅 Okres rozliczeniowy</div>
            ${billRows ? `<table class="esco-table">
              <thead><tr>
                <th>Miesiąc</th><th style="text-align:right;">T rzecz.</th>
                <th style="text-align:right;">Dni</th>
                <th style="text-align:right;">HDD rzecz.</th>
                <th style="text-align:right;color:#633806;">HDD TYM</th>
              </tr></thead>
              <tbody>${billRows}</tbody>
              <tfoot><tr>
                <td>Suma</td><td></td>
                <td style="text-align:right;">${(p.realMonthly||[]).reduce((s,m)=>s+Number(m.days??0),0)}</td>
                <td style="text-align:right;">${fmt2(r.hddRealBilling)}</td>
                <td style="text-align:right;color:#633806;">${fmt2(r.hddTymBilling)}</td>
              </tr></tfoot>
            </table>` : "—"}
          </div>
          <div>
            <div style="font-size:12px;font-weight:600;color:#27500A;margin-bottom:8px;">📊 Okres porównawczy</div>
            ${compRows ? `<table class="esco-table">
              <thead><tr>
                <th>Miesiąc</th><th style="text-align:right;">T rzecz.</th>
                <th style="text-align:right;">Dni</th>
                <th style="text-align:right;">HDD rzecz.</th>
                <th style="text-align:right;color:#633806;">HDD TYM</th>
              </tr></thead>
              <tbody>${compRows}</tbody>
              <tfoot><tr>
                <td>Suma</td><td></td>
                <td style="text-align:right;">${(p.comparisonMonthly||[]).reduce((s,m)=>s+Number(m.days??0),0)}</td>
                <td style="text-align:right;">${fmt2(r.hddRealComparison)}</td>
                <td style="text-align:right;color:#633806;">${fmt2(r.hddTymComparison)}</td>
              </tr></tfoot>
            </table>` : "—"}
          </div>
        </div>

        <canvas class="esco-chart" id="chart-hdd" style="margin-top:16px;"></canvas>
        <canvas class="esco-chart" id="chart-temp" style="margin-top:16px;"></canvas>
      </div>
    </div>

    <!-- KROK 3 — KOREKTA KLIMATYCZNA -->
    <div class="esco-section">
      <div class="esco-section-head" style="background:#EAF3DE;color:#27500A;">
        <span class="esco-step-num" style="background:#27500A;">3</span> Korekta klimatyczna
      </div>
      <div class="esco-section-body">
        <p style="font-size:13px;color:var(--color-text-secondary);margin:0 0 10px;">
          Współczynnik k normalizuje zużycie do warunków roku standardowego TYM,
          eliminując wpływ wyjątkowo ciepłej lub zimnej pogody.
        </p>
        <div class="esco-formula">k = HDD_TYM / HDD_rzeczywiste</div>
        <div class="esco-kv" style="margin-top:14px;">
          <div class="esco-kv-item">
            <div class="esco-kv-label">k rozliczeniowy</div>
            <div class="esco-formula" style="margin:4px 0;font-size:12px;">
              ${fmt2(r.hddTymBilling)} / ${fmt2(r.hddRealBilling)} = <strong>${fmt4(r.kBilling)}</strong>
            </div>
            <div style="font-size:12px;color:var(--color-text-secondary);">
              ${r.kBilling > 1.01 ? "↑ Rok cieplejszy od normy — zużycie zostanie podwyższone" : r.kBilling < 0.99 && r.kBilling > 0 ? "↓ Rok chłodniejszy od normy — zużycie zostanie obniżone" : r.kBilling === 0 ? "Brak danych HDD" : "≈ Rok zbliżony do normy"}
            </div>
          </div>
          <div class="esco-kv-item">
            <div class="esco-kv-label">k porównawczy</div>
            <div class="esco-formula" style="margin:4px 0;font-size:12px;">
              ${fmt2(r.hddTymComparison)} / ${fmt2(r.hddRealComparison)} = <strong>${fmt4(r.kComparison)}</strong>
            </div>
            <div style="font-size:12px;color:var(--color-text-secondary);">
              ${r.kComparison > 1.01 ? "↑ Rok cieplejszy od normy" : r.kComparison < 0.99 && r.kComparison > 0 ? "↓ Rok chłodniejszy od normy" : r.kComparison === 0 ? "Brak danych HDD" : "≈ Rok zbliżony do normy"}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- KROK 4 — ZUŻYCIE SKORYGOWANE -->
    <div class="esco-section">
      <div class="esco-section-head" style="background:#FEF3DC;color:#633806;">
        <span class="esco-step-num" style="background:#633806;">4</span> Zużycie skorygowane do TYM
      </div>
      <div class="esco-section-body">
        <p style="font-size:13px;color:var(--color-text-secondary);margin:0 0 10px;">
          Mnoży zmierzone zużycie przez współczynnik korekty — otrzymujemy ile energii zużyto by przy normalnej pogodzie.
        </p>
        <div class="esco-formula">E_skor = E_zmierzone × k</div>
        <div class="esco-kv" style="margin-top:14px;">
          <div class="esco-kv-item">
            <div class="esco-kv-label">Rozliczeniowe skorygowane</div>
            <div class="esco-formula" style="margin:4px 0;font-size:12px;">
              ${fmt3(p.billingConsumption||0)} × ${fmt4(r.kBilling)} = <strong>${fmt3(r.billingCorrected)}</strong> ${u}
            </div>
          </div>
          <div class="esco-kv-item">
            <div class="esco-kv-label">Porównawcze skorygowane</div>
            <div class="esco-formula" style="margin:4px 0;font-size:12px;">
              ${fmt3(p.comparisonConsumption||0)} × ${fmt4(r.kComparison)} = <strong>${fmt3(r.comparisonCorrected)}</strong> ${u}
            </div>
          </div>
        </div>

        <canvas class="esco-chart" id="chart-consumption" style="margin-top:16px;"></canvas>
      </div>
    </div>

    <!-- KROK 5 — WSKAŹNIK E -->
    <div class="esco-section">
      <div class="esco-section-head" style="background:#E6F1FB;color:#0C447C;">
        <span class="esco-step-num">5</span> Wskaźnik energetyczny E
      </div>
      <div class="esco-section-body">
        <p style="font-size:13px;color:var(--color-text-secondary);margin:0 0 10px;">
          E pokazuje ile energii obiekt zużywa na każdy stopniodzień grzewczy.
          Niższy E po wdrożeniu technologii = lepsza efektywność.
        </p>
        <div class="esco-formula">E = E_skor / HDD_TYM &nbsp;&nbsp; [${u}/HDD]</div>
        <div class="esco-kv" style="margin-top:14px;">
          <div class="esco-kv-item">
            <div class="esco-kv-label">E rozliczeniowy (po wdrożeniu)</div>
            <div class="esco-formula" style="margin:4px 0;font-size:12px;">
              ${fmt3(r.billingCorrected)} / ${fmt2(r.hddTymBilling)} = <strong>${fmt4(r.eBilling)}</strong> ${u}/HDD
            </div>
          </div>
          <div class="esco-kv-item">
            <div class="esco-kv-label">E porównawczy (przed wdrożeniem)</div>
            <div class="esco-formula" style="margin:4px 0;font-size:12px;">
              ${fmt3(r.comparisonCorrected)} / ${fmt2(r.hddTymComparison)} = <strong>${fmt4(r.eComparison)}</strong> ${u}/HDD
            </div>
          </div>
        </div>
        <div style="margin-top:12px;padding:10px 14px;background:#f0f7f0;border-radius:8px;font-size:13px;">
          Zmiana wskaźnika E: <strong style="color:${r.eBilling < r.eComparison ? '#27500A' : '#c00'};">
            ${r.eComparison > 0 ? fmt2((r.eBilling - r.eComparison) / r.eComparison * 100) : "—"} %
          </strong>
          &nbsp;(${r.eBilling < r.eComparison ? "poprawa efektywności ✓" : "brak poprawy"})
        </div>
      </div>
    </div>

    <!-- KROK 6 — OSZCZĘDNOŚĆ -->
    <div class="esco-section">
      <div class="esco-section-head" style="background:#EAF3DE;color:#27500A;">
        <span class="esco-step-num" style="background:#27500A;">6</span> Obliczenie oszczędności
      </div>
      <div class="esco-section-body">
        <p style="font-size:13px;color:var(--color-text-secondary);margin:0 0 10px;">
          Przeliczamy zużycie porównawcze na ten sam okres co rozliczeniowy (przez HDD_TYM_R),
          a następnie odejmujemy faktyczne zużycie rozliczeniowe.
        </p>
        <div class="esco-formula">E_P_skalowane = E_porówn × HDD_TYM_rozlicz = ${fmt4(r.eComparison)} × ${fmt2(r.hddTymBilling)} = <strong>${fmt3(r.comparisonCorrectedScaled)}</strong> ${u}</div>
        <div class="esco-formula">Oszczędność = E_P_skalowane − E_R_skor = ${fmt3(r.comparisonCorrectedScaled)} − ${fmt3(r.billingCorrected)} = <strong>${fmt3(r.savedEnergy)}</strong> ${u}</div>
        <div class="esco-formula">Oszczędność % = Oszczędność / E_P_skalowane × 100 = <strong>${fmt2(r.savedEnergyPct)}</strong> %</div>

        <div style="margin-top:16px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
          <div style="text-align:center;padding:16px;border-radius:10px;border:2px solid ${r.savedEnergyPct>=0?'#C0DD97':'#fcc'};">
            <div style="font-size:11px;color:var(--color-text-secondary);margin-bottom:6px;">OSZCZĘDNOŚĆ ENERGII</div>
            <div style="font-size:24px;font-weight:800;color:${savedColor};">${fmt3(r.savedEnergy)}</div>
            <div style="font-size:13px;color:var(--color-text-secondary);">${u}</div>
          </div>
          <div style="text-align:center;padding:16px;border-radius:10px;border:2px solid ${r.savedEnergyPct>=0?'#C0DD97':'#fcc'};">
            <div style="font-size:11px;color:var(--color-text-secondary);margin-bottom:6px;">OSZCZĘDNOŚĆ %</div>
            <div style="font-size:24px;font-weight:800;color:${savedColor};">${fmt2(r.savedEnergyPct)}</div>
            <div style="font-size:13px;color:var(--color-text-secondary);">%</div>
          </div>
          <div style="text-align:center;padding:16px;border-radius:10px;border:2px solid ${r.savedEnergyPct>=0?'#C0DD97':'#fcc'};">
            <div style="font-size:11px;color:var(--color-text-secondary);margin-bottom:6px;">OSZCZĘDNOŚĆ FINANSOWA</div>
            <div style="font-size:24px;font-weight:800;color:${savedColor};">${fmt2(r.savedMoney)}</div>
            <div style="font-size:13px;color:var(--color-text-secondary);">${cur}</div>
          </div>
        </div>

        <div style="margin-top:12px;padding:10px 14px;background:#f7f7f7;border-radius:8px;font-size:13px;">
          Udział WaterAI (${p.waterAiShare || 0} %): &nbsp;
          <strong>${fmt2(r.waterAiShare)} ${cur}</strong>
          &nbsp;·&nbsp; Cena energii: ${fmt2(p.energyPrice || 0)} ${cur}/${u}
        </div>

        <canvas class="esco-chart" id="chart-savings" style="margin-top:16px;"></canvas>
      </div>
    </div>

    <!-- KROK 7 — PROGNOZA -->
    <div class="esco-section">
      <div class="esco-section-head" style="background:#E6F1FB;color:#0C447C;">
        <span class="esco-step-num">7</span> Prognoza roczna
      </div>
      <div class="esco-section-body">
        <p style="font-size:13px;color:var(--color-text-secondary);margin:0 0 10px;">
          Stosujemy wskaźnik E z okresu rozliczeniowego (po wdrożeniu) do HDD całego roku porównawczego —
          otrzymujemy prognozę rocznego zużycia z technologią.
        </p>
        <div class="esco-formula">Prognoza_z = E_R × HDD_TYM_P = ${fmt4(r.eBilling)} × ${fmt2(r.hddTymComparison)} = <strong>${fmt3(r.forecastConsumptionWith)}</strong> ${u}/rok</div>
        <div class="esco-formula">Prognoza_bez = E_P (bazowe zużycie) = <strong>${fmt3(r.forecastConsumptionWithout)}</strong> ${u}/rok</div>
        <div class="esco-formula">Prognoza oszczędności = ${fmt3(r.forecastConsumptionWithout)} − ${fmt3(r.forecastConsumptionWith)} = <strong>${fmt3(r.forecastSavedEnergy)}</strong> ${u}/rok</div>

        <div style="margin-top:16px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
          <div style="text-align:center;padding:14px;border-radius:10px;background:#E6F1FB;">
            <div style="font-size:11px;color:#0C447C;margin-bottom:6px;">ZUŻYCIE Z TECHNOLOGIĄ</div>
            <div style="font-size:20px;font-weight:700;color:#0C447C;">${fmt3(r.forecastConsumptionWith)}</div>
            <div style="font-size:12px;color:#0C447C;">${u}/rok</div>
          </div>
          <div style="text-align:center;padding:14px;border-radius:10px;background:#f5f5f5;">
            <div style="font-size:11px;color:#666;margin-bottom:6px;">ZUŻYCIE BEZ TECHNOLOGII</div>
            <div style="font-size:20px;font-weight:700;color:#666;">${fmt3(r.forecastConsumptionWithout)}</div>
            <div style="font-size:12px;color:#666;">${u}/rok</div>
          </div>
          <div style="text-align:center;padding:14px;border-radius:10px;background:#EAF3DE;">
            <div style="font-size:11px;color:#27500A;margin-bottom:6px;">PROGNOZA OSZCZĘDNOŚCI</div>
            <div style="font-size:20px;font-weight:700;color:#27500A;">${fmt2(r.forecastSavedEnergyPct)} %</div>
            <div style="font-size:12px;color:#27500A;">${fmt2(r.forecastSavedMoney)} ${cur}/rok</div>
          </div>
        </div>

        <canvas class="esco-chart" id="chart-forecast" style="margin-top:16px;"></canvas>
      </div>
    </div>

  </div>

  <script>
  (function() {
    const MONTHS_SHORT = ['Sty','Lut','Mar','Kwi','Maj','Cze','Lip','Sie','Wrz','Paź','Lis','Gru'];

    function drawBarChart(canvasId, labels, datasets, opts) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const W = canvas.offsetWidth || 700;
      const H = 220;
      canvas.width = W;
      canvas.height = H;
      const pad = { l: 52, r: 16, t: 28, b: 40 };
      const allVals = datasets.flatMap(d => d.data);
      const maxVal = Math.max(...allVals, 0.001);
      const minVal = Math.min(...allVals, 0);
      const range = maxVal - minVal || 1;
      const bw = opts.barWidth || (((W - pad.l - pad.r) / labels.length) * 0.8 / datasets.length);
      const gap = ((W - pad.l - pad.r) / labels.length);

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'var(--color-background-primary, #fff)';
      ctx.fillRect(0, 0, W, H);

      // grid
      for (let i = 0; i <= 4; i++) {
        const v = minVal + (range * i / 4);
        const y = H - pad.b - ((v - minVal) / range) * (H - pad.t - pad.b);
        ctx.strokeStyle = '#e8e8e8'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
        ctx.fillStyle = '#999'; ctx.font = '10px sans-serif'; ctx.textAlign = 'right';
        ctx.fillText(v.toFixed(opts.decimals ?? 1), pad.l - 4, y + 4);
      }

      // zero line
      if (minVal < 0) {
        const y0 = H - pad.b - ((0 - minVal) / range) * (H - pad.t - pad.b);
        ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pad.l, y0); ctx.lineTo(W - pad.r, y0); ctx.stroke();
      }

      // bars
      labels.forEach((lbl, i) => {
        const x0 = pad.l + i * gap + (gap - bw * datasets.length) / 2;
        datasets.forEach((ds, di) => {
          const v = ds.data[i] ?? 0;
          const y0 = H - pad.b - ((Math.max(v, 0) - minVal) / range) * (H - pad.t - pad.b);
          const yBase = H - pad.b - ((Math.max(0, minVal) - minVal) / range) * (H - pad.t - pad.b);
          const barH = Math.abs(yBase - y0) || 1;
          const x = x0 + di * bw;
          ctx.fillStyle = ds.color || '#185FA5';
          ctx.fillRect(x, Math.min(y0, yBase), bw - 1, barH);
        });
        // label
        ctx.fillStyle = '#666'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(lbl, pad.l + i * gap + gap / 2, H - pad.b + 14);
      });

      // legend
      let lx = pad.l;
      datasets.forEach(ds => {
        ctx.fillStyle = ds.color || '#185FA5';
        ctx.fillRect(lx, 8, 12, 10);
        ctx.fillStyle = '#444'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(ds.label || '', lx + 16, 17);
        lx += ctx.measureText(ds.label || '').width + 36;
      });

      if (opts.title) {
        ctx.fillStyle = '#444'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(opts.title, W / 2, H - 4);
      }
    }

    function drawLineChart(canvasId, labels, datasets, opts) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const W = canvas.offsetWidth || 700;
      const H = 220;
      canvas.width = W;
      canvas.height = H;
      const pad = { l: 52, r: 16, t: 28, b: 40 };
      const allVals = datasets.flatMap(d => d.data);
      const maxVal = Math.max(...allVals);
      const minVal = Math.min(...allVals);
      const range = maxVal - minVal || 1;
      const n = labels.length;
      const xStep = (W - pad.l - pad.r) / Math.max(n - 1, 1);

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'var(--color-background-primary, #fff)';
      ctx.fillRect(0, 0, W, H);

      // grid
      for (let i = 0; i <= 4; i++) {
        const v = minVal + (range * i / 4);
        const y = H - pad.b - ((v - minVal) / range) * (H - pad.t - pad.b);
        ctx.strokeStyle = '#e8e8e8'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
        ctx.fillStyle = '#999'; ctx.font = '10px sans-serif'; ctx.textAlign = 'right';
        ctx.fillText(v.toFixed(1), pad.l - 4, y + 4);
      }

      datasets.forEach(ds => {
        ctx.strokeStyle = ds.color || '#185FA5';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ds.data.forEach((v, i) => {
          const x = pad.l + i * xStep;
          const y = H - pad.b - ((v - minVal) / range) * (H - pad.t - pad.b);
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();
        ds.data.forEach((v, i) => {
          const x = pad.l + i * xStep;
          const y = H - pad.b - ((v - minVal) / range) * (H - pad.t - pad.b);
          ctx.beginPath(); ctx.arc(x, y, 3, 0, 2 * Math.PI);
          ctx.fillStyle = ds.color || '#185FA5'; ctx.fill();
        });
      });

      labels.forEach((lbl, i) => {
        ctx.fillStyle = '#666'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(lbl, pad.l + i * xStep, H - pad.b + 14);
      });

      let lx = pad.l;
      datasets.forEach(ds => {
        ctx.strokeStyle = ds.color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(lx, 13); ctx.lineTo(lx + 12, 13); ctx.stroke();
        ctx.fillStyle = '#444'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(ds.label || '', lx + 16, 17);
        lx += ctx.measureText(ds.label || '').width + 36;
      });
    }

    setTimeout(function() {
      // ── Wykres 1: Temperatury TYM ──
      const tymD = ${tymData};
      const billD = ${billData};
      const compD = ${compData};
      const labels12 = tymD.map(m => m.name);
      drawLineChart('chart-tym', labels12, [
        { label: 'TYM (norma)', color: '#FAC775', data: tymD.map(m => m.temp) },
        { label: 'Rozliczeniowy', color: '#185FA5', data: billD.map(m => m.temp) },
        { label: 'Porównawczy', color: '#27500A', data: compD.map(m => m.temp) }
      ], { title: 'Temperatury miesięczne (°C)' });

      // ── Wykres 2: HDD porównanie ──
      const billHDD = ${billHDDData};
      const compHDD = ${compHDDData};
      const billLabels = billHDD.map(m => m.name);
      const compLabels = compHDD.map(m => m.name);

      drawBarChart('chart-hdd', billLabels.length ? billLabels : compLabels, [
        { label: 'HDD rzecz. (rozlicz.)', color: '#185FA580', data: billHDD.map(m => m.hddReal) },
        { label: 'HDD TYM (rozlicz.)', color: '#FAC775', data: billHDD.map(m => m.hddTym) }
      ], { title: 'HDD miesięczne — okres rozliczeniowy', decimals: 0 });

      // ── Wykres 3: Temperatury real ──
      drawLineChart('chart-temp', compLabels.length ? compLabels : billLabels, [
        { label: 'T rzecz. (porówn.)', color: '#27500A', data: compD.map(m => m.temp) },
        { label: 'T rzecz. (rozlicz.)', color: '#185FA5', data: billD.map(m => m.temp) }
      ], { title: 'Temperatury rzeczywiste — porównanie (°C)' });

      // ── Wykres 4: Zużycie (przed/po) ──
      drawBarChart('chart-consumption', ['Rozliczeniowe\n(po wdrożeniu)', 'Porównawcze\n(przed wdrożeniem)'], [
        { label: 'Zmierzone', color: '#185FA5', data: [${p.billingConsumption||0}, ${p.comparisonConsumption||0}] },
        { label: 'Skorygowane TYM', color: '#FAC775', data: [${r.billingCorrected}, ${r.comparisonCorrected}] }
      ], { title: 'Zużycie energii: zmierzone vs skorygowane', decimals: 1 });

      // ── Wykres 5: Oszczędność % i prognoza ──
      drawBarChart('chart-savings', ['E_P skalowane\n(bez tech.)', 'E_R skor.\n(po wdrożeniu)', 'Oszczędność'], [
        { label: 'Energia', color: '#27500A', data: [${r.comparisonCorrectedScaled}, ${r.billingCorrected}, ${r.savedEnergy}] }
      ], { title: 'Bilans energetyczny okresu rozliczeniowego', decimals: 1 });

      drawBarChart('chart-forecast', ['Bez technologii\n(bazowe)', 'Z technologią\n(prognoza)', 'Oszczędność\nroczna'], [
        { label: 'Prognoza roczna', color: '#185FA5', data: [${r.forecastConsumptionWithout}, ${r.forecastConsumptionWith}, ${r.forecastSavedEnergy}] }
      ], { title: 'Prognoza roczna', decimals: 1 });
    }, 120);
  })();
  <\/script>
  `;
}

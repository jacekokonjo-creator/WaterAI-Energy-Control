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
          <form onsubmit="try{createClient(this)}catch(e){console.error(e);alert('Błąd zapisu — dane NIE zostały zapisane. Zgłoś tę treść: '+(e.message||e));}return false;">

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
            Okres bazowy: ${escapeHtml(item.comparisonPeriodStartDate || "")} → ${escapeHtml(item.comparisonPeriodEndDate || "")}<br />
            Zużycie bazowe: <strong>${fmt3(item.comparisonConsumption)} ${u}</strong>
          </div>
          <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
            <button class="small-button" onclick="editMeasurement(${item.id});" class="icon-btn" title="Edytuj protokół">✏️</button>
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
      <td style="padding:7px 10px;font-size:13px;">${escapeHtml(p.comparisonPeriodStartDate||"")} → ${escapeHtml(p.comparisonPeriodEndDate||"")}</td>
      <td style="padding:7px 10px;font-size:13px;text-align:right;">${Number(p.billingConsumption||0).toFixed(3)} ${escapeHtml(p.energyUnit||"")}</td>
      <td style="padding:7px 10px;font-size:13px;text-align:right;color:${r.savedEnergyPct>=0?"#27500A":"#c00"};">
        ${fmt2(r.savedEnergyPct)} %
      </td>
      <td style="padding:7px 10px;white-space:nowrap;">
        <button class="small-button" onclick="switchToView('measurements',()=>viewProtocol(${p.id}))" class="icon-btn" title="Podgląd">👁</button>
        <button class="small-button" onclick="editMeasurement(${p.id})" class="icon-btn" title="Edytuj">✏️</button>
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
        <form onsubmit="try{createObject(this)}catch(e){console.error(e);alert('Błąd zapisu — dane NIE zostały zapisane. Zgłoś tę treść: '+(e.message||e));}return false;">

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
    <form onsubmit="try{createWorkflowItem(this)}catch(e){console.error(e);alert('Błąd zapisu — dane NIE zostały zapisane. Zgłoś tę treść: '+(e.message||e));}return false;" class="calendar-form">
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
  if (!inp || inp.dataset.userEdited === '1' || editingMeasurementId) return;
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
    return sum + diff * Number(m[daysField]);
  }, 0);
}

function calcESCOResults(protocol) {
  const _b = parseFloat(protocol.baseTemperature); const base = (Number.isFinite(_b) && _b > 0) ? _b : 21;

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
    return sum + (base - tymTemp) * days;
  }, 0);

  // HDD rzeczywiste dla okresu ROZLICZENIOWEGO
  const hddRealBilling = billingMonthly.reduce((sum, bm) => {
    const temp = Number(bm.temperature ?? 0);
    const days = Number(bm.days ?? 0);
    return sum + (base - temp) * days;
  }, 0);

  // HDD TYM dla okresu PORÓWNAWCZEGO — dni z tabelki porównawczej, temp z TYM
  const hddTymComparison = comparisonMonthly.reduce((sum, cm) => {
    const tym = tymMonthly.find(t => t.month === cm.month);
    if (!tym) return sum;
    const tymTemp = Number(tym.tymTemperature ?? tym.temperature ?? 0);
    const days    = Number(cm.days ?? 0);
    return sum + (base - tymTemp) * days;
  }, 0);

  // HDD rzeczywiste dla okresu PORÓWNAWCZEGO
  const hddRealComparison = comparisonMonthly.reduce((sum, cm) => {
    const temp = Number(cm.temperature ?? 0);
    const days = Number(cm.days ?? 0);
    return sum + (base - temp) * days;
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
  const u = p.energyUnit || "GJ";
  const cur = p.currency || "PLN";
  const baseTemp = Number(p.baseTemperature || 21);
  const fmt2 = v => Number(v || 0).toFixed(2);
  const fmt3 = v => Number(v || 0).toFixed(3);

  const statusLabels = { DRAFT: "Szkic", FINAL: "Finalny", SIGNED: "Podpisany", ARCHIVED: "Zarchiwizowany" };
  const statusLabel = statusLabels[p.protocolStatus] || p.protocolStatus || "—";

  // TYM — typowy rok meteorologiczny (12 miesięcy)
  const tymMonthly = p.tymMonthly || [];
  const tymTotalDays = tymMonthly.reduce((s, m) => s + Number(m.tymDays ?? m.days ?? 0), 0);
  const tymTotalHDD = tymMonthly.reduce((s, m) => { const t = m.tymTemperature ?? m.temperature; const d = m.tymDays ?? m.days ?? 0; return s + ((baseTemp - Number(t || 0)) * Number(d || 0)); }, 0);
  const tymRows = tymMonthly.map(m => {
    const days = m.tymDays ?? m.days ?? "";
    const temp = m.tymTemperature ?? m.temperature;
    const hdd = fmt2(((baseTemp - Number(temp || 0)) * Number(days || 0)));
    return `<tr>
      <td style="padding:5px 8px;font-size:13px;">${escapeHtml(m.monthName || ("M" + m.month))}</td>
      <td style="padding:5px 8px;font-size:13px;text-align:right;">${temp !== null && temp !== undefined ? fmt2(temp) : "—"}</td>
      <td style="padding:5px 8px;font-size:13px;text-align:right;">${days !== "" ? days : "—"}</td>
      <td style="padding:5px 8px;font-size:13px;text-align:right;">${hdd}</td>
    </tr>`;
  }).join("");

  // Okres porównawczy (bazowy)
  const compMonthly = p.comparisonMonthly || [];
  const compTotalDays = compMonthly.reduce((s, m) => s + Number(m.days ?? 0), 0);
  const compTotalHDD = compMonthly.reduce((s, m) => s + ((baseTemp - Number(m.temperature || 0)) * Number(m.days || 0)), 0);
  const compRows = compMonthly.map(m => {
    const days = m.days ?? "";
    const temp = m.temperature;
    const hdd = fmt2(((baseTemp - Number(temp || 0)) * Number(days || 0)));
    return `<tr>
      <td style="padding:5px 8px;font-size:13px;">${escapeHtml(m.monthName || ("M" + m.month))}</td>
      <td style="padding:5px 8px;font-size:13px;text-align:right;">${temp !== null && temp !== undefined ? fmt2(temp) : "—"}</td>
      <td style="padding:5px 8px;font-size:13px;text-align:right;">${days !== "" ? days : "—"}</td>
      <td style="padding:5px 8px;font-size:13px;text-align:right;">${hdd}</td>
    </tr>`;
  }).join("");

  const container = document.getElementById("module-content");
  if (!container) return;

  container.innerHTML = `
    <div style="max-width:760px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <div>
          <div style="font-size:12px;color:var(--color-text-secondary);margin-bottom:4px;">
            ${escapeHtml(client ? client.name : "")} / ${escapeHtml(obj ? obj.name : "")}
          </div>
          <h2 style="margin:0;font-size:18px;font-weight:600;color:var(--color-text-primary);">
            📋 Okres bazowy — ${escapeHtml(p.protocolDate || "brak daty")}
          </h2>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="small-button" onclick="editMeasurement(${p.id})">✏️ Edytuj</button>
          <button class="small-button" onclick="openModule('measurements')">← Wróć</button>
        </div>
      </div>

      <!-- Dane klimatyczne -->
      <div style="border:1px solid var(--color-border-tertiary);border-radius:10px;padding:16px;margin-bottom:16px;">
        <div style="font-size:11px;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px;">🌡️ Dane klimatyczne</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 24px;">
          <div><div style="font-size:13px;color:var(--color-text-secondary);">Stacja meteo</div><div style="font-size:14px;">${escapeHtml(p.weatherStation || "—")}</div></div>
          <div><div style="font-size:13px;color:var(--color-text-secondary);">Źródło danych</div><div style="font-size:14px;">${escapeHtml(p.weatherSource || "—")}</div></div>
          <div><div style="font-size:13px;color:var(--color-text-secondary);">Data pobrania danych</div><div style="font-size:14px;">${escapeHtml(p.weatherDataDownloadDate || "—")}</div></div>
          <div><div style="font-size:13px;color:var(--color-text-secondary);">Temperatura bazowa</div><div style="font-size:14px;">${escapeHtml(String(baseTemp))} °C</div></div>
        </div>
        ${p.weatherSourceUrl ? `<a href="${escapeHtml(p.weatherSourceUrl)}" target="_blank" rel="noopener" style="font-size:12px;margin-top:10px;display:inline-block;">🔗 Link do źródła danych klimatycznych</a>` : ""}
      </div>

      <!-- Okres porównawczy (bazowy) -->
      <div style="border:1px solid #C0DD97;border-radius:10px;overflow:hidden;margin-bottom:16px;">
        <div style="background:#EAF3DE;padding:10px 14px;font-size:13px;font-weight:500;color:#27500A;display:flex;align-items:center;gap:8px;">
          📊 Okres porównawczy (bazowy)
          <span style="font-size:11px;padding:2px 8px;border-radius:20px;background:#C0DD97;color:#27500A;">bazowy</span>
        </div>
        <div style="padding:14px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 24px;margin-bottom:12px;">
            <div><div style="font-size:13px;color:var(--color-text-secondary);">Okres</div><div style="font-size:14px;font-weight:500;">${escapeHtml(p.comparisonPeriodStartDate || "?")} → ${escapeHtml(p.comparisonPeriodEndDate || "?")}</div></div>
            <div><div style="font-size:13px;color:var(--color-text-secondary);">Liczba dni okresu</div><div style="font-size:14px;font-weight:600;color:#27500A;">${compTotalDays} dni</div></div>
            <div><div style="font-size:13px;color:var(--color-text-secondary);">Odczyt startowy</div><div style="font-size:14px;">${fmt3(p.comparisonPeriodStartReading ?? 0)} ${escapeHtml(u)}</div></div>
            <div><div style="font-size:13px;color:var(--color-text-secondary);">Odczyt końcowy</div><div style="font-size:14px;">${fmt3(p.comparisonPeriodEndReading || 0)} ${escapeHtml(u)}</div></div>
          </div>
          <div style="font-size:13px;color:var(--color-text-secondary);">Zużycie bazowe</div>
          <div style="font-size:16px;font-weight:600;color:#27500A;margin-bottom:${compRows ? "12px" : "0"};">${fmt3(p.comparisonConsumption || 0)} ${escapeHtml(u)}</div>
          ${compRows ? `
          <table style="width:100%;border-collapse:collapse;border-top:1px solid var(--color-border-tertiary);">
            <thead><tr style="background:var(--color-background-secondary);">
              <th style="padding:6px 8px;text-align:left;font-size:11px;font-weight:600;color:var(--color-text-secondary);">Miesiąc</th>
              <th style="padding:6px 8px;text-align:right;font-size:11px;font-weight:600;color:var(--color-text-secondary);">Śr. temp. (°C)</th>
              <th style="padding:6px 8px;text-align:right;font-size:11px;font-weight:600;color:var(--color-text-secondary);">Dni</th>
              <th style="padding:6px 8px;text-align:right;font-size:11px;font-weight:600;color:var(--color-text-secondary);">HDD</th>
            </tr></thead>
            <tbody>${compRows}</tbody>
            <tfoot><tr style="border-top:2px solid var(--color-border-tertiary);font-weight:600;">
              <td style="padding:6px 8px;font-size:13px;">Suma</td><td></td>
              <td style="padding:6px 8px;font-size:13px;text-align:right;">${compTotalDays}</td>
              <td style="padding:6px 8px;font-size:13px;text-align:right;">${fmt2(compTotalHDD)}</td>
            </tr></tfoot>
          </table>` : ""}
        </div>
      </div>

      <!-- Typowy rok meteorologiczny (TYM) -->
      ${tymRows ? `
      <div style="border:1px solid #FAC775;border-radius:10px;overflow:hidden;margin-bottom:16px;">
        <div style="background:#FAEEDA;padding:10px 14px;font-size:13px;font-weight:500;color:#633806;">🌍 Typowy rok meteorologiczny (TYM)</div>
        <div style="padding:14px;">
          ${(p.tymPeriodStart || p.tymPeriodEnd || p.tymDataSource) ? `
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px 24px;margin-bottom:12px;">
            <div><div style="font-size:13px;color:var(--color-text-secondary);">Okres TYM od (rok)</div><div style="font-size:14px;">${escapeHtml(p.tymPeriodStart || "—")}</div></div>
            <div><div style="font-size:13px;color:var(--color-text-secondary);">Okres TYM do (rok)</div><div style="font-size:14px;">${escapeHtml(p.tymPeriodEnd || "—")}</div></div>
            <div><div style="font-size:13px;color:var(--color-text-secondary);">Źródło danych TYM</div><div style="font-size:14px;">${escapeHtml(p.tymDataSource || "—")}</div></div>
          </div>` : ""}
          <table style="width:100%;border-collapse:collapse;border-top:1px solid var(--color-border-tertiary);">
            <thead><tr style="background:var(--color-background-secondary);">
              <th style="padding:6px 8px;text-align:left;font-size:11px;font-weight:600;color:var(--color-text-secondary);">Miesiąc</th>
              <th style="padding:6px 8px;text-align:right;font-size:11px;font-weight:600;color:var(--color-text-secondary);">Temp. TYM (°C)</th>
              <th style="padding:6px 8px;text-align:right;font-size:11px;font-weight:600;color:var(--color-text-secondary);">Dni</th>
              <th style="padding:6px 8px;text-align:right;font-size:11px;font-weight:600;color:var(--color-text-secondary);">HDD TYM</th>
            </tr></thead>
            <tbody>${tymRows}</tbody>
            <tfoot><tr style="border-top:2px solid var(--color-border-tertiary);font-weight:600;">
              <td style="padding:6px 8px;font-size:13px;">Suma</td><td></td>
              <td style="padding:6px 8px;font-size:13px;text-align:right;">${tymTotalDays}</td>
              <td style="padding:6px 8px;font-size:13px;text-align:right;">${fmt2(tymTotalHDD)}</td>
            </tr></tfoot>
          </table>
        </div>
      </div>` : ""}

      ${p.note ? `
      <!-- Notatka -->
      <div style="border:1px solid var(--color-border-tertiary);border-radius:10px;padding:14px;margin-bottom:16px;">
        <div style="font-size:11px;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">📝 Notatka</div>
        <div style="font-size:14px;line-height:1.6;">${escapeHtml(p.note)}</div>
      </div>` : ""}

      <!-- Szczegóły protokołu -->
      <div style="border:1px solid var(--color-border-tertiary);border-radius:10px;padding:16px;margin-bottom:16px;">
        <div style="font-size:11px;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px;">📋 Szczegóły protokołu</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px 24px;">
          <div><div style="font-size:13px;color:var(--color-text-secondary);">Numer protokołu</div><div style="font-size:14px;font-weight:500;">${escapeHtml(p.protocolNumber || "—")}</div></div>
          <div><div style="font-size:13px;color:var(--color-text-secondary);">Data protokołu</div><div style="font-size:14px;">${escapeHtml(p.protocolDate || "—")}</div></div>
          <div><div style="font-size:13px;color:var(--color-text-secondary);">Status</div><div style="font-size:14px;">${escapeHtml(statusLabel)}</div></div>
          <div><div style="font-size:13px;color:var(--color-text-secondary);">Opracował / Energy Analyst</div><div style="font-size:14px;">${escapeHtml(p.preparedBy || "—")}</div></div>
        </div>
        ${p.protocolNotes ? `
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--color-border-tertiary);">
          <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:4px;">Uwagi do protokołu</div>
          <div style="font-size:14px;line-height:1.6;">${escapeHtml(p.protocolNotes)}</div>
        </div>` : ""}
      </div>

      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
        <button class="small-button" onclick="editMeasurement(${p.id})">✏️ Edytuj protokół</button>
        ${obj ? `<button class="small-button" onclick="switchToView('objects',()=>viewObject(${obj.id}))">🏗️ Podgląd obiektu</button>` : ""}
      </div>
    </div>
  `;
}

function editMeasurement(id) {
  const protocol = MeasurementsModule.find(id);
  if (!protocol) return;

  // Aktywuj widok modułu „Okresy bazowe" tutaj, aby NIE wywoływać potem openModule('measurements'),
  // który robiłby drugi renderMeasurementsModule() i kasował ręcznie wstawione dane miesięczne.
  const _lbls = (typeof getModuleLabels === 'function') ? getModuleLabels() : {};
  const _lbl = _lbls['measurements'];
  const _tEl = document.getElementById('module-title'); if (_tEl && _lbl) _tEl.textContent = _lbl[1];
  const _dEl = document.getElementById('module-description'); if (_dEl) _dEl.textContent = '';
  const _mvEl = document.getElementById('module-view'); if (_mvEl) _mvEl.classList.add('active');

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
      if (dInput) { const _dv = (item.days !== undefined && item.days !== null && item.days !== "") ? item.days : ((item.realDays !== undefined && item.realDays !== null && item.realDays !== "") ? item.realDays : null); if (_dv !== null) dInput.value = _dv; }
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
  const _bt = baseTempEl ? parseFloat(baseTempEl.value) : NaN; const baseTemp = (Number.isFinite(_bt) && _bt > 0) ? _bt : 21;

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
    const hddAuto = tempVal !== "" ? (baseTemp - Number(tempVal)) * Number(daysVal) : null;

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
  const _bt = baseTempEl ? parseFloat(baseTempEl.value) : NaN; const baseTemp = (Number.isFinite(_bt) && _bt > 0) ? _bt : 21;

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
    const hdd  = (baseTemp - Number(tInput.value)) * days;
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
  const _bt = baseTempEl ? parseFloat(baseTempEl.value) : NaN; const baseTemp = (Number.isFinite(_bt) && _bt > 0) ? _bt : 21;
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
    const hdd  = (baseTemp - Number(tInput.value)) * days;
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

  <style>
    .mtc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px;margin-bottom:22px;}
    .mtc{position:relative;border:1.5px solid var(--color-border-tertiary);border-radius:14px;padding:16px 14px;cursor:pointer;background:var(--color-background-primary);transition:.15s;display:flex;flex-direction:column;gap:7px;}
    .mtc:hover{border-color:#B5D4F4;box-shadow:0 4px 14px rgba(12,68,124,.08);transform:translateY(-1px);}
    .mtc.sel{border-color:#0C447C;background:#E6F1FB;box-shadow:0 4px 16px rgba(12,68,124,.14);}
    .mtc .ico{font-size:24px;}
    .mtc .t{font-size:14px;font-weight:600;color:var(--color-text-primary);}
    .mtc .d{font-size:12px;color:var(--color-text-secondary);line-height:1.35;}
    .mtc .badge{position:absolute;top:11px;right:11px;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;}
    .mtc .badge.ready{background:#EAF3DE;color:#27500A;}
    .mtc .badge.soon{background:#FFF1E0;color:#9A5B00;}
    .mtc .chk{position:absolute;top:9px;right:9px;width:22px;height:22px;border-radius:50%;background:#0C447C;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;}
  </style>
  <p style="font-size:13px;color:var(--color-text-secondary);margin:0 0 14px;">Wybierz typ okresu bazowego. Typy i opisy są spójne z modułem Analizy.</p>
  <div class="mtc-grid">
    ${(function(){
      const T=[
        ['tym','🌡️','Korekta TYM','Sprowadzenie zużycia do standardowego sezonu metodą stopniodni.',true],
        ['regression','📈','Regresja liniowa','Porównanie techniczne PRZED/PO wg równań y = ax + b.',true],
        ['occupancy','🏨','Korekta obłożenia','Normalizacja zużycia względem obłożenia obiektu.',false],
        ['area','📐','Korekta powierzchni','Wskaźniki zużycia na m² powierzchni ogrzewanej.',false],
        ['volume','⚙️','Korekta intensywności','Normalizacja względem wolumenu / intensywności pracy.',true],
        ['schedule','🕐','Korekta harmonogramu','Uwzględnienie harmonogramu pracy obiektu.',false],
        ['custom','🔬','Metoda niestandardowa','Dowolny model definiowany przez analityka.',false]
      ];
      return T.map(function(x){
        const sel = activeMeasurementsTab===x[0] ? 'sel' : '';
        return '<div class="mtc '+sel+'" onclick="activeMeasurementsTab=\''+x[0]+'\'; showMeasurementForm=false; renderMeasurementsModule();">'
          +(sel?'<span class="chk">✓</span>':'')
          +'<span class="badge '+(x[4]?'ready':'soon')+'">'+(x[4]?'GOTOWE':'WKRÓTCE')+'</span>'
          +'<span class="ico">'+x[1]+'</span>'
          +'<span class="t">'+x[2]+'</span>'
          +'<span class="d">'+x[3]+'</span></div>';
      }).join('');
    })()}
  </div>

  ${activeMeasurementsTab === 'regression' ? '' : activeMeasurementsTab !== 'tym' ? '' : (!showMeasurementForm ? '' : `<form onsubmit="try{createMeasurement(this)}catch(e){console.error(e);alert('Błąd zapisu — dane NIE zostały zapisane. Zgłoś tę treść: '+(e.message||e));}return false;">

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
  ${activeMeasurementsTab === 'occupancy' ? renderPlaceholderMeasTab('🏨', 'Korekta obłożenia', 'occupancy', 'Normalizacja zużycia względem obłożenia obiektu.', '#E6F1FB', '#B5D4F4', '#0C447C') : ''}
  ${activeMeasurementsTab === 'area' ? renderPlaceholderMeasTab('📐', 'Korekta powierzchni', 'area', 'Wskaźniki zużycia na m² powierzchni ogrzewanej.', '#E8F5E9', '#A5D6A7', '#2E7D32') : ''}
  ${activeMeasurementsTab === 'volume' ? renderPlaceholderMeasTab('⚙️', 'Korekta intensywności', 'volume', 'Normalizacja względem wolumenu / intensywności pracy.', '#FFF3E0', '#FFCC80', '#E65100') : ''}
  ${activeMeasurementsTab === 'schedule' ? renderPlaceholderMeasTab('🕐', 'Korekta harmonogramu', 'schedule', 'Uwzględnienie harmonogramu pracy obiektu.', '#F3E5F5', '#CE93D8', '#6A1B9A') : ''}
  ${activeMeasurementsTab === 'custom' ? renderPlaceholderMeasTab('🔬', 'Metoda niestandardowa', 'custom', 'Dowolny model definiowany przez analityka.', '#FCE4EC', '#F48FB1', '#880E4F') : ''}
  ${(activeMeasurementsTab === 'tym' && !showMeasurementForm) ? `
    <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;margin-top:8px;">
      <div style="flex:1;min-width:200px;">
        <label style="display:block;font-size:12px;color:var(--color-text-secondary);margin-bottom:4px;">Klient</label>
        <select onchange="(function(v){var os=ObjectsModule.findByClient(Number(v));selectedMeasurementObjectId=os[0]?Number(os[0].id):null;renderMeasurementsModule();})(this.value)" style="width:100%;padding:8px 10px;border:1px solid var(--color-border-tertiary);border-radius:8px;font-size:13px;">
          ${clients.map(c => { const cn = ClientsModule.getNumber(c.id); return `<option value="${c.id}" ${Number(c.id) === selectedClientId ? 'selected' : ''}>${cn ? 'K'+cn+' — ' : ''}${escapeHtml(c.name)}</option>`; }).join('')}
        </select>
      </div>
      <div style="flex:1;min-width:200px;">
        <label style="display:block;font-size:12px;color:var(--color-text-secondary);margin-bottom:4px;">Obiekt</label>
        <select onchange="selectedMeasurementObjectId=Number(this.value);renderMeasurementsModule();" style="width:100%;padding:8px 10px;border:1px solid var(--color-border-tertiary);border-radius:8px;font-size:13px;">
          ${objectsForClient.map(o => { const cn = ClientsModule.getNumber(o.clientId); const on = ObjectsModule.getNumber(o.id); return `<option value="${o.id}" ${Number(o.id) === selectedMeasurementObjectId ? 'selected' : ''}>${(cn&&on) ? 'K'+cn+'-'+on+' — ' : ''}${escapeHtml(o.name || 'Obiekt bez nazwy')}</option>`; }).join('')}
        </select>
      </div>
    </div>
    ${renderProtocolsTable(protocolsForTabs, selectedMeasurementObjectId)}
  ` : ''}
  `;

  _runMeasurementsScripts(container);
  if (activeMeasurementsTab === 'tym' && showMeasurementForm) renderMeasurementsList();
}

// innerHTML nie uruchamia <script> — re-tworzymy je, by wykresy (Canvas) się narysowały.
function _runMeasurementsScripts(container) {
  try {
    container.querySelectorAll('script').forEach(old => {
      const s = document.createElement('script');
      if (old.src) s.src = old.src; else s.textContent = old.textContent;
      old.parentNode.replaceChild(s, old);
    });
  } catch (e) { /* ignore */ }
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
        <input id="prot-search-input" type="search" placeholder="Szukaj okresu bazowego..." value="${escapeHtml(window._protSearch || '')}"
          oninput="window._protSearch=this.value;renderMeasurementsModule();setTimeout(function(){var s=document.getElementById('prot-search-input');if(s){s.focus();s.setSelectionRange(s.value.length,s.value.length);}},0);"
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
      <td style="padding:9px 12px;font-size:13px;font-weight:600;white-space:nowrap;">${escapeHtml(item.protocolNumber || '—')}</td>
      <td style="padding:9px 12px;font-size:13px;font-weight:500;white-space:nowrap;">${escapeHtml(item.protocolDate || '—')}</td>
      <td style="padding:9px 12px;font-size:13px;">${escapeHtml((client && client.name) || '—')}</td>
      <td style="padding:9px 12px;font-size:13px;">${escapeHtml((object && object.name) || '—')}</td>
      <td style="padding:9px 12px;font-size:13px;white-space:nowrap;">${escapeHtml(item.comparisonPeriodStartDate || '')} → ${escapeHtml(item.comparisonPeriodEndDate || '')}</td>
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
            <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);white-space:nowrap;">Nr protokołu</th>
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

// ═══════════════════════════════════════════════════════════════════════════
// OKRESY BAZOWE REGRESJI — dyskretne protokoły per obiekt.
// Każdy protokół ma własne dane z czujników + dane klimatyczne (źródło, data pobrania).
// Powód: zmiana w obiekcie (np. wymiana okien) zmienia charakterystykę cieplną →
// trzeba nowy okres bazowy, a stary zachować. Spłaca też dług techniczny:
// dawne waterai_regression_sensors_<objectId> → opakowane w moduł.
// ═══════════════════════════════════════════════════════════════════════════
const RegressionBaseModule = {
  protoKey: oid => 'waterai_regression_protocols_' + oid,
  rowsKey:  pid => 'waterai_regression_rows_' + pid,

  listByObject(oid) { return window._regressionStore.getProtocols(oid); },
  saveList(oid, list) { window._regressionStore.saveProtocols(oid, list); },
  find(oid, pid) { return this.listByObject(oid).find(p => Number(p.id) === Number(pid)) || null; },

  nextNumber(oid) {
    const yr = new Date().getFullYear();
    const n = this.listByObject(oid).filter(p => (p.number || '').indexOf('/' + yr + '/') >= 0).length + 1;
    let pfx = '';
    try {
      const obj = (typeof ObjectsModule !== 'undefined') ? ObjectsModule.find(oid) : null;
      const cn = (obj && typeof ClientsModule !== 'undefined') ? ClientsModule.getNumber(obj.clientId) : null;
      const on = (typeof ObjectsModule !== 'undefined') ? ObjectsModule.getNumber(oid) : null;
      if (cn) pfx = 'K' + cn + (on ? '-' + on : '') + '/';
    } catch (e) { /* ignore */ }
    return pfx + 'REG/' + yr + '/' + String(n).padStart(3, '0');
  },

  add(oid, data) {
    const list = this.listByObject(oid);
    const rec = {
      id: Date.now() * 1000 + Math.floor(Math.random() * 1000),
      number: data.number || this.nextNumber(oid),
      protocolDate: data.protocolDate || new Date().toISOString().slice(0, 10),
      periodFrom: data.periodFrom || '', periodTo: data.periodTo || '',
      climateSource: data.climateSource || '', climateFetchDate: data.climateFetchDate || '',
      notes: data.notes || '', createdAt: new Date().toISOString()
    };
    list.push(rec); this.saveList(oid, list);
    this.saveRows(rec.id, Array.isArray(data.rows) ? data.rows : []);
    return rec;
  },

  update(oid, pid, data) {
    this.saveList(oid, this.listByObject(oid).map(p =>
      Number(p.id) === Number(pid) ? { ...p, ...data, id: p.id, updatedAt: new Date().toISOString() } : p));
  },

  remove(oid, pid) {
    this.saveList(oid, this.listByObject(oid).filter(p => Number(p.id) !== Number(pid)));
    window._regressionStore.removeRows(pid);
  },

  getRows(pid)  { return window._regressionStore.getRows(pid); },
  saveRows(pid, rows) { window._regressionStore.saveRows(pid, rows); }
};
window.RegressionBaseModule = RegressionBaseModule;

// Jednorazowa migracja: dawny płaski zestaw per obiekt → protokół #1 tego obiektu.
(function _regProtoMigrate() {
  try {
    if (localStorage.getItem('waterai_regression_protocols_migrated_v1')) return;
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf('waterai_regression_sensors_') === 0) keys.push(k);
    }
    keys.forEach(k => {
      const oid = k.slice('waterai_regression_sensors_'.length);
      let rows = []; try { rows = JSON.parse(localStorage.getItem(k) || '[]'); } catch (e) {}
      if (rows.length && !RegressionBaseModule.listByObject(oid).length) {
        RegressionBaseModule.add(oid, {
          number: RegressionBaseModule.nextNumber(oid),
          protocolDate: new Date().toISOString().slice(0, 10),
          climateSource: 'Odczyt z instalacji / Water AI',
          notes: 'Zmigrowano z poprzedniej wersji (jeden zestaw danych → protokół #1)',
          rows
        });
      }
    });
    localStorage.setItem('waterai_regression_protocols_migrated_v1', '1');
  } catch (e) { /* ignore */ }
})();

// ─── CRUD / nawigacja protokołów regresji (stan w window) ───
function regProtoNew() {
  const objId = selectedMeasurementObjectId;
  if (!objId) { alert('Wybierz obiekt.'); return; }
  window._regProtoForm = {
    objectId: Number(objId), id: null, number: RegressionBaseModule.nextNumber(objId),
    protocolDate: new Date().toISOString().slice(0, 10), periodFrom: '', periodTo: '',
    climateSource: 'Odczyt z instalacji / Water AI', climateFetchDate: '', notes: '', _copyRows: null, _copyFromNumber: ''
  };
  window._regActiveProtocolId = null;
  renderMeasurementsModule();
}

function regProtoCopyPrev() {
  const f = window._regProtoForm; if (!f) return;
  const prev = RegressionBaseModule.listByObject(f.objectId)
    .slice().sort((a, b) => Number(b.id) - Number(a.id))
    .find(p => Number(p.id) !== Number(f.id || 0));
  if (!prev) { alert('Brak poprzedniego protokołu okresu bazowego dla tego obiektu.'); return; }
  f.periodFrom = prev.periodFrom || ''; f.periodTo = prev.periodTo || '';
  f.climateSource = prev.climateSource || ''; f.climateFetchDate = prev.climateFetchDate || '';
  f.notes = prev.notes || '';
  f._copyRows = RegressionBaseModule.getRows(prev.id);
  f._copyFromNumber = prev.number || '';
  renderMeasurementsModule();
}

function regProtoEdit(pid) {
  const objId = selectedMeasurementObjectId;
  const p = RegressionBaseModule.find(objId, pid); if (!p) return;
  window._regProtoForm = {
    objectId: Number(objId), id: p.id, number: p.number || '', protocolDate: p.protocolDate || '',
    periodFrom: p.periodFrom || '', periodTo: p.periodTo || '', climateSource: p.climateSource || '',
    climateFetchDate: p.climateFetchDate || '', notes: p.notes || '', _copyRows: null, _copyFromNumber: ''
  };
  renderMeasurementsModule();
}

function regProtoSetField(field, val) { if (window._regProtoForm) window._regProtoForm[field] = val; }

function regProtoSave() {
  const f = window._regProtoForm; if (!f) return;
  const payload = {
    number: f.number, protocolDate: f.protocolDate, periodFrom: f.periodFrom, periodTo: f.periodTo,
    climateSource: f.climateSource, climateFetchDate: f.climateFetchDate, notes: f.notes
  };
  if (f.id) {
    RegressionBaseModule.update(f.objectId, f.id, payload);
    window._regActiveProtocolId = f.id;
  } else {
    const rec = RegressionBaseModule.add(f.objectId, { ...payload, rows: f._copyRows || [] });
    window._regActiveProtocolId = rec.id;
  }
  window._regProtoForm = null;
  window._regPage = 0;
  renderMeasurementsModule();
}

function _regProtoActivate(pid, mode) {
  window._regActiveProtocolId = Number(pid);
  window._regViewMode = (mode === 'edit') ? 'edit' : 'preview';
  window._regProtoForm = null; window._regPage = 0;
  window._regSelectionOpen = (mode === 'edit');   // w edycji od razu pokaż narzędzia selekcji
  // Wczytaj zapisany zakres okresu bazowego do filtra roboczego (żeby nie ustawiać go od nowa).
  const _p = (typeof selectedMeasurementObjectId !== 'undefined' && window.RegressionBaseModule)
    ? RegressionBaseModule.find(selectedMeasurementObjectId, Number(pid)) : null;
  window._regBaseFrom = (_p && _p.periodFrom) ? _p.periodFrom : '';
  window._regBaseTo   = (_p && _p.periodTo)   ? _p.periodTo   : '';
  window._regResultsOpen = !!(_p && _p.regressionSaved);   // zapisana regresja → pokaż 4 wykresy
  window._regOutPage = {};
  renderMeasurementsModule();
}
function regProtoPreview(pid) { _regProtoActivate(pid, 'preview'); }   // 👁 podgląd (read-only)
function regProtoOpen(pid)    { _regProtoActivate(pid, 'edit'); }      // ✏️ edycja (selekcja + wykresy + zapis)
function regProtoBack() { window._regActiveProtocolId = null; window._regProtoForm = null; renderMeasurementsModule(); }
function regProtoDelete(pid) {
  // Dwustopniowo, bez confirm() (działa przy zablokowanych oknach dialogowych).
  if (window._regProtoDelArm != pid) {
    window._regProtoDelArm = pid;
    renderMeasurementsModule();
    try { setTimeout(function () { if (window._regProtoDelArm == pid) { window._regProtoDelArm = null; renderMeasurementsModule(); } }, 4000); } catch (e) {}
    return;
  }
  window._regProtoDelArm = null;
  RegressionBaseModule.remove(selectedMeasurementObjectId, pid);
  if (Number(window._regActiveProtocolId) === Number(pid)) window._regActiveProtocolId = null;
  renderMeasurementsModule();
}

// ─── Renderery: lista / formularz / aktywny protokół ───
function _regProtocolListHtml(objId) {
  const list = RegressionBaseModule.listByObject(objId).slice().sort((a, b) => Number(b.id) - Number(a.id));
  const rows = list.map(p => {
    const n = RegressionBaseModule.getRows(p.id).length;
    const per = (p.periodFrom || p.periodTo) ? `${(p.periodFrom || '—').replace('T', ' ')} → ${(p.periodTo || '—').replace('T', ' ')}` : '—';
    return `<tr style="border-bottom:0.5px solid var(--color-border-tertiary);">
      <td style="padding:8px 10px;font-size:12px;font-weight:600;color:#0C447C;">${escapeHtml(p.number || '—')}</td>
      <td style="padding:8px 10px;font-size:12px;">${p.protocolDate || '—'}</td>
      <td style="padding:8px 10px;font-size:12px;">${escapeHtml(per)}</td>
      <td style="padding:8px 10px;font-size:12px;">${escapeHtml(p.climateSource || '—')}</td>
      <td style="padding:8px 10px;font-size:12px;text-align:right;">${n}</td>
      <td style="padding:8px 10px;text-align:right;white-space:nowrap;">
        <button class="small-button" onclick="regProtoPreview(${p.id})" class="icon-btn" style="font-size:11px;" title="Podgląd">👁</button>
        <button class="small-button" onclick="regProtoOpen(${p.id})" style="font-size:11px;" title="Edytuj protokół (dane, selekcja, regresja)">✏️</button>
        <button class="small-button" onclick="regProtoDelete(${p.id})" style="font-size:11px;${window._regProtoDelArm == p.id ? 'color:#fff;background:#c00;border-color:#c00;font-weight:700;' : 'color:#c00;border-color:#c00;'}">${window._regProtoDelArm == p.id ? '⚠️ usuń?' : '🗑'}</button>
      </td>
    </tr>`;
  }).join('');
  return `<div style="display:flex;justify-content:space-between;align-items:center;margin:6px 0 14px;gap:10px;flex-wrap:wrap;">
      <h3 style="margin:0;font-size:15px;font-weight:600;color:#0C447C;">📈 Okresy bazowe — regresja liniowa</h3>
      <button class="primary-button" onclick="regProtoNew()" style="font-size:13px;padding:7px 16px;white-space:nowrap;">+ Nowy okres bazowy</button>
    </div>
    ${list.length === 0
      ? `<div class="reminder-card"><strong>Brak okresów bazowych regresji dla tego obiektu</strong>
           <div class="reminder-meta">Kliknij „+ Nowy okres bazowy", aby utworzyć protokół i wprowadzić dane z czujników.</div></div>`
      : `<div style="border:1px solid var(--color-border-tertiary);border-radius:10px;overflow:hidden;">
          <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;min-width:680px;">
            <thead><tr style="background:var(--color-background-secondary);">
              <th style="padding:8px 10px;text-align:left;font-size:10px;font-weight:600;color:var(--color-text-secondary);">Nr protokołu</th>
              <th style="padding:8px 10px;text-align:left;font-size:10px;font-weight:600;color:var(--color-text-secondary);">Data</th>
              <th style="padding:8px 10px;text-align:left;font-size:10px;font-weight:600;color:var(--color-text-secondary);">Okres bazowy</th>
              <th style="padding:8px 10px;text-align:left;font-size:10px;font-weight:600;color:var(--color-text-secondary);">Źródło klimatu</th>
              <th style="padding:8px 10px;text-align:right;font-size:10px;font-weight:600;color:var(--color-text-secondary);">Odczyty</th>
              <th style="padding:8px 10px;"></th>
            </tr></thead><tbody>${rows}</tbody></table></div></div>`}`;
}

function _regProtocolFormHtml(objId) {
  const f = window._regProtoForm;
  const isNew = !f.id;
  const lbl = 'display:block;font-size:11px;color:var(--color-text-secondary);margin-bottom:3px;';
  const inp = 'width:100%;padding:7px 9px;border:1px solid var(--color-border-tertiary);border-radius:7px;font-size:13px;box-sizing:border-box;';
  const copyNote = f._copyRows
    ? `<div style="font-size:11px;color:#0C447C;background:#E6F1FB;border-radius:6px;padding:7px 10px;margin-bottom:12px;">↪ Skopiowano z protokołu <strong>${escapeHtml(f._copyFromNumber || '')}</strong>: ${f._copyRows.length} odczytów + dane klimatyczne i okres. Edytuj wg potrzeb i zapisz, aby utworzyć nowy protokół.</div>`
    : '';
  return `<div style="border:1px solid #B5D4F4;border-radius:12px;overflow:hidden;margin-bottom:18px;">
    <div style="background:#E6F1FB;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
      <h3 style="margin:0;font-size:14px;font-weight:600;color:#0C447C;">${isNew ? '➕ Nowy okres bazowy regresji' : '✏️ Edycja okresu bazowego'}</h3>
      ${isNew ? `<button class="small-button" onclick="regProtoCopyPrev()" style="font-size:12px;">📋 Kopiuj z poprzedniego protokołu</button>` : ''}
    </div>
    <div style="padding:16px;background:var(--color-background-primary);">
      ${copyNote}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div><label style="${lbl}">Nr protokołu</label><input style="${inp}" value="${escapeHtml(f.number || '')}" onchange="regProtoSetField('number',this.value)"></div>
        <div><label style="${lbl}">Data protokołu</label><input type="date" style="${inp}" value="${f.protocolDate || ''}" onchange="regProtoSetField('protocolDate',this.value)"></div>
        <div><label style="${lbl}">Okres bazowy — od</label><input type="datetime-local" style="${inp}" value="${f.periodFrom || ''}" onchange="regProtoSetField('periodFrom',this.value)"></div>
        <div><label style="${lbl}">Okres bazowy — do</label><input type="datetime-local" style="${inp}" value="${f.periodTo || ''}" onchange="regProtoSetField('periodTo',this.value)"></div>
      </div>
      <div style="margin-top:14px;border-top:1px dashed var(--color-border-tertiary);padding-top:12px;">
        <div style="font-size:11px;font-weight:600;color:#0C447C;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">🌍 Dane klimatyczne</div>
        <div style="display:grid;grid-template-columns:2fr 1fr;gap:12px;">
          <div><label style="${lbl}">Źródło danych</label><input style="${inp}" placeholder="np. WeatherOnline / Robot Klimatu" value="${escapeHtml(f.climateSource || '')}" onchange="regProtoSetField('climateSource',this.value)"></div>
          <div><label style="${lbl}">Data pobrania danych</label><input type="date" style="${inp}" value="${f.climateFetchDate || ''}" onchange="regProtoSetField('climateFetchDate',this.value)"></div>
        </div>
      </div>
      <div style="margin-top:12px;"><label style="${lbl}">Notatki</label><textarea style="${inp}min-height:54px;resize:vertical;" onchange="regProtoSetField('notes',this.value)">${escapeHtml(f.notes || '')}</textarea></div>
      <div style="margin-top:16px;display:flex;gap:8px;">
        <button class="primary-button" onclick="regProtoSave()" style="font-size:13px;">${isNew ? 'Utwórz protokół' : 'Zapisz zmiany'}</button>
        <button class="small-button" onclick="regProtoBack()" style="font-size:13px;">Anuluj</button>
      </div>
    </div>
  </div>`;
}

function _regProtocolActiveHtml(objId, pid) {
  const p = RegressionBaseModule.find(objId, pid);
  if (!p) { window._regActiveProtocolId = null; return _regProtocolListHtml(objId); }
  const mode = (window._regViewMode === 'edit') ? 'edit' : 'preview';
  const per = (p.periodFrom || p.periodTo) ? `${(p.periodFrom || '—').replace('T', ' ')} → ${(p.periodTo || '—').replace('T', ' ')}` : '—';
  const meta = `<div style="display:flex;gap:20px;flex-wrap:wrap;font-size:12px;color:var(--color-text-secondary);">
      <span>📅 Okres: <strong style="color:var(--color-text-primary);">${escapeHtml(per)}</strong></span>
      <span>🌍 Źródło klimatu: <strong style="color:var(--color-text-primary);">${escapeHtml(p.climateSource || '—')}</strong></span>
      <span>⬇ Pobrano: <strong style="color:var(--color-text-primary);">${p.climateFetchDate || '—'}</strong></span>
    </div>`;
  const metaBox = `<div style="background:var(--color-background-secondary);border:1px solid var(--color-border-tertiary);border-radius:10px;padding:12px 16px;margin-bottom:8px;">${meta}</div>`;
  const obj = (typeof ObjectsModule !== 'undefined') ? ObjectsModule.find(objId) : null;

  // ── TRYB EDYCJI: dane + selekcja + zakres + 4 wykresy + „Zapisz regresję" (na dole) ──
  if (mode === 'edit') {
    return `<div style="display:flex;justify-content:space-between;align-items:flex-start;margin:6px 0 12px;gap:10px;flex-wrap:wrap;">
        <div>
          <button class="small-button" onclick="regProtoPreview(${pid})" style="font-size:12px;margin-bottom:8px;">← Podgląd</button>
          <h3 style="margin:0;font-size:15px;font-weight:600;color:#0C447C;">✏️ Edycja: ${escapeHtml(p.number || 'Okres bazowy')}</h3>
        </div>
        <button class="small-button" onclick="regProtoEdit(${pid})" style="font-size:12px;white-space:nowrap;">✏️ Edytuj nagłówek / dane klimatyczne</button>
      </div>
      ${metaBox}
      ${renderRegressionSensorData(pid)}
      ${_regWorkflowHtml(pid)}`;
  }

  // ── TRYB PODGLĄDU (read-only) ──
  const lineTxt = key => {
    const L = p.regressionLines && p.regressionLines[key];
    if (!L || L.a == null || L.b == null) return '—';
    const a = Number(L.a), b = Number(L.b);
    return `y = ${a.toFixed(4)}·x ${b >= 0 ? '+ ' : '− '}${Math.abs(b).toFixed(2)}` + (L.n != null ? ` (n=${L.n})` : '');
  };
  const savedBlock = p.regressionSaved
    ? `<div style="background:var(--color-background-secondary);border:1px solid var(--color-border-tertiary);border-radius:10px;padding:12px 16px;margin-bottom:12px;">
        <div style="font-size:11px;font-weight:600;color:#0C447C;text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px;">📈 Zapisane wyniki regresji</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;font-size:12px;">
          <span>📉 Zużycie — Metoda 1: <strong>${lineTxt('cons_raw')}</strong></span>
          <span>📉 Zużycie — Metoda 2: <strong>${lineTxt('cons_binned')}</strong></span>
          <span>🌡️ T zasilania — Metoda 1: <strong>${lineTxt('sup_raw')}</strong></span>
          <span>🌡️ T zasilania — Metoda 2: <strong>${lineTxt('sup_binned')}</strong></span>
        </div>
        <div style="font-size:11px;color:#1E7B34;margin-top:8px;">✓ Zapisano: ${p.regressionSavedAt ? new Date(p.regressionSavedAt).toLocaleString('pl-PL') : '—'} · usuniętych punktów: ${p.regressionRemovedCount != null ? p.regressionRemovedCount : '—'}</div>
      </div>
      ${renderRegressionBaselineCurves(pid)}`
    : `<div class="reminder-card" style="border-left:4px solid #FAC775;"><strong>Brak zapisanej regresji</strong><div class="reminder-meta">Kliknij „✏️ Edytuj", wykonaj 4 wykresy i na dole „💾 Zapisz regresję".</div></div>`;

  const status = p.regressionSaved ? 'Zapisana' : 'Szkic';
  const protocolDetails = `<div style="border-top:1px solid var(--color-border-tertiary);margin-top:14px;padding-top:12px;">
      <div style="font-size:11px;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px;">📋 Szczegóły protokołu</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px 24px;font-size:12px;">
        <span>Numer protokołu<br><strong style="color:var(--color-text-primary);">${escapeHtml(p.number || '—')}</strong></span>
        <span>Data protokołu<br><strong style="color:var(--color-text-primary);">${p.protocolDate || '—'}</strong></span>
        <span>Status<br><strong style="color:var(--color-text-primary);">${status}</strong></span>
      </div>
      ${p.notes ? `<div style="font-size:12px;margin-top:10px;">Notatki<br><strong style="color:var(--color-text-primary);">${escapeHtml(p.notes)}</strong></div>` : ''}
    </div>`;

  return `<div style="display:flex;justify-content:space-between;align-items:flex-start;margin:6px 0 12px;gap:10px;flex-wrap:wrap;">
      <div>
        <button class="small-button" onclick="regProtoBack()" style="font-size:12px;margin-bottom:8px;">← Wróć</button>
        <h3 style="margin:0;font-size:15px;font-weight:600;color:#0C447C;">📈 ${escapeHtml(p.number || 'Okres bazowy')}</h3>
      </div>
      <button class="primary-button" onclick="regProtoOpen(${pid})" style="font-size:13px;white-space:nowrap;">✏️ Edytuj</button>
    </div>
    ${metaBox}
    ${savedBlock}
    ${protocolDetails}
    <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
      <button class="small-button" onclick="regProtoEdit(${pid})" style="font-size:13px;">✏️ Edytuj protokół</button>
      ${obj ? `<button class="small-button" onclick="switchToView('objects',()=>viewObject(${objId}))" style="font-size:13px;">🏗️ Podgląd obiektu</button>` : ''}
    </div>`;
}

// Odporny parser daty/godziny odczytu — toleruje dowolne separatory (., /, -, przecinek, spacje).
// Wyciąga grupy cyfr: [D,M,Y(,H,M,S)] lub [Y,M,D,...] gdy pierwsza ma 4 cyfry.
function _regTs(v) {
  if (v === null || v === undefined || v === '') return null;
  const s = String(v).trim();
  // Tylko format ISO (RRRR-MM-DD[ T HH:MM]) ufamy Date.parse — reszta przez deterministyczny rozkład,
  // bo Date.parse("DD.MM.RRRR") bywa różnie interpretowany w różnych przeglądarkach.
  if (/^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2})?/.test(s)) {
    const t = Date.parse(s.replace(' ', 'T'));
    if (!isNaN(t)) return t;
  }
  const nums = s.match(/\d+/g);
  if (!nums || nums.length < 3) return null;
  let y, mo, d;
  if (nums[0].length === 4) { y = +nums[0]; mo = +nums[1]; d = +nums[2]; }
  else { d = +nums[0]; mo = +nums[1]; y = +nums[2]; }
  const H = +(nums[3] || 0), Mi = +(nums[4] || 0), S = +(nums[5] || 0);
  if (!(y >= 1900 && mo >= 1 && mo <= 12 && d >= 1 && d <= 31)) return null;
  const dt = new Date(y, mo - 1, d, H, Mi, S);
  return isNaN(dt.getTime()) ? null : dt.getTime();
}

// Granica zakresu dat (Od/Do) — używa TEGO SAMEGO parsera co odczyty, więc porównanie jest spójne.
function _regBoundMs(v, isEnd) {
  if (!v) return isEnd ? Infinity : -Infinity;
  let s = String(v).trim();
  if (s.length <= 10) s += isEnd ? ' 23:59:59' : ' 00:00:00';
  const t = _regTs(s);
  return t == null ? (isEnd ? Infinity : -Infinity) : t;
}

function renderRegressionSensorData(objectId) { // objectId = id protokołu regresji
  const rawRows = RegressionBaseModule.getRows(objectId);

  // Sortowanie + paginacja (stan w window)
  window._regSortKey  = window._regSortKey  || 'readTime';
  window._regSortDir  = window._regSortDir  || 'asc';
  window._regPageSize = window._regPageSize || 50;
  const pageSize = window._regPageSize;

  const _rt = _regTs;
  const removedCount = rawRows.filter(r => r.removed).length;
  const sortKey = window._regSortKey, sortDir = window._regSortDir === 'desc' ? -1 : 1;
  const indexed = rawRows.map((r, idx) => ({ r, idx })).filter(o => !o.r.removed);
  indexed.sort((A, B) => {
    let a, b;
    if (sortKey === 'readTime') {
      a = _rt(A.r.readTime); b = _rt(B.r.readTime);
      if (a == null && b == null) {   // nieparsowalne daty → porównanie tekstowe, by sort działał
        const as = String(A.r.readTime || ''), bs = String(B.r.readTime || '');
        if (as < bs) return -1 * sortDir;
        if (as > bs) return  1 * sortDir;
        return A.idx - B.idx;
      }
    } else {
      a = (A.r[sortKey] == null || A.r[sortKey] === '') ? null : Number(A.r[sortKey]);
      b = (B.r[sortKey] == null || B.r[sortKey] === '') ? null : Number(B.r[sortKey]);
    }
    if (a == null && b == null) return A.idx - B.idx;
    if (a == null) return 1;          // brakujące wartości zawsze na końcu
    if (b == null) return -1;
    if (a < b) return -1 * sortDir;
    if (a > b) return  1 * sortDir;
    return A.idx - B.idx;
  });

  const totalPages = Math.max(1, Math.ceil(indexed.length / pageSize));
  window._regPage = window._regPage || 0;
  if (window._regPage >= totalPages) window._regPage = totalPages - 1;
  if (window._regPage < 0) window._regPage = 0;
  const page = window._regPage;
  const rows = indexed.slice(page * pageSize, (page + 1) * pageSize);

  // Δ zużycie = różnica wskazań licznika między kolejnymi odczytami (chronologicznie), niezależnie od sortowania wyświetlania
  const chrono = rawRows.map((r, idx) => ({ r, idx })).filter(o => !o.r.removed).sort((A, B) => {
    const am = _rt(A.r.readTime), bm = _rt(B.r.readTime);
    if (am != null && bm != null) return am - bm;
    if (am != null) return -1;
    if (bm != null) return 1;
    return A.idx - B.idx;
  });
  const deltaByIdx = {};
  const _chainRows = chrono.map(o => Object.assign({}, o.r, { _idx: o.idx }));
  _consDeltas(_chainRows).forEach(d => { deltaByIdx[d.idx] = d.y; });

  const fmtVal = v => (v === null || v === undefined || v === '') ? '—' : Number(v).toLocaleString('pl-PL', { maximumFractionDigits: 2 });
  const fmtT   = v => (v === null || v === undefined || v === '') ? '—' : Number(v).toLocaleString('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const sortArrow = key => window._regSortKey === key ? (window._regSortDir === 'desc' ? ' ▼' : ' ▲') : ' ⇅';
  const th = (key, label, align) => `<th onclick="regToggleSort('${key}')" title="Kliknij, aby sortować" style="padding:6px 8px;text-align:${align};font-size:10px;font-weight:600;border-bottom:1px solid var(--color-border-tertiary);color:var(--color-text-secondary);cursor:pointer;user-select:none;white-space:nowrap;">${label}<span style="opacity:.55;">${sortArrow(key)}</span></th>`;

  const tableRows = rows.map(({ r, idx }) => {
    return `<tr style="border-bottom:0.5px solid var(--color-border-tertiary);">
      <td style="padding:4px 8px;font-size:11px;color:var(--color-text-tertiary);">${escapeHtml(r.readTime || '—')}</td>
      <td style="padding:4px 8px;font-size:12px;text-align:right;">${fmtT(r.tOutdoor)}</td>
      <td style="padding:4px 8px;font-size:12px;text-align:right;">${fmtT(r.tSupply)}</td>
      <td style="padding:4px 8px;font-size:12px;text-align:right;">${fmtT(r.tReturn)}</td>
      <td style="padding:4px 8px;font-size:12px;text-align:right;">${fmtVal(r.vFlow)}</td>
      <td style="padding:4px 8px;font-size:12px;text-align:right;">${fmtVal(r.heatPower)}</td>
      <td style="padding:4px 8px;font-size:12px;text-align:right;">${fmtVal(r.heatConsumption)}</td>
      <td style="padding:4px 8px;font-size:12px;text-align:right;font-weight:600;color:#185FA5;">${deltaByIdx[idx] == null ? '—' : fmtVal(deltaByIdx[idx])}</td>
      <td style="padding:4px 8px;">
        <button class="small-button" onclick="deleteRegressionRow(${objectId}, ${idx})" style="font-size:10px;padding:2px 7px;color:#c00;border-color:#c00;">✕</button>
      </td>
    </tr>`;
  }).join('');

  const navBtn = (label, target, disabled) => `<button class="small-button" onclick="window._regPage=${target};renderMeasurementsModule();" ${disabled ? 'disabled' : ''} style="font-size:11px;">${label}</button>`;
  const pageSizeSel = `<select onchange="window._regPageSize=Number(this.value);window._regPage=0;renderMeasurementsModule();" style="font-size:12px;padding:3px 6px;border:1px solid var(--color-border-tertiary);border-radius:6px;">
      <option value="50"  ${pageSize === 50  ? 'selected' : ''}>50 / stronę</option>
      <option value="100" ${pageSize === 100 ? 'selected' : ''}>100 / stronę</option>
    </select>`;

  const paginationHtml = indexed.length === 0 ? '' : `
    <div style="display:flex;align-items:center;gap:8px;margin-top:10px;font-size:12px;flex-wrap:wrap;">
      ${navBtn('« Pierwsza', 0, page === 0)}
      ${navBtn('‹ Poprzednia', 'Math.max(0,window._regPage-1)', page === 0)}
      <span style="color:var(--color-text-secondary);display:inline-flex;align-items:center;gap:4px;">Strona
        <input type="number" min="1" max="${totalPages}" value="${page + 1}" style="width:56px;font-size:12px;padding:3px 6px;text-align:center;border:1px solid var(--color-border-tertiary);border-radius:6px;"
          onchange="var p=Math.min(${totalPages},Math.max(1,Number(this.value)||1));window._regPage=p-1;renderMeasurementsModule();" />
        / ${totalPages}</span>
      ${navBtn('Następna ›', 'Math.min(' + (totalPages - 1) + ',window._regPage+1)', page === totalPages - 1)}
      ${navBtn('Ostatnia »', totalPages - 1, page === totalPages - 1)}
      <span style="color:var(--color-text-tertiary);">· ${indexed.length} wierszy${removedCount ? ` · usunięte: ${removedCount}` : ''}</span>
      <span style="margin-left:auto;">${pageSizeSel}</span>
    </div>`;

  const restoreBar = removedCount ? `<button class="small-button" onclick="regRestoreAll(${objectId})" style="font-size:11px;color:#1E7B34;border-color:#1E7B34;">♻ Przywróć usunięte (${removedCount})</button>` : '';

  return `
  <div style="border:1px solid #B5D4F4;border-radius:10px;overflow:hidden;margin-top:24px;">
    <div style="background:#E6F1FB;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;">📡</span>
        <h3 style="margin:0;font-size:14px;font-weight:600;color:#0C447C;">Dane z czujników — dane czasowe</h3>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        ${restoreBar}
        <label style="font-size:12px;color:#0C447C;background:#fff;border:1px solid #B5D4F4;border-radius:6px;padding:5px 12px;cursor:pointer;font-weight:500;">
          📂 Importuj CSV/Excel
          <input type="file" accept=".csv,.xlsx,.xls" style="display:none;" onchange="importRegressionSensorFile(this, ${objectId})" />
        </label>
        <button class="small-button" onclick="clearRegressionSensorData(${objectId})" style="font-size:11px;${window._regClearArm == objectId ? 'color:#fff;background:#c00;border-color:#c00;font-weight:700;' : 'color:#c00;border-color:#c00;'}" ${rawRows.length === 0 ? 'disabled' : ''}>${window._regClearArm == objectId ? '⚠️ Kliknij ponownie, aby usunąć WSZYSTKO' : '🗑 Wyczyść wszystko'}</button>
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
          <label style="font-size:10px;color:var(--color-text-secondary);display:block;margin-bottom:2px;">Przepływ [dm³/h]</label>
          <input id="reg-vFlow" type="number" step="1" placeholder="np. 3827" style="width:100%;font-size:12px;box-sizing:border-box;" />
        </div>
        <div>
          <label style="font-size:10px;color:var(--color-text-secondary);display:block;margin-bottom:2px;">Moc dostarczona [W]</label>
          <input id="reg-heatPower" type="number" step="0.01" placeholder="np. 46012" style="width:100%;font-size:12px;box-sizing:border-box;" />
        </div>
        <div>
          <label style="font-size:10px;color:var(--color-text-secondary);display:block;margin-bottom:2px;">Zużycie ciepła [MJ]</label>
          <input id="reg-heatConsumption" type="number" step="0.01" placeholder="np. 28263" style="width:100%;font-size:12px;box-sizing:border-box;" />
        </div>
        <div style="display:flex;align-items:flex-end;">
          <button class="primary-button" onclick="addRegressionSensorRow(${objectId})" style="font-size:12px;padding:6px 14px;white-space:nowrap;">+ Dodaj</button>
        </div>
      </div>
    </div>

    <!-- Tabela danych -->
    <div style="padding:12px 16px;background:var(--color-background-primary);">
      ${indexed.length === 0 ? `
        <div style="text-align:center;padding:28px;color:var(--color-text-secondary);font-size:13px;">
          <div style="font-size:32px;margin-bottom:8px;">📊</div>
          ${removedCount ? `Wszystkie odczyty usunięte. <a href="#" onclick="regRestoreAll(${objectId});return false;" style="color:#1E7B34;">♻ Przywróć usunięte (${removedCount})</a>` : 'Brak danych. Dodaj wiersze ręcznie lub zaimportuj plik CSV/Excel.'}
          <div style="font-size:11px;margin-top:8px;color:var(--color-text-tertiary);">
            Wymagane kolumny: <code>readTime, tOutdoor, tSupply, tReturn, vFlow, heatPower, heatConsumption</code>
          </div>
        </div>` : `
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:12px;min-width:780px;">
            <thead>
              <tr style="background:var(--color-background-secondary);">
                ${th('readTime', 'Data odczytu', 'left')}
                ${th('tOutdoor', 'T zewn. [°C]', 'right')}
                ${th('tSupply', 'T zasil. [°C]', 'right')}
                ${th('tReturn', 'T powrotu [°C]', 'right')}
                ${th('vFlow', 'Przepływ [dm³/h]', 'right')}
                ${th('heatPower', 'Moc dostarczona [W]', 'right')}
                ${th('heatConsumption', 'Zużycie ciepła [MJ]', 'right')}
                <th title="Faktyczne zużycie = różnica wskazań licznika między kolejnymi odczytami" style="padding:6px 8px;text-align:right;font-size:10px;font-weight:600;border-bottom:1px solid var(--color-border-tertiary);color:#185FA5;white-space:nowrap;">Δ [MJ]</th>
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

  const rows = RegressionBaseModule.getRows(objectId);
  rows.push({
    readTime: readTime || null,
    tOutdoor: tOutdoor !== '' ? Number(tOutdoor) : null,
    tSupply: tSupply !== '' ? Number(tSupply) : null,
    tReturn: tReturn !== '' ? Number(tReturn) : null,
    vFlow: vFlow !== '' ? Number(vFlow) : null,
    heatPower: heatPower !== '' ? Number(heatPower) : null,
    heatConsumption: heatConsumption !== '' ? Number(heatConsumption) : null,
  });
  RegressionBaseModule.saveRows(objectId, rows);
  window._regPage = Math.floor((rows.length - 1) / (window._regPageSize || 50));
  renderMeasurementsModule();
}

function regToggleSort(key) {
  if (window._regSortKey === key) {
    window._regSortDir = window._regSortDir === 'asc' ? 'desc' : 'asc';
  } else {
    window._regSortKey = key;
    window._regSortDir = 'asc';
  }
  renderMeasurementsModule();
}

function deleteRegressionRow(objectId, index) {
  const rows = RegressionBaseModule.getRows(objectId);
  if (rows[index]) { rows[index].removed = true; RegressionBaseModule.saveRows(objectId, rows); }
  renderMeasurementsModule();
}

function regRestoreAll(pid) {
  const rows = RegressionBaseModule.getRows(pid);
  rows.forEach(r => { delete r.removed; delete r.removedCons; delete r.removedSup; });
  RegressionBaseModule.saveRows(pid, rows);
  renderMeasurementsModule();
}

function regClearAccepted(pid) {
  const rows = RegressionBaseModule.getRows(pid);
  rows.forEach(r => { delete r.accepted; delete r.acceptedCons; delete r.acceptedSup; });
  RegressionBaseModule.saveRows(pid, rows);
  renderMeasurementsModule();
}

function clearRegressionSensorData(objectId) {
  // Dwustopniowe potwierdzenie BEZ natywnego confirm() — działa nawet gdy przeglądarka blokuje okna dialogowe.
  if (window._regClearArm != objectId) {
    window._regClearArm = objectId;
    renderMeasurementsModule();
    try { setTimeout(function () { if (window._regClearArm == objectId) { window._regClearArm = null; renderMeasurementsModule(); } }, 4000); } catch (e) {}
    return;
  }
  window._regClearArm = null;
  RegressionBaseModule.saveRows(objectId, []);
  window._regPage = 0;
  renderMeasurementsModule();
}

function importRegressionSensorFile(input, objectId) {
  const file = input.files[0];
  if (!file) return;
  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'csv') {
    const reader = new FileReader();
    reader.onload = function(e) {
      const text = e.target.result;
      const lines = text.trim().split(/\r?\n/);
      if (lines.length < 2) { alert('Plik CSV jest pusty lub nie zawiera nagłówka.'); return; }

      // Separator: ; lub tab mają priorytet (przy nich przecinek to separator dziesiętny, np. 0,4)
      const delim = lines[0].indexOf(';') >= 0 ? ';' : (lines[0].indexOf('\t') >= 0 ? '\t' : ',');
      const num = s => {
        s = (s || '').trim().replace(/\s/g, '').replace(',', '.');
        return (s !== '' && !isNaN(Number(s))) ? Number(s) : null;
      };
      // Stała kolejność kolumn: readTime, tOutdoor, tSupply, tReturn, vFlow, heatPower, heatConsumption.
      // Mapowanie POZYCYJNE (nie wg nagłówków). Pierwszy wiersz to nagłówek, jeśli poz. tOutdoor nie jest liczbą.
      const firstCells = lines[0].split(delim);
      const hasHeader = firstCells.length > 1 && num(firstCells[1]) === null;
      const startIdx = hasHeader ? 1 : 0;

      const existingRows = RegressionBaseModule.getRows(objectId);
      let added = 0;

      for (let i = startIdx; i < lines.length; i++) {
        const cells = lines[i].split(delim);
        if (cells.length < 2) continue;
        existingRows.push({
          readTime: (cells[0] || '').trim() || null,
          tOutdoor: num(cells[1]), tSupply: num(cells[2]), tReturn: num(cells[3]),
          vFlow: num(cells[4]), heatPower: num(cells[5]), heatConsumption: num(cells[6])
        });
        added++;
      }

      RegressionBaseModule.saveRows(objectId, existingRows);
      window._regPage = Math.floor((existingRows.length - 1) / (window._regPageSize || 50));
      renderMeasurementsModule();
      alert(`Zaimportowano ${added} wierszy z pliku CSV.`);
    };
    reader.readAsText(file);
  } else {
    alert('Import plików Excel (.xlsx) wymaga biblioteki SheetJS — aktualnie wspierany format to CSV. Zapisz plik Excel jako CSV i spróbuj ponownie.');
  }
  input.value = '';
}

// ─── Selekcja danych (przegląd odchyłek) → Wykonaj regresję ───
function regToggleSelection() { window._regSelectionOpen = !window._regSelectionOpen; renderMeasurementsModule(); }
function regRunRegression() { window._regResultsOpen = true; renderMeasurementsModule(); }
// Zapisuje stan regresji do protokołu: zakres okresu bazowego + snapshot wyników (a, b dla 4 wykresów).
// Selekcja danych (flagi removed*) zapisuje się już na bieżąco w wierszach — tu utrwalamy ZAKRES i wyniki,
// oraz oznaczamy okres jako gotowy (po ponownym otwarciu wczyta się zakres i od razu pokażą się wykresy).
function regSaveRegression(pid) {
  const oid = (typeof selectedMeasurementObjectId !== 'undefined') ? selectedMeasurementObjectId : null;
  if (oid == null || !window.RegressionBaseModule) { alert('Brak aktywnego obiektu — otwórz okres bazowy z listy.'); return; }
  // Pobierz zakres z pól (nawet jeśli użytkownik nie kliknął „Zastosuj").
  const fromEl = document.getElementById('reg-base-from'), toEl = document.getElementById('reg-base-to');
  const from = fromEl ? fromEl.value : (window._regBaseFrom || '');
  const to   = toEl   ? toEl.value   : (window._regBaseTo   || '');
  window._regBaseFrom = from; window._regBaseTo = to;
  // Snapshot linii regresji (a, b, n) dla 4 wykresów — w bieżącym zakresie.
  let lines = null;
  try {
    const v = _regViews(pid);
    const line = view => (view && view.fit && view.fit.a != null) ? { a: view.fit.a, b: view.fit.b, n: view.pts ? view.pts.length : null } : null;
    lines = { cons_raw: line(v.cons_raw), cons_binned: line(v.cons_binned), sup_raw: line(v.sup_raw), sup_binned: line(v.sup_binned) };
  } catch (e) { lines = null; }
  const rows = RegressionBaseModule.getRows(pid);
  const removedCount = rows.filter(r => r.removed || r.removedCons || r.removedSup).length;
  RegressionBaseModule.update(oid, Number(pid), {
    periodFrom: from, periodTo: to,
    regressionSaved: true, regressionSavedAt: new Date().toISOString(),
    regressionLines: lines, regressionRemovedCount: removedCount, regressionRowCount: rows.length
  });
  window._regResultsOpen = true;
  renderMeasurementsModule();
  alert('Zapisano regresję.\n\n• Zakres okresu bazowego: ' + ((from || to) ? ((from || '—') + ' → ' + (to || '—')) : 'cały zakres') +
        '\n• Selekcja danych: zapisana (usuniętych: ' + removedCount + ')' +
        '\n• Wyniki a, b: zapisane\n\nPo ponownym otwarciu tego okresu wszystko wczyta się automatycznie.');
}
function regAcceptRow(pid, idx, metricKey) {
  const rows = RegressionBaseModule.getRows(pid);
  if (rows[idx]) { rows[idx][metricKey === 'sup' ? 'acceptedSup' : 'acceptedCons'] = true; RegressionBaseModule.saveRows(pid, rows); }
  renderMeasurementsModule();
}
// Usunięcie odczytu TYLKO z danej metryki (cons/sup) — nie rusza drugiej tabeli ani drugiego wykresu.
function regRemoveMetricRow(pid, idx, metricKey) {
  const rows = RegressionBaseModule.getRows(pid);
  if (rows[idx]) { rows[idx][metricKey === 'sup' ? 'removedSup' : 'removedCons'] = true; RegressionBaseModule.saveRows(pid, rows); }
  renderMeasurementsModule();
}
function _regOutlierList(pid, metricKey) {
  const mo = _regViews(pid).metricOutliers || {};
  const rows = RegressionBaseModule.getRows(pid);
  const rk = metricKey === 'sup' ? 'removedSup' : 'removedCons';
  const ak = metricKey === 'sup' ? 'acceptedSup' : 'acceptedCons';
  return (mo[metricKey] || []).filter(o => {   // lista stabilna; usunięcie/„zostaw" tylko zdejmuje wiersz w TEJ metryce
    const r = rows[o.idx]; if (!r) return false;
    return !r[rk] && !r[ak];
  });
}
function _regOutlierSorted(pid, viewKey) {
  const list = _regOutlierList(pid, viewKey);
  const key = window._regOutSortKey || 'resid';
  const dir = window._regOutSortDir === 'asc' ? 1 : -1;
  return [...list].sort((a, b) => {
    if (key === 'date') return ((_regTs(a.readTime) || 0) - (_regTs(b.readTime) || 0)) * dir;
    return (Math.abs(a.resid) - Math.abs(b.resid)) * dir;
  });
}
function _regOutlierPage(pid, viewKey) {
  const sorted = _regOutlierSorted(pid, viewKey);
  const ps = window._regOutPageSize || 50;
  const totalPages = Math.max(1, Math.ceil(sorted.length / ps));
  let pg = (window._regOutPage && window._regOutPage[viewKey]) || 0;
  if (pg >= totalPages) pg = totalPages - 1; if (pg < 0) pg = 0;
  return { sorted, ps, totalPages, pg, rows: sorted.slice(pg * ps, (pg + 1) * ps), total: sorted.length };
}
function regOutSort(key) {
  if (window._regOutSortKey === key) window._regOutSortDir = window._regOutSortDir === 'asc' ? 'desc' : 'asc';
  else { window._regOutSortKey = key; window._regOutSortDir = key === 'date' ? 'asc' : 'desc'; }
  window._regOutPage = {};
  renderMeasurementsModule();
}
function regOutSetPage(viewKey, p) { window._regOutPage = window._regOutPage || {}; window._regOutPage[viewKey] = p; renderMeasurementsModule(); }
function regOutPageSize(sz) { window._regOutPageSize = Number(sz) || 50; window._regOutPage = {}; renderMeasurementsModule(); }
function regDeleteVisible(pid, viewKey) {
  const { rows } = _regOutlierPage(pid, viewKey);
  if (!rows.length) return;
  const data = RegressionBaseModule.getRows(pid);
  const rk = viewKey === 'sup' ? 'removedSup' : 'removedCons';
  rows.forEach(o => { if (data[o.idx]) data[o.idx][rk] = true; });
  RegressionBaseModule.saveRows(pid, data);
  renderMeasurementsModule();   // odwracalne przez „♻ Przywróć usunięte"
}
function regDeleteAllOutliers(pid, viewKey) {
  const list = _regOutlierList(pid, viewKey);
  if (!list.length) return;
  const data = RegressionBaseModule.getRows(pid);
  const rk = viewKey === 'sup' ? 'removedSup' : 'removedCons';
  list.forEach(o => { if (data[o.idx]) data[o.idx][rk] = true; });
  RegressionBaseModule.saveRows(pid, data);
  renderMeasurementsModule();   // odwracalne przez „♻ Przywróć usunięte"
}
function regAcceptAllOutliers(pid, viewKey) {
  const list = _regOutlierList(pid, viewKey);
  if (!list.length) return;
  const rows = RegressionBaseModule.getRows(pid);
  const ak = viewKey === 'sup' ? 'acceptedSup' : 'acceptedCons';
  list.forEach(o => { if (rows[o.idx]) rows[o.idx][ak] = true; });
  RegressionBaseModule.saveRows(pid, rows);
  renderMeasurementsModule();
}

// Dane bazowe (po filtrze dat i po usunięciu) — surowe punkty dla obu metryk.
function _regBaseData(pid) {
  const rows = RegressionBaseModule.getRows(pid);
  const from = window._regBaseFrom || '', to = window._regBaseTo || '';
  const fromMs = _regBoundMs(from, false), toMs = _regBoundMs(to, true);
  const inRange = idx => {
    const ms = _regTs(rows[idx].readTime);
    if (ms == null) return (!from && !to);
    return ms >= fromMs && ms <= toMs;
  };
  // ALL = baza DETEKCJI odchyłek (ignoruje usunięcia per-metryka → lista stabilna, nic nie „dorzuca").
  // WORK = baza WYKRESÓW/REGRESJI (wyklucza punkty usunięte w danej metryce).
  const supplyPtsAll = [], supplyPtsWork = [];
  rows.forEach((r, idx) => {
    if (r.removed || !inRange(idx) || r.tOutdoor == null || r.tSupply == null) return;
    const p = { idx, x: +r.tOutdoor, y: +r.tSupply, readTime: r.readTime };
    supplyPtsAll.push(p);
    if (!r.removedSup) supplyPtsWork.push(p);
  });
  const chronoOf = excludeMetric => rows.map((r, idx) => ({ r, idx }))
    .filter(o => !o.r.removed && inRange(o.idx) && !(excludeMetric && o.r.removedCons))
    .sort((A, B) => {
      const am = _regTs(A.r.readTime), bm = _regTs(B.r.readTime);
      return (am == null ? 0 : am) - (bm == null ? 0 : bm);
    });
  const consPtsAll  = _consDeltas(chronoOf(false).map(o => Object.assign({}, o.r, { _idx: o.idx })));
  const consPtsWork = _consDeltas(chronoOf(true ).map(o => Object.assign({}, o.r, { _idx: o.idx })));
  return { rows, supplyPtsAll, supplyPtsWork, consPtsAll, consPtsWork };
}

function _regMedian(arr) { if (!arr.length) return 0; const s = [...arr].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }

// Odchyłki: surowe punkty oddalone od linii DANEJ METODY (odporna reguła MAD, centrowana).
function _madOutliers(pts, fit, rows) {
  if (pts.length < 5) return [];
  const res = pts.map(p => p.y - (fit.a * p.x + fit.b));
  const med = _regMedian(res);
  let mad = 1.4826 * _regMedian(res.map(r => Math.abs(r - med)));
  if (!(mad > 1e-9)) mad = fit.rmse;
  const th = 3.5 * mad; if (!(th > 0)) return [];
  return pts.map((p, i) => ({ idx: p.idx, readTime: (rows[p.idx] || {}).readTime, x: p.x, y: p.y, predicted: fit.a * p.x + fit.b, resid: res[i] }))
            .filter(o => Math.abs(o.resid - med) > th)
            .sort((a, b) => Math.abs(b.resid) - Math.abs(a.resid));
}

// 4 widoki do WYKRESÓW: {metryka}×{metoda} (każdy ma własną linię). Odchyłki liczone RAZ na metrykę.
let _regViewsCache = null, _regViewsCacheKey = '';
function _regViews(pid) {
  const rows = RegressionBaseModule.getRows(pid);
  const key = pid + '|' + (window._regBaseFrom || '') + '|' + (window._regBaseTo || '') + '|' + rows.length
    + '|' + rows.filter(r => r.removed).length
    + '|' + rows.filter(r => r.removedCons).length
    + '|' + rows.filter(r => r.removedSup).length;
  if (_regViewsCacheKey === key && _regViewsCache) return _regViewsCache;
  const { supplyPtsAll, supplyPtsWork, consPtsAll, consPtsWork } = _regBaseData(pid);
  const build = (metric, method, pts, binned, meta) => {
    const fit = method === 'raw' ? _olsFit(pts.map(p => ({ x: p.x, y: p.y }))) : binned.fit;
    return Object.assign({ key: metric + '_' + method, metric, method, pts, fit, binPts: binned.bins, nBins: binned.bins.length }, meta);
  };
  // Wykresy/regresja: baza WORK (po usunięciach danej metryki).
  const consBin = _binnedFit(consPtsWork.map(p => ({ x: p.x, y: p.y })));
  const supBin  = _binnedFit(supplyPtsWork.map(p => ({ x: p.x, y: p.y })));
  // Detekcja odchyłek: baza ALL (stabilna — niezależna od usunięć per-metryka). Zły odczyt jest zły niezależnie od metody.
  const consBinAll = _binnedFit(consPtsAll.map(p => ({ x: p.x, y: p.y })));
  const supBinAll  = _binnedFit(supplyPtsAll.map(p => ({ x: p.x, y: p.y })));
  const consDetectFit = consBinAll.fit && consBinAll.fit.n >= 2 ? consBinAll.fit : _olsFit(consPtsAll.map(p => ({ x: p.x, y: p.y })));
  const supDetectFit  = supBinAll.fit  && supBinAll.fit.n  >= 2 ? supBinAll.fit  : _olsFit(supplyPtsAll.map(p => ({ x: p.x, y: p.y })));
  const out = {
    cons_raw:    build('cons', 'raw',    consPtsWork, consBin, { title: 'Zużycie ciepła vs T zewnętrzna', sub: 'Metoda 1 — wszystkie punkty', icon: '📉', accent: '#185FA5', yLabel: 'Zużycie [MJ]' }),
    cons_binned: build('cons', 'binned', consPtsWork, consBin, { title: 'Zużycie ciepła vs T zewnętrzna', sub: 'Metoda 2 — średnie per °C', icon: '📉', accent: '#2E86C1', yLabel: 'Zużycie [MJ]' }),
    sup_raw:     build('sup',  'raw',    supplyPtsWork, supBin, { title: 'Temperatura zasilania vs T zewnętrzna', sub: 'Metoda 1 — wszystkie punkty', icon: '🌡️', accent: '#B9770E', yLabel: 'T zasilania [°C]' }),
    sup_binned:  build('sup',  'binned', supplyPtsWork, supBin, { title: 'Temperatura zasilania vs T zewnętrzna', sub: 'Metoda 2 — średnie per °C', icon: '🌡️', accent: '#E59866', yLabel: 'T zasilania [°C]' }),
    metricOutliers: {
      cons: _madOutliers(consPtsAll, consDetectFit, rows),
      sup:  _madOutliers(supplyPtsAll, supDetectFit, rows)
    },
    metricMeta: {
      cons: { title: 'Zużycie ciepła vs T zewnętrzna', icon: '📉', accent: '#185FA5', yLabel: 'Zużycie [MJ]', n: consPtsWork.length },
      sup:  { title: 'Temperatura zasilania vs T zewnętrzna', icon: '🌡️', accent: '#B9770E', yLabel: 'T zasilania [°C]', n: supplyPtsWork.length }
    }
  };
  _regViewsCache = out; _regViewsCacheKey = key;
  return out;
}
const _REG_VIEW_KEYS = ['cons_raw', 'cons_binned', 'sup_raw', 'sup_binned'];

function renderRegressionSelection(pid) {
  const f2 = v => Number(v || 0).toLocaleString('pl-PL', { maximumFractionDigits: 2 });
  const f1 = v => Number(v || 0).toLocaleString('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const _selRows = RegressionBaseModule.getRows(pid);
  const accCount = _selRows.filter(r => r.accepted || r.acceptedCons || r.acceptedSup).length;
  const removedCount = _selRows.filter(r => r.removed || r.removedCons || r.removedSup).length;
  const resOpen = !!window._regResultsOpen;
  const _proto = (typeof selectedMeasurementObjectId !== 'undefined' && window.RegressionBaseModule) ? RegressionBaseModule.find(selectedMeasurementObjectId, pid) : null;
  const savedHint = (_proto && _proto.regressionSavedAt)
    ? `<span style="font-size:11px;color:#1E7B34;">✓ Zapisano: ${new Date(_proto.regressionSavedAt).toLocaleString('pl-PL')}</span>`
    : `<span style="font-size:11px;color:#B9770E;">⚠ Niezapisane — kliknij „Zapisz regresję", aby zachować zakres i wyniki.</span>`;
  const from = window._regBaseFrom || '', to = window._regBaseTo || '';
  window._regOutSortKey = window._regOutSortKey || 'resid';
  window._regOutSortDir = window._regOutSortDir || 'desc';
  window._regOutPageSize = window._regOutPageSize || 50;
  const sortKey = window._regOutSortKey, sortDir = window._regOutSortDir;
  const accBar = accCount ? ` · <button class="small-button" onclick="regClearAccepted(${pid})" style="font-size:11px;padding:1px 8px;">↩ Przywróć zostawione (${accCount})</button>` : '';
  const remBar = removedCount ? ` · <button class="small-button" onclick="regRestoreAll(${pid})" style="font-size:11px;padding:1px 8px;color:#1E7B34;border-color:#1E7B34;">♻ Przywróć usunięte (${removedCount})</button>` : '';
  const sa = key => sortKey === key ? (sortDir === 'desc' ? ' ▼' : ' ▲') : ' ⇅';
  const views = _regViews(pid);

  const table = (metricKey) => {
    const v = views.metricMeta[metricKey];
    const { rows: pageRows, total, totalPages, pg, ps } = _regOutlierPage(pid, metricKey);
    const head = `${v.icon} ${escapeHtml(v.title)}`;
    if (!total) {
      return `<div style="border:1px solid #BFE3C8;background:#F0F9F2;border-radius:10px;padding:11px 14px;margin-bottom:12px;">
        <div style="font-size:13px;color:#1E7B34;">${head}: ✅ brak odchyłek (${v.n} pkt).</div></div>`;
    }
    const rowsHtml = pageRows.map(o => `<tr style="border-bottom:0.5px solid var(--color-border-tertiary);background:#FDECEC;">
        <td style="padding:6px 10px;font-size:12px;">${escapeHtml(String(o.readTime || '—'))}</td>
        <td style="padding:6px 10px;font-size:12px;text-align:right;">${f1(o.x)}</td>
        <td style="padding:6px 10px;font-size:12px;text-align:right;">${f2(o.y)}</td>
        <td style="padding:6px 10px;font-size:12px;text-align:right;color:#888;">${f2(o.predicted)}</td>
        <td style="padding:6px 10px;font-size:12px;text-align:right;color:#c00;font-weight:600;">${f2(o.resid)}</td>
        <td style="padding:6px 10px;text-align:right;white-space:nowrap;">
          <button class="small-button" onclick="regRemoveMetricRow(${pid}, ${o.idx}, '${metricKey}')" style="font-size:11px;color:#c00;border-color:#c00;">✕ Usuń</button>
          <button class="small-button" onclick="regAcceptRow(${pid}, ${o.idx}, '${metricKey}')" style="font-size:11px;color:#1E7B34;border-color:#1E7B34;">Zostaw</button>
        </td>
      </tr>`).join('');
    const navBtn = (label, page, disabled) => `<button class="small-button" ${disabled ? 'disabled' : `onclick="regOutSetPage('${metricKey}', ${page})"`} style="font-size:11px;padding:2px 7px;${disabled ? 'opacity:.4;' : ''}">${label}</button>`;
    const pageSizeSel = `<select onchange="regOutPageSize(this.value)" style="font-size:11px;padding:2px 4px;">
        <option value="50" ${ps === 50 ? 'selected' : ''}>50</option>
        <option value="100" ${ps === 100 ? 'selected' : ''}>100</option>
      </select>`;
    const pagination = `<div style="display:flex;align-items:center;gap:6px;padding:8px 12px;font-size:12px;flex-wrap:wrap;background:var(--color-background-primary);border-top:1px solid var(--color-border-tertiary);">
        ${navBtn('« Pierwsza', 0, pg === 0)}
        ${navBtn('‹ Poprzednia', Math.max(0, pg - 1), pg === 0)}
        <span style="color:var(--color-text-secondary);">Strona ${pg + 1} / ${totalPages}</span>
        ${navBtn('Następna ›', Math.min(totalPages - 1, pg + 1), pg === totalPages - 1)}
        ${navBtn('Ostatnia »', totalPages - 1, pg === totalPages - 1)}
        <span style="color:var(--color-text-tertiary);">· ${total} odchyłek</span>
        <span style="margin-left:auto;display:inline-flex;align-items:center;gap:5px;">na stronę ${pageSizeSel}</span>
      </div>`;
    return `<div style="border:1px solid ${v.accent};border-radius:10px;overflow:hidden;margin-bottom:12px;">
      <div style="background:${v.accent}1f;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
        <div style="font-size:13px;font-weight:600;">${head} — <span style="color:#c00;">${total}</span> odchyłek</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="small-button" onclick="regDeleteVisible(${pid},'${metricKey}')" style="font-size:11px;color:#c00;border-color:#c00;">✕ Usuń widoczne (${pageRows.length})</button>
          <button class="small-button" onclick="regDeleteAllOutliers(${pid},'${metricKey}')" style="font-size:11px;color:#c00;border-color:#c00;">✕ Usuń wszystkie (${total})</button>
          <button class="small-button" onclick="regAcceptAllOutliers(${pid},'${metricKey}')" style="font-size:11px;color:#1E7B34;border-color:#1E7B34;">Zostaw wszystkie</button>
        </div>
      </div>
      <div style="overflow-x:auto;background:var(--color-background-primary);">
        <table style="width:100%;border-collapse:collapse;min-width:560px;">
          <thead><tr style="background:var(--color-background-secondary);">
            <th onclick="regOutSort('date')" title="Sortuj po dacie odczytu" style="padding:6px 10px;text-align:left;font-size:10px;font-weight:600;color:#0C447C;cursor:pointer;user-select:none;white-space:nowrap;">Odczyt${sa('date')}</th>
            <th style="padding:6px 10px;text-align:right;font-size:10px;font-weight:600;color:var(--color-text-secondary);">T zewn. [°C]</th>
            <th style="padding:6px 10px;text-align:right;font-size:10px;font-weight:600;color:var(--color-text-secondary);">${v.yLabel}</th>
            <th style="padding:6px 10px;text-align:right;font-size:10px;font-weight:600;color:var(--color-text-secondary);">prognoza</th>
            <th onclick="regOutSort('resid')" title="Sortuj po wielkości odchyłki" style="padding:6px 10px;text-align:right;font-size:10px;font-weight:600;color:#0C447C;cursor:pointer;user-select:none;white-space:nowrap;">Odchyłka${sa('resid')}</th>
            <th style="padding:6px 10px;"></th>
          </tr></thead><tbody>${rowsHtml}</tbody>
        </table>
      </div>
      ${pagination}
    </div>`;
  };

  const headBar = `<div style="font-size:12px;color:var(--color-text-secondary);margin-bottom:10px;">Odchyłki = błędne/odstające odczyty (odporna detekcja MAD względem stabilnego trendu). Lista liczona <strong>raz na pełnych danych</strong> — usunięcie odczytu tylko zdejmuje go z tej listy, <strong>nie dorzuca nowych</strong>. Usuwasz <strong>niezależnie</strong> w każdej metryce (Zużycie / Temperatura zasilania) — nie wpływa to na drugą tabelę ani jej wykresy. Kliknij „Odczyt" lub „Odchyłka", aby sortować ↑/↓.${accBar}${remBar}</div>`;
  const allTables = ['cons', 'sup'].map(table).join('');

  // ── Zakres dat i godzin (od–do) — z podpowiedzią dostępnego zakresu ──
  const allMs = RegressionBaseModule.getRows(pid).map(r => _regTs(r.readTime)).filter(x => x != null);
  const minMs = allMs.length ? Math.min.apply(null, allMs) : null;
  const maxMs = allMs.length ? Math.max.apply(null, allMs) : null;
  const toInp = ms => { const d = new Date(ms), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };
  const minInp = minMs != null ? toInp(minMs) : '', maxInp = maxMs != null ? toInp(maxMs) : '';
  const rangeHint = minMs != null ? `Dostępny zakres danych: <strong>${new Date(minMs).toLocaleString('pl-PL')}</strong> – <strong>${new Date(maxMs).toLocaleString('pl-PL')}</strong>` : 'Brak odczytów z parsowalną datą.';
  const minMaxAttr = '';   // BEZ min/max — przeglądarka nie „dociąga" ręcznie wpisywanych dat do zakresu
  const dateBlock = `<div style="background:var(--color-background-secondary);border:1px solid var(--color-border-tertiary);border-radius:10px;padding:12px 16px;margin-bottom:12px;">
      <div style="font-size:11px;font-weight:600;color:#0C447C;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px;">📅 Zakres okresu bazowego (data i godzina)</div>
      <div style="font-size:11px;color:var(--color-text-secondary);margin-bottom:8px;">${rangeHint}</div>
      <div style="display:flex;align-items:flex-end;gap:8px;flex-wrap:wrap;font-size:12px;">
        <div><label style="display:block;font-size:10px;color:var(--color-text-secondary);">Od</label><input type="datetime-local" id="reg-base-from" value="${from}" ${minMaxAttr} style="font-size:12px;"></div>
        <div><label style="display:block;font-size:10px;color:var(--color-text-secondary);">Do</label><input type="datetime-local" id="reg-base-to" value="${to}" ${minMaxAttr} style="font-size:12px;"></div>
        <button class="small-button" onclick="window._regBaseFrom=document.getElementById('reg-base-from').value;window._regBaseTo=document.getElementById('reg-base-to').value;window._regOutPage={};renderMeasurementsModule();" style="font-size:12px;">Zastosuj</button>
        ${minInp ? `<button class="small-button" onclick="window._regBaseFrom='${minInp}';window._regBaseTo='${maxInp}';window._regOutPage={};renderMeasurementsModule();" style="font-size:12px;">Cały zakres</button>` : ''}
        ${(from || to) ? `<button class="small-button" onclick="window._regBaseFrom='';window._regBaseTo='';window._regOutPage={};renderMeasurementsModule();" style="font-size:12px;color:#c00;border-color:#c00;">Wyczyść</button>` : ''}
      </div>
    </div>`;

  const runBlock = `<div style="margin-bottom:8px;">
      <button class="primary-button" onclick="regRunRegression()" style="font-size:14px;padding:9px 20px;">▶ Wykonaj regresję (4 wykresy)</button>
    </div>`;

  const saveBlock = `<div style="margin-top:22px;padding-top:14px;border-top:1px solid var(--color-border-tertiary);display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
      <button class="small-button" onclick="regSaveRegression(${pid})" style="font-size:14px;padding:10px 22px;color:#fff;background:#1E7B34;border-color:#1E7B34;font-weight:600;">💾 Zapisz regresję</button>
      ${savedHint}
    </div>`;

  return headBar + allTables + dateBlock + runBlock + (resOpen ? renderRegressionBaselineCurves(pid) + _regBaseSweep(pid) : '') + saveBlock;
}

// ── Zakres temperatur okresu bazowego: tabela + wykresy linii bazowej (PRZED) ──
function _regSweepChartSvg(title, rows, key, yLabel, color) {
  const xs = rows.map(r => r.t), ys = rows.map(r => r[key]).filter(v => v != null);
  if (!ys.length) return '';
  const xmin = Math.min.apply(null, xs), xmax = Math.max.apply(null, xs);
  let ymin = Math.min.apply(null, ys), ymax = Math.max.apply(null, ys);
  if (ymin === ymax) { ymin -= 1; ymax += 1; }
  const padY = (ymax - ymin) * 0.08; ymin -= padY; ymax += padY;
  const W = 560, H = 260, L = 66, R = 18, T = 28, Bm = 50;
  const xspan = (xmax - xmin) || 1, yspan = (ymax - ymin) || 1;
  const px = t => L + (t - xmin) / xspan * (W - L - R);
  const py = val => T + (1 - (val - ymin) / yspan) * (H - T - Bm);
  const poly = rows.filter(r => r[key] != null).map(r => `${px(r.t).toFixed(1)},${py(r[key]).toFixed(1)}`).join(' ');
  let grid = '';
  for (let i = 0; i <= 4; i++) { const val = ymin + yspan * i / 4, y = py(val);
    grid += `<line x1="${L}" y1="${y.toFixed(1)}" x2="${W - R}" y2="${y.toFixed(1)}" stroke="#e6eaef"/><text x="${L - 6}" y="${(y + 3).toFixed(1)}" text-anchor="end" font-size="9" fill="#7a8794">${val.toFixed(1)}</text>`; }
  let xlab = ''; const xstep = xspan > 30 ? 10 : (xspan > 12 ? 5 : (xspan > 4 ? 2 : 1));
  for (let t = Math.ceil(xmin / xstep) * xstep; t <= xmax + 1e-9; t += xstep) { const x = px(t);
    xlab += `<line x1="${x.toFixed(1)}" y1="${H - Bm}" x2="${x.toFixed(1)}" y2="${H - Bm + 4}" stroke="#9aa5b1"/><text x="${x.toFixed(1)}" y="${H - Bm + 16}" text-anchor="middle" font-size="9" fill="#7a8794">${t}</text>`; }
  const cx = (L + (W - R)) / 2, cy = (T + (H - Bm)) / 2;
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;height:auto;background:#fff;border:1px solid var(--color-border-tertiary);border-radius:8px;">
    <text x="${L}" y="16" font-size="12" font-weight="600" fill="#0C447C">${title}</text>
    ${grid}${xlab}
    <line x1="${L}" y1="${T}" x2="${L}" y2="${H - Bm}" stroke="#9aa5b1"/>
    <line x1="${L}" y1="${H - Bm}" x2="${W - R}" y2="${H - Bm}" stroke="#9aa5b1"/>
    <polyline points="${poly}" fill="none" stroke="${color}" stroke-width="2.5"/>
    <text x="${cx.toFixed(0)}" y="${H - 20}" text-anchor="middle" font-size="11" font-weight="600" fill="#5b6670">Temperatura zewnętrzna [°C]</text>
    <text x="16" y="${cy.toFixed(0)}" text-anchor="middle" font-size="11" font-weight="600" fill="#5b6670" transform="rotate(-90 16 ${cy.toFixed(0)})">${yLabel}</text>
  </svg>`;
}

function regSetSweep(field, val) {
  if (field === 'method') { window._regSweepMethod = (val === 'binned') ? 'binned' : 'raw'; }
  else {
    const n = Number(String(val).replace(',', '.'));
    if (field === 'step') window._regSweepStep = (isFinite(n) && n > 0) ? n : 1;
    else if (field === 'from') window._regSweepFrom = isFinite(n) ? n : -15;
    else if (field === 'to') window._regSweepTo = isFinite(n) ? n : 10;
  }
  renderMeasurementsModule();
}

function _regBaseSweep(pid) {
  if (typeof _regViews !== 'function') return '';
  let T0 = Number(window._regSweepFrom); if (!isFinite(T0)) T0 = -15;
  let T1 = Number(window._regSweepTo);   if (!isFinite(T1)) T1 = 10;
  let step = Number(window._regSweepStep); if (!isFinite(step) || step <= 0) step = 1;
  const method = (window._regSweepMethod === 'binned') ? 'binned' : 'raw';
  let v = null; try { v = _regViews(pid); } catch (e) { v = null; }
  if (!v) return '';
  const consFit = (v[method === 'binned' ? 'cons_binned' : 'cons_raw'] || {}).fit;
  const supFit  = (v[method === 'binned' ? 'sup_binned' : 'sup_raw'] || {}).fit;
  const hasCons = consFit && consFit.a != null, hasSup = supFit && supFit.a != null;
  if (!hasCons && !hasSup) return '';
  let lo = T0, hi = T1; if (hi < lo) { const t = lo; lo = hi; hi = t; }
  if ((hi - lo) / step > 400) step = (hi - lo) / 400;
  const rows = []; let sC = 0, sS = 0, n = 0;
  for (let t = lo; t <= hi + 1e-9; t += step) {
    const tt = Math.round(t * 100) / 100;
    const cz = hasCons ? consFit.a * tt + consFit.b : null;
    const ts = hasSup ? supFit.a * tt + supFit.b : null;
    rows.push({ t: tt, cz, ts });
    if (cz != null) sC += cz; if (ts != null) sS += ts; n++;
  }
  const avgC = n ? sC / n : 0, avgS = n ? sS / n : 0;
  const m1 = method === 'raw', m2 = method === 'binned';
  const tabBtn = (active, on, label) => `<button class="small-button" onclick="regSetSweep('method','${on}')" style="font-size:12px;${active ? 'background:#E6F1FB;border-color:#185FA5;font-weight:600;' : ''}">${label}</button>`;
  const f2 = x => x == null ? '—' : Number(x).toFixed(2);
  const f1 = x => x == null ? '—' : Number(x).toFixed(1);
  const td = 'padding:3px 8px;font-size:11px;border-bottom:0.5px solid var(--color-border-tertiary);text-align:right;';
  const th = 'padding:5px 8px;font-size:11px;font-weight:600;color:#0C447C;text-align:right;border-bottom:1px solid var(--color-border-tertiary);';
  const body = rows.map(r => `<tr>
      <td style="${td}text-align:center;">${r.t}</td>
      <td style="${td}">${f2(r.cz)}</td>
      <td style="${td}">${f1(r.ts)}</td></tr>`).join('');
  const charts = `<div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:10px;">
      ${hasCons ? `<div style="flex:1;min-width:300px;">${_regSweepChartSvg('📉 Zużycie ciepła — okres bazowy', rows, 'cz', 'Zużycie ciepła [MJ]', '#9aa5b1')}</div>` : ''}
      ${hasSup ? `<div style="flex:1;min-width:300px;">${_regSweepChartSvg('🌡️ Temp. zasilania — okres bazowy', rows, 'ts', 'T zasilania [°C]', '#9aa5b1')}</div>` : ''}
    </div>`;
  return `<div style="border:1px solid var(--color-border-tertiary);border-radius:10px;padding:14px 16px;margin-top:18px;background:var(--color-background-primary);">
      <div style="font-size:13px;font-weight:700;color:#0C447C;margin-bottom:6px;">🌡️ Zakres temperatur — tabela i wykresy okresu bazowego</div>
      <div style="font-size:11px;color:var(--color-text-secondary);margin-bottom:10px;">Tabela i wykresy budują się dla wybranego zakresu T zewnętrznej. Domyślnie −15…+10°C, krok 1°C — dostosuj wedle potrzeby. Wartości to przewidywania linii bazowej (PRZED) y = a·t + b oraz ich średnie.</div>
      <div style="display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap;margin-bottom:6px;">
        <div><label style="display:block;font-size:10px;color:var(--color-text-secondary);">Od [°C]</label><input type="number" step="1" value="${T0}" onchange="regSetSweep('from',this.value)" style="font-size:12px;width:90px;"></div>
        <div><label style="display:block;font-size:10px;color:var(--color-text-secondary);">Do [°C]</label><input type="number" step="1" value="${T1}" onchange="regSetSweep('to',this.value)" style="font-size:12px;width:90px;"></div>
        <div><label style="display:block;font-size:10px;color:var(--color-text-secondary);">Krok [°C]</label><input type="number" step="0.5" min="0.1" value="${step}" onchange="regSetSweep('step',this.value)" style="font-size:12px;width:90px;"></div>
        <div style="display:flex;gap:6px;">${tabBtn(m1, 'raw', 'Metoda 1')}${tabBtn(m2, 'binned', 'Metoda 2')}</div>
      </div>
      ${charts}
      <details open style="margin-top:10px;"><summary style="cursor:pointer;font-size:12px;color:#0C447C;font-weight:600;">Tabela zbiorcza okresu bazowego (${lo}…${hi}°C)</summary>
        <table style="width:100%;border-collapse:collapse;margin-top:6px;">
          <thead><tr>
            <th style="${th}text-align:center;">T zewn. [°C]</th>
            <th style="${th}">Zużycie ciepła [MJ]</th>
            <th style="${th}">T zasilania [°C]</th></tr></thead>
          <tbody>${body}</tbody>
          <tfoot><tr style="background:var(--color-background-secondary);font-weight:700;">
            <td style="${td}text-align:center;">Średnia</td>
            <td style="${td}">${hasCons ? avgC.toFixed(2) : '—'}</td>
            <td style="${td}">${hasSup ? avgS.toFixed(1) : '—'}</td></tr></tfoot>
        </table></details>
    </div>`;
}

function _regWorkflowHtml(pid) {
  const rowsN = RegressionBaseModule.getRows(pid).length;
  if (rowsN < 2) return '';
  const selOpen = !!window._regSelectionOpen;
  const bar = `<div style="margin:18px 0 8px;">
      <button class="${selOpen ? 'primary-button' : 'small-button'}" onclick="regToggleSelection()" style="font-size:13px;">🔍 Selekcja danych${selOpen ? ' ✕' : ''}</button>
    </div>`;
  return bar + (selOpen ? renderRegressionSelection(pid) : '');
}

function renderRegressionTab(protocols) {
  const regressionProtocols = protocols.filter(p => p.includeLinearRegression);

  // Sekcja protokołów regresji (lista / formularz / aktywny protokół) renderowana w return na dole.

  const _regResultsHtml = regressionProtocols.map(p => {
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
  }).join("");
  const selectorsHtml = (typeof _bpSelectors === 'function') ? _bpSelectors() : '';
  const objId = selectedMeasurementObjectId;
  let mainHtml;
  if (!objId) {
    mainHtml = `<div class="reminder-card">Wybierz obiekt, aby zarządzać okresami bazowymi regresji.</div>`;
  } else if (window._regProtoForm && Number(window._regProtoForm.objectId) === Number(objId)) {
    mainHtml = _regProtocolFormHtml(objId);
  } else if (window._regActiveProtocolId && RegressionBaseModule.find(objId, window._regActiveProtocolId)) {
    mainHtml = _regProtocolActiveHtml(objId, window._regActiveProtocolId);
  } else {
    window._regActiveProtocolId = null;
    mainHtml = _regProtocolListHtml(objId);
  }
  return selectorsHtml + mainHtml + _regResultsHtml;
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
      const hdd = (base - avgTemp) * days;
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

// ─────────────────────────────────────────────────────────────────────────
// Krzywe bazowe regresji liczone WPROST z danych z czujników
// (waterai_regression_sensors_<objectId>). Dwie krzywe jak we wzorcu Excel:
//   • zużycie ciepła (Δ heatConsumption między odczytami) vs T zewnętrzna
//   • temperatura zasilania (tSupply, odczyt chwilowy) vs T zewnętrzna
// Filtr od–do zawęża TYLKO wejście regresji (niedestrukcyjnie).
// ─────────────────────────────────────────────────────────────────────────
function _olsFit(pts) {
  const n = pts.length;
  if (n < 2) return { a: 0, b: 0, r2: 0, n, rmse: 0 };
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const xm = xs.reduce((s, v) => s + v, 0) / n;
  const ym = ys.reduce((s, v) => s + v, 0) / n;
  const sxy = xs.reduce((s, x, i) => s + (x - xm) * (ys[i] - ym), 0);
  const sxx = xs.reduce((s, x) => s + (x - xm) ** 2, 0);
  const a = sxx !== 0 ? sxy / sxx : 0;
  const b = ym - a * xm;
  const ssRes = ys.reduce((s, y, i) => s + (y - (a * xs[i] + b)) ** 2, 0);
  const ssTot = ys.reduce((s, y) => s + (y - ym) ** 2, 0);
  const r2 = ssTot !== 0 ? 1 - ssRes / ssTot : 0;
  const rmse = Math.sqrt(ssRes / n);
  return { a, b, r2, n, rmse };
}

function _regParseTime(rt) {
  return _regTs(rt);
}

// Wersja 2 regresji: dopasowanie do ŚREDNICH wartości Y per zaokrąglony stopień T zewnętrznej (jak trend w Excelu).
function _binnedFit(pts) {
  if (!pts || !pts.length) return { fit: { a: 0, b: 0, r2: 0, n: 0, rmse: 0 }, bins: [] };
  const m = {};
  pts.forEach(p => { const k = Math.round(p.x); (m[k] = m[k] || []).push(p.y); });
  const bins = Object.keys(m).map(Number).sort((a, b) => a - b)
    .map(k => ({ x: k, y: m[k].reduce((s, v) => s + v, 0) / m[k].length, count: m[k].length }));
  return { fit: _olsFit(bins.map(b => ({ x: b.x, y: b.y }))), bins };
}

// Przyrost zużycia między KOLEJNYMI odczytami licznika — dokładnie jak kolumna AC w arkuszu
// PREMIUM: AC(n) = AB(n) − AB(n−1), sparowane z T zewnętrzną BIEŻĄCEGO wiersza (W(n)).
// y = sam przyrost [MJ na interwał]; BEZ dzielenia przez czas, BEZ pomijania zerowych ani ujemnych
// przyrostów (Excel ich nie pomija). Pomijamy tylko puste komórki — wtedy łańcuch licznika się nie
// zmienia (jak puste AB w Excelu). Dzięki temu regresja zużycia jest 1:1 z trendem z Excela.
// rows: wiersze w kolejności chronologicznej. Zwraca [{x:tOutdoor, y:Δ, readTime, idx}].
function _consDeltas(rows) {
  const out = [];
  let lastHc = null;
  for (const r of rows) {
    const hc = Number(r.heatConsumption);
    if (r.heatConsumption == null || !isFinite(hc)) continue;   // brak wskazania licznika — łańcucha nie ruszamy
    if (lastHc !== null) {
      const tout = Number(r.tOutdoor);
      if (r.tOutdoor != null && isFinite(tout)) {
        out.push({ x: tout, y: hc - lastHc, readTime: r.readTime, idx: r._idx });
      }
    }
    lastHc = hc;                                       // kotwica = wskazanie poprzedniego wiersza (AB(n−1))
  }
  return out;
}

function _baselineCard4(view, chartId) {
  const pts = view.pts, fit = view.fit;
  if (pts.length < 2) {
    return `<div class="reminder-card" style="border-left:4px solid ${view.accent};margin-bottom:0;">
      <strong>${view.icon} ${escapeHtml(view.title)}</strong>
      <div class="reminder-meta">${escapeHtml(view.sub)} — za mało punktów (min. 2). Poszerz zakres dat.</div></div>`;
  }
  const f4 = v => Number(v || 0).toFixed(4);
  const f3 = v => Number(v || 0).toFixed(3);
  const corr = r2 => r2 >= 0.9 ? '✅' : r2 >= 0.6 ? '🟡' : '🔴';
  const nLabel = view.method === 'binned' ? `${view.nBins} średnich (z ${pts.length} pkt)` : `n=${fit.n}`;
  return `
  <div style="border:1px solid ${view.accent};border-radius:10px;overflow:hidden;">
    <div style="padding:10px 14px;background:${view.accent}1f;">
      <div style="font-size:14px;font-weight:600;">${view.icon} ${escapeHtml(view.title)}</div>
      <div style="font-size:12px;color:var(--color-text-secondary);margin:2px 0 6px;">${escapeHtml(view.sub)}</div>
      <div style="font-size:15px;font-weight:700;color:${view.accent};">y = ${f4(fit.a)}·x + ${f4(fit.b)}<br><span style="font-size:13px;font-weight:600;">R² = ${f3(fit.r2)} ${corr(fit.r2)} · ${nLabel}</span></div>
    </div>
    <div style="padding:10px 12px;background:var(--color-background-primary);">
      <canvas id="${chartId}" width="600" height="320" style="max-width:100%;border:1px solid ${view.accent};border-radius:8px;background:#fff;display:block;"></canvas>
    </div>
  </div>`;
}

function renderRegressionBaselineCurves(objectId) {
  if (!objectId) return '';
  if (RegressionBaseModule.getRows(objectId).length < 2) return '';
  const views = _regViews(objectId);
  const from = window._regBaseFrom || '', to = window._regBaseTo || '';
  const subsample = arr => (arr.length > 1500) ? arr.filter((_, i) => i % Math.ceil(arr.length / 1500) === 0) : arr;

  const cards = [], drawCalls = [];
  _REG_VIEW_KEYS.forEach(k => {
    const v = views[k];
    const chartId = 'reg-chart-' + k + '-' + objectId;
    cards.push(_baselineCard4(v, chartId));
    if (v.pts.length >= 2) {
      const plot = subsample(v.pts.map(p => ({ x: p.x, y: p.y })));
      const binPts = v.method === 'binned' ? v.binPts.map(b => ({ x: b.x, y: b.y })) : [];
      const yLabel = v.metric === 'cons' ? 'Δ zużycie ciepła [MJ]' : 'Temperatura zasilania [°C]';
      const methodLabel = v.method === 'raw' ? 'Metoda 1: wszystkie punkty (OLS)' : 'Metoda 2: średnie per °C';
      drawCalls.push(`draw(${JSON.stringify(chartId)}, ${JSON.stringify(plot)}, ${JSON.stringify(binPts)}, ${v.fit.a}, ${v.fit.b}, ${JSON.stringify(v.accent)}, 'Temperatura zewnętrzna [°C]', ${JSON.stringify(yLabel)}, ${JSON.stringify(methodLabel)});`);
    }
  });

  const drawScript = `
  (function(){
    function draw(id, pts, binPts, a, b, color, xLabel, yLabel, methodLabel){
      const c=document.getElementById(id); if(!c) return;
      const ctx=c.getContext('2d'); const W=c.width,H=c.height;
      if(!pts.length) return;
      const xs=pts.map(p=>p.x), ys=pts.map(p=>p.y);
      let xMin=Math.min.apply(null,xs), xMax=Math.max.apply(null,xs);
      if(xMin===xMax){xMin-=1;xMax+=1;}
      let yMin=Math.min(Math.min.apply(null,ys), a*xMin+b, a*xMax+b);
      let yMax=Math.max(Math.max.apply(null,ys), a*xMin+b, a*xMax+b);
      if(binPts&&binPts.length){const by=binPts.map(p=>p.y);yMin=Math.min(yMin,Math.min.apply(null,by));yMax=Math.max(yMax,Math.max.apply(null,by));}
      if(yMin===yMax){yMin-=1;yMax+=1;}
      const pad={l:64,r:16,t:28,b:48};
      const sX=x=>pad.l+(x-xMin)/(xMax-xMin)*(W-pad.l-pad.r);
      const sY=y=>H-pad.b-(y-yMin)/(yMax-yMin)*(H-pad.t-pad.b);
      ctx.clearRect(0,0,W,H);
      ctx.strokeStyle='#e8e8e8';ctx.lineWidth=0.5;
      for(let i=0;i<=4;i++){const y=yMin+i*(yMax-yMin)/4;ctx.beginPath();ctx.moveTo(pad.l,sY(y));ctx.lineTo(W-pad.r,sY(y));ctx.stroke();ctx.fillStyle='#777';ctx.font='10px sans-serif';ctx.textAlign='right';ctx.fillText(y.toFixed(1),pad.l-5,sY(y)+3);}
      for(let i=0;i<=5;i++){const x=xMin+i*(xMax-xMin)/5;ctx.beginPath();ctx.moveTo(sX(x),pad.t);ctx.lineTo(sX(x),H-pad.b);ctx.stroke();ctx.fillStyle='#777';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText(x.toFixed(1),sX(x),H-pad.b+14);}
      ctx.fillStyle='#333';ctx.font='bold 11px sans-serif';ctx.textAlign='center';
      ctx.fillText(xLabel, pad.l+(W-pad.l-pad.r)/2, H-8);
      ctx.save();ctx.translate(14, pad.t+(H-pad.t-pad.b)/2);ctx.rotate(-Math.PI/2);ctx.fillText(yLabel,0,0);ctx.restore();
      ctx.globalAlpha=0.35;ctx.fillStyle=color;
      pts.forEach(pt=>{ctx.beginPath();ctx.arc(sX(pt.x),sY(pt.y),2.4,0,2*Math.PI);ctx.fill();});
      ctx.globalAlpha=1;
      if(binPts&&binPts.length){ctx.fillStyle='#111';binPts.forEach(pt=>{ctx.beginPath();ctx.arc(sX(pt.x),sY(pt.y),3.4,0,2*Math.PI);ctx.fill();});}
      ctx.strokeStyle=color;ctx.lineWidth=2.6;ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(sX(xMin),sY(a*xMin+b));ctx.lineTo(sX(xMax),sY(a*xMax+b));ctx.stroke();
      ctx.font='10px sans-serif';ctx.textAlign='left';
      ctx.strokeStyle=color;ctx.lineWidth=2.6;ctx.beginPath();ctx.moveTo(pad.l+2,pad.t-14);ctx.lineTo(pad.l+22,pad.t-14);ctx.stroke();
      ctx.fillStyle='#333';ctx.fillText(methodLabel,pad.l+26,pad.t-11);
      if(binPts&&binPts.length){ctx.fillStyle='#111';ctx.beginPath();ctx.arc(pad.l+10,pad.t-1,3.2,0,2*Math.PI);ctx.fill();ctx.fillStyle='#333';ctx.fillText('punkty = średnie per °C',pad.l+26,pad.t+2);}
    }
    ${drawCalls.join('\n    ')}
  })();`;

  return `
  <div style="margin-top:18px;">
    <h3 style="margin:0 0 10px;font-size:15px;font-weight:600;color:#0C447C;">📐 Wynik regresji — 4 wykresy (2 metryki × 2 metody)</h3>
    <div class="reminder-meta" style="font-size:11px;color:var(--color-text-secondary);margin-bottom:12px;">
      <strong>Metoda 1</strong> — regresja przez wszystkie punkty (klasyczny OLS). <strong>Metoda 2</strong> — regresja przez średnie wartości per stopień T zewnętrznej (jak linia trendu w Excelu; czarne kropki = średnie). Zużycie = przyrost licznika <code>heatConsumption</code> między odczytami${(from || to) ? ' (po filtrze dat)' : ''}.
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:14px;">
      ${cards.join('')}
    </div>
  </div>
  <script>(function(){ setTimeout(function(){ ${drawScript} }, 90); })();<\/script>`;
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
    const protoNum  = item.protocolNumber
      || ((clientNum && objNum) ? ('K' + clientNum + '-' + objNum + '-' + String(Math.max(0, MeasurementsModule.findByObjectChrono(item.objectId).findIndex(p => Number(p.id) === Number(item.id))) + 1).padStart(3, '0')) : '—');
    const clientLabel = (clientNum ? 'K'+clientNum+' — ' : '') + escapeHtml(getClientName(item.clientId));
    const objLabel    = (clientNum && objNum ? 'K'+clientNum+'-'+objNum+' — ' : '') + escapeHtml(getObjectName(item.objectId));
    const periodFrom  = item.comparisonPeriodStartDate || item.billingPeriodStartDate || '—';
    const periodTo    = item.comparisonPeriodEndDate   || item.billingPeriodEndDate   || '—';
    const period      = periodFrom !== '—' ? periodFrom + ' → ' + periodTo : '—';

    return `<tr style="border-bottom:1px solid var(--color-border-tertiary);">
      <td style="padding:10px 12px;font-size:13px;font-weight:600;white-space:nowrap;">${escapeHtml(protoNum)}</td>
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


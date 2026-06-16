// WaterAI Energy Control — Rozszerzenie modułów v2.0.0
// Ten plik jest ładowany PO app.js i DODAJE nowe moduły.
// Nie nadpisuje istniejących funkcji.

// ═══════════════════════════════════════════════════════════════════════════════
// POMOCNICZE
// ═══════════════════════════════════════════════════════════════════════════════

function fmtDate(d) {
  if (!d) return '—';
  const parts = String(d).split('-');
  if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
  return d;
}

function fmtMoney(v, cur) {
  return Number(v || 0).toFixed(2) + ' ' + (cur || 'PLN');
}

function statusBadge(label, color, bg) {
  return `<span style="font-size:11px;font-weight:600;padding:2px 9px;border-radius:20px;background:${bg};color:${color};">${label}</span>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODUŁ DOKUMENTÓW
// ═══════════════════════════════════════════════════════════════════════════════

function renderDocumentsModule(clientId, objectId) {
  const container = document.getElementById('module-content');
  if (!container) return;

  const clients = ClientsModule.getAll();
  const filterClientId = clientId || (clients[0] ? clients[0].id : null);

  if (!filterClientId) {
    container.innerHTML = `<div class="reminder-card"><strong>Brak klientów</strong><div class="reminder-meta">Najpierw dodaj klienta.</div></div>`;
    return;
  }

  const client = ClientsModule.find(filterClientId);
  const objects = ObjectsModule.findByClient(filterClientId);
  const allDocs = objectId
    ? DocumentsModule.findByObject(objectId)
    : DocumentsModule.findByClient(filterClientId);

  const grouped = {};
  allDocs.forEach(d => {
    const cat = DocumentsModule.CATEGORIES[d.category];
    const group = cat ? cat.group : 'Inne';
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(d);
  });

  const catOptions = Object.entries(DocumentsModule.CATEGORIES)
    .map(([k, v]) => `<option value="${k}">${v.icon} ${v.label}</option>`)
    .join('');

  const objectOptions = objects
    .map(o => `<option value="${o.id}">${escapeHtml(o.name)}</option>`)
    .join('');

  const clientOptions = clients
    .map(c => `<option value="${c.id}" ${Number(c.id) === Number(filterClientId) ? 'selected' : ''}>${escapeHtml(c.name)}</option>`)
    .join('');

  const groupsHtml = Object.entries(grouped).map(([groupName, docs]) => `
    <div style="margin-bottom:20px;">
      <div style="font-size:12px;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--color-border-tertiary);">
        ${groupName} (${docs.length})
      </div>
      <div style="display:grid;gap:8px;">
        ${docs.map(d => {
          const cat = DocumentsModule.CATEGORIES[d.category];
          const icon = cat ? cat.icon : '📁';
          const objName = d.objectId ? (ObjectsModule.find(d.objectId) || {}).name || '—' : 'Klient ogólnie';
          return `
          <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;border:1px solid var(--color-border-tertiary);border-radius:10px;background:var(--color-background-secondary);">
            <span style="font-size:22px;flex-shrink:0;">${icon}</span>
            <div style="flex:1;min-width:0;">
              <div style="font-size:13px;font-weight:500;color:var(--color-text-primary);">${escapeHtml(d.name)}</div>
              <div style="font-size:11px;color:var(--color-text-secondary);margin-top:2px;">
                ${fmtDate(d.documentDate)} · ${escapeHtml(objName)}
                ${d.tags && d.tags.length ? ' · ' + d.tags.map(t => `<span style="background:#eee;padding:1px 5px;border-radius:4px;">${escapeHtml(t)}</span>`).join(' ') : ''}
              </div>
              ${d.description ? `<div style="font-size:11px;color:var(--color-text-secondary);margin-top:2px;">${escapeHtml(d.description)}</div>` : ''}
            </div>
            <div style="display:flex;gap:6px;flex-shrink:0;">
              ${d.fileUrl ? `<button class="small-button" onclick="window.open('${escapeHtml(d.fileUrl)}','_blank')">⬇ Pobierz</button>` : ''}
              <button class="small-button" onclick="if(confirm('Usuń dokument?')){DocumentsModule.remove(${d.id});renderDocumentsModule(${filterClientId},${objectId||'null'});}">🗑</button>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <style>
      .doc-search { display:flex;gap:8px;align-items:center;margin-bottom:16px; }
      .doc-search input { flex:1;padding:8px 12px;border:1px solid var(--color-border-tertiary);border-radius:8px;font-size:13px; }
    </style>

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;">
      <div>
        <h3 style="margin:0;font-size:16px;font-weight:600;">🗂️ Dokumenty</h3>
        <div style="font-size:12px;color:var(--color-text-secondary);margin-top:2px;">
          ${escapeHtml(client ? client.name : '')}
          ${objectId && ObjectsModule.find(objectId) ? ' / ' + escapeHtml(ObjectsModule.find(objectId).name) : ''}
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <select onchange="renderDocumentsModule(this.value,null)" style="padding:6px 10px;border:1px solid var(--color-border-tertiary);border-radius:8px;font-size:13px;">
          ${clientOptions}
        </select>
        <button class="primary-button" style="font-size:13px;padding:8px 16px;" onclick="document.getElementById('doc-form-area').style.display='block';">
          + Dodaj dokument
        </button>
      </div>
    </div>

    <!-- WYSZUKIWARKA -->
    <div class="doc-search">
      <input id="doc-search-input" placeholder="🔍 Szukaj dokumentów..." oninput="searchDocuments(${filterClientId}, this.value)" />
    </div>

    <!-- FORMULARZ DODAWANIA -->
    <div id="doc-form-area" style="display:none;border:1px solid var(--color-border-tertiary);border-radius:14px;padding:20px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h4 style="margin:0;font-size:15px;color:#0C447C;">Nowy dokument</h4>
        <button class="small-button" onclick="document.getElementById('doc-form-area').style.display='none'">✕</button>
      </div>
      <div class="calendar-form">
        <div>
          <label>Nazwa dokumentu</label>
          <input id="doc-name" required placeholder="np. Faktura za ciepło 01/2026" />
        </div>
        <div>
          <label>Kategoria</label>
          <select id="doc-category">${catOptions}</select>
        </div>
        <div>
          <label>Obiekt (opcjonalnie)</label>
          <select id="doc-object">
            <option value="">— Dokument klienta —</option>
            ${objectOptions}
          </select>
        </div>
        <div>
          <label>Data dokumentu</label>
          <input id="doc-date" type="date" />
        </div>
        <div style="grid-column:1/-1;">
          <label>Opis</label>
          <input id="doc-description" placeholder="opcjonalny opis" />
        </div>
        <div style="grid-column:1/-1;">
          <label>Tagi (oddzielone przecinkami)</label>
          <input id="doc-tags" placeholder="np. faktura, styczeń, ciepło" />
        </div>
        <div style="grid-column:1/-1;">
          <label>Plik (URL lub ścieżka)</label>
          <input id="doc-fileurl" placeholder="https://... lub ścieżka do pliku" />
        </div>
        <div style="grid-column:1/-1;">
          <button class="primary-button" type="button" onclick="saveDocument(${filterClientId})" style="width:auto;padding:10px 24px;margin:0;">Zapisz dokument</button>
        </div>
      </div>
    </div>

    <!-- LISTA DOKUMENTÓW -->
    <div id="doc-list-area">
      ${allDocs.length === 0
        ? `<div class="reminder-card"><strong>Brak dokumentów</strong><div class="reminder-meta">Dodaj pierwszy dokument klikając "Dodaj dokument".</div></div>`
        : groupsHtml
      }
    </div>
  `;
}

function saveDocument(clientId) {
  const name = document.getElementById('doc-name').value.trim();
  if (!name) { alert('Podaj nazwę dokumentu.'); return; }

  const tagsRaw = document.getElementById('doc-tags').value;
  const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);

  DocumentsModule.add({
    clientId,
    objectId: document.getElementById('doc-object').value || null,
    name,
    category: document.getElementById('doc-category').value,
    documentDate: document.getElementById('doc-date').value,
    description: document.getElementById('doc-description').value.trim(),
    tags,
    fileUrl: document.getElementById('doc-fileurl').value.trim(),
    fileName: document.getElementById('doc-fileurl').value.trim().split('/').pop() || name
  });

  renderDocumentsModule(clientId);
}

function searchDocuments(clientId, query) {
  const area = document.getElementById('doc-list-area');
  if (!area) return;

  if (!query.trim()) {
    renderDocumentsModule(clientId);
    return;
  }

  const results = DocumentsModule.search(query, clientId);
  if (results.length === 0) {
    area.innerHTML = `<div class="reminder-card"><strong>Brak wyników</strong><div class="reminder-meta">Nie znaleziono dokumentów dla frazy: "${escapeHtml(query)}"</div></div>`;
    return;
  }

  area.innerHTML = results.map(d => {
    const cat = DocumentsModule.CATEGORIES[d.category];
    const icon = cat ? cat.icon : '📁';
    return `<div style="display:flex;align-items:center;gap:12px;padding:10px 14px;border:1px solid var(--color-border-tertiary);border-radius:10px;margin-bottom:8px;">
      <span style="font-size:22px;">${icon}</span>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:500;">${escapeHtml(d.name)}</div>
        <div style="font-size:11px;color:var(--color-text-secondary);">${fmtDate(d.documentDate)} · ${cat ? cat.label : ''}</div>
      </div>
      ${d.fileUrl ? `<button class="small-button" onclick="window.open('${escapeHtml(d.fileUrl)}','_blank')">⬇</button>` : ''}
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODUŁ FAKTUROWANIA
// ═══════════════════════════════════════════════════════════════════════════════

function renderInvoicingModule() {
  const container = document.getElementById('module-content');
  if (!container) return;

  const clients = ClientsModule.getAll();
  const allInvoices = InvoicingModule.getAll();
  const dash = InvoicingModule.getDashboard();

  const q = (window._invSearch || '').toLowerCase();
  const sort = window._invSort || 'date_desc';

  let invoices = allInvoices.filter(inv => !q ||
    (inv.invoiceNumber||'').toLowerCase().includes(q) ||
    ((ClientsModule.find(inv.clientId)||{}).name||'').toLowerCase().includes(q) ||
    ((inv.objectId && (ObjectsModule.find(inv.objectId)||{}).name)||'').toLowerCase().includes(q) ||
    (inv.status||'').toLowerCase().includes(q)
  );
  invoices = [...invoices].sort((a,b) => {
    if (sort === 'date_desc') return (b.issueDate||'').localeCompare(a.issueDate||'');
    if (sort === 'date_asc')  return (a.issueDate||'').localeCompare(b.issueDate||'');
    if (sort === 'due_asc')   return (a.dueDate||'').localeCompare(b.dueDate||'');
    if (sort === 'due_desc')  return (b.dueDate||'').localeCompare(a.dueDate||'');
    if (sort === 'client_asc') return ((ClientsModule.find(a.clientId)||{}).name||'').localeCompare((ClientsModule.find(b.clientId)||{}).name||'');
    if (sort === 'amount_desc') return (b.grossAmount||0) - (a.grossAmount||0);
    return 0;
  });

  const thS = (col, label, align) => {
    const next = sort === col+'_asc' ? col+'_desc' : col+'_asc';
    const arrow = sort === col+'_asc' ? ' ↑' : sort === col+'_desc' ? ' ↓' : '';
    return `<th style="padding:8px 12px;text-align:${align||'left'};font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);cursor:pointer;white-space:nowrap;"
      onclick="window._invSort='${next}';renderInvoicingModule();">${label}${arrow}</th>`;
  };

  const statusHtml = (status) => {
    const s = InvoicingModule.STATUSES[status] || { label: status, color: '#666', bg: '#eee' };
    return statusBadge(s.label, s.color, s.bg);
  };

  const clientOptions = clients.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');

  const invoiceRows = invoices.map(inv => {
    const client = ClientsModule.find(inv.clientId);
    const obj = inv.objectId ? ObjectsModule.find(inv.objectId) : null;
    return `<tr style="border-bottom:1px solid var(--color-border-tertiary);">
      <td style="padding:9px 12px;font-size:13px;font-weight:500;">${escapeHtml(inv.invoiceNumber)}</td>
      <td style="padding:9px 12px;font-size:13px;">${escapeHtml(client ? client.name : '—')}</td>
      <td style="padding:9px 12px;font-size:13px;">${escapeHtml(obj ? obj.name : '—')}</td>
      <td style="padding:9px 12px;font-size:13px;">${fmtDate(inv.issueDate)}</td>
      <td style="padding:9px 12px;font-size:13px;">${fmtDate(inv.dueDate)}</td>
      <td style="padding:9px 12px;font-size:13px;text-align:right;font-weight:600;">${fmtMoney(inv.grossAmount, inv.currency)}</td>
      <td style="padding:9px 12px;">${statusHtml(inv.status)}</td>
      <td style="padding:9px 12px;white-space:nowrap;">
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          ${inv.status !== 'PAID' ? `<button class="small-button" onclick="markInvoicePaid(${inv.id})" style="background:#27500A;color:#fff;border-color:#27500A;">✓ Opłacona</button>` : ''}
          <button class="small-button" onclick="if(confirm('Usuń fakturę?')){InvoicingModule.remove(${inv.id});renderInvoicingModule();}">🗑</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">
      <div style="padding:16px;border-radius:12px;background:#E6F1FB;border:1px solid #B5D4F4;text-align:center;">
        <div style="font-size:11px;color:#0C447C;font-weight:600;margin-bottom:4px;">WYSTAWIONE</div>
        <div style="font-size:20px;font-weight:700;color:#0C447C;">${fmtMoney(dash.totalIssued)}</div>
      </div>
      <div style="padding:16px;border-radius:12px;background:#EAF3DE;border:1px solid #C0DD97;text-align:center;">
        <div style="font-size:11px;color:#27500A;font-weight:600;margin-bottom:4px;">OPŁACONE</div>
        <div style="font-size:20px;font-weight:700;color:#27500A;">${fmtMoney(dash.totalPaid)}</div>
      </div>
      <div style="padding:16px;border-radius:12px;background:#FEE;border:1px solid #fcc;text-align:center;">
        <div style="font-size:11px;color:#c00;font-weight:600;margin-bottom:4px;">ZALEGŁE (${dash.countOverdue})</div>
        <div style="font-size:20px;font-weight:700;color:#c00;">${fmtMoney(dash.totalOverdue)}</div>
      </div>
      <div style="padding:16px;border-radius:12px;background:#FEF3DC;border:1px solid #F4D4A0;text-align:center;">
        <div style="font-size:11px;color:#7A4A00;font-weight:600;margin-bottom:4px;">PROJEKTY</div>
        <div style="font-size:20px;font-weight:700;color:#7A4A00;">${dash.countDraft}</div>
      </div>
    </div>

    <div id="inv-form-area" style="display:none;border:1px solid var(--color-border-tertiary);border-radius:14px;padding:20px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h4 style="margin:0;font-size:15px;color:#0C447C;">Nowa faktura</h4>
        <button class="small-button" onclick="document.getElementById('inv-form-area').style.display='none'">✕</button>
      </div>
      <div class="calendar-form">
        <div><label>Klient</label><select id="inv-client" onchange="updateInvObjects(this.value)">${clientOptions}</select></div>
        <div><label>Obiekt (opcjonalnie)</label><select id="inv-object"><option value="">— ogólnie —</option></select></div>
        <div><label>Typ faktury</label><select id="inv-type">${Object.entries(InvoicingModule.TYPES).map(([k,v]) => `<option value="${k}">${v.icon} ${v.label}</option>`).join('')}</select></div>
        <div><label>Numer faktury</label><input id="inv-number" placeholder="FV/2026/001" /></div>
        <div><label>Data wystawienia</label><input id="inv-issue-date" type="date" value="${new Date().toISOString().slice(0,10)}" /></div>
        <div><label>Termin płatności</label><input id="inv-due-date" type="date" /></div>
        <div><label>Kwota netto</label><input id="inv-net" type="number" step="0.01" min="0" placeholder="0.00" /></div>
        <div><label>VAT (%)</label><select id="inv-vat"><option value="23">23%</option><option value="8">8%</option><option value="0">0%</option></select></div>
        <div><label>Waluta</label><select id="inv-currency"><option value="PLN">PLN</option><option value="EUR">EUR</option><option value="CZK">CZK</option></select></div>
        <div><label>Status</label><select id="inv-status">${Object.entries(InvoicingModule.STATUSES).map(([k,v]) => `<option value="${k}">${v.label}</option>`).join('')}</select></div>
        <div style="grid-column:1/-1;"><label>Uwagi</label><input id="inv-notes" placeholder="opcjonalne uwagi" /></div>
        <div style="grid-column:1/-1;"><button class="primary-button" type="button" onclick="saveInvoice()" style="width:auto;padding:10px 24px;margin:0;">Zapisz fakturę</button></div>
      </div>
    </div>

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:8px;flex-wrap:wrap;">
      <h3 style="margin:0;font-size:15px;font-weight:500;">Faktury (${invoices.length}${q ? ' z '+allInvoices.length : ''})</h3>
      <div style="display:flex;gap:8px;align-items:center;">
        <input type="search" placeholder="Szukaj faktury..." value="${escapeHtml(q)}"
          oninput="window._invSearch=this.value;renderInvoicingModule();"
          style="font-size:13px;padding:6px 10px;border:1px solid var(--color-border-tertiary);border-radius:8px;width:200px;" />
        <button class="primary-button" style="font-size:13px;padding:8px 16px;white-space:nowrap;" onclick="document.getElementById('inv-form-area').style.display='block'">+ Nowa faktura</button>
      </div>
    </div>

    ${invoices.length === 0
      ? `<div class="reminder-card"><strong>${q ? 'Brak wyników' : 'Brak faktur'}</strong><div class="reminder-meta">${q ? 'Spróbuj innej frazy.' : 'Dodaj pierwszą fakturę.'}</div></div>`
      : `<div style="overflow-x:auto;border:1px solid var(--color-border-tertiary);border-radius:10px;">
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead><tr style="background:var(--color-background-secondary);">
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Nr faktury</th>
              ${thS('client','Klient')}
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Obiekt</th>
              ${thS('date','Data wyst.')}
              ${thS('due','Termin płat.')}
              ${thS('amount','Brutto','right')}
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Status</th>
              <th style="padding:8px 12px;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Akcje</th>
            </tr></thead>
            <tbody>${invoiceRows}</tbody>
          </table>
        </div>`
    }
  `;
}

function updateInvObjects(clientId) {
  const sel = document.getElementById('inv-object');
  if (!sel) return;
  const objects = ObjectsModule.findByClient(clientId);
  sel.innerHTML = `<option value="">— ogólnie —</option>` +
    objects.map(o => `<option value="${o.id}">${escapeHtml(o.name)}</option>`).join('');
}

function saveInvoice() {
  const net = parseFloat(document.getElementById('inv-net').value || '0');
  if (!net) { alert('Podaj kwotę netto.'); return; }

  const clientId = document.getElementById('inv-client').value;
  if (!clientId) { alert('Wybierz klienta.'); return; }

  const numberEl = document.getElementById('inv-number');
  const dueDate = document.getElementById('inv-due-date').value;
  const objectId = document.getElementById('inv-object').value || null;

  InvoicingModule.add({
    clientId,
    objectId,
    invoiceNumber: numberEl.value.trim() || undefined,
    invoiceType: document.getElementById('inv-type').value,
    issueDate: document.getElementById('inv-issue-date').value,
    dueDate,
    netAmount: net,
    vatRate: document.getElementById('inv-vat').value,
    currency: document.getElementById('inv-currency').value,
    status: document.getElementById('inv-status').value,
    notes: document.getElementById('inv-notes').value.trim()
  });

  // Sync: create PAYMENT_DUE calendar event for the invoice due date
  if (dueDate) {
    const inv = InvoicingModule.getAll().slice(-1)[0];
    const obj = objectId ? ObjectsModule.find(objectId) : null;
    const clientName = (ClientsModule.find(clientId) || {}).name || '';
    const invNum = numberEl.value.trim() || 'FV';
    CalendarModule.add({
      clientId: Number(clientId),
      objectId: objectId ? Number(objectId) : null,
      title: `Termin płatności ${invNum} — ${clientName}${obj ? ' / ' + obj.name : ''}`,
      description: `Kwota: ${net} netto. Termin płatności: ${dueDate}.`,
      eventType: 'PAYMENT_DUE',
      dueDate,
      reminderDays: [0, 3, 7],
      recurrence: 'ONE_TIME',
      responsibleRole: 'BACK_OFFICE',
      autoGenerated: true,
      linkedInvoiceId: inv ? inv.id : null
    });
  }

  document.getElementById('inv-form-area').style.display = 'none';
  renderInvoicingModule();
}

function markInvoicePaid(id) {
  InvoicingModule.updateStatus(id, 'PAID', InvoicingModule.find(id)?.grossAmount || 0);
  renderInvoicingModule();
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODUŁ KALENDARZA (rozbudowany)
// ═══════════════════════════════════════════════════════════════════════════════

let calendarView = 'month';
let calendarDate = new Date();

function renderCalendarModule() {
  const container = document.getElementById('module-content');
  if (!container) return;

  const summary = CalendarModule.getDashboardSummary();
  const clients = ClientsModule.getAll();

  const todayBadge = summary.today.length > 0
    ? `<span style="display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;border-radius:10px;background:#c00;color:#fff;font-size:11px;font-weight:700;padding:0 5px;margin-left:6px;">${summary.today.length}</span>`
    : '';

  const overdueBadge = summary.overdue.length > 0
    ? `<span style="display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;border-radius:10px;background:#c00;color:#fff;font-size:11px;font-weight:700;padding:0 5px;margin-left:6px;">${summary.overdue.length}</span>`
    : '';

  const clientOptions = clients.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');

  const eventTypeOptions = Object.entries(CalendarModule.EVENT_TYPES)
    .map(([k, v]) => `<option value="${k}">${v.icon} ${v.label}</option>`)
    .join('');

  const recurrenceOptions = Object.entries(CalendarModule.RECURRENCES)
    .map(([k, v]) => `<option value="${k}">${v}</option>`)
    .join('');

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">

      <!-- ZADANIA NA DZIŚ -->
      <div style="border:1px solid #fcc;border-radius:12px;overflow:hidden;">
        <div style="background:#fee;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;">
          <strong style="font-size:13px;color:#c00;">🔴 Zadania na dziś${todayBadge}</strong>
        </div>
        <div style="padding:12px;max-height:180px;overflow-y:auto;">
          ${summary.today.length === 0
            ? `<div style="font-size:13px;color:var(--color-text-secondary);">Brak zadań na dziś. ✓</div>`
            : summary.today.map(e => calEventCard(e, true)).join('')
          }
        </div>
      </div>

      <!-- ZALEGŁE -->
      <div style="border:1px solid #fcc;border-radius:12px;overflow:hidden;">
        <div style="background:#fee;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;">
          <strong style="font-size:13px;color:#c00;">⚠️ Zaległe${overdueBadge}</strong>
        </div>
        <div style="padding:12px;max-height:180px;overflow-y:auto;">
          ${summary.overdue.length === 0
            ? `<div style="font-size:13px;color:var(--color-text-secondary);">Brak zaległych zadań. ✓</div>`
            : summary.overdue.map(e => calEventCard(e, true)).join('')
          }
        </div>
      </div>

      <!-- NADCHODZĄCE 7 DNI -->
      <div style="border:1px solid #B5D4F4;border-radius:12px;overflow:hidden;">
        <div style="background:#E6F1FB;padding:10px 14px;">
          <strong style="font-size:13px;color:#0C447C;">📅 Nadchodzące — 7 dni (${summary.upcoming7.length})</strong>
        </div>
        <div style="padding:12px;max-height:180px;overflow-y:auto;">
          ${summary.upcoming7.length === 0
            ? `<div style="font-size:13px;color:var(--color-text-secondary);">Brak zdarzeń w ciągu 7 dni.</div>`
            : summary.upcoming7.map(e => calEventCard(e, false)).join('')
          }
        </div>
      </div>

      <!-- NADCHODZĄCE 30 DNI -->
      <div style="border:1px solid #B5D4F4;border-radius:12px;overflow:hidden;">
        <div style="background:#E6F1FB;padding:10px 14px;">
          <strong style="font-size:13px;color:#0C447C;">📅 Nadchodzące — 30 dni (${summary.upcoming30.length})</strong>
        </div>
        <div style="padding:12px;max-height:180px;overflow-y:auto;">
          ${summary.upcoming30.length === 0
            ? `<div style="font-size:13px;color:var(--color-text-secondary);">Brak zdarzeń w ciągu 30 dni.</div>`
            : summary.upcoming30.map(e => calEventCard(e, false)).join('')
          }
        </div>
      </div>
    </div>

    <!-- WIDOK KALENDARZA MIESIĘCZNEGO -->
    <div style="border:1px solid var(--color-border-tertiary);border-radius:14px;overflow:hidden;margin-bottom:20px;">
      <div style="background:var(--color-background-secondary);padding:12px 16px;display:flex;justify-content:space-between;align-items:center;">
        <button class="small-button" onclick="calendarPrev()">← Poprzedni</button>
        <strong id="cal-month-label" style="font-size:15px;color:var(--color-text-primary);"></strong>
        <button class="small-button" onclick="calendarNext()">Następny →</button>
      </div>
      <div id="cal-grid" style="padding:16px;"></div>
    </div>

    <!-- FORMULARZ NOWEGO ZDARZENIA -->
    <div id="cal-form-area" style="display:none;border:1px solid var(--color-border-tertiary);border-radius:14px;padding:20px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h4 style="margin:0;font-size:15px;color:#0C447C;">Nowe zdarzenie</h4>
        <button class="small-button" onclick="document.getElementById('cal-form-area').style.display='none'">✕</button>
      </div>
      <div class="calendar-form">
        <div style="grid-column:1/-1;">
          <label>Tytuł zdarzenia</label>
          <input id="cal-title" required placeholder="np. Termin odczytu — Hotel Centrum" />
        </div>
        <div>
          <label>Typ zdarzenia</label>
          <select id="cal-type">${eventTypeOptions}</select>
        </div>
        <div>
          <label>Termin</label>
          <input id="cal-due" type="date" value="${new Date().toISOString().slice(0,10)}" />
        </div>
        <div>
          <label>Klient</label>
          <select id="cal-client" onchange="updateCalObjects(this.value)">
            <option value="">— ogólnie —</option>
            ${clientOptions}
          </select>
        </div>
        <div>
          <label>Obiekt (opcjonalnie)</label>
          <select id="cal-object"><option value="">— ogólnie —</option></select>
        </div>
        <div>
          <label>Cykl</label>
          <select id="cal-recurrence">${recurrenceOptions}</select>
        </div>
        <div>
          <label>Rola odpowiedzialna</label>
          <select id="cal-role">
            <option value="BACK_OFFICE">Back Office</option>
            <option value="ENERGY_ANALYST">Energy Analyst</option>
            <option value="CLIENT">Client</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
        </div>
        <div style="grid-column:1/-1;">
          <label>Opis</label>
          <input id="cal-desc" placeholder="opcjonalny opis" />
        </div>
        <div style="grid-column:1/-1;">
          <button class="primary-button" type="button" onclick="saveCalendarEvent()" style="width:auto;padding:10px 24px;margin:0;">Zapisz zdarzenie</button>
        </div>
      </div>
    </div>

    <button class="primary-button" style="font-size:13px;padding:8px 16px;" onclick="document.getElementById('cal-form-area').style.display='block'">
      + Dodaj zdarzenie
    </button>
  `;

  renderCalendarGrid();
}

function calEventCard(e, showDone) {
  const et = CalendarModule.EVENT_TYPES[e.eventType] || { icon: '🔔', label: e.eventType, color: '#666' };
  const client = e.clientId ? ClientsModule.find(e.clientId) : null;
  const obj = e.objectId ? ObjectsModule.find(e.objectId) : null;

  return `<div style="padding:8px 0;border-bottom:1px solid var(--color-border-tertiary);font-size:13px;">
    <div style="display:flex;align-items:flex-start;gap:6px;">
      <span>${et.icon}</span>
      <div style="flex:1;">
        <div style="font-weight:500;color:var(--color-text-primary);">${escapeHtml(e.title)}</div>
        <div style="font-size:11px;color:var(--color-text-secondary);">
          ${fmtDate(e.dueDate)}
          ${client ? ' · ' + escapeHtml(client.name) : ''}
          ${obj ? ' · ' + escapeHtml(obj.name) : ''}
        </div>
      </div>
      ${showDone ? `<button class="small-button" style="padding:3px 8px;font-size:11px;background:#27500A;color:#fff;border-color:#27500A;" onclick="CalendarModule.markDone(${e.id},'');renderCalendarModule();">✓</button>` : ''}
    </div>
  </div>`;
}

function renderCalendarGrid() {
  const label = document.getElementById('cal-month-label');
  const grid = document.getElementById('cal-grid');
  if (!grid) return;

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth() + 1;
  const monthNames = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
  const dayNames = ['Pon','Wt','Śr','Czw','Pt','Sob','Nie'];

  if (label) label.textContent = `${monthNames[month-1]} ${year}`;

  const events = CalendarModule.getByMonth(year, month);
  const eventsByDay = {};
  events.forEach(e => {
    const day = parseInt(e.dueDate.split('-')[2]);
    if (!eventsByDay[day]) eventsByDay[day] = [];
    eventsByDay[day].push(e);
  });

  const firstDay = new Date(year, month - 1, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

  let html = `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:1px;background:var(--color-border-tertiary);">`;
  dayNames.forEach(d => {
    html += `<div style="padding:6px 4px;text-align:center;font-size:11px;font-weight:600;color:var(--color-text-secondary);background:var(--color-background-secondary);">${d}</div>`;
  });

  let cell = 0;
  for (let i = 0; i < offset; i++) {
    html += `<div style="padding:6px;min-height:56px;background:var(--color-background-primary);opacity:0.3;"></div>`;
    cell++;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const isToday = dateStr === today;
    const dayEvents = eventsByDay[day] || [];

    html += `<div style="padding:6px;min-height:56px;background:var(--color-background-primary);border:${isToday ? '2px solid #185FA5' : 'none'};">
      <div style="font-size:12px;font-weight:${isToday ? '700' : '400'};color:${isToday ? '#185FA5' : 'var(--color-text-secondary)'};">${day}</div>
      ${dayEvents.slice(0, 2).map(e => {
        const et = CalendarModule.EVENT_TYPES[e.eventType] || { icon: '🔔', color: '#666' };
        return `<div style="font-size:10px;padding:1px 4px;border-radius:3px;margin-top:2px;background:${et.color}22;color:${et.color};overflow:hidden;white-space:nowrap;text-overflow:ellipsis;" title="${escapeHtml(e.title)}">
          ${et.icon} ${escapeHtml(e.title).slice(0,16)}
        </div>`;
      }).join('')}
      ${dayEvents.length > 2 ? `<div style="font-size:10px;color:var(--color-text-secondary);margin-top:2px;">+${dayEvents.length-2} więcej</div>` : ''}
    </div>`;
    cell++;
  }

  // fill remaining
  const remaining = 7 - (cell % 7);
  if (remaining < 7) {
    for (let i = 0; i < remaining; i++) {
      html += `<div style="padding:6px;min-height:56px;background:var(--color-background-primary);opacity:0.3;"></div>`;
    }
  }

  html += '</div>';
  grid.innerHTML = html;
}

function calendarPrev() {
  calendarDate.setMonth(calendarDate.getMonth() - 1);
  renderCalendarGrid();
}

function calendarNext() {
  calendarDate.setMonth(calendarDate.getMonth() + 1);
  renderCalendarGrid();
}

function updateCalObjects(clientId) {
  const sel = document.getElementById('cal-object');
  if (!sel) return;
  const objects = clientId ? ObjectsModule.findByClient(clientId) : [];
  sel.innerHTML = `<option value="">— ogólnie —</option>` +
    objects.map(o => `<option value="${o.id}">${escapeHtml(o.name)}</option>`).join('');
}

function saveCalendarEvent() {
  const title = document.getElementById('cal-title').value.trim();
  if (!title) { alert('Podaj tytuł zdarzenia.'); return; }
  const dueDate = document.getElementById('cal-due').value;
  if (!dueDate) { alert('Podaj termin.'); return; }

  CalendarModule.add({
    title,
    eventType: document.getElementById('cal-type').value,
    dueDate,
    clientId: document.getElementById('cal-client').value || null,
    objectId: document.getElementById('cal-object').value || null,
    recurrence: document.getElementById('cal-recurrence').value,
    responsibleRole: document.getElementById('cal-role').value,
    description: document.getElementById('cal-desc').value.trim()
  });

  document.getElementById('cal-form-area').style.display = 'none';
  renderCalendarModule();
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODUŁ ANALIZ
// ═══════════════════════════════════════════════════════════════════════════════

function renderAnalysesModule() {
  const container = document.getElementById('module-content');
  if (!container) return;

  const clients = ClientsModule.getAll();
  const allAnalyses = AnalysesModule.getAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const firstClientId = clients.length ? String(clients[0].id) : '';
  const clientOptions = clients.map((c, i) => `<option value="${c.id}" ${i === 0 ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('');

  const typeOptions = Object.entries(AnalysesModule.TYPES)
    .map(([k, v]) => `<option value="${k}">${v.icon} ${v.label}</option>`)
    .join('');

  const q = (window._analSearch || '').toLowerCase();
  const sort = window._analSort || 'date_desc';

  let filtered = allAnalyses.filter(a => !q ||
    (a.name||'').toLowerCase().includes(q) ||
    ((ClientsModule.find(a.clientId)||{}).name||'').toLowerCase().includes(q) ||
    ((ObjectsModule.find(a.objectId)||{}).name||'').toLowerCase().includes(q) ||
    (a.author||'').toLowerCase().includes(q) ||
    ((AnalysesModule.TYPES[a.analysisType]||{}).label||'').toLowerCase().includes(q)
  );
  filtered = [...filtered].sort((a,b) => {
    if (sort === 'date_desc') return (b.executedAt||'').localeCompare(a.executedAt||'');
    if (sort === 'date_asc')  return (a.executedAt||'').localeCompare(b.executedAt||'');
    if (sort === 'client_asc') return ((ClientsModule.find(a.clientId)||{}).name||'').localeCompare((ClientsModule.find(b.clientId)||{}).name||'');
    if (sort === 'name_asc')  return (a.name||'').localeCompare(b.name||'');
    return 0;
  });

  const thA = (col, label) => {
    const next = sort === col+'_asc' ? col+'_desc' : col+'_asc';
    const arrow = sort === col+'_asc' ? ' ↑' : sort === col+'_desc' ? ' ↓' : '';
    return `<th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);cursor:pointer;white-space:nowrap;"
      onclick="window._analSort='${next}';renderAnalysesModule();">${label}${arrow}</th>`;
  };

  const rows = filtered.map(a => {
    const client = ClientsModule.find(a.clientId);
    const obj = ObjectsModule.find(a.objectId);
    const type = AnalysesModule.TYPES[a.analysisType] || { icon: '🔬', label: a.analysisType };
    const status = AnalysesModule.STATUSES[a.status] || { label: a.status, color: '#666' };
    return `<tr style="border-bottom:1px solid var(--color-border-tertiary);">
      <td style="padding:9px 12px;font-size:13px;font-weight:500;">${escapeHtml(a.name)}</td>
      <td style="padding:9px 12px;font-size:13px;">${type.icon} ${type.label}</td>
      <td style="padding:9px 12px;font-size:13px;">${escapeHtml(client ? client.name : '—')}</td>
      <td style="padding:9px 12px;font-size:13px;">${escapeHtml(obj ? obj.name : '—')}</td>
      <td style="padding:9px 12px;font-size:13px;">${fmtDate(a.executedAt)}</td>
      <td style="padding:9px 12px;">${statusBadge(status.label, status.color, status.color + '22')}</td>
      <td style="padding:9px 12px;font-size:13px;">${escapeHtml(a.author)}</td>
      <td style="padding:9px 12px;white-space:nowrap;">
        <button class="small-button" onclick="if(confirm('Usuń analizę?')){AnalysesModule.remove(${a.id});renderAnalysesModule();}">🗑</button>
      </td>
    </tr>`;
  }).join('');

  container.innerHTML = `
    <!-- FORMULARZ -->
    <div id="anal-form-area" style="display:none;border:1px solid var(--color-border-tertiary);border-radius:14px;padding:20px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h4 style="margin:0;font-size:15px;color:#0C447C;">Nowa analiza</h4>
        <button class="small-button" onclick="document.getElementById('anal-form-area').style.display='none'">✕</button>
      </div>
      <div class="calendar-form">
        <div>
          <label>Klient</label>
          <select id="anal-client" onchange="updateAnalObjects(this.value)">${clientOptions}</select>
        </div>
        <div>
          <label>Obiekt</label>
          <select id="anal-object"><option value="">— wybierz klienta —</option></select>
        </div>
        <div style="grid-column:1/-1;">
          <label>Nazwa analizy</label>
          <input id="anal-name" required placeholder="np. Analiza TYM — Hotel Centrum Q1 2026" />
        </div>
        <div>
          <label>Typ analizy</label>
          <select id="anal-type">${typeOptions}</select>
        </div>
        <div>
          <label>Data wykonania</label>
          <input id="anal-date" type="date" value="${new Date().toISOString().slice(0,10)}" />
        </div>
        <div>
          <label>Autor</label>
          <input id="anal-author" placeholder="np. Jan Nowak" />
        </div>
        <div>
          <label>Status</label>
          <select id="anal-status">
            ${Object.entries(AnalysesModule.STATUSES).map(([k,v]) => `<option value="${k}">${v.label}</option>`).join('')}
          </select>
        </div>
        <div style="grid-column:1/-1;">
          <label>Komentarze</label>
          <input id="anal-comments" placeholder="opcjonalne komentarze do analizy" />
        </div>
        <div style="grid-column:1/-1;">
          <div style="padding:12px;background:#E6F1FB;border-radius:8px;font-size:13px;color:#0C447C;">
            💡 Wyniki i parametry wejściowe analizy są zapisywane po przeprowadzeniu obliczeń w module Pomiary / Protokół TYM.
            Ta forma pozwala też na ręczne rejestrowanie wyników zewnętrznych analiz.
          </div>
        </div>
        <div style="grid-column:1/-1;">
          <button class="primary-button" type="button" onclick="saveAnalysis()" style="width:auto;padding:10px 24px;margin:0;">Zapisz analizę</button>
        </div>
      </div>
    </div>

    <!-- TABELA -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:8px;flex-wrap:wrap;">
      <h3 style="margin:0;font-size:15px;font-weight:500;">Analizy (${filtered.length}${q ? ' z '+allAnalyses.length : ''})</h3>
      <div style="display:flex;gap:8px;align-items:center;">
        <input type="search" placeholder="Szukaj analizy..." value="${escapeHtml(q)}"
          oninput="window._analSearch=this.value;renderAnalysesModule();"
          style="font-size:13px;padding:6px 10px;border:1px solid var(--color-border-tertiary);border-radius:8px;width:200px;" />
        <button class="primary-button" style="font-size:13px;padding:8px 16px;white-space:nowrap;" onclick="document.getElementById('anal-form-area').style.display='block';updateAnalObjects(document.getElementById('anal-client').value||'${firstClientId}')">
          + Nowa analiza
        </button>
      </div>
    </div>

    ${filtered.length === 0
      ? `<div class="reminder-card"><strong>${q ? 'Brak wyników' : 'Brak analiz'}</strong><div class="reminder-meta">${q ? 'Spróbuj innej frazy.' : 'Dodaj pierwszą analizę klikając „+ Nowa analiza". Na podstawie analiz tworzone są następnie Raporty ESCO.'}</div></div>`
      : `<div style="overflow-x:auto;border:1px solid var(--color-border-tertiary);border-radius:10px;">
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead><tr style="background:var(--color-background-secondary);">
              ${thA('name','Nazwa')}
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Typ</th>
              ${thA('client','Klient')}
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Obiekt</th>
              ${thA('date','Data')}
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Status</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Autor</th>
              <th style="padding:8px 12px;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Akcje</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`
    }
  `;
}

function updateAnalObjects(clientId) {
  const sel = document.getElementById('anal-object');
  if (!sel) return;
  const objects = clientId ? ObjectsModule.findByClient(clientId) : [];
  sel.innerHTML = `<option value="">— wybierz obiekt —</option>` +
    objects.map(o => `<option value="${o.id}">${escapeHtml(o.name)}</option>`).join('');
}

function saveAnalysis() {
  const name = document.getElementById('anal-name').value.trim();
  if (!name) { alert('Podaj nazwę analizy.'); return; }
  const clientId = document.getElementById('anal-client').value;
  const objectId = document.getElementById('anal-object').value;
  if (!clientId || !objectId) { alert('Wybierz klienta i obiekt.'); return; }

  const executedAt = document.getElementById('anal-date').value;
  const analysisType = document.getElementById('anal-type').value;

  AnalysesModule.add({
    clientId, objectId,
    name,
    analysisType,
    executedAt,
    author: document.getElementById('anal-author').value.trim(),
    status: document.getElementById('anal-status').value,
    comments: document.getElementById('anal-comments').value.trim()
  });

  // Sync: mark matching ANALYSIS_DUE calendar event as DONE
  if (executedAt) {
    const autoEvents = CalendarModule.getAll().filter(e =>
      Number(e.objectId) === Number(objectId) &&
      e.eventType === 'ANALYSIS_DUE' &&
      e.status === 'PENDING' &&
      e.dueDate <= executedAt
    );
    autoEvents.forEach(e => CalendarModule.markDone(e.id, 'auto'));
  }

  // Sync: create PROTOCOL_DUE reminder (next step after analysis)
  const obj = ObjectsModule.find(objectId);
  const reminderDays = obj ? Number(obj.reminderDaysBefore || 14) : 14;
  const due = executedAt ? new Date(executedAt) : new Date();
  due.setDate(due.getDate() + reminderDays);
  const clientName = (ClientsModule.find(clientId) || {}).name || '';
  CalendarModule.add({
    clientId: Number(clientId),
    objectId: Number(objectId),
    title: `Termin protokołu — ${(obj || {}).name || 'Obiekt'}${clientName ? ' / ' + clientName : ''}`,
    description: `Automatycznie po dodaniu analizy "${name}".`,
    eventType: 'PROTOCOL_DUE',
    dueDate: due.toISOString().slice(0, 10),
    reminderDays: [0, 7],
    recurrence: 'ONE_TIME',
    responsibleRole: 'BACK_OFFICE',
    autoGenerated: true
  });

  document.getElementById('anal-form-area').style.display = 'none';
  renderAnalysesModule();
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD — rozbudowane podsumowanie
// ═══════════════════════════════════════════════════════════════════════════════

function renderDashboardSummary() {
  const container = document.getElementById('module-content');
  if (!container) return;

  const clients = ClientsModule.getAll();
  const objects = ObjectsModule.getAll();
  const analyses = AnalysesModule.getAll();
  const invoices = InvoicingModule.getAll();
  const documents = DocumentsModule.getAll();
  const calSummary = CalendarModule.getDashboardSummary();
  const dash = InvoicingModule.getDashboard();

  const clientCount = clients.length;
  const objCount = objects.length;
  const invOverdue = dash.countOverdue;
  const calToday = calSummary.today.length;
  const calOverdue = calSummary.overdue.length;

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
      <div style="padding:16px;border-radius:12px;background:#E6F1FB;border:1px solid #B5D4F4;cursor:pointer;" onclick="openModule('clients')">
        <div style="font-size:28px;margin-bottom:6px;">👥</div>
        <div style="font-size:24px;font-weight:700;color:#0C447C;">${clientCount}</div>
        <div style="font-size:12px;color:#0C447C;">Klientów</div>
      </div>
      <div style="padding:16px;border-radius:12px;background:#EAF3DE;border:1px solid #C0DD97;cursor:pointer;" onclick="openModule('objects')">
        <div style="font-size:28px;margin-bottom:6px;">🏢</div>
        <div style="font-size:24px;font-weight:700;color:#27500A;">${objCount}</div>
        <div style="font-size:12px;color:#27500A;">Obiektów</div>
      </div>
      <div style="padding:16px;border-radius:12px;background:${calToday + calOverdue > 0 ? '#fee' : '#f5f5f5'};border:1px solid ${calToday + calOverdue > 0 ? '#fcc' : '#e0e0e0'};cursor:pointer;" onclick="openModule('calendar')">
        <div style="font-size:28px;margin-bottom:6px;">📅</div>
        <div style="font-size:24px;font-weight:700;color:${calToday + calOverdue > 0 ? '#c00' : '#666'};">${calToday + calOverdue}</div>
        <div style="font-size:12px;color:${calToday + calOverdue > 0 ? '#c00' : '#666'};">Wymaga uwagi</div>
      </div>
      <div style="padding:16px;border-radius:12px;background:${invOverdue > 0 ? '#fee' : '#f5f5f5'};border:1px solid ${invOverdue > 0 ? '#fcc' : '#e0e0e0'};cursor:pointer;" onclick="openModule('invoicing')">
        <div style="font-size:28px;margin-bottom:6px;">🧾</div>
        <div style="font-size:24px;font-weight:700;color:${invOverdue > 0 ? '#c00' : '#666'};">${invOverdue}</div>
        <div style="font-size:12px;color:${invOverdue > 0 ? '#c00' : '#666'};">Zaległych FV</div>
      </div>
      <div style="padding:16px;border-radius:12px;background:#f5f5f5;border:1px solid #e0e0e0;cursor:pointer;" onclick="openModule('documents')">
        <div style="font-size:28px;margin-bottom:6px;">🗂️</div>
        <div style="font-size:24px;font-weight:700;color:#666;">${documents.length}</div>
        <div style="font-size:12px;color:#666;">Dokumentów</div>
      </div>
      <div style="padding:16px;border-radius:12px;background:#f5f5f5;border:1px solid #e0e0e0;cursor:pointer;" onclick="openModule('analyses')">
        <div style="font-size:28px;margin-bottom:6px;">📐</div>
        <div style="font-size:24px;font-weight:700;color:#666;">${analyses.length}</div>
        <div style="font-size:12px;color:#666;">Analiz</div>
      </div>
    </div>

    ${calSummary.today.length > 0 ? `
    <div style="border:1px solid #fcc;border-radius:12px;padding:14px;margin-bottom:12px;background:#fee;">
      <strong style="font-size:13px;color:#c00;">🔴 Zadania na dziś (${calSummary.today.length})</strong>
      <div style="margin-top:8px;">
        ${calSummary.today.slice(0, 3).map(e => {
          const et = CalendarModule.EVENT_TYPES[e.eventType] || { icon: '🔔' };
          return `<div style="font-size:13px;padding:4px 0;border-bottom:1px solid #fcc;">${et.icon} ${escapeHtml(e.title)} — <strong>${fmtDate(e.dueDate)}</strong></div>`;
        }).join('')}
        ${calSummary.today.length > 3 ? `<div style="font-size:12px;color:#c00;margin-top:4px;">+${calSummary.today.length - 3} więcej...</div>` : ''}
      </div>
    </div>` : ''}

    ${calSummary.upcoming7.length > 0 ? `
    <div style="border:1px solid #B5D4F4;border-radius:12px;padding:14px;background:#E6F1FB;">
      <strong style="font-size:13px;color:#0C447C;">📅 Nadchodzące terminy — 7 dni (${calSummary.upcoming7.length})</strong>
      <div style="margin-top:8px;">
        ${calSummary.upcoming7.slice(0, 5).map(e => {
          const et = CalendarModule.EVENT_TYPES[e.eventType] || { icon: '🔔' };
          return `<div style="font-size:13px;padding:4px 0;border-bottom:1px solid #B5D4F4;">${et.icon} ${escapeHtml(e.title)} — <strong>${fmtDate(e.dueDate)}</strong></div>`;
        }).join('')}
      </div>
    </div>` : ''}
  `;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK: rozszerzenie openModule() o nowe moduły
// ═══════════════════════════════════════════════════════════════════════════════

const _origOpenModule = window.openModule;
window.openModule = function(moduleName) {
  const newModules = ['documents', 'invoicing', 'analyses', 'dashboard', 'users'];
  if (newModules.includes(moduleName)) {
    const labels = (typeof getModuleLabels === 'function') ? getModuleLabels() : {};
    const item = labels[moduleName];
    if (item) {
      const titleEl = document.getElementById('module-title');
      if (titleEl) titleEl.textContent = item[1];
    }
    const modView = document.getElementById('module-view');
    if (modView) modView.classList.add('active');
    const descEl = document.getElementById('module-description');
    if (descEl) descEl.textContent = '';

    if (moduleName === 'documents') renderDocumentsModule();
    else if (moduleName === 'invoicing') renderInvoicingModule();
    else if (moduleName === 'analyses') renderAnalysesModule();
    else if (moduleName === 'dashboard') renderDashboardSummary();
    else if (moduleName === 'users') renderUsersModule();
    return;
  }

  if (moduleName === 'calendar') {
    const labels = (typeof getModuleLabels === 'function') ? getModuleLabels() : {};
    const item = labels[moduleName];
    if (item) {
      const titleEl = document.getElementById('module-title');
      if (titleEl) titleEl.textContent = item[1];
    }
    const modView = document.getElementById('module-view');
    if (modView) modView.classList.add('active');
    const descEl = document.getElementById('module-description');
    if (descEl) descEl.textContent = '';
    renderCalendarModule();
    return;
  }

  if (_origOpenModule) _origOpenModule(moduleName);
};

// ═══════════════════════════════════════════════════════════════════════════════
// INIT — migracja danych i uruchomienie
// ═══════════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function() {
  if (typeof MigrationModule !== 'undefined') {
    MigrationModule.run();
  }
});

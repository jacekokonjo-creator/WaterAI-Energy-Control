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

function renderDocumentsModule(clientId, _objectId) {
  const container = document.getElementById('module-content');
  if (!container) return;

  const clients = ClientsModule.getAll();
  const filterClientId = clientId ? Number(clientId) : (clients[0] ? Number(clients[0].id) : null);

  if (!filterClientId) {
    container.innerHTML = `<div class="reminder-card"><strong>Brak klientów</strong><div class="reminder-meta">Najpierw dodaj klienta.</div></div>`;
    return;
  }

  const client = ClientsModule.find(filterClientId);
  if (typeof DocFoldersModule !== 'undefined' && client) {
    DocFoldersModule.ensureClientFolder(filterClientId, client.name);
  }

  const clientOptions = clients.map(c =>
    `<option value="${c.id}" ${Number(c.id) === filterClientId ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
  ).join('');
  const catOptions = Object.entries(DocumentsModule.CATEGORIES).map(([k,v]) => `<option value="${k}">${v.icon} ${v.label}</option>`).join('');
  const objects = ObjectsModule.findByClient(filterClientId);
  const objectOptions = objects.map(o => `<option value="${o.id}">${escapeHtml(o.name)}</option>`).join('');

  const tree = (typeof DocFoldersModule !== 'undefined') ? DocFoldersModule.buildTree(filterClientId) : null;

  if (window._docFolderClientId !== filterClientId) {
    window._docFolderClientId = filterClientId;
    window._docSelectedFolderId = tree ? tree.id : null;
  }
  const selectedFolderId = window._docSelectedFolderId !== undefined ? window._docSelectedFolderId : (tree ? tree.id : null);

  const allClientDocs = DocumentsModule.findByClient(filterClientId);

  let folderDocs;
  if (selectedFolderId === null) {
    folderDocs = allClientDocs;
  } else {
    const selFolder = typeof DocFoldersModule !== 'undefined' ? DocFoldersModule.find(selectedFolderId) : null;
    if (selFolder && selFolder.type === 'client' && !selFolder.parentId) {
      folderDocs = allClientDocs.filter(d => Number(d.folderId) === selectedFolderId || (!d.folderId && !d.objectId));
    } else {
      folderDocs = allClientDocs.filter(d => Number(d.folderId) === selectedFolderId);
    }
  }

  const q = (window._docSearch || '').toLowerCase();
  const displayDocs = q ? folderDocs.filter(d =>
    (d.name||'').toLowerCase().includes(q) ||
    ((DocumentsModule.CATEGORIES[d.category]||{}).label||'').toLowerCase().includes(q) ||
    (d.documentDate||'').includes(q)
  ) : folderDocs;

  const countDocsInFolder = (fid) => {
    const f = typeof DocFoldersModule !== 'undefined' ? DocFoldersModule.find(fid) : null;
    if (f && f.type === 'client' && !f.parentId) return allClientDocs.filter(d => Number(d.folderId) === fid || (!d.folderId && !d.objectId)).length;
    return allClientDocs.filter(d => Number(d.folderId) === fid).length;
  };

  const renderNode = (node, depth = 0) => {
    const isSelected = Number(node.id) === Number(selectedFolderId);
    const cnt = countDocsInFolder(node.id);
    const canEdit = node.type === 'custom';
    const pad = depth * 16;
    const children = (node.children || []).map(ch => renderNode(ch, depth + 1)).join('');
    return `<div>
      <div class="doc-tree-node ${isSelected ? 'doc-tree-selected' : ''}" style="padding-left:${12+pad}px;"
        onclick="window._docSelectedFolderId=${node.id};window._docSearch='';renderDocumentsModule(${filterClientId});">
        <span style="font-size:14px;flex-shrink:0;">${node.icon||'📁'}</span>
        <span class="doc-tree-label">${escapeHtml(node.name)}</span>
        <span class="doc-tree-count">${cnt}</span>
        <span class="doc-tree-actions" onclick="event.stopPropagation();">
          <button class="doc-tree-btn" title="Nowy podfolder" onclick="addDocSubfolder(${node.id},${filterClientId})">+</button>
          ${canEdit ? `<button class="doc-tree-btn" title="Zmień nazwę" onclick="renameDocFolder(${node.id},${filterClientId})">✏</button>
          <button class="doc-tree-btn doc-tree-btn-del" title="Usuń" onclick="deleteDocFolder(${node.id},${filterClientId})">✕</button>` : ''}
        </span>
      </div>
      ${children ? `<div>${children}</div>` : ''}
    </div>`;
  };

  const treeHtml = tree ? renderNode(tree) : `<div style="padding:12px;font-size:13px;color:var(--color-text-secondary);">Brak folderów</div>`;
  const selFolderObj = (typeof DocFoldersModule !== 'undefined' && selectedFolderId) ? DocFoldersModule.find(selectedFolderId) : null;
  const selFolderName = selFolderObj ? selFolderObj.name : '—';

  const docRows = displayDocs.map(d => {
    const cat = DocumentsModule.CATEGORIES[d.category];
    const sizeLabel = d.fileSize > 1048576 ? (d.fileSize/1048576).toFixed(1)+' MB' : d.fileSize > 0 ? Math.round(d.fileSize/1024)+' KB' : '';
    const allFolders = typeof DocFoldersModule !== 'undefined' ? DocFoldersModule.findByClient(filterClientId).filter(f => Number(f.id) !== Number(d.folderId)) : [];
    const moveOptions = allFolders.map(f => `<option value="${f.id}">${escapeHtml(f.name)}</option>`).join('');
    return `<tr style="border-bottom:1px solid var(--color-border-tertiary);">
      <td style="padding:9px 12px;font-size:13px;font-weight:500;">${cat?cat.icon:'📄'} ${escapeHtml(d.name)}${sizeLabel?`<span style="font-size:10px;color:var(--color-text-secondary);margin-left:4px;">${sizeLabel}</span>`:''}</td>
      <td style="padding:9px 12px;font-size:12px;color:var(--color-text-secondary);">${cat?cat.label:'—'}</td>
      <td style="padding:9px 12px;font-size:12px;white-space:nowrap;">${fmtDate(d.documentDate)}</td>
      <td style="padding:9px 12px;white-space:nowrap;">
        <div style="display:flex;gap:4px;align-items:center;">
          ${d.fileUrl?`<button class="small-button" onclick="downloadDoc('${d.id}')">Pobierz</button>`:''}
          ${allFolders.length?`<select style="font-size:11px;padding:3px 6px;border-radius:6px;border:1px solid var(--color-border-tertiary);" onchange="moveDocToFolder(${d.id},this.value,${filterClientId});this.value=''"><option value="">Przenieś →</option>${moveOptions}</select>`:''}
          <button class="small-button" onclick="if(confirm('Usuń dokument?')){DocumentsModule.remove(${d.id});renderDocumentsModule(${filterClientId});}" class="icon-btn icon-btn-del" title="Usuń">🗑</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  container.innerHTML = `
    <style>
      .doc-drop-active{border-color:#0C447C!important;background:#E6F1FB!important;}
      .doc-tree-node{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;cursor:pointer;transition:background 0.1s;font-size:13px;color:var(--color-text-primary);}
      .doc-tree-node:hover{background:var(--color-background-secondary);}
      .doc-tree-selected{background:#E6F1FB!important;color:#0C447C;font-weight:500;}
      .doc-tree-label{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .doc-tree-count{font-size:11px;color:var(--color-text-secondary);background:var(--color-background-secondary);padding:1px 7px;border-radius:20px;flex-shrink:0;}
      .doc-tree-selected .doc-tree-count{background:#C8DDF4;color:#0C447C;}
      .doc-tree-actions{display:none;gap:2px;}
      .doc-tree-node:hover .doc-tree-actions,.doc-tree-selected .doc-tree-actions{display:flex;}
      .doc-tree-btn{font-size:11px;padding:1px 5px;border:1px solid var(--color-border-tertiary);border-radius:4px;background:var(--color-background-primary);cursor:pointer;color:var(--color-text-secondary);}
      .doc-tree-btn:hover{background:var(--color-background-secondary);color:var(--color-text-primary);}
      .doc-tree-btn-del:hover{background:#fee;color:#c00;border-color:#c00;}
    </style>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;">
      <h3 style="margin:0;font-size:16px;font-weight:600;">🗂️ Dokumenty</h3>
      <div style="display:flex;gap:8px;align-items:center;">
        <select onchange="window._docSelectedFolderId=null;window._docFolderClientId=null;renderDocumentsModule(this.value);" style="padding:6px 10px;border:1px solid var(--color-border-tertiary);border-radius:8px;font-size:13px;">${clientOptions}</select>
        <button class="primary-button" style="font-size:13px;padding:8px 16px;" onclick="document.getElementById('doc-form-area').style.display='block';">+ Dodaj dokument</button>
      </div>
    </div>
    <div id="doc-form-area" style="display:none;border:1px solid var(--color-border-tertiary);border-radius:14px;padding:20px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h4 style="margin:0;font-size:15px;color:#0C447C;">Nowy dokument</h4>
        <button class="small-button" onclick="document.getElementById('doc-form-area').style.display='none'">✕</button>
      </div>
      <div class="calendar-form">
        <div><label>Nazwa dokumentu</label><input id="doc-name" required placeholder="np. Faktura za ciepło 01/2026" /></div>
        <div><label>Kategoria</label><select id="doc-category">${catOptions}</select></div>
        <div><label>Obiekt (opcjonalnie)</label><select id="doc-object"><option value="">— Dokument klienta —</option>${objectOptions}</select></div>
        <div><label>Data dokumentu</label><input id="doc-date" type="date" /></div>
        <div style="grid-column:1/-1;"><label>Opis</label><input id="doc-description" placeholder="opcjonalny opis" /></div>
        <div style="grid-column:1/-1;"><label>Tagi</label><input id="doc-tags" placeholder="np. faktura, styczeń, ciepło" /></div>
        <div style="grid-column:1/-1;">
          <label>Plik</label>
          <div id="doc-dropzone" ondragover="event.preventDefault();this.classList.add('doc-drop-active');" ondragleave="this.classList.remove('doc-drop-active');" ondrop="handleDocFileDrop(event)" onclick="document.getElementById('doc-file-input').click()" style="border:2px dashed var(--color-border-tertiary);border-radius:10px;padding:24px;text-align:center;cursor:pointer;background:var(--color-background-secondary);">
            <div style="font-size:28px;margin-bottom:6px;">📂</div>
            <div id="doc-drop-label" style="font-size:13px;color:var(--color-text-secondary);">Przeciągnij plik tutaj lub <span style="color:#0C447C;text-decoration:underline;">kliknij aby wybrać</span></div>
            <div id="doc-file-info" style="display:none;margin-top:8px;font-size:12px;color:#27500A;font-weight:500;"></div>
          </div>
          <input id="doc-file-input" type="file" style="display:none;" onchange="handleDocFileSelect(this)" />
          <input id="doc-fileurl" type="hidden" value="" /><input id="doc-filename" type="hidden" value="" /><input id="doc-filesize" type="hidden" value="" /><input id="doc-filetype" type="hidden" value="" />
        </div>
        <div style="grid-column:1/-1;"><button class="primary-button" type="button" onclick="saveDocument(${filterClientId})" style="width:auto;padding:10px 24px;">Zapisz dokument</button></div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:240px 1fr;gap:16px;align-items:start;">
      <div style="border:1px solid var(--color-border-tertiary);border-radius:12px;overflow:hidden;">
        <div style="padding:10px 14px;background:var(--color-background-secondary);font-size:11px;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:.5px;">Foldery</div>
        <div style="padding:8px 4px;">${treeHtml}</div>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:8px;">
          <div style="font-size:13px;font-weight:600;color:#0C447C;">📁 ${escapeHtml(selFolderName)} <span style="font-size:11px;font-weight:400;color:var(--color-text-secondary);">(${displayDocs.length} dok.)</span></div>
          <input type="search" placeholder="Szukaj w folderze..." value="${escapeHtml(window._docSearch||'')}" oninput="window._docSearch=this.value;renderDocumentsModule(${filterClientId});" style="font-size:13px;padding:5px 10px;border:1px solid var(--color-border-tertiary);border-radius:8px;width:180px;" />
        </div>
        ${displayDocs.length === 0 ? `<div class="reminder-card"><strong>Brak dokumentów w tym folderze</strong><div class="reminder-meta">${q?'Spróbuj innej frazy.':'Dodaj dokument lub przenieś tu istniejący.'}</div></div>` : `
        <div style="overflow-x:auto;border:1px solid var(--color-border-tertiary);border-radius:10px;">
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead><tr style="background:var(--color-background-secondary);">
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Nazwa dokumentu</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Kategoria</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Data</th>
              <th style="padding:8px 12px;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Akcje</th>
            </tr></thead>
            <tbody>${docRows}</tbody>
          </table>
        </div>`}
      </div>
    </div>`;
}

function addDocSubfolder(parentFolderId, clientId) {
  const name = prompt('Nazwa nowego folderu:');
  if (!name || !name.trim()) return;
  const newId = DocFoldersModule.add({ clientId: Number(clientId), parentId: Number(parentFolderId), type: 'custom', name: name.trim(), icon: '📁' });
  window._docSelectedFolderId = newId;
  renderDocumentsModule(clientId);
}

function renameDocFolder(folderId, clientId) {
  const folder = DocFoldersModule.find(folderId);
  if (!folder) return;
  const name = prompt('Nowa nazwa folderu:', folder.name);
  if (!name || !name.trim()) return;
  DocFoldersModule.update(folderId, { name: name.trim() });
  renderDocumentsModule(clientId);
}

function deleteDocFolder(folderId, clientId) {
  const cnt = DocumentsModule.findByClient(clientId).filter(d => Number(d.folderId) === Number(folderId)).length;
  if (!confirm(cnt > 0 ? `Usunąć folder i przenieść ${cnt} dokumentów do folderu głównego?` : 'Usunąć pusty folder?')) return;
  if (cnt > 0) {
    const root = DocFoldersModule.getAll().find(f => Number(f.clientId) === Number(clientId) && f.type === 'client' && !f.parentId);
    DocumentsModule.getAll().filter(d => Number(d.folderId) === Number(folderId)).forEach(d => DocumentsModule.update(d.id, { folderId: root ? root.id : null }));
  }
  DocFoldersModule.remove(folderId);
  window._docSelectedFolderId = null;
  renderDocumentsModule(clientId);
}

function moveDocToFolder(docId, targetFolderId, clientId) {
  if (!targetFolderId) return;
  DocumentsModule.update(docId, { folderId: Number(targetFolderId) });
  renderDocumentsModule(clientId);
}


function handleDocFileDrop(event) {
  event.preventDefault();
  const dz = document.getElementById('doc-dropzone');
  if (dz) dz.classList.remove('doc-drop-active');
  const file = event.dataTransfer.files[0];
  if (file) readDocFile(file);
}

function handleDocFileSelect(input) {
  const file = input.files[0];
  if (file) readDocFile(file);
}

function readDocFile(file) {
  const MAX_MB = 5;
  if (file.size > MAX_MB * 1024 * 1024) {
    alert(`Plik jest za duży (max ${MAX_MB} MB). Wybierz mniejszy plik.`);
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('doc-fileurl').value = e.target.result;
    document.getElementById('doc-filename').value = file.name;
    document.getElementById('doc-filesize').value = file.size;
    document.getElementById('doc-filetype').value = file.type;

    const sizeLabel = file.size > 1024 * 1024
      ? (file.size / 1024 / 1024).toFixed(1) + ' MB'
      : (file.size / 1024).toFixed(0) + ' KB';

    const info = document.getElementById('doc-file-info');
    if (info) {
      info.style.display = 'block';
      info.innerHTML = `✅ ${escapeHtml(file.name)} <span style="color:#666;font-weight:400;">(${sizeLabel})</span>`;
    }
    const label = document.getElementById('doc-drop-label');
    if (label) label.style.display = 'none';

    // Auto-fill name if empty
    const nameEl = document.getElementById('doc-name');
    if (nameEl && !nameEl.value.trim()) {
      nameEl.value = file.name.replace(/\.[^/.]+$/, '');
    }
  };
  reader.readAsDataURL(file);
}

function saveDocument(clientId) {
  const name = document.getElementById('doc-name').value.trim();
  if (!name) { alert('Podaj nazwę dokumentu.'); return; }

  const fileUrl  = document.getElementById('doc-fileurl').value;
  const fileName = document.getElementById('doc-filename').value || name;
  const fileSize = Number(document.getElementById('doc-filesize').value || 0);
  const fileType = document.getElementById('doc-filetype').value || '';
  const objectId = document.getElementById('doc-object').value || null;
  const tagsRaw  = document.getElementById('doc-tags').value;
  const tags     = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);

  // Determine folderId
  let folderId = null;
  if (typeof DocFoldersModule !== 'undefined') {
    // Ensure client root exists
    const client = ClientsModule.find(clientId);
    const clientFolderId = DocFoldersModule.ensureClientFolder(clientId, client ? client.name : '');

    if (objectId) {
      // Ensure object folder exists
      const obj = ObjectsModule.find(objectId);
      folderId = DocFoldersModule.ensureObjectFolder(clientId, objectId, obj ? obj.name : 'Obiekt');
    } else {
      // Goes into client root folder
      folderId = clientFolderId;
    }
  }

  DocumentsModule.add({
    clientId,
    objectId,
    folderId,
    name,
    category: document.getElementById('doc-category').value,
    documentDate: document.getElementById('doc-date').value,
    description: document.getElementById('doc-description').value.trim(),
    tags,
    fileUrl,
    fileName,
    fileSize,
    fileType
  });

  renderDocumentsModule(clientId);
}

function downloadDoc(docId) {
  const d = DocumentsModule.find(Number(docId));
  if (!d || !d.fileUrl) return;

  if (d.fileUrl.startsWith('data:')) {
    // base64 — trigger download
    const a = document.createElement('a');
    a.href = d.fileUrl;
    a.download = d.fileName || d.name || 'dokument';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    window.open(d.fileUrl, '_blank');
  }
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
    const typeInfo = InvoicingModule.TYPES[inv.invoiceType] || { icon: '🧾', label: inv.invoiceType || '—' };
    return `<tr style="border-bottom:1px solid var(--color-border-tertiary);">
      <td style="padding:9px 12px;font-size:13px;font-weight:500;">${escapeHtml(inv.invoiceNumber || '—')}</td>
      <td style="padding:9px 12px;font-size:13px;">${escapeHtml(client ? client.name : '—')}</td>
      <td style="padding:9px 12px;font-size:13px;">${escapeHtml(obj ? obj.name : '—')}</td>
      <td style="padding:9px 12px;font-size:13px;">${typeInfo.icon} ${typeInfo.label}</td>
      <td style="padding:9px 12px;font-size:13px;white-space:nowrap;">${fmtDate(inv.issueDate)}</td>
      <td style="padding:9px 12px;font-size:13px;white-space:nowrap;">${fmtDate(inv.dueDate)}</td>
      <td style="padding:9px 12px;">${statusHtml(inv.status)}</td>
      <td style="padding:9px 12px;white-space:nowrap;">
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          <button class="small-button" onclick="viewInvoice(${inv.id})" class="icon-btn" title="Podgląd">👁</button>
          <button class="small-button" onclick="editInvoice(${inv.id})" class="icon-btn" title="Edytuj">✏️</button>
          <button class="small-button" onclick="if(confirm('Usuń fakturę?')){InvoicingModule.remove(${inv.id});renderInvoicingModule();}" class="icon-btn icon-btn-del" title="Usuń">🗑</button>
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
        <div><label>Obiekt (opcjonalnie)</label><select id="inv-object"><option value="">— ogólnie —</option>${clients.length ? ObjectsModule.findByClient(clients[0].id).map(o => `<option value="${o.id}">${escapeHtml(o.name)}</option>`).join('') : ''}</select></div>
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
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Typ faktury</th>
              ${thS('date','Data wyst.')}
              ${thS('due','Termin płat.')}
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

function viewInvoice(id) {
  const inv = InvoicingModule.find(id);
  if (!inv) return;
  const client = ClientsModule.find(inv.clientId);
  const obj = inv.objectId ? ObjectsModule.find(inv.objectId) : null;
  const typeInfo = InvoicingModule.TYPES[inv.invoiceType] || { icon: '🧾', label: inv.invoiceType || '—' };
  const s = InvoicingModule.STATUSES[inv.status] || { label: inv.status, color: '#666', bg: '#eee' };
  const container = document.getElementById('module-content');
  if (!container) return;
  container.innerHTML = `
    <button class="small-button" onclick="renderInvoicingModule()" style="margin-bottom:16px;">← Lista faktur</button>
    <div style="border:1px solid var(--color-border-tertiary);border-radius:14px;padding:24px;max-width:600px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">
        <div>
          <h3 style="margin:0;font-size:18px;font-weight:700;">${escapeHtml(inv.invoiceNumber || '—')}</h3>
          <div style="font-size:13px;color:var(--color-text-secondary);margin-top:4px;">${typeInfo.icon} ${typeInfo.label}</div>
        </div>
        <span style="font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;background:${s.bg};color:${s.color};">${s.label}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px;">
        <div><span style="color:var(--color-text-secondary);font-size:11px;display:block;">Klient</span><strong>${escapeHtml((client && client.name) || '—')}</strong></div>
        <div><span style="color:var(--color-text-secondary);font-size:11px;display:block;">Obiekt</span><strong>${escapeHtml((obj && obj.name) || '—')}</strong></div>
        <div><span style="color:var(--color-text-secondary);font-size:11px;display:block;">Data wystawienia</span><strong>${fmtDate(inv.issueDate)}</strong></div>
        <div><span style="color:var(--color-text-secondary);font-size:11px;display:block;">Termin płatności</span><strong>${fmtDate(inv.dueDate)}</strong></div>
        <div><span style="color:var(--color-text-secondary);font-size:11px;display:block;">Netto</span><strong>${fmtMoney(inv.netAmount, inv.currency)}</strong></div>
        <div><span style="color:var(--color-text-secondary);font-size:11px;display:block;">VAT ${inv.vatRate}%</span><strong>${fmtMoney(inv.vatAmount, inv.currency)}</strong></div>
        <div style="grid-column:1/-1;border-top:1px solid var(--color-border-tertiary);padding-top:12px;margin-top:4px;">
          <span style="color:var(--color-text-secondary);font-size:11px;display:block;">Brutto</span>
          <strong style="font-size:18px;">${fmtMoney(inv.grossAmount, inv.currency)}</strong>
        </div>
        ${inv.notes ? `<div style="grid-column:1/-1;"><span style="color:var(--color-text-secondary);font-size:11px;display:block;">Uwagi</span>${escapeHtml(inv.notes)}</div>` : ''}
      </div>
      <div style="display:flex;gap:8px;margin-top:20px;">
        ${inv.status !== 'PAID' ? `<button class="primary-button" style="background:#27500A;border-color:#27500A;" onclick="markInvoicePaid(${inv.id})">✓ Oznacz jako opłaconą</button>` : ''}
        <button class="small-button" onclick="editInvoice(${inv.id})" class="icon-btn" title="Edytuj">✏️</button>
      </div>
    </div>`;
}

function editInvoice(id) {
  const inv = InvoicingModule.find(id);
  if (!inv) return;
  renderInvoicingModule();
  setTimeout(() => {
    const form = document.getElementById('inv-form-area');
    if (!form) return;
    form.style.display = 'block';
    form.querySelector('h4').textContent = 'Edytuj fakturę';
    const btn = form.querySelector('button[onclick="saveInvoice()"]');
    if (btn) { btn.textContent = 'Zapisz zmiany'; btn.setAttribute('onclick', `saveInvoiceEdit(${id})`); }
    document.getElementById('inv-client').value = inv.clientId || '';
    updateInvObjects(inv.clientId);
    setTimeout(() => { if (document.getElementById('inv-object')) document.getElementById('inv-object').value = inv.objectId || ''; }, 50);
    document.getElementById('inv-number').value = inv.invoiceNumber || '';
    document.getElementById('inv-type').value = inv.invoiceType || 'INVOICE';
    document.getElementById('inv-issue-date').value = inv.issueDate || '';
    document.getElementById('inv-due-date').value = inv.dueDate || '';
    document.getElementById('inv-net').value = inv.netAmount || '';
    document.getElementById('inv-vat').value = inv.vatRate || '23';
    document.getElementById('inv-currency').value = inv.currency || 'PLN';
    document.getElementById('inv-status').value = inv.status || 'DRAFT';
    document.getElementById('inv-notes').value = inv.notes || '';
    form.scrollIntoView({ behavior: 'smooth' });
  }, 80);
}

function saveInvoiceEdit(id) {
  const net = parseFloat(document.getElementById('inv-net').value || '0');
  if (!net) { alert('Podaj kwotę netto.'); return; }
  const vatRate = Number(document.getElementById('inv-vat').value || 23);
  const vatAmount = net * vatRate / 100;
  InvoicingModule.update(id, {
    clientId: document.getElementById('inv-client').value,
    objectId: document.getElementById('inv-object').value || null,
    invoiceNumber: document.getElementById('inv-number').value.trim(),
    invoiceType: document.getElementById('inv-type').value,
    issueDate: document.getElementById('inv-issue-date').value,
    dueDate: document.getElementById('inv-due-date').value,
    netAmount: net, vatRate, vatAmount, grossAmount: net + vatAmount,
    currency: document.getElementById('inv-currency').value,
    status: document.getElementById('inv-status').value,
    notes: document.getElementById('inv-notes').value.trim()
  });
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
// MODUŁ ANALIZY — nowy przepływ kreatora (v2)
// Typ analizy → „+ Nowa analiza" → klient/obiekt/okres bazowy → dane → „Wykonaj analizę"
// Metoda stopniodni (Tᵢ = bazowa z okresu bazowego, SD = z₀·(Tᵢ−tₘₑ), φ = ΣSD_stand/ΣSD_rzecz,
// Qs = Qc.o.·φ, OSZ% = (Qs_przed − Qs_po)/Qs_przed) — zgodnie z metodyką forHEAT.
// ═══════════════════════════════════════════════════════════════════════════════

const _escA = (typeof escapeHtml === 'function') ? escapeHtml : (v => String(v == null ? '' : v));
const _fmtDateA = (typeof fmtDate === 'function') ? fmtDate : (d => d || '—');
function _fmtA(n, d = 2) {
  return (n == null || isNaN(n)) ? '—' : Number(n).toLocaleString('pl-PL', { minimumFractionDigits: d, maximumFractionDigits: d });
}

const ANAL_TI = 20; // projektowa temperatura wewnętrzna [°C]
const ANAL_MONTHS = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
// Standardowy sezon ogrzewczy — domyślnie Lublin (wg metodyki). [tme, z0] per miesiąc 1–12.
const ANAL_STD_DEFAULT = { 1:[-2.6,31], 2:[-1.9,28], 3:[3.2,31], 4:[9.2,30], 5:[14.4,5], 6:[0,0], 7:[0,0], 8:[0,0], 9:[12.8,5], 10:[8.5,31], 11:[1.3,30], 12:[-2.1,31] };
const _sd20 = (tme, z0, ti) => {
  const T = (ti != null && ti !== '') ? Number(ti) : ((ANAL && ANAL.baseTi != null && ANAL.baseTi !== '') ? Number(ANAL.baseTi) : ANAL_TI);
  return Math.max(0, T - Number(tme)) * Number(z0 || 0);
};
// Tᵢ bazowa całego kreatora (sezon standardowy + okres PRZED) — kopiowana z okresu bazowego
function _analBaseTi() {
  // Tᵢ bazowa zawsze pobierana 1:1 z AKTUALNEGO okresu bazowego (protokołu),
  // aby zmiana temperatury bazowej w module Okresy bazowe była od razu widoczna w Analizach.
  if (ANAL && ANAL.basePeriod && ANAL.basePeriod !== 'manual' && window.MeasurementsModule) {
    const p = MeasurementsModule.find(Number(ANAL.basePeriod));
    if (p && p.baseTemperature != null && p.baseTemperature !== '') return Number(p.baseTemperature);
  }
  return (ANAL && ANAL.baseTi != null && ANAL.baseTi !== '') ? Number(ANAL.baseTi) : ANAL_TI;
}
// Tᵢ obowiązująca dla danego okresu: PO = ustawiana ręcznie, w pozostałych = bazowa
function _analTi(key) {
  if (key === 'after') {
    const v = (ANAL && ANAL.after) ? ANAL.after.baseTi : null;
    return (v != null && v !== '') ? Number(v) : _analBaseTi();
  }
  return _analBaseTi();
}

// stan kreatora analiz
let ANAL = null;
let selectedAnalysisObjectId = null; // zachowane dla zgodności

function _analResetState() {
  ANAL = {
    step: 1,
    type: null,
    clientId: null,
    objectId: null,
    basePeriod: null,
    std: JSON.parse(JSON.stringify(ANAL_STD_DEFAULT)),
    baseTi: 20,
    before: { from: '', to: '', consumption: '', months: [] },
    after:  { from: '', to: '', consumption: '', months: [], baseTi: 20 },
    energy: { unit: 'GJ', currency: 'PLN', price: '', escoShare: 50, priceMode: 'FIXED', priceDescription: '' },
    author: '',
    reg: { method: 'raw', baseLines: null, analyzed: { rows: [], fileName: '', from: '', to: '' }, billing: { from: '', to: '' }, tempRange: { from: -15, to: 10, step: 1 } },
    results: null,
    editingId: null
  };
}

function _analMonthsBetween(from, to) {
  if (!from || !to) return [];
  const a = new Date(from), b = new Date(to);
  if (isNaN(a) || isNaN(b) || a > b) return [];
  const out = []; let y = a.getFullYear(), m = a.getMonth();
  while (y < b.getFullYear() || (y === b.getFullYear() && m <= b.getMonth())) {
    const dim = new Date(y, m + 1, 0).getDate();
    let d = dim;
    if (y === a.getFullYear() && m === a.getMonth()) d = dim - a.getDate() + 1;
    if (y === b.getFullYear() && m === b.getMonth()) d = Math.min(d, b.getDate());
    out.push({ year: y, month: m + 1, name: ANAL_MONTHS[m] + ' ' + y, days: d, tme: '' });
    m++; if (m > 11) { m = 0; y++; }
  }
  return out;
}

const ANAL_STYLE = `<style>
  .anw-steps{display:flex;gap:6px;align-items:center;margin:0 0 22px;flex-wrap:wrap;}
  .anw-step{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--color-text-tertiary);}
  .anw-step .dot{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;background:var(--color-background-secondary);color:var(--color-text-tertiary);}
  .anw-step.active .dot{background:#0C447C;color:#fff;}
  .anw-step.done .dot{background:#27500A;color:#fff;}
  .anw-step.active{color:#0C447C;font-weight:600;}
  .anw-step .arr{color:var(--color-border-tertiary);}
  .anw-type-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;}
  .anw-type{position:relative;border:1.5px solid var(--color-border-tertiary);border-radius:14px;padding:18px 16px;cursor:pointer;background:var(--color-background-primary);transition:.15s;display:flex;flex-direction:column;gap:8px;}
  .anw-type:hover{border-color:#B5D4F4;box-shadow:0 4px 14px rgba(12,68,124,.08);transform:translateY(-1px);}
  .anw-type.sel{border-color:#0C447C;background:#E6F1FB;box-shadow:0 4px 16px rgba(12,68,124,.14);}
  .anw-type .ico{font-size:26px;}
  .anw-type .t{font-size:14px;font-weight:600;color:var(--color-text-primary);}
  .anw-type .d{font-size:12px;color:var(--color-text-secondary);}
  .anw-type .badge{position:absolute;top:12px;right:12px;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;}
  .anw-type .badge.ready{background:#EAF3DE;color:#27500A;}
  .anw-type .badge.soon{background:#FFF1E0;color:#9A5B00;}
  .anw-type .chk{position:absolute;top:10px;right:10px;width:22px;height:22px;border-radius:50%;background:#0C447C;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;}
  .anw-act{display:flex;justify-content:flex-end;gap:10px;margin-top:22px;}
  .anw-sec{border:1px solid var(--color-border-tertiary);border-radius:12px;overflow:hidden;margin-bottom:18px;}
  .anw-head{padding:12px 16px;display:flex;align-items:center;gap:10px;}
  .anw-head .ico{font-size:18px;} .anw-head h3{margin:0;font-size:14px;font-weight:600;}
  .anw-head .pill{font-size:11px;padding:2px 9px;border-radius:20px;margin-left:auto;}
  .anw-body{padding:16px;background:var(--color-background-primary);}
  .anw-blue{background:#E6F1FB;} .anw-blue h3{color:#0C447C;}
  .anw-gold{background:#FAEEDA;} .anw-gold h3{color:#633806;}
  .anw-before{background:#EEF4FB;} .anw-before h3{color:#0C447C;}
  .anw-after{background:#EAF3DE;} .anw-after h3{color:#27500A;}
  .anw-g2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
  .anw-pair{display:flex;align-items:flex-start;gap:18px;}
  .anw-pair-col{flex:1;min-width:0;border:1px solid #e6ebf2;border-radius:8px;padding:10px 10px 4px;background:var(--color-background-primary);box-sizing:border-box;}
  .anw-pair-before{border-top:3px solid #0C447C;}
  .anw-pair-after{border-top:3px solid #27500A;}
  table.anw-t tr.anw-blank td{color:transparent;background:#fafbfc;}
  .anw-g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;}
  .anw-g4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
  .anw-f label{display:block;font-size:11px;color:var(--color-text-secondary);margin-bottom:4px;font-weight:500;}
  .anw-f input,.anw-f select{width:100%;padding:8px 10px;border:1px solid var(--color-border-tertiary);border-radius:8px;font-size:13px;background:var(--color-background-primary);box-sizing:border-box;}
  table.anw-t{width:100%;border-collapse:collapse;font-size:13px;}
  table.anw-t th{text-align:left;padding:7px 8px;font-size:11px;font-weight:600;color:var(--color-text-secondary);border-bottom:2px solid var(--color-border-tertiary);background:var(--color-background-secondary);white-space:nowrap;}
  table.anw-t td{padding:4px 6px;border-bottom:1px solid var(--color-border-tertiary);}
  table.anw-t td.calc{font-variant-numeric:tabular-nums;color:var(--color-text-secondary);text-align:right;}
  table.anw-t input{width:100%;padding:5px 7px;border:1px solid var(--color-border-tertiary);border-radius:6px;font-size:13px;text-align:right;box-sizing:border-box;}
  .anw-f input.anw-ro,table.anw-t input.anw-ro,input.anw-ro{background:var(--color-background-secondary);color:var(--color-text-secondary);cursor:not-allowed;opacity:.9;}
  input.anw-ro::-webkit-outer-spin-button,input.anw-ro::-webkit-inner-spin-button{-webkit-appearance:none;appearance:none;margin:0;}
  input.anw-ro[type=number]{-moz-appearance:textfield;appearance:textfield;}
  .anw-lock{background:var(--color-background-secondary);border:1px solid var(--color-border-tertiary);color:var(--color-text-secondary);font-size:11px;padding:2px 9px;border-radius:999px;white-space:nowrap;}
  table.anw-t tfoot td{font-weight:700;padding:8px;border-top:2px solid var(--color-border-tertiary);background:var(--color-background-secondary);}
  .anw-muted{color:var(--color-text-tertiary);font-size:12px;}
  .anw-note{font-size:11px;color:var(--color-text-tertiary);margin-top:8px;}
  .anw-note a{color:#0C447C;}
  .anw-ctx{display:flex;gap:18px;flex-wrap:wrap;align-items:center;background:var(--color-background-secondary);border-radius:10px;padding:10px 14px;font-size:12px;color:var(--color-text-secondary);margin-top:14px;}
  .anw-ctx b{color:var(--color-text-primary);}
  .anw-run{background:linear-gradient(135deg,#15803d,#22a35a);color:#fff;font-size:15px;font-weight:600;padding:14px 30px;border-radius:12px;box-shadow:0 6px 18px rgba(34,163,90,.25);border:none;cursor:pointer;}
  .anw-run:hover{filter:brightness(1.05);}
  .anw-hero{background:linear-gradient(135deg,#0C447C,#1a6bb5);color:#fff;border-radius:14px;padding:22px 24px;display:flex;gap:28px;flex-wrap:wrap;align-items:center;}
  .anw-hero .big{font-size:34px;font-weight:800;line-height:1;}
  .anw-hero .lbl{font-size:12px;opacity:.85;margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px;}
  .anw-rgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-top:14px;}
  .anw-tile{border:1px solid var(--color-border-tertiary);border-radius:10px;padding:14px 16px;background:var(--color-background-primary);}
  .anw-tile .v{font-size:20px;font-weight:700;color:#0C447C;font-variant-numeric:tabular-nums;}
  .anw-tile .k{font-size:11px;color:var(--color-text-secondary);margin-top:2px;}
  table.anw-bvs th.anw-grp{text-align:center;font-size:11px;font-weight:700;border-bottom:1px solid var(--color-border-tertiary);}
  table.anw-bvs .anw-grp-r{color:#0C447C;background:#EEF4FB;}
  table.anw-bvs .anw-grp-s{color:#633806;background:#FAEEDA;}
  table.anw-bvs th.anw-sep,table.anw-bvs td.anw-sep{border-left:2px solid var(--color-border-tertiary);}
  /* ── pełny raport analizy ── */
  .anw-report{background:var(--color-background-primary);}
  .anw-proof-banner{border-radius:10px;padding:10px 14px;margin:0 0 14px;}
  .anw-proof-kicker{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;}
  .anw-proof-title{font-size:15px;font-weight:800;color:#0f2f4f;margin-top:2px;}
  .anw-rephead{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:2px solid #0C447C;padding-bottom:12px;margin-bottom:16px;}
  .anw-rephead .brand{font-size:20px;font-weight:800;color:#0C447C;letter-spacing:.3px;}
  .anw-rephead .sub{font-size:12px;color:var(--color-text-secondary);}
  .anw-rephead .num{font-size:13px;font-weight:700;color:#633806;text-align:right;white-space:nowrap;}
  .anw-step-card{border:1px solid var(--color-border-tertiary);border-radius:12px;padding:16px;margin-bottom:14px;background:var(--color-background-primary);}
  .anw-step-card h4{margin:0 0 6px;font-size:14px;color:#0C447C;display:flex;align-items:center;gap:10px;}
  .anw-step-num{flex:0 0 auto;width:24px;height:24px;border-radius:50%;background:#0C447C;color:#fff;font-size:12px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;}
  .anw-formula{font-family:'Cambria Math','Times New Roman',Georgia,serif;background:#F4F7FB;border-left:3px solid #0C447C;padding:9px 13px;border-radius:6px;font-size:14.5px;margin:8px 0;overflow-x:auto;color:var(--color-text-primary);}
  .anw-desc{font-size:12.5px;color:var(--color-text-secondary);line-height:1.55;}
  .anw-desc li{margin:3px 0;}
  .anw-chart-wrap{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:6px;}
  .anw-chart-wrap canvas{width:100%;height:260px;border:1px solid var(--color-border-tertiary);border-radius:8px;background:#fff;}
  .anw-sign{display:grid;grid-template-columns:1fr 1fr;gap:34px;margin:30px 4px 8px;}
  .anw-sign-box{padding-top:40px;}
  .anw-sign-line{border-top:1px solid var(--color-text-primary);}
  .anw-sign-cap{font-size:11px;color:var(--color-text-secondary);margin-top:6px;line-height:1.5;}
  .anw-sign-wateria{position:relative;}
  .anw-stamp{display:inline-block;border:2px solid #0C447C;color:#0C447C;border-radius:10px;padding:7px 15px;font-weight:800;font-size:13px;transform:rotate(-3deg);letter-spacing:.6px;background:rgba(12,68,124,.04);}
  /* ── okładka raportu (strona 1) ── */
  .anw-cover{position:relative;display:flex;flex-direction:column;border-radius:18px;overflow:hidden;background:#fff;border:1px solid #dbe5f0;box-shadow:0 12px 32px rgba(12,68,124,.10);padding:34px 38px 24px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .anw-cover-top{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;padding-bottom:20px;border-bottom:1px solid #e6edf5;}
  .anw-cover-logo{height:52px;width:auto;max-width:60%;object-fit:contain;}
  .anw-cover-num{text-align:right;white-space:nowrap;}
  .anw-cover-num-lbl{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--color-text-tertiary);}
  .anw-cover-num-val{font-size:17px;font-weight:800;color:#0C447C;font-variant-numeric:tabular-nums;}
  .anw-cover-title{margin:28px 0 4px;}
  .anw-cover-kicker{display:inline-block;font-size:11px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;color:#1a6bb5;background:#EEF4FB;border:1px solid #d6e4f3;padding:5px 12px;border-radius:999px;}
  .anw-cover-title h1{margin:14px 0 6px;font-size:34px;line-height:1.08;font-weight:800;color:#0f2f4f;letter-spacing:-.4px;}
  .anw-cover-method{font-size:14px;color:var(--color-text-secondary);}
  .anw-cover-meta{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:28px 0 6px;}
  .anw-cover-meta-card{border:1px solid #e6edf5;border-radius:12px;padding:14px 16px;background:#fafcfe;}
  .anw-cm-lbl{font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:#1a6bb5;font-weight:700;margin-bottom:5px;}
  .anw-cm-val{font-size:18px;font-weight:700;color:#0f2f4f;line-height:1.25;}
  .anw-cm-val.anw-cm-period{font-size:15px;font-variant-numeric:tabular-nums;}
  .anw-cm-sub{font-size:12px;color:var(--color-text-secondary);margin-top:4px;}
  .anw-cover-result{margin-top:auto;padding-top:26px;}
  .anw-cover-result-head{font-size:12px;text-transform:uppercase;letter-spacing:1.4px;color:var(--color-text-tertiary);font-weight:700;margin-bottom:10px;}
  .anw-cover-osz{background:linear-gradient(135deg,#0C447C,#1a6bb5);color:#fff;border-radius:16px;padding:20px 28px;display:flex;justify-content:space-between;align-items:center;gap:16px;box-shadow:0 8px 22px rgba(12,68,124,.26);-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .anw-cover-osz.neg{background:linear-gradient(135deg,#7a1f1f,#b53a3a);box-shadow:0 8px 22px rgba(150,40,40,.26);}
  .anw-cover-osz-lbl{font-size:16px;font-weight:600;opacity:.94;text-transform:uppercase;letter-spacing:.6px;line-height:1.15;}
  .anw-cover-osz-val{font-size:62px;font-weight:800;line-height:1;font-variant-numeric:tabular-nums;}
  .anw-cover-osz-val span{font-size:30px;font-weight:700;margin-left:2px;}
  .anw-cover-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:14px;}
  .anw-cover-kpi{border:1px solid #e6edf5;border-radius:12px;padding:16px 14px;background:#fff;text-align:center;}
  .anw-cover-kpi .v{font-size:21px;font-weight:800;color:#0C447C;font-variant-numeric:tabular-nums;}
  .anw-cover-kpi .v span{font-size:14px;font-weight:600;}
  .anw-cover-kpi .k{font-size:11px;color:var(--color-text-secondary);margin-top:6px;line-height:1.3;}
  .anw-cover-foot{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:22px;padding-top:14px;border-top:1px solid #e6edf5;font-size:11px;color:var(--color-text-tertiary);}
  @media(max-width:680px){.anw-g4{grid-template-columns:1fr 1fr;}.anw-g3{grid-template-columns:1fr;}.anw-chart-wrap{grid-template-columns:1fr;}.anw-sign{grid-template-columns:1fr;}
    .anw-cover{padding:24px 20px 20px;}.anw-cover-logo{height:38px;max-width:68%;}.anw-cover-title h1{font-size:26px;}.anw-cover-meta{grid-template-columns:1fr;}.anw-cover-kpis{grid-template-columns:1fr;}.anw-cover-osz{flex-direction:column;align-items:flex-start;}.anw-cover-osz-val{font-size:46px;}.anw-cover-foot{flex-direction:column;align-items:flex-start;gap:4px;}}
  @media print{
    body *{visibility:hidden !important;}
    #anw-report,#anw-report *{visibility:visible !important;}
    #anw-report{position:absolute;left:0;top:0;width:100%;margin:0;padding:0;border:none;}
    .anw-noprint{display:none !important;}
    /* Okładka = pełna strona 1 */
    .anw-cover{min-height:244mm;box-shadow:none;page-break-after:always;break-after:page;border:1px solid #dbe5f0;}
    .anw-cover-embed{min-height:0 !important;box-shadow:none;page-break-before:always;break-before:page;page-break-after:auto !important;break-after:auto !important;}
    /* Treść płynie i gęsto wypełnia strony — karty mogą się dzielić między stronami */
    .anw-step-card{break-inside:auto;page-break-inside:auto;margin-bottom:10px;padding:12px 14px;}
    .anw-step-card h4{break-after:avoid;page-break-after:avoid;}
    .anw-desc{orphans:3;widows:3;}
    /* Atomowe bloki, których nie wolno rozcinać */
    .anw-formula,.anw-pair,.anw-pair-col,table.anw-t,table.anw-bvs,.anw-g2,.anw-rgrid,.anw-tile,.anw-sign,.anw-chart-wrap canvas{break-inside:avoid;page-break-inside:avoid;}
    .anw-chart-wrap{gap:12px;margin-top:4px;}
    .anw-sign{margin-top:18px;}
    @page{margin:12mm;}
  }
</style>`;

// ── ENTRY POINT (wywoływane przez nawigację: moduleName==='analyses') ──────────
function renderAnalysesModule() {
  const container = document.getElementById('module-content');
  if (!container) return;
  if (!ANAL) _analResetState();

  const clients = ClientsModule.getAll();
  const objects = ObjectsModule.getAll();
  if (!clients.length || !objects.length) {
    container.innerHTML = `${ANAL_STYLE}<div class="reminder-card"><strong>Najpierw dodaj klienta i obiekt</strong><div class="reminder-meta">Analiza musi być przypisana do obiektu.</div></div>`;
    return;
  }

  container.innerHTML = ANAL_STYLE + _analStepsBar() + (ANAL.step === 1 ? _analTypeSelect() : _analWizard());

  if (ANAL.step === 2 && ANAL.type === 'TYM' && ANAL.objectId) _analRecalcLive();
  if (ANAL.step === 2 && ANAL.results && ANAL.type !== 'REGRESSION') setTimeout(() => _analDrawCharts(_analReportData({ live: true })), 60);
}

function _analStepsBar() {
  const items = [
    { n: 1, l: 'Typ analizy' },
    { n: 2, l: 'Klient · obiekt · okres' },
    { n: 3, l: 'Dane i obliczenia' },
    { n: 4, l: 'Wykonaj' }
  ];
  let cur = ANAL.step === 1 ? 1 : (ANAL.results ? 4 : (ANAL.clientId && ANAL.objectId ? 3 : 2));
  return `<div class="anw-steps">` + items.map((it, i) => {
    const cls = it.n < cur ? 'done' : (it.n === cur ? 'active' : '');
    return `<div class="anw-step ${cls}"><span class="dot">${it.n < cur ? '✓' : it.n}</span>${it.l}</div>` +
      (i < items.length - 1 ? '<span class="arr">→</span>' : '');
  }).join('') + `</div>`;
}

// ── KROK 1: wybór typu + „+ Nowa analiza" + lista istniejących ──────────────────
function _analTypeSelect() {
  const cards = Object.entries(AnalysesModule.TYPES).map(([k, t]) => {
    const ready = (k === 'TYM' || k === 'REGRESSION' || k === 'VOLUME'); // gotowe metody
    return `<div class="anw-type ${ANAL.type === k ? 'sel' : ''}" onclick="analSelectType('${k}')">
      ${ANAL.type === k ? '<span class="chk">✓</span>' : ''}
      <span class="badge ${ready ? 'ready' : 'soon'}">${ready ? 'GOTOWE' : 'WKRÓTCE'}</span>
      <span class="ico">${t.icon}</span>
      <span class="t">${_escA(t.label)}</span>
      <span class="d">${_analTypeDesc(k)}</span>
    </div>`;
  }).join('');

  const selType = ANAL.type;
  const all = (AnalysesModule.getAll() || [])
    .filter(a => !selType || a.analysisType === selType)
    .sort((a, b) => (b.executedAt || '').localeCompare(a.executedAt || ''));
  const typeLabel = (selType && AnalysesModule.TYPES[selType]) ? AnalysesModule.TYPES[selType].label : '';
  let list = '';
  if (selType) {
    list = all.length ? `
    <div style="margin-top:28px;">
      <div style="font-size:13px;font-weight:600;color:var(--color-text-secondary);margin-bottom:10px;">Zapisane analizy — ${_escA(typeLabel)} (${all.length})</div>
      <div style="overflow-x:auto;border:1px solid var(--color-border-tertiary);border-radius:10px;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead><tr style="background:var(--color-background-secondary);">
            <th style="padding:9px 12px;text-align:left;font-size:11px;font-weight:600;color:var(--color-text-secondary);white-space:nowrap;">Data analizy</th>
            <th style="padding:9px 12px;text-align:left;font-size:11px;font-weight:600;color:var(--color-text-secondary);white-space:nowrap;">Nr analizy</th>
            <th style="padding:9px 12px;text-align:left;font-size:11px;font-weight:600;color:var(--color-text-secondary);">Klient</th>
            <th style="padding:9px 12px;text-align:left;font-size:11px;font-weight:600;color:var(--color-text-secondary);">Obiekt</th>
            <th style="padding:9px 12px;text-align:left;font-size:11px;font-weight:600;color:var(--color-text-secondary);white-space:nowrap;">Okres analizy</th>
            <th style="padding:9px 12px;text-align:left;font-size:11px;font-weight:600;color:var(--color-text-secondary);">Akcje</th>
          </tr></thead>
          <tbody>${all.map(a => {
            const o = ObjectsModule.find(a.objectId);
            const c = ClientsModule.find(a.clientId);
            const cn = c ? ClientsModule.getNumber(c.id) : null;
            const on = o ? ObjectsModule.getNumber(o.id) : null;
            const num = (AnalysesModule.getNumber ? AnalysesModule.getNumber(a.id) : null) || ('#' + a.id);
            const ip = a.inputParams || {};
            const per = (ip.after && (ip.after.from || ip.after.to)) ? ip.after : (ip.before || {});
            const period = (per.from || per.to) ? (_fmtDateA(per.from) + ' → ' + _fmtDateA(per.to)) : '—';
            return `<tr style="border-bottom:1px solid var(--color-border-tertiary);">
              <td style="padding:9px 12px;white-space:nowrap;">${_fmtDateA(a.executedAt)}</td>
              <td style="padding:9px 12px;font-weight:600;white-space:nowrap;">${_escA(num)}</td>
              <td style="padding:9px 12px;">${c ? ('K' + cn + ' · ' + _escA(c.name)) : '—'}</td>
              <td style="padding:9px 12px;">${(c && o) ? ('K' + cn + '-' + on + ' · ' + _escA(o.name)) : _escA((o && o.name) || '—')}</td>
              <td style="padding:9px 12px;white-space:nowrap;">${_escA(period)}</td>
              <td style="padding:9px 12px;white-space:nowrap;">
                <button class="icon-btn" onclick="analView(${a.id})" title="Podgląd">👁</button>
                <button class="icon-btn" onclick="analEdit(${a.id})" title="Edytuj">✏️</button>
                <button class="icon-btn icon-btn-del" onclick="if(confirm('Usuń analizę?')){AnalysesModule.remove(${a.id});renderAnalysesModule();}" title="Usuń">🗑</button>
              </td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>
    </div>` : `
    <div style="margin-top:28px;padding:18px;border:1px dashed var(--color-border-tertiary);border-radius:10px;color:var(--color-text-secondary);font-size:13px;text-align:center;">
      Brak zapisanych analiz typu „${_escA(typeLabel)}". Kliknij „+ Nowa analiza", aby utworzyć pierwszą.
    </div>`;
  }


  return `
    <h2 style="font-size:16px;color:#0C447C;margin:0 0 4px;">1 · Wybierz typ analizy</h2>
    <p style="font-size:13px;color:var(--color-text-secondary);margin:0 0 20px;">Najpierw określ metodę. Po wyborze typu kliknij „+ Nowa analiza", aby przejść do wyboru klienta, obiektu i okresu bazowego.</p>
    <div class="anw-type-grid">${cards}</div>
    <div class="anw-act">
      <button class="primary-button" id="anw-new" ${ANAL.type ? '' : 'disabled'} onclick="analStartNew()" style="${ANAL.type ? '' : 'opacity:.5;cursor:not-allowed;'}">+ Nowa analiza</button>
    </div>
    ${list}`;
}

function _analTypeDesc(k) {
  return ({
    TYM: 'Sprowadzenie zużycia do standardowego sezonu metodą stopniodni.',
    REGRESSION: 'Porównanie techniczne PRZED/PO wg równań y = ax + b.',
    OCCUPANCY: 'Normalizacja zużycia względem obłożenia obiektu.',
    AREA: 'Wskaźniki zużycia na m² powierzchni ogrzewanej.',
    VOLUME: 'Normalizacja względem wolumenu / intensywności pracy.',
    SCHEDULE: 'Uwzględnienie harmonogramu pracy obiektu.',
    CUSTOM: 'Dowolny model definiowany przez analityka.'
  })[k] || '';
}

function analSelectType(k) { ANAL.type = k; renderAnalysesModule(); }
function analStartNew() {
  if (!ANAL.type) return;
  ANAL.step = 2; ANAL.results = null; ANAL.editingId = null;
  renderAnalysesModule();
}
function analBackToTypes() { ANAL.step = 1; renderAnalysesModule(); }

// Wczytuje zapisaną analizę do kreatora (tryb edycji)
function analEdit(id) {
  const a = AnalysesModule.find(id);
  if (!a) { alert('Nie znaleziono analizy.'); return; }
  const ip = a.inputParams || {};
  _analResetState();
  ANAL.type = a.analysisType || 'TYM';
  ANAL.step = 2;
  ANAL.editingId = a.id;
  ANAL.clientId = a.clientId != null ? Number(a.clientId) : null;
  ANAL.objectId = a.objectId != null ? Number(a.objectId) : null;
  selectedAnalysisObjectId = ANAL.objectId;
  ANAL.basePeriod = (ip.basePeriod != null) ? ip.basePeriod : null;
  if (ip.std) ANAL.std = JSON.parse(JSON.stringify(ip.std));
  if (ip.before) ANAL.before = Object.assign({ from: '', to: '', consumption: '', months: [] }, JSON.parse(JSON.stringify(ip.before)));
  if (ip.after) ANAL.after = Object.assign({ from: '', to: '', consumption: '', months: [], baseTi: 20 }, JSON.parse(JSON.stringify(ip.after)));
  if (!Array.isArray(ANAL.before.months)) ANAL.before.months = [];
  if (!Array.isArray(ANAL.after.months)) ANAL.after.months = [];
  ANAL.energy = {
    unit: ip.energyUnit || 'GJ',
    currency: ip.currency || 'PLN',
    price: (ip.energyPrice != null) ? ip.energyPrice : '',
    escoShare: (ip.escoShare != null) ? ip.escoShare : 50,
    priceMode: ip.priceMode || 'FIXED',
    priceDescription: ip.priceDescription || ''
  };
  ANAL.author = a.author || '';
  if (ANAL.type === 'REGRESSION') {
    ANAL.reg = Object.assign(
      { method: 'raw', baseLines: null, analyzed: { rows: [], fileName: '', from: '', to: '' }, billing: { from: '', to: '' }, tempRange: { from: -15, to: 10, step: 1 } },
      (ip.reg ? JSON.parse(JSON.stringify(ip.reg)) : {})
    );
    if (!ANAL.reg.tempRange) ANAL.reg.tempRange = { from: -15, to: 10, step: 1 };
  }
  // ── Synchronizacja okresu bazowego 1:1 z protokołem ───────────────────────
  // Jeśli analiza jest powiązana z protokołem okresu bazowego (a nie „Ręczne
  // wprowadzenie"), NIE ufamy zapisanej migawce miesięcy — pobieramy okres
  // bazowy 1:1 z AKTUALNEGO protokołu. Dzięki temu dni i temperatury (w tym
  // 0 dni poza sezonem grzewczym) zawsze zgadzają się z zakładką „Okres
  // bazowy", a stare, błędnie zapisane analizy (np. lato uzupełnione dniami
  // kalendarzowymi) same się naprawiają po otwarciu. Okres analizowany (after)
  // oraz parametry energii pozostają nietknięte.
  const _bpId = ANAL.basePeriod;
  const _isProtocolBacked = _bpId != null && _bpId !== 'manual'
    && !String(_bpId).startsWith('int:') && ANAL.type !== 'VOLUME' && ANAL.type !== 'REGRESSION';
  if (_isProtocolBacked && window.MeasurementsModule) {
    const _p = MeasurementsModule.find(Number(_bpId));
    if (_p) {
      const _savedAfter  = ANAL.after  ? JSON.parse(JSON.stringify(ANAL.after))  : null;
      const _savedEnergy = ANAL.energy ? JSON.parse(JSON.stringify(ANAL.energy)) : null;
      _analApplyBaseProtocol(_p);                    // odśwież before / std / baseTi 1:1
      if (_savedAfter)  ANAL.after  = _savedAfter;   // zachowaj okres analizowany
      if (_savedEnergy) ANAL.energy = _savedEnergy;  // zachowaj parametry energii analizy
    }
  }
  ANAL.results = null;
  renderAnalysesModule();
  setTimeout(function () { try { _analRecalcLive(); } catch (e) {} }, 0);
}

// ── KROK 2: kreator ─────────────────────────────────────────────────────────────
function _analWizard() {
  const t = AnalysesModule.TYPES[ANAL.type];
  const clients = ClientsModule.getAll();
  const objsForClient = ANAL.clientId ? ObjectsModule.findByClient(ANAL.clientId) : [];
  const baseProtocols = (ANAL.objectId && window.MeasurementsModule) ? (MeasurementsModule.findByObject(ANAL.objectId) || []) : [];
  const isReg = ANAL.type === 'REGRESSION';
  const regBasePeriods = (isReg && ANAL.objectId && window.RegressionBaseModule) ? RegressionBaseModule.listByObject(ANAL.objectId) : [];

  const selector = `
    <div class="anw-sec">
      <div class="anw-head anw-blue"><span class="ico">🏢</span><h3>Klient · obiekt · okres bazowy</h3></div>
      <div class="anw-body">
        <div class="anw-g3">
          <div class="anw-f"><label>Klient</label>
            <select onchange="analOnClient(this.value)">
              <option value="">— wybierz klienta —</option>
              ${clients.map(c => `<option value="${c.id}" ${Number(c.id) === Number(ANAL.clientId) ? 'selected' : ''}>K${ClientsModule.getNumber(c.id)} · ${_escA(c.name)}</option>`).join('')}
            </select></div>
          <div class="anw-f"><label>Obiekt</label>
            <select onchange="analOnObject(this.value)" ${ANAL.clientId ? '' : 'disabled'}>
              <option value="">${ANAL.clientId ? '— wybierz obiekt —' : 'najpierw klient'}</option>
              ${objsForClient.map(o => `<option value="${o.id}" ${Number(o.id) === Number(ANAL.objectId) ? 'selected' : ''}>K${ClientsModule.getNumber(o.clientId)}-${ObjectsModule.getNumber(o.id)} · ${_escA(o.name)}</option>`).join('')}
            </select></div>
          <div class="anw-f"><label>${isReg ? 'Okres bazowy (regresja, PRZED)' : 'Okres bazowy (PRZED instalacją)'}</label>
            <select onchange="analOnBasePeriod(this.value)" ${ANAL.objectId ? '' : 'disabled'}>
              ${isReg
                ? `<option value="">${ANAL.objectId ? (regBasePeriods.length ? '— wybierz okres bazowy regresji —' : 'brak okresów bazowych regresji (utwórz w arkuszu regresji)') : 'najpierw obiekt'}</option>
                   ${regBasePeriods.map(p => `<option value="${p.id}" ${String(ANAL.basePeriod) === String(p.id) ? 'selected' : ''}>${_escA(p.number || ('REG ' + p.id))}${(p.periodFrom || p.periodTo) ? ' · ' + _escA((p.periodFrom || '?') + '–' + (p.periodTo || '?')) : ''}</option>`).join('')}`
                : `<option value="">${ANAL.objectId ? (baseProtocols.length ? '— wybierz okres bazowy —' : 'brak zapisanych okresów bazowych') : 'najpierw obiekt'}</option>
                   ${baseProtocols.map(p => `<option value="${p.id}" ${String(ANAL.basePeriod) === String(p.id) ? 'selected' : ''}>${_escA(p.protocolNumber || ('Protokół ' + p.id))}${p.protocolDate ? ' · ' + _escA(p.protocolDate) : ''}</option>`).join('')}
                   ${(ANAL.type === 'VOLUME' && window.BasePeriodModule && ANAL.objectId) ? BasePeriodModule.findByObjectType(ANAL.objectId, 'volume').map(it => `<option value="int:${it.id}" ${ANAL.basePeriod === ('int:' + it.id) ? 'selected' : ''}>⚙️ ${_escA(it.protocolNumber || 'Okres bazowy intensywności')} · ${_fmtDateA(it.periodFrom)}–${_fmtDateA(it.periodTo)}</option>`).join('') : ''}
                   <option value="manual" ${ANAL.basePeriod === 'manual' ? 'selected' : ''}>✏️ Ręczne wprowadzenie</option>`}
            </select></div>
        </div>
        ${ANAL.objectId ? _analCtx() : ''}
      </div>
    </div>`;

  let body = '';
  if (!ANAL.objectId) {
    body = `<div class="reminder-card"><strong>Wybierz klienta i obiekt</strong><div class="reminder-meta">Po wyborze obiektu pojawi się arkusz danych i obliczeń dla metody: ${_escA(t.label)}.</div></div>`;
  } else if (ANAL.type === 'TYM') {
    body = ANAL.basePeriod
      ? _analTYMSheet()
      : `<div class="reminder-card"><strong>Wybierz okres bazowy</strong><div class="reminder-meta">Standardowy sezon ogrzewczy oraz dane okresu PRZED instalacją zostaną wczytane z wybranego protokołu bazowego. Możesz też wybrać „✏️ Ręczne wprowadzenie".</div></div>`;
  } else if (ANAL.type === 'VOLUME') {
    body = ANAL.basePeriod
      ? _analVOLUMESheet()
      : `<div class="reminder-card"><strong>Wybierz okres bazowy</strong><div class="reminder-meta">Dla korekty intensywności okres PRZED instalacją oraz zakres dat zostaną wczytane z wybranego protokołu bazowego. Możesz też wybrać „✏️ Ręczne wprowadzenie".</div></div>`;
  } else if (ANAL.type === 'REGRESSION') {
    body = ANAL.basePeriod
      ? _analRegSheet()
      : `<div class="reminder-card"><strong>Wybierz okres bazowy regresji</strong><div class="reminder-meta">Wskaż zapisany okres bazowy z arkusza regresji. Następnie wybierzesz metodę (1/2), skopiujesz dane bazowe, zaimportujesz okres analizowany (CSV) i podasz zakres rozliczeniowy.</div></div>`;
  } else {
    body = `<div class="anw-sec"><div class="anw-head anw-gold"><span class="ico">${t.icon}</span><h3>${_escA(t.label)}</h3></div>
      <div class="anw-body" style="text-align:center;padding:40px 20px;color:var(--color-text-secondary);">
        <div style="font-size:42px;margin-bottom:10px;">🚧</div><strong>Metoda w przygotowaniu</strong>
        <div class="anw-muted" style="margin-top:6px;">Szkielet kreatora jest gotowy. Arkusz obliczeniowy tej metody dodamy w kolejnym kroku.</div></div></div>`;
  }

  const footer = (ANAL.objectId && ANAL.basePeriod && (ANAL.type === 'TYM' || ANAL.type === 'VOLUME' || ANAL.type === 'REGRESSION')) ? `
    ${ANAL.type === 'VOLUME' ? `<div class="anw-muted" style="margin:14px 0 6px;">Wsk = I·z₀ · φ = ΣWsk_ref / ΣWsk_rzecz · Qs = Q·φ (zużycie sprowadzone do referencyjnej intensywności)</div>` : ''}
    <div class="anw-act" style="justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;">
      <div class="anw-f" style="min-width:240px;max-width:360px;flex:1;">
        <label>Wykonał — Energy Analyst</label>
        <select onchange="ANAL.author=this.value;renderAnalysesModule()">${escoAnalystOptions(ANAL.author || '')}</select>
        <div class="anw-muted" style="margin-top:4px;">Analizę może wykonać wyłącznie użytkownik z rolą <b>Energy Analyst</b> (lista pochodzi z modułu Użytkownicy).</div>
      </div>
      <button class="anw-run" onclick="analRun()">⚡ Wykonaj analizę</button>
    </div>
    <div id="anw-results">${ANAL.results ? (ANAL.type === 'REGRESSION' ? _analRegResults() : _analResults()) : ''}</div>` : '';

  return `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;">
      <button class="small-button" onclick="analBackToTypes()">← Typ analizy</button>
      <h2 style="font-size:16px;color:#0C447C;margin:0;">${t.icon} ${_escA(t.label)}</h2>
    </div>
    <p style="font-size:13px;color:var(--color-text-secondary);margin:0 0 18px;">2 · Uzupełnij klienta, obiekt i okres bazowy, wprowadź dane, a następnie kliknij „Wykonaj analizę" na dole.</p>
    ${selector}${body}${footer}`;
}

function _analCtx() {
  const c = ClientsModule.find(ANAL.clientId), o = ObjectsModule.find(ANAL.objectId);
  if (!o) return '';
  const cn = ClientsModule.getNumber(o.clientId), on = ObjectsModule.getNumber(o.id);
  return `<div class="anw-ctx">
    <span>Klient: <b>K${cn} · ${_escA(c ? c.name : '')}</b></span>
    <span>Obiekt: <b>K${cn}-${on} · ${_escA(o.name)}</b></span>
    <span>Stacja meteo: <b>${_escA(o.weatherStation || '—')}</b></span>
    ${(ANAL && ANAL.type === 'REGRESSION') ? '' : `<span>Tᵢ bazowa: <b>${_analBaseTi()} °C</b></span>`}
  </div>`;
}

// ── Arkusz TYM (stopniodni) ─────────────────────────────────────────────────────
function _analTYMSheet() {
  return `
  ${_analBaseVsStandardSheet()}
  ${_analPeriodSheet('after', 'Okres analizowany — PO instalacji', 'anw-after', '📈', 'Qc.o. po')}
  <div class="anw-sec">
    <div class="anw-head anw-blue"><span class="ico">⚡</span><h3>Parametry energetyczne i rozliczenie</h3></div>
    <div class="anw-body">
      <div class="anw-g4">
        <div class="anw-f"><label>Jednostka energii</label>
          <select onchange="ANAL.energy.unit=this.value;renderAnalysesModule()">
            ${['GJ','MWh','kWh','m³'].map(u => `<option ${ANAL.energy.unit === u ? 'selected' : ''}>${u}</option>`).join('')}
          </select></div>
        <div class="anw-f"><label>Waluta</label>
          <select onchange="ANAL.energy.currency=this.value;renderAnalysesModule()">
            ${['PLN','EUR','CZK','USD'].map(u => `<option ${ANAL.energy.currency === u ? 'selected' : ''}>${u}</option>`).join('')}
          </select></div>
        <div class="anw-f"><label>Sposób wyceny energii</label>
          <select onchange="ANAL.energy.priceMode=this.value;renderAnalysesModule()">
            <option value="FIXED" ${ANAL.energy.priceMode !== 'VARIABLE' ? 'selected' : ''}>Cena stała za jednostkę</option>
            <option value="VARIABLE" ${ANAL.energy.priceMode === 'VARIABLE' ? 'selected' : ''}>Koszt zmienny całościowy</option>
          </select></div>
        <div class="anw-f"><label>Udział WaterAI / ESCO [%]</label>
          <input type="number" step="0.1" min="0" max="100" value="${ANAL.energy.escoShare}" oninput="ANAL.energy.escoShare=this.value;_analRecalcLive()"></div>
      </div>
      <div class="anw-g2" style="margin-top:12px;">
        ${ANAL.energy.priceMode === 'VARIABLE'
          ? `<div class="anw-f"><label>Całkowity koszt energii w okresie bazowym [${_escA(ANAL.energy.currency)}]</label>
              <input type="number" step="0.01" min="0" value="${ANAL.energy.price}" placeholder="np. 17 314,00" oninput="ANAL.energy.price=this.value;_analRecalcLive()"></div>`
          : `<div class="anw-f"><label>Cena energii (za jednostkę)</label>
              <input type="number" step="0.0001" min="0" value="${ANAL.energy.price}" placeholder="np. 0,54" oninput="ANAL.energy.price=this.value;_analRecalcLive()"></div>`}
        <div class="anw-f"><label>Opis (np. uwzględnia koszty przesyłu i pozostałe składowe faktury)</label>
          <input type="text" value="${_escA(ANAL.energy.priceDescription || '')}" placeholder="WaterAI redukuje zużycie, a tym samym koszty przesyłu i inne składowe…" oninput="ANAL.energy.priceDescription=this.value"></div>
      </div>
      ${ANAL.energy.priceMode === 'VARIABLE'
        ? `<div class="anw-note">Wpisywana kwota to <b>całkowity koszt energii w okresie bazowym</b> (energia + przesył i pozostałe składowe redukowane przez WaterAI). Wartość oszczędności = koszt bazowy × procent oszczędności; dopiero ta kwota jest dzielona pomiędzy WaterAI/ESCO i klienta. Opis trafia do analizy i raportu ESCO.</div>`
        : ''}
    </div>
  </div>`;
}

// Scalony blok: Okres bazowy (PRZED, rzecz) zestawiony ze Standardowym sezonem (stand).
// Jedna tabela: daty + zużycie okresu bazowego, a per miesiąc — temp/dni/SD dla obu okresów.
function _analBaseVsStandardSheet() {
  const P = ANAL.before;
  const _ti = _analTi('before');
  const months = Array.isArray(P.months) ? P.months : [];
  // Dane PRZED (rzecz) i Standardowy sezon (stand) pochodzą z wyznaczonego okresu
  // bazowego → tylko do odczytu. Wyjątek: „✏️ Ręczne wprowadzenie".
  const locked = !!(ANAL.basePeriod && ANAL.basePeriod !== 'manual');
  const ro = locked ? ' disabled class="anw-ro"' : '';
  const rows = months.length ? months.map((mo, idx) => {
    const stdM = ANAL.std[mo.month] || [0, 0];
    const sdR = _sd20(mo.tme, mo.days, _ti);
    const sdS = _sd20(stdM[0], mo.days, _ti);
    return `<tr>
      <td>${mo.name}</td>
      <td><input${ro} type="number" step="0.01" value="${mo.tme}" placeholder="°C" oninput="ANAL.before.months[${idx}].tme=this.value;_analRecalcLive()"></td>
      <td><input${ro} type="number" min="0" max="31" value="${mo.days}" oninput="ANAL.before.months[${idx}].days=this.value;_analRecalcLive()"></td>
      <td class="calc" id="anw-before-sdr-${idx}">${_fmtA(sdR, 1)}</td>
      <td class="anw-sep"><input${ro} type="number" step="0.1" value="${stdM[0]}" placeholder="°C" oninput="ANAL.std[${mo.month}][0]=this.value;_analRecalcLive()"></td>
      <td><input${ro} type="number" min="0" max="31" value="${stdM[1]}" oninput="ANAL.std[${mo.month}][1]=this.value;_analRecalcLive()"></td>
      <td class="calc" id="anw-before-sds-${idx}">${_fmtA(sdS, 1)}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="7" class="anw-muted" style="padding:12px;text-align:center;">Ustaw zakres dat okresu bazowego, aby wygenerować miesiące</td></tr>`;

  return `
  <div class="anw-sec">
    <div class="anw-head anw-before"><span class="ico">📉</span><h3>Okres bazowy — PRZED instalacją (rzecz) &nbsp;·&nbsp; Standardowy sezon ogrzewczy (stand)</h3>
      ${locked ? '<span class="anw-lock">🔒 z okresu bazowego · tylko odczyt</span>' : ''}
      <span class="pill" style="background:var(--color-background-primary);border:1px solid var(--color-border-tertiary);color:var(--color-text-secondary);">φ = <b id="anw-before-phi">—</b></span></div>
    <div class="anw-body">
      <div class="anw-g3">
        <div class="anw-f"><label>Okres bazowy — data od</label><input${ro} type="date" value="${P.from}" onchange="analOnDates('before','from',this.value)"></div>
        <div class="anw-f"><label>Okres bazowy — data do</label><input${ro} type="date" value="${P.to}" onchange="analOnDates('before','to',this.value)"></div>
        <div class="anw-f"><label>Zużycie okresu bazowego Qc.o. [<span class="anw-u">${ANAL.energy.unit}</span>]</label>
          <input${ro} type="number" step="0.001" value="${P.consumption}" placeholder="z faktur / ciepłomierza" oninput="ANAL.before.consumption=this.value;_analRecalcLive()"></div>
      </div>
      <table class="anw-t anw-bvs" style="margin-top:6px;">
        <thead>
          <tr>
            <th rowspan="2" style="width:16%">Miesiąc</th>
            <th colspan="3" class="anw-grp anw-grp-r">Okres bazowy — PRZED (rzecz) · Tᵢ=${_ti} °C</th>
            <th colspan="3" class="anw-grp anw-grp-s anw-sep">Standardowy sezon (stand) · Tᵢ=${_ti} °C</th>
          </tr>
          <tr>
            <th>śr. temp. tₘₑ [°C]</th><th>dni z₀</th><th style="text-align:right">SD_rzecz</th>
            <th class="anw-sep">śr. temp. tₘₑ [°C]</th><th>dni z₀</th><th style="text-align:right">SD_stand</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot><tr>
          <td>Suma</td>
          <td></td><td class="calc" id="anw-before-days">—</td><td class="calc" id="anw-before-sumr">—</td>
          <td class="anw-sep"></td><td></td><td class="calc" id="anw-before-sums">—</td>
        </tr></tfoot>
      </table>
    </div>
  </div>`;
}

function _analPeriodSheet(key, title, headCls, ico, qLabel) {
  const P = ANAL[key];
  const _ti = _analTi(key);
  const rows = P.months.length ? P.months.map((mo, idx) => {
    const sdR = _sd20(mo.tme, mo.days, _ti);
    const stdM = ANAL.std[mo.month]; const sdS = _sd20(stdM[0], mo.days, _ti);
    return `<tr>
      <td>${mo.name}</td>
      <td><input type="number" step="0.01" value="${mo.tme}" placeholder="°C" oninput="ANAL.${key}.months[${idx}].tme=this.value;_analRecalcLive()"></td>
      <td><input type="number" min="0" max="31" value="${mo.days}" oninput="ANAL.${key}.months[${idx}].days=this.value;_analRecalcLive()"></td>
      <td class="calc" id="anw-${key}-sdr-${idx}">${_fmtA(sdR, 1)}</td>
      <td class="calc" id="anw-${key}-sds-${idx}">${_fmtA(sdS, 1)}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="5" class="anw-muted" style="padding:12px;text-align:center;">Ustaw zakres dat, aby wygenerować miesiące</td></tr>`;

  return `
  <div class="anw-sec">
    <div class="anw-head ${headCls}"><span class="ico">${ico}</span><h3>${title}</h3>
      <span class="pill" style="background:var(--color-background-primary);border:1px solid var(--color-border-tertiary);color:var(--color-text-secondary);">φ = <b id="anw-${key}-phi">—</b></span></div>
    <div class="anw-body">
      <div class="anw-g3">
        <div class="anw-f"><label>Data od</label><input type="date" value="${P.from}" onchange="analOnDates('${key}','from',this.value)"></div>
        <div class="anw-f"><label>Data do</label><input type="date" value="${P.to}" onchange="analOnDates('${key}','to',this.value)"></div>
        ${key === 'after'
          ? `<div class="anw-f"><label>Tᵢ bazowa — okres analizowany [°C]</label><input type="number" step="0.1" value="${ANAL.after.baseTi != null ? ANAL.after.baseTi : ''}" placeholder="np. 20" oninput="ANAL.after.baseTi=this.value;_analRecalcLive()"></div>`
          : ''}
        <div class="anw-f"><label>${qLabel} — zużycie Qc.o. [<span class="anw-u">${ANAL.energy.unit}</span>]</label>
          <input type="number" step="0.001" value="${P.consumption}" placeholder="z faktur / ciepłomierza" oninput="ANAL.${key}.consumption=this.value;_analRecalcLive()"></div>
      </div>
      <table class="anw-t" style="margin-top:6px;">
        <thead><tr><th style="width:26%">Miesiąc</th><th>śr. temp. tₘₑ [°C]</th><th>dni z₀</th><th style="text-align:right">SD<span class="anw-tilab-${key}">${_ti}</span>_rzecz</th><th style="text-align:right">SD<span class="anw-tilab-${key}">${_ti}</span>_stand</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td>Suma</td><td></td><td class="calc" id="anw-${key}-days">—</td>
          <td class="calc" id="anw-${key}-sumr">—</td><td class="calc" id="anw-${key}-sums">—</td></tr></tfoot>
      </table>
      <div class="anw-note">φ = ∑SD<span class="anw-tilab-${key}">${_ti}</span>_stand / ∑SD<span class="anw-tilab-${key}">${_ti}</span>_rzecz · Qs = Qc.o.·φ → <b id="anw-${key}-qs">—</b> ${ANAL.energy.unit} (skorygowane)</div>
    </div>
  </div>`;
}

function _analRegInfo() {
  return `<div class="anw-sec"><div class="anw-head anw-gold"><span class="ico">📈</span><h3>Regresja liniowa</h3></div>
    <div class="anw-body" style="text-align:center;padding:36px 20px;color:var(--color-text-secondary);">
      <div style="font-size:42px;margin-bottom:10px;">📈</div>
      <strong>Arkusz regresji liniowej</strong>
      <div class="anw-muted" style="margin-top:6px;max-width:520px;margin-left:auto;margin-right:auto;">Metoda techniczna PRZED/PO (równania y = ax + b dla temperatury zasilania i zużycia). Arkusz zostanie podpięty do tego kreatora — przepływ typ → klient/obiekt → dane → wykonaj jest już wspólny.</div>
    </div></div>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ARKUSZ: Regresja liniowa (PRZED/PO) — szkielet wejść. Sama metoda obliczeniowa:
// do opisania (analiza zapisuje się jako SZKIC, bez kwot ESCO). Okres bazowy z
// arkusza regresji (RegressionBaseModule). Metoda 1 = wszystkie punkty (OLS),
// Metoda 2 = średnie per °C — dla OBU wielkości (zużycie + temp. zasilania).
// Okres analizowany: import CSV zapisywany w rekordzie analizy.
// ═══════════════════════════════════════════════════════════════════════════════
// Normalizacja zapisu jednostki na dokumentach (np. 'm3' → 'm³').
function _normUnitA(u){ u=String(u||''); return u.toLowerCase()==='m3'?'m³':u; }

function _analRegLineTxt(L) {
  if (!L || L.a == null || L.b == null) return '—';
  const a = Number(L.a), b = Number(L.b);
  return `y = ${_fmtA(a, 4)}·x ${b >= 0 ? '+ ' : '− '}${_fmtA(Math.abs(b), 2)}` + (L.n != null ? ` <span class="anw-muted">(n=${L.n})</span>` : '');
}

function _analRegSheet() {
  const reg = ANAL.reg || (ANAL.reg = { method: 'raw', baseLines: null, analyzed: { rows: [], fileName: '', from: '', to: '' }, billing: { from: '', to: '' } });
  const pid = ANAL.basePeriod;
  const bp = (window.RegressionBaseModule && pid) ? RegressionBaseModule.find(ANAL.objectId, pid) : null;
  const rowsCount = (window.RegressionBaseModule && pid) ? RegressionBaseModule.getRows(pid).length : 0;
  const m1 = reg.method === 'raw', m2 = reg.method === 'binned';
  const L = reg.baseLines;
  const an = reg.analyzed || {};
  const anN = (an.rows || []).length;
  // Zakres danych liczony odpornie z wierszy (naprawia stare zapisy z błędnym from/to z sortu tekstowego)
  let anFrom = an.from || '', anTo = an.to || '';
  if (anN && typeof _regTs === 'function') {
    let mn = Infinity, mx = -Infinity, f = '', t = '';
    (an.rows || []).forEach(r => { if (!r || !r.readTime) return; const ms = _regTs(r.readTime); if (ms == null) return; if (ms < mn) { mn = ms; f = r.readTime; } if (ms > mx) { mx = ms; t = r.readTime; } });
    if (f) { anFrom = f; anTo = t; }
  }
  const radio = (active, on, label) => `<label onclick="analRegSetMethod('${on}')" style="cursor:pointer;padding:8px 12px;border-radius:8px;border:1px solid ${active ? '#185FA5' : 'var(--color-border-tertiary)'};background:${active ? '#E6F1FB' : 'transparent'};font-size:13px;font-weight:${active ? '600' : '400'};">${label}</label>`;

  const baseBlock = `
    <div class="anw-sec">
      <div class="anw-head anw-blue"><span class="ico">📈</span><h3>Okres bazowy — regresja (PRZED)</h3></div>
      <div class="anw-body">
        <div class="anw-ctx" style="margin-bottom:12px;">
          <span>Okres bazowy: <b>${bp ? _escA(bp.number || ('REG ' + pid)) : '—'}</b></span>
          <span>Zakres: <b>${bp && (bp.periodFrom || bp.periodTo) ? _escA((bp.periodFrom || '?') + '–' + (bp.periodTo || '?')) : '—'}</b></span>
          <span>Odczytów (po selekcji): <b>${rowsCount}</b></span>
        </div>
        <div class="anw-f" style="max-width:560px;">
          <label>Metoda regresji (dotyczy obu wielkości: zużycie + temp. zasilania)</label>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px;">
            ${radio(m1, 'raw', 'Metoda 1 — wszystkie punkty')}
            ${radio(m2, 'binned', 'Metoda 2 — średnie per °C')}
          </div>
        </div>
        <div style="margin-top:12px;">
          <button class="small-button" style="font-size:13px;" ${rowsCount ? '' : 'disabled'} onclick="analRegCopyBase()">📥 Kopiuj dane z okresu bazowego</button>
        </div>
        ${L ? `
        ${(ANAL.basePeriod && L.periodId != null && String(L.periodId) !== String(ANAL.basePeriod)) ? `<div style="margin-top:10px;padding:8px 12px;border-radius:8px;background:#FFF6E5;border:1px solid #E8B84B;font-size:13px;color:#7a5200;">⚠️ Skopiowane linie bazowe pochodzą z <b>innego okresu bazowego</b> niż aktualnie wybrany. Kliknij „📥 Kopiuj dane z okresu bazowego", aby przeliczyć.</div>` : ''}
        <div class="anw-ctx" style="margin-top:12px;">
          <span>📉 Zużycie ciepła: <b>${_analRegLineTxt(L.cons)}</b></span>
          <span>🌡️ Temp. zasilania: <b>${_analRegLineTxt(L.sup)}</b></span>
          <span>Metoda: <b>${L.method === 'binned' ? '2 (średnie per °C)' : '1 (wszystkie punkty)'}</b></span>
        </div>` : `<div class="anw-muted" style="margin-top:8px;">Wybierz metodę i kliknij „Kopiuj dane", aby wczytać linie bazowe y = ax + b.</div>`}
      </div>
    </div>`;

  const anBlock = `
    <div class="anw-sec">
      <div class="anw-head anw-gold"><span class="ico">📥</span><h3>Okres analizowany (PO) — dane z czujników</h3></div>
      <div class="anw-body">
        <div class="anw-muted" style="margin-bottom:8px;">Import danych czasowych (CSV). Kolejność kolumn jak w arkuszu regresji: <code>readTime, tOutdoor, tSupply, tReturn, vFlow, heatPower, heatConsumption</code>. Dane zapisują się w analizie.</div>
        <input type="file" accept=".csv,text/csv" onchange="analRegImport(this)" style="font-size:13px;">
        ${anN ? `<div class="anw-ctx" style="margin-top:12px;">
          <span>Plik: <b>${_escA(an.fileName || '—')}</b></span>
          <span>Wierszy: <b>${anN}</b></span>
          <span>Zakres danych: <b>${_escA((anFrom || '?') + ' … ' + (anTo || '?'))}</b></span>
          <span><button class="small-button" onclick="analRegClearImport()" style="font-size:12px;color:#c00;border-color:#c00;">✕ Wyczyść</button></span>
        </div>` : `<div class="anw-muted" style="margin-top:8px;">Brak zaimportowanych danych okresu analizowanego.</div>`}
      </div>
    </div>`;

  const billBlock = `
    <div class="anw-sec">
      <div class="anw-head anw-blue"><span class="ico">🗓️</span><h3>Zakres okresu rozliczeniowego</h3></div>
      <div class="anw-body">
        <div class="anw-g3">
          <div class="anw-f"><label>Od (data i godzina)</label>
            <input type="datetime-local" value="${_escA(reg.billing.from || '')}" onchange="analRegSetBilling('from', this.value)"></div>
          <div class="anw-f"><label>Do (data i godzina)</label>
            <input type="datetime-local" value="${_escA(reg.billing.to || '')}" onchange="analRegSetBilling('to', this.value)"></div>
          <div class="anw-f"><label>&nbsp;</label>
            <div class="anw-muted">Zakres rozliczenia, dla którego liczona będzie analiza PRZED/PO.</div></div>
        </div>
      </div>
    </div>`;

  const tr = reg.tempRange || { from: -15, to: 10, step: 1 };
  const rangeBlock = `
    <div class="anw-sec">
      <div class="anw-head anw-blue"><span class="ico">🌡️</span><h3>Zakres temperatur — tabela zbiorcza i wykresy</h3></div>
      <div class="anw-body">
        <div class="anw-muted" style="margin-bottom:8px;">Tabela i wykresy budują się dla wybranego zakresu T zewnętrznej. Domyślnie −15…+10°C, krok 1°C — dostosuj wedle potrzeby.</div>
        <div class="anw-g3">
          <div class="anw-f"><label>Od [°C]</label>
            <input type="number" step="1" value="${tr.from != null ? tr.from : -15}" onchange="analRegSetTempRange('from', this.value)"></div>
          <div class="anw-f"><label>Do [°C]</label>
            <input type="number" step="1" value="${tr.to != null ? tr.to : 10}" onchange="analRegSetTempRange('to', this.value)"></div>
          <div class="anw-f"><label>Krok [°C]</label>
            <input type="number" step="0.5" min="0.1" value="${tr.step != null ? tr.step : 1}" onchange="analRegSetTempRange('step', this.value)"></div>
        </div>
      </div>
    </div>`;

  return baseBlock + anBlock + billBlock + rangeBlock;
}

function analRegSetTempRange(field, v) {
  if (!ANAL.reg) return;
  if (!ANAL.reg.tempRange) ANAL.reg.tempRange = { from: -15, to: 10, step: 1 };
  const n = Number(String(v).replace(',', '.'));
  if (field === 'step') { ANAL.reg.tempRange.step = (isFinite(n) && n > 0) ? n : 1; }
  else if (field === 'from' || field === 'to') { ANAL.reg.tempRange[field] = isFinite(n) ? n : (field === 'from' ? -15 : 10); }
  // jeśli wynik już policzony — przelicz pod nowy zakres
  if (ANAL.results && ANAL.results.model) { ANAL.results.model = _analRegModel(ANAL.reg);
    const slot = document.getElementById('anw-results'); if (slot) slot.innerHTML = _analRegResults(); }
}

function analRegSetMethod(m) {
  if (!ANAL.reg) return;
  ANAL.reg.method = (m === 'binned') ? 'binned' : 'raw';
  if (ANAL.reg.baseLines) analRegCopyBase(true);   // przelicz linie pod nową metodę
  else renderAnalysesModule();
}

function analRegCopyBase(silent) {
  const pid = ANAL.basePeriod;
  if (!pid || !window.RegressionBaseModule || typeof _regViews !== 'function') { if (!silent) alert('Brak okresu bazowego regresji.'); return; }
  if (!RegressionBaseModule.getRows(pid).length) { if (!silent) alert('Wybrany okres bazowy nie ma żadnych odczytów.'); return; }
  const method = ANAL.reg.method === 'binned' ? 'binned' : 'raw';
  // Linia bazowa liczona dla ZAKRESU okresu bazowego (periodFrom/periodTo protokołu) — to definiuje „okres wyliczeń" PRZED,
  // a nie cały zaimportowany plik. Dzięki temu baza i okres analizowany mogą pochodzić z tego samego pliku, ale różnych zakresów dat.
  const _sf = window._regBaseFrom, _st = window._regBaseTo;
  const _bp = (window.RegressionBaseModule && typeof RegressionBaseModule.find === 'function') ? RegressionBaseModule.find(ANAL.objectId, pid) : null;
  window._regBaseFrom = (_bp && _bp.periodFrom) ? _bp.periodFrom : '';
  window._regBaseTo = (_bp && _bp.periodTo) ? _bp.periodTo : '';
  let v = null;
  try { v = _regViews(pid); } catch (e) { v = null; }
  window._regBaseFrom = _sf; window._regBaseTo = _st;
  if (!v) { if (!silent) alert('Nie udało się policzyć regresji dla okresu bazowego.'); return; }
  const line = view => (view && view.fit && view.fit.a != null) ? { a: view.fit.a, b: view.fit.b, n: (view.pts ? view.pts.length : (view.fit.n != null ? view.fit.n : null)) } : null;
  ANAL.reg.baseLines = {
    method, periodId: pid,
    cons: line(v[method === 'binned' ? 'cons_binned' : 'cons_raw']),
    sup: line(v[method === 'binned' ? 'sup_binned' : 'sup_raw'])
  };
  renderAnalysesModule();
}

function _analRegParseCsvText(text) {
  const lines = String(text || '').trim().split(/\r?\n/);
  if (lines.length < 2) return { rows: [], err: 'Plik CSV jest pusty lub nie zawiera nagłówka.' };
  const delim = lines[0].indexOf(';') >= 0 ? ';' : (lines[0].indexOf('\t') >= 0 ? '\t' : ',');
  const num = s => { s = (s || '').trim().replace(/\s/g, '').replace(',', '.'); return (s !== '' && !isNaN(Number(s))) ? Number(s) : null; };
  const firstCells = lines[0].split(delim);
  const hasHeader = firstCells.length > 1 && num(firstCells[1]) === null;
  const startIdx = hasHeader ? 1 : 0;
  const rows = [];
  for (let i = startIdx; i < lines.length; i++) {
    const cells = lines[i].split(delim);
    if (cells.length < 2) continue;
    rows.push({
      readTime: (cells[0] || '').trim() || null,
      tOutdoor: num(cells[1]), tSupply: num(cells[2]), tReturn: num(cells[3]),
      vFlow: num(cells[4]), heatPower: num(cells[5]), heatConsumption: num(cells[6])
    });
  }
  return { rows };
}

function analRegImport(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (ext !== 'csv') { alert('Na teraz wspierany jest import CSV (jak w „Dane z czujników"). Zapisz Excel jako CSV i spróbuj ponownie.'); input.value = ''; return; }
  const reader = new FileReader();
  reader.onload = function (e) {
    const res = _analRegParseCsvText(e.target.result);
    if (res.err) { alert(res.err); input.value = ''; return; }
    if (!res.rows.length) { alert('Nie znaleziono wierszy danych w pliku.'); input.value = ''; return; }
    const valid = res.rows.map(r => r.readTime).filter(Boolean);
    let from = '', to = '', minMs = Infinity, maxMs = -Infinity;
    valid.forEach(rt => {
      const ms = (typeof _regTs === 'function') ? _regTs(rt) : null;
      if (ms == null) return;
      if (ms < minMs) { minMs = ms; from = rt; }
      if (ms > maxMs) { maxMs = ms; to = rt; }
    });
    if (from === '' && valid.length) { const s = valid.slice().sort(); from = s[0]; to = s[s.length - 1]; }   // awaryjnie, gdy dat nie da się sparsować
    ANAL.reg.analyzed = { rows: res.rows, fileName: file.name, from: from, to: to };
    // #3 — okres rozliczeniowy bierzemy wprost z zakresu danych pliku (PO — dane z czujników)
    if (isFinite(minMs) && isFinite(maxMs)) {
      const toLocal = ms => { const d = new Date(ms), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };
      if (!ANAL.reg.billing) ANAL.reg.billing = { from: '', to: '' };
      ANAL.reg.billing.from = toLocal(minMs);
      ANAL.reg.billing.to = toLocal(maxMs);
    }
    renderAnalysesModule();
    alert('Zaimportowano ' + res.rows.length + ' wierszy okresu analizowanego.');
  };
  reader.onerror = function () { alert('Nie udało się odczytać pliku.'); };
  reader.readAsText(file);
  input.value = '';
}

function analRegClearImport() {
  if (ANAL.reg) ANAL.reg.analyzed = { rows: [], fileName: '', from: '', to: '' };
  renderAnalysesModule();
}

function analRegSetBilling(which, v) {
  if (!ANAL.reg) return;
  if (which === 'from') ANAL.reg.billing.from = v || '';
  else if (which === 'to') ANAL.reg.billing.to = v || '';
}

// ── Model PRZED/PO wg arkusza referencyjnego (Regresja liniowa PREMIUM) ──
// B „Tryb pogodowy" = regresja okresu bazowego; C „WaterAI" = regresja okresu analizowanego.
// Dla T zewn. −15…+10°C: D = ((B−C)/B)·100 [%], E = B−C, plus średnie. Osobno: zużycie i temp. zasilania.
function _analRegFitLine(rows, metric, method) {
  let pts;
  if (metric === 'sup') {
    pts = (rows || []).filter(r => r && r.tOutdoor != null && r.tSupply != null).map(r => ({ x: +r.tOutdoor, y: +r.tSupply }));
  } else {
    const chrono = (rows || []).filter(r => r && r.heatConsumption != null && r.readTime)
      .map((r, i) => ({ r, i }))
      .sort((A, B) => { const am = _regTs(A.r.readTime), bm = _regTs(B.r.readTime); return (am == null ? 0 : am) - (bm == null ? 0 : bm); });
    const dl = (typeof _consDeltas === 'function') ? _consDeltas(chrono.map(o => Object.assign({}, o.r, { _idx: o.i }))) : [];
    pts = dl.map(p => ({ x: p.x, y: p.y }));
  }
  if (pts.length < 2) return null;
  if (method === 'binned' && typeof _binnedFit === 'function') {
    const b = _binnedFit(pts); if (b && b.fit && b.fit.a != null) return { a: b.fit.a, b: b.fit.b, n: pts.length };
  }
  const f = (typeof _olsFit === 'function') ? _olsFit(pts) : null;
  return (f && f.a != null) ? { a: f.a, b: f.b, n: pts.length } : null;
}

function _analRegModel(reg) {
  if (!reg || !reg.baseLines) return null;
  const method = reg.method === 'binned' ? 'binned' : 'raw';
  const allRows = (reg.analyzed && reg.analyzed.rows) || [];
  // WaterAI liczone TYLKO dla okresu analizowanego (= 🗓️ Zakres okresu rozliczeniowego), a nie z całego pliku.
  const _pms = s => { const ms = s ? Date.parse(s) : NaN; return isFinite(ms) ? ms : null; };
  const bf = _pms(reg.billing && reg.billing.from);
  const bt = _pms(reg.billing && reg.billing.to);
  const rows = (bf == null && bt == null) ? allRows : allRows.filter(r => {
    const ms = (r && r.readTime && typeof _regTs === 'function') ? _regTs(r.readTime) : null;
    if (ms == null) return false;
    if (bf != null && ms < bf) return false;
    if (bt != null && ms > bt) return false;
    return true;
  });
  const waterai = { cons: _analRegFitLine(rows, 'cons', method), sup: _analRegFitLine(rows, 'sup', method), nRows: rows.length, nAll: allRows.length };
  // Zakres temperatur do tabeli/wykresów — swobodnie wybierany (domyślnie −15…+10°C, krok 1).
  const tr = reg.tempRange || {};
  let T0 = Number(tr.from); if (!isFinite(T0)) T0 = -15;
  let T1 = Number(tr.to);   if (!isFinite(T1)) T1 = 10;
  let step = Number(tr.step); if (!isFinite(step) || step <= 0) step = 1;
  if (T1 < T0) { const t = T0; T0 = T1; T1 = t; }
  if ((T1 - T0) / step > 400) step = (T1 - T0) / 400;   // limit liczby wierszy tabeli
  const build = (base, wai) => {
    if (!base || !wai || base.a == null || wai.a == null) return null;
    const tab = []; let sumD = 0, sumE = 0, nD = 0;
    for (let t = T0; t <= T1 + 1e-9; t += step) {
      const tt = Math.round(t * 100) / 100;
      const B = base.a * tt + base.b, C = wai.a * tt + wai.b;
      const D = (B !== 0) ? ((B - C) / B) * 100 : null, E = B - C;
      tab.push({ t: tt, B, C, D, E });
      if (D != null && isFinite(D)) { sumD += D; nD++; }
      sumE += E;
    }
    return { base, waterai: wai, rows: tab, avgPct: nD ? sumD / nD : null, avgDiff: tab.length ? sumE / tab.length : null };
  };
  return { method, range: { from: T0, to: T1, step: step }, cons: build(reg.baseLines.cons, waterai.cons), sup: build(reg.baseLines.sup, waterai.sup), waterai };
}

function _analRegChartSvg(title, m, yLabel) {
  const rows = m.rows, xs = rows.map(r => r.t), ys = rows.flatMap(r => [r.B, r.C]);
  const xmin = Math.min.apply(null, xs), xmax = Math.max.apply(null, xs);
  let ymin = Math.min.apply(null, ys), ymax = Math.max.apply(null, ys);
  if (ymin === ymax) { ymin -= 1; ymax += 1; }
  const padY = (ymax - ymin) * 0.08; ymin -= padY; ymax += padY;
  const W = 580, H = 300, L = 66, R = 18, T = 30, Bm = 52;
  const xspan = (xmax - xmin) || 1, yspan = (ymax - ymin) || 1;
  const px = t => L + (t - xmin) / xspan * (W - L - R);
  const py = v => T + (1 - (v - ymin) / yspan) * (H - T - Bm);
  const poly = key => rows.map(r => `${px(r.t).toFixed(1)},${py(r[key]).toFixed(1)}`).join(' ');
  let grid = '';
  for (let i = 0; i <= 4; i++) { const v = ymin + yspan * i / 4, y = py(v);
    grid += `<line x1="${L}" y1="${y.toFixed(1)}" x2="${W - R}" y2="${y.toFixed(1)}" stroke="#e6eaef" stroke-width="1"/><text x="${L - 6}" y="${(y + 3).toFixed(1)}" text-anchor="end" font-size="9" fill="#7a8794">${_fmtA(v, 1)}</text>`; }
  let xlab = '';
  const xstep = xspan > 30 ? 10 : (xspan > 12 ? 5 : (xspan > 4 ? 2 : 1));
  for (let t = Math.ceil(xmin / xstep) * xstep; t <= xmax + 1e-9; t += xstep) { const x = px(t);
    xlab += `<line x1="${x.toFixed(1)}" y1="${H - Bm}" x2="${x.toFixed(1)}" y2="${H - Bm + 4}" stroke="#9aa5b1"/><text x="${x.toFixed(1)}" y="${H - Bm + 16}" text-anchor="middle" font-size="9" fill="#7a8794">${t}</text>`; }
  const cx = (L + (W - R)) / 2, cy = (T + (H - Bm)) / 2;
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;height:auto;background:#fff;border:1px solid var(--color-border-tertiary);border-radius:8px;">
    <text x="${L}" y="18" font-size="12" font-weight="600" fill="#0C447C">${title}</text>
    ${grid}${xlab}
    <line x1="${L}" y1="${T}" x2="${L}" y2="${H - Bm}" stroke="#9aa5b1"/>
    <line x1="${L}" y1="${H - Bm}" x2="${W - R}" y2="${H - Bm}" stroke="#9aa5b1"/>
    <polyline points="${poly('B')}" fill="none" stroke="#9aa5b1" stroke-width="2.5"/>
    <polyline points="${poly('C')}" fill="none" stroke="#1E7B34" stroke-width="2.5"/>
    <text x="${cx.toFixed(0)}" y="${H - 22}" text-anchor="middle" font-size="11" font-weight="600" fill="#5b6670">Temperatura zewnętrzna [°C]</text>
    <text x="16" y="${cy.toFixed(0)}" text-anchor="middle" font-size="11" font-weight="600" fill="#5b6670" transform="rotate(-90 16 ${cy.toFixed(0)})">${yLabel || ''}</text>
    <g font-size="10"><rect x="${L + 4}" y="${T + 2}" width="12" height="3" fill="#9aa5b1"/><text x="${L + 20}" y="${T + 6}" fill="#5b6670">Tryb pogodowy (baza)</text>
      <rect x="${L + 160}" y="${T + 2}" width="12" height="3" fill="#1E7B34"/><text x="${L + 176}" y="${T + 6}" fill="#5b6670">WaterAI (po)</text></g>
  </svg>`;
}

function _analRegTableHtml(m, valueLabel, unit) {
  const td = 'padding:3px 8px;font-size:11px;border-bottom:0.5px solid var(--color-border-tertiary);text-align:right;';
  const th = 'padding:5px 8px;font-size:11px;font-weight:600;color:#0C447C;text-align:right;border-bottom:1px solid var(--color-border-tertiary);';
  const dec = (String(unit).indexOf('MJ') >= 0) ? 2 : 1;
  const body = m.rows.map(r => `<tr>
      <td style="${td}text-align:center;">${r.t}</td>
      <td style="${td}">${_fmtA(r.B, dec)}</td>
      <td style="${td}">${_fmtA(r.C, dec)}</td>
      <td style="${td}color:#1E7B34;font-weight:600;">${r.D != null && isFinite(r.D) ? _fmtA(r.D, 1) + '%' : '—'}</td>
      <td style="${td}">${_fmtA(r.E, dec)}</td></tr>`).join('');
  const rng = m.range ? `${m.range.from}…${m.range.to}°C` : '';
  return `<details open style="margin-top:8px;"><summary style="cursor:pointer;font-size:12px;color:#0C447C;font-weight:600;">Tabela zbiorcza (${rng})</summary>
    <table style="width:100%;border-collapse:collapse;margin-top:6px;">
      <thead><tr>
        <th style="${th}text-align:center;">T zewn. [°C]</th>
        <th style="${th}">Tryb pogodowy — ${valueLabel} [${unit}]</th>
        <th style="${th}">WaterAI — ${valueLabel} [${unit}]</th>
        <th style="${th}">Obniżenie [%]</th>
        <th style="${th}">Różnica [${unit}]</th></tr></thead>
      <tbody>${body}</tbody>
      <tfoot><tr style="background:var(--color-background-secondary);font-weight:700;">
        <td style="${td}text-align:center;">Średnia</td><td style="${td}">—</td><td style="${td}">—</td>
        <td style="${td}color:#1E7B34;">${m.avgPct != null ? _fmtA(m.avgPct, 1) + '%' : '—'}</td>
        <td style="${td}">${m.avgDiff != null ? _fmtA(m.avgDiff, dec) : '—'}</td></tr></tfoot>
    </table></details>`;
}

function _analRegResultsHtml(reg, model, opts) {
  opts = opts || {};
  if (!model || !model.cons || !model.sup) {
    return `<div class="reminder-card" style="border-left:4px solid #c0392b;"><strong>Nie udało się policzyć analizy</strong>
      <div class="reminder-meta">Upewnij się, że okres bazowy ma policzone linie (przycisk „Kopiuj dane", Metoda 1/2) i że zaimportowany okres analizowany ma kolumny temperatury zewnętrznej, zasilania oraz zużycia.</div></div>`;
  }
  const c = model.cons, s = model.sup;
  if (model.range) { c.range = model.range; s.range = model.range; }
  const card = (val, unit, label, color) => `<div style="flex:1;min-width:150px;background:var(--color-background-secondary);border:1px solid var(--color-border-tertiary);border-radius:10px;padding:12px 16px;">
      <div style="font-size:24px;font-weight:700;color:${color};">${val}${unit}</div>
      <div style="font-size:11px;color:var(--color-text-secondary);margin-top:2px;">${label}</div></div>`;
  const headline = `<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:6px;">
      ${card(c.avgPct != null ? c.avgPct.toFixed(1) : '—', '%', 'średnie obniżenie zużycia ciepła', '#1E7B34')}
      ${card(s.avgPct != null ? s.avgPct.toFixed(1) : '—', '%', 'średnie obniżenie temp. zasilania', '#185FA5')}
      ${card(s.avgDiff != null ? s.avgDiff.toFixed(2) : '—', ' °C', 'średnia różnica temp. zasilania', '#B9770E')}
    </div>`;
  const saveBtn = opts.withSave ? `<div class="anw-act" style="margin-top:18px;"><button class="anw-run" onclick="analRegSave()">💾 Zapisz analizę</button></div>` : '';
  const eqStrip = `<div class="anw-ctx" style="margin:10px 0 4px;">
      <span>📉 Zużycie — Tryb pogodowy: <b>${_analRegLineTxt(c.base)}</b> &nbsp;·&nbsp; WaterAI: <b>${_analRegLineTxt(c.waterai)}</b></span>
      <span>🌡️ T zasilania — Tryb pogodowy: <b>${_analRegLineTxt(s.base)}</b> &nbsp;·&nbsp; WaterAI: <b>${_analRegLineTxt(s.waterai)}</b></span>
    </div>`;
  const rngTxt = model.range ? `${model.range.from}…${model.range.to}°C (krok ${model.range.step}°C)` : '−15…+10°C';
  const wN = model.waterai || {};
  const billTxt = (reg && reg.billing && (reg.billing.from || reg.billing.to))
    ? `${(reg.billing.from || '?').replace('T', ' ')} → ${(reg.billing.to || '?').replace('T', ' ')}` : 'cały plik';
  const subsetNote = (wN.nRows != null && wN.nAll != null)
    ? ` WaterAI policzono z <b>${wN.nRows}</b> z ${wN.nAll} odczytów (okres analizowany: ${billTxt}).` : '';
  return `<div class="anw-sec" style="margin-top:16px;">
      <div class="anw-head anw-gold"><span class="ico">📈</span><h3>Wynik analizy regresji (PRZED / PO)</h3></div>
      <div class="anw-body">
        ${headline}
        ${eqStrip}
        <div style="margin-top:14px;">${_analRegChartSvg('📉 Zużycie ciepła — Tryb pogodowy vs WaterAI', c, 'Zużycie ciepła [MJ]')}${_analRegTableHtml(c, 'zużycie', 'MJ')}</div>
        <div style="margin-top:18px;">${_analRegChartSvg('🌡️ Temperatura zasilania — Tryb pogodowy vs WaterAI', s, 'T zasilania [°C]')}${_analRegTableHtml(s, 'T zasilania', '°C')}</div>
        <div class="anw-muted" style="margin-top:10px;font-size:11px;">Metoda ${model.method === 'binned' ? '2 (średnie per °C)' : '1 (wszystkie punkty)'}. <b>Tryb pogodowy</b> = regresja <b>okresu bazowego</b> (zakres okresu bazowego); <b>WaterAI</b> = regresja <b>okresu analizowanego (PO) — dane z czujników</b>.${subsetNote} Obniżenie liczone w zakresie ${rngTxt}.</div>
        ${saveBtn}
      </div>
    </div>`;
}

// Punkty pomiarowe (chmura) danej metryki z podanych wierszy — ta sama logika co dopasowanie linii.
function _analRegPtsFromRows(rows, metric) {
  if (metric === 'sup') {
    return (rows || []).filter(r => r && r.tOutdoor != null && r.tSupply != null).map(r => ({ x: +r.tOutdoor, y: +r.tSupply }));
  }
  const chrono = (rows || []).filter(r => r && r.heatConsumption != null && r.readTime)
    .map((r, i) => ({ r, i }))
    .sort((A, B) => { const am = (typeof _regTs === 'function') ? _regTs(A.r.readTime) : 0, bm = (typeof _regTs === 'function') ? _regTs(B.r.readTime) : 0; return (am == null ? 0 : am) - (bm == null ? 0 : bm); });
  return (typeof _consDeltas === 'function') ? _consDeltas(chrono.map(o => Object.assign({}, o.r, { _idx: o.i }))).map(p => ({ x: p.x, y: p.y })) : [];
}

// Zestawy punktów PRZED (baza) i PO (WaterAI) dla scatter-plotów zużycia i temperatury zasilania.
function _analRegScatterSets(a, reg, model) {
  const out = { cons: { base: [], wai: [] }, sup: { base: [], wai: [] } };
  const allRows = (reg.analyzed && reg.analyzed.rows) || [];
  const bf = (reg.billing && reg.billing.from && typeof _regTs === 'function') ? _regTs(reg.billing.from) : null;
  const bt = (reg.billing && reg.billing.to && typeof _regTs === 'function') ? _regTs(reg.billing.to) : null;
  const waiRows = (bf == null && bt == null) ? allRows : allRows.filter(r => {
    const ms = (r && r.readTime && typeof _regTs === 'function') ? _regTs(r.readTime) : null;
    if (ms == null) return false;
    if (bf != null && ms < bf) return false;
    if (bt != null && ms > bt) return false;
    return true;
  });
  out.cons.wai = _analRegPtsFromRows(waiRows, 'cons');
  out.sup.wai = _analRegPtsFromRows(waiRows, 'sup');
  const pid = reg.baseLines ? reg.baseLines.periodId : null;
  if (pid != null && typeof _regViews === 'function' && window.RegressionBaseModule) {
    let bpp = null; try { bpp = RegressionBaseModule.find(a.objectId, pid); } catch (e) {}
    const sf = window._regBaseFrom, st = window._regBaseTo;
    window._regBaseFrom = (bpp && bpp.periodFrom) ? bpp.periodFrom : '';
    window._regBaseTo = (bpp && bpp.periodTo) ? bpp.periodTo : '';
    try {
      const v = _regViews(pid);
      out.cons.base = (v.cons_raw && v.cons_raw.pts) ? v.cons_raw.pts.map(p => ({ x: p.x, y: p.y })) : [];
      out.sup.base = (v.sup_raw && v.sup_raw.pts) ? v.sup_raw.pts.map(p => ({ x: p.x, y: p.y })) : [];
    } catch (e) {}
    window._regBaseFrom = sf; window._regBaseTo = st;
  }
  return out;
}

// Próbkowanie punktów dla wydajności renderu SVG (chmura bywa tysiącami odczytów).
function _analRegSub(pts, max) {
  if (!pts || pts.length <= max) return pts || [];
  const step = pts.length / max, out = [];
  for (let i = 0; i < pts.length; i += step) out.push(pts[Math.floor(i)]);
  return out;
}

// Scatter: chmura punktów PRZED/PO + obie linie regresji (jak w arkuszu referencyjnym).
function _analRegScatterSvg(title, basePts, waiPts, baseLine, waiLine, yLabel) {
  basePts = basePts || []; waiPts = waiPts || [];
  // Okno WIDOCZNOŚCI wykresu: rysujemy tylko odczyty do 20 °C (sezon grzewczy).
  // Dopasowanie prostych (równania, n) pozostaje liczone na wszystkich punktach — to wyłącznie prezentacja.
  const XCAP = 20;
  const _cf = pts => pts.filter(p => p.x <= XCAP);
  const bpC = _cf(basePts), wpC = _cf(waiPts);
  const trimmed = (bpC.length + wpC.length) < (basePts.length + waiPts.length);
  if (bpC.length + wpC.length > 0) { basePts = bpC; waiPts = wpC; }
  const capNote = trimmed ? `<div class="anw-muted" style="font-size:11px;margin-top:4px;">Wykres przedstawia zakres temperatur zewnętrznych do ${XCAP} °C; dopasowanie prostych wykonano na wszystkich punktach pomiarowych okresu (wartości n przy równaniach).</div>` : '';
  const all = basePts.concat(waiPts);
  if (all.length < 1) return `<div class="anw-muted" style="font-size:11px;margin-top:6px;">Brak zapisanych punktów pomiarowych do wykresu „${_escA(title)}".</div>`;
  let xmin = Math.min.apply(null, all.map(p => p.x)), xmax = Math.max.apply(null, all.map(p => p.x));
  let ymin = Math.min.apply(null, all.map(p => p.y)), ymax = Math.max.apply(null, all.map(p => p.y));
  if (xmin === xmax) { xmin -= 1; xmax += 1; }
  if (ymin === ymax) { ymin -= 1; ymax += 1; }
  const padY = (ymax - ymin) * 0.08; ymin -= padY; ymax += padY;
  const W = 580, H = 320, L = 60, R = 16, T = 30, Bm = 54;
  const xspan = (xmax - xmin) || 1, yspan = (ymax - ymin) || 1;
  const px = t => L + (t - xmin) / xspan * (W - L - R);
  const py = v => T + (1 - (v - ymin) / yspan) * (H - T - Bm);
  let grid = '';
  for (let i = 0; i <= 4; i++) { const val = ymin + yspan * i / 4, y = py(val);
    grid += `<line x1="${L}" y1="${y.toFixed(1)}" x2="${W - R}" y2="${y.toFixed(1)}" stroke="#e6eaef"/><text x="${L - 6}" y="${(y + 3).toFixed(1)}" text-anchor="end" font-size="9" fill="#7a8794">${val.toFixed(0)}</text>`; }
  let xlab = '';
  const xstep = xspan > 30 ? 10 : (xspan > 12 ? 5 : (xspan > 4 ? 2 : 1));
  for (let t = Math.ceil(xmin / xstep) * xstep; t <= xmax + 1e-9; t += xstep) { const x = px(t);
    xlab += `<line x1="${x.toFixed(1)}" y1="${H - Bm}" x2="${x.toFixed(1)}" y2="${H - Bm + 4}" stroke="#9aa5b1"/><text x="${x.toFixed(1)}" y="${H - Bm + 16}" text-anchor="middle" font-size="9" fill="#7a8794">${t}</text>`; }
  const dots = (pts, color) => _analRegSub(pts, 700).map(p => `<circle cx="${px(p.x).toFixed(1)}" cy="${py(p.y).toFixed(1)}" r="2" fill="${color}" fill-opacity="0.45"/>`).join('');
  const seg = (Ln, dash) => { if (!Ln || Ln.a == null) return '';
    const y1 = Ln.a * xmin + Ln.b, y2 = Ln.a * xmax + Ln.b;
    return `<line x1="${px(xmin).toFixed(1)}" y1="${py(y1).toFixed(1)}" x2="${px(xmax).toFixed(1)}" y2="${py(y2).toFixed(1)}" stroke="#1a1a1a" stroke-width="2.2" ${dash ? 'stroke-dasharray="7 5"' : ''}/>`; };
  const cx = (L + (W - R)) / 2, cy = (T + (H - Bm)) / 2;
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;height:auto;background:#fff;border:1px solid var(--color-border-tertiary);border-radius:8px;">
    <text x="${L}" y="18" font-size="12" font-weight="600" fill="#0C447C">${title}</text>
    ${grid}${xlab}
    <line x1="${L}" y1="${T}" x2="${L}" y2="${H - Bm}" stroke="#9aa5b1"/>
    <line x1="${L}" y1="${H - Bm}" x2="${W - R}" y2="${H - Bm}" stroke="#9aa5b1"/>
    ${dots(basePts, '#3F7FBF')}${dots(waiPts, '#E08A3C')}
    ${seg(baseLine, false)}${seg(waiLine, true)}
    <text x="${cx.toFixed(0)}" y="${H - 18}" text-anchor="middle" font-size="11" font-weight="600" fill="#5b6670">Temperatura zewnętrzna [°C]</text>
    <text x="14" y="${cy.toFixed(0)}" text-anchor="middle" font-size="11" font-weight="600" fill="#5b6670" transform="rotate(-90 14 ${cy.toFixed(0)})">${yLabel || ''}</text>
    <g font-size="10">
      <circle cx="${L + 8}" cy="${T + 4}" r="3" fill="#3F7FBF" fill-opacity="0.6"/><text x="${L + 16}" y="${T + 7}" fill="#5b6670">Tryb pogodowy (PRZED)</text>
      <circle cx="${L + 158}" cy="${T + 4}" r="3" fill="#E08A3C" fill-opacity="0.7"/><text x="${L + 166}" y="${T + 7}" fill="#5b6670">WaterAI (PO)</text>
      <line x1="${L + 270}" y1="${T + 4}" x2="${L + 288}" y2="${T + 4}" stroke="#1a1a1a" stroke-width="2"/><text x="${L + 292}" y="${T + 7}" fill="#5b6670">linia PRZED</text>
      <line x1="${L + 372}" y1="${T + 4}" x2="${L + 390}" y2="${T + 4}" stroke="#1a1a1a" stroke-width="2" stroke-dasharray="5 4"/><text x="${L + 394}" y="${T + 7}" fill="#5b6670">linia PO</text>
    </g>
  </svg>${capNote}`;
}

// Wykres słupkowy redukcji (% obniżenia) danej metryki dla każdego stopnia temperatury zewnętrznej.
function _analRegReductionSvg(title, m) {
  const rows = (m && m.rows) || [];
  if (!rows.length) return '';
  const W = 580, H = 300, L = 56, R = 16, T = 30, Bm = 52;
  const ds = rows.map(r => (r.D != null && isFinite(r.D)) ? r.D : 0);
  let ymax = Math.max.apply(null, ds.concat([0])), ymin = Math.min.apply(null, ds.concat([0]));
  if (ymax === ymin) { ymax += 1; ymin -= 1; }
  const pad = (ymax - ymin) * 0.1; ymax += pad; ymin -= pad;
  const xs = rows.map(r => r.t), xmin = Math.min.apply(null, xs), xmax = Math.max.apply(null, xs);
  const xspan = (xmax - xmin) || 1, yspan = (ymax - ymin) || 1;
  const px = t => L + (t - xmin) / xspan * (W - L - R);
  const py = v => T + (1 - (v - ymin) / yspan) * (H - T - Bm);
  const bw = Math.max(2, (W - L - R) / rows.length * 0.7);
  const y0 = py(0);
  let grid = '';
  for (let i = 0; i <= 4; i++) { const val = ymin + yspan * i / 4, y = py(val);
    grid += `<line x1="${L}" y1="${y.toFixed(1)}" x2="${W - R}" y2="${y.toFixed(1)}" stroke="#e6eaef"/><text x="${L - 6}" y="${(y + 3).toFixed(1)}" text-anchor="end" font-size="9" fill="#7a8794">${val.toFixed(0)}%</text>`; }
  let xlab = '';
  const xstep = xspan > 30 ? 10 : (xspan > 12 ? 5 : (xspan > 4 ? 2 : 1));
  for (let t = Math.ceil(xmin / xstep) * xstep; t <= xmax + 1e-9; t += xstep) { const x = px(t);
    xlab += `<line x1="${x.toFixed(1)}" y1="${H - Bm}" x2="${x.toFixed(1)}" y2="${H - Bm + 4}" stroke="#9aa5b1"/><text x="${x.toFixed(1)}" y="${H - Bm + 16}" text-anchor="middle" font-size="9" fill="#7a8794">${t}</text>`; }
  const bars = rows.map(r => { const d = (r.D != null && isFinite(r.D)) ? r.D : 0; const x = px(r.t) - bw / 2; const yv = py(d);
    const top = Math.min(yv, y0), h = Math.max(0.5, Math.abs(yv - y0));
    return `<rect x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" fill="${d >= 0 ? '#1E7B34' : '#C0392B'}" fill-opacity="0.85"/>`; }).join('');
  const cx = (L + (W - R)) / 2, cy = (T + (H - Bm)) / 2;
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;height:auto;background:#fff;border:1px solid var(--color-border-tertiary);border-radius:8px;">
    <text x="${L}" y="18" font-size="12" font-weight="600" fill="#0C447C">${title}</text>
    ${grid}${xlab}${bars}
    <line x1="${L}" y1="${y0.toFixed(1)}" x2="${W - R}" y2="${y0.toFixed(1)}" stroke="#9aa5b1"/>
    <line x1="${L}" y1="${T}" x2="${L}" y2="${H - Bm}" stroke="#9aa5b1"/>
    <text x="${cx.toFixed(0)}" y="${H - 18}" text-anchor="middle" font-size="11" font-weight="600" fill="#5b6670">Temperatura zewnętrzna [°C]</text>
    <text x="14" y="${cy.toFixed(0)}" text-anchor="middle" font-size="11" font-weight="600" fill="#5b6670" transform="rotate(-90 14 ${cy.toFixed(0)})">Redukcja [%]</text>
  </svg>`;
}

// Pełny raport regresji w stylu raportu ESCO (TYM): okładka + numerowane sekcje z opisem.
function _analRegReportBody(a, reg, model, o, embedded, bannerHTML) {
  const _pfx=embedded?'B.':'';
  if (!model || !model.cons || !model.sup) {
    return `<div class="reminder-card" style="border-left:4px solid #c0392b;"><strong>Nie udało się odtworzyć analizy regresji</strong>
      <div class="reminder-meta">Brak policzonych linii bazowych lub danych okresu analizowanego. Otwórz analizę w kreatorze i uzupełnij dane (Metoda 1/2 + import CSV okresu analizowanego).</div></div>`;
  }
  const c = model.cons, s = model.sup;
  if (model.range) { c.range = model.range; s.range = model.range; }
  const number = (window.AnalysesModule && AnalysesModule.getNumber) ? (AnalysesModule.getNumber(a.id) || ('A/#' + a.id)) : ('A/#' + a.id);
  const cl = (window.ClientsModule) ? ClientsModule.find(a.clientId) : null;
  const genDate = _fmtDateA(new Date().toISOString().slice(0, 10));
  const pid = reg.baseLines ? reg.baseLines.periodId : null;
  let bp = null; try { bp = (window.RegressionBaseModule && pid != null) ? RegressionBaseModule.find(a.objectId, pid) : null; } catch (e) {}
  const baseFrom = bp && bp.periodFrom ? String(bp.periodFrom).slice(0, 10) : '';
  const baseTo = bp && bp.periodTo ? String(bp.periodTo).slice(0, 10) : '';
  const poFrom = (reg.billing && reg.billing.from) ? String(reg.billing.from).slice(0, 10) : ((reg.analyzed && reg.analyzed.from) ? String(reg.analyzed.from).slice(0, 10) : '');
  const poTo = (reg.billing && reg.billing.to) ? String(reg.billing.to).slice(0, 10) : ((reg.analyzed && reg.analyzed.to) ? String(reg.analyzed.to).slice(0, 10) : '');
  const pct = c.avgPct;
  const pos = (pct == null) || pct >= 0;
  const methodTxt = model.method === 'binned'
    ? 'Metoda 2 — dopasowanie do średnich wartości na każdy zaokrąglony stopień temperatury zewnętrznej (jak linia trendu w arkuszu referencyjnym)'
    : 'Metoda 1 — dopasowanie do wszystkich punktów pomiarowych';
  const rngTxt = model.range ? `${model.range.from}…${model.range.to} °C (krok ${model.range.step} °C)` : '−15…+10 °C';
  const rngShort = model.range ? `${model.range.from}…${model.range.to} °C` : '−15…+10 °C';
  const wN = model.waterai || {};
  const subsetNote = (wN.nRows != null && wN.nAll != null)
    ? ` Linię WaterAI wyznaczono z <b>${wN.nRows}</b> odczytów mieszczących się w zadeklarowanym okresie rozliczeniowym — z <b>${wN.nAll}</b> wszystkich odczytów w zaimportowanym pliku CSV (pozostałe leżą poza tym okresem i nie są uwzględniane).` : '';
  let sc = { cons: { base: [], wai: [] }, sup: { base: [], wai: [] } };
  try { sc = _analRegScatterSets(a, reg, model); } catch (e) {}
  return `
  <div class="anw-cover${embedded?' anw-cover-embed':''}">
    ${bannerHTML||''}
    ${embedded?'':`<div class="anw-cover-top">
      <img src="logo-waterai.png" alt="WaterAI" class="anw-cover-logo" />
      <div class="anw-cover-num"><div class="anw-cover-num-lbl">Nr analizy</div><div class="anw-cover-num-val">${_escA(number)}</div></div>
    </div>
    <div class="anw-cover-title">
      <div class="anw-cover-kicker">Raport ESCO · Analiza techniczna</div>
      <h1>Analiza techniczna — regresja liniowa</h1>
      <div class="anw-cover-method">Porównanie parametrów pracy obiektu PRZED / PO wdrożeniu wg równań y = a·x + b</div>
    </div>`}
    <div class="anw-cover-meta">
      ${embedded?`<div class="anw-cover-meta-card"><div class="anw-cm-lbl">Nr analizy</div><div class="anw-cm-val">${_escA(number)}</div><div class="anw-cm-sub">Wykonał: ${_escA(a.author || '—')} · ${_fmtDateA(a.executedAt)}</div></div>`:`<div class="anw-cover-meta-card"><div class="anw-cm-lbl">Dla kogo</div><div class="anw-cm-val">${_escA((cl && cl.name) || '—')}</div><div class="anw-cm-sub">Obiekt: ${_escA((o && o.name) || '—')}</div></div>
      <div class="anw-cover-meta-card"><div class="anw-cm-lbl">Wykonał — Energy Analyst</div><div class="anw-cm-val">${_escA(a.author || '—')}</div><div class="anw-cm-sub">Data wykonania: ${_fmtDateA(a.executedAt)}</div></div>`}
      <div class="anw-cover-meta-card"><div class="anw-cm-lbl">Okres bazowy (PRZED)</div><div class="anw-cm-val anw-cm-period">${baseFrom ? _fmtDateA(baseFrom) : '—'} → ${baseTo ? _fmtDateA(baseTo) : '—'}</div></div>
      <div class="anw-cover-meta-card"><div class="anw-cm-lbl">Okres analizowany (PO)</div><div class="anw-cm-val anw-cm-period">${poFrom ? _fmtDateA(poFrom) : '—'} → ${poTo ? _fmtDateA(poTo) : '—'}</div></div>
    </div>
    <div class="anw-cover-result">
      <div class="anw-cover-result-head">Wynik końcowy</div>
      <div class="anw-cover-osz ${pos ? 'pos' : 'neg'}">
        <div class="anw-cover-osz-lbl">Obniżenie<br>zużycia ciepła</div>
        <div class="anw-cover-osz-val">${pct == null ? '—' : (pos ? '' : '−') + _fmtA(Math.abs(pct), 1)}<span>%</span></div>
      </div>
      <div class="anw-cover-kpis">
        <div class="anw-cover-kpi"><div class="v">${c.avgDiff != null ? _fmtA(c.avgDiff, 2) : '—'} <span>MJ</span></div><div class="k">Śr. różnica zużycia na odczyt, w zakresie temp. zewn. ${rngShort}</div></div>
        <div class="anw-cover-kpi"><div class="v">${s.avgPct != null ? _fmtA(s.avgPct, 1) : '—'}<span>%</span></div><div class="k">Średnie obniżenie temp. zasilania</div></div>
        <div class="anw-cover-kpi"><div class="v">${s.avgDiff != null ? _fmtA(s.avgDiff, 2) : '—'} <span>°C</span></div><div class="k">Średnia różnica temp. zasilania</div></div>
      </div>
    </div>
    ${embedded?'':`<div class="anw-cover-foot"><span>Dokument wygenerowany w systemie <b>WaterAI Energy Control</b> · ${genDate}</span><span>control.waterai.cloud</span></div>`}
  </div>

  <div class="anw-step-card">
    <h4><span class="anw-step-num">${_pfx}1</span> Model regresji liniowej — założenia i dane wejściowe</h4>
    <div class="anw-desc">
      ${embedded?'':`<p style="margin:0 0 8px;">Regresja liniowa opisuje zależność wybranego parametru pracy instalacji od temperatury zewnętrznej. Pozwala porównać, jak obiekt reaguje na warunki pogodowe PRZED i PO wdrożeniu — niezależnie od tego, że oba okresy mogły mieć inny przebieg temperatur. Dzięki temu efekt optymalizacji ocenia się technicznie, a nie tylko przez surowe sumy zużycia.</p>`}
      <p style="margin:0;">Dla każdego okresu wyznacza się prostą najlepszego dopasowania do chmury punktów pomiarowych (metodą najmniejszych kwadratów):</p>
    </div>
    <div class="anw-formula">y = a·x + b</div>
    <div class="anw-desc">
      <p style="margin:0 0 4px;">gdzie:</p>
      <ul style="margin:0 0 8px 18px;padding:0;">
        <li><b>y</b> — parametr zależny: zużycie ciepła [MJ] (przyrost wskazań licznika między kolejnymi odczytami) lub temperatura zasilania [°C],</li>
        <li><b>x</b> — temperatura zewnętrzna [°C],</li>
        <li><b>a</b> — współczynnik kierunkowy: o ile zmienia się y przy wzroście temperatury zewnętrznej o 1 °C (dla ogrzewania a jest ujemne — im zimniej, tym wyższe zużycie i temperatura zasilania),</li>
        <li><b>b</b> — wyraz wolny: teoretyczna wartość y przy temperaturze zewnętrznej 0 °C.</li>
      </ul>
      <p style="margin:0 0 6px;">W analizie zestawia się dwie proste:</p>
      <p style="margin:0 0 6px;"><b>a) Tryb pogodowy (baza)</b> — regresja wyznaczona dla okresu bazowego (PRZED), opisująca pierwotną charakterystykę cieplną obiektu przed wdrożeniem.</p>
      <p style="margin:0 0 6px;"><b>b) WaterAI (po)</b> — regresja wyznaczona dla okresu analizowanego (PO), na podstawie danych z czujników po wdrożeniu optymalizacji.</p>
      <p style="margin:0;">Dopasowanie wykonano w wariancie: <b>${methodTxt}</b>. Zakres temperatur do porównania i uśrednienia przyjęto na <b>${rngTxt}</b>.</p>
    </div>
  </div>

  <div class="anw-step-card">
    <h4><span class="anw-step-num">${_pfx}2</span> Równania regresji wyznaczone dla obu okresów</h4>
    <div class="anw-desc"><p style="margin:0 0 8px;">Z danych pomiarowych obu okresów otrzymano poniższe równania prostych. Wartość <b>n</b> w nawiasie to liczba punktów wykorzystanych w dopasowaniu danej linii.</p></div>
    <div class="anw-g2">
      <div class="anw-formula" style="border-color:#9aa5b1;">Zużycie · Tryb pogodowy:&nbsp; ${_analRegLineTxt(c.base)}</div>
      <div class="anw-formula" style="border-color:#1E7B34;">Zużycie · WaterAI:&nbsp; ${_analRegLineTxt(c.waterai)}</div>
      <div class="anw-formula" style="border-color:#9aa5b1;">T zasilania · Tryb pogodowy:&nbsp; ${_analRegLineTxt(s.base)}</div>
      <div class="anw-formula" style="border-color:#185FA5;">T zasilania · WaterAI:&nbsp; ${_analRegLineTxt(s.waterai)}</div>
    </div>
    <div class="anw-desc" style="margin-top:8px;"><p style="margin:0;">Porównując obie proste przy tej samej temperaturze zewnętrznej, odczytuje się, o ile niższe (lub wyższe) jest po wdrożeniu zużycie ciepła oraz temperatura zasilania. Różnica między prostymi <b>Tryb pogodowy</b> a <b>WaterAI</b> jest techniczną miarą efektu optymalizacji.</p></div>
  </div>

  <div class="anw-step-card">
    <h4><span class="anw-step-num">${_pfx}3</span> Porównanie zużycia ciepła w funkcji temperatury zewnętrznej</h4>
    <div class="anw-desc"><p style="margin:0 0 8px;">Najpierw chmura rzeczywistych punktów pomiarowych obu okresów wraz z dopasowanymi prostymi regresji — to właśnie z tych punktów wyznaczane są równania. Następnie wygładzone linie obu trybów w pełnym zakresie temperatur, wykres redukcji dla każdego stopnia oraz tabela zbiorcza.</p></div>
    ${_analRegScatterSvg('📉 Punkty pomiarowe i linie regresji — zużycie ciepła', sc.cons.base, sc.cons.wai, c.base, c.waterai, 'Zużycie [MJ]')}
    <div style="margin-top:14px;">${_analRegChartSvg('📉 Zużycie ciepła — linie Tryb pogodowy vs WaterAI', c, 'Zużycie ciepła [MJ]')}</div>
    <div style="margin-top:14px;">${_analRegReductionSvg('📊 Redukcja zużycia ciepła wg temperatury zewnętrznej', c)}</div>
    ${_analRegTableHtml(c, 'zużycie', 'MJ')}
  </div>

  <div class="anw-step-card">
    <h4><span class="anw-step-num">${_pfx}4</span> Porównanie temperatury zasilania w funkcji temperatury zewnętrznej</h4>
    <div class="anw-desc"><p style="margin:0 0 8px;">Analogiczne zestawienie dla temperatury zasilania instalacji: chmura punktów z liniami regresji, wygładzone linie obu trybów oraz wykres redukcji dla każdego stopnia. Niższa temperatura zasilania przy tej samej temperaturze zewnętrznej oznacza łagodniejszą pracę źródła ciepła, mniejsze straty przesyłu i potencjalnie wyższą sprawność wytwarzania.</p></div>
    ${_analRegScatterSvg('🌡️ Punkty pomiarowe i linie regresji — temperatura zasilania', sc.sup.base, sc.sup.wai, s.base, s.waterai, 'T zasilania [°C]')}
    <div style="margin-top:14px;">${_analRegChartSvg('🌡️ Temperatura zasilania — linie Tryb pogodowy vs WaterAI', s, 'T zasilania [°C]')}</div>
    <div style="margin-top:14px;">${_analRegReductionSvg('📊 Redukcja temperatury zasilania wg temperatury zewnętrznej', s)}</div>
    ${_analRegTableHtml(s, 'T zasilania', '°C')}
  </div>

  <div class="anw-step-card">
    <h4><span class="anw-step-num">${_pfx}5</span> Wynik — uśrednione obniżenie w przyjętym zakresie temperatur</h4>
    <div class="anw-desc"><p style="margin:0 0 8px;">Wskaźniki uśrednia się po całym przyjętym zakresie temperatur zewnętrznych (${rngTxt}): dla każdego stopnia odczytuje się wartość z obu prostych i liczy ich różnicę, a wyniki uśrednia. <b>Obniżenie [%]</b> oraz <b>różnica</b> to zatem przeciętny odstęp między charakterystyką PRZED i PO. Różnica zużycia podana jest <b>na pojedynczy odczyt</b> (przyrost licznika między odczytami, w MJ), a nie jako suma za cały okres.</p></div>
    <div class="anw-rgrid">
      <div class="anw-tile"><div class="v">${c.avgPct != null ? _fmtA(c.avgPct, 1) + '%' : '—'}</div><div class="k">Średnie obniżenie zużycia ciepła</div></div>
      <div class="anw-tile"><div class="v">${c.avgDiff != null ? _fmtA(c.avgDiff, 2) + ' MJ' : '—'}</div><div class="k">Śr. różnica zużycia na odczyt (zakres T zewn. ${rngShort})</div></div>
      <div class="anw-tile"><div class="v">${s.avgPct != null ? _fmtA(s.avgPct, 1) + '%' : '—'}</div><div class="k">Średnie obniżenie temp. zasilania</div></div>
      <div class="anw-tile"><div class="v">${s.avgDiff != null ? _fmtA(s.avgDiff, 2) + ' °C' : '—'}</div><div class="k">Średnia różnica temp. zasilania</div></div>
    </div>
    <div class="anw-desc" style="margin-top:10px;"><p style="margin:0;"><b>Tryb pogodowy</b> = regresja okresu bazowego (PRZED). <b>WaterAI</b> = regresja okresu analizowanego (PO) na danych z czujników.${subsetNote} Wynik ma charakter techniczny (porównanie charakterystyk pracy), niezależny od rozliczenia finansowego ESCO.</p></div>
  </div>

  ${embedded?'':`<div class="anw-sign">
    <div class="anw-sign-box">
      <div class="anw-sign-line"></div>
      <div class="anw-sign-cap">Klient — podpis i data</div>
    </div>
    <div class="anw-sign-box anw-sign-wateria">
      <div class="anw-stamp">WaterAI Energy</div>
      <div class="anw-sign-cap" style="margin-top:10px;">Dokument wygenerowany elektronicznie w systemie <b>WaterAI Energy Control</b> dnia ${genDate}. Nie wymaga podpisu ani pieczęci.</div>
      <div class="anw-sign-cap">Analizy energetyczne WaterAI Energy.</div>
    </div>
  </div>`}`;
}

function _analRegRun() {
  const reg = ANAL.reg || {};
  const problems = [];
  if (!reg.baseLines) problems.push('skopiuj dane z okresu bazowego (Metoda 1/2)');
  if (!(reg.analyzed && reg.analyzed.rows && reg.analyzed.rows.length)) problems.push('zaimportuj okres analizowany (CSV)');
  if (!(reg.billing && reg.billing.from && reg.billing.to)) problems.push('podaj zakres okresu rozliczeniowego (od–do)');
  if (problems.length) { alert('Uzupełnij: ' + problems.join('; ') + '.'); return; }
  const model = _analRegModel(reg);
  if (!model || !model.cons || !model.sup) { alert('Nie udało się policzyć regresji okresu analizowanego — sprawdź, czy CSV ma kolumny tOutdoor, tSupply i heatConsumption oraz min. 2 punkty.'); return; }
  ANAL.results = { reg: true, model: model, at: new Date().toISOString() };
  const slot = document.getElementById('anw-results');
  if (slot) { slot.innerHTML = _analRegResults(); slot.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
}

function _analRegResults() {
  return _analRegResultsHtml(ANAL.reg, (ANAL.results && ANAL.results.model) || _analRegModel(ANAL.reg), { withSave: true });
}

function analRegSave() {
  const reg = ANAL.reg || {};
  const model = (ANAL.results && ANAL.results.model) || _analRegModel(reg);
  if (!model || !model.cons || !model.sup) { alert('Najpierw wykonaj analizę („⚡ Wykonaj analizę").'); return; }
  const o = ObjectsModule.find(ANAL.objectId);
  const payload = {
    clientId: ANAL.clientId, objectId: ANAL.objectId,
    name: `${AnalysesModule.TYPES.REGRESSION.label} — ${o ? o.name : ''}`,
    analysisType: 'REGRESSION',
    executedAt: new Date().toISOString().slice(0, 10),
    author: String(ANAL.author || '').trim(),
    status: 'COMPLETE',
    inputParams: { basePeriod: ANAL.basePeriod, reg: JSON.parse(JSON.stringify(reg)) },
    results: {
      regType: true, method: model.method,
      savedEnergyPct: model.cons ? model.cons.avgPct : null,
      supplyPct: model.sup ? model.sup.avgPct : null,
      supplyAvgDiff: model.sup ? model.sup.avgDiff : null
    }
  };
  let id = ANAL.editingId;
  if (id) { AnalysesModule.update(id, payload); }
  else {
    const rec = AnalysesModule.add(payload);
    id = (rec && rec.id != null) ? rec.id : null;
    if (id == null && AnalysesModule.getAll) { const all = AnalysesModule.getAll(); if (all.length) id = all[all.length - 1].id; }
  }
  _analResetState();
  if (id != null && typeof analView === 'function') analView(id);   // pokaż zapisaną analizę zamiast wracać do pustej listy
  else renderAnalysesModule();
}

// ── handlery wyboru / dat ───────────────────────────────────────────────────────
function analOnClient(v) { ANAL.clientId = v ? Number(v) : null; ANAL.objectId = null; ANAL.results = null; renderAnalysesModule(); }
function analOnObject(v) {
  ANAL.objectId = v ? Number(v) : null; ANAL.results = null;
  ANAL.basePeriod = null;                                    // reset wyboru okresu bazowego
  ANAL.std = JSON.parse(JSON.stringify(ANAL_STD_DEFAULT));   // wyczyść poprzedni sezon
  selectedAnalysisObjectId = ANAL.objectId;
  const o = ANAL.objectId ? ObjectsModule.find(ANAL.objectId) : null;
  if (o) {
    ANAL.energy.unit = o.energyUnit || ANAL.energy.unit;
    ANAL.energy.currency = o.currency || ANAL.energy.currency;
    ANAL.energy.price = o.energyPrice || ANAL.energy.price;
    ANAL.energy.escoShare = o.escoShare != null ? o.escoShare : ANAL.energy.escoShare;
  }
  // jeśli obiekt ma dokładnie jeden okres bazowy — wczytaj go od razu z protokołu
  if (ANAL.type === 'REGRESSION') {
    if (ANAL.reg) ANAL.reg.baseLines = null;
    const rbp = (ANAL.objectId && window.RegressionBaseModule) ? RegressionBaseModule.listByObject(ANAL.objectId) : [];
    if (rbp.length === 1) ANAL.basePeriod = rbp[0].id;
  } else {
    const bp = (ANAL.objectId && window.MeasurementsModule)
      ? (MeasurementsModule.findByObject(ANAL.objectId) || []) : [];
    if (bp.length === 1) { ANAL.basePeriod = bp[0].id; _analApplyBaseProtocol(bp[0]); }
  }
  renderAnalysesModule();
}
// UWAGA: jedyna definicja analOnBasePeriod (wcześniej były trzy — starsze kopie z końca pliku
// nadpisywały tę wersję i gubiły gałąź REGRESSION; usunięte podczas deduplikacji).
function analOnBasePeriod(v) {
  ANAL.basePeriod = v || null;
  if (ANAL.type === 'REGRESSION') {
    if (ANAL.reg) ANAL.reg.baseLines = null;   // nowy okres → wymuś ponowne „Kopiuj dane"
    renderAnalysesModule();
    return;
  }
  if (v && v !== 'manual') {
    if (typeof v === 'string' && v.indexOf('int:') === 0) {
      const it = window.BasePeriodModule ? BasePeriodModule.find(Number(v.slice(4))) : null;
      if (it) _analApplyIntensityBase(it);
    } else {
      const p = window.MeasurementsModule ? MeasurementsModule.find(Number(v)) : null;
      if (p) _analApplyBaseProtocol(p);
    }
  }
  renderAnalysesModule();
}

// Wczytuje wybrany okres bazowy (protokół) do kreatora:
// TYM → standardowy sezon, okres porównawczy → PRZED instalacją
function _analApplyBaseProtocol(p) {
  if (ANAL.type === 'VOLUME') {
    // Korekta intensywności — z protokołu bierzemy tylko zakres dat, zużycie i parametry energii.
    ANAL.before.from = p.comparisonPeriodStartDate || '';
    ANAL.before.to = p.comparisonPeriodEndDate || '';
    ANAL.before.months = _analMonthsBetween(ANAL.before.from, ANAL.before.to).map(m => ({ ...m, tme: '' }));
    ANAL.before.consumption = (p.comparisonConsumption != null) ? p.comparisonConsumption : '';
    ANAL.std = _analVolRefDefaults();
    if (p.energyUnit) ANAL.energy.unit = p.energyUnit;
    if (p.currency) ANAL.energy.currency = p.currency;
    if (p.energyPrice) ANAL.energy.price = p.energyPrice;
    if (p.waterAiShare != null && p.waterAiShare !== '') ANAL.energy.escoShare = p.waterAiShare;
    return;
  }
  // Tᵢ bazowa — kopiowana 1:1 z okresu bazowego (protokołu); ten sam wzór HDD = (Tᵢ − t)·dni
  const _bt = (p.baseTemperature != null && p.baseTemperature !== '') ? Number(p.baseTemperature) : 20;
  ANAL.baseTi = _bt;
  if (ANAL.after) ANAL.after.baseTi = _bt; // domyślnie tyle samo; użytkownik może zmienić dla okresu analizowanego
  // Standard = Typowy Rok Meteorologiczny (TYM)
  const tym = p.tymMonthly || [];
  if (tym.length) {
    const std = JSON.parse(JSON.stringify(ANAL_STD_DEFAULT));
    tym.forEach(m => {
      const mo = Number(m.month);
      if (mo >= 1 && mo <= 12) {
        const t = (m.tymTemperature ?? m.temperature);
        const d = (m.tymDays ?? m.days);
        std[mo] = [
          (t !== null && t !== undefined && t !== '') ? Number(t) : std[mo][0],
          (d !== null && d !== undefined && d !== '') ? Number(d) : std[mo][1]
        ];
      }
    });
    ANAL.std = std;
  }
  // PRZED instalacją = okres porównawczy (bazowy). Dni i temperatury bierzemy z ZAPISANYCH
  // miesięcy protokołu (comparisonMonthly, awaryjnie realMonthly) — zachowując 0 dla miesięcy
  // poza sezonem grzewczym. Dni regenerujemy z dat dopiero, gdy protokół nie ma żadnych miesięcy.
  ANAL.before.from = p.comparisonPeriodStartDate || p.billingPeriodStartDate || '';
  ANAL.before.to = p.comparisonPeriodEndDate || p.billingPeriodEndDate || '';
  const stored = (Array.isArray(p.comparisonMonthly) && p.comparisonMonthly.length)
    ? p.comparisonMonthly
    : ((Array.isArray(p.realMonthly) && p.realMonthly.length) ? p.realMonthly : []);
  if (stored.length) {
    ANAL.before.months = stored.map(m => {
      const mo = Number(m.month) || 1;
      const yr = Number(m.year) || (m.monthName && /\d{4}/.test(m.monthName) ? Number(m.monthName.match(/\d{4}/)[0]) : '');
      const dRaw = (m.days != null && m.days !== '') ? m.days : ((m.realDays != null && m.realDays !== '') ? m.realDays : null);
      const tRaw = (m.temperature != null && m.temperature !== '') ? m.temperature : ((m.realTemperature != null && m.realTemperature !== '') ? m.realTemperature : null);
      return {
        year: yr,
        month: mo,
        name: m.monthName || (ANAL_MONTHS[mo - 1] + (yr ? ' ' + yr : '')),
        days: (dRaw != null) ? Number(dRaw) : 0,
        tme: (tRaw != null) ? Number(tRaw) : ''
      };
    });
  } else {
    ANAL.before.months = _analMonthsBetween(ANAL.before.from, ANAL.before.to);
  }
  ANAL.before.consumption = (p.comparisonConsumption != null && p.comparisonConsumption !== '') ? p.comparisonConsumption
    : ((p.billingConsumption != null && p.billingConsumption !== '') ? p.billingConsumption : '');
  // jednostka / waluta / cena / udział z protokołu (jeśli ustawione)
  if (p.energyUnit) ANAL.energy.unit = p.energyUnit;
  if (p.currency) ANAL.energy.currency = p.currency;
  if (p.energyPrice) ANAL.energy.price = p.energyPrice;
  if (p.waterAiShare !== null && p.waterAiShare !== undefined && p.waterAiShare !== '') ANAL.energy.escoShare = p.waterAiShare;
}
function analOnDates(key, which, val) {
  ANAL[key][which] = val;
  ANAL[key].months = _analMonthsBetween(ANAL[key].from, ANAL[key].to);
  renderAnalysesModule();
}

// ── silnik stopniodni ───────────────────────────────────────────────────────────
function _analComputePeriod(key) {
  const P = ANAL[key]; let sumR = 0, sumS = 0, days = 0;
  P.months.forEach((mo, idx) => {
    const _ti = _analTi(key);
    const stdM = ANAL.std[mo.month] || [0, 0];
    const _d = _analDrv2(mo.tme, stdM[0], mo.days, _ti);
    const sdR = _d.r, sdS = _d.s;
    sumR += sdR; sumS += sdS; days += Number(mo.days || 0);
    const er = document.getElementById(`anw-${key}-sdr-${idx}`); if (er) er.textContent = mo.tme !== '' ? _fmtA(sdR, 1) : '—';
    const es = document.getElementById(`anw-${key}-sds-${idx}`); if (es) es.textContent = _fmtA(sdS, 1);
  });
  const phi = sumR > 0 ? sumS / sumR : null;
  const q = Number(P.consumption || 0);
  const qs = phi != null ? q * phi : null;
  return { sumR, sumS, days, phi, q, qs };
}

function _analRecalcLive() {
  if (!ANAL || !ANAL.objectId || (ANAL.type !== 'TYM' && ANAL.type !== 'VOLUME')) return;
  if (ANAL.type === 'TYM') {
    let stdSum = 0;
    for (let m = 1; m <= 12; m++) {
      const v = ANAL.std[m]; const sd = _sd20(v[0], v[1], _analBaseTi()); stdSum += sd;
      const c = document.getElementById('anw-std-sd-' + m); if (c) c.textContent = _fmtA(sd, 1);
    }
    const ss = document.getElementById('anw-std-sum'); if (ss) ss.textContent = _fmtA(stdSum, 1);
  }

  ['before', 'after'].forEach(key => {
    const r = _analComputePeriod(key);
    const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    set(`anw-${key}-phi`, r.phi != null ? _fmtA(r.phi, 4) : '—');
    set(`anw-${key}-days`, r.days || '—');
    set(`anw-${key}-sumr`, _fmtA(r.sumR, 1));
    set(`anw-${key}-sums`, _fmtA(r.sumS, 1));
    set(`anw-${key}-qs`, r.qs != null ? _fmtA(r.qs, 2) : '—');
    // etykiety SD{Tᵢ} odzwierciedlają bieżącą Tᵢ danego okresu (na żywo)
    const ti = _analTi(key);
    document.querySelectorAll('.anw-tilab-' + key).forEach(e => { e.textContent = ti; });
  });
  document.querySelectorAll('.anw-u').forEach(e => e.textContent = ANAL.energy.unit);
}

function analRun() {
  if (!String(ANAL.author || '').trim()) {
    alert('Wskaż osobę wykonującą analizę w polu „Wykonał — Energy Analyst". Analizę może wykonać wyłącznie użytkownik z rolą Energy Analyst (dodaj go w module Użytkownicy, jeśli lista jest pusta).');
    return;
  }
  if (ANAL.type === 'REGRESSION') { _analRegRun(); return; }
  const before = _analComputePeriod('before');
  const after = _analComputePeriod('after');
  if (before.qs == null || after.qs == null) {
    alert('Uzupełnij temperatury i dni dla obu okresów (PRZED i PO) oraz zużycie Qc.o., aby wyznaczyć współczynniki korekcyjne.');
    return;
  }
  // Sprowadzenie bazy (PRZED) do długości/warunków okresu PO — stosunek standardowych stopniodni
  const normF = (ANAL.type === 'TYM' && before.sumS > 0) ? after.sumS / before.sumS : 1;
  const qsBeforeNorm = before.qs * normF;
  const savedEnergy = qsBeforeNorm - after.qs;
  const savedPct = qsBeforeNorm > 0 ? savedEnergy / qsBeforeNorm * 100 : 0;
  const price = Number(ANAL.energy.price || 0);
  // FIXED: cena za jednostkę × zaoszczędzona energia. VARIABLE: całkowity koszt energii okresu bazowego × procent oszczędności.
  const savedMoney = (ANAL.energy.priceMode === 'VARIABLE') ? price * savedPct / 100 : savedEnergy * price;
  const escoShare = Number(ANAL.energy.escoShare || 0);
  const escoAmount = savedMoney * escoShare / 100;
  const clientAmount = savedMoney - escoAmount;

  ANAL.results = { before, after, normF, qsBeforeNorm, savedEnergy, savedPct, savedMoney, escoShare, escoAmount, clientAmount,
    unit: ANAL.energy.unit, currency: ANAL.energy.currency, at: new Date().toISOString() };
  const slot = document.getElementById('anw-results');
  if (slot) { slot.innerHTML = _analResults(); slot.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  const bar = document.querySelector('.anw-steps'); if (bar) bar.outerHTML = _analStepsBar();
  setTimeout(() => _analDrawCharts(_analReportData({ live: true })), 60);
}

function _analResults() {
  if (!ANAL.results) return '';
  const data = _analReportData({ live: true });
  return `
  <div id="anw-report" class="anw-report">${_analReportBody(data)}</div>
  <div class="anw-act anw-noprint" style="justify-content:center;margin:22px 0 6px;gap:12px;">
    <button class="anw-run" style="background:linear-gradient(135deg,#0C447C,#1a6bb5);font-size:14px;padding:13px 26px;box-shadow:0 6px 18px rgba(12,68,124,.25);" onclick="analSave()">💾 Zapisz analizę</button>
    <button class="small-button" style="font-size:14px;padding:13px 22px;" onclick="analPrintPDF()">🖨 Drukuj</button>
  </div>`;
}

function analSave() {
  if (!ANAL.results) return;
  const o = ObjectsModule.find(ANAL.objectId);
  const r = ANAL.results;
  const payload = {
    clientId: ANAL.clientId,
    objectId: ANAL.objectId,
    name: `${AnalysesModule.TYPES[ANAL.type].label} — ${o ? o.name : ''}`,
    analysisType: ANAL.type,
    executedAt: new Date().toISOString().slice(0, 10),
    author: String(ANAL.author || '').trim(),
    status: 'COMPLETE',
    inputParams: {
      std: ANAL.std, before: ANAL.before, after: ANAL.after,
      baseTi: ANAL.baseTi,
      energyUnit: ANAL.energy.unit, currency: ANAL.energy.currency,
      energyPrice: ANAL.energy.price, escoShare: ANAL.energy.escoShare,
      priceMode: ANAL.energy.priceMode, priceDescription: ANAL.energy.priceDescription,
      basePeriod: ANAL.basePeriod
    },
    results: {
      savedEnergy: r.savedEnergy,
      savedEnergyPct: r.savedPct,      // w procentach (np. 12.5)
      savedMoney: r.savedMoney,
      escoAmount: r.escoAmount,
      phiBefore: r.before.phi, phiAfter: r.after.phi,
      qsBefore: r.before.qs, qsAfter: r.after.qs,
      qsBeforeNorm: r.qsBeforeNorm, normFactor: r.normF
    }
  };
  if (ANAL.editingId) {
    AnalysesModule.update(ANAL.editingId, payload);
    alert('Analiza zaktualizowana.');
  } else {
    AnalysesModule.add(payload);
    alert('Analiza zapisana.');
  }
  _analResetState();
  renderAnalysesModule();
}

// ── PEŁNY RAPORT ANALIZY (TYM) — krok po kroku, wzory, wykresy, druk PDF ──────────

// Czysty silnik SD per okres (mirror _sd20/_analComputePeriod, dni okresu po obu stronach)
function _analCalcPeriodRows(months, std, ti, consumption) {
  let sumR = 0, sumS = 0, days = 0; const rows = [];
  (months || []).forEach(mo => {
    const t = (ti != null && ti !== '') ? Number(ti) : ANAL_TI;
    const d = Number(mo.days || 0);
    const filled = !(mo.tme === '' || mo.tme == null);
    const tmeNum = Number(mo.tme || 0);
    const stdM = (std && std[mo.month]) ? std[mo.month] : [0, 0];
    const sdR = filled ? Math.max(0, t - tmeNum) * d : 0;
    const sdS = Math.max(0, t - Number(stdM[0])) * d; // dni OKRESU (poprawione)
    sumR += sdR; sumS += sdS; days += d;
    rows.push({ name: mo.name, month: mo.month, days: d, tme: filled ? tmeNum : null, tStd: Number(stdM[0]), sdR, sdS });
  });
  const phi = sumR > 0 ? sumS / sumR : null;
  const q = Number(consumption || 0);
  const qs = phi != null ? q * phi : null;
  return { rows, sumR, sumS, days, phi, q, qs };
}

function _analReportData(source) {
  let clientId, objectId, std, beforeP, afterP, energy, name, executedAt, number, tiBefore, tiAfter, base, saved, cid, author;
  if (source && source.saved) {
    const a = source.saved, ip = a.inputParams || {}, rr = a.results || {};
    clientId = a.clientId; objectId = a.objectId; std = ip.std || ANAL_STD_DEFAULT;
    beforeP = ip.before || { months: [], consumption: '' };
    afterP = ip.after || { months: [], consumption: '' };
    energy = { unit: ip.energyUnit || 'GJ', currency: ip.currency || 'PLN', price: ip.energyPrice,
      escoShare: ip.escoShare, priceMode: ip.priceMode || 'FIXED', priceDescription: ip.priceDescription || '' };
    tiBefore = (ip.baseTi != null && ip.baseTi !== '') ? ip.baseTi : (afterP.baseTi != null ? afterP.baseTi : ANAL_TI);
    tiAfter = (afterP.baseTi != null && afterP.baseTi !== '') ? afterP.baseTi : tiBefore;
    name = a.name; executedAt = a.executedAt; author = a.author || '';
    number = (AnalysesModule.getNumber ? AnalysesModule.getNumber(a.id) : null) || ('#' + a.id);
    base = { savedEnergy: rr.savedEnergy,
      savedPct: rr.savedEnergyPct != null ? ((rr.savedEnergyPct > -1 && rr.savedEnergyPct < 1) ? rr.savedEnergyPct * 100 : rr.savedEnergyPct) : null,
      savedMoney: rr.savedMoney, escoShare: ip.escoShare, escoAmount: rr.escoAmount };
    saved = true; cid = 'anw' + a.id;
  } else {
    clientId = ANAL.clientId; objectId = ANAL.objectId; std = ANAL.std;
    beforeP = ANAL.before; afterP = ANAL.after; energy = ANAL.energy;
    tiBefore = _analTi('before'); tiAfter = _analTi('after');
    const o0 = ObjectsModule.find(objectId);
    name = ((AnalysesModule.TYPES[ANAL.type] || {}).label || 'Analiza') + ' — ' + (o0 ? o0.name : '');
    executedAt = new Date().toISOString().slice(0, 10);
    author = ANAL.author || '';
    number = ANAL.editingId ? ((AnalysesModule.getNumber && AnalysesModule.getNumber(ANAL.editingId)) || ('#' + ANAL.editingId)) : '— (niezapisana)';
    const rr = ANAL.results || {};
    base = { savedEnergy: rr.savedEnergy, savedPct: rr.savedPct, savedMoney: rr.savedMoney, escoShare: rr.escoShare, escoAmount: rr.escoAmount };
    saved = false; cid = 'anwlive';
  }
  const _isVol = (source && source.saved) ? (source.saved.analysisType === 'VOLUME') : (ANAL.type === 'VOLUME');
  const before = _isVol ? _analCalcPeriodRowsVOL(beforeP.months, std, beforeP.consumption) : _analCalcPeriodRows(beforeP.months, std, tiBefore, beforeP.consumption);
  const after = _isVol ? _analCalcPeriodRowsVOL(afterP.months, std, afterP.consumption) : _analCalcPeriodRows(afterP.months, std, tiAfter, afterP.consumption);
  const escoShare = Number(energy.escoShare || 0);
  // Normalizacja bazy (PRZED) do długości/warunków okresu PO — stosunek standardowych stopniodni
  const normF = (!_isVol && before.sumS > 0) ? after.sumS / before.sumS : 1;
  const qsBeforeNorm = (before.qs != null) ? before.qs * normF : null;
  const savedEnergy = (qsBeforeNorm != null && after.qs != null) ? qsBeforeNorm - after.qs : null;
  const savedPct = (qsBeforeNorm > 0 && savedEnergy != null) ? savedEnergy / qsBeforeNorm * 100 : null;
  const price = Number(energy.price || 0);
  energy = Object.assign({}, energy, { unit: _normUnitA(energy.unit) });
  const savedMoney = (energy.priceMode === 'VARIABLE') ? (savedPct != null ? price * savedPct / 100 : null) : (savedEnergy != null ? savedEnergy * price : null);
  const escoAmount = (savedMoney != null) ? savedMoney * escoShare / 100 : null;
  const clientAmount = (savedMoney != null && escoAmount != null) ? savedMoney - escoAmount : null;
  return {
    client: ClientsModule.find(clientId), object: ObjectsModule.find(objectId),
    name, executedAt, number, saved, std, energy, tiBefore, tiAfter, cid, author,
    type: _isVol ? 'VOLUME' : ((source && source.saved) ? source.saved.analysisType : ANAL.type),
    before: Object.assign({}, before, { from: beforeP.from, to: beforeP.to, consumption: beforeP.consumption }),
    after: Object.assign({}, after, { from: afterP.from, to: afterP.to, consumption: afterP.consumption }),
    normF, qsBeforeNorm, savedEnergy, savedPct, savedMoney, escoShare, escoAmount, clientAmount
  };
}

// Kompaktowa etykieta miesiąca w tabelach raportu: "Styczeń 2025" → "01.2025".
// Skraca komórkę, dzięki czemu wiersze nie zawijają się i tabele PRZED/PO nie rozjeżdżają.
function _anwMonShort(r) {
  const ym = String((r && r.name) || '').match(/(\d{4})/);
  const mm = (r && r.month != null) ? String(r.month).padStart(2, '0') : '';
  if (mm && ym) return mm + '.' + ym[1];
  return _escA((r && r.name) || '');
}

function _anwPeriodTable(P, ti) {
  const rows = (P.rows || []).map(r => `<tr>
    <td style="white-space:nowrap;">${_anwMonShort(r)}</td>
    <td class="calc">${r.days}</td>
    <td class="calc">${r.tme == null ? '—' : _fmtA(r.tme, 1)}</td>
    <td class="calc">${_fmtA(r.sdR, 1)}</td>
    <td class="calc">${_fmtA(r.tStd, 1)}</td>
    <td class="calc">${_fmtA(r.sdS, 1)}</td>
  </tr>`).join('');
  return `<table class="anw-t"><thead><tr>
    <th>Miesiąc</th><th>Dni z₀</th><th>t rzecz.</th><th>SD${ti} rzecz.</th><th>t TYM</th><th>SD${ti} std.</th>
  </tr></thead><tbody>${rows || '<tr><td colspan="6" class="anw-muted">Brak miesięcy</td></tr>'}</tbody>
  <tfoot><tr><td>∑</td><td class="calc">${P.days}</td><td></td><td class="calc">${_fmtA(P.sumR, 1)}</td><td></td><td class="calc">${_fmtA(P.sumS, 1)}</td></tr></tfoot></table>`;
}

// Wspólna oś miesięcy dla obu okresów — kolejność wg okresu PRZED, miesiące tylko z PO dopisane na końcu.
function _anwMonthAxis(before, after) {
  const order = [], seen = {};
  (before && before.rows || []).forEach(r => { const m = r.month; if (m != null && !seen[m]) { seen[m] = 1; order.push(m); } });
  (after && after.rows || []).forEach(r => { const m = r.month; if (m != null && !seen[m]) { seen[m] = 1; order.push(m); } });
  return order;
}

// Tabela okresu renderowana na wspólnej osi miesięcy — ten sam miesiąc trafia w ten sam wiersz
// w obu tabelach (puste wiersze wyrównujące, bez wierszy pustych poniżej ostatniego miesiąca okresu).
function _anwPeriodTableAligned(P, ti, axis) {
  const byMonth = {};
  (P.rows || []).forEach(r => { if (r.month != null) byMonth[r.month] = r; });
  let lastIdx = -1;
  axis.forEach((m, i) => { if (byMonth[m]) lastIdx = i; });
  let body = '';
  for (let i = 0; i <= lastIdx; i++) {
    const r = byMonth[axis[i]];
    body += r ? `<tr>
      <td style="white-space:nowrap;">${_anwMonShort(r)}</td>
      <td class="calc">${r.days}</td>
      <td class="calc">${r.tme == null ? '—' : _fmtA(r.tme, 1)}</td>
      <td class="calc">${_fmtA(r.sdR, 1)}</td>
      <td class="calc">${_fmtA(r.tStd, 1)}</td>
      <td class="calc">${_fmtA(r.sdS, 1)}</td>
    </tr>` : `<tr class="anw-blank"><td>·</td><td>·</td><td>·</td><td>·</td><td>·</td><td>·</td></tr>`;
  }
  if (lastIdx < 0) body = '<tr><td colspan="6" class="anw-muted">Brak miesięcy</td></tr>';
  return `<table class="anw-t"><thead><tr>
    <th>Miesiąc</th><th>Dni z₀</th><th>t rzecz.</th><th>SD${ti} rzecz.</th><th>t TYM</th><th>SD${ti} std.</th>
  </tr></thead><tbody>${body}</tbody>
  <tfoot><tr><td>∑</td><td class="calc">${P.days}</td><td></td><td class="calc">${_fmtA(P.sumR, 1)}</td><td></td><td class="calc">${_fmtA(P.sumS, 1)}</td></tr></tfoot></table>`;
}

// Linia źródła danych klimatycznych (audytowalność): dane z pól obiektu „Dane klimatyczne (TYM)".
// Dla zamrożonych raportów ESCO używa kopii ze snapshotu (data._climate), inaczej danych obiektu.
function _analClimateLine(data) {
  const c = (data && data._climate) || (data && data.object) || {};
  const st = c.weatherStation || '', src = c.weatherSource || '', url = c.weatherSourceUrl || '', dd = c.weatherDataDownloadDate || '';
  if (!st && !src) return '';
  const parts = [];
  if (st) parts.push(`stacja meteorologiczna: <b>${_escA(st)}</b>`);
  if (src) parts.push(`źródło: ${_escA(src)}`);
  if (dd) parts.push(`dane pobrano: ${_fmtDateA(dd)}`);
  if (url) parts.push(`<span style="word-break:break-all;">${_escA(url)}</span>`);
  return `<div class="anw-muted" style="font-size:11px;margin-top:6px;">Temperatury rzeczywiste i normy standardowe (TYM) — ${parts.join(' · ')}.</div>`;
}

// Para paneli PRZED / PO obok siebie: rozdzielone graficznie i wyrównane wg miesięcy.
function _anwPeriodPair(data, tiB, tiA) {
  const axis = _anwMonthAxis(data.before, data.after);
  return `<div class="anw-pair" style="margin-top:10px;">
    <div class="anw-pair-col anw-pair-before"><div class="anw-muted" style="margin-bottom:6px;color:#0C447C;font-weight:600;">Okres PRZED instalacją</div>${_anwPeriodTableAligned(data.before, tiB, axis)}</div>
    <div class="anw-pair-col anw-pair-after"><div class="anw-muted" style="margin-bottom:6px;color:#27500A;font-weight:600;">Okres PO instalacji</div>${_anwPeriodTableAligned(data.after, tiA, axis)}</div>
  </div>
  <div class="anw-muted" style="font-size:11px;margin-top:6px;">z₀ — liczba dni z czynnym ogrzewaniem w danym miesiącu; suma dni z₀ może być mniejsza od kalendarzowej długości okresu.</div>
  ${_analClimateLine(data)}`;
}

// Wykres słupkowy (grupowany) na canvas — ostry przy druku (DPR)
function _anwBar(cv, groups, opts) {
  if (!cv) return; opts = opts || {};
  const dpr = window.devicePixelRatio || 1;
  const W = cv.clientWidth || 480, H = 260;
  cv.width = W * dpr; cv.height = H * dpr;
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#222'; ctx.font = '600 12px sans-serif'; ctx.textAlign = 'left';
  if (opts.title) ctx.fillText(opts.title, 8, 16);
  if (opts.unit) { ctx.fillStyle = '#999'; ctx.textAlign = 'right'; ctx.font = '10px sans-serif'; ctx.fillText('[' + opts.unit + ']', W - 12, 16); }
  const pad = { l: 56, r: 14, t: 30, b: 48 };
  const vals = []; groups.forEach(g => g.bars.forEach(b => vals.push(Number(b.v) || 0)));
  const maxV = Math.max(1, ...vals), niceMax = maxV * 1.18;
  const plotW = W - pad.l - pad.r, plotH = H - pad.t - pad.b;
  ctx.textAlign = 'right'; ctx.font = '10px sans-serif';
  for (let i = 0; i <= 4; i++) {
    const val = niceMax * i / 4, y = pad.t + plotH - (val / niceMax) * plotH;
    ctx.strokeStyle = '#ececec'; ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
    ctx.fillStyle = '#999'; ctx.fillText(_fmtA(val, 0), pad.l - 6, y + 3);
  }
  const gw = plotW / groups.length;
  groups.forEach((g, gi) => {
    const bn = g.bars.length, bw = Math.min(46, (gw * 0.66) / bn), gx = pad.l + gw * gi + gw / 2;
    const totalW = bw * bn + (bn - 1) * 8; let bx = gx - totalW / 2;
    g.bars.forEach(b => {
      const v = Number(b.v) || 0, h = (v / niceMax) * plotH, y = pad.t + plotH - h;
      ctx.fillStyle = b.c; ctx.fillRect(bx, y, bw, h);
      ctx.fillStyle = '#222'; ctx.font = '700 10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(_fmtA(v, v >= 100 ? 0 : 1), bx + bw / 2, y - 4);
      bx += bw + 8;
    });
    ctx.fillStyle = '#555'; ctx.font = '600 11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(g.label, gx, H - pad.b + 18);
  });
  const seen = {}; let lx = pad.l, ly = H - 12;
  groups.forEach(g => g.bars.forEach(b => {
    if (b.n && !seen[b.n]) {
      seen[b.n] = 1; ctx.fillStyle = b.c; ctx.fillRect(lx, ly - 8, 10, 10);
      ctx.fillStyle = '#555'; ctx.font = '10px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(b.n, lx + 14, ly); lx += ctx.measureText(b.n).width + 32;
    }
  }));
}

function _analDrawCharts(data) {
  if (!data) return;
  if (data.type === 'VOLUME') return _analDrawChartsVOL(data);
  _anwBar(document.getElementById(data.cid + '-sd'), [
    { label: 'PRZED', bars: [{ v: data.before.sumR, c: '#185FA5', n: 'SD rzeczywiste' }, { v: data.before.sumS, c: '#FAC775', n: 'SD standard (TYM)' }] },
    { label: 'PO', bars: [{ v: data.after.sumR, c: '#185FA5', n: 'SD rzeczywiste' }, { v: data.after.sumS, c: '#FAC775', n: 'SD standard (TYM)' }] }
  ], { title: 'Stopniodni: rzeczywiste vs standard (TYM)', unit: '°C·dni' });
  _anwBar(document.getElementById(data.cid + '-qs'), [
    { label: 'PRZED', bars: [{ v: data.before.qs, c: '#0C447C', n: 'Qs przed' }] },
    { label: 'PO', bars: [{ v: data.after.qs, c: '#27500A', n: 'Qs po' }] }
  ], { title: 'Zużycie skorygowane do warunków standardowych (Qs)', unit: data.energy.unit });
  // Oszczędność energii — Qs PRZED vs Qs PO + zaoszczędzona energia (skorygowana do TYM)
  _anwBar(document.getElementById(data.cid + '-save'), [
    { label: 'Baza PRZED→PO', bars: [{ v: data.qsBeforeNorm, c: '#0C447C' }] },
    { label: 'PO', bars: [{ v: data.after.qs, c: '#27500A' }] },
    { label: 'Zaoszczędzono', bars: [{ v: data.savedEnergy, c: '#22a35a' }] }
  ], { title: 'Oszczędność energii (baza sprowadzona do okresu PO)', unit: data.energy.unit });
  // Koszty — wartość oszczędności i jej podział WaterAI/ESCO vs klient
  _anwBar(document.getElementById(data.cid + '-cost'), [
    { label: 'Oszczędność', bars: [{ v: data.savedMoney, c: '#0C447C' }] },
    { label: 'WaterAI / ESCO', bars: [{ v: data.escoAmount, c: '#7B1FA2' }] },
    { label: 'Klient', bars: [{ v: data.clientAmount, c: '#E65100' }] }
  ], { title: 'Koszty: wartość oszczędności i podział', unit: data.energy.currency });
}

// Interpretacja współczynnika korekcyjnego φ (φ>1 cieplej, φ<1 chłodniej, φ≈1 jak norma)
function _phiInterp(phi, label) {
  if (phi == null) return '';
  if (phi > 1.0005) return `φ<sub>${label}</sub> = ${_fmtA(phi, 4)} &gt; 1 — okres ${label} był <b>cieplejszy</b> od warunków standardowych, dlatego zmierzone zużycie koryguje się <b>w górę</b>.`;
  if (phi < 0.9995) return `φ<sub>${label}</sub> = ${_fmtA(phi, 4)} &lt; 1 — okres ${label} był <b>chłodniejszy</b> od warunków standardowych, dlatego zmierzone zużycie koryguje się <b>w dół</b>.`;
  return `φ<sub>${label}</sub> = ${_fmtA(phi, 4)} ≈ 1 — warunki rzeczywiste odpowiadały standardowym.`;
}

function _analReportBody(data) {
  const _pfx=(data&&data._embedded)?'A.':'';
  if (data && data.type === 'VOLUME') return _analReportBodyVOL(data);
  const u = data.energy.unit, cur = data.energy.currency, tiB = data.tiBefore, tiA = data.tiAfter;
  const genDate = _fmtDateA(new Date().toISOString().slice(0, 10));
  const pos = (data.savedPct || 0) >= 0;
  const priceLine = data.energy.priceMode === 'VARIABLE'
    ? `Całkowity koszt energii w okresie bazowym: <b>${_fmtA(Number(data.energy.price || 0), 2)} ${cur}</b>${data.energy.priceDescription ? ' — ' + _escA(data.energy.priceDescription) : ''}. Wartość oszczędności = koszt bazowy × procent oszczędności: ${_fmtA(Number(data.energy.price || 0), 2)} · ${_fmtA(data.savedPct || 0, 2)}% = <b>${_fmtA(data.savedMoney || 0, 2)} ${cur}</b>`
    : `Cena energii: <b>${_fmtA(Number(data.energy.price || 0), 4)} ${cur}/${u}</b>`;
  return `
  <div class="anw-cover${(data&&data._embedded)?' anw-cover-embed':''}">
    ${(data&&data._proofBannerHTML)||''}
    ${(data&&data._embedded)?'':`<div class="anw-cover-top">
      <img src="logo-waterai.png" alt="WaterAI" class="anw-cover-logo" />
      <div class="anw-cover-num">
        <div class="anw-cover-num-lbl">Nr analizy</div>
        <div class="anw-cover-num-val">${_escA(data.number)}</div>
      </div>
    </div>

    <div class="anw-cover-title">
      <div class="anw-cover-kicker">Raport ESCO · Energy Service Company</div>
      <h1>Analiza oszczędności energii</h1>
      <div class="anw-cover-method">Metoda korekty stopniodni — Typowy Rok Meteorologiczny (TYM)</div>
    </div>`}

    <div class="anw-cover-meta">
      ${(data&&data._embedded)?`<div class="anw-cover-meta-card">
        <div class="anw-cm-lbl">Nr analizy</div>
        <div class="anw-cm-val">${_escA(data.number)}</div>
        <div class="anw-cm-sub">Wykonał: ${_escA(data.author || '—')} · ${_fmtDateA(data.executedAt)}</div>
      </div>`:`<div class="anw-cover-meta-card">
        <div class="anw-cm-lbl">Dla kogo</div>
        <div class="anw-cm-val">${_escA((data.client && data.client.name) || '—')}</div>
        <div class="anw-cm-sub">Obiekt: ${_escA((data.object && data.object.name) || '—')}</div>
      </div>
      <div class="anw-cover-meta-card">
        <div class="anw-cm-lbl">Wykonał — Energy Analyst</div>
        <div class="anw-cm-val">${_escA(data.author || '—')}</div>
        <div class="anw-cm-sub">Data wykonania: ${_fmtDateA(data.executedAt)}</div>
      </div>`}
      <div class="anw-cover-meta-card">
        <div class="anw-cm-lbl">Okres bazowy (PRZED)</div>
        <div class="anw-cm-val anw-cm-period">${_fmtDateA(data.before.from)} → ${_fmtDateA(data.before.to)}</div>
      </div>
      <div class="anw-cover-meta-card">
        <div class="anw-cm-lbl">Okres po wdrożeniu (PO)</div>
        <div class="anw-cm-val anw-cm-period">${_fmtDateA(data.after.from)} → ${_fmtDateA(data.after.to)}</div>
      </div>
    </div>

    <div class="anw-cover-result">
      <div class="anw-cover-result-head">Wynik końcowy</div>
      <div class="anw-cover-osz ${pos ? 'pos' : 'neg'}">
        <div class="anw-cover-osz-lbl">Oszczędność<br>energii</div>
        <div class="anw-cover-osz-val">${pos ? '' : '−'}${_fmtA(Math.abs(data.savedPct || 0), 1)}<span>%</span></div>
      </div>
      <div class="anw-cover-kpis">
        <div class="anw-cover-kpi">
          <div class="v">${_fmtA(data.savedEnergy || 0, 2)} <span>${u}</span></div>
          <div class="k">Energia zaoszczędzona</div>
        </div>
        <div class="anw-cover-kpi">
          <div class="v">${_fmtA(data.savedMoney || 0, 2)} <span>${cur}</span></div>
          <div class="k">Wartość oszczędności</div>
        </div>
        <div class="anw-cover-kpi">
          <div class="v">${_fmtA(data.escoAmount || 0, 2)} <span>${cur}</span></div>
          <div class="k">Udział WaterAI/ESCO (${_fmtA(data.escoShare || 0, 0)}%)</div>
        </div>
      </div>
    </div>

    ${(data&&data._embedded)?'':`<div class="anw-cover-foot">
      <span>Dokument wygenerowany w systemie <b>WaterAI Energy Control</b> · ${genDate}</span>
      <span>control.waterai.cloud</span>
    </div>`}
  </div>

  <div class="anw-step-card">
    <h4><span class="anw-step-num">${_pfx}1</span> Stopniodni grzewcze (SD) — rzeczywiste i standardowe (TYM)</h4>
    <div class="anw-desc">
      ${(data&&data._embedded)?'':`<p style="margin:0 0 8px;">Stopniodni grzewcze (SD) są miarą warunków pogodowych wpływających na zapotrzebowanie obiektu na ciepło do ogrzewania. W analizie wykorzystuje się je do przeliczenia zużycia energii cieplnej do porównywalnych warunków temperaturowych.</p>`}
      <p style="margin:0;">Dla każdego miesiąca stopniodni oblicza się jako iloczyn liczby dni ogrzewania w danym miesiącu oraz różnicy pomiędzy przyjętą temperaturą wewnętrzną w obiekcie a średnią temperaturą zewnętrzną:</p>
    </div>
    <div class="anw-formula">SD = z · (Tᵢ − t)&nbsp;&nbsp;[°C·dni]</div>
    <div class="anw-desc">
      <p style="margin:0 0 4px;">gdzie:</p>
      <ul style="margin:0 0 8px 18px;padding:0;">
        <li><b>SD</b> — liczba stopniodni grzewczych [°C·dni],</li>
        <li><b>z</b> — liczba dni ogrzewania w danym miesiącu,</li>
        <li><b>Tᵢ</b> — temperatura wewnętrzna przyjęta do obliczeń [°C] &nbsp;(PRZED: <b>${tiB} °C</b>, PO: <b>${tiA} °C</b>),</li>
        <li><b>t</b> — średnia temperatura zewnętrzna w danym miesiącu [°C].</li>
      </ul>
      <p style="margin:0 0 6px;">W analizie wyznacza się dwa rodzaje stopniodni:</p>
      <p style="margin:0 0 6px;"><b>a) Stopniodni rzeczywiste</b> — obliczane na podstawie rzeczywistych średnich temperatur zewnętrznych występujących w analizowanym okresie.</p>
      <p style="margin:0 0 6px;"><b>b) Stopniodni standardowe</b> — obliczane na podstawie średnich temperatur zewnętrznych pochodzących z Typowego Roku Meteorologicznego (TYM) dla lokalizacji obiektu. Wartość ta odzwierciedla standardowe warunki pogodowe, do których przelicza się zużycie ciepła w celu zapewnienia porównywalności wyników.</p>
      <p style="margin:0;">W zależności od przyjętych założeń temperatura wewnętrzna Tᵢ może być taka sama lub różna dla okresu PRZED i PO wdrożeniu, jeżeli zmianie uległy warunki eksploatacji lub standard utrzymywanego komfortu cieplnego w obiekcie.</p>
    </div>
    ${_anwPeriodPair(data, tiB, tiA)}
  </div>

  <div class="anw-step-card">
    <h4><span class="anw-step-num">${_pfx}2</span> Współczynnik korekcyjny φ</h4>
    <div class="anw-desc">
      <p style="margin:0 0 8px;">Współczynnik korekcyjny φ służy do przeliczenia zużycia energii cieplnej z warunków rzeczywistych na warunki standardowe, odpowiadające Typowemu Rokowi Meteorologicznemu (TYM). Uwzględnia różnice pomiędzy rzeczywistymi warunkami pogodowymi w analizowanym okresie a warunkami standardowymi.</p>
      <p style="margin:0;">Wyznacza się go jako iloraz sumy stopniodni standardowych oraz sumy stopniodni rzeczywistych dla analizowanego okresu:</p>
    </div>
    <div class="anw-formula">φ = ∑SD<sub>std</sub> / ∑SD<sub>rzecz</sub></div>
    <div class="anw-desc">
      <p style="margin:0 0 4px;">gdzie <b>ΣSD<sub>std</sub></b> — suma stopniodni z temperatur Typowego Roku Meteorologicznego (TYM), <b>ΣSD<sub>rzecz</sub></b> — suma stopniodni z rzeczywistych temperatur zewnętrznych. Interpretacja:</p>
      <ul style="margin:0 0 8px 18px;padding:0;">
        <li><b>φ &gt; 1</b> — analizowany okres był cieplejszy od warunków standardowych, a zużycie należy skorygować w górę,</li>
        <li><b>φ &lt; 1</b> — analizowany okres był chłodniejszy od warunków standardowych, a zużycie należy skorygować w dół,</li>
        <li><b>φ = 1</b> — warunki rzeczywiste odpowiadały warunkom standardowym.</li>
      </ul>
      <p style="margin:0;">Dla analizowanego obiektu wyznaczono następujące wartości współczynnika korekcyjnego:</p>
    </div>
    <div class="anw-g2">
      <div class="anw-formula" style="border-color:#0C447C;">φ<sub>PRZED</sub> = ${_fmtA(data.before.sumS, 1)} / ${_fmtA(data.before.sumR, 1)} = <b>${data.before.phi != null ? _fmtA(data.before.phi, 4) : '—'}</b></div>
      <div class="anw-formula" style="border-color:#27500A;">φ<sub>PO</sub> = ${_fmtA(data.after.sumS, 1)} / ${_fmtA(data.after.sumR, 1)} = <b>${data.after.phi != null ? _fmtA(data.after.phi, 4) : '—'}</b></div>
    </div>
    <div class="anw-desc" style="margin-top:8px;">${_phiInterp(data.before.phi, 'PRZED')}<br>${_phiInterp(data.after.phi, 'PO')}</div>
  </div>

  <div class="anw-step-card">
    <h4><span class="anw-step-num">${_pfx}3</span> Zużycie skorygowane Qs</h4>
    <div class="anw-desc">
      <p style="margin:0 0 8px;">W celu zapewnienia porównywalności wyników zużycie ciepła w analizowanych okresach przelicza się do warunków standardowych, odpowiadających Typowemu Rokowi Meteorologicznemu (TYM). Korekta polega na przemnożeniu rzeczywistego zużycia ciepła na potrzeby centralnego ogrzewania przez współczynnik korekcyjny φ.</p>
      <p style="margin:0;">W wyniku otrzymuje się zużycie skorygowane Qs — zużycie ciepła odpowiadające standardowym warunkom pogodowym. Pozwala to na bezpośrednie porównanie okresu PRZED i PO wdrożeniu, niezależnie od różnic temperatur zewnętrznych występujących w analizowanych sezonach.</p>
    </div>
    <div class="anw-formula">Qs = Qc.o. · φ</div>
    <div class="anw-desc">
      <p style="margin:0 0 4px;">gdzie:</p>
      <ul style="margin:0 0 8px 18px;padding:0;">
        <li><b>Qs</b> — zużycie ciepła skorygowane do warunków standardowych [${u}],</li>
        <li><b>Qc.o.</b> — rzeczywiste zużycie ciepła na potrzeby centralnego ogrzewania w analizowanym okresie [${u}],</li>
        <li><b>φ</b> — współczynnik korekcyjny uwzględniający różnice pomiędzy warunkami rzeczywistymi a standardowymi.</li>
      </ul>
      <p style="margin:0;">Dla analizowanego obiektu otrzymano następujące wartości zużycia skorygowanego:</p>
    </div>
    <div class="anw-g2">
      <div class="anw-formula" style="border-color:#0C447C;">Qs<sub>PRZED</sub> = ${_fmtA(Number(data.before.consumption || 0), 2)} · ${data.before.phi != null ? _fmtA(data.before.phi, 4) : '—'} = <b>${data.before.qs != null ? _fmtA(data.before.qs, 2) : '—'} ${u}</b></div>
      <div class="anw-formula" style="border-color:#27500A;">Qs<sub>PO</sub> = ${_fmtA(Number(data.after.consumption || 0), 2)} · ${data.after.phi != null ? _fmtA(data.after.phi, 4) : '—'} = <b>${data.after.qs != null ? _fmtA(data.after.qs, 2) : '—'} ${u}</b></div>
    </div>
    <div class="anw-desc" style="margin-top:8px;">Po sprowadzeniu obu okresów do warunków Typowego Roku Meteorologicznego wynik nie zależy już od różnic pogody między sezonami. Pozostaje jednak różnica długości — okres PRZED (baza) obejmuje znacznie dłuższy przedział niż okres PO.</div>
    <div class="anw-formula" style="margin-top:10px;">Jednostkowe zużycie energii na jeden standardowy stopniodzień:&nbsp; q = Qs<sub>PRZED</sub> / ∑SD<sub>std,PRZED</sub></div>
    <div class="anw-formula">Prognozowane zużycie energii dla okresu PO:&nbsp; Q<sub>PRZED→PO</sub> = q · ∑SD<sub>std,PO</sub></div>
    <div class="anw-desc"><p style="margin:0;">Na podstawie zużycia skorygowanego okresu PRZED wyznacza się jednostkowe zużycie energii przypadające na jeden standardowy stopniodzień. Następnie jednostkowe zużycie mnoży się przez liczbę standardowych stopniodni okresu PO, otrzymując prognozowane zużycie energii, jakie wystąpiłoby w okresie PO przy zachowaniu charakterystyki energetycznej okresu PRZED.</p></div>
    <div class="anw-g2">
      <div class="anw-formula" style="border-color:#0C447C;">q = ${_fmtA(data.before.qs || 0, 2)} / ${_fmtA(data.before.sumS, 1)} = <b>${_fmtA(data.before.sumS > 0 ? (data.before.qs || 0) / data.before.sumS : 0, 3)} ${u}/SD</b></div>
      <div class="anw-formula" style="border-color:#0C447C;">Q<sub>PRZED→PO</sub> = ${_fmtA(data.before.sumS > 0 ? (data.before.qs || 0) / data.before.sumS : 0, 3)} · ${_fmtA(data.after.sumS, 1)} = <b>${_fmtA(data.qsBeforeNorm || 0, 2)} ${u}</b></div>
    </div>
  </div>

  <div class="anw-step-card">
    <h4><span class="anw-step-num">${_pfx}4</span> Oszczędność energii i rozliczenie</h4>
    <div class="anw-desc">
      <p style="margin:0 0 8px;">Po sprowadzeniu zużycia obu okresów do wspólnej bazy (TYM) oszczędność energii wynika wprost z różnicy zużycia skorygowanego PRZED i PO wdrożeniu — niezależnie od tego, czy dany sezon był cieplejszy, czy chłodniejszy od normy. Wartość oszczędności oraz jej podział pomiędzy WaterAI/ESCO a klienta zależą od przyjętego sposobu wyceny energii.</p>
      <p style="margin:0;">${priceLine}.&nbsp; Udział WaterAI / ESCO: <b>${_fmtA(data.escoShare || 0, 0)}%</b>.</p>
    </div>
    <div class="anw-formula">OSZ = (Q<sub>PRZED→PO</sub> − Qs<sub>PO</sub>) / Q<sub>PRZED→PO</sub> · 100%</div>
    <div class="anw-formula">Energia zaoszczędzona = ${_fmtA(data.qsBeforeNorm || 0, 2)} − ${_fmtA(data.after.qs || 0, 2)} = <b>${_fmtA(data.savedEnergy || 0, 2)} ${u}</b>&nbsp; (${pos ? '' : '−'}${_fmtA(Math.abs(data.savedPct || 0), 1)}%)</div>
    <div class="anw-rgrid" style="margin-top:10px;">
      <div class="anw-tile"><div class="v">${_fmtA(data.savedMoney || 0, 2)} ${cur}</div><div class="k">Wartość oszczędności</div></div>
      <div class="anw-tile"><div class="v">${_fmtA(data.escoAmount || 0, 2)} ${cur}</div><div class="k">Udział WaterAI/ESCO (${_fmtA(data.escoShare || 0, 0)}%)</div></div>
      <div class="anw-tile"><div class="v">${_fmtA(data.clientAmount || 0, 2)} ${cur}</div><div class="k">Udział klienta</div></div>
    </div>
  </div>

  <div class="anw-step-card">
    <h4><span class="anw-step-num">${_pfx}5</span> Wizualizacja</h4>
    <div class="anw-chart-wrap">
      <canvas id="${data.cid}-sd"></canvas>
      <canvas id="${data.cid}-qs"></canvas>
      <canvas id="${data.cid}-save"></canvas>
      <canvas id="${data.cid}-cost"></canvas>
    </div>
  </div>

  ${(data&&data._embedded)?'':`<div class="anw-sign">
    <div class="anw-sign-box">
      <div class="anw-sign-line"></div>
      <div class="anw-sign-cap">Klient — podpis i data</div>
    </div>
    <div class="anw-sign-box anw-sign-wateria">
      <div class="anw-stamp">WaterAI Energy</div>
      <div class="anw-sign-cap" style="margin-top:10px;">Dokument wygenerowany elektronicznie w systemie <b>WaterAI Energy Control</b> dnia ${genDate}. Nie wymaga podpisu ani pieczęci.</div>
      <div class="anw-sign-cap">Analizy energetyczne WaterAI Energy.</div>
    </div>
  </div>`}`;
}

function analPrintPDF() { window.print(); }

// ── podgląd / raport ────────────────────────────────────────────────────────────
function analView(id) {
  const a = AnalysesModule.find(id); if (!a) return;
  const container = document.getElementById('module-content'); if (!container) return;
  if (a.analysisType === 'REGRESSION') {
    const reg = (a.inputParams && a.inputParams.reg) ? a.inputParams.reg : null;
    const model = reg ? _analRegModel(reg) : null;
    const o = (typeof ObjectsModule !== 'undefined') ? ObjectsModule.find(a.objectId) : null;
    container.innerHTML = ANAL_STYLE + `
      <div class="anw-act anw-noprint" style="justify-content:space-between;margin-bottom:14px;">
        <button class="small-button" onclick="renderAnalysesModule()">← Lista analiz</button>
        <button class="anw-run" style="font-size:14px;padding:11px 22px;" onclick="analPrintPDF()">🖨 Drukuj</button>
      </div>
      <div id="anw-report" class="anw-report">${(reg && model) ? _analRegReportBody(a, reg, model, o) : '<div class="reminder-card">Brak zapisanych danych wejściowych tej analizy.</div>'}</div>`;
    return;
  }
  const data = _analReportData({ saved: a });
  container.innerHTML = ANAL_STYLE + `
    <div class="anw-act anw-noprint" style="justify-content:space-between;margin-bottom:14px;">
      <button class="small-button" onclick="renderAnalysesModule()">← Lista analiz</button>
      <button class="anw-run" style="font-size:14px;padding:11px 22px;" onclick="analPrintPDF()">🖨 Drukuj</button>
    </div>
    <div id="anw-report" class="anw-report">${_analReportBody(data)}</div>`;
  setTimeout(() => _analDrawCharts(data), 60);
}

function analGenerateReport(id) {
  if (typeof generateESCOReport === 'function') generateESCOReport(id);
  else alert('Moduł raportów ESCO niedostępny.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// RAPORT ESCO — generowanie i przeglądanie
// ═══════════════════════════════════════════════════════════════════════════════

function generateESCOReport(analysisId) {
  openModule('reports');
  setTimeout(()=>{ window._prefillESCOAnalysisId=analysisId; renderESCOReports(); }, 100);
}

// ── Pomocnicze: selektory, numeracja i lista analiz dla formularza raportu ──────
function escoClientOptions(selectedId){
  const clients=ClientsModule.getAll().slice().sort((a,b)=>Number(a.id)-Number(b.id));
  return `<option value="">— wybierz klienta —</option>`+
    clients.map(c=>`<option value="${c.id}" ${Number(selectedId)===Number(c.id)?'selected':''}>${escapeHtml(c.name)}</option>`).join('');
}

function escoObjectOptions(clientId, selectedId){
  if(!clientId) return `<option value="">— najpierw wybierz klienta —</option>`;
  const objs=ObjectsModule.findByClient(clientId);
  if(!objs.length) return `<option value="">— brak obiektów dla klienta —</option>`;
  return `<option value="">— wybierz obiekt —</option>`+
    objs.map(o=>`<option value="${o.id}" ${Number(selectedId)===Number(o.id)?'selected':''}>${escapeHtml(o.name)}</option>`).join('');
}

// Numer raportu: ESCO/rok/nr klienta/nr obiektu/nr kolejny (w obrębie obiektu)
function escoSuggestNumber(clientId, objectId){
  const year=new Date().getFullYear();
  const cn=(clientId&&typeof ClientsModule.getNumber==='function')?ClientsModule.getNumber(clientId):null;
  const on=(objectId&&typeof ObjectsModule.getNumber==='function')?ObjectsModule.getNumber(objectId):null;
  const existing=JSON.parse(localStorage.getItem('waterai_esco_reports_v1')||'[]')
    .filter(r=>objectId&&Number(r.objectId)===Number(objectId));
  const seq=String(existing.length+1).padStart(3,'0');
  if(cn&&on) return `ESCO/${year}/${cn}/${on}/${seq}`;
  return `ESCO/${year}/${String(new Date().getMonth()+1).padStart(2,'0')}/${seq}`;
}

function escoAnalystOptions(selectedName){
  const analysts=(typeof UsersModule!=='undefined')?UsersModule.findByRole('energyAnalyst'):[];
  const opts=analysts.map(u=>{
    const n=(u.firstName+' '+u.lastName).trim();
    return `<option value="${escapeHtml(n)}" ${selectedName===n?'selected':''}>${escapeHtml(n)}</option>`;
  }).join('');
  return `<option value="">— wybierz —</option>`+opts+
    (analysts.length?'':`<option value="" disabled>brak użytkowników z rolą Energy Analyst</option>`);
}

function escoClientUserOptions(clientId, selectedName){
  let users=(typeof UsersModule!=='undefined')?UsersModule.findByRole('client'):[];
  if(clientId) users=users.filter(u=>!u.clientId||Number(u.clientId)===Number(clientId));
  const opts=users.map(u=>{
    const n=(u.firstName+' '+u.lastName).trim();
    return `<option value="${escapeHtml(n)}" ${selectedName===n?'selected':''}>${escapeHtml(n)}</option>`;
  }).join('');
  return `<option value="">— (uzupełnimy na końcu) —</option>`+opts;
}

// Tabela analiz przypisanych WYŁĄCZNIE do wybranego obiektu — wszystkie typy
function escoAnalysesTableHTML(objectId, preselectIds){
  if(!objectId) return `<div style="font-size:13px;color:var(--color-text-secondary);padding:12px;background:var(--color-background-secondary);border-radius:8px;">Najpierw wybierz <b>klienta</b> i <b>obiekt</b> — pojawią się tu analizy przypisane do tego obiektu.</div>`;
  const anals=AnalysesModule.findByObject(objectId);
  if(!anals.length) return `<div style="font-size:13px;color:var(--color-text-secondary);padding:12px;background:var(--color-background-secondary);border-radius:8px;">Brak analiz dla tego obiektu. Dodaj analizę w module <b>Analizy</b>.</div>`;
  const pre=(preselectIds||[]).map(Number);
  const rows=anals.map(a=>{
    const t=AnalysesModule.TYPES[a.analysisType]||{label:a.analysisType,icon:'📊'};
    const st=AnalysesModule.STATUSES[a.status]||{label:a.status,color:'#666'};
    const r=a.results||{}, ip=a.inputParams||{};
    const p=_escoAnalPct(a);
    const pct=p!=null?p.toFixed(1)+'%':'—';
    const energy=r.savedEnergy!=null?Number(r.savedEnergy).toFixed(2)+' '+(ip.energyUnit||''):'—';
    const _per=_escoAnalPeriod(a);
    const period=(_per.from||_per.to)?`${fmtDate(_per.from)} → ${fmtDate(_per.to)}`:fmtDate(a.executedAt);
    const checked=pre.includes(Number(a.id));
    return `<tr style="border-bottom:.5px solid var(--color-border-tertiary);">
      <td style="padding:6px 10px;text-align:center;"><input type="checkbox" name="esco_anal" value="${a.id}" ${checked?'checked':''} onchange="updateESCOSummary()"/></td>
      <td style="padding:6px 10px;white-space:nowrap;">${t.icon} ${escapeHtml(t.label)}</td>
      <td style="padding:6px 10px;">${escapeHtml(a.name)}</td>
      <td style="padding:6px 10px;white-space:nowrap;">${period}</td>
      <td style="padding:6px 10px;color:#27500A;">${pct}</td>
      <td style="padding:6px 10px;">${energy}</td>
      <td style="padding:6px 10px;"><span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;background:${st.color}22;color:${st.color};">${escapeHtml(st.label)}</span></td>
    </tr>`;
  }).join('');
  return `<div style="overflow-x:auto;border:1px solid var(--color-border-tertiary);border-radius:8px;">
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead><tr style="background:var(--color-background-secondary);">
        <th style="padding:6px 10px;font-size:11px;font-weight:600;border-bottom:1px solid var(--color-border-tertiary);">Wybierz</th>
        <th style="padding:6px 10px;font-size:11px;font-weight:600;border-bottom:1px solid var(--color-border-tertiary);text-align:left;">Typ analizy</th>
        <th style="padding:6px 10px;font-size:11px;font-weight:600;border-bottom:1px solid var(--color-border-tertiary);text-align:left;">Nazwa</th>
        <th style="padding:6px 10px;font-size:11px;font-weight:600;border-bottom:1px solid var(--color-border-tertiary);text-align:left;">Okres / data</th>
        <th style="padding:6px 10px;font-size:11px;font-weight:600;border-bottom:1px solid var(--color-border-tertiary);text-align:left;">% redukcji</th>
        <th style="padding:6px 10px;font-size:11px;font-weight:600;border-bottom:1px solid var(--color-border-tertiary);text-align:left;">Oszczędność</th>
        <th style="padding:6px 10px;font-size:11px;font-weight:600;border-bottom:1px solid var(--color-border-tertiary);text-align:left;">Status</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

// Reakcja na zmianę klienta — przeładuj obiekty, wyczyść analizy, odśwież numer
function escoOnClientChange(){
  const cid=(document.getElementById('esco-client')||{}).value;
  const objSel=document.getElementById('esco-object');
  if(objSel) objSel.innerHTML=escoObjectOptions(cid,null);
  const list=document.getElementById('esco-anal-list');
  if(list) list.innerHTML=escoAnalysesTableHTML(null,[]);
  const num=document.getElementById('esco-number');
  if(num) num.value=escoSuggestNumber(cid,null);
  const box=document.getElementById('esco-summary-box');
  if(box) box.style.display='none';
  window._escoLiveResults=null;
}

// Reakcja na zmianę obiektu — pokaż analizy tego obiektu, odśwież numer
function escoOnObjectChange(){
  const cid=(document.getElementById('esco-client')||{}).value;
  const oid=(document.getElementById('esco-object')||{}).value;
  const list=document.getElementById('esco-anal-list');
  if(list) list.innerHTML=escoAnalysesTableHTML(oid,[]);
  const num=document.getElementById('esco-number');
  if(num) num.value=escoSuggestNumber(cid,oid);
  const box=document.getElementById('esco-summary-box');
  if(box) box.style.display='none';
  window._escoLiveResults=null;
}

function renderESCOReports() {
  const container=document.getElementById('module-content'); if(!container)return;

  const allReports=(window._escoReports||JSON.parse(localStorage.getItem('waterai_esco_reports_v1')||'[]'))
    .sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
  window._escoReports=allReports;

  const prefill=window._prefillESCOAnalysisId;
  const prefillAnal=prefill?AnalysesModule.find(prefill):null;
  const editRep=window._escoEditId?allReports.find(r=>r.id===window._escoEditId):null;
  // „Wróć do edycji" z podglądu nowego (jeszcze niezapisanego) raportu — prefill z wersji roboczej
  const reopenDraft=(window._escoReopen&&!editRep&&window._escoDraft)?window._escoDraft:null;
  window._escoReopen=false; // flaga jednorazowa
  const initSrc=editRep||reopenDraft;
  const initClientId=initSrc?Number(initSrc.clientId):(prefillAnal?Number(prefillAnal.clientId):'');
  const initObjectId=initSrc?Number(initSrc.objectId):(prefillAnal?Number(prefillAnal.objectId):'');
  const preselectIds=initSrc?(initSrc.analysisIds||[]):(prefillAnal?[Number(prefillAnal.id)]:[]);
  const formOpen=!!(prefill||editRep||reopenDraft);

  // Szybka edycja statusu dostępna tylko dla Energy Analyst i Admin
  const canEditStatus=(typeof currentRole!=='undefined')&&(currentRole==='admin'||currentRole==='energyAnalyst');

  const reportRows=allReports.map(rep=>{
    const client=ClientsModule.find(rep.clientId);
    const obj=ObjectsModule.find(rep.objectId);
    const st=escoStatusMeta(rep.status);
    const statusCell=canEditStatus
      ? `<select onchange="escoQuickStatus('${rep.id}',this.value)" title="Zmień status" style="font-size:11px;font-weight:600;padding:3px 22px 3px 9px;border-radius:20px;border:1px solid ${st.color}55;background:${st.color}18;color:${st.color};cursor:pointer;">${['DRAFT','FINAL','SIGNED'].map(s=>`<option value="${s}" ${rep.status===s?'selected':''}>${escoStatusMeta(s).label}</option>`).join('')}</select>`
      : `<span style="font-size:11px;font-weight:600;padding:2px 9px;border-radius:20px;background:${st.color}22;color:${st.color};">${st.label}</span>`;
    return `<tr style="border-bottom:1px solid var(--color-border-tertiary);">
      <td style="padding:9px 12px;font-size:13px;font-weight:500;">${escapeHtml(rep.reportNumber||'—')}</td>
      <td style="padding:9px 12px;font-size:13px;">${escapeHtml((client&&client.name)||'—')}</td>
      <td style="padding:9px 12px;font-size:13px;">${escapeHtml((obj&&obj.name)||'—')}</td>
      <td style="padding:9px 12px;font-size:13px;white-space:nowrap;">${(function(){const p=_escoRepPeriod(rep);return fmtDate(p.from)+' → '+fmtDate(p.to);})()}</td>
      <td style="padding:9px 12px;white-space:nowrap;">${rep.frozen?'<span title="Treść raportu zamrożona">🔒</span> ':''}${statusCell}</td>
      <td style="padding:9px 12px;white-space:nowrap;">
        <div style="display:flex;gap:4px;align-items:center;">
          <button class="icon-btn" onclick="viewESCOReport('${rep.id}')" title="Podgląd">👁</button>
          <button class="icon-btn" onclick="editESCOReport('${rep.id}')" title="Edytuj">✏️</button>
          <button class="icon-btn icon-btn-del" onclick="escoDeleteReport('${rep.id}')" title="Usuń">🗑</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  container.innerHTML=`
  <style>
    .esco-section{margin-bottom:20px;border-radius:10px;overflow:hidden;}
    .esco-body{padding:16px;background:var(--color-background-primary);}
    .esco-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;}
    .esco-grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px;}
    .esco-field label{font-size:12px;color:var(--color-text-secondary);display:block;margin-bottom:4px;}
    .esco-field input,.esco-field select{width:100%;box-sizing:border-box;}
  </style>

  <!-- LISTA RAPORTÓW -->
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;gap:10px;flex-wrap:wrap;">
    <span style="font-size:13px;color:var(--color-text-secondary);">${allReports.length} raportów ESCO</span>
    <button class="primary-button" onclick="document.getElementById('esco-form-wrap').style.display='block';window.scrollTo({top:0,behavior:'smooth'});" style="font-size:13px;padding:8px 18px;">+ Nowy raport ESCO</button>
  </div>

  ${allReports.length===0?`<div class="reminder-card"><strong>Brak raportów ESCO</strong><div class="reminder-meta">Wybierz klienta i obiekt, zaznacz powiązane analizy (TYM, regresja, obłożenie itd.) i wykonaj raport ESCO. Raport jest podstawą do wystawienia faktury za oszczędności.</div></div>`:`
  <div style="overflow-x:auto;border:1px solid var(--color-border-tertiary);border-radius:10px;margin-bottom:24px;">
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead><tr style="background:var(--color-background-secondary);">
        <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Nr raportu</th>
        <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Klient</th>
        <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Obiekt</th>
        <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Okres</th>
        <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Status</th>
        <th style="padding:8px 12px;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Akcje</th>
      </tr></thead>
      <tbody>${reportRows}</tbody>
    </table>
  </div>`}

  <!-- FORMULARZ NOWEGO / EDYTOWANEGO RAPORTU -->
  <div id="esco-form-wrap" style="display:${formOpen?'block':'none'};">
    <div style="border:1px solid #B5D4F4;border-radius:14px;padding:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="margin:0;font-size:16px;color:#0C447C;">📄 ${editRep?'Edytuj raport ESCO':'Nowy raport ESCO'}</h3>
        <button class="small-button" onclick="escoCancelForm()">✕ Zamknij</button>
      </div>
      <form onsubmit="escoBuildPreview(this);return false;">

      <!-- DANE FORMALNE -->
      <div class="esco-section" style="border:1px solid #B5D4F4;">
        <div style="background:#E6F1FB;padding:12px 16px;display:flex;align-items:center;gap:10px;">
          <span style="font-size:18px;">📋</span><h3 style="margin:0;font-size:15px;font-weight:500;color:#0C447C;">Dane formalne raportu</h3>
        </div>
        <div class="esco-body">
          <div class="esco-grid2">
            <div class="esco-field"><label>Klient *</label>
              <select id="esco-client" name="escoClient" required onchange="escoOnClientChange()">${escoClientOptions(initClientId)}</select></div>
            <div class="esco-field"><label>Obiekt *</label>
              <select id="esco-object" name="escoObject" required onchange="escoOnObjectChange()">${escoObjectOptions(initClientId,initObjectId)}</select></div>
          </div>
          <div class="esco-grid3">
            <div class="esco-field"><label>Numer raportu</label><input id="esco-number" name="reportNumber" required placeholder="ESCO/rok/nr klienta/nr obiektu/nr" value="${initSrc?escapeHtml(initSrc.reportNumber||''):escoSuggestNumber(initClientId,initObjectId)}"/></div>
            <div class="esco-field"><label>Data raportu</label><input name="reportDate" type="date" required value="${initSrc&&initSrc.reportDate?initSrc.reportDate:new Date().toISOString().slice(0,10)}"/></div>
            <div class="esco-field"><label>Status</label><select name="reportStatus">
              <option value="DRAFT" ${initSrc&&initSrc.status==='DRAFT'?'selected':''}>Szkic</option>
              <option value="FINAL" ${initSrc&&initSrc.status==='FINAL'?'selected':''}>Finalny</option>
              <option value="SIGNED" ${initSrc&&initSrc.status==='SIGNED'?'selected':''}>Podpisany</option>
            </select></div>
            <div class="esco-field"><label>Sporządził (Energy Analyst)</label>
              <select id="esco-prepared" name="preparedBy">${escoAnalystOptions(initSrc?initSrc.preparedBy:'')}</select></div>
            <div class="esco-field"><label>Podstawa umowna (do rozliczenia)</label>
              <input name="contractRef" placeholder="np. §5 ust. 2 umowy ESCO nr 12/2025" value="${initSrc?escapeHtml(initSrc.contractRef||''):''}"/></div>
          </div>
        </div>
      </div>

      <!-- POWIĄZANE ANALIZY (tylko dla wybranego obiektu, wszystkie typy) -->
      <div class="esco-section" style="border:1px solid #B8E0C8;">
        <div style="background:#E6F5EC;padding:12px 16px;display:flex;align-items:center;gap:10px;">
          <span style="font-size:18px;">🔬</span><h3 style="margin:0;font-size:15px;font-weight:500;color:#1A6B3C;">Powiązane analizy</h3>
        </div>
        <div class="esco-body">
          <div style="font-size:12px;color:var(--color-text-secondary);margin-bottom:10px;">Wyświetlane są wszystkie analizy przypisane do wybranego obiektu (korekta TYM, regresja liniowa, korekta obłożenia, powierzchni i pozostałe). Zaznacz te, które mają wejść do raportu.</div>
          <div id="esco-anal-list">${escoAnalysesTableHTML(initObjectId,preselectIds)}</div>
        </div>
      </div>

      <!-- PODSUMOWANIE WYNIKÓW (live) -->
      <div id="esco-summary-box" style="display:none;" class="anal-result-box" style="background:linear-gradient(135deg,#0C447C,#1a6bb5);">
        <div style="font-size:11px;font-weight:600;letter-spacing:.5px;opacity:.7;margin-bottom:12px;">PODSUMOWANIE RAPORTU ESCO</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;text-align:center;">
          <div><div style="font-size:28px;font-weight:700;" id="esco-res-pct">—</div><div style="font-size:11px;opacity:.8;">% redukcji</div></div>
          <div><div style="font-size:28px;font-weight:700;" id="esco-res-energy">—</div><div style="font-size:11px;opacity:.8;">oszczędność energii</div></div>
          <div><div style="font-size:28px;font-weight:700;" id="esco-res-money">—</div><div style="font-size:11px;opacity:.8;">wartość oszczędności</div></div>
          <div><div style="font-size:28px;font-weight:700;" id="esco-res-reg">—</div><div style="font-size:11px;opacity:.8;">wybrane analizy</div></div>
        </div>
        <div style="margin-top:12px;font-size:12px;opacity:.8;" id="esco-res-detail"></div>
      </div>

      <!-- NOTATKI -->
      <div class="esco-field" style="margin:16px 0;">
        <label>Uwagi do raportu</label>
        <input name="reportNotes" placeholder="opcjonalne uwagi" value="${initSrc?escapeHtml(initSrc.notes||''):''}"/>
      </div>

      <div style="display:flex;gap:10px;">
        <button class="primary-button" type="submit">⚡ Wykonaj Raport ESCO</button>
        <button class="small-button" type="button" onclick="escoCancelForm()">Anuluj</button>
      </div>
      </form>
    </div>
  </div>`;

  // Auto-prefill summary if coming from viewTYMAnalysis
  if(prefill) setTimeout(()=>updateESCOSummary(), 100);
}

// Procent redukcji z dowolnego typu analizy (TYM, regresja, obłożenie, ...)
function _escoAnalPct(a){
  const r=a.results||{};
  if(r.savedEnergyPct!=null) return r.savedEnergyPct<1?r.savedEnergyPct*100:r.savedEnergyPct;
  if(r.avgReductionHeat!=null) return Number(r.avgReductionHeat);
  return null;
}

// Okres liczenia oszczędności (PO) analizy. TYM/obj: inputParams.after.{from,to}.
// Fallback: before, top-level periodFrom/To, data wykonania.
// Tekst metodyki (sekcja 1) i porównania metod (sekcja 4) — ZALEŻNY od metody podstawowej.
// Metodą podstawową (rozliczeniową) może być dowolna korekta; regresja jest zawsze pomocnicza.
function _escoMethodCopy(primType, hasReg, per){
  const M={
    TYM:{head:'korekta do Typowego Roku Meteorologicznego (TYM)',
      p:[
        'Podstawą rozliczenia finansowego jest metoda korekty zużycia do warunków Typowego Roku Meteorologicznego (TYM). Wykorzystuje ona rzeczywiste dane o zużyciu energii pozyskane z liczników lub faktur, które następnie są normalizowane z wykorzystaniem stopniodni grzewczych (HDD).',
        'Dzięki temu zużycie energii w okresie bazowym (PRZED) oraz po wdrożeniu systemu (PO) zostaje przeliczone do identycznych warunków pogodowych. Eliminuje to wpływ różnic klimatycznych pomiędzy analizowanymi sezonami grzewczymi i pozwala na wiarygodne określenie rzeczywistych efektów wdrożenia.',
        'Metoda TYM stanowi podstawę rozliczeń kontraktowych oraz wyliczenia oszczędności będących podstawą wystawienia faktury.'
      ],
      cmp:'<b>Korekta TYM</b> porównuje CAŁKOWITE zużycie sprowadzone do tych samych warunków pogodowych — obejmuje efekty dzienne i sezonowe; to podstawa faktur.'},
    OCCUPANCY:{head:'korekta obłożenia',
      p:[
        'Podstawą rozliczenia finansowego jest metoda korekty zużycia do poziomu obłożenia obiektu. Wykorzystuje ona rzeczywiste dane o zużyciu energii pozyskane z liczników lub faktur, które są normalizowane względem miary obłożenia (np. liczby osobodni lub udziału wykorzystanych pokoi) w analizowanym okresie.',
        'Dzięki temu zużycie energii w okresie bazowym (PRZED) oraz po wdrożeniu systemu (PO) zostaje sprowadzone do porównywalnego poziomu obłożenia. Eliminuje to wpływ różnic w intensywności użytkowania obiektu pomiędzy analizowanymi okresami i pozwala na wiarygodne określenie rzeczywistych efektów wdrożenia.',
        'Metoda korekty obłożenia stanowi podstawę rozliczeń kontraktowych oraz wyliczenia oszczędności będących podstawą wystawienia faktury.'
      ],
      cmp:'<b>Korekta obłożenia</b> porównuje CAŁKOWITE zużycie sprowadzone do tego samego poziomu obłożenia obiektu — obejmuje pełny efekt eksploatacyjny; to podstawa faktur.'},
    AREA:{head:'korekta powierzchni',
      p:[
        'Podstawą rozliczenia finansowego jest metoda korekty zużycia do powierzchni ogrzewanej obiektu. Wykorzystuje ona rzeczywiste dane o zużyciu energii pozyskane z liczników lub faktur, odniesione do powierzchni użytkowej (zużycie na jednostkę powierzchni).',
        'Dzięki temu zużycie energii w okresie bazowym (PRZED) oraz po wdrożeniu systemu (PO) zostaje sprowadzone do porównywalnej powierzchni odniesienia. Eliminuje to wpływ zmian zakresu ogrzewanej powierzchni pomiędzy analizowanymi okresami i pozwala na wiarygodne określenie rzeczywistych efektów wdrożenia.',
        'Metoda korekty powierzchni stanowi podstawę rozliczeń kontraktowych oraz wyliczenia oszczędności będących podstawą wystawienia faktury.'
      ],
      cmp:'<b>Korekta powierzchni</b> porównuje CAŁKOWITE zużycie odniesione do tej samej powierzchni ogrzewanej — obejmuje pełny efekt; to podstawa faktur.'},
    VOLUME:{head:'korekta intensywności',
      p:[
        'Podstawą rozliczenia finansowego jest metoda korekty zużycia do intensywności pracy obiektu. Wykorzystuje ona rzeczywiste dane o zużyciu energii pozyskane z liczników lub faktur, normalizowane względem przyjętej bazy intensywności charakteryzującej obciążenie cieplne obiektu.',
        'Dzięki temu zużycie energii w okresie bazowym (PRZED) oraz po wdrożeniu systemu (PO) zostaje sprowadzone do porównywalnej intensywności pracy. Eliminuje to wpływ różnic w obciążeniu obiektu pomiędzy analizowanymi okresami i pozwala na wiarygodne określenie rzeczywistych efektów wdrożenia.',
        'Metoda korekty intensywności stanowi podstawę rozliczeń kontraktowych oraz wyliczenia oszczędności będących podstawą wystawienia faktury.'
      ],
      cmp:'<b>Korekta intensywności</b> porównuje CAŁKOWITE zużycie sprowadzone do tej samej intensywności pracy obiektu — obejmuje pełny efekt; to podstawa faktur.'},
    SCHEDULE:{head:'korekta harmonogramu',
      p:[
        'Podstawą rozliczenia finansowego jest metoda korekty zużycia do harmonogramu pracy obiektu. Wykorzystuje ona rzeczywiste dane o zużyciu energii pozyskane z liczników lub faktur, normalizowane względem czasu i trybu pracy instalacji (np. godzin lub dni eksploatacji) w analizowanym okresie.',
        'Dzięki temu zużycie energii w okresie bazowym (PRZED) oraz po wdrożeniu systemu (PO) zostaje sprowadzone do porównywalnego harmonogramu pracy. Eliminuje to wpływ różnic w czasie eksploatacji obiektu pomiędzy analizowanymi okresami i pozwala na wiarygodne określenie rzeczywistych efektów wdrożenia.',
        'Metoda korekty harmonogramu stanowi podstawę rozliczeń kontraktowych oraz wyliczenia oszczędności będących podstawą wystawienia faktury.'
      ],
      cmp:'<b>Korekta harmonogramu</b> porównuje CAŁKOWITE zużycie sprowadzone do tego samego harmonogramu pracy — obejmuje pełny efekt eksploatacyjny; to podstawa faktur.'},
    CUSTOM:{head:'metoda niestandardowa',
      p:[
        'Podstawą rozliczenia finansowego jest indywidualnie zdefiniowana metoda korekty zużycia, dobrana do specyfiki obiektu. Wykorzystuje ona rzeczywiste dane o zużyciu energii pozyskane z liczników lub faktur, normalizowane względem przyjętej w analizie bazy odniesienia.',
        'Dzięki temu zużycie energii w okresie bazowym (PRZED) oraz po wdrożeniu systemu (PO) zostaje sprowadzone do porównywalnych warunków odniesienia. Eliminuje to wpływ różnic warunków eksploatacji pomiędzy analizowanymi okresami i pozwala na wiarygodne określenie rzeczywistych efektów wdrożenia.',
        'Przyjęta metoda stanowi podstawę rozliczeń kontraktowych oraz wyliczenia oszczędności będących podstawą wystawienia faktury.'
      ],
      cmp:'<b>Metoda niestandardowa</b> porównuje CAŁKOWITE zużycie sprowadzone do przyjętej bazy odniesienia — obejmuje pełny efekt; to podstawa faktur.'}
  };
  const m=M[primType]||M.TYM;
  const regBlock=hasReg?`
      <p style="margin:12px 0 4px;font-weight:700;color:#0f2f4f;">Metoda pomocnicza (weryfikacyjna) – analiza regresji liniowej</p>
      <p style="margin:0 0 8px;">Niezależnym potwierdzeniem uzyskanych wyników jest analiza regresji liniowej wykonana na podstawie ciągłych pomiarów eksploatacyjnych rejestrowanych co 10 minut (m.in. temperatury zewnętrznej, temperatury zasilania oraz zużycia energii).</p>
      <p style="margin:0 0 4px;">Dla okresów PRZED i PO wyznaczane są charakterystyki pracy obiektu opisane równaniem:</p>
      <div class="anw-formula">y = a · x + b</div>
      <p style="margin:8px 0 8px;">Porównanie otrzymanych charakterystyk pozwala ocenić zmianę intensywności pracy instalacji grzewczej oraz potwierdzić techniczny efekt działania wdrożonego systemu.</p>
      <p style="margin:0 0 8px;">Analiza regresji pełni funkcję dowodu inżynierskiego i stanowi niezależną weryfikację uzyskanych rezultatów, jednak nie zastępuje metody podstawowej jako podstawy rozliczeń finansowych.</p>
      <p style="margin:0 0 8px;">Baza regresji obejmuje okres od montażu urządzenia do aktywacji optymalizacji${(per&&per.regBaseFrom&&per.regBaseTo)?` (${fmtDate(per.regBaseFrom)} → ${fmtDate(per.regBaseTo)})`:''}, w którym instalacja pracowała w dotychczasowym trybie pogodowym — dane z czujników nie istnieją sprzed montażu, dlatego okres odniesienia regresji jest krótszy niż okres bazowy metody rozliczeniowej, oparty na danych rozliczeniowych z pełnego okresu poprzedzającego wdrożenie${(per&&per.tymFrom&&per.tymTo)?` (${fmtDate(per.tymFrom)} → ${fmtDate(per.tymTo)})`:''}. Weryfikacja regresją obejmuje część okna rozliczeniowego, według danych pomiarowych dostępnych na dzień sporządzenia analizy technicznej.</p>`:'';
  const sec1=`
    <div class="anw-desc">
      <p style="margin:0 0 10px;">W celu zapewnienia rzetelnej i obiektywnej oceny uzyskanych oszczędności zastosowano ${hasReg?'dwie wzajemnie uzupełniające się metody analizy':'metodę analizy opisaną poniżej'}.</p>
      <p style="margin:0 0 4px;font-weight:700;color:#0f2f4f;">Metoda podstawowa (rozliczeniowa) – ${m.head}</p>
      ${m.p.map(t=>`<p style="margin:0 0 8px;">${t}</p>`).join('')}
      ${regBlock}
      <p style="margin:10px 0 0;">Szczegółowe obliczenia, wzory matematyczne, tabele wyników oraz wykresy ${hasReg?'dla obu metod':'metody'} przedstawiono w dalszej części raportu, w rozdziale „Dowód uzyskanych oszczędności".</p>
    </div>`;
  const sec4=`
    <div class="anw-desc">
      <p style="margin:0 0 6px;">${m.cmp}</p>
      <p style="margin:0 0 6px;"><b>Regresja</b> analizuje INTENSYWNOŚĆ grzewczą (zużycie i temperatura zasilania na jednostkę temperatury zewnętrznej) — izoluje czysty efekt sterowania.</p>
      <p style="margin:0;"><b>Różnica między metodami nie jest błędem.</b> Każda mierzy inny aspekt tej samej oszczędności, dlatego wzajemnie się weryfikują i wspólnie potwierdzają wynik.</p>
    </div>`;
  return {sec1, sec4};
}

function _escoAnalPeriod(a){
  const ip=(a&&a.inputParams)||{};
  // Regresja trzyma okres PO w inputParams.reg (billing → analyzed), nie w before/after.
  if(a&&a.analysisType==='REGRESSION'&&ip.reg){
    const rb=ip.reg.billing||{}, ra=ip.reg.analyzed||{};
    const rf=rb.from||ra.from||'', rt=rb.to||ra.to||'';
    if(rf||rt) return {from:rf?String(rf).slice(0,10):'', to:rt?String(rt).slice(0,10):''};
  }
  const af=ip.after||{}, bf=ip.before||{};
  const from=af.from||bf.from||a.periodFrom||a.executedAt||'';
  const to  =af.to  ||bf.to  ||a.periodTo  ||a.executedAt||'';
  return {from,to};
}

// Okres raportu: z rep.periodFrom/To, a gdy puste (stare raporty) — policzony z analiz (preferuj TYM).
function _escoRepPeriod(rep){
  let from=rep.periodFrom, to=rep.periodTo;
  if(!from||!to){
    const ids=(rep.analysisIdsTYM&&rep.analysisIdsTYM.length)?rep.analysisIdsTYM:(rep.analysisIds||[]);
    const an=ids.map(id=>AnalysesModule.find(id)).filter(Boolean);
    const fs=an.map(a=>_escoAnalPeriod(a).from).filter(Boolean).sort();
    const ts=an.map(a=>_escoAnalPeriod(a).to).filter(Boolean).sort();
    from=from||fs[0]||''; to=to||ts[ts.length-1]||'';
  }
  return {from,to};
}

// Świeże wyniki analizy — kwoty przeliczane na żywo z danych wejściowych (inputParams),
// dzięki czemu zmiany metodyki rozliczenia działają też dla analiz zapisanych wcześniej.
// Regresja i analizy bez danych wejściowych: fallback do zapisanych a.results.
function _escoFreshRes(a){
  const stored=(a&&a.results)||{};
  if(!a||a.analysisType==='REGRESSION') return stored;
  try{
    const d=_analReportData({saved:a});
    if(d&&d.savedMoney!=null) return Object.assign({},stored,{savedEnergy:d.savedEnergy,savedMoney:d.savedMoney,escoAmount:d.escoAmount});
  }catch(e){}
  return stored;
}

function updateESCOSummary() {
  const ids=[...document.querySelectorAll('[name="esco_anal"]:checked')].map(c=>Number(c.value));
  const anals=ids.map(id=>AnalysesModule.find(id)).filter(Boolean);

  const box=document.getElementById('esco-summary-box');
  if(!box)return;

  if(!anals.length){ box.style.display='none'; window._escoLiveResults=null; return; }
  box.style.display='block';

  let totalSaved=0, totalMoney=0, unit='', currency='';
  const pctVals=[];
  anals.forEach(a=>{
    const r=_escoFreshRes(a), ip=a.inputParams||{};
    if(r.savedEnergy) totalSaved+=Number(r.savedEnergy);
    if(r.savedMoney)  totalMoney+=Number(r.savedMoney);
    if(ip.energyUnit) unit=_normUnitA(ip.energyUnit);
    if(ip.currency)   currency=ip.currency;
    const p=_escoAnalPct(a); if(p!=null) pctVals.push({t:((AnalysesModule.TYPES[a.analysisType]||{}).label||a.analysisType), p});
  });
  const pct=pctVals.map(x=>`${x.t}: ${x.p.toFixed(1)}%`).join(' | ')||'—';

  const pctEl=document.getElementById('esco-res-pct');
  if(pctEl){
    if(pctVals.length<=1){
      pctEl.style.fontSize='28px'; pctEl.style.lineHeight='';
      pctEl.textContent=pctVals.length?pctVals[0].p.toFixed(1)+'%':'—';
    }else{
      pctEl.style.fontSize='15px'; pctEl.style.lineHeight='1.6';
      pctEl.innerHTML=pctVals.map(x=>`${escapeHtml(x.t)}: <b>${x.p.toFixed(1)}%</b>`).join('<br>');
    }
  }
  document.getElementById('esco-res-energy').textContent=totalSaved.toFixed(2)+' '+(unit||'');
  document.getElementById('esco-res-money').textContent=totalMoney.toFixed(2)+' '+(currency||'');
  document.getElementById('esco-res-reg').textContent=String(anals.length);
  document.getElementById('esco-res-detail').textContent=anals.map(a=>{
    const t=(AnalysesModule.TYPES[a.analysisType]||{}).label||a.analysisType;
    return `${t}: ${a.name}`;
  }).join('  |  ');

  window._escoLiveResults={totalSaved, totalMoney, pct, unit, currency, analIds:ids};
}

// Meta statusu raportu (etykieta + kolor) — wspólne dla listy i podglądu
function escoStatusMeta(s){
  return ({DRAFT:{label:'Szkic',color:'#666'},FINAL:{label:'Finalny',color:'#185FA5'},SIGNED:{label:'Podpisany',color:'#27500A'}})[s]||{label:s||'—',color:'#666'};
}

// Zbuduj obiekt raportu z formularza (BEZ zapisu). Przy edycji zachowuje id/createdAt.
function escoBuildReportFromForm(form){
  const clientId=(document.getElementById('esco-client')||{}).value;
  const objectId=(document.getElementById('esco-object')||{}).value;
  const ids=[...document.querySelectorAll('[name="esco_anal"]:checked')].map(c=>Number(c.value));

  if(!clientId){alert('Wybierz klienta.');return null;}
  if(!objectId){alert('Wybierz obiekt.');return null;}
  if(!ids.length){alert('Zaznacz co najmniej jedną analizę powiązaną z tym obiektem.');return null;}

  // upewnij się, że podsumowanie jest policzone z aktualnego zaznaczenia
  updateESCOSummary();
  const r=window._escoLiveResults||{};

  const anals=ids.map(id=>AnalysesModule.find(id)).filter(Boolean);
  const tymIds=anals.filter(a=>a.analysisType==='TYM').map(a=>Number(a.id));
  const regIds=anals.filter(a=>a.analysisType==='REGRESSION').map(a=>Number(a.id));
  const firstTym=anals.find(a=>a.analysisType==='TYM')||anals[0]||{};
  const ftIp=firstTym.inputParams||{}, ftR=firstTym.results||{};

  // okres rozliczeniowy = okres PO (liczenia oszczędności): TYM trzyma go w inputParams.after.{from,to}.
  // Preferuj analizy TYM; jeśli brak — dowolne wybrane. Min from / max to.
  const periodAnals=tymIds.length?anals.filter(a=>a.analysisType==='TYM'):anals;
  const froms=periodAnals.map(a=>_escoAnalPeriod(a).from).filter(Boolean).sort();
  const tos  =periodAnals.map(a=>_escoAnalPeriod(a).to).filter(Boolean).sort();
  const regAnals=anals.filter(a=>a.analysisType==='REGRESSION');
  // średnia redukcja zużycia z regresji (savedEnergyPct = cons.avgPct, w %)
  const regPcts=regAnals.map(a=>(a.results||{}).savedEnergyPct).filter(v=>v!=null).map(Number);
  const avgReg=regPcts.length?regPcts.reduce((s,v)=>s+v,0)/regPcts.length:null;

  // przy edycji zachowaj id i createdAt
  const editId=window._escoEditId;
  const prev=editId?(JSON.parse(localStorage.getItem('waterai_esco_reports_v1')||'[]').find(x=>x.id===editId)||{}):{};

  return {
    id: editId||('esco_'+Date.now()),
    createdAt: prev.createdAt||new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    reportNumber: form.reportNumber.value.trim(),
    reportDate: form.reportDate.value,
    status: form.reportStatus.value,
    preparedBy: form.preparedBy.value.trim(),
    contractRef: (form.contractRef&&form.contractRef.value?form.contractRef.value.trim():''),
    clientId: Number(clientId),
    objectId: Number(objectId),
    periodFrom: froms[0]||'',
    periodTo: tos[tos.length-1]||'',
    analysisIds: ids,
    analysisIdsTYM: tymIds,
    analysisIdsREG: regIds,
    notes: form.reportNotes.value.trim(),
    results:{
      savedEnergyTotal: r.totalSaved||0,
      savedMoneyTotal: r.totalMoney||0,
      savedEnergyPct: ftR.savedEnergyPct||0,
      energyUnit: r.unit||ftIp.energyUnit||'',
      currency: r.currency||ftIp.currency||'',
      avgReductionReg: avgReg!=null?avgReg/100:null
    }
  };
}

// Submit formularza → zbuduj raport i pokaż JEGO TREŚĆ (z przyciskiem „Zapisz" na końcu)
function escoBuildPreview(form){
  const rep=escoBuildReportFromForm(form);
  if(!rep) return;
  window._escoDraft=rep;
  escoRenderReportView(rep,true);
}

// Zapis raportu z podglądu — wstaw nowy albo zaktualizuj istniejący
// ── ZAMRAŻANIE RAPORTU (status Finalny / Podpisany) ─────────────────────────────
// Snapshot analiz (dane wejściowe + wyniki + numery) i nazw klienta/obiektu w rekordzie
// raportu. Zamrożony raport renderuje się z kopii — późniejsze zmiany analiz, cen ani
// nazw nie zmieniają już jego treści. Powrót do statusu Szkic odmraża raport.
function _escoFreeze(rep){
  const analyses=(rep.analysisIds||[]).map(id=>AnalysesModule.find(id)).filter(Boolean).map(a=>{
    const c=JSON.parse(JSON.stringify(a));
    c._frozenNumber=(AnalysesModule.getNumber?AnalysesModule.getNumber(a.id):null)||('#'+a.id);
    return c;
  });
  const client=ClientsModule.find(rep.clientId), obj=ObjectsModule.find(rep.objectId);
  const objectClimate=obj?{weatherStation:obj.weatherStation||'',weatherSource:obj.weatherSource||'',weatherSourceUrl:obj.weatherSourceUrl||'',weatherDataDownloadDate:obj.weatherDataDownloadDate||''}:null;
  return { at:new Date().toISOString(), clientName:(client&&client.name)||'', objectName:(obj&&obj.name)||'', clientAddress:_escoClientAddr(client), clientVatId:(client&&client.vatId)||'', objectClimate, analyses };
}
function _escoApplyFreezePolicy(rep,refresh){
  if(rep.status==='FINAL'||rep.status==='SIGNED'){ if(refresh||!rep.frozen) rep.frozen=_escoFreeze(rep); }
  else if(rep.frozen){ delete rep.frozen; }
  return rep;
}
// Adres klienta z pól FV (ulica nr/lok, kod miasto, kraj) — do okładki raportu.
function _escoClientAddr(c){
  if(!c) return '';
  const l1=([c.street,c.buildingNumber].filter(Boolean).join(' ')+(c.apartmentNumber?'/'+c.apartmentNumber:'')).trim();
  const l2=[c.postalCode,c.city].filter(Boolean).join(' ');
  return [l1,l2,(c.country&&c.country!=='PL')?c.country:''].filter(Boolean).join(', ');
}

// Zapis listy raportów z awaryjnym odchudzeniem zamrożonych danych regresji przy limicie pamięci
// (surowe punkty CSV zostają w analizie źródłowej; dowód regresji dociąga je stamtąd).
function _escoSaveAll(all){
  try{ localStorage.setItem('waterai_esco_reports_v1',JSON.stringify(all)); return true; }
  catch(e){
    all.forEach(rp=>{ if(rp.frozen&&rp.frozen.analyses) rp.frozen.analyses.forEach(c=>{ if(c.analysisType==='REGRESSION'&&c.inputParams&&c.inputParams.reg) delete c.inputParams.reg; }); });
    try{ localStorage.setItem('waterai_esco_reports_v1',JSON.stringify(all)); return true; }
    catch(e2){ alert('Nie udało się zapisać raportów ESCO — limit pamięci przeglądarki.'); return false; }
  }
}

function escoSaveDraft(){
  const rep=window._escoDraft; if(!rep) return;
  _escoApplyFreezePolicy(rep,true); // zapis raportu Finalnego/Podpisanego = nowy snapshot treści
  const all=JSON.parse(localStorage.getItem('waterai_esco_reports_v1')||'[]');
  const i=all.findIndex(x=>x.id===rep.id);
  if(i>=0) all[i]=rep; else all.push(rep);
  if(!_escoSaveAll(all)) return;
  window._escoReports=all;
  window._escoDraft=null; window._escoEditId=null; window._prefillESCOAnalysisId=null;
  renderESCOReports();
}

// „Wróć do edycji" z podglądu — odtwórz formularz z danymi wersji roboczej
function escoBackToEdit(){
  window._escoReopen=true;
  renderESCOReports();
  setTimeout(()=>{ const w=document.getElementById('esco-form-wrap'); if(w) w.style.display='block'; window.scrollTo({top:0,behavior:'smooth'}); updateESCOSummary(); },80);
}

// Zamknięcie / anulowanie formularza — reset trybów
function escoCancelForm(){
  window._escoEditId=null; window._prefillESCOAnalysisId=null; window._escoDraft=null; window._escoReopen=false;
  renderESCOReports();
}

// Edycja istniejącego raportu — otwórz formularz wypełniony danymi raportu
function editESCOReport(id){
  window._escoEditId=id; window._prefillESCOAnalysisId=null; window._escoDraft=null;
  renderESCOReports();
  setTimeout(()=>{ const w=document.getElementById('esco-form-wrap'); if(w) w.style.display='block'; window.scrollTo({top:0,behavior:'smooth'}); updateESCOSummary(); },80);
}

// Usuwanie raportu
function escoDeleteReport(id){
  if(!confirm('Usunąć raport ESCO? Tej operacji nie można cofnąć.')) return;
  const all=JSON.parse(localStorage.getItem('waterai_esco_reports_v1')||'[]').filter(x=>x.id!==id);
  localStorage.setItem('waterai_esco_reports_v1',JSON.stringify(all));
  window._escoReports=all;
  renderESCOReports();
}

// Szybka zmiana statusu z listy (Energy Analyst / Admin)
function escoQuickStatus(id,status){
  const all=JSON.parse(localStorage.getItem('waterai_esco_reports_v1')||'[]');
  const i=all.findIndex(x=>x.id===id); if(i<0) return;
  all[i].status=status; all[i].updatedAt=new Date().toISOString();
  _escoApplyFreezePolicy(all[i],false);
  if(!_escoSaveAll(all)) return;
  window._escoReports=all;
  renderESCOReports();
}

function escoPrintPDF(){ window.print(); }

// Przełącza widoczność załączników dowodowych — wydruk skrócony (część główna) vs pełny.
function escoToggleAttachments(btn){
  const el=document.getElementById('anw-attachments');
  if(!el){ if(btn) btn.style.display='none'; return; }
  const hide=el.style.display!=='none';
  el.style.display=hide?'none':'';
  if(btn) btn.textContent=hide?'📄 Wydruk pełny (pokaż załączniki)':'📄 Wydruk skrócony (ukryj załączniki)';
}

function viewESCOReport(id) {
  const rep=(JSON.parse(localStorage.getItem('waterai_esco_reports_v1')||'[]')).find(r=>r.id===id);
  if(!rep) return;
  escoRenderReportView(rep,false);
}

// Wspólny widok raportu ESCO — używany przez podgląd zapisanego raportu ORAZ podgląd przed zapisem.
// Spójny graficznie z raportami analiz (style anw-*, druk #anw-report).
function escoRenderReportView(rep, isPreview){
  const container=document.getElementById('module-content'); if(!container||!rep) return;
  const toolbar = isPreview
    ? `<div class="anw-noprint" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:16px;">
         <button class="small-button" onclick="escoBackToEdit()">← Wróć do edycji</button>
         <button class="small-button" onclick="escoPrintPDF()">🖨️ Drukuj / PDF</button>
         <button class="small-button" onclick="escoToggleAttachments(this)">📄 Wydruk skrócony (ukryj załączniki)</button>
         <span style="flex:1;"></span>
         <span style="font-size:12px;color:var(--color-text-secondary);">Sprawdź treść raportu i zapisz na dole strony.</span>
       </div>`
    : `<div class="anw-noprint" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:16px;">
         <button class="small-button" onclick="renderESCOReports()">← Lista raportów</button>
         <button class="small-button" onclick="editESCOReport('${rep.id}')">✏️ Edytuj</button>
         <button class="small-button" onclick="escoPrintPDF()">🖨️ Drukuj / PDF</button>
         <button class="small-button" onclick="escoToggleAttachments(this)">📄 Wydruk skrócony (ukryj załączniki)</button>
         <button class="small-button icon-btn-del" onclick="escoDeleteReport('${rep.id}')">🗑 Usuń</button>
       </div>`;
  const footer = isPreview
    ? `<div class="anw-noprint" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:18px;">
         <button class="primary-button" onclick="escoSaveDraft()">💾 Zapisz raport</button>
         <button class="small-button" onclick="escoBackToEdit()">← Wróć do edycji</button>
       </div>`
    : `<div class="anw-noprint" style="margin-top:16px;font-size:11px;color:var(--color-text-secondary);padding:6px 10px;background:var(--color-background-secondary);border-radius:6px;display:inline-block;">🔒 Poufne — przeznaczone dla klienta</div>`;
  const parts=escoBuildReportParts(rep);
  container.innerHTML = ANAL_STYLE + toolbar +
    `<div id="anw-report" class="anw-report">${parts.html}</div>` + footer;
  // wykresy wstawionych raportów metod (TYM/VOLUME); regresja rysuje wykresy SVG inline
  setTimeout(()=>{ (parts.drawDatas||[]).forEach(d=>{ try{ _analDrawCharts(d); }catch(e){} }); }, 80);
  window.scrollTo({top:0,behavior:'smooth'});
}

// Składa OBSZERNY raport ESCO: okładka + metodyka + przegląd analiz + rozliczenie +
// porównanie metod + PEŁNE raporty obu metod (TYM: _analReportBody z wykresami; regresja:
// _analRegReportBody z wykresami SVG) jako dowody + podpisy.
// Zwraca {html, drawDatas} — drawDatas to dane TYM/VOLUME do narysowania po wstawieniu do DOM.
// Prosty słupkowy wykres SVG (sekcja „Wyniki i porównanie metod" raportu ESCO).
function _escoBarsSvg(title, items){
  const vals=items.map(i=>Number(i.v)||0);
  const vmax=Math.max.apply(null,vals.concat([1]));
  const W=700,H=240,L=70,R=20,T=34,Bm=44,cw=(W-L-R)/items.length;
  let bars='';
  items.forEach((it,i)=>{
    const h=(Number(it.v)||0)/vmax*(H-T-Bm);
    const x=L+i*cw+cw*0.18, y=H-Bm-h, bw=cw*0.64;
    bars+=`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="4" fill="${it.c}"/>
    <text x="${(x+bw/2).toFixed(1)}" y="${(y-6).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" fill="#233">${_fmtA(it.v,0)}</text>
    <text x="${(x+bw/2).toFixed(1)}" y="${H-Bm+16}" text-anchor="middle" font-size="11" fill="#5b6670">${_escA(it.l)}</text>`;
  });
  return `<div style="margin-top:6px;"><div style="font-size:13px;font-weight:700;color:#0f2f4f;margin-bottom:4px;">${_escA(title)}</div>
  <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:${W}px;background:#fff;border:1px solid #e6eaef;border-radius:8px;">
    <line x1="${L}" y1="${H-Bm}" x2="${W-R}" y2="${H-Bm}" stroke="#9aa5b1"/>${bars}</svg></div>`;
}

function escoBuildReportParts(rep){
  const client=ClientsModule.find(rep.clientId), obj=ObjectsModule.find(rep.objectId);
  const fz=(rep.frozen&&Array.isArray(rep.frozen.analyses))?rep.frozen:null;
  const _byId=fz?new Map(fz.analyses.map(a=>[Number(a.id),a])):null;
  const _find=id=>fz?(_byId.get(Number(id))||null):AnalysesModule.find(id);
  const clientName=fz&&fz.clientName?fz.clientName:((client&&client.name)||'—');
  const objName=fz&&fz.objectName?fz.objectName:((obj&&obj.name)||'—');
  const clientAddr=(fz&&fz.clientAddress!=null)?fz.clientAddress:_escoClientAddr(client);
  const clientVat=(fz&&fz.clientVatId!=null)?fz.clientVatId:((client&&client.vatId)||'');
  const r=rep.results||{};
  const u=_normUnitA(r.energyUnit||'kWh'), cur=r.currency||'EUR';
  const all=(rep.analysisIds||[]).map(_find).filter(Boolean);
  const tymAnals=(rep.analysisIdsTYM||[]).map(_find).filter(Boolean);
  const regAnals=(rep.analysisIdsREG||[]).map(_find).filter(Boolean);
  const trSet=new Set([...(rep.analysisIdsTYM||[]),...(rep.analysisIdsREG||[])].map(Number));
  const otherAnals=all.filter(a=>!trSet.has(Number(a.id)));
  // Metoda podstawowa = wszystkie analizy poza regresją (TYM lub inna korekta). Regresja = pomocnicza.
  const primaryAnals=all.filter(a=>a.analysisType!=='REGRESSION');
  const regProofAnals=all.filter(a=>a.analysisType==='REGRESSION');
  const primType=(primaryAnals[0]&&primaryAnals[0].analysisType)||'TYM';

  // okres — z raportu; gdy pusty (stare raporty) policz na żywo z analiz (preferuj TYM)
  let pFrom=rep.periodFrom, pTo=rep.periodTo;
  if(!pFrom||!pTo){
    const src=tymAnals.length?tymAnals:all;
    const fs=src.map(a=>_escoAnalPeriod(a).from).filter(Boolean).sort();
    const ts=src.map(a=>_escoAnalPeriod(a).to).filter(Boolean).sort();
    pFrom=pFrom||fs[0]||''; pTo=pTo||ts[ts.length-1]||'';
  }

  const pctNum=r.savedEnergyPct!=null?(r.savedEnergyPct<1?r.savedEnergyPct*100:r.savedEnergyPct):null;
  const pos=(pctNum||0)>=0;
  const _fresh=all.map(a=>_escoFreshRes(a));
  const escoSum=_fresh.reduce((s,fr)=>s+(fr.escoAmount!=null?Number(fr.escoAmount):0),0);
  const moneyTot=_fresh.reduce((s,fr)=>s+(fr.savedMoney!=null?Number(fr.savedMoney):0),0);
  const clientSum=moneyTot-escoSum;
  const genDate=fmtDate(new Date().toISOString().slice(0,10));
  const stMeta=escoStatusMeta(rep.status);

  const typeMeta=a=>((AnalysesModule.TYPES&&AnalysesModule.TYPES[a.analysisType])||{label:a.analysisType,icon:'📊'});
  const headline=a=>{
    const ar=(a.analysisType==='REGRESSION')?(a.results||{}):_escoFreshRes(a), ai=a.inputParams||{};
    if(a.analysisType==='REGRESSION'){
      const c=ar.savedEnergyPct!=null?_fmtA(ar.savedEnergyPct,1)+'% zużycia ciepła':'';
      const s=ar.supplyPct!=null?_fmtA(ar.supplyPct,1)+'% temp. zasilania':'';
      return [c,s].filter(Boolean).join(' · ')||'—';
    }
    const p=_escoAnalPct(a);
    const e=ar.savedEnergy!=null?_fmtA(ar.savedEnergy,2)+' '+_normUnitA(ai.energyUnit||u):'';
    const m=ar.savedMoney!=null?_fmtA(ar.savedMoney,2)+' '+(ai.currency||cur):'';
    return [p!=null?_fmtA(p,1)+'% redukcji':'',e,m].filter(Boolean).join(' · ')||'—';
  };
  const overviewRows=all.slice().sort((a,b)=>((a.analysisType==='REGRESSION')?1:0)-((b.analysisType==='REGRESSION')?1:0)).map(a=>{
    const t=typeMeta(a), per=_escoAnalPeriod(a);
    return `<tr><td>${t.icon} ${escapeHtml(t.label)}</td><td>${escapeHtml(a.name)}</td><td class="calc">${fmtDate(per.from)} → ${fmtDate(per.to)}</td><td class="calc">${headline(a)}</td></tr>`;
  }).join('');

  let n=0; const sec=(title,inner)=>{ n++; return `<div class="anw-step-card"><h4><span class="anw-step-num">${n}</span> ${title}</h4>${inner}</div>`; };

  // ── okładka ESCO ──
  const cover=`
  <div class="anw-cover">
    <div class="anw-cover-top">
      <img src="logo-waterai.png" alt="WaterAI" class="anw-cover-logo" />
      <div class="anw-cover-num">
        <div class="anw-cover-num-lbl">Nr raportu</div>
        <div class="anw-cover-num-val">${escapeHtml(rep.reportNumber||'—')}</div>
      </div>
    </div>
    <div class="anw-cover-title">
      <div class="anw-cover-kicker">Raport ESCO · Energy Service Company</div>
      <h1>Raport rozliczeniowy ESCO</h1>
      <div class="anw-cover-method">Zbiorcze rozliczenie oszczędności energii — metoda główna TYM (stopniodni), weryfikacja metodą pomocniczą (regresja liniowa)</div>
    </div>
    <div class="anw-cover-meta">
      <div class="anw-cover-meta-card">
        <div class="anw-cm-lbl">Dla kogo</div>
        <div class="anw-cm-val">${escapeHtml(clientName)}</div>
        ${clientAddr?`<div class="anw-cm-sub">${escapeHtml(clientAddr)}</div>`:''}
        ${clientVat?`<div class="anw-cm-sub">NIP/IČO: ${escapeHtml(clientVat)}</div>`:''}
        <div class="anw-cm-sub">Obiekt: ${escapeHtml(objName)}</div>
      </div>
      <div class="anw-cover-meta-card">
        <div class="anw-cm-lbl">Sporządził — Energy Analyst</div>
        <div class="anw-cm-val">${escapeHtml(rep.preparedBy||'—')}</div>
        <div class="anw-cm-sub">Data raportu: ${fmtDate(rep.reportDate)}</div>
      </div>
      <div class="anw-cover-meta-card">
        <div class="anw-cm-lbl">Okres rozliczeniowy (liczenia oszczędności)</div>
        <div class="anw-cm-val anw-cm-period">${fmtDate(pFrom)} → ${fmtDate(pTo)}</div>
      </div>
      <div class="anw-cover-meta-card">
        <div class="anw-cm-lbl">Status raportu</div>
        <div class="anw-cm-val"><span style="display:inline-block;font-size:13px;font-weight:700;padding:3px 12px;border-radius:20px;background:${stMeta.color}22;color:${stMeta.color};">${stMeta.label}</span></div>
        <div class="anw-cm-sub">Analiz w raporcie: ${all.length} (metoda główna: ${primaryAnals.length}, regresja: ${regProofAnals.length})</div>
        ${fz?`<div class="anw-cm-sub" style="color:#7B1FA2;font-weight:600;">🔒 Treść rozliczeniowa zamrożona ${fmtDate(fz.at.slice(0,10))} — dokument niezmienny</div>`:''}
      </div>
    </div>
    <div class="anw-cover-result">
      <div class="anw-cover-result-head">Wynik końcowy</div>
      <div class="anw-cover-osz ${pos?'pos':'neg'}">
        <div class="anw-cover-osz-lbl">Oszczędność<br>energii (TYM)</div>
        <div class="anw-cover-osz-val">${pctNum!=null?(pos?'':'−')+_fmtA(Math.abs(pctNum),1):'—'}<span>%</span></div>
      </div>
      <div class="anw-cover-kpis">
        <div class="anw-cover-kpi"><div class="v">${_fmtA(r.savedEnergyTotal||0,2)} <span>${u}</span></div><div class="k">Energia zaoszczędzona</div></div>
        <div class="anw-cover-kpi"><div class="v">${_fmtA(moneyTot||0,2)} <span>${cur}</span></div><div class="k">Wartość oszczędności</div></div>
        <div class="anw-cover-kpi"><div class="v">${_fmtA(escoSum||0,2)} <span>${cur}</span></div><div class="k">Udział WaterAI/ESCO</div></div>
      </div>
    </div>
    <div class="anw-cover-foot">
      <span>System <b>WaterAI Energy Control</b> · Data raportu: ${fmtDate(rep.reportDate)} · Wydruk z dnia: ${genDate}${fz?` · Treść zamrożona: ${fmtDate(fz.at.slice(0,10))}`:''}</span>
      <span>control.waterai.cloud</span>
    </div>
  </div>`;

  const _mcPer=(()=>{
    const out={};
    try{
      const pr=primaryAnals[0];
      if(pr&&pr.inputParams&&pr.inputParams.before){ out.tymFrom=pr.inputParams.before.from||''; out.tymTo=pr.inputParams.before.to||''; }
      const rg=regProofAnals[0];
      if(rg&&rg.inputParams&&rg.inputParams.reg&&rg.inputParams.reg.baseLines){
        const pid=rg.inputParams.reg.baseLines.periodId;
        const bp=(window.RegressionBaseModule&&pid!=null)?RegressionBaseModule.find(rg.objectId,pid):null;
        if(bp){ out.regBaseFrom=bp.periodFrom?String(bp.periodFrom).slice(0,10):''; out.regBaseTo=bp.periodTo?String(bp.periodTo).slice(0,10):''; }
      }
    }catch(e){}
    return out;
  })();
  const _mc=_escoMethodCopy(primType, regProofAnals.length>0, _mcPer);
  const bodyMetodyka=_mc.sec1;

  const bodyOverview=all.length
    ? `<table class="anw-t"><thead><tr><th>Typ</th><th>Analiza</th><th style="text-align:right;">Okres (PO)</th><th style="text-align:right;">Wynik</th></tr></thead><tbody>${overviewRows}</tbody></table>`
    : `<div class="anw-desc"><p style="margin:0;">Brak analiz w raporcie.</p></div>`;

  // Pełne wyprowadzenie rozliczenia — per analiza rozliczeniowa (energia, wycena, obliczenie, wartość)
  const finRows=primaryAnals.map(a=>{
    let d=null; try{ d=_analReportData({saved:a}); }catch(e){}
    const fr=_escoFreshRes(a), ai=a.inputParams||{};
    const au=_normUnitA((d&&d.energy&&d.energy.unit)||ai.energyUnit||u), ac=(d&&d.energy&&d.energy.currency)||ai.currency||cur;
    const en=fr.savedEnergy!=null?_fmtA(fr.savedEnergy,2)+' '+au:'—';
    let wyc='—', obl='—';
    if(d&&d.energy){
      const prc=Number(d.energy.price||0);
      if(d.energy.priceMode==='VARIABLE'){
        wyc=`Koszt zmienny całościowy (koszt bazowy: ${_fmtA(prc,2)} ${ac})`;
        obl=`${_fmtA(prc,2)} ${ac} × ${_fmtA(d.savedPct||0,2)}% = <b>${_fmtA(fr.savedMoney||0,2)} ${ac}</b>`;
      }else{
        wyc=`Cena stała: ${_fmtA(prc,4)} ${ac}/${au}`;
        obl=`${_fmtA(fr.savedEnergy||0,2)} ${au} × ${_fmtA(prc,4)} ${ac}/${au} = <b>${_fmtA(fr.savedMoney||0,2)} ${ac}</b>`;
      }
    }
    return `<tr><td>${escapeHtml(a.name)}</td><td class="calc">${en}</td><td>${wyc}</td><td class="calc">${obl}</td></tr>`;
  }).join('');
  const shareSet=[...new Set(primaryAnals.map(a=>{ let d=null; try{ d=_analReportData({saved:a}); }catch(e){} return d?Number(d.escoShare||0):null; }).filter(v=>v!=null))];
  const shareTxt=shareSet.length===1?_fmtA(shareSet[0],0)+'%':'wg udziałów przypisanych w poszczególnych analizach';
  const contractTxt=rep.contractRef?`zgodnie z ${escapeHtml(rep.contractRef)}`:'zgodnie z zawartą umową o poprawę efektywności energetycznej (ESCO)';
  const bodyFin=`
    <div class="anw-desc"><p style="margin:0 0 8px;"><b>Okres rozliczeniowy:</b> ${fmtDate(pFrom)} → ${fmtDate(pTo)}.&nbsp; Rozliczenie obejmuje oszczędności energii wyznaczone metodą rozliczeniową (${escapeHtml((AnalysesModule.TYPES[primType]||{}).label||primType)}) i wykazane w części dowodowej niniejszego raportu.</p></div>
    <table class="anw-t"><thead><tr><th>Analiza rozliczeniowa</th><th style="text-align:right;">Energia zaoszczędzona</th><th>Sposób wyceny energii</th><th style="text-align:right;">Obliczenie wartości oszczędności</th></tr></thead>
      <tbody>${finRows||'<tr><td colspan="4">Brak analiz rozliczeniowych.</td></tr>'}</tbody>
      <tfoot><tr><td colspan="3"><b>Wartość oszczędności łącznie (netto)</b></td><td class="calc"><b>${_fmtA(moneyTot||0,2)} ${cur}</b></td></tr></tfoot></table>
    <div class="anw-desc" style="margin-top:10px;"><p style="margin:0;"><b>Podział oszczędności</b> — udział WaterAI/ESCO: <b>${shareTxt}</b>, ${contractTxt}:</p></div>
    <div class="anw-formula">Udział WaterAI/ESCO = ${_fmtA(moneyTot||0,2)} ${cur} × ${shareSet.length===1?_fmtA(shareSet[0],0)+'%':'udział'} = <b>${_fmtA(escoSum,2)} ${cur}</b>&nbsp;·&nbsp; Udział klienta = ${_fmtA(moneyTot||0,2)} − ${_fmtA(escoSum,2)} = <b>${_fmtA(clientSum||0,2)} ${cur}</b></div>
    <div class="anw-rgrid" style="margin-top:10px;">
      <div class="anw-tile"><div class="v" style="font-size:20px;font-weight:700;color:#0C447C;font-variant-numeric:tabular-nums;">${_fmtA(moneyTot||0,2)} ${cur}</div><div class="k">Wartość oszczędności (łącznie, netto)</div></div>
      <div class="anw-tile"><div class="v" style="font-size:20px;font-weight:700;color:#7B1FA2;font-variant-numeric:tabular-nums;">${_fmtA(escoSum,2)} ${cur}</div><div class="k">Udział WaterAI / ESCO (netto)</div></div>
      <div class="anw-tile"><div class="v" style="font-size:20px;font-weight:700;color:#27500A;font-variant-numeric:tabular-nums;">${clientSum!=null?_fmtA(clientSum,2)+' '+cur:'—'}</div><div class="k">Udział klienta (netto)</div></div>
    </div>
    <div class="anw-desc" style="margin-top:8px;"><p style="margin:0;">Wszystkie kwoty są kwotami <b>netto</b>. Do kwoty udziału WaterAI/ESCO zostanie doliczony podatek VAT według stawki obowiązującej w dniu wystawienia faktury. Kwota udziału WaterAI/ESCO stanowi podstawę do wystawienia faktury za oszczędności osiągnięte w okresie rozliczeniowym; pozostała część wartości oszczędności przypada klientowi.</p></div>`;

  // Zestawienie liczbowe obu metod (dynamiczne — wartości z analiz tego raportu; brakujące elementy pomijane)
  let cmpNums='', _sumRegPct=null, _sumSupPct=null, _cmpModel=null;
  try{
    const regA=regProofAnals[0];
    const rr=regA?(regA.results||{}):{};
    const regPct=rr.savedEnergyPct!=null?Number(rr.savedEnergyPct):null;
    const supPct=rr.supplyPct!=null?Number(rr.supplyPct):null;
    _sumRegPct=regPct; _sumSupPct=supPct;
    let rngTxt='', endTxt='', insideTxt='';
    if(regA){
      let regIn=(regA.inputParams&&regA.inputParams.reg)?regA.inputParams.reg:null;
      if(!regIn&&fz){ const live=AnalysesModule.find(regA.id); regIn=(live&&live.inputParams&&live.inputParams.reg)?live.inputParams.reg:null; }
      const mdl=regIn?_analRegModel(regIn):null;
      _cmpModel=mdl;
      if(mdl&&mdl.range) rngTxt=` w zakresie temperatur zewnętrznych ${mdl.range.from}…${mdl.range.to} °C`;
      if(mdl&&mdl.cons&&mdl.cons.rows&&mdl.cons.rows.length>1){
        const rws=mdl.cons.rows.filter(x=>x.D!=null&&isFinite(x.D));
        if(rws.length>1){
          const f=rws[0], l=rws[rws.length-1];
          endTxt=` Redukcja wykazana regresją zmienia się z temperaturą zewnętrzną — od ok. ${_fmtA(f.D,1)}% przy ${f.t} °C do ok. ${_fmtA(l.D,1)}% przy ${l.t} °C.`;
          const dmin=Math.min.apply(null,rws.map(x=>x.D)), dmax=Math.max.apply(null,rws.map(x=>x.D));
          if(pctNum!=null&&pctNum>=dmin&&pctNum<=dmax) insideTxt=' Wynik metody rozliczeniowej mieści się wewnątrz przedziału wskazywanego przez regresję.';
        }
      }
    }
    if(pctNum!=null&&regPct!=null){
      const primLabel=(AnalysesModule.TYPES[primType]||{}).label||primType;
      const diff=Math.abs(pctNum-regPct);
      cmpNums=`<div class="anw-desc"><p style="margin:0 0 8px;"><b>Zestawienie wyników obu metod:</b> metoda rozliczeniowa (${escapeHtml(primLabel)}) wykazała oszczędność <b>${_fmtA(pctNum,1)}%</b> całkowitego zużycia ciepła w okresie rozliczeniowym ${fmtDate(pFrom)} → ${fmtDate(pTo)}; metoda pomocnicza (regresja) — średnie obniżenie intensywności zużycia o <b>${_fmtA(regPct,1)}%</b>${rngTxt}${supPct!=null?` oraz obniżenie temperatury zasilania o ${_fmtA(supPct,1)}%`:''}.</p>
      <p style="margin:0 0 8px;">Różnica ok. ${_fmtA(diff,1)} p.p. jest oczekiwana i nie świadczy o błędzie żadnej z metod — mierzą one różne wielkości: metoda rozliczeniowa porównuje całkowite zużycie okresu (wraz z efektami harmonogramów i dni bez ogrzewania), regresja — czystą intensywność na jednostkę temperatury zewnętrznej, uśrednioną po przyjętym zakresie.${endTxt}${insideTxt} Zgodność dwóch niezależnych metod, opartych na różnych źródłach danych (licznik główny vs czujniki), wzajemnie potwierdza wiarygodność wyniku.</p></div>`;
    }
  }catch(e){}
  // Prognoza roczna: q × suma standardowych stopniodni pełnego roku (TYM), per analiza rozliczeniowa
  let bodyForecast='', _fx=null;
  try{
    const fRows=[]; let fTotMoney=0, fCur='', fCurMixed=false, fTotE=0, fUnit='';
    primaryAnals.forEach(a=>{
      if(a.analysisType==='VOLUME') return;
      let d=null; try{ d=_analReportData({saved:a}); }catch(e){ return; }
      if(!d||!d.before||!(d.before.sumS>0)||!d.after||!(d.after.sumS>0)) return;
      const ti=(d.tiBefore!=null&&d.tiBefore!=='')?Number(d.tiBefore):20;
      let yearSD=0; for(let m=1;m<=12;m++){ const v=(d.std&&d.std[m])||[0,0]; yearSD+=_sd20(Number(v[0]),Number(v[1]||0),ti); }
      if(!(yearSD>0)) return;
      const qB=(d.before.qs||0)/d.before.sumS, qP=(d.after.qs||0)/d.after.sumS;
      const consBase=qB*yearSD, consTech=qP*yearSD, savedE=consBase-consTech;
      const pctF=consBase>0?savedE/consBase*100:0;
      const au=d.energy.unit, ac=d.energy.currency||cur;
      const prc=Number(d.energy.price||0);
      const money=(d.energy.priceMode==='VARIABLE') ? prc*(yearSD/d.before.sumS)*(pctF/100) : savedE*prc;
      if(!fCur) fCur=ac; else if(fCur!==ac) fCurMixed=true;
      fTotMoney+=money; fTotE+=savedE; if(!fUnit) fUnit=au; else if(fUnit!==au) fUnit='~';
      fRows.push(`<tr><td>${escapeHtml(a.name)}</td><td class="calc">${_fmtA(consBase,0)} ${au}</td><td class="calc">${_fmtA(consTech,0)} ${au}</td><td class="calc"><b>${_fmtA(savedE,0)} ${au}</b> (${_fmtA(pctF,1)}%)</td><td class="calc"><b>${_fmtA(money,2)} ${ac}</b></td></tr>`);
    });
    if(fRows.length){
      _fx={e:fTotE,u:fUnit,m:fTotMoney,cur:fCur,mixed:fCurMixed};
      bodyForecast=`
    <div class="anw-desc"><p style="margin:0 0 8px;">Prognoza ekstrapoluje jednostkowe zużycie energii na standardowy stopniodzień (q), wyznaczone w części dowodowej, na <b>pełny rok w warunkach Typowego Roku Meteorologicznego</b>: prognozowane zużycie roczne = q × suma standardowych stopniodni pełnego sezonu. Zestawienie porównuje zużycie roczne przy charakterystyce energetycznej okresu bazowego (bez technologii) i okresu po wdrożeniu (z technologią WaterAI).</p></div>
    <table class="anw-t"><thead><tr><th>Analiza</th><th style="text-align:right;">Rocznie bez technologii</th><th style="text-align:right;">Rocznie z technologią</th><th style="text-align:right;">Prognoza oszczędności energii</th><th style="text-align:right;">Prognoza wartości / rok</th></tr></thead><tbody>${fRows.join('')}</tbody>${(fRows.length>1&&!fCurMixed)?`<tfoot><tr><td colspan="4"><b>Łącznie</b></td><td class="calc"><b>${_fmtA(fTotMoney,2)} ${fCur}</b></td></tr></tfoot>`:''}</table>
    <div class="anw-desc" style="margin-top:8px;"><p style="margin:0;">Prognoza ma charakter <b>orientacyjny</b> — zakłada utrzymanie charakterystyki energetycznej obu okresów oraz typowe warunki pogodowe (TYM). <b>Nie stanowi podstawy do wystawienia faktury</b>; rozliczenia dokonywane są wyłącznie za zamknięte okresy rozliczeniowe, zgodnie z sekcją „Rozliczenie finansowe ESCO".</p></div>`;
    }
  }catch(e){}

  // ── DOWODY: pełne raporty metod ──
  // Zamiast osobnej strony-przekładki, baner „Dowód · …" wchodzi NA stronę okładki danego dowodu
  // (okładka dostaje klasę anw-cover-embed → zaczyna nową stronę, bez pustej kartki). Regresja ma
  // odrębny, zielony akcent, żeby metoda pomocnicza była wizualnie odznaczona.
  const drawDatas=[];
  const proofBanner=(kicker,title,accent,bg)=>`<div class="anw-proof-banner" style="border-left:5px solid ${accent};background:${bg};"><div class="anw-proof-kicker" style="color:${accent};">${kicker}</div><div class="anw-proof-title">${escapeHtml(title)}</div></div>`;
  const failCard=(a,msg)=>{ const t=typeMeta(a); return `<div class="anw-step-card" style="page-break-before:always;break-before:page;"><h4>${t.icon} ${escapeHtml(a.name)}</h4><div class="anw-desc"><p style="margin:0;">${msg} Wynik skrótowy: ${headline(a)}.</p></div></div>`; };

  let proofs='';
  primaryAnals.forEach((a,i)=>{
    try{ const data=_analReportData({saved:a}); data._embedded=true;
      if(a._frozenNumber) data.number=a._frozenNumber;
      if(fz&&fz.objectClimate) data._climate=fz.objectClimate;
      data._proofBannerHTML=proofBanner('Załącznik A · Dowód — metoda główna ('+typeMeta(a).label+')'+(primaryAnals.length>1?` — ${i+1}/${primaryAnals.length}`:''), a.name, '#0C447C', '#EEF4FB');
      drawDatas.push(data);
      proofs+=_analReportBody(data);
    }catch(e){ proofs+=failCard(a,'Nie udało się odtworzyć pełnego raportu tej analizy.'); }
  });
  regProofAnals.forEach((a,i)=>{
    try{
      let reg=(a.inputParams&&a.inputParams.reg)?a.inputParams.reg:null;
      if(!reg&&fz){ const live=AnalysesModule.find(a.id); reg=(live&&live.inputParams&&live.inputParams.reg)?live.inputParams.reg:null; }
      const model=reg?_analRegModel(reg):null;
      const o=ObjectsModule.find(a.objectId);
      const banner=proofBanner('Załącznik B · Dowód — metoda pomocnicza (regresja)'+(regProofAnals.length>1?` — ${i+1}/${regProofAnals.length}`:''), a.name, '#0E8A6B', '#E7F6F0');
      if(reg&&model) proofs+=_analRegReportBody(a,reg,model,o,true,banner);
      else proofs+=failCard(a,'Brak zapisanych danych źródłowych regresji (CSV) dla tej analizy.');
    }catch(e){ proofs+=failCard(a,'Nie udało się odtworzyć pełnego raportu regresji.'); }
  });

  const signatures=`
  <div class="anw-sign">
    <div class="anw-sign-box">
      <div class="anw-sign-line"></div>
      <div class="anw-sign-cap">Klient — podpis i data</div>
    </div>
    <div class="anw-sign-box anw-sign-wateria">
      <div class="anw-stamp">WaterAI Energy</div>
      <div class="anw-sign-cap" style="margin-top:10px;">Dokument wygenerowany elektronicznie w systemie <b>WaterAI Energy Control</b>. Data raportu: ${fmtDate(rep.reportDate)}${fz?` · treść zamrożona: ${fmtDate(fz.at.slice(0,10))}`:''} · wydruk z dnia: ${genDate}. Nie wymaga podpisu ani pieczęci.</div>
      <div class="anw-sign-cap">Rozliczenia ESCO — WaterAI Energy.</div>
    </div>
  </div>`;

  // ── Podsumowanie wykonawcze (z danych zebranych wyżej) ──
  const primLabel=(AnalysesModule.TYPES[primType]||{}).label||primType;
  const energyTotF=_fresh.reduce((sm,fr)=>sm+(fr.savedEnergy!=null?Number(fr.savedEnergy):0),0);
  const bodySummary=`
    <div class="anw-desc"><p style="margin:0 0 8px;">W okresie rozliczeniowym <b>${fmtDate(pFrom)} → ${fmtDate(pTo)}</b> zmierzono efekty działania systemu WaterAI w obiekcie <b>${escapeHtml(objName)}</b>. Metoda rozliczeniowa (${escapeHtml(primLabel)}) wykazała redukcję zużycia energii o <b>${pctNum!=null?_fmtA(pctNum,1):'—'}%</b> — ${_fmtA(energyTotF,2)} ${u} o wartości <b>${_fmtA(moneyTot||0,2)} ${cur} netto</b>.${(_sumRegPct!=null)?` Wynik potwierdziła niezależna analiza regresji liniowej: średnie obniżenie intensywności zużycia ciepła o <b>${_fmtA(_sumRegPct,1)}%</b>${_sumSupPct!=null?` oraz temperatury zasilania o ${_fmtA(_sumSupPct,1)}%`:''}.`:''}</p>
    <p style="margin:0;">Do rozliczenia, zgodnie z udziałem ${shareTxt}, przypada WaterAI/ESCO <b>${_fmtA(escoSum,2)} ${cur} netto</b>; udział klienta wynosi <b>${_fmtA(clientSum||0,2)} ${cur}</b>.${_fx?` Utrzymanie uzyskanej charakterystyki oznacza prognozowaną oszczędność około <b>${_fmtA(_fx.e,0)} ${_fx.u==='~'?u:_fx.u}${!_fx.mixed?` ≈ ${_fmtA(_fx.m,0)} ${_fx.cur}`:''} rocznie</b> (prognoza orientacyjna). `:' '}Szczegółowe wyprowadzenia i dane źródłowe zawierają załączniki dowodowe.</p></div>`;

  // ── Wyniki i porównanie metod: tabela + kluczowe wykresy + zgodność ──
  let resCharts='';
  try{
    const d0=primaryAnals.length?_analReportData({saved:primaryAnals[0]}):null;
    if(d0&&d0.qsBeforeNorm!=null) resCharts+=_escoBarsSvg(`Oszczędność energii — baza sprowadzona do okresu PO [${(d0.energy&&d0.energy.unit)||u}]`,[
      {l:'Baza PRZED→PO',v:d0.qsBeforeNorm||0,c:'#0C447C'},{l:'PO (WaterAI)',v:(d0.after&&d0.after.qs)||0,c:'#27500A'},{l:'Zaoszczędzono',v:d0.savedEnergy||0,c:'#1E7B34'}]);
  }catch(e){}
  if(_cmpModel&&_cmpModel.cons){
    resCharts+=`<div style="margin-top:14px;">${_analRegChartSvg('📉 Zużycie ciepła — linie Tryb pogodowy vs WaterAI', _cmpModel.cons, 'Zużycie ciepła [MJ]')}</div>`;
    resCharts+=`<div style="margin-top:14px;">${_analRegReductionSvg('📊 Redukcja zużycia ciepła wg temperatury zewnętrznej', _cmpModel.cons)}</div>`;
  }
  const bodyResults=(all.length?`<div class="anw-desc"><p style="margin:0 0 6px;font-weight:700;color:#0f2f4f;">Uwzględnione analizy</p></div>`+bodyOverview:'')
    +(resCharts?`<div class="anw-desc" style="margin-top:12px;"><p style="margin:0 0 6px;font-weight:700;color:#0f2f4f;">Kluczowe wykresy</p></div>`+resCharts:'')
    +(regProofAnals.length?`<div class="anw-desc" style="margin-top:12px;"><p style="margin:0 0 6px;font-weight:700;color:#0f2f4f;">Zgodność i porównanie metod</p></div>`+cmpNums+_mc.sec4:'');

  const secSummary=sec('Podsumowanie wykonawcze', bodySummary);
  const secMetodyka=sec('Metodyka rozliczenia oszczędności', bodyMetodyka);
  const secResults=sec('Wyniki i porównanie metod', bodyResults||`<div class="anw-desc"><p style="margin:0;">Brak analiz w raporcie.</p></div>`);
  const secFin=sec('Rozliczenie finansowe ESCO', bodyFin);
  const secForecast=bodyForecast?sec('Prognoza roczna oszczędności (orientacyjna)', bodyForecast):'';
  const secNotes=rep.notes?sec('Uwagi',`<div class="anw-desc"><p style="margin:0;">${escapeHtml(rep.notes)}</p></div>`):'';

  const attachments=proofs?`<div id="anw-attachments"><div class="anw-step-card" style="page-break-before:always;break-before:page;"><h4>📎 Załączniki — część dowodowa</h4><div class="anw-desc"><p style="margin:0;">Załącznik A — dowód metody rozliczeniowej (${escapeHtml(primLabel)})${regProofAnals.length?'; Załącznik B — dowód metody pomocniczej (regresja liniowa)':''}. Załączniki zawierają pełne wyprowadzenia, tabele danych źródłowych i wykresy; wyniki końcowe oraz rozliczenie przedstawiono w części głównej raportu.</p></div></div>${proofs}</div>`:'';

  const html=cover+secSummary+secMetodyka+secResults+secFin+secForecast+secNotes+signatures+attachments;
  return {html, drawDatas};
}

// Zgodność wstecz: zwraca samo HTML (bez listy wykresów do narysowania).
function escoReportBodyHTML(rep){ return escoBuildReportParts(rep).html; }


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
  const newModules = ['documents', 'invoicing', 'analyses', 'dashboard', 'users', 'reports', 'escoReports'];
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
    else if (moduleName === 'reports') renderESCOReports();
    else if (moduleName === 'escoReports') renderESCOReports();
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

// ═══════════════════════════════════════════════════════════════════════════════
// KOREKTA INTENSYWNOŚCI (VOLUME) — okres bazowy wg wzorca TYM
// Driver stopniodni zastąpiony driverem intensywności: Wsk = I·z₀,
// φ = ΣWsk_ref / ΣWsk_rzecz, Qs = Qc.o.·φ. Reużywa silnik before/after z TYM.
// ═══════════════════════════════════════════════════════════════════════════════

// Driver per miesiąc: TYM → stopniodni; VOLUME → intensywność·dni.
function _analDrv2(actVal, refVal, days, ti) {
  if (ANAL && ANAL.type === 'VOLUME') {
    const d = Number(days || 0);
    return { r: Math.max(0, Number(actVal || 0)) * d, s: Math.max(0, Number(refVal || 0)) * d };
  }
  return { r: _sd20(actVal, days, ti), s: _sd20(refVal, days, ti) };
}

// Kontener „referencyjny" dla intensywności: [I_ref, dni] per miesiąc 1–12 (I_ref domyślnie 0).
function _analVolRefDefaults() {
  const s = {};
  for (let m = 1; m <= 12; m++) { s[m] = [0, new Date(2025, m, 0).getDate()]; }
  return s;
}

// Wybór typu — dla VOLUME resetujemy kontener referencyjny do intensywności (0), nie do temperatur TYM.
function analSelectType(k) {
  ANAL.type = k;
  if (k === 'VOLUME') ANAL.std = _analVolRefDefaults();
  renderAnalysesModule();
}

// Wspólny blok parametrów energetycznych (identyczny jak w TYM).
function _analEnergyBlock() {
  return `
  <div class="anw-sec">
    <div class="anw-head anw-blue"><span class="ico">⚡</span><h3>Parametry energetyczne i rozliczenie</h3></div>
    <div class="anw-body">
      <div class="anw-g4">
        <div class="anw-f"><label>Jednostka energii</label>
          <select onchange="ANAL.energy.unit=this.value;renderAnalysesModule()">
            ${['GJ','MWh','kWh','m³'].map(u => `<option ${ANAL.energy.unit === u ? 'selected' : ''}>${u}</option>`).join('')}
          </select></div>
        <div class="anw-f"><label>Waluta</label>
          <select onchange="ANAL.energy.currency=this.value;renderAnalysesModule()">
            ${['PLN','EUR','CZK','USD'].map(u => `<option ${ANAL.energy.currency === u ? 'selected' : ''}>${u}</option>`).join('')}
          </select></div>
        <div class="anw-f"><label>Sposób wyceny energii</label>
          <select onchange="ANAL.energy.priceMode=this.value;renderAnalysesModule()">
            <option value="FIXED" ${ANAL.energy.priceMode !== 'VARIABLE' ? 'selected' : ''}>Cena stała za jednostkę</option>
            <option value="VARIABLE" ${ANAL.energy.priceMode === 'VARIABLE' ? 'selected' : ''}>Koszt zmienny całościowy</option>
          </select></div>
        <div class="anw-f"><label>Udział WaterAI / ESCO [%]</label>
          <input type="number" step="0.1" min="0" max="100" value="${ANAL.energy.escoShare}" oninput="ANAL.energy.escoShare=this.value;_analRecalcLive()"></div>
      </div>
      <div class="anw-g2" style="margin-top:12px;">
        ${ANAL.energy.priceMode === 'VARIABLE'
          ? `<div class="anw-f"><label>Całkowity koszt energii w okresie bazowym [${_escA(ANAL.energy.currency)}]</label>
              <input type="number" step="0.01" min="0" value="${ANAL.energy.price}" placeholder="np. 17 314,00" oninput="ANAL.energy.price=this.value;_analRecalcLive()"></div>`
          : `<div class="anw-f"><label>Cena energii (za jednostkę)</label>
              <input type="number" step="0.0001" min="0" value="${ANAL.energy.price}" placeholder="np. 0,54" oninput="ANAL.energy.price=this.value;_analRecalcLive()"></div>`}
        <div class="anw-f"><label>Opis (np. uwzględnia koszty przesyłu i pozostałe składowe faktury)</label>
          <input type="text" value="${_escA(ANAL.energy.priceDescription || '')}" placeholder="WaterAI redukuje zużycie, a tym samym koszty przesyłu i inne składowe…" oninput="ANAL.energy.priceDescription=this.value"></div>
      </div>
      ${ANAL.energy.priceMode === 'VARIABLE'
        ? `<div class="anw-note">Wpisywana kwota to <b>całkowity koszt energii w okresie bazowym</b>. Wartość oszczędności = koszt bazowy × procent oszczędności; dopiero ta kwota jest dzielona pomiędzy WaterAI/ESCO i klienta.</div>`
        : ''}
    </div>
  </div>`;
}

// Arkusz całej metody VOLUME: okres bazowy (rzecz vs ref) + okres analizowany (PO) + energia.
function _analVOLUMESheet() {
  return `
  ${_analVolBaseVsRefSheet()}
  ${_analVolPeriodSheet('after', 'Okres analizowany — PO instalacji', 'anw-after', '📈', 'Qc.o. po')}
  ${_analEnergyBlock()}`;
}

// Okres bazowy (PRZED, rzecz) zestawiony z poziomem referencyjnym intensywności (ref).
function _analVolBaseVsRefSheet() {
  const P = ANAL.before;
  const months = Array.isArray(P.months) ? P.months : [];
  const rows = months.length ? months.map((mo, idx) => {
    const stdM = ANAL.std[mo.month] || [0, 0];
    const d = _analDrv2(mo.tme, stdM[0], mo.days, null);
    return `<tr>
      <td>${mo.name}</td>
      <td><input type="number" step="0.01" value="${mo.tme}" placeholder="I" oninput="ANAL.before.months[${idx}].tme=this.value;_analRecalcLive()"></td>
      <td><input type="number" min="0" max="31" value="${mo.days}" oninput="ANAL.before.months[${idx}].days=this.value;_analRecalcLive()"></td>
      <td class="calc" id="anw-before-sdr-${idx}">${_fmtA(d.r, 1)}</td>
      <td class="anw-sep"><input type="number" step="0.01" value="${stdM[0]}" placeholder="I_ref" oninput="ANAL.std[${mo.month}][0]=this.value;_analRecalcLive()"></td>
      <td><input type="number" min="0" max="31" value="${stdM[1]}" oninput="ANAL.std[${mo.month}][1]=this.value;_analRecalcLive()"></td>
      <td class="calc" id="anw-before-sds-${idx}">${_fmtA(d.s, 1)}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="7" class="anw-muted" style="padding:12px;text-align:center;">Ustaw zakres dat okresu bazowego, aby wygenerować miesiące</td></tr>`;

  return `
  <div class="anw-sec">
    <div class="anw-head anw-before"><span class="ico">⚙️</span><h3>Okres bazowy — PRZED instalacją (rzecz) &nbsp;·&nbsp; Poziom referencyjny intensywności (ref)</h3>
      <span class="pill" style="background:var(--color-background-primary);border:1px solid var(--color-border-tertiary);color:var(--color-text-secondary);">φ = <b id="anw-before-phi">—</b></span></div>
    <div class="anw-body">
      <div class="anw-g3">
        <div class="anw-f"><label>Okres bazowy — data od</label><input type="date" value="${P.from}" onchange="analOnDates('before','from',this.value)"></div>
        <div class="anw-f"><label>Okres bazowy — data do</label><input type="date" value="${P.to}" onchange="analOnDates('before','to',this.value)"></div>
        <div class="anw-f"><label>Zużycie okresu bazowego Qc.o. [<span class="anw-u">${ANAL.energy.unit}</span>]</label>
          <input type="number" step="0.001" value="${P.consumption}" placeholder="z faktur / ciepłomierza" oninput="ANAL.before.consumption=this.value;_analRecalcLive()"></div>
      </div>
      <div class="anw-note" style="margin:2px 0 8px;">Intensywność I = driver pracy obiektu (np. liczba gości, m³, produkcja, osoby). Jeśli I jest już wartością miesięczną, wpisz dni z₀ = 1 → wtedy Wsk = I.</div>
      <table class="anw-t anw-bvs" style="margin-top:2px;">
        <thead>
          <tr>
            <th rowspan="2" style="width:16%">Miesiąc</th>
            <th colspan="3" class="anw-grp anw-grp-r">Okres bazowy — PRZED (rzecz)</th>
            <th colspan="3" class="anw-grp anw-grp-s anw-sep">Poziom referencyjny (ref)</th>
          </tr>
          <tr>
            <th>intensywność I</th><th>dni z₀</th><th style="text-align:right">Wsk_rzecz</th>
            <th class="anw-sep">intensywność I_ref</th><th>dni z₀</th><th style="text-align:right">Wsk_ref</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot><tr>
          <td>Suma</td>
          <td></td><td class="calc" id="anw-before-days">—</td><td class="calc" id="anw-before-sumr">—</td>
          <td class="anw-sep"></td><td></td><td class="calc" id="anw-before-sums">—</td>
        </tr></tfoot>
      </table>
      <div class="anw-note">φ = ∑Wsk_ref / ∑Wsk_rzecz · Qs = Qc.o.·φ → <b id="anw-before-qs">—</b> ${ANAL.energy.unit} (zużycie sprowadzone do referencyjnej intensywności).</div>
    </div>
  </div>`;
}

// Okres analizowany (PO) — driver intensywności, ten sam poziom referencyjny.
function _analVolPeriodSheet(key, title, headCls, ico, qLabel) {
  const P = ANAL[key];
  const rows = P.months.length ? P.months.map((mo, idx) => {
    const stdM = ANAL.std[mo.month] || [0, 0];
    const d = _analDrv2(mo.tme, stdM[0], mo.days, null);
    return `<tr>
      <td>${mo.name}</td>
      <td><input type="number" step="0.01" value="${mo.tme}" placeholder="I" oninput="ANAL.${key}.months[${idx}].tme=this.value;_analRecalcLive()"></td>
      <td><input type="number" min="0" max="31" value="${mo.days}" oninput="ANAL.${key}.months[${idx}].days=this.value;_analRecalcLive()"></td>
      <td class="calc" id="anw-${key}-sdr-${idx}">${_fmtA(d.r, 1)}</td>
      <td class="calc" id="anw-${key}-sds-${idx}">${_fmtA(d.s, 1)}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="5" class="anw-muted" style="padding:12px;text-align:center;">Ustaw zakres dat, aby wygenerować miesiące</td></tr>`;

  return `
  <div class="anw-sec">
    <div class="anw-head ${headCls}"><span class="ico">${ico}</span><h3>${title}</h3>
      <span class="pill" style="background:var(--color-background-primary);border:1px solid var(--color-border-tertiary);color:var(--color-text-secondary);">φ = <b id="anw-${key}-phi">—</b></span></div>
    <div class="anw-body">
      <div class="anw-g3">
        <div class="anw-f"><label>Data od</label><input type="date" value="${P.from}" onchange="analOnDates('${key}','from',this.value)"></div>
        <div class="anw-f"><label>Data do</label><input type="date" value="${P.to}" onchange="analOnDates('${key}','to',this.value)"></div>
        <div class="anw-f"><label>${qLabel} — zużycie Qc.o. [<span class="anw-u">${ANAL.energy.unit}</span>]</label>
          <input type="number" step="0.001" value="${P.consumption}" placeholder="z faktur / ciepłomierza" oninput="ANAL.${key}.consumption=this.value;_analRecalcLive()"></div>
      </div>
      <table class="anw-t" style="margin-top:6px;">
        <thead><tr><th style="width:26%">Miesiąc</th><th>intensywność I</th><th>dni z₀</th><th style="text-align:right">Wsk_rzecz</th><th style="text-align:right">Wsk_ref</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td>Suma</td><td></td><td class="calc" id="anw-${key}-days">—</td>
          <td class="calc" id="anw-${key}-sumr">—</td><td class="calc" id="anw-${key}-sums">—</td></tr></tfoot>
      </table>
      <div class="anw-note">φ = ∑Wsk_ref / ∑Wsk_rzecz · Qs = Qc.o.·φ → <b id="anw-${key}-qs">—</b> ${ANAL.energy.unit} (skorygowane)</div>
    </div>
  </div>`;
}

// Silnik raportu VOLUME (mirror _analCalcPeriodRows, driver = intensywność·dni).
function _analCalcPeriodRowsVOL(months, std, consumption) {
  let sumR = 0, sumS = 0, days = 0; const rows = [];
  (months || []).forEach(mo => {
    const d = Number(mo.days || 0);
    const filled = !(mo.tme === '' || mo.tme == null);
    const iAct = Number(mo.tme || 0);
    const stdM = (std && std[mo.month]) ? std[mo.month] : [0, 0];
    const iRef = Number(stdM[0] || 0);
    const sdR = filled ? Math.max(0, iAct) * d : 0;
    const sdS = Math.max(0, iRef) * d;
    sumR += sdR; sumS += sdS; days += d;
    rows.push({ name: mo.name, month: mo.month, days: d, tme: filled ? iAct : null, tStd: iRef, sdR, sdS });
  });
  const phi = sumR > 0 ? sumS / sumR : null;
  const q = Number(consumption || 0);
  const qs = phi != null ? q * phi : null;
  return { rows, sumR, sumS, days, phi, q, qs };
}

// Tabela okresu w raporcie VOLUME.
function _anwVolPeriodTable(P) {
  const rows = (P.rows || []).map(r => `<tr>
    <td style="white-space:nowrap;">${_anwMonShort(r)}</td>
    <td class="calc">${r.days}</td>
    <td class="calc">${r.tme == null ? '—' : _fmtA(r.tme, 2)}</td>
    <td class="calc">${_fmtA(r.sdR, 1)}</td>
    <td class="calc">${_fmtA(r.tStd, 2)}</td>
    <td class="calc">${_fmtA(r.sdS, 1)}</td>
  </tr>`).join('');
  return `<table class="anw-t"><thead><tr>
    <th>Miesiąc</th><th>Dni z₀</th><th>I rzecz.</th><th>Wsk_rzecz</th><th>I ref.</th><th>Wsk_ref</th>
  </tr></thead><tbody>${rows || '<tr><td colspan="6" class="anw-muted">Brak miesięcy</td></tr>'}</tbody>
  <tfoot><tr><td>∑</td><td class="calc">${P.days}</td><td></td><td class="calc">${_fmtA(P.sumR, 1)}</td><td></td><td class="calc">${_fmtA(P.sumS, 1)}</td></tr></tfoot></table>`;
}

// Raport VOLUME (kontrola intensywności).
function _analReportBodyVOL(data) {
  const u = data.energy.unit, cur = data.energy.currency;
  const genDate = _fmtDateA(new Date().toISOString().slice(0, 10));
  const pos = (data.savedPct || 0) >= 0;
  const priceLine = data.energy.priceMode === 'VARIABLE'
    ? `Całkowity koszt energii w okresie bazowym: <b>${_fmtA(Number(data.energy.price || 0), 2)} ${cur}</b>${data.energy.priceDescription ? ' — ' + _escA(data.energy.priceDescription) : ''}. Wartość oszczędności = koszt bazowy × procent oszczędności: ${_fmtA(Number(data.energy.price || 0), 2)} · ${_fmtA(data.savedPct || 0, 2)}% = <b>${_fmtA(data.savedMoney || 0, 2)} ${cur}</b>`
    : `Cena energii: <b>${_fmtA(Number(data.energy.price || 0), 4)} ${cur}/${u}</b>`;
  return `
  ${(data&&data._embedded)?`<div style="page-break-before:always;break-before:page;">${(data._proofBannerHTML)||''}</div>`:''}
  <style>
    .anw-rep-title{font-size:18px;color:#0C447C;margin:14px 0 6px;font-weight:700;}
    .anw-rep-meta{display:flex;flex-wrap:wrap;gap:14px;font-size:12px;color:var(--color-text-secondary);margin-bottom:14px;}
    .anw-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:8px 0 18px;}
    .anw-kpi{border:1px solid var(--color-border-tertiary);border-radius:12px;padding:14px;text-align:center;background:var(--color-background-primary);}
    .anw-kpi .k{font-size:11px;color:var(--color-text-tertiary);margin-bottom:6px;}
    .anw-kpi .v{font-size:18px;font-weight:700;color:#0C447C;}
    .anw-rep-sec{margin:16px 0;}
    .anw-rep-sec h3{font-size:14px;color:#0C447C;margin:0 0 8px;border-bottom:1px solid var(--color-border-tertiary);padding-bottom:5px;}
    .anw-rep-p{font-size:13px;line-height:1.55;color:var(--color-text-primary);margin:0;}
    .anw-charts{display:flex;gap:18px;flex-wrap:wrap;}
    .anw-charts canvas{max-width:100%;}
    .anw-repfoot{margin-top:18px;padding-top:10px;border-top:1px solid var(--color-border-tertiary);font-size:11px;color:var(--color-text-tertiary);text-align:center;}
    @media(max-width:680px){.anw-kpis{grid-template-columns:repeat(2,1fr);}}
  </style>
  <div class="anw-rephead">
    <div><div class="brand">WaterAI Energy Control</div><div class="sub">Analiza oszczędności energii — korekta intensywności</div></div>
    <div style="text-align:right;font-size:12px;color:var(--color-text-secondary);">
      <div>Nr analizy: <b>${_escA(data.number)}</b></div>
      <div>Data: <b>${_fmtDateA(data.executedAt)}</b></div>
    </div>
  </div>
  <h2 class="anw-rep-title">${_escA(data.name)}</h2>
  <div class="anw-rep-meta">
    <span>Klient: <b>${_escA(data.client ? data.client.name : '—')}</b></span>
    <span>Obiekt: <b>${_escA(data.object ? data.object.name : '—')}</b></span>
    <span>Metoda: <b>Korekta intensywności (VOLUME)</b></span>
    <span>Wykonał (Energy Analyst): <b>${_escA(data.author || '—')}</b> · dnia <b>${_fmtDateA(data.executedAt)}</b></span>
  </div>

  <div class="anw-kpis">
    <div class="anw-kpi"><div class="k">Oszczędność energii</div><div class="v" style="color:${pos ? '#27500A' : '#9A2D2D'};">${_fmtA(data.savedEnergy || 0, 2)} ${u}</div></div>
    <div class="anw-kpi"><div class="k">Oszczędność (%)</div><div class="v" style="color:${pos ? '#27500A' : '#9A2D2D'};">${_fmtA(data.savedPct || 0, 1)} %</div></div>
    <div class="anw-kpi"><div class="k">Oszczędność kosztu</div><div class="v">${_fmtA(data.savedMoney || 0, 2)} ${cur}</div></div>
    <div class="anw-kpi"><div class="k">Udział WaterAI/ESCO (${_fmtA(data.escoShare || 0, 1)}%)</div><div class="v">${_fmtA(data.escoAmount || 0, 2)} ${cur}</div></div>
  </div>

  <div class="anw-rep-sec"><h3>1 · Metoda</h3>
    <p class="anw-rep-p">Zużycie sprowadzane jest do <b>referencyjnego poziomu intensywności</b> pracy obiektu (driver: ${_escA((data.object && data.object.objectType) || 'intensywność')}). Dla każdego miesiąca liczony jest wskaźnik <b>Wsk = I · z₀</b> (intensywność × dni). Współczynnik korekcyjny <b>φ = ∑Wsk_ref / ∑Wsk_rzecz</b>, a zużycie skorygowane <b>Qs = Qc.o. · φ</b>. Oszczędność = Qs(PRZED) − Qs(PO) — różnica liczona przy tej samej, referencyjnej intensywności, więc wynik jest niezależny od zmian obłożenia/produkcji.</p>
  </div>

  <div class="anw-rep-sec"><h3>2 · Okres bazowy (PRZED instalacją)</h3>
    <div class="anw-rep-meta"><span>Zakres: <b>${_fmtDateA(data.before.from)} – ${_fmtDateA(data.before.to)}</b></span>
      <span>Qc.o.: <b>${_fmtA(Number(data.before.consumption || 0), 3)} ${u}</b></span>
      <span>φ: <b>${data.before.phi != null ? _fmtA(data.before.phi, 4) : '—'}</b></span>
      <span>Qs: <b>${data.before.qs != null ? _fmtA(data.before.qs, 2) : '—'} ${u}</b></span></div>
    ${_anwVolPeriodTable(data.before)}
  </div>

  <div class="anw-rep-sec"><h3>3 · Okres analizowany (PO instalacji)</h3>
    <div class="anw-rep-meta"><span>Zakres: <b>${_fmtDateA(data.after.from)} – ${_fmtDateA(data.after.to)}</b></span>
      <span>Qc.o.: <b>${_fmtA(Number(data.after.consumption || 0), 3)} ${u}</b></span>
      <span>φ: <b>${data.after.phi != null ? _fmtA(data.after.phi, 4) : '—'}</b></span>
      <span>Qs: <b>${data.after.qs != null ? _fmtA(data.after.qs, 2) : '—'} ${u}</b></span></div>
    ${_anwVolPeriodTable(data.after)}
  </div>

  <div class="anw-rep-sec"><h3>4 · Wykresy</h3>
    <div class="anw-charts"><canvas id="${data.cid}-int" width="520" height="240"></canvas><canvas id="${data.cid}-qs" width="520" height="240"></canvas></div>
  </div>

  <div class="anw-rep-sec"><h3>5 · Rozliczenie</h3>
    <p class="anw-rep-p">${priceLine}. Oszczędność energii ${_fmtA(data.savedEnergy || 0, 2)} ${u} → oszczędność kosztu <b>${_fmtA(data.savedMoney || 0, 2)} ${cur}</b>. Udział WaterAI/ESCO (${_fmtA(data.escoShare || 0, 1)}%): <b>${_fmtA(data.escoAmount || 0, 2)} ${cur}</b>, udział klienta: <b>${_fmtA(data.clientAmount || 0, 2)} ${cur}</b>.</p>
  </div>

  <div class="anw-repfoot">Wygenerowano: ${genDate} · WaterAI Energy Control · metoda korekty intensywności</div>`;
}

// Wykresy VOLUME.
function _analDrawChartsVOL(data) {
  _anwBar(document.getElementById(data.cid + '-int'), [
    { label: 'PRZED', bars: [{ v: data.before.sumR, c: '#185FA5', n: 'Wsk rzeczywiste' }, { v: data.before.sumS, c: '#FAC775', n: 'Wsk referencyjne' }] },
    { label: 'PO', bars: [{ v: data.after.sumR, c: '#185FA5', n: 'Wsk rzeczywiste' }, { v: data.after.sumS, c: '#FAC775', n: 'Wsk referencyjne' }] }
  ], { title: 'Intensywność: rzeczywista vs referencyjna', unit: 'jedn.·dni' });
  _anwBar(document.getElementById(data.cid + '-qs'), [
    { label: 'PRZED', bars: [{ v: data.before.qs, c: '#0C447C', n: 'Qs przed' }] },
    { label: 'PO', bars: [{ v: data.after.qs, c: '#27500A', n: 'Qs po' }] }
  ], { title: 'Zużycie sprowadzone do referencyjnej intensywności (Qs)', unit: data.energy.unit });
}

// ═══════════════════════════════════════════════════════════════════════════════
// OKRESY BAZOWE → zakładka „Korekta intensywności" — realny formularz okresu bazowego
// (wcześniej placeholder). Wzorzec jak TYM: driver intensywności Wsk = I·z₀,
// φ = ΣWsk_ref / ΣWsk_rzecz, Qs = Qc.o.·φ.
// ═══════════════════════════════════════════════════════════════════════════════

const IntensityBaseModule = {
  storageKey: 'waterai_intensity_base_v1',
  getAll() { return JSON.parse(localStorage.getItem(this.storageKey) || '[]'); },
  saveAll(x) { localStorage.setItem(this.storageKey, JSON.stringify(x)); },
  add(it) { const a = this.getAll(); a.push({ ...it, id: Date.now(), createdAt: new Date().toISOString() }); this.saveAll(a); },
  update(id, it) { this.saveAll(this.getAll().map(x => Number(x.id) === Number(id) ? { ...x, ...it, id: x.id, updatedAt: new Date().toISOString() } : x)); },
  remove(id) { this.saveAll(this.getAll().filter(x => Number(x.id) !== Number(id))); },
  find(id) { return this.getAll().find(x => Number(x.id) === Number(id)); },
  findByObject(objId) { return this.getAll().filter(x => Number(x.objectId) === Number(objId)).sort((a, b) => Number(b.id) - Number(a.id)); }
};
window.IntensityBaseModule = IntensityBaseModule;

let _intBaseDraft = null;
let _intBaseShowForm = false;

function _intBasePhi(it) {
  let sumR = 0, sumRef = 0;
  (it.months || []).forEach(m => {
    const dd = Number(m.days || 0);
    sumR += Math.max(0, Number(m.intRzecz || 0)) * dd;
    sumRef += Math.max(0, Number(m.intRef || 0)) * dd;
  });
  return sumR > 0 ? sumRef / sumR : null;
}

// Przelicza na żywo wskaźniki w otwartym formularzu (bez przerysowania, zachowuje focus).
function _intBaseRecalc() {
  const d = _intBaseDraft; if (!d) return;
  let sumR = 0, sumRef = 0, days = 0;
  (d.months || []).forEach((m, idx) => {
    const dd = Number(m.days || 0);
    const wr = Math.max(0, Number(m.intRzecz || 0)) * dd;
    const wref = Math.max(0, Number(m.intRef || 0)) * dd;
    sumR += wr; sumRef += wref; days += dd;
    const er = document.getElementById('intb-wr-' + idx); if (er) er.textContent = _fmtA(wr, 1);
    const es = document.getElementById('intb-wref-' + idx); if (es) es.textContent = _fmtA(wref, 1);
  });
  const phi = sumR > 0 ? sumRef / sumR : null;
  const q = Number(d.consumption || 0);
  const qs = phi != null ? q * phi : null;
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  set('intb-days', days || '—');
  set('intb-sumr', _fmtA(sumR, 1));
  set('intb-sumref', _fmtA(sumRef, 1));
  set('intb-phi', phi != null ? _fmtA(phi, 4) : '—');
  set('intb-qs', qs != null ? _fmtA(qs, 2) : '—');
}

function intBaseNew() {
  const objId = (typeof selectedMeasurementObjectId !== 'undefined') ? selectedMeasurementObjectId : null;
  const obj = objId ? ObjectsModule.find(objId) : null;
  _intBaseDraft = { id: null, objectId: objId, clientId: obj ? Number(obj.clientId) : null,
    periodFrom: '', periodTo: '', consumption: '', energyUnit: (obj && obj.energyUnit) || 'GJ', months: [] };
  _intBaseShowForm = true;
  renderMeasurementsModule();
}

function intBaseEdit(id) {
  const it = IntensityBaseModule.find(id); if (!it) return;
  _intBaseDraft = JSON.parse(JSON.stringify(it));
  if (!Array.isArray(_intBaseDraft.months)) _intBaseDraft.months = [];
  _intBaseShowForm = true;
  renderMeasurementsModule();
}

function intBaseCancel() { _intBaseShowForm = false; _intBaseDraft = null; renderMeasurementsModule(); }

function intBaseSetDate(which, val) {
  if (!_intBaseDraft) return;
  _intBaseDraft[which] = val;
  const ms = (typeof _analMonthsBetween === 'function') ? _analMonthsBetween(_intBaseDraft.periodFrom, _intBaseDraft.periodTo) : [];
  const old = _intBaseDraft.months || [];
  _intBaseDraft.months = ms.map((m, i) => {
    const prev = old[i];
    return { month: m.month, name: m.name, days: m.days, intRzecz: prev ? prev.intRzecz : '', intRef: prev ? prev.intRef : '' };
  });
  renderMeasurementsModule();
}

function intBaseSave() {
  const d = _intBaseDraft; if (!d) return;
  if (!d.periodFrom || !d.periodTo) { alert('Ustaw daty okresu bazowego (od / do).'); return; }
  if (d.id) IntensityBaseModule.update(d.id, d); else IntensityBaseModule.add(d);
  _intBaseShowForm = false; _intBaseDraft = null;
  renderMeasurementsModule();
  alert('Okres bazowy intensywności zapisany.');
}

function intBaseDelete(id) { IntensityBaseModule.remove(id); renderMeasurementsModule(); }

function _intBaseInput(val, oninput, extra) {
  return `<input type="number" step="0.01" value="${val == null ? '' : val}" oninput="${oninput}" style="width:100%;padding:5px 7px;border:1px solid var(--color-border-tertiary);border-radius:6px;font-size:13px;${extra || ''}">`;
}

function _intBaseFormHtml() {
  const d = _intBaseDraft;
  const months = d.months || [];
  const rows = months.length ? months.map((m, idx) => {
    const dd = Number(m.days || 0);
    const wr = Math.max(0, Number(m.intRzecz || 0)) * dd;
    const wref = Math.max(0, Number(m.intRef || 0)) * dd;
    return `<tr>
      <td style="padding:4px 8px;font-size:13px;white-space:nowrap;">${escapeHtml(m.name)}</td>
      <td style="padding:4px;">${_intBaseInput(m.intRzecz, '_intBaseDraft.months[' + idx + '].intRzecz=this.value;_intBaseRecalc()')}</td>
      <td style="padding:4px;"><input type="number" min="0" max="31" value="${m.days}" oninput="_intBaseDraft.months[${idx}].days=this.value;_intBaseRecalc()" style="width:64px;padding:5px 7px;border:1px solid var(--color-border-tertiary);border-radius:6px;font-size:13px;"></td>
      <td style="padding:4px 8px;text-align:right;font-size:13px;color:var(--color-text-secondary);" id="intb-wr-${idx}">${_fmtA(wr, 1)}</td>
      <td style="padding:4px;border-left:2px solid #FFE0B2;">${_intBaseInput(m.intRef, '_intBaseDraft.months[' + idx + '].intRef=this.value;_intBaseRecalc()')}</td>
      <td style="padding:4px 8px;text-align:right;font-size:13px;color:var(--color-text-secondary);" id="intb-wref-${idx}">${_fmtA(wref, 1)}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="6" style="padding:14px;text-align:center;color:var(--color-text-secondary);font-size:13px;">Ustaw daty okresu (od / do), aby wygenerować miesiące.</td></tr>`;

  const lbl = 'display:block;font-size:12px;color:var(--color-text-secondary);margin-bottom:4px;';
  const inp = 'width:100%;padding:8px 10px;border:1px solid var(--color-border-tertiary);border-radius:8px;font-size:13px;';
  return `<div style="padding:16px;background:var(--color-background-primary);">
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px;">
      <div style="flex:1;min-width:150px;"><label style="${lbl}">Okres bazowy — data od</label>
        <input type="date" value="${d.periodFrom || ''}" onchange="intBaseSetDate('periodFrom',this.value)" style="${inp}"></div>
      <div style="flex:1;min-width:150px;"><label style="${lbl}">Okres bazowy — data do</label>
        <input type="date" value="${d.periodTo || ''}" onchange="intBaseSetDate('periodTo',this.value)" style="${inp}"></div>
      <div style="flex:1;min-width:150px;"><label style="${lbl}">Zużycie Qc.o. [${escapeHtml(d.energyUnit || 'GJ')}]</label>
        <input type="number" step="0.001" value="${d.consumption || ''}" placeholder="z faktur / ciepłomierza" oninput="_intBaseDraft.consumption=this.value;_intBaseRecalc()" style="${inp}"></div>
    </div>
    <div style="font-size:12px;color:var(--color-text-secondary);margin-bottom:8px;">Intensywność I = driver pracy obiektu (np. liczba gości, m³, produkcja, osoby). Jeśli I jest już sumą miesięczną, wpisz dni z₀ = 1 → wtedy Wsk = I. Poziom referencyjny = docelowa/umowna intensywność, do której sprowadzamy zużycie.</div>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:var(--color-background-secondary);">
          <th rowspan="2" style="padding:6px 8px;text-align:left;font-size:11px;color:var(--color-text-secondary);">Miesiąc</th>
          <th colspan="3" style="padding:6px 8px;text-align:center;font-size:11px;color:#0C447C;">Okres bazowy — rzeczywisty</th>
          <th colspan="2" style="padding:6px 8px;text-align:center;font-size:11px;color:#E65100;border-left:2px solid #FFE0B2;">Poziom referencyjny</th>
        </tr>
        <tr style="background:var(--color-background-secondary);">
          <th style="padding:4px 8px;text-align:left;font-size:11px;color:var(--color-text-secondary);">intensywność I</th>
          <th style="padding:4px 8px;text-align:left;font-size:11px;color:var(--color-text-secondary);">dni z₀</th>
          <th style="padding:4px 8px;text-align:right;font-size:11px;color:var(--color-text-secondary);">Wsk_rzecz</th>
          <th style="padding:4px 8px;text-align:left;font-size:11px;color:var(--color-text-secondary);border-left:2px solid #FFE0B2;">intensywność I_ref</th>
          <th style="padding:4px 8px;text-align:right;font-size:11px;color:var(--color-text-secondary);">Wsk_ref</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr style="border-top:1px solid var(--color-border-tertiary);font-weight:600;font-size:13px;">
          <td style="padding:6px 8px;">Suma</td>
          <td></td>
          <td style="padding:6px 8px;" id="intb-days">—</td>
          <td style="padding:6px 8px;text-align:right;" id="intb-sumr">—</td>
          <td style="padding:6px 8px;border-left:2px solid #FFE0B2;"></td>
          <td style="padding:6px 8px;text-align:right;" id="intb-sumref">—</td>
        </tr>
      </tfoot>
    </table>
    <div style="margin-top:12px;padding:12px 14px;border-radius:10px;background:#FFF3E0;border:1px solid #FFCC80;font-size:13px;color:#7A3E00;">
      φ = ΣWsk_ref / ΣWsk_rzecz = <b id="intb-phi">—</b> &nbsp;·&nbsp; Qs = Qc.o.·φ = <b id="intb-qs">—</b> ${escapeHtml(d.energyUnit || 'GJ')} (zużycie sprowadzone do referencyjnej intensywności)
    </div>
    <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">
      <button class="small-button" onclick="intBaseCancel()">Anuluj</button>
      <button class="primary-button" onclick="intBaseSave()">💾 Zapisz okres bazowy</button>
    </div>
  </div>`;
}

function renderIntensityBaseTab(icon, title, description, bgLight, bgBorder, textColor) {
  const objId = (typeof selectedMeasurementObjectId !== 'undefined') ? selectedMeasurementObjectId : null;
  const obj = objId ? ObjectsModule.find(objId) : null;
  const header = `<div style="background:${bgLight};padding:14px 18px;display:flex;align-items:center;gap:12px;">
      <span style="font-size:22px;">${icon}</span>
      <div><h3 style="margin:0;font-size:15px;font-weight:600;color:${textColor};">${title}</h3>
      <p style="margin:4px 0 0;font-size:12px;color:${textColor};opacity:0.75;">${description}</p></div></div>`;

  let body;
  if (_intBaseShowForm && _intBaseDraft) {
    body = _intBaseFormHtml();
  } else {
    const list = obj ? IntensityBaseModule.findByObject(objId) : [];
    const rows = list.length ? list.map(it => {
      const phi = _intBasePhi(it);
      return `<tr style="border-bottom:1px solid var(--color-border-tertiary);">
        <td style="padding:8px 10px;font-size:13px;">${_fmtDateA(it.periodFrom)} – ${_fmtDateA(it.periodTo)}</td>
        <td style="padding:8px 10px;font-size:13px;">${_fmtA(Number(it.consumption || 0), 3)} ${escapeHtml(it.energyUnit || 'GJ')}</td>
        <td style="padding:8px 10px;font-size:13px;">${phi != null ? _fmtA(phi, 4) : '—'}</td>
        <td style="padding:8px 10px;text-align:right;white-space:nowrap;">
          <button class="small-button" onclick="intBaseEdit(${it.id})" title="Edytuj">✏️</button>
          <button class="small-button" onclick="if(confirm('Usunąć ten okres bazowy?')){intBaseDelete(${it.id})}" title="Usuń">🗑</button>
        </td></tr>`;
    }).join('') : `<tr><td colspan="4" style="padding:16px;text-align:center;color:var(--color-text-secondary);font-size:13px;">Brak zapisanych okresów bazowych intensywności dla tego obiektu. Kliknij „+ Nowy okres bazowy".</td></tr>`;
    body = `<div style="padding:16px;background:var(--color-background-primary);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div style="font-size:12px;color:var(--color-text-secondary);">Obiekt: <b>${obj ? escapeHtml(obj.name) : '—'}</b></div>
        <button class="primary-button" onclick="intBaseNew()">+ Nowy okres bazowy</button>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:var(--color-background-secondary);">
          <th style="text-align:left;padding:6px 10px;font-size:11px;color:var(--color-text-secondary);">Okres</th>
          <th style="text-align:left;padding:6px 10px;font-size:11px;color:var(--color-text-secondary);">Zużycie Qc.o.</th>
          <th style="text-align:left;padding:6px 10px;font-size:11px;color:var(--color-text-secondary);">φ</th>
          <th></th>
        </tr></thead><tbody>${rows}</tbody></table>
    </div>`;
  }
  return `<div style="border:1px solid ${bgBorder};border-radius:10px;overflow:hidden;margin-bottom:20px;">${header}${body}</div>`;
}

// Override: zakładka „volume" (Korekta intensywności) dostaje realny formularz;
// pozostałe zakładki zachowują dotychczasowy placeholder.
function renderPlaceholderMeasTab(icon, title, type, description, bgLight, bgBorder, textColor) {
  if (type === 'volume') return renderIntensityBaseTab(icon, title, description, bgLight, bgBorder, textColor);
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

// ─── Integracja: okresy bazowe intensywności (IntensityBaseModule) w kreatorze Analiz (VOLUME) ───
function _analApplyIntensityBase(it) {
  ANAL.before.from = it.periodFrom || '';
  ANAL.before.to = it.periodTo || '';
  ANAL.before.months = (it.months || []).map(m => ({
    month: Number(m.month),
    name: m.name || (ANAL_MONTHS[(Number(m.month) || 1) - 1] || ''),
    days: m.days,
    tme: (m.intRzecz != null) ? m.intRzecz : ''   // slot „tme" przechowuje intensywność rzeczywistą
  }));
  const std = {};
  for (let mo = 1; mo <= 12; mo++) std[mo] = [0, new Date(2025, mo, 0).getDate()];
  (it.months || []).forEach(m => {
    const mo = Number(m.month);
    if (mo >= 1 && mo <= 12) std[mo] = [(m.intRef != null ? m.intRef : 0), (m.days != null ? m.days : std[mo][1])];
  });
  ANAL.std = std;
  ANAL.before.consumption = (it.consumption != null) ? it.consumption : '';
  if (it.energyUnit) ANAL.energy.unit = it.energyUnit;
}



// ═══════════════════════════════════════════════════════════════════════════════
// UNIWERSALNE OKRESY BAZOWE (wszystkie typy poza TYM/Regresją) — przepływ jak w TYM:
// wybór klienta i obiektu → przycisk „+ Okres bazowy" → lista (Nr protokołu, data,
// klient, obiekt, okres bazowy, akcje: podgląd/edycja/usuń) → formularz.
// ═══════════════════════════════════════════════════════════════════════════════

const BasePeriodModule = {
  storageKey: 'waterai_base_periods_v1',
  getAll() { try { return JSON.parse(localStorage.getItem(this.storageKey) || '[]'); } catch (e) { return []; } },
  saveAll(x) { localStorage.setItem(this.storageKey, JSON.stringify(x)); },
  add(it) { const a = this.getAll(); const rec = { ...it, id: Date.now(), createdAt: new Date().toISOString() }; a.push(rec); this.saveAll(a); return rec; },
  update(id, it) { this.saveAll(this.getAll().map(x => Number(x.id) === Number(id) ? { ...x, ...it, id: x.id, updatedAt: new Date().toISOString() } : x)); },
  remove(id) { this.saveAll(this.getAll().filter(x => Number(x.id) !== Number(id))); },
  find(id) { return this.getAll().find(x => Number(x.id) === Number(id)); },
  findByType(type) { return this.getAll().filter(x => x.type === type).sort((a, b) => (b.protocolDate || '').localeCompare(a.protocolDate || '') || Number(b.id) - Number(a.id)); },
  findByObjectType(objId, type) { return this.findByType(type).filter(x => Number(x.objectId) === Number(objId)); }
};
window.BasePeriodModule = BasePeriodModule;

// Jednorazowa migracja danych ze starego magazynu intensywności do nowego uniwersalnego.
(function _bpMigrate() {
  try {
    if (localStorage.getItem('waterai_base_periods_migrated_v1')) return;
    const old = JSON.parse(localStorage.getItem('waterai_intensity_base_v1') || '[]');
    if (old.length) {
      const cur = BasePeriodModule.getAll();
      old.forEach((it, i) => {
        cur.push({ ...it, type: 'volume', protocolNumber: it.protocolNumber || ('OB-INT/' + (new Date().getFullYear()) + '/' + String(i + 1).padStart(3, '0')),
          protocolDate: it.protocolDate || (it.createdAt ? it.createdAt.slice(0, 10) : ''), id: it.id || (Date.now() + i) });
      });
      BasePeriodModule.saveAll(cur);
    }
    localStorage.setItem('waterai_base_periods_migrated_v1', '1');
  } catch (e) { /* ignore */ }
})();

let _bpDraft = null;
let _bpShow = false;
let _bpViewId = null;

const _BP_LABELS = {
  volume: '⚙️ Korekta intensywności', occupancy: '🏨 Korekta obłożenia', area: '📐 Korekta powierzchni',
  schedule: '🕐 Korekta harmonogramu', custom: '🔬 Metoda niestandardowa'
};
function _bpDriverLabel(type) {
  return ({ volume: 'intensywność pracy (goście / m³ / produkcja / osoby)', occupancy: 'obłożenie (osobonoce / % / liczba użytkowników)',
    area: 'powierzchnia [m²]', schedule: 'godziny / dni pracy', custom: 'wskaźnik własny' })[type] || 'wskaźnik';
}

function _bpNextNumber(type) {
  const pfx = ({ volume: 'INT', occupancy: 'OBL', area: 'POW', schedule: 'HAR', custom: 'CUS' })[type] || 'OB';
  const yr = new Date().getFullYear();
  const n = BasePeriodModule.findByType(type).filter(x => (x.protocolNumber || '').indexOf('/' + yr + '/') >= 0).length + 1;
  return 'OB-' + pfx + '/' + yr + '/' + String(n).padStart(3, '0');
}

function bpNew(type) {
  const objId = (typeof selectedMeasurementObjectId !== 'undefined') ? selectedMeasurementObjectId : null;
  const obj = objId ? ObjectsModule.find(objId) : (getObjects()[0] || null);
  const clientId = obj ? Number(obj.clientId) : ((getClients()[0] || {}).id || null);
  _bpDraft = { id: null, type, protocolNumber: _bpNextNumber(type), protocolDate: new Date().toISOString().slice(0, 10),
    clientId: clientId, objectId: obj ? Number(obj.id) : null, periodFrom: '', periodTo: '',
    consumption: '', energyUnit: (obj && obj.energyUnit) || 'GJ', months: [], notes: '' };
  _bpShow = true; _bpViewId = null;
  renderMeasurementsModule();
}
function bpEdit(id) {
  const it = BasePeriodModule.find(id); if (!it) return;
  _bpDraft = JSON.parse(JSON.stringify(it));
  if (!Array.isArray(_bpDraft.months)) _bpDraft.months = [];
  _bpShow = true; _bpViewId = null; renderMeasurementsModule();
}
function bpView(id) { _bpViewId = id; _bpShow = false; renderMeasurementsModule(); }
function bpBack() { _bpViewId = null; _bpShow = false; _bpDraft = null; renderMeasurementsModule(); }
function bpDelete(id) { BasePeriodModule.remove(id); if (_bpViewId === id) _bpViewId = null; renderMeasurementsModule(); }

function bpSetClient(v) {
  if (!_bpDraft) return;
  _bpDraft.clientId = v ? Number(v) : null;
  const objs = _bpDraft.clientId ? ObjectsModule.findByClient(_bpDraft.clientId) : [];
  _bpDraft.objectId = objs[0] ? Number(objs[0].id) : null;
  if (objs[0] && objs[0].energyUnit) _bpDraft.energyUnit = objs[0].energyUnit;
  renderMeasurementsModule();
}
function bpSetObject(v) { if (_bpDraft) { _bpDraft.objectId = v ? Number(v) : null; renderMeasurementsModule(); } }

function bpSetDate(which, val) {
  if (!_bpDraft) return;
  _bpDraft[which] = val;
  if (_bpDraft.type === 'volume') {
    const ms = (typeof _analMonthsBetween === 'function') ? _analMonthsBetween(_bpDraft.periodFrom, _bpDraft.periodTo) : [];
    const old = _bpDraft.months || [];
    _bpDraft.months = ms.map((m, i) => ({ month: m.month, name: m.name, days: m.days,
      intRzecz: old[i] ? old[i].intRzecz : '', intRef: old[i] ? old[i].intRef : '' }));
  }
  renderMeasurementsModule();
}

function bpSave() {
  const d = _bpDraft; if (!d) return;
  if (!d.clientId || !d.objectId) { alert('Wybierz klienta i obiekt.'); return; }
  if (!d.periodFrom || !d.periodTo) { alert('Ustaw okres bazowy (data od / do).'); return; }
  if (d.id) BasePeriodModule.update(d.id, d); else BasePeriodModule.add(d);
  _bpShow = false; _bpDraft = null;
  renderMeasurementsModule();
}

function _bpPhi(it) {
  let r = 0, s = 0; (it.months || []).forEach(m => { const dd = Number(m.days || 0); r += Math.max(0, Number(m.intRzecz || 0)) * dd; s += Math.max(0, Number(m.intRef || 0)) * dd; });
  return r > 0 ? s / r : null;
}

function _bpRecalc() {
  const d = _bpDraft; if (!d) return;
  let sumR = 0, sumRef = 0, days = 0;
  (d.months || []).forEach((m, idx) => {
    const dd = Number(m.days || 0);
    const wr = Math.max(0, Number(m.intRzecz || 0)) * dd, wref = Math.max(0, Number(m.intRef || 0)) * dd;
    sumR += wr; sumRef += wref; days += dd;
    const er = document.getElementById('bp-wr-' + idx); if (er) er.textContent = _fmtA(wr, 1);
    const es = document.getElementById('bp-wref-' + idx); if (es) es.textContent = _fmtA(wref, 1);
  });
  const phi = sumR > 0 ? sumRef / sumR : null, q = Number(d.consumption || 0), qs = phi != null ? q * phi : null;
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  set('bp-days', days || '—'); set('bp-sumr', _fmtA(sumR, 1)); set('bp-sumref', _fmtA(sumRef, 1));
  set('bp-phi', phi != null ? _fmtA(phi, 4) : '—'); set('bp-qs', qs != null ? _fmtA(qs, 2) : '—');
}

function _bpHeaderBox(meta, inner) {
  return `<div style="border:1px solid ${meta.bgBorder};border-radius:10px;overflow:hidden;margin-bottom:20px;">
    <div style="background:${meta.bgLight};padding:14px 18px;display:flex;align-items:center;gap:12px;">
      <span style="font-size:22px;">${meta.icon}</span>
      <div><h3 style="margin:0;font-size:15px;font-weight:600;color:${meta.textColor};">${meta.title}</h3>
      <p style="margin:4px 0 0;font-size:12px;color:${meta.textColor};opacity:0.75;">${meta.description}</p></div>
    </div>${inner}</div>`;
}

function _bpVolumeTable(d) {
  const rows = (d.months || []).length ? d.months.map((m, idx) => {
    const dd = Number(m.days || 0);
    const wr = Math.max(0, Number(m.intRzecz || 0)) * dd, wref = Math.max(0, Number(m.intRef || 0)) * dd;
    const inS = 'width:100%;padding:5px 7px;border:1px solid var(--color-border-tertiary);border-radius:6px;font-size:13px;';
    return `<tr>
      <td style="padding:4px 8px;font-size:13px;white-space:nowrap;">${escapeHtml(m.name)}</td>
      <td style="padding:4px;"><input type="number" step="0.01" value="${m.intRzecz}" oninput="_bpDraft.months[${idx}].intRzecz=this.value;_bpRecalc()" style="${inS}"></td>
      <td style="padding:4px;"><input type="number" min="0" max="31" value="${m.days}" oninput="_bpDraft.months[${idx}].days=this.value;_bpRecalc()" style="width:64px;padding:5px 7px;border:1px solid var(--color-border-tertiary);border-radius:6px;font-size:13px;"></td>
      <td style="padding:4px 8px;text-align:right;font-size:13px;color:var(--color-text-secondary);" id="bp-wr-${idx}">${_fmtA(wr, 1)}</td>
      <td style="padding:4px;border-left:2px solid #FFE0B2;"><input type="number" step="0.01" value="${m.intRef}" oninput="_bpDraft.months[${idx}].intRef=this.value;_bpRecalc()" style="${inS}"></td>
      <td style="padding:4px 8px;text-align:right;font-size:13px;color:var(--color-text-secondary);" id="bp-wref-${idx}">${_fmtA(wref, 1)}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="6" style="padding:14px;text-align:center;color:var(--color-text-secondary);font-size:13px;">Ustaw daty okresu, aby wygenerować miesiące.</td></tr>`;
  return `
    <table style="width:100%;border-collapse:collapse;margin-top:6px;">
      <thead>
        <tr style="background:var(--color-background-secondary);">
          <th rowspan="2" style="padding:6px 8px;text-align:left;font-size:11px;color:var(--color-text-secondary);">Miesiąc</th>
          <th colspan="3" style="padding:6px 8px;text-align:center;font-size:11px;color:#0C447C;">Okres bazowy — rzeczywisty</th>
          <th colspan="2" style="padding:6px 8px;text-align:center;font-size:11px;color:#E65100;border-left:2px solid #FFE0B2;">Poziom referencyjny</th>
        </tr>
        <tr style="background:var(--color-background-secondary);">
          <th style="padding:4px 8px;text-align:left;font-size:11px;color:var(--color-text-secondary);">intensywność I</th>
          <th style="padding:4px 8px;text-align:left;font-size:11px;color:var(--color-text-secondary);">dni z₀</th>
          <th style="padding:4px 8px;text-align:right;font-size:11px;color:var(--color-text-secondary);">Wsk_rzecz</th>
          <th style="padding:4px 8px;text-align:left;font-size:11px;color:var(--color-text-secondary);border-left:2px solid #FFE0B2;">intensywność I_ref</th>
          <th style="padding:4px 8px;text-align:right;font-size:11px;color:var(--color-text-secondary);">Wsk_ref</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot><tr style="border-top:1px solid var(--color-border-tertiary);font-weight:600;font-size:13px;">
        <td style="padding:6px 8px;">Suma</td><td></td><td style="padding:6px 8px;" id="bp-days">—</td>
        <td style="padding:6px 8px;text-align:right;" id="bp-sumr">—</td>
        <td style="padding:6px 8px;border-left:2px solid #FFE0B2;"></td><td style="padding:6px 8px;text-align:right;" id="bp-sumref">—</td>
      </tr></tfoot>
    </table>
    <div style="margin-top:12px;padding:12px 14px;border-radius:10px;background:#FFF3E0;border:1px solid #FFCC80;font-size:13px;color:#7A3E00;">
      φ = ΣWsk_ref / ΣWsk_rzecz = <b id="bp-phi">—</b> · Qs = Qc.o.·φ = <b id="bp-qs">—</b> ${escapeHtml(d.energyUnit || 'GJ')}
    </div>`;
}

function _bpFormHtml() {
  const d = _bpDraft;
  const clients = getClients();
  const objs = d.clientId ? ObjectsModule.findByClient(d.clientId) : getObjects();
  const lbl = 'display:block;font-size:12px;color:var(--color-text-secondary);margin-bottom:4px;';
  const inp = 'width:100%;padding:8px 10px;border:1px solid var(--color-border-tertiary);border-radius:8px;font-size:13px;';
  const isVol = d.type === 'volume';
  return `<div style="padding:16px;background:var(--color-background-primary);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
      <strong style="font-size:14px;color:var(--color-text-primary);">${d.id ? 'Edycja okresu bazowego' : 'Nowy okres bazowy'} — ${_BP_LABELS[d.type] || ''}</strong>
    </div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px;">
      <div style="flex:1;min-width:170px;"><label style="${lbl}">Klient</label>
        <select onchange="bpSetClient(this.value)" style="${inp}">
          ${clients.map(c => `<option value="${c.id}" ${Number(c.id) === Number(d.clientId) ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
        </select></div>
      <div style="flex:1;min-width:170px;"><label style="${lbl}">Obiekt</label>
        <select onchange="bpSetObject(this.value)" style="${inp}">
          ${objs.map(o => `<option value="${o.id}" ${Number(o.id) === Number(d.objectId) ? 'selected' : ''}>${escapeHtml(o.name || 'Obiekt')}</option>`).join('')}
        </select></div>
    </div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px;">
      <div style="flex:1;min-width:150px;"><label style="${lbl}">Numer protokołu</label>
        <input type="text" value="${escapeHtml(d.protocolNumber || '')}" oninput="_bpDraft.protocolNumber=this.value" style="${inp}"></div>
      <div style="flex:1;min-width:150px;"><label style="${lbl}">Data protokołu</label>
        <input type="date" value="${d.protocolDate || ''}" oninput="_bpDraft.protocolDate=this.value" style="${inp}"></div>
      <div style="flex:1;min-width:120px;"><label style="${lbl}">Jednostka energii</label>
        <select onchange="_bpDraft.energyUnit=this.value;_bpRecalc()" style="${inp}">
          ${['GJ', 'MWh', 'kWh', 'm³'].map(u => `<option ${u === (d.energyUnit || 'GJ') ? 'selected' : ''}>${u}</option>`).join('')}
        </select></div>
    </div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px;">
      <div style="flex:1;min-width:150px;"><label style="${lbl}">Okres bazowy — data od</label>
        <input type="date" value="${d.periodFrom || ''}" onchange="bpSetDate('periodFrom',this.value)" style="${inp}"></div>
      <div style="flex:1;min-width:150px;"><label style="${lbl}">Okres bazowy — data do</label>
        <input type="date" value="${d.periodTo || ''}" onchange="bpSetDate('periodTo',this.value)" style="${inp}"></div>
      <div style="flex:1;min-width:150px;"><label style="${lbl}">Zużycie Qc.o. [${escapeHtml(d.energyUnit || 'GJ')}]</label>
        <input type="number" step="0.001" value="${d.consumption || ''}" placeholder="z faktur / ciepłomierza" oninput="_bpDraft.consumption=this.value;_bpRecalc()" style="${inp}"></div>
    </div>
    <div style="font-size:12px;color:var(--color-text-secondary);margin-bottom:8px;">Driver dla tego typu: <b>${_bpDriverLabel(d.type)}</b>.${isVol ? ' Jeśli wartość jest już sumą miesięczną, wpisz dni z₀ = 1 → wtedy Wsk = I.' : ''}</div>
    ${isVol ? _bpVolumeTable(d) : `<div style="margin-bottom:6px;"><label style="${lbl}">Notatki / dane źródłowe</label>
        <textarea oninput="_bpDraft.notes=this.value" rows="4" placeholder="Opis okresu bazowego, źródło danych, założenia…" style="${inp};resize:vertical;">${escapeHtml(d.notes || '')}</textarea></div>`}
    <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">
      <button class="small-button" onclick="bpBack()">Anuluj</button>
      <button class="primary-button" onclick="bpSave()">💾 Zapisz okres bazowy</button>
    </div>
  </div>`;
}

function _bpViewHtml(it) {
  const c = ClientsModule.find(it.clientId), o = ObjectsModule.find(it.objectId);
  const row = (k, v) => `<tr><td style="padding:6px 10px;color:var(--color-text-secondary);font-size:12px;width:160px;">${k}</td><td style="padding:6px 10px;font-size:13px;font-weight:500;">${v}</td></tr>`;
  const phi = it.type === 'volume' ? _bpPhi(it) : null;
  const qs = phi != null ? Number(it.consumption || 0) * phi : null;
  return `<div style="padding:16px;background:var(--color-background-primary);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <strong style="font-size:14px;">Podgląd okresu bazowego — ${_BP_LABELS[it.type] || ''}</strong>
      <div><button class="small-button" onclick="bpEdit(${it.id})">✏️ Edytuj</button> <button class="small-button" onclick="bpBack()">← Lista</button></div>
    </div>
    <table style="width:100%;border-collapse:collapse;border:1px solid var(--color-border-tertiary);border-radius:8px;overflow:hidden;">
      ${row('Numer protokołu', escapeHtml(it.protocolNumber || '—'))}
      ${row('Data protokołu', escapeHtml(it.protocolDate || '—'))}
      ${row('Klient', escapeHtml((c && c.name) || '—'))}
      ${row('Obiekt', escapeHtml((o && o.name) || '—'))}
      ${row('Okres bazowy', escapeHtml(it.periodFrom || '') + ' → ' + escapeHtml(it.periodTo || ''))}
      ${row('Zużycie Qc.o.', _fmtA(Number(it.consumption || 0), 3) + ' ' + escapeHtml(it.energyUnit || 'GJ'))}
      ${phi != null ? row('Współczynnik φ', _fmtA(phi, 4)) : ''}
      ${qs != null ? row('Qs (skorygowane)', _fmtA(qs, 2) + ' ' + escapeHtml(it.energyUnit || 'GJ')) : ''}
      ${it.notes ? row('Notatki', escapeHtml(it.notes)) : ''}
    </table>
  </div>`;
}

function renderBasePeriodTab(type, meta) {
  if (_bpViewId) { const it = BasePeriodModule.find(_bpViewId); if (it && it.type === type) return _bpHeaderBox(meta, _bpViewHtml(it)); }
  if (_bpShow && _bpDraft && _bpDraft.type === type) return _bpHeaderBox(meta, _bpFormHtml());

  const list = BasePeriodModule.findByObjectType(selectedMeasurementObjectId, type);
  const th = 'padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);white-space:nowrap;';
  const rows = list.length ? list.map(it => {
    const c = ClientsModule.find(it.clientId), o = ObjectsModule.find(it.objectId);
    return `<tr style="border-bottom:1px solid var(--color-border-tertiary);">
      <td style="padding:9px 12px;font-size:13px;font-weight:600;white-space:nowrap;">${escapeHtml(it.protocolNumber || '—')}</td>
      <td style="padding:9px 12px;font-size:13px;white-space:nowrap;">${escapeHtml(it.protocolDate || '—')}</td>
      <td style="padding:9px 12px;font-size:13px;">${escapeHtml((c && c.name) || '—')}</td>
      <td style="padding:9px 12px;font-size:13px;">${escapeHtml((o && o.name) || '—')}</td>
      <td style="padding:9px 12px;font-size:13px;white-space:nowrap;">${escapeHtml(it.periodFrom || '')} → ${escapeHtml(it.periodTo || '')}</td>
      <td style="padding:9px 12px;white-space:nowrap;"><div style="display:flex;gap:4px;">
        <button class="small-button" onclick="bpView(${it.id})" title="Podgląd">👁</button>
        <button class="small-button" onclick="bpEdit(${it.id})" title="Edytuj">✏️</button>
        <button class="small-button" onclick="if(confirm('Usunąć ten okres bazowy?'))bpDelete(${it.id})" style="color:#c00;border-color:#c00;" title="Usuń">🗑</button>
      </div></td>
    </tr>`;
  }).join('') : `<tr><td colspan="6" style="padding:18px;text-align:center;color:var(--color-text-secondary);font-size:13px;">Brak okresów bazowych dla tego obiektu. Kliknij „+ Dodaj okres bazowy".</td></tr>`;

  const body = `<div style="padding:16px;background:var(--color-background-primary);">
    ${_bpSelectors()}
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:10px;flex-wrap:wrap;">
      <h3 style="margin:0;font-size:15px;font-weight:500;color:var(--color-text-primary);">Okresy bazowe <span style="font-size:12px;color:var(--color-text-secondary);font-weight:400;">(${list.length})</span></h3>
      <button class="primary-button" onclick="bpNew('${type}')" style="font-size:13px;padding:7px 16px;white-space:nowrap;">+ Dodaj okres bazowy</button>
    </div>
    <div style="overflow-x:auto;border:1px solid var(--color-border-tertiary);border-radius:10px;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background:var(--color-background-secondary);">
          <th style="${th}">Nr protokołu</th><th style="${th}">Data protokołu</th><th style="${th}">Klient</th>
          <th style="${th}">Obiekt</th><th style="${th}">Okres bazowy</th><th style="${th}">Akcje</th>
        </tr></thead><tbody>${rows}</tbody>
      </table>
    </div>
  </div>`;
  return _bpHeaderBox(meta, body);
}

// Routing: wszystkie typy poza TYM/Regresją dostają uniwersalny przepływ okresów bazowych.
function renderPlaceholderMeasTab(icon, title, type, description, bgLight, bgBorder, textColor) {
  const meta = { icon, title, description, bgLight, bgBorder, textColor };
  if (['volume', 'occupancy', 'area', 'schedule', 'custom'].indexOf(type) >= 0) return renderBasePeriodTab(type, meta);
  return `
  <div style="border:1px solid ${bgBorder};border-radius:10px;overflow:hidden;margin-bottom:20px;">
    <div style="background:${bgLight};padding:14px 18px;display:flex;align-items:center;gap:12px;">
      <span style="font-size:22px;">${icon}</span>
      <div><h3 style="margin:0;font-size:15px;font-weight:600;color:${textColor};">${title}</h3>
      <p style="margin:4px 0 0;font-size:12px;color:${textColor};opacity:0.75;">${description}</p></div>
    </div>
    <div style="padding:32px 20px;background:var(--color-background-primary);text-align:center;">
      <div style="font-size:40px;margin-bottom:12px;">🚧</div>
      <p style="font-size:14px;font-weight:500;color:var(--color-text-primary);margin:0 0 8px;">Moduł w przygotowaniu</p>
    </div>
  </div>`;
}

// Analizy (VOLUME): wczytanie okresu bazowego intensywności z BasePeriodModule.
function _analApplyIntensityBase(it) {
  ANAL.before.from = it.periodFrom || '';
  ANAL.before.to = it.periodTo || '';
  ANAL.before.months = (it.months || []).map(m => ({ month: Number(m.month),
    name: m.name || (ANAL_MONTHS[(Number(m.month) || 1) - 1] || ''), days: m.days,
    tme: (m.intRzecz != null) ? m.intRzecz : '' }));
  const std = {};
  for (let mo = 1; mo <= 12; mo++) std[mo] = [0, new Date(2025, mo, 0).getDate()];
  (it.months || []).forEach(m => { const mo = Number(m.month); if (mo >= 1 && mo <= 12) std[mo] = [(m.intRef != null ? m.intRef : 0), (m.days != null ? m.days : std[mo][1])]; });
  ANAL.std = std;
  ANAL.before.consumption = (it.consumption != null) ? it.consumption : '';
  if (it.energyUnit) ANAL.energy.unit = it.energyUnit;
}



// ─── Regresja liniowa: przycisk „+ Dodaj okres bazowy" odsłaniający formularz danych czasowych ───
function _regTabHeader() {
  const show = !!window._regShowForm;
  return _bpSelectors() + `<div style="display:flex;justify-content:space-between;align-items:center;margin:6px 0 16px;gap:10px;flex-wrap:wrap;">
    <h3 style="margin:0;font-size:15px;font-weight:600;color:#0C447C;">📈 Okres bazowy — regresja liniowa</h3>
    <button class="primary-button" onclick="window._regShowForm=${show ? 'false' : 'true'};renderMeasurementsModule();" style="font-size:13px;padding:7px 16px;white-space:nowrap;">${show ? '✕ Zamknij' : '+ Dodaj okres bazowy'}</button>
  </div>`;
}

function _regCsvHelp() {
  const r = (h, m, e) => `<tr style="border-bottom:0.5px solid #D7E6F5;">
    <td style="padding:5px 8px;"><code style="background:#fff;border:1px solid #B5D4F4;border-radius:4px;padding:1px 5px;font-size:11px;">${h}</code></td>
    <td style="padding:5px 8px;">${m}</td><td style="padding:5px 8px;color:var(--color-text-secondary);">${e}</td></tr>`;
  return `<div style="border:1px solid #B5D4F4;border-radius:10px;background:#F7FAFE;padding:14px 16px;margin-bottom:14px;font-size:12px;color:#33475B;line-height:1.55;">
    <div style="font-weight:600;color:#0C447C;margin-bottom:6px;">📄 Jak przygotować plik CSV / Excel</div>
    Pierwszy wiersz to nagłówki kolumn. Wielkość liter, spacje, podkreślenia i myślniki w nagłówkach nie mają znaczenia — np. <code>tOutdoor</code>, <code>t_outdoor</code> i <code>T Outdoor</code> są równoważne. Rozpoznawane kolumny:
    <table style="width:100%;border-collapse:collapse;margin:8px 0;font-size:12px;">
      <thead><tr style="background:#E6F1FB;">
        <th style="text-align:left;padding:5px 8px;">Nagłówek w pliku</th><th style="text-align:left;padding:5px 8px;">Znaczenie</th><th style="text-align:left;padding:5px 8px;">Przykład</th></tr></thead>
      <tbody>
        ${r('readTime', 'Data i czas odczytu', '2026-01-15 08:00')}
        ${r('tOutdoor', 'Temperatura zewnętrzna [°C]', '0,4')}
        ${r('tSupply', 'Temperatura zasilania [°C]', '54,2')}
        ${r('tReturn', 'Temperatura powrotu [°C]', '43,7')}
        ${r('vFlow', 'Przepływ [dm³/h]', '3827')}
        ${r('heatPower', 'Moc dostarczona [W]', '46012')}
        ${r('heatConsumption', 'Zużycie ciepła [MJ]', '2826')}
      </tbody>
    </table>
    <b>Separator:</b> przecinek, średnik lub tabulator. &nbsp;<b>Liczby dziesiętne:</b> kropka lub przecinek (<code>0,4</code> = <code>0.4</code>). &nbsp;<b>Kolejność kolumn:</b> dowolna; brakujące pola zostaw puste. &nbsp;<b>Excel:</b> zapisz arkusz jako <b>CSV UTF-8</b> (Plik → Zapisz jako → CSV UTF-8), nagłówki jak wyżej; bezpośredni import <code>.xlsx</code> nie jest jeszcze wspierany.
  </div>`;
}

// ─── Wspólny selektor klienta i obiektu na górze każdej zakładki okresu bazowego ───
function _bpSelectors() {
  const objs = (typeof getObjects === 'function') ? getObjects() : [];
  if (!objs.length) return '';
  let sel = selectedMeasurementObjectId ? ObjectsModule.find(selectedMeasurementObjectId) : objs[0];
  if (!sel) sel = objs[0];
  if (sel) selectedMeasurementObjectId = Number(sel.id);
  const clientId = sel ? Number(sel.clientId) : null;
  const clients = (typeof getClients === 'function') ? getClients() : [];
  const objsForClient = clientId ? ObjectsModule.findByClient(clientId) : objs;
  const lbl = 'display:block;font-size:12px;color:var(--color-text-secondary);margin-bottom:4px;';
  const inp = 'width:100%;padding:8px 10px;border:1px solid var(--color-border-tertiary);border-radius:8px;font-size:13px;';
  return `<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;padding:14px 16px;background:var(--color-background-secondary);border:1px solid var(--color-border-tertiary);border-radius:10px;">
    <div style="flex:1;min-width:200px;"><label style="${lbl}">Klient</label>
      <select onchange="_bpSelectClient(this.value)" style="${inp}">
        ${clients.map(c => { const cn = ClientsModule.getNumber(c.id); return `<option value="${c.id}" ${Number(c.id) === clientId ? 'selected' : ''}>${cn ? 'K' + cn + ' — ' : ''}${escapeHtml(c.name)}</option>`; }).join('')}
      </select></div>
    <div style="flex:1;min-width:200px;"><label style="${lbl}">Obiekt</label>
      <select onchange="selectedMeasurementObjectId=Number(this.value);renderMeasurementsModule();" style="${inp}">
        ${objsForClient.map(o => { const cn = ClientsModule.getNumber(o.clientId); const on = ObjectsModule.getNumber(o.id); return `<option value="${o.id}" ${Number(o.id) === Number(selectedMeasurementObjectId) ? 'selected' : ''}>${(cn && on) ? 'K' + cn + '-' + on + ' — ' : ''}${escapeHtml(o.name || 'Obiekt')}</option>`; }).join('')}
      </select></div>
  </div>`;
}

function _bpSelectClient(v) {
  const objs = ObjectsModule.findByClient(Number(v));
  selectedMeasurementObjectId = objs[0] ? Number(objs[0].id) : selectedMeasurementObjectId;
  renderMeasurementsModule();
}

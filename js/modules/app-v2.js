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
  .anw-rephead{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:2px solid #0C447C;padding-bottom:12px;margin-bottom:16px;}
  .anw-rephead .brand{font-size:20px;font-weight:800;color:#0C447C;letter-spacing:.3px;}
  .anw-rephead .sub{font-size:12px;color:var(--color-text-secondary);}
  .anw-rephead .num{font-size:13px;font-weight:700;color:#633806;text-align:right;white-space:nowrap;}
  .anw-step-card{border:1px solid var(--color-border-tertiary);border-radius:12px;padding:16px;margin-bottom:14px;background:var(--color-background-primary);}
  .anw-step-card h4{margin:0 0 6px;font-size:14px;color:#0C447C;display:flex;align-items:center;gap:10px;}
  .anw-step-num{flex:0 0 auto;width:24px;height:24px;border-radius:50%;background:#0C447C;color:#fff;font-size:12px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;}
  .anw-formula{font-family:'Cambria Math','Times New Roman',Georgia,serif;background:#F4F7FB;border-left:3px solid #0C447C;padding:9px 13px;border-radius:6px;font-size:14.5px;margin:8px 0;overflow-x:auto;color:var(--color-text-primary);}
  .anw-desc{font-size:12.5px;color:var(--color-text-secondary);line-height:1.55;}
  .anw-chart-wrap{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:6px;}
  .anw-chart-wrap canvas{width:100%;height:260px;border:1px solid var(--color-border-tertiary);border-radius:8px;background:#fff;}
  .anw-sign{display:grid;grid-template-columns:1fr 1fr;gap:34px;margin:30px 4px 8px;}
  .anw-sign-box{padding-top:40px;}
  .anw-sign-line{border-top:1px solid var(--color-text-primary);}
  .anw-sign-cap{font-size:11px;color:var(--color-text-secondary);margin-top:6px;line-height:1.5;}
  .anw-sign-wateria{position:relative;}
  .anw-stamp{display:inline-block;border:2px solid #0C447C;color:#0C447C;border-radius:10px;padding:7px 15px;font-weight:800;font-size:13px;transform:rotate(-3deg);letter-spacing:.6px;background:rgba(12,68,124,.04);}
  @media(max-width:680px){.anw-g4{grid-template-columns:1fr 1fr;}.anw-g3{grid-template-columns:1fr;}.anw-chart-wrap{grid-template-columns:1fr;}.anw-sign{grid-template-columns:1fr;}}
  @media print{
    body *{visibility:hidden !important;}
    #anw-report,#anw-report *{visibility:visible !important;}
    #anw-report{position:absolute;left:0;top:0;width:100%;margin:0;padding:0;border:none;}
    .anw-noprint{display:none !important;}
    .anw-step-card,.anw-sec,.anw-sign,.anw-hero{break-inside:avoid;page-break-inside:avoid;}
    .anw-chart-wrap canvas{break-inside:avoid;}
    @page{margin:14mm;}
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
  if (ANAL.step === 2 && ANAL.results) setTimeout(() => _analDrawCharts(_analReportData({ live: true })), 60);
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
          <div class="anw-f"><label>Okres bazowy (PRZED instalacją)</label>
            <select onchange="analOnBasePeriod(this.value)" ${ANAL.objectId ? '' : 'disabled'}>
              <option value="">${ANAL.objectId ? (baseProtocols.length ? '— wybierz okres bazowy —' : 'brak zapisanych okresów bazowych') : 'najpierw obiekt'}</option>
              ${baseProtocols.map(p => `<option value="${p.id}" ${String(ANAL.basePeriod) === String(p.id) ? 'selected' : ''}>${_escA(p.protocolNumber || ('Protokół ' + p.id))}${p.protocolDate ? ' · ' + _escA(p.protocolDate) : ''}</option>`).join('')}
              ${(ANAL.type === 'VOLUME' && window.BasePeriodModule && ANAL.objectId) ? BasePeriodModule.findByObjectType(ANAL.objectId, 'volume').map(it => `<option value="int:${it.id}" ${ANAL.basePeriod === ('int:' + it.id) ? 'selected' : ''}>⚙️ ${_escA(it.protocolNumber || 'Okres bazowy intensywności')} · ${_fmtDateA(it.periodFrom)}–${_fmtDateA(it.periodTo)}</option>`).join('') : ''}
              <option value="manual" ${ANAL.basePeriod === 'manual' ? 'selected' : ''}>✏️ Ręczne wprowadzenie</option>
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
    body = _analRegInfo();
  } else {
    body = `<div class="anw-sec"><div class="anw-head anw-gold"><span class="ico">${t.icon}</span><h3>${_escA(t.label)}</h3></div>
      <div class="anw-body" style="text-align:center;padding:40px 20px;color:var(--color-text-secondary);">
        <div style="font-size:42px;margin-bottom:10px;">🚧</div><strong>Metoda w przygotowaniu</strong>
        <div class="anw-muted" style="margin-top:6px;">Szkielet kreatora jest gotowy. Arkusz obliczeniowy tej metody dodamy w kolejnym kroku.</div></div></div>`;
  }

  const footer = (ANAL.objectId && ANAL.basePeriod && (ANAL.type === 'TYM' || ANAL.type === 'VOLUME')) ? `
    <div class="anw-act" style="justify-content:space-between;align-items:center;">
      <span class="anw-muted">${ANAL.type === 'VOLUME'
        ? 'Wsk = I·z₀ · φ = ΣWsk_ref / ΣWsk_rzecz · Qs = Q·φ (zużycie sprowadzone do referencyjnej intensywności)'
        : ('Tᵢ = ' + _analBaseTi() + ' °C · SD' + _analBaseTi() + ' = z₀·(Tᵢ−tₘₑ) · φ = ΣSD_stand / ΣSD_rzecz · Qs = Q·φ')}</span>
      <button class="anw-run" onclick="analRun()">⚡ Wykonaj analizę</button>
    </div>
    <div id="anw-results">${ANAL.results ? _analResults() : ''}</div>` : '';

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
    <span>Tᵢ bazowa: <b>${_analBaseTi()} °C</b></span>
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
          <select onchange="ANAL.energy.unit=this.value;_analRecalcLive()">
            ${['GJ','MWh','kWh','m³'].map(u => `<option ${ANAL.energy.unit === u ? 'selected' : ''}>${u}</option>`).join('')}
          </select></div>
        <div class="anw-f"><label>Waluta</label>
          <select onchange="ANAL.energy.currency=this.value;_analRecalcLive()">
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
          ? `<div class="anw-f"><label>Koszt zmienny całościowy [${_escA(ANAL.energy.currency)}]</label>
              <input type="number" step="0.01" min="0" value="${ANAL.energy.price}" placeholder="np. 1 200,00" oninput="ANAL.energy.price=this.value;_analRecalcLive()"></div>`
          : `<div class="anw-f"><label>Cena energii (za jednostkę)</label>
              <input type="number" step="0.0001" min="0" value="${ANAL.energy.price}" placeholder="np. 0,54" oninput="ANAL.energy.price=this.value;_analRecalcLive()"></div>`}
        <div class="anw-f"><label>Opis (np. uwzględnia koszty przesyłu i pozostałe składowe faktury)</label>
          <input type="text" value="${_escA(ANAL.energy.priceDescription || '')}" placeholder="WaterAI redukuje zużycie, a tym samym koszty przesyłu i inne składowe…" oninput="ANAL.energy.priceDescription=this.value"></div>
      </div>
      ${ANAL.energy.priceMode === 'VARIABLE'
        ? `<div class="anw-note">Koszt zmienny całościowy to <b>łączna kwota</b> oszczędności (energia + przesył i pozostałe składowe redukowane przez WaterAI), wpisywana wprost — nie jest mnożona przez zużycie. Udział WaterAI/ESCO liczony jest od tej kwoty. Opis trafia do analizy i raportu ESCO.</div>`
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
  const bp = (ANAL.objectId && window.MeasurementsModule)
    ? (MeasurementsModule.findByObject(ANAL.objectId) || []) : [];
  if (bp.length === 1) { ANAL.basePeriod = bp[0].id; _analApplyBaseProtocol(bp[0]); }
  renderAnalysesModule();
}
function analOnBasePeriod(v) {
  ANAL.basePeriod = v || null;
  if (v && v !== 'manual') {
    const p = window.MeasurementsModule ? MeasurementsModule.find(Number(v)) : null;
    if (p) _analApplyBaseProtocol(p);
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
  // PRZED instalacją = okres porównawczy (bazowy)
  ANAL.before.from = p.comparisonPeriodStartDate || '';
  ANAL.before.to = p.comparisonPeriodEndDate || '';
  const comp = p.comparisonMonthly || [];
  if (comp.length) {
    ANAL.before.months = comp.map(m => {
      const mo = Number(m.month) || 1;
      const yr = Number(m.year) || (m.monthName && /\d{4}/.test(m.monthName) ? Number(m.monthName.match(/\d{4}/)[0]) : '');
      return {
        year: yr,
        month: mo,
        name: m.monthName || (ANAL_MONTHS[mo - 1] + (yr ? ' ' + yr : '')),
        days: (m.days !== null && m.days !== undefined) ? Number(m.days) : '',
        tme: (m.temperature !== null && m.temperature !== undefined) ? Number(m.temperature) : ''
      };
    });
  } else {
    ANAL.before.months = _analMonthsBetween(ANAL.before.from, ANAL.before.to);
  }
  ANAL.before.consumption = (p.comparisonConsumption !== null && p.comparisonConsumption !== undefined) ? p.comparisonConsumption : '';
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
  const before = _analComputePeriod('before');
  const after = _analComputePeriod('after');
  if (before.qs == null || after.qs == null) {
    alert('Uzupełnij temperatury i dni dla obu okresów (PRZED i PO) oraz zużycie Qc.o., aby wyznaczyć współczynniki korekcyjne.');
    return;
  }
  const savedEnergy = before.qs - after.qs;
  const savedPct = before.qs > 0 ? savedEnergy / before.qs * 100 : 0;
  const price = Number(ANAL.energy.price || 0);
  // FIXED: cena za jednostkę × zaoszczędzona energia. VARIABLE: koszt zmienny całościowy wpisany wprost.
  const savedMoney = (ANAL.energy.priceMode === 'VARIABLE') ? price : savedEnergy * price;
  const escoShare = Number(ANAL.energy.escoShare || 0);
  const escoAmount = savedMoney * escoShare / 100;
  const clientAmount = savedMoney - escoAmount;

  ANAL.results = { before, after, savedEnergy, savedPct, savedMoney, escoShare, escoAmount, clientAmount,
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
  <div class="anw-act anw-noprint" style="justify-content:flex-end;margin:6px 0 14px;gap:10px;">
    <button class="small-button" onclick="analPrintPDF()">🖨 Drukuj do PDF</button>
    <button class="anw-run" style="background:linear-gradient(135deg,#0C447C,#1a6bb5);font-size:14px;padding:12px 24px;box-shadow:0 6px 18px rgba(12,68,124,.25);" onclick="analSave()">💾 Zapisz analizę</button>
  </div>
  <div id="anw-report" class="anw-report">${_analReportBody(data)}</div>`;
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
      qsBefore: r.before.qs, qsAfter: r.after.qs
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
  let clientId, objectId, std, beforeP, afterP, energy, name, executedAt, number, tiBefore, tiAfter, base, saved, cid;
  if (source && source.saved) {
    const a = source.saved, ip = a.inputParams || {}, rr = a.results || {};
    clientId = a.clientId; objectId = a.objectId; std = ip.std || ANAL_STD_DEFAULT;
    beforeP = ip.before || { months: [], consumption: '' };
    afterP = ip.after || { months: [], consumption: '' };
    energy = { unit: ip.energyUnit || 'GJ', currency: ip.currency || 'PLN', price: ip.energyPrice,
      escoShare: ip.escoShare, priceMode: ip.priceMode || 'FIXED', priceDescription: ip.priceDescription || '' };
    tiBefore = (ip.baseTi != null && ip.baseTi !== '') ? ip.baseTi : (afterP.baseTi != null ? afterP.baseTi : ANAL_TI);
    tiAfter = (afterP.baseTi != null && afterP.baseTi !== '') ? afterP.baseTi : tiBefore;
    name = a.name; executedAt = a.executedAt;
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
    number = ANAL.editingId ? ((AnalysesModule.getNumber && AnalysesModule.getNumber(ANAL.editingId)) || ('#' + ANAL.editingId)) : '— (niezapisana)';
    const rr = ANAL.results || {};
    base = { savedEnergy: rr.savedEnergy, savedPct: rr.savedPct, savedMoney: rr.savedMoney, escoShare: rr.escoShare, escoAmount: rr.escoAmount };
    saved = false; cid = 'anwlive';
  }
  const _isVol = (source && source.saved) ? (source.saved.analysisType === 'VOLUME') : (ANAL.type === 'VOLUME');
  const before = _isVol ? _analCalcPeriodRowsVOL(beforeP.months, std, beforeP.consumption) : _analCalcPeriodRows(beforeP.months, std, tiBefore, beforeP.consumption);
  const after = _isVol ? _analCalcPeriodRowsVOL(afterP.months, std, afterP.consumption) : _analCalcPeriodRows(afterP.months, std, tiAfter, afterP.consumption);
  const escoShare = Number(energy.escoShare || 0);
  const savedEnergy = (base.savedEnergy != null) ? base.savedEnergy : ((before.qs != null && after.qs != null) ? before.qs - after.qs : null);
  const savedPct = (base.savedPct != null) ? base.savedPct : ((before.qs > 0 && savedEnergy != null) ? savedEnergy / before.qs * 100 : null);
  const price = Number(energy.price || 0);
  const savedMoney = (base.savedMoney != null) ? base.savedMoney : ((energy.priceMode === 'VARIABLE') ? price : (savedEnergy != null ? savedEnergy * price : null));
  const escoAmount = (base.escoAmount != null) ? base.escoAmount : (savedMoney != null ? savedMoney * escoShare / 100 : null);
  const clientAmount = (savedMoney != null && escoAmount != null) ? savedMoney - escoAmount : null;
  return {
    client: ClientsModule.find(clientId), object: ObjectsModule.find(objectId),
    name, executedAt, number, saved, std, energy, tiBefore, tiAfter, cid,
    type: _isVol ? 'VOLUME' : ((source && source.saved) ? source.saved.analysisType : ANAL.type),
    before: Object.assign({}, before, { from: beforeP.from, to: beforeP.to, consumption: beforeP.consumption }),
    after: Object.assign({}, after, { from: afterP.from, to: afterP.to, consumption: afterP.consumption }),
    savedEnergy, savedPct, savedMoney, escoShare, escoAmount, clientAmount
  };
}

function _anwPeriodTable(P, ti) {
  const rows = (P.rows || []).map(r => `<tr>
    <td>${_escA(r.name)}</td>
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
}

function _analReportBody(data) {
  if (data && data.type === 'VOLUME') return _analReportBodyVOL(data);
  const u = data.energy.unit, cur = data.energy.currency, tiB = data.tiBefore, tiA = data.tiAfter;
  const genDate = _fmtDateA(new Date().toISOString().slice(0, 10));
  const pos = (data.savedPct || 0) >= 0;
  const priceLine = data.energy.priceMode === 'VARIABLE'
    ? `Koszt zmienny całościowy (wpisany wprost): <b>${_fmtA(data.savedMoney || 0, 2)} ${cur}</b>${data.energy.priceDescription ? ' — ' + _escA(data.energy.priceDescription) : ''}`
    : `Cena energii: <b>${_fmtA(Number(data.energy.price || 0), 4)} ${cur}/${u}</b>`;
  return `
  <div class="anw-rephead">
    <div><div class="brand">WaterAI Energy Control</div><div class="sub">Analiza oszczędności energii — metoda korekty stopniodni (TYM)</div></div>
    <div class="num">${_escA(data.number)}<br><span class="sub">${_fmtDateA(data.executedAt)}</span></div>
  </div>
  <div class="anw-ctx" style="margin-top:0;">
    <span>Klient: <b>${_escA((data.client && data.client.name) || '—')}</b></span>
    <span>Obiekt: <b>${_escA((data.object && data.object.name) || '—')}</b></span>
    <span>Okres PRZED: <b>${_fmtDateA(data.before.from)} → ${_fmtDateA(data.before.to)}</b></span>
    <span>Okres PO: <b>${_fmtDateA(data.after.from)} → ${_fmtDateA(data.after.to)}</b></span>
  </div>

  <div class="anw-hero" style="margin-top:16px;">
    <div><div class="lbl">Oszczędność (OSZ)</div><div class="big">${pos ? '' : '−'}${_fmtA(Math.abs(data.savedPct || 0), 1)}%</div></div>
    <div><div class="lbl">Energia zaoszczędzona</div><div class="big">${_fmtA(data.savedEnergy || 0, 2)} <span style="font-size:16px;">${u}</span></div></div>
    <div><div class="lbl">Wartość oszczędności</div><div class="big">${_fmtA(data.savedMoney || 0, 2)} <span style="font-size:16px;">${cur}</span></div></div>
  </div>

  <div class="anw-step-card">
    <h4><span class="anw-step-num">1</span> Stopniodni grzewcze (SD) — rzeczywiste i standardowe (TYM)</h4>
    <div class="anw-desc">Dla każdego miesiąca stopniodni to iloczyn liczby dni okresu w danym miesiącu (z₀) oraz różnicy między projektową temperaturą wewnętrzną Tᵢ a średnią temperaturą zewnętrzną. Strona standardowa stosuje temperatury Typowego Roku Meteorologicznego (TYM) przy tej samej liczbie dni okresu — to klucz porównywalności.</div>
    <div class="anw-formula">SD<sub>Tᵢ</sub> = z₀ · (Tᵢ − t)&nbsp;&nbsp;[°C·dni];&nbsp;&nbsp; Tᵢ(PRZED) = ${tiB} °C,&nbsp; Tᵢ(PO) = ${tiA} °C</div>
    <div class="anw-g2" style="margin-top:10px;">
      <div><div class="anw-muted" style="margin-bottom:4px;color:#0C447C;font-weight:600;">Okres PRZED instalacją</div>${_anwPeriodTable(data.before, tiB)}</div>
      <div><div class="anw-muted" style="margin-bottom:4px;color:#27500A;font-weight:600;">Okres PO instalacji</div>${_anwPeriodTable(data.after, tiA)}</div>
    </div>
  </div>

  <div class="anw-step-card">
    <h4><span class="anw-step-num">2</span> Współczynnik korekcyjny φ</h4>
    <div class="anw-desc">φ normalizuje zużycie do warunków typowego roku. Jest ilorazem sumy stopniodni standardowych i rzeczywistych, liczonych na tych samych dniach okresu (φ&gt;1 → okres cieplejszy od normy).</div>
    <div class="anw-formula">φ = ∑SD<sub>std</sub> / ∑SD<sub>rzecz</sub></div>
    <div class="anw-g2">
      <div class="anw-formula" style="border-color:#0C447C;">φ<sub>PRZED</sub> = ${_fmtA(data.before.sumS, 1)} / ${_fmtA(data.before.sumR, 1)} = <b>${data.before.phi != null ? _fmtA(data.before.phi, 4) : '—'}</b></div>
      <div class="anw-formula" style="border-color:#27500A;">φ<sub>PO</sub> = ${_fmtA(data.after.sumS, 1)} / ${_fmtA(data.after.sumR, 1)} = <b>${data.after.phi != null ? _fmtA(data.after.phi, 4) : '—'}</b></div>
    </div>
  </div>

  <div class="anw-step-card">
    <h4><span class="anw-step-num">3</span> Zużycie skorygowane Qs</h4>
    <div class="anw-desc">Zmierzone zużycie ciepła Qc.o. mnożymy przez φ, otrzymując zużycie, jakie wystąpiłoby w warunkach typowego roku meteorologicznego — dzięki temu oba okresy są w pełni porównywalne, niezależnie od pogody.</div>
    <div class="anw-formula">Qs = Qc.o. · φ</div>
    <div class="anw-g2">
      <div class="anw-formula" style="border-color:#0C447C;">Qs<sub>PRZED</sub> = ${_fmtA(Number(data.before.consumption || 0), 2)} · ${data.before.phi != null ? _fmtA(data.before.phi, 4) : '—'} = <b>${data.before.qs != null ? _fmtA(data.before.qs, 2) : '—'} ${u}</b></div>
      <div class="anw-formula" style="border-color:#27500A;">Qs<sub>PO</sub> = ${_fmtA(Number(data.after.consumption || 0), 2)} · ${data.after.phi != null ? _fmtA(data.after.phi, 4) : '—'} = <b>${data.after.qs != null ? _fmtA(data.after.qs, 2) : '—'} ${u}</b></div>
    </div>
  </div>

  <div class="anw-step-card">
    <h4><span class="anw-step-num">4</span> Oszczędność energii i rozliczenie</h4>
    <div class="anw-desc">${priceLine}.&nbsp; Udział WaterAI / ESCO: <b>${_fmtA(data.escoShare || 0, 0)}%</b>.</div>
    <div class="anw-formula">OSZ = (Qs<sub>PRZED</sub> − Qs<sub>PO</sub>) / Qs<sub>PRZED</sub> · 100%</div>
    <div class="anw-formula">Energia zaoszczędzona = ${_fmtA(data.before.qs || 0, 2)} − ${_fmtA(data.after.qs || 0, 2)} = <b>${_fmtA(data.savedEnergy || 0, 2)} ${u}</b>&nbsp; (${pos ? '' : '−'}${_fmtA(Math.abs(data.savedPct || 0), 1)}%)</div>
    <div class="anw-rgrid" style="margin-top:10px;">
      <div class="anw-tile"><div class="v">${_fmtA(data.savedMoney || 0, 2)} ${cur}</div><div class="k">Wartość oszczędności</div></div>
      <div class="anw-tile"><div class="v">${_fmtA(data.escoAmount || 0, 2)} ${cur}</div><div class="k">Udział WaterAI/ESCO (${_fmtA(data.escoShare || 0, 0)}%)</div></div>
      <div class="anw-tile"><div class="v">${_fmtA(data.clientAmount || 0, 2)} ${cur}</div><div class="k">Udział klienta</div></div>
    </div>
  </div>

  <div class="anw-step-card">
    <h4><span class="anw-step-num">5</span> Wizualizacja</h4>
    <div class="anw-chart-wrap">
      <canvas id="${data.cid}-sd"></canvas>
      <canvas id="${data.cid}-qs"></canvas>
    </div>
  </div>

  <div class="anw-sign">
    <div class="anw-sign-box">
      <div class="anw-sign-line"></div>
      <div class="anw-sign-cap">Klient — podpis i data</div>
    </div>
    <div class="anw-sign-box anw-sign-wateria">
      <div class="anw-stamp">WaterAI Energy</div>
      <div class="anw-sign-cap" style="margin-top:10px;">Dokument wygenerowany elektronicznie w systemie <b>WaterAI Energy Control</b> dnia ${genDate}. Nie wymaga podpisu ani pieczęci.</div>
      <div class="anw-sign-cap">Analizy energetyczne WaterAI Energy.</div>
    </div>
  </div>`;
}

function analPrintPDF() { window.print(); }

// ── podgląd / raport ────────────────────────────────────────────────────────────
function analView(id) {
  const a = AnalysesModule.find(id); if (!a) return;
  const container = document.getElementById('module-content'); if (!container) return;
  const data = _analReportData({ saved: a });
  container.innerHTML = ANAL_STYLE + `
    <div class="anw-act anw-noprint" style="justify-content:space-between;margin-bottom:14px;">
      <button class="small-button" onclick="renderAnalysesModule()">← Lista analiz</button>
      <button class="anw-run" style="font-size:14px;padding:11px 22px;" onclick="analPrintPDF()">🖨 Drukuj do PDF</button>
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
    const period=(ip.billingFrom||ip.billingTo)?`${fmtDate(ip.billingFrom)} → ${fmtDate(ip.billingTo)}`:fmtDate(a.executedAt);
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
  const appr=document.getElementById('esco-approved');
  if(appr) appr.innerHTML=escoClientUserOptions(cid,'');
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
  const initClientId=prefillAnal?Number(prefillAnal.clientId):'';
  const initObjectId=prefillAnal?Number(prefillAnal.objectId):'';
  const preselectIds=prefillAnal?[Number(prefillAnal.id)]:[];

  const reportRows=allReports.map(rep=>{
    const client=ClientsModule.find(rep.clientId);
    const obj=ObjectsModule.find(rep.objectId);
    const st={DRAFT:{label:'Szkic',color:'#666'},FINAL:{label:'Finalny',color:'#185FA5'},SIGNED:{label:'Podpisany',color:'#27500A'}}[rep.status]||{label:rep.status,color:'#666'};
    return `<tr style="border-bottom:1px solid var(--color-border-tertiary);">
      <td style="padding:9px 12px;font-size:13px;font-weight:500;">${escapeHtml(rep.reportNumber||'—')}</td>
      <td style="padding:9px 12px;font-size:13px;">${escapeHtml((client&&client.name)||'—')}</td>
      <td style="padding:9px 12px;font-size:13px;">${escapeHtml((obj&&obj.name)||'—')}</td>
      <td style="padding:9px 12px;font-size:13px;">${fmtDate(rep.periodFrom)} → ${fmtDate(rep.periodTo)}</td>
      <td style="padding:9px 12px;font-size:13px;color:#27500A;">${rep.results&&rep.results.savedEnergyPct!=null?((rep.results.savedEnergyPct<1?rep.results.savedEnergyPct*100:rep.results.savedEnergyPct)).toFixed(1)+'%':'—'}</td>
      <td style="padding:9px 12px;"><span style="font-size:11px;font-weight:600;padding:2px 9px;border-radius:20px;background:${st.color}22;color:${st.color};">${st.label}</span></td>
      <td style="padding:9px 12px;white-space:nowrap;">
        <div style="display:flex;gap:4px;align-items:center;">
          <button class="icon-btn" onclick="viewESCOReport('${rep.id}')" title="Podgląd">👁</button>
          <button class="icon-btn icon-btn-del" onclick="if(confirm('Usuń raport?')){const r=JSON.parse(localStorage.getItem('waterai_esco_reports_v1')||'[]').filter(x=>x.id!=='${rep.id}');localStorage.setItem('waterai_esco_reports_v1',JSON.stringify(r));window._escoReports=r;renderESCOReports();}" title="Usuń">🗑</button>
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
        <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">% oszczędności</th>
        <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Status</th>
        <th style="padding:8px 12px;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Akcje</th>
      </tr></thead>
      <tbody>${reportRows}</tbody>
    </table>
  </div>`}

  <!-- FORMULARZ NOWEGO RAPORTU -->
  <div id="esco-form-wrap" style="display:${prefill?'block':'none'};">
    <div style="border:1px solid #B5D4F4;border-radius:14px;padding:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="margin:0;font-size:16px;color:#0C447C;">📄 Nowy raport ESCO</h3>
        <button class="small-button" onclick="document.getElementById('esco-form-wrap').style.display='none';window._prefillESCOAnalysisId=null;">✕ Zamknij</button>
      </div>
      <form onsubmit="saveESCOReport(this);return false;">

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
            <div class="esco-field"><label>Numer raportu</label><input id="esco-number" name="reportNumber" required placeholder="ESCO/rok/nr klienta/nr obiektu/nr" value="${escoSuggestNumber(initClientId,initObjectId)}"/></div>
            <div class="esco-field"><label>Data raportu</label><input name="reportDate" type="date" required value="${new Date().toISOString().slice(0,10)}"/></div>
            <div class="esco-field"><label>Status</label><select name="reportStatus">
              <option value="DRAFT">Szkic</option>
              <option value="FINAL">Finalny</option>
              <option value="SIGNED">Podpisany</option>
            </select></div>
            <div class="esco-field"><label>Sporządził (Energy Analyst)</label>
              <select id="esco-prepared" name="preparedBy">${escoAnalystOptions('')}</select></div>
            <div class="esco-field"><label>Zatwierdził (Klient)</label>
              <select id="esco-approved" name="approvedBy">${escoClientUserOptions(initClientId,'')}</select></div>
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
          <div><div style="font-size:28px;font-weight:700;" id="esco-res-pct">—</div><div style="font-size:11px;opacity:.8;">% redukcji (śr.)</div></div>
          <div><div style="font-size:28px;font-weight:700;" id="esco-res-energy">—</div><div style="font-size:11px;opacity:.8;">oszczędność energii</div></div>
          <div><div style="font-size:28px;font-weight:700;" id="esco-res-money">—</div><div style="font-size:11px;opacity:.8;">wartość oszczędności</div></div>
          <div><div style="font-size:28px;font-weight:700;" id="esco-res-reg">—</div><div style="font-size:11px;opacity:.8;">wybrane analizy</div></div>
        </div>
        <div style="margin-top:12px;font-size:12px;opacity:.8;" id="esco-res-detail"></div>
      </div>

      <!-- NOTATKI -->
      <div class="esco-field" style="margin:16px 0;">
        <label>Uwagi do raportu</label>
        <input name="reportNotes" placeholder="opcjonalne uwagi"/>
      </div>

      <div style="display:flex;gap:10px;">
        <button class="primary-button" type="submit">⚡ Wykonaj Raport ESCO</button>
        <button class="small-button" type="button" onclick="document.getElementById('esco-form-wrap').style.display='none';window._prefillESCOAnalysisId=null;">Anuluj</button>
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
    const r=a.results||{}, ip=a.inputParams||{};
    if(r.savedEnergy) totalSaved+=Number(r.savedEnergy);
    if(r.savedMoney)  totalMoney+=Number(r.savedMoney);
    if(ip.energyUnit) unit=ip.energyUnit;
    if(ip.currency)   currency=ip.currency;
    const p=_escoAnalPct(a); if(p!=null) pctVals.push(p);
  });
  const pct=pctVals.length?(pctVals.reduce((s,v)=>s+v,0)/pctVals.length).toFixed(1)+'%':'—';

  document.getElementById('esco-res-pct').textContent=pct;
  document.getElementById('esco-res-energy').textContent=totalSaved.toFixed(2)+' '+(unit||'');
  document.getElementById('esco-res-money').textContent=totalMoney.toFixed(2)+' '+(currency||'');
  document.getElementById('esco-res-reg').textContent=String(anals.length);
  document.getElementById('esco-res-detail').textContent=anals.map(a=>{
    const t=(AnalysesModule.TYPES[a.analysisType]||{}).label||a.analysisType;
    return `${t}: ${a.name}`;
  }).join('  |  ');

  window._escoLiveResults={totalSaved, totalMoney, pct, unit, currency, analIds:ids};
}

function saveESCOReport(form) {
  const clientId=(document.getElementById('esco-client')||{}).value;
  const objectId=(document.getElementById('esco-object')||{}).value;
  const ids=[...document.querySelectorAll('[name="esco_anal"]:checked')].map(c=>Number(c.value));

  if(!clientId){alert('Wybierz klienta.');return;}
  if(!objectId){alert('Wybierz obiekt.');return;}
  if(!ids.length){alert('Zaznacz co najmniej jedną analizę powiązaną z tym obiektem.');return;}

  // upewnij się, że podsumowanie jest policzone z aktualnego zaznaczenia
  updateESCOSummary();
  const r=window._escoLiveResults||{};

  const anals=ids.map(id=>AnalysesModule.find(id)).filter(Boolean);
  const tymIds=anals.filter(a=>a.analysisType==='TYM').map(a=>Number(a.id));
  const regIds=anals.filter(a=>a.analysisType==='REGRESSION').map(a=>Number(a.id));
  const firstTym=anals.find(a=>a.analysisType==='TYM')||anals[0]||{};
  const ftIp=firstTym.inputParams||{}, ftR=firstTym.results||{};

  // okres = od najwcześniejszego do najpóźniejszego okresu rozliczeniowego wybranych analiz
  const froms=anals.map(a=>(a.inputParams||{}).billingFrom).filter(Boolean).sort();
  const tos  =anals.map(a=>(a.inputParams||{}).billingTo).filter(Boolean).sort();
  const regAnals=anals.filter(a=>a.analysisType==='REGRESSION');
  const avgReg=regAnals.length?regAnals.reduce((s,a)=>s+(a.results?.avgReductionHeat||0),0)/regAnals.length:null;

  const report={
    id: 'esco_'+Date.now(),
    createdAt: new Date().toISOString(),
    reportNumber: form.reportNumber.value.trim(),
    reportDate: form.reportDate.value,
    status: form.reportStatus.value,
    preparedBy: form.preparedBy.value.trim(),
    approvedBy: form.approvedBy.value.trim(),
    clientId: Number(clientId),
    objectId: Number(objectId),
    periodFrom: froms[0]||ftIp.billingFrom||'',
    periodTo: tos[tos.length-1]||ftIp.billingTo||'',
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
      avgReductionReg: avgReg!=null?avgReg/100:null,
      eBill: ftR.eBill,
      eComp: ftR.eComp
    }
  };

  const existing=JSON.parse(localStorage.getItem('waterai_esco_reports_v1')||'[]');
  existing.push(report);
  localStorage.setItem('waterai_esco_reports_v1',JSON.stringify(existing));
  window._escoReports=existing;
  window._prefillESCOAnalysisId=null;
  renderESCOReports();
}

function viewESCOReport(id) {
  const allReports=JSON.parse(localStorage.getItem('waterai_esco_reports_v1')||'[]');
  const rep=allReports.find(r=>r.id===id); if(!rep)return;
  const container=document.getElementById('module-content'); if(!container)return;
  const client=ClientsModule.find(rep.clientId), obj=ObjectsModule.find(rep.objectId);
  const r=rep.results||{};
  const pct=r.savedEnergyPct!=null?((r.savedEnergyPct<1?r.savedEnergyPct*100:r.savedEnergyPct)).toFixed(1)+'%':'—';
  const tymAnals=(rep.analysisIdsTYM||[]).map(id=>AnalysesModule.find(id)).filter(Boolean);
  const regAnals=(rep.analysisIdsREG||[]).map(id=>AnalysesModule.find(id)).filter(Boolean);

  container.innerHTML=`
    <button class="small-button" onclick="renderESCOReports()" style="margin-bottom:16px;">← Lista raportów</button>

    <!-- NAGŁÓWEK -->
    <div style="background:linear-gradient(135deg,#0C447C,#1a6bb5);color:#fff;border-radius:12px;padding:24px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
        <div>
          <div style="font-size:11px;opacity:.7;margin-bottom:4px;">WaterAI · RAPORT ESCO · ${fmtDate(rep.reportDate)}</div>
          <div style="font-size:20px;font-weight:700;">${escapeHtml(rep.reportNumber||'—')}</div>
          <div style="font-size:14px;opacity:.9;margin-top:4px;">${escapeHtml((client&&client.name)||'')} / ${escapeHtml((obj&&obj.name)||'')}</div>
          <div style="font-size:12px;opacity:.7;margin-top:2px;">Okres: ${fmtDate(rep.periodFrom)} → ${fmtDate(rep.periodTo)}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:11px;opacity:.7;">Sporządził</div>
          <div style="font-size:14px;font-weight:600;">${escapeHtml(rep.preparedBy||'—')}</div>
          ${rep.approvedBy?`<div style="font-size:11px;opacity:.7;margin-top:4px;">Zatwierdził: ${escapeHtml(rep.approvedBy)}</div>`:''}
        </div>
      </div>

      <!-- GŁÓWNE WYNIKI -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;text-align:center;padding:16px 0;border-top:1px solid rgba(255,255,255,.2);border-bottom:1px solid rgba(255,255,255,.2);">
        <div><div style="font-size:36px;font-weight:700;">${pct}</div><div style="font-size:11px;opacity:.8;">redukcja zużycia (TYM)</div></div>
        <div><div style="font-size:30px;font-weight:700;">${r.savedEnergyTotal!=null?Number(r.savedEnergyTotal).toFixed(1):'-'}</div><div style="font-size:11px;opacity:.8;">oszczędność (${r.energyUnit||'kWh'})</div></div>
        <div><div style="font-size:30px;font-weight:700;">${r.savedMoneyTotal!=null?Number(r.savedMoneyTotal).toFixed(2):'-'}</div><div style="font-size:11px;opacity:.8;">wartość (${r.currency||'EUR'})</div></div>
        <div><div style="font-size:30px;font-weight:700;">${r.avgReductionReg!=null?(r.avgReductionReg*100).toFixed(1)+'%':'—'}</div><div style="font-size:11px;opacity:.8;">redukcja (regresja)</div></div>
      </div>

      <!-- WSKAŹNIKI E -->
      ${r.eBill!=null?`<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px;text-align:center;">
        <div><div style="font-size:20px;font-weight:700;">${Number(r.eBill).toFixed(3)}</div><div style="font-size:11px;opacity:.7;">E rozlicz. [${r.energyUnit||'kWh'}/HDD] — z WaterAI</div></div>
        <div><div style="font-size:20px;font-weight:700;">${Number(r.eComp||0).toFixed(3)}</div><div style="font-size:11px;opacity:.7;">E porówn. [${r.energyUnit||'kWh'}/HDD] — bez WaterAI</div></div>
      </div>`:''}
    </div>

    <!-- METODA GŁÓWNA TYM -->
    <div style="border:1px solid #B5D4F4;border-radius:10px;overflow:hidden;margin-bottom:16px;">
      <div style="background:#E6F1FB;padding:12px 16px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;">🌡️</span>
        <div>
          <div style="font-size:14px;font-weight:600;color:#0C447C;">Metoda 1 — GŁÓWNA: Korekta do TYM</div>
          <div style="font-size:11px;color:#0C447C;opacity:.8;">Podstawa do rozliczeń i faktur</div>
        </div>
      </div>
      <div style="padding:14px;">
        ${tymAnals.map(a=>{
          const ar=a.results||{}, ai=a.inputParams||{};
          const apct=ar.savedEnergyPct!=null?((ar.savedEnergyPct<1?ar.savedEnergyPct*100:ar.savedEnergyPct)).toFixed(1)+'%':'—';
          return `<div style="padding:10px;background:var(--color-background-secondary);border-radius:8px;margin-bottom:8px;font-size:13px;">
            <div style="font-weight:600;margin-bottom:6px;">${escapeHtml(a.name)}</div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
              <div><span style="font-size:11px;color:var(--color-text-secondary);">Redukcja</span><div style="color:#27500A;font-weight:700;">${apct}</div></div>
              <div><span style="font-size:11px;color:var(--color-text-secondary);">Oszczędność</span><div>${ar.savedEnergy!=null?Number(ar.savedEnergy).toFixed(2)+' '+(ai.energyUnit||'kWh'):'—'}</div></div>
              <div><span style="font-size:11px;color:var(--color-text-secondary);">Wartość</span><div>${ar.savedMoney!=null?Number(ar.savedMoney).toFixed(2)+' '+(ai.currency||'EUR'):'—'}</div></div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <!-- METODA POMOCNICZA REGRESJA -->
    ${regAnals.length?`
    <div style="border:1px solid #FAC775;border-radius:10px;overflow:hidden;margin-bottom:16px;">
      <div style="background:#FAEEDA;padding:12px 16px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;">📈</span>
        <div>
          <div style="font-size:14px;font-weight:600;color:#633806;">Metoda 2 — POMOCNICZA: Regresja liniowa</div>
          <div style="font-size:11px;color:#633806;opacity:.8;">Techniczny dowód działania systemu — nie zastępuje TYM w rozliczeniach</div>
        </div>
      </div>
      <div style="padding:14px;">
        ${regAnals.map(a=>{
          const ar=a.results||{}, ai=a.inputParams||{};
          return `<div style="padding:10px;background:var(--color-background-secondary);border-radius:8px;margin-bottom:8px;font-size:13px;">
            <div style="font-weight:600;margin-bottom:6px;">${escapeHtml(a.name)}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <div><span style="font-size:11px;color:var(--color-text-secondary);">Temp. zasilania PRZED</span><div>${escapeHtml(ai.supplyBefore||'—')}</div></div>
              <div><span style="font-size:11px;color:var(--color-text-secondary);">Temp. zasilania PO</span><div>${escapeHtml(ai.supplyAfter||'—')}</div></div>
              <div><span style="font-size:11px;color:var(--color-text-secondary);">Zużycie PRZED</span><div>${escapeHtml(ai.heatBefore||'—')}</div></div>
              <div><span style="font-size:11px;color:var(--color-text-secondary);">Zużycie PO</span><div>${escapeHtml(ai.heatAfter||'—')}</div></div>
            </div>
            <div style="margin-top:8px;display:flex;gap:12px;">
              <span style="font-size:12px;padding:4px 10px;border-radius:20px;background:#FAC775;color:#633806;">Śr. redukcja temp.: <strong>${ar.avgReductionSupply!=null?Number(ar.avgReductionSupply).toFixed(1)+'%':'—'}</strong></span>
              <span style="font-size:12px;padding:4px 10px;border-radius:20px;background:#FAEEDA;color:#633806;">Śr. redukcja zużycia: <strong>${ar.avgReductionHeat!=null?Number(ar.avgReductionHeat).toFixed(1)+'%':'—'}</strong></span>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`:''}

    <!-- PORÓWNANIE METOD -->
    <div style="border:1px solid var(--color-border-tertiary);border-radius:10px;padding:14px;margin-bottom:16px;background:var(--color-background-secondary);">
      <div style="font-size:12px;font-weight:600;margin-bottom:8px;">⚖️ Porównanie metod</div>
      <div style="font-size:12px;color:var(--color-text-secondary);">
        TYM porównuje CAŁKOWITE zużycie (skor. do tych samych warunków pogodowych) — obejmuje efekty dzienne i sezonowe.<br/>
        Regresja analizuje INTENSYWNOŚĆ grzewczą (zużycie na jednostkę temperatury) — izoluje czysty efekt sterowania.<br/>
        <strong>Różnica nie jest błędem. Obie metody mierzą inny aspekt tej samej oszczędności i wzajemnie się sprawdzają.</strong>
      </div>
    </div>

    ${rep.notes?`<div style="font-size:13px;color:var(--color-text-secondary);padding:10px;background:var(--color-background-secondary);border-radius:8px;margin-bottom:16px;"><strong>Uwagi:</strong> ${escapeHtml(rep.notes)}</div>`:''}

    <div style="display:flex;gap:8px;">
      <button class="small-button icon-btn-del" onclick="if(confirm('Usuń raport?')){const r=JSON.parse(localStorage.getItem('waterai_esco_reports_v1')||'[]').filter(x=>x.id!=='${rep.id}');localStorage.setItem('waterai_esco_reports_v1',JSON.stringify(r));renderESCOReports();}">🗑 Usuń raport</button>
      <div style="font-size:11px;color:var(--color-text-secondary);padding:6px 10px;background:var(--color-background-secondary);border-radius:6px;">🔒 Poufne — przeznaczone dla klienta</div>
    </div>`;
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
          <select onchange="ANAL.energy.unit=this.value;_analRecalcLive()">
            ${['GJ','MWh','kWh','m³'].map(u => `<option ${ANAL.energy.unit === u ? 'selected' : ''}>${u}</option>`).join('')}
          </select></div>
        <div class="anw-f"><label>Waluta</label>
          <select onchange="ANAL.energy.currency=this.value;_analRecalcLive()">
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
          ? `<div class="anw-f"><label>Koszt zmienny całościowy [${_escA(ANAL.energy.currency)}]</label>
              <input type="number" step="0.01" min="0" value="${ANAL.energy.price}" placeholder="np. 1 200,00" oninput="ANAL.energy.price=this.value;_analRecalcLive()"></div>`
          : `<div class="anw-f"><label>Cena energii (za jednostkę)</label>
              <input type="number" step="0.0001" min="0" value="${ANAL.energy.price}" placeholder="np. 0,54" oninput="ANAL.energy.price=this.value;_analRecalcLive()"></div>`}
        <div class="anw-f"><label>Opis (np. uwzględnia koszty przesyłu i pozostałe składowe faktury)</label>
          <input type="text" value="${_escA(ANAL.energy.priceDescription || '')}" placeholder="WaterAI redukuje zużycie, a tym samym koszty przesyłu i inne składowe…" oninput="ANAL.energy.priceDescription=this.value"></div>
      </div>
      ${ANAL.energy.priceMode === 'VARIABLE'
        ? `<div class="anw-note">Koszt zmienny całościowy to <b>łączna kwota</b> oszczędności, wpisywana wprost — nie jest mnożona przez zużycie. Udział WaterAI/ESCO liczony jest od tej kwoty.</div>`
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
    <td>${_escA(r.name)}</td>
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
    ? `Koszt zmienny całościowy (wpisany wprost): <b>${_fmtA(data.savedMoney || 0, 2)} ${cur}</b>${data.energy.priceDescription ? ' — ' + _escA(data.energy.priceDescription) : ''}`
    : `Cena energii: <b>${_fmtA(Number(data.energy.price || 0), 4)} ${cur}/${u}</b>`;
  return `
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

function analOnBasePeriod(v) {
  ANAL.basePeriod = v || null;
  if (v && v !== 'manual') {
    if (typeof v === 'string' && v.indexOf('int:') === 0) {
      const it = window.IntensityBaseModule ? IntensityBaseModule.find(Number(v.slice(4))) : null;
      if (it) _analApplyIntensityBase(it);
    } else {
      const p = window.MeasurementsModule ? MeasurementsModule.find(Number(v)) : null;
      if (p) _analApplyBaseProtocol(p);
    }
  }
  renderAnalysesModule();
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

function analOnBasePeriod(v) {
  ANAL.basePeriod = v || null;
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
        ${r('vFlow', 'Przepływ [m³/h]', '3827')}
        ${r('heatPower', 'Moc cieplna [W]', '46012')}
        ${r('heatConsumption', 'Zużycie ciepła [kWh]', '2826')}
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
        ${clients.map(c => `<option value="${c.id}" ${Number(c.id) === clientId ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
      </select></div>
    <div style="flex:1;min-width:200px;"><label style="${lbl}">Obiekt</label>
      <select onchange="selectedMeasurementObjectId=Number(this.value);renderMeasurementsModule();" style="${inp}">
        ${objsForClient.map(o => `<option value="${o.id}" ${Number(o.id) === Number(selectedMeasurementObjectId) ? 'selected' : ''}>${escapeHtml(o.name || 'Obiekt')}</option>`).join('')}
      </select></div>
  </div>`;
}

function _bpSelectClient(v) {
  const objs = ObjectsModule.findByClient(Number(v));
  selectedMeasurementObjectId = objs[0] ? Number(objs[0].id) : selectedMeasurementObjectId;
  renderMeasurementsModule();
}

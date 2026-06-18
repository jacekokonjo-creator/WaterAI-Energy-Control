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
// MODUŁ ANALIZ
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// MODUŁ ANALIZY — z zakładkami identycznymi do Pomiarów
// ═══════════════════════════════════════════════════════════════════════════════

let activeAnalysisTab = 'tym';
let showAnalysisForm = false;
let editingAnalysisId = null;
let selectedAnalysisObjectId = null;

const MONTHS_ANAL = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
const MONTH_DAYS_ANAL = [31,28,31,30,31,30,31,31,30,31,30,31];

function renderAnalysesModule() {
  const container = document.getElementById('module-content');
  if (!container) return;

  const clients = ClientsModule.getAll();
  const objects = ObjectsModule.getAll();

  if (!clients.length || !objects.length) {
    container.innerHTML = `<div class="reminder-card"><strong>Najpierw dodaj klienta i obiekt</strong><div class="reminder-meta">Analiza musi być przypisana do obiektu.</div></div>`;
    return;
  }

  let selObj = selectedAnalysisObjectId ? ObjectsModule.find(selectedAnalysisObjectId) : objects[0];
  if (!selObj) selObj = objects[0];
  selectedAnalysisObjectId = Number(selObj.id);
  const selClientId = Number(selObj.clientId);
  const objsForClient = ObjectsModule.findByClient(selClientId);

  const objSelector = `
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:18px;">
      <div style="font-size:12px;color:var(--color-text-secondary);">Klient:</div>
      <select onchange="selectedAnalysisObjectId=null;const objs=ObjectsModule.findByClient(Number(this.value));if(objs.length)selectedAnalysisObjectId=objs[0].id;renderAnalysesModule();"
        style="font-size:13px;padding:5px 8px;border:1px solid var(--color-border-tertiary);border-radius:8px;">
        ${clients.map(c=>`<option value="${c.id}" ${Number(c.id)===selClientId?'selected':''}>${escapeHtml(c.name)}</option>`).join('')}
      </select>
      <div style="font-size:12px;color:var(--color-text-secondary);">Obiekt:</div>
      <select onchange="selectedAnalysisObjectId=Number(this.value);renderAnalysesModule();"
        style="font-size:13px;padding:5px 8px;border:1px solid var(--color-border-tertiary);border-radius:8px;">
        ${objsForClient.map(o=>`<option value="${o.id}" ${Number(o.id)===selectedAnalysisObjectId?'selected':''}>${escapeHtml(o.name)}</option>`).join('')}
      </select>
    </div>`;

  const TABS = [
    { key:'tym',        icon:'🌡️', label:'Korekta TYM' },
    { key:'regression', icon:'📈', label:'Regresja liniowa' },
    { key:'occupancy',  icon:'🏨', label:'Korekta obłożenia' },
    { key:'area',       icon:'📐', label:'Korekta powierzchni' },
    { key:'volume',     icon:'⚙️', label:'Korekta intensywności' },
    { key:'schedule',   icon:'📅', label:'Harmonogram' },
    { key:'custom',     icon:'🔬', label:'Własna' },
  ];

  const tabs = `<div class="meas-tabs">
    ${TABS.map(t=>`<button type="button" class="meas-tab ${activeAnalysisTab===t.key?'active':''} ${t.key==='regression'?'meas-tab-reg':''}"
      onclick="activeAnalysisTab='${t.key}';showAnalysisForm=false;editingAnalysisId=null;renderAnalysesModule();">
      ${t.icon} ${t.label}
    </button>`).join('')}
  </div>`;

  const analysesForObj = (AnalysesModule.getAll()||[])
    .filter(a=>Number(a.objectId)===selectedAnalysisObjectId)
    .sort((a,b)=>(b.executedAt||'').localeCompare(a.executedAt||''));

  container.innerHTML = `
  <style>
    .meas-tabs{display:flex;gap:0;margin-bottom:20px;border-bottom:2px solid var(--color-border-tertiary);}
    .meas-tab{padding:10px 20px;font-size:13px;font-weight:500;cursor:pointer;border:none;background:transparent;color:var(--color-text-secondary);border-bottom:3px solid transparent;margin-bottom:-2px;transition:all .15s;}
    .meas-tab.active{color:#0C447C;border-bottom-color:#0C447C;}
    .meas-tab:hover:not(.active){color:var(--color-text-primary);background:var(--color-background-secondary);}
    .meas-tab-reg{color:#633806!important;}.meas-tab-reg.active{color:#633806!important;border-bottom-color:#FAC775!important;}
    .anal-section{margin-bottom:20px;border-radius:10px;overflow:hidden;}
    .anal-body{padding:16px;background:var(--color-background-primary);}
    .anal-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;}
    .anal-grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px;}
    .anal-grid4{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;margin-bottom:12px;}
    .anal-field label{font-size:12px;color:var(--color-text-secondary);display:block;margin-bottom:4px;}
    .anal-field input,.anal-field select{width:100%;box-sizing:border-box;}
    .anal-table{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px;}
    .anal-table th{text-align:left;padding:6px 8px;font-size:11px;font-weight:500;color:var(--color-text-secondary);border-bottom:.5px solid var(--color-border-tertiary);}
    .anal-summary{display:flex;gap:12px;margin-top:12px;flex-wrap:wrap;align-items:center;}
    .anal-result-box{background:linear-gradient(135deg,#0C447C 0%,#1a6bb5 100%);color:#fff;border-radius:12px;padding:20px 24px;margin-bottom:20px;}
  </style>
  ${objSelector}
  ${tabs}
  ${activeAnalysisTab==='tym' ? renderAnalysisTYMContent(selObj, analysesForObj) : ''}
  ${activeAnalysisTab==='regression' ? renderAnalysisRegressionContent(selObj, analysesForObj) : ''}
  ${activeAnalysisTab==='occupancy' ? renderAnalysisPlaceholder('🏨','Korekta obłożenia','#E6F1FB','#B5D4F4','#0C447C') : ''}
  ${activeAnalysisTab==='area' ? renderAnalysisPlaceholder('📐','Korekta powierzchni','#E8F5E9','#A5D6A7','#2E7D32') : ''}
  ${activeAnalysisTab==='volume' ? renderAnalysisPlaceholder('⚙️','Korekta intensywności','#FFF3E0','#FFCC80','#E65100') : ''}
  ${activeAnalysisTab==='schedule' ? renderAnalysisPlaceholder('📅','Harmonogram','#F3E5F5','#CE93D8','#6A1B9A') : ''}
  ${activeAnalysisTab==='custom' ? renderAnalysisPlaceholder('🔬','Własna analiza','#FCE4EC','#F48FB1','#880E4F') : ''}
  `;
}

function renderAnalysisPlaceholder(icon,title,bg,border,color) {
  return `<div style="border:1px solid ${border};border-radius:10px;overflow:hidden;">
    <div style="background:${bg};padding:14px 18px;display:flex;align-items:center;gap:12px;">
      <span style="font-size:22px;">${icon}</span>
      <h3 style="margin:0;font-size:15px;font-weight:600;color:${color};">${title}</h3>
    </div>
    <div style="padding:32px 20px;background:var(--color-background-primary);text-align:center;">
      <div style="font-size:40px;margin-bottom:12px;">🚧</div>
      <p style="font-size:14px;font-weight:500;color:var(--color-text-primary);margin:0 0 8px;">Moduł w przygotowaniu</p>
    </div>
  </div>`;
}

// ── ZAKŁADKA TYM ─────────────────────────────────────────────────────────────

function renderAnalysisTYMContent(obj, allForObj) {
  const tymAnalyses = allForObj.filter(a=>a.analysisType==='TYM');

  const listSection = `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;gap:10px;flex-wrap:wrap;">
    <span style="font-size:13px;color:var(--color-text-secondary);">${tymAnalyses.length} analiz TYM</span>
    <button class="primary-button" onclick="showAnalysisForm=true;editingAnalysisId=null;activeAnalysisTab='tym';renderAnalysesModule();" style="font-size:13px;padding:8px 18px;">+ Nowa analiza TYM</button>
  </div>
  ${tymAnalyses.length===0 ? `<div class="reminder-card"><strong>Brak analiz TYM</strong><div class="reminder-meta">Kliknij „+ Nowa analiza TYM" aby wykonać pierwszą analizę korygującą do Typowego Roku Meteorologicznego.</div></div>` : `
  <div style="overflow-x:auto;border:1px solid var(--color-border-tertiary);border-radius:10px;margin-bottom:24px;">
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead><tr style="background:var(--color-background-secondary);">
        <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Data protokołu</th>
        <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Okres rozliczeniowy</th>
        <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Oszczędność</th>
        <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">% redukcji</th>
        <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Wartość</th>
        <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Status</th>
        <th style="padding:8px 12px;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Akcje</th>
      </tr></thead>
      <tbody>
        ${tymAnalyses.map(a=>{
          const r=a.results||{};
          const pct=r.savedEnergyPct?((r.savedEnergyPct*100)<1?r.savedEnergyPct*100:r.savedEnergyPct).toFixed(1)+'%':'—';
          const st=AnalysesModule.STATUSES[a.status]||{label:a.status,color:'#666'};
          return `<tr style="border-bottom:1px solid var(--color-border-tertiary);">
            <td style="padding:9px 12px;font-size:13px;font-weight:500;">${fmtDate(a.executedAt)}</td>
            <td style="padding:9px 12px;font-size:13px;">${fmtDate(a.inputParams&&a.inputParams.billingFrom)} → ${fmtDate(a.inputParams&&a.inputParams.billingTo)}</td>
            <td style="padding:9px 12px;font-size:13px;">${r.savedEnergy!=null?Number(r.savedEnergy).toFixed(2)+' '+(a.inputParams&&a.inputParams.energyUnit||'kWh'):'—'}</td>
            <td style="padding:9px 12px;font-size:13px;color:${r.savedEnergyPct>0?'#27500A':'#c00'};">${pct}</td>
            <td style="padding:9px 12px;font-size:13px;">${r.savedMoney!=null?Number(r.savedMoney).toFixed(2)+' '+(a.inputParams&&a.inputParams.currency||'EUR'):'—'}</td>
            <td style="padding:9px 12px;"><span style="font-size:11px;font-weight:600;padding:2px 9px;border-radius:20px;background:${st.color}22;color:${st.color};">${st.label}</span></td>
            <td style="padding:9px 12px;white-space:nowrap;">
              <div style="display:flex;gap:4px;align-items:center;">
                <button class="icon-btn" onclick="viewTYMAnalysis(${a.id})" title="Podgląd">👁</button>
                <button class="icon-btn" onclick="editTYMAnalysis(${a.id})" title="Edytuj">✏️</button>
                <button class="icon-btn icon-btn-del" onclick="if(confirm('Usuń analizę?')){AnalysesModule.remove(${a.id});renderAnalysesModule();}" title="Usuń">🗑</button>
              </div>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>`}`;

  if (!showAnalysisForm || activeAnalysisTab!=='tym') return listSection;

  const editing = editingAnalysisId ? AnalysesModule.find(editingAnalysisId) : null;
  const ip = editing&&editing.inputParams ? editing.inputParams : {};
  const prev = tymAnalyses.filter(a=>!editingAnalysisId||Number(a.id)!==Number(editingAnalysisId))
    .sort((a,b)=>(b.executedAt||'').localeCompare(a.executedAt||''))[0];

  // TYM months table
  const tymMonthRows = MONTHS_ANAL.map((mn,i)=>{
    const m=i+1;
    const defDays=MONTH_DAYS_ANAL[i];
    const prevTym=(prev&&prev.inputParams&&prev.inputParams.tymMonths||[]).find(x=>x.month===m)||{};
    const defTemp=ip.tymMonths?(ip.tymMonths[i]||{}).temp:'';
    const defD=ip.tymMonths?(ip.tymMonths[i]||{}).days||defDays:prevTym.days||defDays;
    return `<tr data-m="${m}">
      <td style="padding:5px 8px;color:var(--color-text-secondary);font-size:13px;">${mn}</td>
      <td style="padding:3px 6px;"><input class="tym-temp-anal" name="tymTemp_anal_${m}" type="number" step="0.01" placeholder="°C"
        value="${defTemp||''}" style="width:80px;font-size:13px;padding:3px 6px;" oninput="calcAnalTYM()" /></td>
      <td style="padding:3px 6px;"><input class="tym-days-anal" name="tymDays_anal_${m}" type="number" min="0" max="31"
        value="${defD}" style="width:55px;font-size:13px;padding:3px 6px;" oninput="calcAnalTYM()" /></td>
      <td style="padding:5px 8px;font-size:13px;color:var(--color-text-tertiary);" id="hdd-tym-anal-${m}">—</td>
    </tr>`;
  }).join('');

  // Billing months template (dynamic)
  // Comparison months template (dynamic)
  const form = `
  <div style="border:1px solid var(--color-border-tertiary);border-radius:14px;padding:20px;margin-bottom:20px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <h3 style="margin:0;font-size:16px;color:#0C447C;">${editing?'Edytuj analizę TYM':'Nowa analiza TYM — Korekta klimatyczna'}</h3>
      <button class="small-button" onclick="showAnalysisForm=false;editingAnalysisId=null;renderAnalysesModule();">✕ Zamknij</button>
    </div>
    <form onsubmit="saveTYMAnalysis(this);return false;">

    <!-- DANE PODSTAWOWE -->
    <div class="anal-section" style="border:1px solid #B5D4F4;">
      <div style="background:#E6F1FB;padding:12px 16px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;">📋</span>
        <h3 style="margin:0;font-size:15px;font-weight:500;color:#0C447C;">Dane podstawowe</h3>
      </div>
      <div class="anal-body">
        <div class="anal-grid4">
          <div class="anal-field"><label>Nazwa analizy</label><input name="analName" required placeholder="np. TYM Kwiecień 2026" value="${escapeHtml(editing&&editing.name||'')}"/></div>
          <div class="anal-field"><label>Data protokołu</label><input name="analDate" type="date" required value="${editing&&editing.executedAt||new Date().toISOString().slice(0,10)}"/></div>
          <div class="anal-field">
            <label>Opracował / Energy Analyst</label>
            ${buildAnalystField('analAuthor', editing&&editing.author||'', selObj)}
          </div>
          <div class="anal-field"><label>Status</label><select name="analStatus">
            ${Object.entries(AnalysesModule.STATUSES).map(([k,v])=>`<option value="${k}" ${(editing&&editing.status||'DRAFT')===k?'selected':''}>${v.label}</option>`).join('')}
          </select></div>
        </div>
        <div class="anal-grid4">
          <div class="anal-field"><label>Stacja meteo</label><input name="weatherStation" placeholder="np. Sliač, Słowacja" value="${escapeHtml(ip.weatherStation||obj.weatherStation||'')}"/></div>
          <div class="anal-field"><label>Temperatura bazowa T_b (°C)</label><input name="baseTemp" type="number" step="0.1" value="${ip.baseTemperature||obj.baseTemperature||21}"/></div>
          <div class="anal-field"><label>Jednostka energii</label><select name="energyUnit">
            <option value="kWh" ${(ip.energyUnit||'kWh')==='kWh'?'selected':''}>kWh</option>
            <option value="m³" ${(ip.energyUnit||'')==='m³'?'selected':''}>m³ (gaz)</option>
            <option value="GJ" ${(ip.energyUnit||'')==='GJ'?'selected':''}>GJ</option>
            <option value="MWh" ${(ip.energyUnit||'')==='MWh'?'selected':''}>MWh</option>
          </select></div>
          <div class="anal-field"><label>Waluta</label><select name="currency">
            <option value="EUR" ${(ip.currency||'EUR')==='EUR'?'selected':''}>EUR</option>
            <option value="PLN" ${(ip.currency||'')==='PLN'?'selected':''}>PLN</option>
            <option value="CZK" ${(ip.currency||'')==='CZK'?'selected':''}>CZK</option>
            <option value="SKK" ${(ip.currency||'')==='SKK'?'selected':''}>SKK</option>
          </select></div>
        </div>
        <div class="anal-grid4">
          <div class="anal-field"><label>Cena energii (za jednostkę)</label><input name="energyPrice" type="number" step="0.001" min="0" value="${ip.energyPrice||obj.energyPrice||''}" placeholder="np. 0.191"/></div>
          <div class="anal-field"><label>Udział ESCO (%)</label><input name="escoShare" type="number" min="0" max="100" value="${ip.escoShare||obj.escoShare||50}"/></div>
          <div class="anal-field"></div><div class="anal-field"></div>
        </div>
      </div>
    </div>

    <!-- OKRES ROZLICZENIOWY -->
    <div class="anal-section" style="border:1px solid #B5D4F4;">
      <div style="background:#E6F1FB;padding:12px 16px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;color:#185FA5;">📅</span>
        <h3 style="margin:0;font-size:15px;font-weight:500;color:#0C447C;">Okres rozliczeniowy</h3>
        <span style="font-size:11px;padding:2px 8px;border-radius:20px;background:#B5D4F4;color:#0C447C;">bieżący</span>
      </div>
      <div class="anal-body">
        <div class="anal-grid4">
          <div class="anal-field"><label>Data od</label><input name="billFrom" type="date" required value="${ip.billingFrom||''}" oninput="buildAnalPeriodTable('bill')"/></div>
          <div class="anal-field"><label>Data do</label><input name="billTo" type="date" required value="${ip.billingTo||''}" oninput="buildAnalPeriodTable('bill')"/></div>
          <div class="anal-field"><label>Zużycie (odczyt)</label><input name="billConsumption" type="number" step="0.001" required value="${ip.billingConsumption||''}" placeholder="z licznika"/></div>
          <div class="anal-field"><label>Zużycie CO (po odjęciu CWU)</label><input name="billCO" type="number" step="0.001" value="${ip.billingCO||''}" placeholder="jeśli podzielone"/></div>
        </div>
        <table class="anal-table">
          <thead><tr>
            <th style="width:28%;">Miesiąc</th>
            <th style="width:20%;">Śr. temp. (°C)</th>
            <th style="width:16%;">Dni</th>
            <th style="width:36%;">HDD rzecz.</th>
          </tr></thead>
          <tbody id="bill-months-anal"><tr><td colspan="4" style="padding:12px;text-align:center;color:var(--color-text-tertiary);font-size:13px;">Wybierz daty</td></tr></tbody>
        </table>
        <div class="anal-summary">
          <span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:500;padding:4px 12px;border-radius:20px;background:#B5D4F4;color:#0C447C;">🔥 HDD rzecz.: <strong id="bill-hdd-anal">—</strong></span>
          <span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:500;padding:4px 12px;border-radius:20px;background:#E6F1FB;color:#0C447C;">📅 Łącznie: <strong id="bill-days-anal">—</strong> dni</span>
        </div>
      </div>
    </div>

    <!-- OKRES PORÓWNAWCZY -->
    <div class="anal-section" style="border:1px solid #C0DD97;">
      <div style="background:#EAF3DE;padding:12px 16px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;color:#3B6D11;">📊</span>
        <h3 style="margin:0;font-size:15px;font-weight:500;color:#27500A;">Okres porównawczy</h3>
        <span style="font-size:11px;padding:2px 8px;border-radius:20px;background:#C0DD97;color:#27500A;">bazowy (przed WaterAI)</span>
        ${prev?`<button type="button" onclick="copyAnalPrevPeriod('comp')" style="margin-left:auto;font-size:12px;padding:4px 12px;border:1px solid #27500A;border-radius:6px;background:white;color:#27500A;cursor:pointer;">📋 Kopiuj z poprzedniej</button>`:''}
      </div>
      <div class="anal-body">
        <div class="anal-grid4">
          <div class="anal-field"><label>Data od</label><input name="compFrom" type="date" required value="${ip.compFrom||''}" oninput="buildAnalPeriodTable('comp')"/></div>
          <div class="anal-field"><label>Data do</label><input name="compTo" type="date" required value="${ip.compTo||''}" oninput="buildAnalPeriodTable('comp')"/></div>
          <div class="anal-field"><label>Zużycie (odczyt)</label><input name="compConsumption" type="number" step="0.001" required value="${ip.compConsumption||''}" placeholder="z licznika"/></div>
          <div class="anal-field"><label>Zużycie CO (po odjęciu CWU)</label><input name="compCO" type="number" step="0.001" value="${ip.compCO||''}" placeholder="jeśli podzielone"/></div>
        </div>
        <table class="anal-table">
          <thead><tr>
            <th style="width:28%;">Miesiąc</th>
            <th style="width:20%;">Śr. temp. (°C)</th>
            <th style="width:16%;">Dni</th>
            <th style="width:36%;">HDD rzecz.</th>
          </tr></thead>
          <tbody id="comp-months-anal"><tr><td colspan="4" style="padding:12px;text-align:center;color:var(--color-text-tertiary);font-size:13px;">Wybierz daty</td></tr></tbody>
        </table>
        <div class="anal-summary">
          <span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:500;padding:4px 12px;border-radius:20px;background:#C0DD97;color:#27500A;">🔥 HDD rzecz.: <strong id="comp-hdd-anal">—</strong></span>
          <span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:500;padding:4px 12px;border-radius:20px;background:#EAF3DE;color:#27500A;">📅 Łącznie: <strong id="comp-days-anal">—</strong> dni</span>
        </div>
      </div>
    </div>

    <!-- TYM -->
    <div class="anal-section" style="border:1px solid #FAC775;">
      <div style="background:#FAEEDA;padding:12px 16px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;color:#854F0B;">❄️</span>
        <h3 style="margin:0;font-size:15px;font-weight:500;color:#633806;">Typowy Rok Meteorologiczny (TYM)</h3>
        <span style="font-size:11px;padding:2px 8px;border-radius:20px;background:#FAC775;color:#633806;">długoletnie normy</span>
        ${prev?`<button type="button" onclick="copyAnalPrevPeriod('tym')" style="margin-left:auto;font-size:12px;padding:4px 12px;border:1px solid #633806;border-radius:6px;background:white;color:#633806;cursor:pointer;">📋 Kopiuj TYM z poprzedniej</button>`:''}
      </div>
      <div class="anal-body">
        <div class="anal-grid4">
          <div class="anal-field"><label>Okres TYM od (rok)</label><input name="tymYearFrom" placeholder="np. 1991" value="${ip.tymYearFrom||''}"/></div>
          <div class="anal-field"><label>Okres TYM do (rok)</label><input name="tymYearTo" placeholder="np. 2020" value="${ip.tymYearTo||''}"/></div>
          <div class="anal-field" style="grid-column:span 2;"><label>Źródło danych TYM</label><input name="tymSource" value="${ip.tymSource||obj.weatherSource||'WeatherOnline / Robot Klimatu'}"/></div>
        </div>
        <p style="font-size:11px;color:var(--color-text-tertiary);margin:0 0 8px;">Wpisz średnie temperatury miesięczne z WeatherOnline / Robot Klimatu.</p>
        <table class="anal-table">
          <thead><tr>
            <th style="width:28%;">Miesiąc</th>
            <th style="width:20%;">Śr. temp. TYM (°C)</th>
            <th style="width:16%;">Dni</th>
            <th style="width:36%;">HDD TYM</th>
          </tr></thead>
          <tbody>${tymMonthRows}</tbody>
        </table>
        <div class="anal-summary">
          <span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:500;padding:4px 12px;border-radius:20px;background:#FAC775;color:#633806;">🔥 HDD TYM: <strong id="hdd-tym-anal-sum">—</strong></span>
          <span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:500;padding:4px 12px;border-radius:20px;background:#FAEEDA;color:#633806;">📅 Łącznie: <strong id="days-tym-anal-sum">—</strong> dni</span>
        </div>
      </div>
    </div>

    <!-- WYNIKI (live) -->
    <div id="anal-tym-results" style="display:none;" class="anal-result-box">
      <div style="font-size:11px;font-weight:600;letter-spacing:.5px;opacity:.7;margin-bottom:12px;">WYNIK ANALIZY TYM</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;text-align:center;">
        <div><div style="font-size:28px;font-weight:700;" id="res-pct">—</div><div style="font-size:11px;opacity:.8;">% redukcji zużycia</div></div>
        <div><div style="font-size:28px;font-weight:700;" id="res-energy">—</div><div style="font-size:11px;opacity:.8;">oszczędność energii</div></div>
        <div><div style="font-size:28px;font-weight:700;" id="res-money">—</div><div style="font-size:11px;opacity:.8;">wartość oszczędności</div></div>
        <div><div style="font-size:28px;font-weight:700;" id="res-e-index">—</div><div style="font-size:11px;opacity:.8;">spadek wsk. E</div></div>
      </div>
      <div style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:12px;opacity:.9;">
        <div>Wskaźnik E rozlicz.: <strong id="res-e-bill">—</strong></div>
        <div>Wskaźnik E porówn.: <strong id="res-e-comp">—</strong></div>
        <div>k rozlicz.: <strong id="res-k-bill">—</strong></div>
        <div>k porówn.: <strong id="res-k-comp">—</strong></div>
      </div>
    </div>

    <div class="anal-field" style="margin-bottom:16px;">
      <label>Uwagi</label>
      <input name="analNotes" placeholder="opcjonalne uwagi do analizy" value="${escapeHtml(editing&&editing.comments||'')}"/>
    </div>

    <div style="display:flex;gap:10px;align-items:center;">
      <button class="primary-button" type="submit">${editing?'Zapisz zmiany':'Zapisz analizę TYM'}</button>
      <button class="small-button" type="button" onclick="showAnalysisForm=false;editingAnalysisId=null;renderAnalysesModule();">Anuluj</button>
      <button class="small-button" type="button" onclick="calcAnalTYM()" style="margin-left:auto;">🔄 Przelicz</button>
    </div>

    </form>
  </div>`;

  return listSection + form;
}

// ── ZAKŁADKA REGRESJA LINIOWA ─────────────────────────────────────────────────

function renderAnalysisRegressionContent(obj, allForObj) {
  const regAnalyses = allForObj.filter(a=>a.analysisType==='REGRESSION');

  const listSection = `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;gap:10px;flex-wrap:wrap;">
    <span style="font-size:13px;color:var(--color-text-secondary);">${regAnalyses.length} analiz regresji</span>
    <button class="primary-button" onclick="showAnalysisForm=true;editingAnalysisId=null;activeAnalysisTab='regression';renderAnalysesModule();" style="font-size:13px;padding:8px 18px;">+ Nowa analiza regresji</button>
  </div>
  ${regAnalyses.length===0 ? `<div class="reminder-card"><strong>Brak analiz regresji liniowej</strong><div class="reminder-meta">Kliknij „+ Nowa analiza regresji" aby dodać analizę techniczną PRZED/PO wdrożeniu WaterAI.</div></div>` : `
  <div style="overflow-x:auto;border:1px solid var(--color-border-tertiary);border-radius:10px;margin-bottom:24px;">
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead><tr style="background:var(--color-background-secondary);">
        <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Data</th>
        <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Nazwa</th>
        <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Temp. zasil. PRZED</th>
        <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Temp. zasil. PO</th>
        <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Zużycie PRZED</th>
        <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Zużycie PO</th>
        <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Redukcja śr.</th>
        <th style="padding:8px 12px;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Akcje</th>
      </tr></thead>
      <tbody>
        ${regAnalyses.map(a=>{
          const r=a.results||{};
          const ip2=a.inputParams||{};
          return `<tr style="border-bottom:1px solid var(--color-border-tertiary);">
            <td style="padding:9px 12px;font-size:13px;">${fmtDate(a.executedAt)}</td>
            <td style="padding:9px 12px;font-size:13px;font-weight:500;">${escapeHtml(a.name)}</td>
            <td style="padding:9px 12px;font-size:12px;color:var(--color-text-secondary);">${ip2.supplyBefore||'—'}</td>
            <td style="padding:9px 12px;font-size:12px;color:var(--color-text-secondary);">${ip2.supplyAfter||'—'}</td>
            <td style="padding:9px 12px;font-size:12px;color:var(--color-text-secondary);">${ip2.heatBefore||'—'}</td>
            <td style="padding:9px 12px;font-size:12px;color:var(--color-text-secondary);">${ip2.heatAfter||'—'}</td>
            <td style="padding:9px 12px;font-size:13px;color:#27500A;">${r.avgReductionHeat!=null?Number(r.avgReductionHeat).toFixed(1)+'%':'—'}</td>
            <td style="padding:9px 12px;white-space:nowrap;">
              <div style="display:flex;gap:4px;align-items:center;">
                <button class="icon-btn" onclick="viewRegAnalysis(${a.id})" title="Podgląd">👁</button>
                <button class="icon-btn icon-btn-del" onclick="if(confirm('Usuń analizę?')){AnalysesModule.remove(${a.id});renderAnalysesModule();}" title="Usuń">🗑</button>
              </div>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>`}`;

  if (!showAnalysisForm || activeAnalysisTab!=='regression') return listSection;

  const editing = editingAnalysisId ? AnalysesModule.find(editingAnalysisId) : null;
  const ip = editing&&editing.inputParams ? editing.inputParams : {};

  // Regression data table rows (30 rows temp range -15 to 19 or from file)
  const regRows = Array.from({length:35},(_,i)=>i-15).map(t=>`<tr data-t="${t}">
    <td style="padding:3px 6px;font-size:13px;text-align:center;">${t}</td>
    <td style="padding:2px 4px;"><input class="reg-supply-before" data-t="${t}" type="number" step="0.01" style="width:75px;font-size:12px;padding:2px 5px;"/></td>
    <td style="padding:2px 4px;"><input class="reg-supply-after" data-t="${t}" type="number" step="0.01" style="width:75px;font-size:12px;padding:2px 5px;"/></td>
    <td style="padding:3px 6px;font-size:12px;text-align:center;color:var(--color-text-tertiary);" class="reg-supply-diff">—</td>
    <td style="padding:2px 4px;"><input class="reg-heat-before" data-t="${t}" type="number" step="0.001" style="width:75px;font-size:12px;padding:2px 5px;"/></td>
    <td style="padding:2px 4px;"><input class="reg-heat-after" data-t="${t}" type="number" step="0.001" style="width:75px;font-size:12px;padding:2px 5px;"/></td>
    <td style="padding:3px 6px;font-size:12px;text-align:center;color:var(--color-text-tertiary);" class="reg-heat-diff">—</td>
  </tr>`).join('');

  const regForm = `
  <div style="border:1px solid var(--color-border-tertiary);border-radius:14px;padding:20px;margin-bottom:20px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <h3 style="margin:0;font-size:16px;color:#633806;">Nowa analiza — Regresja liniowa</h3>
      <button class="small-button" onclick="showAnalysisForm=false;editingAnalysisId=null;renderAnalysesModule();">✕ Zamknij</button>
    </div>
    <form onsubmit="saveRegAnalysis(this);return false;">

    <!-- DANE PODSTAWOWE -->
    <div class="anal-section" style="border:1px solid #FAC775;">
      <div style="background:#FAEEDA;padding:12px 16px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;">📈</span>
        <h3 style="margin:0;font-size:15px;font-weight:500;color:#633806;">Dane podstawowe</h3>
      </div>
      <div class="anal-body">
        <div class="anal-grid4">
          <div class="anal-field"><label>Nazwa analizy</label><input name="regName" required placeholder="np. Regresja PRI LIPE 04.2026" value="${escapeHtml(editing&&editing.name||'')}"/></div>
          <div class="anal-field"><label>Data analizy</label><input name="regDate" type="date" value="${editing&&editing.executedAt||new Date().toISOString().slice(0,10)}"/></div>
          <div class="anal-field">
            <label>Opracował / Energy Analyst</label>
            ${buildAnalystField('regAuthor', editing&&editing.author||'', selObj)}
          </div>
          <div class="anal-field"><label>Status</label><select name="regStatus">
            ${Object.entries(AnalysesModule.STATUSES).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('')}
          </select></div>
        </div>
      </div>
    </div>

    <!-- RÓWNANIA REGRESJI -->
    <div class="anal-section" style="border:1px solid #FAC775;">
      <div style="background:#FAEEDA;padding:12px 16px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;">📐</span>
        <h3 style="margin:0;font-size:15px;font-weight:500;color:#633806;">Równania regresji y = ax + b</h3>
      </div>
      <div class="anal-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          <div>
            <div style="font-size:12px;font-weight:600;color:#633806;margin-bottom:10px;padding:6px 10px;background:#FAEEDA;border-radius:6px;">Temperatura zasilania (°C)</div>
            <div class="anal-grid2">
              <div class="anal-field"><label>PRZED: a (nachylenie)</label><input name="supplyBefore_a" type="number" step="0.0001" placeholder="np. -0.3094" oninput="calcRegTable()"/></div>
              <div class="anal-field"><label>PRZED: b (wyraz wolny)</label><input name="supplyBefore_b" type="number" step="0.001" placeholder="np. 53.523" oninput="calcRegTable()"/></div>
              <div class="anal-field"><label>PO: a (nachylenie)</label><input name="supplyAfter_a" type="number" step="0.0001" placeholder="np. -0.3455" oninput="calcRegTable()"/></div>
              <div class="anal-field"><label>PO: b (wyraz wolny)</label><input name="supplyAfter_b" type="number" step="0.001" placeholder="np. 47.474" oninput="calcRegTable()"/></div>
            </div>
            <div style="font-size:12px;color:#633806;margin-top:6px;">
              PRZED: y = <span id="reg-supply-before-eq">—</span> &nbsp;|&nbsp; PO: y = <span id="reg-supply-after-eq">—</span>
            </div>
          </div>
          <div>
            <div style="font-size:12px;font-weight:600;color:#633806;margin-bottom:10px;padding:6px 10px;background:#FAEEDA;border-radius:6px;">Zużycie ciepła (kWh/GJ)</div>
            <div class="anal-grid2">
              <div class="anal-field"><label>PRZED: a</label><input name="heatBefore_a" type="number" step="0.0001" placeholder="np. -0.1308" oninput="calcRegTable()"/></div>
              <div class="anal-field"><label>PRZED: b</label><input name="heatBefore_b" type="number" step="0.001" placeholder="np. 6.335" oninput="calcRegTable()"/></div>
              <div class="anal-field"><label>PO: a</label><input name="heatAfter_a" type="number" step="0.0001" placeholder="np. 0.1482" oninput="calcRegTable()"/></div>
              <div class="anal-field"><label>PO: b</label><input name="heatAfter_b" type="number" step="0.001" placeholder="np. 4.8405" oninput="calcRegTable()"/></div>
            </div>
            <div style="font-size:12px;color:#633806;margin-top:6px;">
              PRZED: y = <span id="reg-heat-before-eq">—</span> &nbsp;|&nbsp; PO: y = <span id="reg-heat-after-eq">—</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TABELA DANYCH REGRESJI -->
    <div class="anal-section" style="border:1px solid #FAC775;">
      <div style="background:#FAEEDA;padding:12px 16px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;">📊</span>
        <h3 style="margin:0;font-size:15px;font-weight:500;color:#633806;">Tabela danych (zakres temp. -15°C do +19°C)</h3>
        <button type="button" onclick="calcRegTable()" style="margin-left:auto;font-size:12px;padding:4px 12px;border:1px solid #633806;border-radius:6px;background:white;color:#633806;cursor:pointer;">🔄 Przelicz z równań</button>
      </div>
      <div class="anal-body" style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead><tr style="background:var(--color-background-secondary);">
            <th style="padding:5px 8px;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);text-align:center;">T zewn. (°C)</th>
            <th style="padding:5px 8px;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);background:#E6F1FB;">T zasil. PRZED</th>
            <th style="padding:5px 8px;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);background:#EAF3DE;">T zasil. PO</th>
            <th style="padding:5px 8px;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Redukcja (%)</th>
            <th style="padding:5px 8px;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);background:#E6F1FB;">Zużycie PRZED</th>
            <th style="padding:5px 8px;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);background:#EAF3DE;">Zużycie PO</th>
            <th style="padding:5px 8px;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Redukcja (%)</th>
          </tr></thead>
          <tbody id="reg-data-table">${regRows}</tbody>
        </table>
      </div>
      <div class="anal-body" style="padding-top:0;">
        <div id="reg-avg-results" style="display:flex;gap:16px;flex-wrap:wrap;margin-top:12px;">
          <span style="font-size:13px;padding:6px 14px;border-radius:20px;background:#FAC775;color:#633806;">🌡️ Śr. redukcja temp. zasil.: <strong id="reg-avg-supply">—</strong></span>
          <span style="font-size:13px;padding:6px 14px;border-radius:20px;background:#FAEEDA;color:#633806;">⚡ Śr. redukcja zużycia: <strong id="reg-avg-heat">—</strong></span>
        </div>
      </div>
    </div>

    <!-- NOTATKI -->
    <div class="anal-field" style="margin-bottom:16px;">
      <label>Uwagi / interpretacja</label>
      <input name="regNotes" placeholder="np. Metoda pomocnicza — potwierdza wyniki TYM od strony technicznej" value="${escapeHtml(editing&&editing.comments||'')}"/>
    </div>

    <div style="display:flex;gap:10px;">
      <button class="primary-button" type="submit">Zapisz analizę regresji</button>
      <button class="small-button" type="button" onclick="showAnalysisForm=false;editingAnalysisId=null;renderAnalysesModule();">Anuluj</button>
    </div>
    </form>
  </div>`;

  return listSection + regForm;
}

// ── OBLICZENIA TYM ─────────────────────────────────────────────────────────────

function buildAnalPeriodTable(prefix) {
  const fromEl = document.querySelector(`[name="${prefix==='bill'?'billFrom':'compFrom'}"]`);
  const toEl   = document.querySelector(`[name="${prefix==='bill'?'billTo':'compTo'}"]`);
  const tbody  = document.getElementById(`${prefix}-months-anal`);
  if (!tbody) return;
  const startDate = fromEl ? fromEl.value : '';
  const endDate   = toEl   ? toEl.value   : '';
  const months    = typeof buildMonthsFromDates === 'function' ? buildMonthsFromDates(startDate, endDate) : [];
  if (!months.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="padding:12px;text-align:center;color:var(--color-text-tertiary);font-size:13px;">Wybierz daty</td></tr>';
    return;
  }
  const baseTempEl = document.querySelector('[name="baseTemp"]');
  const baseTemp = baseTempEl ? Number(baseTempEl.value||21) : 21;
  const existing = {};
  tbody.querySelectorAll('tr[data-key]').forEach(tr=>{
    const k=tr.dataset.key;
    const t=tr.querySelector('input.anal-month-temp');
    const d=tr.querySelector('input.anal-month-days');
    if(t) existing[k]={temp:t.value, days:d?d.value:''};
  });
  tbody.innerHTML = months.map(m=>{
    const key=`${m.year}-${m.month}`;
    const prev2=existing[key]||{};
    const tv=prev2.temp!==undefined?prev2.temp:'';
    const dv=prev2.days!==undefined?prev2.days:m.days;
    const hdd=tv!==''?Math.max(0,baseTemp-Number(tv))*Number(dv):null;
    return `<tr data-key="${key}">
      <td style="padding:5px 8px;font-size:13px;color:var(--color-text-secondary);">${m.monthName}</td>
      <td style="padding:3px 6px;"><input class="anal-month-temp" type="number" step="0.01" placeholder="°C" value="${tv}"
        style="width:80px;font-size:13px;padding:3px 6px;" oninput="calcAnalTYM()"/></td>
      <td style="padding:3px 6px;"><input class="anal-month-days" type="number" min="0" max="31" value="${dv}"
        style="width:55px;font-size:13px;padding:3px 6px;" oninput="calcAnalTYM()"/></td>
      <td style="padding:5px 8px;font-size:13px;color:var(--color-text-tertiary);" class="anal-hdd-cell">
        ${hdd!==null?hdd.toFixed(1):'—'}</td>
    </tr>`;
  }).join('');
  refreshAnalPeriodHDD(prefix);
}

function refreshAnalPeriodHDD(prefix) {
  const tbody = document.getElementById(`${prefix}-months-anal`);
  const hddEl = document.getElementById(`${prefix}-hdd-anal`);
  const daysEl= document.getElementById(`${prefix}-days-anal`);
  if (!tbody) return;
  const baseTempEl = document.querySelector('[name="baseTemp"]');
  const baseTemp = baseTempEl ? Number(baseTempEl.value||21) : 21;
  let totalHDD=0, totalDays=0;
  tbody.querySelectorAll('tr[data-key]').forEach(tr=>{
    const t=tr.querySelector('input.anal-month-temp');
    const d=tr.querySelector('input.anal-month-days');
    const cell=tr.querySelector('.anal-hdd-cell');
    if (!t||t.value==='') { if(cell)cell.textContent='—'; return; }
    const days=Number(d?d.value:0);
    const hdd=Math.max(0,baseTemp-Number(t.value))*days;
    totalHDD+=hdd; totalDays+=days;
    if(cell)cell.textContent=hdd.toFixed(1);
  });
  if(hddEl)hddEl.textContent=totalHDD.toFixed(2);
  if(daysEl)daysEl.textContent=totalDays;
}

function calcAnalTYM() {
  refreshAnalPeriodHDD('bill');
  refreshAnalPeriodHDD('comp');
  // TYM sum
  const baseTempEl=document.querySelector('[name="baseTemp"]');
  const baseTemp=baseTempEl?Number(baseTempEl.value||21):21;
  let hddTym=0,daysTym=0;
  for(let m=1;m<=12;m++){
    const t=document.querySelector(`[name="tymTemp_anal_${m}"]`);
    const d=document.querySelector(`[name="tymDays_anal_${m}"]`);
    const cell=document.getElementById(`hdd-tym-anal-${m}`);
    if(!t||t.value===''){if(cell)cell.textContent='—';continue;}
    const days=Number(d?d.value:0);
    const hdd=Math.max(0,baseTemp-Number(t.value))*days;
    hddTym+=hdd; daysTym+=days;
    if(cell)cell.textContent=hdd.toFixed(1);
  }
  const hddSumEl=document.getElementById('hdd-tym-anal-sum');
  const daysSumEl=document.getElementById('days-tym-anal-sum');
  if(hddSumEl)hddSumEl.textContent=hddTym.toFixed(2);
  if(daysSumEl)daysSumEl.textContent=daysTym;

  // Calculate results
  const billTbody=document.getElementById('bill-months-anal');
  const compTbody=document.getElementById('comp-months-anal');
  if(!billTbody||!compTbody) return;
  let hddBill=0, hddComp=0;
  billTbody.querySelectorAll('tr[data-key]').forEach(tr=>{
    const t=tr.querySelector('input.anal-month-temp');
    const d=tr.querySelector('input.anal-month-days');
    if(!t||t.value==='') return;
    hddBill+=Math.max(0,baseTemp-Number(t.value))*Number(d?d.value:0);
  });
  compTbody.querySelectorAll('tr[data-key]').forEach(tr=>{
    const t=tr.querySelector('input.anal-month-temp');
    const d=tr.querySelector('input.anal-month-days');
    if(!t||t.value==='') return;
    hddComp+=Math.max(0,baseTemp-Number(t.value))*Number(d?d.value:0);
  });

  const billCOEl=document.querySelector('[name="billCO"]');
  const compCOEl=document.querySelector('[name="compCO"]');
  const billConsEl=document.querySelector('[name="billConsumption"]');
  const compConsEl=document.querySelector('[name="compConsumption"]');
  const priceEl=document.querySelector('[name="energyPrice"]');
  const unitEl=document.querySelector('[name="energyUnit"]');

  const billCons=Number((billCOEl&&billCOEl.value)?billCOEl.value:(billConsEl?billConsEl.value:0));
  const compCons=Number((compCOEl&&compCOEl.value)?compCOEl.value:(compConsEl?compConsEl.value:0));
  const price=Number(priceEl?priceEl.value:0);
  const unit=unitEl?unitEl.value:'kWh';

  if(!hddTym||!hddBill||!hddComp||!billCons||!compCons) { document.getElementById('anal-tym-results')&&(document.getElementById('anal-tym-results').style.display='none'); return; }

  // Wskaźnik E = CO / HDD_TYM
  // Dla okresu rozlicz: HDD_TYM proporcjonalne do liczby miesięcy rozlicz
  const billDaysEl=document.getElementById('bill-days-anal');
  const compDaysEl=document.getElementById('comp-days-anal');
  const billDays=billDaysEl?Number(billDaysEl.textContent||0):0;
  const compDays=compDaysEl?Number(compDaysEl.textContent||0):0;
  const totalDays2=billDays+compDays||365;
  const hddTymBill=hddTym*(billDays/totalDays2||0.5);
  const hddTymComp=hddTym*(compDays/totalDays2||0.5);

  const eBill = hddTymBill>0 ? billCons/hddTymBill : 0;
  const eComp = hddTymComp>0 ? compCons/hddTymComp : 0;

  const coBezTech = eComp * hddTymBill;
  const savedEnergy = coBezTech - billCons;
  const savedPct = coBezTech>0 ? savedEnergy/coBezTech : 0;
  const savedMoney = savedEnergy * price;
  const kBill = hddBill>0 ? hddTymBill/hddBill : 0;
  const kComp = hddComp>0 ? hddTymComp/hddComp : 0;
  const eChange = eComp>0 ? (eBill-eComp)/eComp : 0;

  const resDiv=document.getElementById('anal-tym-results');
  if(resDiv){
    resDiv.style.display='block';
    document.getElementById('res-pct').textContent=(savedPct*100).toFixed(1)+'%';
    document.getElementById('res-energy').textContent=savedEnergy.toFixed(2)+' '+unit;
    document.getElementById('res-money').textContent=price>0?savedMoney.toFixed(2)+' '+(document.querySelector('[name="currency"]')?document.querySelector('[name="currency"]').value:'EUR'):'—';
    document.getElementById('res-e-index').textContent=(eChange*100).toFixed(1)+'%';
    document.getElementById('res-e-bill').textContent=eBill.toFixed(3)+' '+unit+'/HDD';
    document.getElementById('res-e-comp').textContent=eComp.toFixed(3)+' '+unit+'/HDD';
    document.getElementById('res-k-bill').textContent=kBill.toFixed(4);
    document.getElementById('res-k-comp').textContent=kComp.toFixed(4);
  }
  // Store for form save
  window._analTYMResults = { savedEnergy, savedEnergyPct:savedPct, savedMoney, eBill, eComp, kBill, kComp, eChange, hddTymBill, hddTymComp };
}

function calcRegTable() {
  const sba=Number(document.querySelector('[name="supplyBefore_a"]')?.value||0);
  const sbb=Number(document.querySelector('[name="supplyBefore_b"]')?.value||0);
  const saa=Number(document.querySelector('[name="supplyAfter_a"]')?.value||0);
  const sab=Number(document.querySelector('[name="supplyAfter_b"]')?.value||0);
  const hba=Number(document.querySelector('[name="heatBefore_a"]')?.value||0);
  const hbb=Number(document.querySelector('[name="heatBefore_b"]')?.value||0);
  const haa=Number(document.querySelector('[name="heatAfter_a"]')?.value||0);
  const hab=Number(document.querySelector('[name="heatAfter_b"]')?.value||0);

  if(document.getElementById('reg-supply-before-eq')) document.getElementById('reg-supply-before-eq').textContent=`${sba>=0?'+':''}${sba}x + ${sbb}`;
  if(document.getElementById('reg-supply-after-eq')) document.getElementById('reg-supply-after-eq').textContent=`${saa>=0?'+':''}${saa}x + ${sab}`;
  if(document.getElementById('reg-heat-before-eq')) document.getElementById('reg-heat-before-eq').textContent=`${hba>=0?'+':''}${hba}x + ${hbb}`;
  if(document.getElementById('reg-heat-after-eq')) document.getElementById('reg-heat-after-eq').textContent=`${haa>=0?'+':''}${haa}x + ${hab}`;

  let totalSupplyDiff=0, totalHeatDiff=0, count=0;
  document.querySelectorAll('#reg-data-table tr').forEach(tr=>{
    const t=Number(tr.dataset.t);
    const sb=sba*t+sbb, sa=saa*t+sab;
    const hb=hba*t+hbb, ha=haa*t+hab;
    const supplyBefore=tr.querySelector('.reg-supply-before');
    const supplyAfter=tr.querySelector('.reg-supply-after');
    const heatBefore=tr.querySelector('.reg-heat-before');
    const heatAfter=tr.querySelector('.reg-heat-after');
    const supplyDiff=tr.querySelector('.reg-supply-diff');
    const heatDiff=tr.querySelector('.reg-heat-diff');
    if(sba!==0||sbb!==0) { if(supplyBefore&&!supplyBefore.value) supplyBefore.value=sb.toFixed(3); if(supplyAfter&&!supplyAfter.value) supplyAfter.value=sa.toFixed(3); }
    if(hba!==0||hbb!==0) { if(heatBefore&&!heatBefore.value) heatBefore.value=hb.toFixed(3); if(heatAfter&&!heatAfter.value) heatAfter.value=ha.toFixed(3); }
    const sbv=Number(supplyBefore?.value||0), sav=Number(supplyAfter?.value||0);
    const hbv=Number(heatBefore?.value||0), hav=Number(heatAfter?.value||0);
    if(sbv>0&&sav>=0){const d=(sav-sbv)/sbv*100;if(supplyDiff)supplyDiff.textContent=d.toFixed(2)+'%';totalSupplyDiff+=d;count++;}
    if(hbv>0&&hav>=0){const d=(hav-hbv)/hbv*100;if(heatDiff)heatDiff.textContent=d.toFixed(2)+'%';totalHeatDiff+=d;}
  });
  if(count>0){
    const avgS=totalSupplyDiff/count, avgH=totalHeatDiff/count;
    if(document.getElementById('reg-avg-supply'))document.getElementById('reg-avg-supply').textContent=avgS.toFixed(2)+'%';
    if(document.getElementById('reg-avg-heat'))document.getElementById('reg-avg-heat').textContent=avgH.toFixed(2)+'%';
    window._regResults={avgReductionSupply:avgS, avgReductionHeat:avgH};
  }
}

function saveTYMAnalysis(form) {
  const r = window._analTYMResults || {};
  const billMonths=[], compMonths=[];
  document.querySelectorAll('#bill-months-anal tr[data-key]').forEach(tr=>{
    const[y,m]=tr.dataset.key.split('-').map(Number);
    const t=tr.querySelector('input.anal-month-temp');
    const d=tr.querySelector('input.anal-month-days');
    billMonths.push({year:y,month:m,temperature:t&&t.value!==''?Number(t.value):null,days:Number(d?d.value:0)});
  });
  document.querySelectorAll('#comp-months-anal tr[data-key]').forEach(tr=>{
    const[y,m]=tr.dataset.key.split('-').map(Number);
    const t=tr.querySelector('input.anal-month-temp');
    const d=tr.querySelector('input.anal-month-days');
    compMonths.push({year:y,month:m,temperature:t&&t.value!==''?Number(t.value):null,days:Number(d?d.value:0)});
  });
  const tymMonths=[];
  for(let m=1;m<=12;m++){
    const t=document.querySelector(`[name="tymTemp_anal_${m}"]`);
    const d=document.querySelector(`[name="tymDays_anal_${m}"]`);
    tymMonths.push({month:m,temp:t&&t.value!==''?Number(t.value):null,days:Number(d?d.value:MONTH_DAYS_ANAL[m-1])});
  }
  const data = {
    clientId: selectedAnalysisObjectId ? Number(ObjectsModule.find(selectedAnalysisObjectId)?.clientId) : 0,
    objectId: selectedAnalysisObjectId,
    name: form.analName.value.trim(),
    analysisType: 'TYM',
    executedAt: form.analDate.value,
    author: form.analAuthor.value.trim(),
    status: form.analStatus.value,
    comments: form.analNotes.value.trim(),
    inputParams: {
      billingFrom: form.billFrom.value,
      billingTo: form.billTo.value,
      billingConsumption: Number(form.billConsumption.value),
      billingCO: Number(form.billCO.value||0),
      compFrom: form.compFrom.value,
      compTo: form.compTo.value,
      compConsumption: Number(form.compConsumption.value),
      compCO: Number(form.compCO.value||0),
      baseTemperature: Number(form.baseTemp.value),
      weatherStation: form.weatherStation.value,
      energyUnit: form.energyUnit.value,
      currency: form.currency.value,
      energyPrice: Number(form.energyPrice.value||0),
      escoShare: Number(form.escoShare.value||50),
      tymYearFrom: form.tymYearFrom.value,
      tymYearTo: form.tymYearTo.value,
      tymSource: form.tymSource.value,
      tymMonths, billMonths, compMonths
    },
    results: {
      savedEnergy: r.savedEnergy,
      savedEnergyPct: r.savedEnergyPct,
      savedMoney: r.savedMoney,
      eBill: r.eBill,
      eComp: r.eComp,
      kBill: r.kBill,
      kComp: r.kComp,
      eChange: r.eChange,
      hddTymBill: r.hddTymBill,
      hddTymComp: r.hddTymComp
    }
  };
  if (editingAnalysisId) { AnalysesModule.update(editingAnalysisId, data); }
  else { AnalysesModule.add(data); }
  showAnalysisForm=false; editingAnalysisId=null;
  renderAnalysesModule();
}

function saveRegAnalysis(form) {
  const r = window._regResults || {};
  const rows=[];
  document.querySelectorAll('#reg-data-table tr').forEach(tr=>{
    const t=Number(tr.dataset.t);
    const sb=tr.querySelector('.reg-supply-before')?.value;
    const sa=tr.querySelector('.reg-supply-after')?.value;
    const hb=tr.querySelector('.reg-heat-before')?.value;
    const ha=tr.querySelector('.reg-heat-after')?.value;
    if(sb||hb) rows.push({t, supplyBefore:Number(sb||0), supplyAfter:Number(sa||0), heatBefore:Number(hb||0), heatAfter:Number(ha||0)});
  });
  const data = {
    clientId: selectedAnalysisObjectId ? Number(ObjectsModule.find(selectedAnalysisObjectId)?.clientId) : 0,
    objectId: selectedAnalysisObjectId,
    name: form.regName.value.trim(),
    analysisType: 'REGRESSION',
    executedAt: form.regDate.value,
    author: form.regAuthor.value.trim(),
    status: form.regStatus.value,
    comments: form.regNotes.value.trim(),
    inputParams: {
      supplyBefore: `y=${form.supplyBefore_a.value}x+${form.supplyBefore_b.value}`,
      supplyAfter:  `y=${form.supplyAfter_a.value}x+${form.supplyAfter_b.value}`,
      heatBefore:   `y=${form.heatBefore_a.value}x+${form.heatBefore_b.value}`,
      heatAfter:    `y=${form.heatAfter_a.value}x+${form.heatAfter_b.value}`,
      supplyBefore_a: Number(form.supplyBefore_a.value), supplyBefore_b: Number(form.supplyBefore_b.value),
      supplyAfter_a:  Number(form.supplyAfter_a.value),  supplyAfter_b:  Number(form.supplyAfter_b.value),
      heatBefore_a:   Number(form.heatBefore_a.value),   heatBefore_b:   Number(form.heatBefore_b.value),
      heatAfter_a:    Number(form.heatAfter_a.value),     heatAfter_b:    Number(form.heatAfter_b.value),
      rows
    },
    results: { avgReductionSupply: r.avgReductionSupply, avgReductionHeat: r.avgReductionHeat }
  };
  AnalysesModule.add(data);
  showAnalysisForm=false; editingAnalysisId=null;
  renderAnalysesModule();
}

function copyAnalPrevPeriod(type) {
  const allForObj=(AnalysesModule.getAll()||[])
    .filter(a=>Number(a.objectId)===selectedAnalysisObjectId&&a.analysisType==='TYM'&&(!editingAnalysisId||Number(a.id)!==Number(editingAnalysisId)))
    .sort((a,b)=>(b.executedAt||'').localeCompare(a.executedAt||''));
  const prev=allForObj[0];
  if(!prev){alert('Brak poprzedniej analizy TYM do skopiowania.');return;}
  const ip=prev.inputParams||{};
  if(type==='comp'){
    if(document.querySelector('[name="compFrom"]')) document.querySelector('[name="compFrom"]').value=ip.compFrom||'';
    if(document.querySelector('[name="compTo"]'))   document.querySelector('[name="compTo"]').value=ip.compTo||'';
    if(document.querySelector('[name="compConsumption"]')) document.querySelector('[name="compConsumption"]').value=ip.compConsumption||'';
    if(document.querySelector('[name="compCO"]')) document.querySelector('[name="compCO"]').value=ip.compCO||'';
    buildAnalPeriodTable('comp');
    setTimeout(()=>{
      (ip.compMonths||[]).forEach(m=>{
        const tr=document.querySelector(`#comp-months-anal tr[data-key="${m.year}-${m.month}"]`);
        if(!tr)return;
        const t=tr.querySelector('input.anal-month-temp'); const d=tr.querySelector('input.anal-month-days');
        if(t&&m.temperature!=null)t.value=m.temperature;
        if(d&&m.days!=null)d.value=m.days;
      });
      calcAnalTYM();
    },60);
  } else if(type==='tym'){
    if(document.querySelector('[name="tymYearFrom"]')) document.querySelector('[name="tymYearFrom"]').value=ip.tymYearFrom||'';
    if(document.querySelector('[name="tymYearTo"]'))   document.querySelector('[name="tymYearTo"]').value=ip.tymYearTo||'';
    if(document.querySelector('[name="tymSource"]'))   document.querySelector('[name="tymSource"]').value=ip.tymSource||'';
    (ip.tymMonths||[]).forEach(m=>{
      const t=document.querySelector(`[name="tymTemp_anal_${m.month}"]`);
      const d=document.querySelector(`[name="tymDays_anal_${m.month}"]`);
      if(t&&m.temp!=null)t.value=m.temp;
      if(d&&m.days!=null)d.value=m.days;
    });
    calcAnalTYM();
  }
}

function editTYMAnalysis(id) {
  editingAnalysisId=id;
  showAnalysisForm=true;
  activeAnalysisTab='tym';
  renderAnalysesModule();
  setTimeout(()=>{
    const a=AnalysesModule.find(id); if(!a||!a.inputParams)return;
    const ip=a.inputParams;
    if(document.querySelector('[name="billFrom"]')) document.querySelector('[name="billFrom"]').value=ip.billingFrom||'';
    if(document.querySelector('[name="billTo"]'))   document.querySelector('[name="billTo"]').value=ip.billingTo||'';
    if(document.querySelector('[name="billConsumption"]')) document.querySelector('[name="billConsumption"]').value=ip.billingConsumption||'';
    if(document.querySelector('[name="billCO"]')) document.querySelector('[name="billCO"]').value=ip.billingCO||'';
    if(document.querySelector('[name="compFrom"]')) document.querySelector('[name="compFrom"]').value=ip.compFrom||'';
    if(document.querySelector('[name="compTo"]'))   document.querySelector('[name="compTo"]').value=ip.compTo||'';
    if(document.querySelector('[name="compConsumption"]')) document.querySelector('[name="compConsumption"]').value=ip.compConsumption||'';
    if(document.querySelector('[name="compCO"]')) document.querySelector('[name="compCO"]').value=ip.compCO||'';
    buildAnalPeriodTable('bill');
    buildAnalPeriodTable('comp');
    setTimeout(()=>{
      (ip.billMonths||[]).forEach(m=>{
        const tr=document.querySelector(`#bill-months-anal tr[data-key="${m.year}-${m.month}"]`);
        if(!tr)return;
        const t=tr.querySelector('input.anal-month-temp');const d=tr.querySelector('input.anal-month-days');
        if(t&&m.temperature!=null)t.value=m.temperature;if(d&&m.days!=null)d.value=m.days;
      });
      (ip.compMonths||[]).forEach(m=>{
        const tr=document.querySelector(`#comp-months-anal tr[data-key="${m.year}-${m.month}"]`);
        if(!tr)return;
        const t=tr.querySelector('input.anal-month-temp');const d=tr.querySelector('input.anal-month-days');
        if(t&&m.temperature!=null)t.value=m.temperature;if(d&&m.days!=null)d.value=m.days;
      });
      (ip.tymMonths||[]).forEach(m=>{
        const t=document.querySelector(`[name="tymTemp_anal_${m.month}"]`);
        const d=document.querySelector(`[name="tymDays_anal_${m.month}"]`);
        if(t&&m.temp!=null)t.value=m.temp;if(d&&m.days!=null)d.value=m.days;
      });
      calcAnalTYM();
    },80);
  },100);
}

function viewTYMAnalysis(id) {
  const a=AnalysesModule.find(id); if(!a)return;
  const container=document.getElementById('module-content'); if(!container)return;
  const r=a.results||{}, ip=a.inputParams||{};
  const client=ClientsModule.find(a.clientId), obj=ObjectsModule.find(a.objectId);
  const pct=r.savedEnergyPct?((r.savedEnergyPct<1?r.savedEnergyPct*100:r.savedEnergyPct)).toFixed(1)+'%':'—';
  container.innerHTML=`
    <button class="small-button" onclick="activeAnalysisTab='tym';showAnalysisForm=false;editingAnalysisId=null;renderAnalysesModule();" style="margin-bottom:16px;">← Lista analiz TYM</button>
    <div class="anal-result-box" style="background:linear-gradient(135deg,#0C447C,#1a6bb5);">
      <div style="font-size:12px;opacity:.7;margin-bottom:8px;">📋 PROTOKÓŁ TYM — ${escapeHtml(a.name)}</div>
      <div style="font-size:12px;opacity:.7;margin-bottom:16px;">${escapeHtml((client&&client.name)||'')} / ${escapeHtml((obj&&obj.name)||'')} · ${fmtDate(a.executedAt)}</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;text-align:center;">
        <div><div style="font-size:32px;font-weight:700;">${pct}</div><div style="font-size:11px;opacity:.8;">redukcja zużycia (TYM)</div></div>
        <div><div style="font-size:28px;font-weight:700;">${r.savedEnergy!=null?Number(r.savedEnergy).toFixed(2):'-'}</div><div style="font-size:11px;opacity:.8;">oszczędność (${ip.energyUnit||'kWh'})</div></div>
        <div><div style="font-size:28px;font-weight:700;">${r.savedMoney!=null?Number(r.savedMoney).toFixed(2):'-'}</div><div style="font-size:11px;opacity:.8;">wartość (${ip.currency||'EUR'})</div></div>
        <div><div style="font-size:28px;font-weight:700;">${r.eChange!=null?((r.eChange<0?'':'+')+(r.eChange*100).toFixed(1))+'%':'-'}</div><div style="font-size:11px;opacity:.8;">zmiana wsk. E</div></div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
      <div style="border:1px solid #B5D4F4;border-radius:10px;overflow:hidden;">
        <div style="background:#E6F1FB;padding:10px 14px;font-size:13px;font-weight:600;color:#0C447C;">📅 Okres rozliczeniowy</div>
        <div style="padding:12px 14px;font-size:13px;">
          <div>${fmtDate(ip.billingFrom)} → ${fmtDate(ip.billingTo)}</div>
          <div style="margin-top:4px;">Zużycie: <strong>${ip.billingCO||ip.billingConsumption} ${ip.energyUnit||'kWh'}</strong></div>
          <div>HDD TYM: <strong>${r.hddTymBill!=null?Number(r.hddTymBill).toFixed(1):'-'} °C·dni</strong></div>
          <div>k = <strong>${r.kBill!=null?Number(r.kBill).toFixed(4):'-'}</strong></div>
          <div>E = <strong>${r.eBill!=null?Number(r.eBill).toFixed(3):'-'} ${ip.energyUnit||'kWh'}/HDD</strong></div>
        </div>
      </div>
      <div style="border:1px solid #C0DD97;border-radius:10px;overflow:hidden;">
        <div style="background:#EAF3DE;padding:10px 14px;font-size:13px;font-weight:600;color:#27500A;">📊 Okres porównawczy</div>
        <div style="padding:12px 14px;font-size:13px;">
          <div>${fmtDate(ip.compFrom)} → ${fmtDate(ip.compTo)}</div>
          <div style="margin-top:4px;">Zużycie CO: <strong>${ip.compCO||ip.compConsumption} ${ip.energyUnit||'kWh'}</strong></div>
          <div>HDD TYM: <strong>${r.hddTymComp!=null?Number(r.hddTymComp).toFixed(1):'-'} °C·dni</strong></div>
          <div>k = <strong>${r.kComp!=null?Number(r.kComp).toFixed(4):'-'}</strong></div>
          <div>E = <strong>${r.eComp!=null?Number(r.eComp).toFixed(3):'-'} ${ip.energyUnit||'kWh'}/HDD</strong></div>
        </div>
      </div>
    </div>
    <div style="display:flex;gap:8px;">
      <button class="small-button" onclick="editTYMAnalysis(${a.id})">✏️ Edytuj</button>
      <button class="small-button" onclick="generateESCOReport(${a.id})" style="background:#E6F1FB;color:#0C447C;border-color:#B5D4F4;">📄 Generuj Raport ESCO</button>
      <button class="small-button icon-btn-del" onclick="if(confirm('Usuń?')){AnalysesModule.remove(${a.id});renderAnalysesModule();}">🗑 Usuń</button>
    </div>`;
}

function viewRegAnalysis(id) {
  const a=AnalysesModule.find(id); if(!a)return;
  const container=document.getElementById('module-content'); if(!container)return;
  const r=a.results||{}, ip=a.inputParams||{};
  const client=ClientsModule.find(a.clientId), obj=ObjectsModule.find(a.objectId);
  container.innerHTML=`
    <button class="small-button" onclick="activeAnalysisTab='regression';showAnalysisForm=false;renderAnalysesModule();" style="margin-bottom:16px;">← Lista analiz regresji</button>
    <div style="background:linear-gradient(135deg,#633806,#9E5A0C);color:#fff;border-radius:12px;padding:20px 24px;margin-bottom:20px;">
      <div style="font-size:12px;opacity:.7;margin-bottom:8px;">📈 REGRESJA LINIOWA — ${escapeHtml(a.name)}</div>
      <div style="font-size:12px;opacity:.7;margin-bottom:16px;">${escapeHtml((client&&client.name)||'')} / ${escapeHtml((obj&&obj.name)||'')} · ${fmtDate(a.executedAt)}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;text-align:center;">
        <div><div style="font-size:28px;font-weight:700;">${r.avgReductionSupply!=null?Number(r.avgReductionSupply).toFixed(1)+'%':'—'}</div><div style="font-size:11px;opacity:.8;">śr. redukcja temp. zasilania</div></div>
        <div><div style="font-size:28px;font-weight:700;">${r.avgReductionHeat!=null?Number(r.avgReductionHeat).toFixed(1)+'%':'—'}</div><div style="font-size:11px;opacity:.8;">śr. redukcja zużycia ciepła</div></div>
      </div>
    </div>
    <div style="border:1px solid #FAC775;border-radius:10px;overflow:hidden;margin-bottom:16px;">
      <div style="background:#FAEEDA;padding:10px 14px;font-size:13px;font-weight:600;color:#633806;">Równania regresji</div>
      <div style="padding:14px;display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px;">
        <div><div style="font-size:11px;color:var(--color-text-secondary);">Temp. zasilania PRZED</div><strong>${ip.supplyBefore||'—'}</strong></div>
        <div><div style="font-size:11px;color:var(--color-text-secondary);">Temp. zasilania PO</div><strong>${ip.supplyAfter||'—'}</strong></div>
        <div><div style="font-size:11px;color:var(--color-text-secondary);">Zużycie ciepła PRZED</div><strong>${ip.heatBefore||'—'}</strong></div>
        <div><div style="font-size:11px;color:var(--color-text-secondary);">Zużycie ciepła PO</div><strong>${ip.heatAfter||'—'}</strong></div>
      </div>
    </div>
    <div style="font-size:12px;color:var(--color-text-secondary);padding:10px;background:var(--color-background-secondary);border-radius:8px;margin-bottom:16px;">
      ℹ️ Metoda pomocnicza — nie zastępuje metody TYM w rozliczeniach. Służy jako techniczny dowód działania systemu WaterAI.
    </div>
    <div style="display:flex;gap:8px;">
      <button class="small-button icon-btn-del" onclick="if(confirm('Usuń?')){AnalysesModule.remove(${a.id});renderAnalysesModule();}">🗑 Usuń</button>
    </div>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RAPORT ESCO — generowanie i przeglądanie
// ═══════════════════════════════════════════════════════════════════════════════

function generateESCOReport(analysisId) {
  openModule('reports');
  setTimeout(()=>{ window._prefillESCOAnalysisId=analysisId; renderESCOReports(); }, 100);
}

function renderESCOReports() {
  const container=document.getElementById('module-content'); if(!container)return;

  const allReports=(window._escoReports||JSON.parse(localStorage.getItem('waterai_esco_reports_v1')||'[]'))
    .sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
  window._escoReports=allReports;

  const allAnalyses=AnalysesModule.getAll()||[];
  const tymAnalyses=allAnalyses.filter(a=>a.analysisType==='TYM');
  const regAnalyses=allAnalyses.filter(a=>a.analysisType==='REGRESSION');

  const prefill=window._prefillESCOAnalysisId;
  const prefillAnal=prefill?AnalysesModule.find(prefill):null;

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

  ${allReports.length===0?`<div class="reminder-card"><strong>Brak raportów ESCO</strong><div class="reminder-meta">Utwórz raport łącząc analizy TYM i regresji. Raport jest podstawą do wystawienia faktury za oszczędności.</div></div>`:`
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
          <div class="esco-grid3">
            <div class="esco-field"><label>Numer raportu</label><input name="reportNumber" required placeholder="np. ESCO/2026/Q1/001" value="ESCO/${new Date().getFullYear()}/${String(new Date().getMonth()+1).padStart(2,'0')}/001"/></div>
            <div class="esco-field"><label>Data raportu</label><input name="reportDate" type="date" required value="${new Date().toISOString().slice(0,10)}"/></div>
            <div class="esco-field"><label>Status</label><select name="reportStatus">
              <option value="DRAFT">Szkic</option>
              <option value="FINAL">Finalny</option>
              <option value="SIGNED">Podpisany</option>
            </select></div>
            <div class="esco-field"><label>Sporządził</label><input name="preparedBy" placeholder="np. Jan Nowak"/></div>
            <div class="esco-field"><label>Zatwierdził</label><input name="approvedBy" placeholder="opcjonalnie"/></div>
          </div>
        </div>
      </div>

      <!-- WYBÓR ANALIZ -->
      <div class="esco-section" style="border:1px solid #B8E0C8;">
        <div style="background:#E6F5EC;padding:12px 16px;display:flex;align-items:center;gap:10px;">
          <span style="font-size:18px;">🔬</span><h3 style="margin:0;font-size:15px;font-weight:500;color:#1A6B3C;">Powiązane analizy</h3>
        </div>
        <div class="esco-body">
          <div style="font-size:12px;color:var(--color-text-secondary);margin-bottom:10px;">Wybierz analizy TYM (główna metoda) i opcjonalnie regresji (weryfikacja):</div>

          <div style="font-size:12px;font-weight:600;color:#0C447C;margin-bottom:6px;">📅 Analiza TYM (główna — do rozliczenia)</div>
          ${tymAnalyses.length===0?`<div style="font-size:13px;color:var(--color-text-secondary);padding:10px;background:var(--color-background-secondary);border-radius:8px;margin-bottom:12px;">Brak analiz TYM — dodaj najpierw analizę w module Analizy.</div>`:`
          <div style="overflow-x:auto;border:1px solid var(--color-border-tertiary);border-radius:8px;margin-bottom:16px;">
            <table style="width:100%;border-collapse:collapse;font-size:12px;">
              <thead><tr style="background:var(--color-background-secondary);">
                <th style="padding:6px 10px;font-size:11px;font-weight:600;border-bottom:1px solid var(--color-border-tertiary);">Wybierz</th>
                <th style="padding:6px 10px;font-size:11px;font-weight:600;border-bottom:1px solid var(--color-border-tertiary);">Nazwa</th>
                <th style="padding:6px 10px;font-size:11px;font-weight:600;border-bottom:1px solid var(--color-border-tertiary);">Obiekt</th>
                <th style="padding:6px 10px;font-size:11px;font-weight:600;border-bottom:1px solid var(--color-border-tertiary);">Okres</th>
                <th style="padding:6px 10px;font-size:11px;font-weight:600;border-bottom:1px solid var(--color-border-tertiary);">% redukcji</th>
                <th style="padding:6px 10px;font-size:11px;font-weight:600;border-bottom:1px solid var(--color-border-tertiary);">Oszczędność</th>
              </tr></thead>
              <tbody>
                ${tymAnalyses.map(a=>{
                  const obj2=ObjectsModule.find(a.objectId);
                  const r=a.results||{}, ip=a.inputParams||{};
                  const pct=r.savedEnergyPct!=null?((r.savedEnergyPct<1?r.savedEnergyPct*100:r.savedEnergyPct)).toFixed(1)+'%':'—';
                  const checked=(prefillAnal&&Number(prefillAnal.id)===Number(a.id))||false;
                  return `<tr style="border-bottom:.5px solid var(--color-border-tertiary);">
                    <td style="padding:6px 10px;text-align:center;"><input type="checkbox" name="tym_anal" value="${a.id}" ${checked?'checked':''} onchange="updateESCOSummary()"/></td>
                    <td style="padding:6px 10px;">${escapeHtml(a.name)}</td>
                    <td style="padding:6px 10px;">${escapeHtml((obj2&&obj2.name)||'—')}</td>
                    <td style="padding:6px 10px;white-space:nowrap;">${fmtDate(ip.billingFrom)} → ${fmtDate(ip.billingTo)}</td>
                    <td style="padding:6px 10px;color:#27500A;">${pct}</td>
                    <td style="padding:6px 10px;">${r.savedEnergy!=null?Number(r.savedEnergy).toFixed(2)+' '+(ip.energyUnit||'kWh'):'—'}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>`}

          <div style="font-size:12px;font-weight:600;color:#633806;margin-bottom:6px;">📈 Analiza regresji (pomocnicza — weryfikacja techniczna)</div>
          ${regAnalyses.length===0?`<div style="font-size:13px;color:var(--color-text-secondary);padding:10px;background:var(--color-background-secondary);border-radius:8px;">Brak analiz regresji.</div>`:`
          <div style="overflow-x:auto;border:1px solid var(--color-border-tertiary);border-radius:8px;">
            <table style="width:100%;border-collapse:collapse;font-size:12px;">
              <thead><tr style="background:var(--color-background-secondary);">
                <th style="padding:6px 10px;font-size:11px;font-weight:600;border-bottom:1px solid var(--color-border-tertiary);">Wybierz</th>
                <th style="padding:6px 10px;font-size:11px;font-weight:600;border-bottom:1px solid var(--color-border-tertiary);">Nazwa</th>
                <th style="padding:6px 10px;font-size:11px;font-weight:600;border-bottom:1px solid var(--color-border-tertiary);">Obiekt</th>
                <th style="padding:6px 10px;font-size:11px;font-weight:600;border-bottom:1px solid var(--color-border-tertiary);">Data</th>
                <th style="padding:6px 10px;font-size:11px;font-weight:600;border-bottom:1px solid var(--color-border-tertiary);">Redukcja zużycia</th>
              </tr></thead>
              <tbody>
                ${regAnalyses.map(a=>{
                  const obj2=ObjectsModule.find(a.objectId);
                  const r=a.results||{};
                  return `<tr style="border-bottom:.5px solid var(--color-border-tertiary);">
                    <td style="padding:6px 10px;text-align:center;"><input type="checkbox" name="reg_anal" value="${a.id}" onchange="updateESCOSummary()"/></td>
                    <td style="padding:6px 10px;">${escapeHtml(a.name)}</td>
                    <td style="padding:6px 10px;">${escapeHtml((obj2&&obj2.name)||'—')}</td>
                    <td style="padding:6px 10px;">${fmtDate(a.executedAt)}</td>
                    <td style="padding:6px 10px;color:#633806;">${r.avgReductionHeat!=null?Number(r.avgReductionHeat).toFixed(1)+'%':'—'}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>`}
        </div>
      </div>

      <!-- PODSUMOWANIE WYNIKÓW (live) -->
      <div id="esco-summary-box" style="display:none;" class="anal-result-box" style="background:linear-gradient(135deg,#0C447C,#1a6bb5);">
        <div style="font-size:11px;font-weight:600;letter-spacing:.5px;opacity:.7;margin-bottom:12px;">PODSUMOWANIE RAPORTU ESCO</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;text-align:center;">
          <div><div style="font-size:28px;font-weight:700;" id="esco-res-pct">—</div><div style="font-size:11px;opacity:.8;">% redukcji (TYM)</div></div>
          <div><div style="font-size:28px;font-weight:700;" id="esco-res-energy">—</div><div style="font-size:11px;opacity:.8;">oszczędność energii</div></div>
          <div><div style="font-size:28px;font-weight:700;" id="esco-res-money">—</div><div style="font-size:11px;opacity:.8;">wartość oszczędności</div></div>
          <div><div style="font-size:28px;font-weight:700;" id="esco-res-reg">—</div><div style="font-size:11px;opacity:.8;">redukcja (regresja)</div></div>
        </div>
        <div style="margin-top:12px;font-size:12px;opacity:.8;" id="esco-res-detail"></div>
      </div>

      <!-- NOTATKI -->
      <div class="esco-field" style="margin:16px 0;">
        <label>Uwagi do raportu</label>
        <input name="reportNotes" placeholder="opcjonalne uwagi"/>
      </div>

      <div style="display:flex;gap:10px;">
        <button class="primary-button" type="submit">💾 Zapisz raport ESCO</button>
        <button class="small-button" type="button" onclick="document.getElementById('esco-form-wrap').style.display='none';window._prefillESCOAnalysisId=null;">Anuluj</button>
      </div>
      </form>
    </div>
  </div>`;

  // Auto-prefill summary if coming from viewTYMAnalysis
  if(prefill) setTimeout(()=>updateESCOSummary(), 100);
}

function updateESCOSummary() {
  const tymChecks=[...document.querySelectorAll('[name="tym_anal"]:checked')].map(c=>Number(c.value));
  const regChecks=[...document.querySelectorAll('[name="reg_anal"]:checked')].map(c=>Number(c.value));

  const tymAnals=tymChecks.map(id=>AnalysesModule.find(id)).filter(Boolean);
  const regAnals=regChecks.map(id=>AnalysesModule.find(id)).filter(Boolean);

  const box=document.getElementById('esco-summary-box');
  if(!box)return;

  if(!tymAnals.length){ box.style.display='none'; return; }
  box.style.display='block';

  // Aggregate TYM results
  let totalSaved=0, totalMoney=0, totalBase=0, unit='kWh', currency='EUR';
  tymAnals.forEach(a=>{
    const r=a.results||{}, ip=a.inputParams||{};
    if(r.savedEnergy) totalSaved+=Number(r.savedEnergy);
    if(r.savedMoney) totalMoney+=Number(r.savedMoney);
    unit=ip.energyUnit||unit;
    currency=ip.currency||currency;
  });
  const pct=tymAnals.length===1&&tymAnals[0].results?.savedEnergyPct!=null?
    ((tymAnals[0].results.savedEnergyPct<1?tymAnals[0].results.savedEnergyPct*100:tymAnals[0].results.savedEnergyPct)).toFixed(1)+'%':'—';

  const avgReg=regAnals.length>0?(regAnals.reduce((s,a)=>s+(a.results?.avgReductionHeat||0),0)/regAnals.length).toFixed(1)+'%':'—';

  document.getElementById('esco-res-pct').textContent=pct;
  document.getElementById('esco-res-energy').textContent=totalSaved.toFixed(2)+' '+unit;
  document.getElementById('esco-res-money').textContent=totalMoney.toFixed(2)+' '+currency;
  document.getElementById('esco-res-reg').textContent=avgReg;
  document.getElementById('esco-res-detail').textContent=`Metoda TYM: ${tymAnals.map(a=>a.name).join(', ')}${regAnals.length?' | Regresja: '+regAnals.map(a=>a.name).join(', '):''}`;

  window._escoLiveResults={totalSaved, totalMoney, pct, avgReg, unit, currency, tymIds:tymChecks, regIds:regChecks};
}

function saveESCOReport(form) {
  const r=window._escoLiveResults||{};
  const tymIds=(r.tymIds||[...document.querySelectorAll('[name="tym_anal"]:checked')].map(c=>Number(c.value)));
  const regIds=(r.regIds||[...document.querySelectorAll('[name="reg_anal"]:checked')].map(c=>Number(c.value)));

  if(!tymIds.length){alert('Wybierz co najmniej jedną analizę TYM.');return;}

  const firstTym=AnalysesModule.find(tymIds[0]);
  const ip=firstTym?.inputParams||{};
  const objId=firstTym?.objectId;
  const clientId=firstTym?.clientId;

  const report={
    id: 'esco_'+Date.now(),
    createdAt: new Date().toISOString(),
    reportNumber: form.reportNumber.value.trim(),
    reportDate: form.reportDate.value,
    status: form.reportStatus.value,
    preparedBy: form.preparedBy.value.trim(),
    approvedBy: form.approvedBy.value.trim(),
    clientId: Number(clientId),
    objectId: Number(objId),
    periodFrom: ip.billingFrom||'',
    periodTo: ip.billingTo||'',
    analysisIdsTYM: tymIds,
    analysisIdsREG: regIds,
    notes: form.reportNotes.value.trim(),
    results:{
      savedEnergyTotal: r.totalSaved||0,
      savedMoneyTotal: r.totalMoney||0,
      savedEnergyPct: firstTym?.results?.savedEnergyPct||0,
      energyUnit: r.unit||'kWh',
      currency: r.currency||'EUR',
      avgReductionReg: regIds.length>0?Number((r.avgReg||'0').replace('%',''))/100:null,
      eBill: firstTym?.results?.eBill,
      eComp: firstTym?.results?.eComp
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

function buildAnalystField(inputName, currentValue, selObj) {
  const analysts = window.UsersModule ? UsersModule.findByRole('energyAnalyst') : [];
  const suggested = currentValue || (selObj && selObj.energyAnalystOwner ? selObj.energyAnalystOwner : '');
  const uid = inputName + '_analyst_field';

  // Build select options: each analyst + separator + "Inny"
  const exactMatch = analysts.find(u => {
    const full = ((u.firstName||'')+' '+(u.lastName||'')).trim();
    return full === suggested;
  });

  const opts = analysts.map(u => {
    const full = ((u.firstName||'')+' '+(u.lastName||'')).trim();
    return `<option value="${escapeHtml(full)}" ${full===suggested?'selected':''}>${escapeHtml(full)}</option>`;
  }).join('');

  const showCustom = suggested && !exactMatch;
  const selectVal = showCustom ? '__other__' : (suggested || '');

  return `
    <select id="${uid}_sel" onchange="(function(s){
      const inp=document.getElementById('${uid}_inp');
      const wrap=document.getElementById('${uid}_wrap');
      if(s.value==='__other__'){wrap.style.display='flex';inp.focus();}
      else{wrap.style.display='none';document.getElementById('${uid}_hidden').value=s.value;}
    })(this)" style="width:100%;">
      <option value="" ${!suggested?'selected':''}>— wybierz —</option>
      ${opts}
      <option value="__other__" ${showCustom?'selected':''}>✏️ Inny (wpisz ręcznie)</option>
    </select>
    <input type="hidden" id="${uid}_hidden" name="${inputName}" value="${escapeHtml(showCustom ? '' : suggested)}"/>
    <div id="${uid}_wrap" style="display:${showCustom?'flex':'none'};gap:4px;margin-top:4px;align-items:center;">
      <input id="${uid}_inp" type="text" placeholder="Wpisz imię i nazwisko"
        value="${escapeHtml(showCustom ? suggested : '')}"
        oninput="document.getElementById('${uid}_hidden').value=this.value"
        style="flex:1;"/>
      <button type="button" title="Wróć do listy"
        onclick="document.getElementById('${uid}_sel').value='';document.getElementById('${uid}_hidden').value='';document.getElementById('${uid}_wrap').style.display='none';"
        style="padding:4px 8px;font-size:11px;border:1px solid #ccc;border-radius:6px;background:#f5f5f5;cursor:pointer;">✕</button>
    </div>`;
}

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

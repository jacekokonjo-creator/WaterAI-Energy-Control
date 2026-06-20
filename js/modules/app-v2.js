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
// Metoda stopniodni (Tᵢ = 20 °C, SD20 = z₀·(20−tₘₑ), φ = ΣSD_stand/ΣSD_rzecz,
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
const _sd20 = (tme, z0) => Math.max(0, ANAL_TI - Number(tme)) * Number(z0 || 0);

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
    before: { from: '', to: '', consumption: '', months: [] },
    after:  { from: '', to: '', consumption: '', months: [] },
    energy: { unit: 'GJ', currency: 'PLN', price: '', escoShare: 50 },
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
  @media(max-width:680px){.anw-g4{grid-template-columns:1fr 1fr;}.anw-g3{grid-template-columns:1fr;}}
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
    const ready = (k === 'TYM' || k === 'REGRESSION'); // gotowe metody
    return `<div class="anw-type ${ANAL.type === k ? 'sel' : ''}" onclick="analSelectType('${k}')">
      ${ANAL.type === k ? '<span class="chk">✓</span>' : ''}
      <span class="badge ${ready ? 'ready' : 'soon'}">${ready ? 'GOTOWE' : 'WKRÓTCE'}</span>
      <span class="ico">${t.icon}</span>
      <span class="t">${_escA(t.label)}</span>
      <span class="d">${_analTypeDesc(k)}</span>
    </div>`;
  }).join('');

  const all = (AnalysesModule.getAll() || []).sort((a, b) => (b.executedAt || '').localeCompare(a.executedAt || ''));
  const list = all.length ? `
    <div style="margin-top:28px;">
      <div style="font-size:13px;font-weight:600;color:var(--color-text-secondary);margin-bottom:10px;">Zapisane analizy (${all.length})</div>
      <div style="overflow-x:auto;border:1px solid var(--color-border-tertiary);border-radius:10px;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead><tr style="background:var(--color-background-secondary);">
            <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;">Typ</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;">Nazwa</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;">Obiekt</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;">Data</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;">Oszczędność</th>
            <th style="padding:8px 12px;font-size:11px;font-weight:600;">Akcje</th>
          </tr></thead>
          <tbody>${all.map(a => {
            const o = ObjectsModule.find(a.objectId); const r = a.results || {};
            const ty = AnalysesModule.TYPES[a.analysisType] || { icon: '•', label: a.analysisType };
            const pct = r.savedEnergyPct != null ? ((r.savedEnergyPct < 1 ? r.savedEnergyPct * 100 : r.savedEnergyPct)).toFixed(1) + '%' : '—';
            return `<tr style="border-bottom:1px solid var(--color-border-tertiary);">
              <td style="padding:9px 12px;">${ty.icon} ${_escA(ty.label)}</td>
              <td style="padding:9px 12px;font-weight:500;">${_escA(a.name)}</td>
              <td style="padding:9px 12px;">${_escA((o && o.name) || '—')}</td>
              <td style="padding:9px 12px;">${_fmtDateA(a.executedAt)}</td>
              <td style="padding:9px 12px;color:#27500A;">${r.savedEnergy != null ? Number(r.savedEnergy).toFixed(2) + ' ' + ((a.inputParams && a.inputParams.energyUnit) || '') : '—'} ${pct !== '—' ? '· ' + pct : ''}</td>
              <td style="padding:9px 12px;white-space:nowrap;">
                <button class="icon-btn" onclick="analView(${a.id})" title="Podgląd">👁</button>
                <button class="icon-btn" onclick="analGenerateReport(${a.id})" title="Raport ESCO">⚡</button>
                <button class="icon-btn icon-btn-del" onclick="if(confirm('Usuń analizę?')){AnalysesModule.remove(${a.id});renderAnalysesModule();}" title="Usuń">🗑</button>
              </td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>
    </div>` : '';

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
              ${clients.map(c => `<option value="${c.id}" ${Number(c.id) === Number(ANAL.clientId) ? 'selected' : ''}>${_escA(c.name)}</option>`).join('')}
            </select></div>
          <div class="anw-f"><label>Obiekt</label>
            <select onchange="analOnObject(this.value)" ${ANAL.clientId ? '' : 'disabled'}>
              <option value="">${ANAL.clientId ? '— wybierz obiekt —' : 'najpierw klient'}</option>
              ${objsForClient.map(o => `<option value="${o.id}" ${Number(o.id) === Number(ANAL.objectId) ? 'selected' : ''}>${_escA(o.name)}</option>`).join('')}
            </select></div>
          <div class="anw-f"><label>Okres bazowy (PRZED instalacją)</label>
            <select onchange="analOnBasePeriod(this.value)" ${ANAL.objectId ? '' : 'disabled'}>
              <option value="">${ANAL.objectId ? (baseProtocols.length ? '— wybierz okres bazowy —' : 'brak zapisanych okresów bazowych') : 'najpierw obiekt'}</option>
              ${baseProtocols.map(p => `<option value="${p.id}" ${String(ANAL.basePeriod) === String(p.id) ? 'selected' : ''}>${_escA(p.protocolNumber || ('Protokół ' + p.id))}${p.protocolDate ? ' · ' + _escA(p.protocolDate) : ''}</option>`).join('')}
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
    body = _analTYMSheet();
  } else if (ANAL.type === 'REGRESSION') {
    body = _analRegInfo();
  } else {
    body = `<div class="anw-sec"><div class="anw-head anw-gold"><span class="ico">${t.icon}</span><h3>${_escA(t.label)}</h3></div>
      <div class="anw-body" style="text-align:center;padding:40px 20px;color:var(--color-text-secondary);">
        <div style="font-size:42px;margin-bottom:10px;">🚧</div><strong>Metoda w przygotowaniu</strong>
        <div class="anw-muted" style="margin-top:6px;">Szkielet kreatora jest gotowy. Arkusz obliczeniowy tej metody dodamy w kolejnym kroku.</div></div></div>`;
  }

  const footer = (ANAL.objectId && ANAL.type === 'TYM') ? `
    <div id="anw-results">${ANAL.results ? _analResults() : ''}</div>
    <div class="anw-act" style="justify-content:space-between;align-items:center;">
      <span class="anw-muted">Tᵢ = 20 °C · SD20 = z₀·(20−tₘₑ) · φ = ΣSD_stand / ΣSD_rzecz · Qs = Q·φ</span>
      <button class="anw-run" onclick="analRun()">⚡ Wykonaj analizę</button>
    </div>` : '';

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
  return `<div class="anw-ctx">
    <span>Klient: <b>${_escA(c ? c.name : '')}</b></span>
    <span>Obiekt: <b>${_escA(o.name)}</b></span>
    <span>Stacja meteo: <b>${_escA(o.weatherStation || '—')}</b></span>
    <span>Tᵢ bazowa: <b>${ANAL_TI} °C</b></span>
  </div>`;
}

// ── Arkusz TYM (stopniodni) ─────────────────────────────────────────────────────
function _analTYMSheet() {
  const stdRows = ANAL_MONTHS.map((mn, i) => {
    const m = i + 1; const v = ANAL.std[m]; const sd = _sd20(v[0], v[1]);
    return `<tr>
      <td>${mn}</td>
      <td><input type="number" step="0.1" value="${v[0]}" oninput="ANAL.std[${m}][0]=this.value;_analRecalcLive()"></td>
      <td><input type="number" min="0" max="31" value="${v[1]}" oninput="ANAL.std[${m}][1]=this.value;_analRecalcLive()"></td>
      <td class="calc" id="anw-std-sd-${m}">${_fmtA(sd, 1)}</td>
    </tr>`;
  }).join('');

  return `
  <div class="anw-sec">
    <div class="anw-head anw-gold"><span class="ico">📐</span><h3>Standardowy sezon ogrzewczy (Tᵢ = 20 °C)</h3>
      <span class="pill" style="background:#FAC775;color:#633806;">∑SD20_stand = <b id="anw-std-sum">—</b></span></div>
    <div class="anw-body">
      <table class="anw-t">
        <thead><tr><th style="width:30%">Miesiąc</th><th>śr. temp. tₘₑ [°C]</th><th>dni z₀</th><th style="text-align:right">SD20_stand [(K·d)]</th></tr></thead>
        <tbody>${stdRows}</tbody>
      </table>
      <div class="anw-note">Wartości domyślne: standardowy sezon dla Lublina. Dane standardowe wg
        <a href="https://www.gov.pl/web/archiwum-inwestycje-rozwoj/dane-do-obliczen-energetycznych-budynkow" target="_blank" rel="noopener">gov.pl — dane do obliczeń energetycznych budynków</a>. Edytuj dla innej lokalizacji.</div>
    </div>
  </div>
  ${_analPeriodSheet('before', 'Okres bazowy — PRZED instalacją', 'anw-before', '📉', 'Qc.o. przed')}
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
        <div class="anw-f"><label>Cena energii (za jednostkę)</label>
          <input type="number" step="0.0001" min="0" value="${ANAL.energy.price}" placeholder="np. 85" oninput="ANAL.energy.price=this.value;_analRecalcLive()"></div>
        <div class="anw-f"><label>Udział WaterAI / ESCO [%]</label>
          <input type="number" step="0.1" min="0" max="100" value="${ANAL.energy.escoShare}" oninput="ANAL.energy.escoShare=this.value;_analRecalcLive()"></div>
      </div>
    </div>
  </div>`;
}

function _analPeriodSheet(key, title, headCls, ico, qLabel) {
  const P = ANAL[key];
  const rows = P.months.length ? P.months.map((mo, idx) => {
    const sdR = _sd20(mo.tme, mo.days);
    const stdM = ANAL.std[mo.month]; const sdS = _sd20(stdM[0], stdM[1]);
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
        <div class="anw-f"><label>${qLabel} — zużycie Qc.o. [<span class="anw-u">${ANAL.energy.unit}</span>]</label>
          <input type="number" step="0.001" value="${P.consumption}" placeholder="z faktur / ciepłomierza" oninput="ANAL.${key}.consumption=this.value;_analRecalcLive()"></div>
      </div>
      <table class="anw-t" style="margin-top:6px;">
        <thead><tr><th style="width:26%">Miesiąc</th><th>śr. temp. tₘₑ [°C]</th><th>dni z₀</th><th style="text-align:right">SD20_rzecz</th><th style="text-align:right">SD20_stand</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td>Suma</td><td></td><td class="calc" id="anw-${key}-days">—</td>
          <td class="calc" id="anw-${key}-sumr">—</td><td class="calc" id="anw-${key}-sums">—</td></tr></tfoot>
      </table>
      <div class="anw-note">φ = ∑SD20_stand / ∑SD20_rzecz · Qs = Qc.o.·φ → <b id="anw-${key}-qs">—</b> ${ANAL.energy.unit} (skorygowane)</div>
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
  selectedAnalysisObjectId = ANAL.objectId;
  const o = ANAL.objectId ? ObjectsModule.find(ANAL.objectId) : null;
  if (o) {
    ANAL.energy.unit = o.energyUnit || ANAL.energy.unit;
    ANAL.energy.currency = o.currency || ANAL.energy.currency;
    ANAL.energy.price = o.energyPrice || ANAL.energy.price;
    ANAL.energy.escoShare = o.escoShare != null ? o.escoShare : ANAL.energy.escoShare;
  }
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
    const sdR = _sd20(mo.tme, mo.days);
    const stdM = ANAL.std[mo.month]; const sdS = _sd20(stdM[0], stdM[1]);
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
  if (!ANAL || ANAL.type !== 'TYM' || !ANAL.objectId) return;
  let stdSum = 0;
  for (let m = 1; m <= 12; m++) {
    const v = ANAL.std[m]; const sd = _sd20(v[0], v[1]); stdSum += sd;
    const c = document.getElementById('anw-std-sd-' + m); if (c) c.textContent = _fmtA(sd, 1);
  }
  const ss = document.getElementById('anw-std-sum'); if (ss) ss.textContent = _fmtA(stdSum, 1);

  ['before', 'after'].forEach(key => {
    const r = _analComputePeriod(key);
    const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    set(`anw-${key}-phi`, r.phi != null ? _fmtA(r.phi, 4) : '—');
    set(`anw-${key}-days`, r.days || '—');
    set(`anw-${key}-sumr`, _fmtA(r.sumR, 1));
    set(`anw-${key}-sums`, _fmtA(r.sumS, 1));
    set(`anw-${key}-qs`, r.qs != null ? _fmtA(r.qs, 2) : '—');
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
  const savedMoney = savedEnergy * price;
  const escoShare = Number(ANAL.energy.escoShare || 0);
  const escoAmount = savedMoney * escoShare / 100;
  const clientAmount = savedMoney - escoAmount;

  ANAL.results = { before, after, savedEnergy, savedPct, savedMoney, escoShare, escoAmount, clientAmount,
    unit: ANAL.energy.unit, currency: ANAL.energy.currency, at: new Date().toISOString() };
  const slot = document.getElementById('anw-results');
  if (slot) { slot.innerHTML = _analResults(); slot.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  const bar = document.querySelector('.anw-steps'); if (bar) bar.outerHTML = _analStepsBar();
}

function _analResults() {
  const r = ANAL.results; if (!r) return '';
  const u = r.unit, cur = r.currency, pos = r.savedPct >= 0;
  return `
  <div class="anw-sec" style="border-color:#27500A;">
    <div class="anw-head anw-after"><span class="ico">✅</span><h3>Wynik analizy — korekta stopniodni</h3>
      <button class="small-button" style="margin-left:auto;" onclick="analSave()">💾 Zapisz analizę</button></div>
    <div class="anw-body">
      <div class="anw-hero">
        <div><div class="lbl">Oszczędność (OSZ)</div><div class="big">${pos ? '' : '−'}${_fmtA(Math.abs(r.savedPct), 1)}%</div></div>
        <div><div class="lbl">Energia zaoszczędzona</div><div class="big">${_fmtA(r.savedEnergy, 2)} <span style="font-size:16px;">${u}</span></div></div>
        <div><div class="lbl">Wartość oszczędności</div><div class="big">${_fmtA(r.savedMoney, 2)} <span style="font-size:16px;">${cur}</span></div></div>
      </div>
      <div class="anw-rgrid">
        <div class="anw-tile"><div class="v">${_fmtA(r.before.qs, 2)} ${u}</div><div class="k">Qs PRZED (skorygowane) · φ=${_fmtA(r.before.phi, 4)}</div></div>
        <div class="anw-tile"><div class="v">${_fmtA(r.after.qs, 2)} ${u}</div><div class="k">Qs PO (skorygowane) · φ=${_fmtA(r.after.phi, 4)}</div></div>
        <div class="anw-tile"><div class="v">${_fmtA(r.escoAmount, 2)} ${cur}</div><div class="k">Udział WaterAI/ESCO (${_fmtA(r.escoShare, 0)}%)</div></div>
        <div class="anw-tile"><div class="v">${_fmtA(r.clientAmount, 2)} ${cur}</div><div class="k">Udział klienta</div></div>
      </div>
      <div class="anw-note" style="margin-top:14px;">OSZ = (Qs<sub>przed</sub> − Qs<sub>po</sub>) / Qs<sub>przed</sub> · 100% &nbsp;|&nbsp; Qs = Qc.o.·φ &nbsp;|&nbsp; φ = ∑SD20_stand / ∑SD20_rzecz &nbsp;|&nbsp; SD20 = z₀·(20 − tₘₑ)</div>
    </div>
  </div>`;
}

function analSave() {
  if (!ANAL.results) return;
  const o = ObjectsModule.find(ANAL.objectId);
  const r = ANAL.results;
  AnalysesModule.add({
    clientId: ANAL.clientId,
    objectId: ANAL.objectId,
    name: `${AnalysesModule.TYPES[ANAL.type].label} — ${o ? o.name : ''}`,
    analysisType: ANAL.type,
    executedAt: new Date().toISOString().slice(0, 10),
    status: 'COMPLETE',
    inputParams: {
      std: ANAL.std, before: ANAL.before, after: ANAL.after,
      energyUnit: ANAL.energy.unit, currency: ANAL.energy.currency,
      energyPrice: ANAL.energy.price, escoShare: ANAL.energy.escoShare,
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
  });
  alert('Analiza zapisana.');
  _analResetState();
  renderAnalysesModule();
}

// ── podgląd / raport ────────────────────────────────────────────────────────────
function analView(id) {
  const a = AnalysesModule.find(id); if (!a) return;
  const o = ObjectsModule.find(a.objectId), c = ClientsModule.find(a.clientId);
  const r = a.results || {}, ip = a.inputParams || {};
  const container = document.getElementById('module-content'); if (!container) return;
  const pct = r.savedEnergyPct != null ? ((r.savedEnergyPct < 1 ? r.savedEnergyPct * 100 : r.savedEnergyPct)).toFixed(1) + '%' : '—';
  container.innerHTML = ANAL_STYLE + `
    <button class="small-button" onclick="renderAnalysesModule()" style="margin-bottom:16px;">← Lista analiz</button>
    <div class="anw-sec"><div class="anw-head anw-blue"><span class="ico">${(AnalysesModule.TYPES[a.analysisType] || {}).icon || '📊'}</span><h3>${_escA(a.name)}</h3></div>
      <div class="anw-body">
        <div class="anw-ctx" style="margin-top:0;">
          <span>Klient: <b>${_escA((c && c.name) || '—')}</b></span>
          <span>Obiekt: <b>${_escA((o && o.name) || '—')}</b></span>
          <span>Data: <b>${_fmtDateA(a.executedAt)}</b></span>
          <span>Metoda: <b>${_escA((AnalysesModule.TYPES[a.analysisType] || {}).label || a.analysisType)}</b></span>
        </div>
        <div class="anw-rgrid" style="margin-top:16px;">
          <div class="anw-tile"><div class="v">${pct}</div><div class="k">Oszczędność (OSZ)</div></div>
          <div class="anw-tile"><div class="v">${r.savedEnergy != null ? Number(r.savedEnergy).toFixed(2) + ' ' + (ip.energyUnit || '') : '—'}</div><div class="k">Energia zaoszczędzona</div></div>
          <div class="anw-tile"><div class="v">${r.savedMoney != null ? Number(r.savedMoney).toFixed(2) + ' ' + (ip.currency || '') : '—'}</div><div class="k">Wartość oszczędności</div></div>
          <div class="anw-tile"><div class="v">${r.phiBefore != null ? Number(r.phiBefore).toFixed(4) : '—'} / ${r.phiAfter != null ? Number(r.phiAfter).toFixed(4) : '—'}</div><div class="k">φ PRZED / PO</div></div>
        </div>
        <div class="anw-act" style="justify-content:flex-start;">
          <button class="primary-button" onclick="analGenerateReport(${a.id})">⚡ Generuj raport ESCO</button>
        </div>
      </div></div>`;
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

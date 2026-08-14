// WaterAI Energy Control
// Document Folders Module v2.0.0 — Supabase (tabela `doc_folders`) przez mostek WaterAIBridge.
// Struktura:
//   type: 'client'  → katalog główny klienta (auto)
//   type: 'object'  → katalog obiektu (auto, przy pierwszym dok.)
//   type: 'custom'  → własny katalog użytkownika
//
// parentId: null → korzeń (poziom klienta)
//           id   → podfolder

const _docFoldersStore = (window.WaterAIBridge && WaterAIBridge.makeStore)
  ? WaterAIBridge.makeStore({
      table: 'doc_folders',
      storageKey: 'waterai_doc_folders_v1',
      label: 'folderów dokumentów',
      fk2: { column: 'client_id', prop: 'clientId', module: () => window.ClientsModule }
    })
  : (console.warn('[DocFoldersModule] Brak WaterAIBridge — tryb lokalny (localStorage).'), {
      storageKey: 'waterai_doc_folders_v1',
      async load() {},
      getAll() { return JSON.parse(localStorage.getItem(this.storageKey) || '[]'); },
      saveAll(items) { localStorage.setItem(this.storageKey, JSON.stringify(items)); }
    });

const DocFoldersModule = {
  ..._docFoldersStore,

  add(folder) {
    const items = this.getAll();
    const id = (window._waNextIdFor ? _waNextIdFor(items) : Date.now());
    items.push({
      id,
      createdAt: new Date().toISOString(),
      clientId:  Number(folder.clientId),
      objectId:  folder.objectId ? Number(folder.objectId) : null,
      parentId:  folder.parentId ? Number(folder.parentId) : null,
      type:      folder.type || 'custom',   // 'client' | 'object' | 'custom'
      name:      folder.name || 'Nowy folder',
      icon:      folder.icon || '📁'
    });
    this.saveAll(items);
    return id;
  },

  update(id, data) {
    this.saveAll(this.getAll().map(f =>
      Number(f.id) !== Number(id) ? f : { ...f, ...data }
    ));
  },

  // Zwraca id usuwanego folderu wraz ze wszystkimi podfolderami (bez usuwania).
  // Potrzebne, żeby policzyć i przenieść dokumenty z CAŁEGO poddrzewa — samo
  // `folderId === id` pomija pliki leżące w podfolderach.
  descendantIds(id) {
    const all = this.getAll();
    const out = new Set();
    const collect = (fid) => {
      if (out.has(Number(fid))) return;          // osłona przed cyklem parentId
      out.add(Number(fid));
      all.filter(f => Number(f.parentId) === Number(fid)).forEach(f => collect(f.id));
    };
    collect(id);
    return Array.from(out);
  },

  remove(id) {
    // Usuwa folder wraz z podfolderami. Dokumenty z CAŁEGO poddrzewa są
    // przenoszone do folderu głównego klienta — bez tego zostawały osierocone:
    // znikały z drzewa, ale nadal zajmowały miejsce w bazie i w buckecie,
    // a użytkownik nie miał jak ich odzyskać.
    const all = this.getAll();
    const toRemove = new Set(this.descendantIds(id).map(Number));
    const removed = all.filter(f => toRemove.has(Number(f.id)));

    if (window.DocumentsModule && typeof DocumentsModule.getAll === 'function') {
      const clientId = removed.length ? removed[0].clientId : null;
      const root = all.find(f =>
        Number(f.clientId) === Number(clientId) && f.type === 'client' && !f.parentId &&
        !toRemove.has(Number(f.id)));
      const target = root ? root.id : null;
      DocumentsModule.getAll()
        .filter(d => toRemove.has(Number(d.folderId)))
        .forEach(d => DocumentsModule.update(d.id, { folderId: target }));
    }

    this.saveAll(all.filter(f => !toRemove.has(Number(f.id))));
    return Array.from(toRemove);
  },

  find(id) {
    return this.getAll().find(f => Number(f.id) === Number(id));
  },

  findByClient(clientId) {
    return this.getAll().filter(f => Number(f.clientId) === Number(clientId));
  },

  // Ensure client root folder exists, return its id
  ensureClientFolder(clientId, clientName) {
    const existing = this.getAll().find(f =>
      Number(f.clientId) === Number(clientId) && f.type === 'client' && !f.parentId
    );
    if (existing) return existing.id;
    return this.add({ clientId, name: clientName, type: 'client', icon: '👤', parentId: null });
  },

  // Ensure object folder exists under client root, return its id
  ensureObjectFolder(clientId, objectId, objectName) {
    const existing = this.getAll().find(f =>
      Number(f.clientId) === Number(clientId) &&
      Number(f.objectId) === Number(objectId) &&
      f.type === 'object'
    );
    if (existing) return existing.id;
    const clientFolderId = this.ensureClientFolder(clientId, '');
    return this.add({ clientId, objectId, name: objectName, type: 'object', icon: '🏗️', parentId: clientFolderId });
  },

  // Get children of a folder
  getChildren(folderId) {
    return this.getAll().filter(f => Number(f.parentId) === Number(folderId));
  },

  // Build tree for a client
  buildTree(clientId) {
    const folders = this.findByClient(clientId);
    const root = folders.find(f => f.type === 'client' && !f.parentId);
    if (!root) return null;

    const buildNode = (folder) => ({
      ...folder,
      children: folders
        .filter(f => Number(f.parentId) === Number(folder.id))
        .sort((a, b) => {
          // objects first, then custom alphabetically
          if (a.type === 'object' && b.type !== 'object') return -1;
          if (b.type === 'object' && a.type !== 'object') return 1;
          return a.name.localeCompare(b.name);
        })
        .map(buildNode)
    });

    return buildNode(root);
  }
};

window.DocFoldersModule = DocFoldersModule;

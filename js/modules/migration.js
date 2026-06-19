// WaterAI Energy Control
// Migration Module v1.2.0
//
// NAPRAWA: migracja v1→v2 wykonuje się teraz DOKŁADNIE RAZ (znacznik w localStorage),
// a po zakończeniu stary klucz v1 jest usuwany. Dzięki temu rekord skasowany przez
// użytkownika w v2 nie jest ponownie wstawiany przy każdym odświeżeniu strony.

const MigrationModule = {

  run() {
    this.migrateClients();
    this.migrateObjects();
    this.migrateWorkflowToCalendar();
    console.log('[WaterAI] Migration complete.');
  },

  migrateClients() {
    // Jeśli migracja już się odbyła — nic nie rób (kluczowa zmiana).
    if (localStorage.getItem('waterai_clients_v1_migrated')) return;

    const v2 = JSON.parse(localStorage.getItem('waterai_clients_v2') || '[]');
    const v1 = JSON.parse(localStorage.getItem('waterai_clients_v1') || '[]');

    if (v1.length) {
      const v2ids = new Set(v2.map(c => Number(c.id)));
      const toAdd = v1.filter(c => !v2ids.has(Number(c.id))).map(c => ({
        ...c,
        regon: c.regon || '',
        status: c.status || 'ACTIVE',
        cooperationStartDate: c.cooperationStartDate || '',
        notes: c.notes || ''
      }));
      if (toAdd.length) {
        localStorage.setItem('waterai_clients_v2', JSON.stringify([...v2, ...toAdd]));
        console.log('[WaterAI] Migrated ' + toAdd.length + ' clients v1→v2');
      }
    }

    // Migracja zakończona: usuń stary klucz i ustaw znacznik, żeby już nigdy nie wróciła.
    localStorage.removeItem('waterai_clients_v1');
    localStorage.setItem('waterai_clients_v1_migrated', new Date().toISOString());
  },

  migrateObjects() {
    if (localStorage.getItem('waterai_objects_v1_migrated')) return;

    const v2 = JSON.parse(localStorage.getItem('waterai_objects_v2') || '[]');
    const v1 = JSON.parse(localStorage.getItem('waterai_objects_v1') || '[]');

    if (v1.length) {
      const v2ids = new Set(v2.map(o => Number(o.id)));
      const toAdd = v1.filter(o => !v2ids.has(Number(o.id))).map(o => ({
        ...o,
        totalArea: o.totalArea || 0,
        heatedArea: o.heatedArea || 0,
        cooledArea: o.cooledArea || 0,
        yearBuilt: o.yearBuilt || null,
        description: o.description || '',
        contractStartDate: o.contractStartDate || '',
        contractEndDate: o.contractEndDate || '',
        installationDate: o.installationDate || '',
        commissioningDate: o.commissioningDate || '',
        settlementModel: o.settlementModel || 'ESCO',
        escoShare: o.escoShare || 50,
        paymentDays: o.paymentDays || 14,
        invoiceEmail: o.invoiceEmail || '',
        salesRepresentative: o.salesRepresentative || ''
      }));
      if (toAdd.length) {
        localStorage.setItem('waterai_objects_v2', JSON.stringify([...v2, ...toAdd]));
        console.log('[WaterAI] Migrated ' + toAdd.length + ' objects v1→v2');
      }
    }

    localStorage.removeItem('waterai_objects_v1');
    localStorage.setItem('waterai_objects_v1_migrated', new Date().toISOString());
  },

  migrateWorkflowToCalendar() {
    if (localStorage.getItem('waterai_calendar_v1')) return;
    const old = JSON.parse(localStorage.getItem('waterai_workflow_v1') || '[]');
    if (!old.length) return;
    const migrated = old.map(w => ({
      id: w.id,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt || w.createdAt,
      clientId: w.clientId,
      objectId: w.objectId,
      title: w.title || '',
      description: w.description || '',
      eventType: w.taskType || 'REMINDER',
      dueDate: w.dueDate || w.firstReminderDate || '',
      reminderDays: [0, 1, 7, 30],
      status: w.status === 'DONE' ? 'DONE' : 'PENDING',
      completedAt: w.completedAt || null,
      completedBy: '',
      recurrence: w.scheduleType === 'ONE_TIME' ? 'ONE_TIME' : 'MONTHLY',
      recurrenceEndDate: null,
      responsibleRole: w.responsibleRole || 'BACK_OFFICE',
      responsiblePerson: '',
      linkedDocumentId: null,
      linkedInvoiceId: null,
      linkedMeasurementId: w.measurementId || null,
      linkedProtocolId: null,
      externalSystem: w.externalSystem || '',
      externalTaskId: w.externalTaskId || '',
      syncStatus: w.syncStatus || 'NOT_SYNCED'
    }));
    localStorage.setItem('waterai_calendar_v1', JSON.stringify(migrated));
    console.log('[WaterAI] Migrated ' + migrated.length + ' workflow items → calendar');
  }
};

window.MigrationModule = MigrationModule;

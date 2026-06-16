// WaterAI Energy Control
// Migration Module v1.0.0
// Jednorazowa migracja danych przy starcie aplikacji

const MigrationModule = {

  run() {
    this.migrateClients();
    this.migrateObjects();
    this.migrateWorkflowToCalendar();
    console.log('[WaterAI] Migration complete.');
  },

  migrateClients() {
    if (localStorage.getItem('waterai_clients_v2')) return; // już migrowano
    const old = JSON.parse(localStorage.getItem('waterai_clients_v1') || '[]');
    if (!old.length) return;
    const migrated = old.map(c => ({
      ...c,
      regon: c.regon || '',
      status: c.status || 'ACTIVE',
      cooperationStartDate: c.cooperationStartDate || '',
      notes: c.notes || ''
    }));
    localStorage.setItem('waterai_clients_v2', JSON.stringify(migrated));
    console.log(`[WaterAI] Migrated ${migrated.length} clients v1→v2`);
  },

  migrateObjects() {
    if (localStorage.getItem('waterai_objects_v2')) return;
    const old = JSON.parse(localStorage.getItem('waterai_objects_v1') || '[]');
    if (!old.length) return;
    const migrated = old.map(o => ({
      ...o,
      totalArea: o.totalArea || 0,
      heatedArea: o.heatedArea || 0,
      cooledArea: o.cooledArea || 0,
      yearBuilt: o.yearBuilt || null,
      description: o.description || ''
    }));
    localStorage.setItem('waterai_objects_v2', JSON.stringify(migrated));
    console.log(`[WaterAI] Migrated ${migrated.length} objects v1→v2`);
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
    console.log(`[WaterAI] Migrated ${migrated.length} workflow items → calendar`);
  }
};

window.MigrationModule = MigrationModule;

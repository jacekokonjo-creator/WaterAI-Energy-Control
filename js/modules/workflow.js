// WaterAI Energy Control
// Workflow Module v1.1.0

const WorkflowModule = {
  storageKey: "waterai_workflow_v1",

  getAll() {
    return JSON.parse(localStorage.getItem(this.storageKey) || "[]");
  },

  saveAll(items) {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  },

  add(item) {
    const items = this.getAll();

    items.push({
      id: Date.now(),
      createdAt: new Date().toISOString(),

      clientId: Number(item.clientId),
      objectId: Number(item.objectId),

      title: item.title || "",
      description: item.description || "",
      taskType: item.taskType || "REQUEST_INVOICE",

      responsibleRole: item.responsibleRole || "BACK_OFFICE",
      priority: item.priority || "NORMAL",
      status: item.status || "NEW",

      scheduleType: item.scheduleType || "ONE_TIME",
      firstReminderDate: item.firstReminderDate || "",
      dueDate: item.dueDate || "",
      completedAt: "",

      documentRequired: Boolean(item.documentRequired),

      invoiceId: item.invoiceId || "",
      reportId: item.reportId || "",
      measurementId: item.measurementId || "",
      templateId: item.templateId || "",

      externalSystem: "ESPOCRM",
      externalTaskId: "",
      externalCaseId: "",
      externalCalendarEventId: "",
      syncStatus: "NOT_SYNCED",
      lastSyncAt: ""
    });

    this.saveAll(items);
  },

  remove(id) {
    const items = this.getAll().filter(item => item.id !== Number(id));
    this.saveAll(items);
  },

  find(id) {
    return this.getAll().find(item => item.id === Number(id));
  },

  findByObject(objectId) {
    return this.getAll().filter(item => item.objectId === Number(objectId));
  },

  update(id, updatedItem) {
    const items = this.getAll().map(item => {
      if (item.id !== Number(id)) return item;

      return {
        ...item,
        ...updatedItem,
        updatedAt: new Date().toISOString()
      };
    });

    this.saveAll(items);
  },

  markDone(id) {
    this.update(id, {
      status: "DONE",
      completedAt: new Date().toISOString()
    });
  }
};

window.WorkflowModule = WorkflowModule;

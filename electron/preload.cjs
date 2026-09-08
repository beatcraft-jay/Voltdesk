const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  /* =========================================
     CLIENTS
  ========================================= */
  clients: {
    getAll: () => ipcRenderer.invoke("clients:getAll"),
    create: (client) => ipcRenderer.invoke("clients:create", client),
    update: (client) => ipcRenderer.invoke("clients:update", client),
    delete: (id) => ipcRenderer.invoke("clients:delete", id),
  },

  /* =========================================
     QUOTATIONS
  ========================================= */
  quotations: {
    getAll: () => ipcRenderer.invoke("quotations:getAll"),
    getById: (id) => ipcRenderer.invoke("quotations:getById", id),
    create: (quotation) =>
      ipcRenderer.invoke("quotations:create", quotation),
    update: (quotation) =>
      ipcRenderer.invoke("quotations:update", quotation),
    delete: (id) => ipcRenderer.invoke("quotations:delete", id),
  },

  /* =========================================
     PROJECTS
  ========================================= */
  projects: {
    getAll: () => ipcRenderer.invoke("projects:getAll"),
    getById: (id) => ipcRenderer.invoke("projects:getById", id),
    getByQuotationId: (quotationId) =>
      ipcRenderer.invoke("projects:getByQuotationId", quotationId),
    create: (project) =>
      ipcRenderer.invoke("projects:create", project),
    update: (project) =>
      ipcRenderer.invoke("projects:update", project),
    updateByQuotationId: (quotationId, updates) =>
      ipcRenderer.invoke("projects:updateByQuotationId", quotationId, updates),
    delete: (id) => ipcRenderer.invoke("projects:delete", id),
  },

  /* =========================================
     MATERIALS
  ========================================= */
  materials: {
    getAll: () => ipcRenderer.invoke("materials:getAll"),
    getById: (id) => ipcRenderer.invoke("materials:getById", id),
    create: (material) => ipcRenderer.invoke("materials:create", material),
    update: (material) => ipcRenderer.invoke("materials:update", material),
    delete: (id) => ipcRenderer.invoke("materials:delete", id),

    /* -----------------------------------------
       MATERIAL IMAGE SEARCH
    ----------------------------------------- */
    searchImages: (query) =>
      ipcRenderer.invoke("materials:searchImages", query),

    saveImage: (payload) =>
      ipcRenderer.invoke("materials:saveImage", payload),

    removeImage: (materialId) =>
      ipcRenderer.invoke("materials:removeImage", materialId),
  },

  /* =========================================
     INVOICES
  ========================================= */
  invoices: {
    getAll: () => ipcRenderer.invoke("invoices:getAll"),
    getById: (id) => ipcRenderer.invoke("invoices:getById", id),
    create: (invoice) => ipcRenderer.invoke("invoices:create", invoice),
    update: (invoice) => ipcRenderer.invoke("invoices:update", invoice),
    delete: (id) => ipcRenderer.invoke("invoices:delete", id),
  },

  /* =========================================
     RECEIPTS
  ========================================= */
  receipts: {
    getAll: () => ipcRenderer.invoke("receipts:getAll"),
    getById: (id) => ipcRenderer.invoke("receipts:getById", id),
    create: (receipt) => ipcRenderer.invoke("receipts:create", receipt),
    update: (receipt) => ipcRenderer.invoke("receipts:update", receipt),
    delete: (id) => ipcRenderer.invoke("receipts:delete", id),
  },

  /* =========================================
     EXPENSES
  ========================================= */
  expenses: {
    getAll: () => ipcRenderer.invoke("expenses:getAll"),
    getById: (id) => ipcRenderer.invoke("expenses:getById", id),
    create: (expense) => ipcRenderer.invoke("expenses:create", expense),
    update: (expense) => ipcRenderer.invoke("expenses:update", expense),
    delete: (id) => ipcRenderer.invoke("expenses:delete", id),
  },

  /* =========================================
     PDF / PRINTING
  ========================================= */
  printToPDF: (html, filename) =>
    ipcRenderer.invoke("print-to-pdf", html, filename),

  /* =========================================
     SETTINGS - FULLY FIXED
  ========================================= */
  settings: {
    // Gemini
    getGeminiKey: () =>
      ipcRenderer.invoke("settings:getGeminiKey"),
    setGeminiKey: (key) =>
      ipcRenderer.invoke("settings:setGeminiKey", key),

    // Google Image Search
    getGoogleImagesKey: () =>
      ipcRenderer.invoke("settings:getGoogleImagesKey"),
    setGoogleImagesKey: (key) =>
      ipcRenderer.invoke("settings:setGoogleImagesKey", key),
    getGoogleSearchEngineId: () =>
      ipcRenderer.invoke("settings:getGoogleSearchEngineId"),
    setGoogleSearchEngineId: (id) =>
      ipcRenderer.invoke("settings:setGoogleSearchEngineId", id),
  },

  /* =========================================
     AI - Gemini Chat
  ========================================= */
  ai: {
    chat: (payload) =>
      ipcRenderer.invoke("ai:chat", payload),
  },
});
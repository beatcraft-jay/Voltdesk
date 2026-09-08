const Database = require("better-sqlite3");
const { app } = require("electron");
const path = require("path");

let db;

/* =========================================
   DATABASE INITIALIZATION
========================================= */

function initializeDatabase() {
  const databasePath = path.join(
    app.getPath("userData"),
    "voltdesk.db"
  );

  db = new Database(databasePath);

  db.pragma("foreign_keys = ON");

  /* =========================================
     CLIENTS
  ========================================= */

  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      location TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  /* =========================================
     QUOTATIONS
  ========================================= */

  db.exec(`
    CREATE TABLE IF NOT EXISTS quotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      quotation_number TEXT NOT NULL UNIQUE,

      client_id INTEGER,

      client_name TEXT NOT NULL,
      client_phone TEXT,
      client_email TEXT,
      client_location TEXT,

      subject TEXT,
      description TEXT,

      subtotal REAL DEFAULT 0,
      labour_cost REAL DEFAULT 0,
      transport_cost REAL DEFAULT 0,
      transport_description TEXT DEFAULT '',
      total REAL DEFAULT 0,

      status TEXT DEFAULT 'Draft',

      terms TEXT,

      created_at TEXT DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (client_id)
        REFERENCES clients(id)
        ON DELETE SET NULL
    )
  `);

  ensureColumn(
    "quotations",
    "transport_cost",
    "REAL DEFAULT 0"
  );

  ensureColumn(
    "quotations",
    "transport_description",
    "TEXT DEFAULT ''"
  );

  /* =========================================
     QUOTATION ITEMS
  ========================================= */

  db.exec(`
    CREATE TABLE IF NOT EXISTS quotation_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      quotation_id INTEGER NOT NULL,

      item_name TEXT NOT NULL,
      description TEXT,

      quantity REAL DEFAULT 1,

      unit TEXT,

      unit_price REAL DEFAULT 0,

      total REAL DEFAULT 0,

      FOREIGN KEY (quotation_id)
        REFERENCES quotations(id)
        ON DELETE CASCADE
    )
  `);

  /* =========================================
     PROJECTS
  ========================================= */

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      name TEXT NOT NULL,

      client TEXT,
      location TEXT,

      start_date TEXT,

      estimated_value REAL DEFAULT 0,

      status TEXT DEFAULT 'Not Started',

      progress INTEGER DEFAULT 0,

      quotation_id INTEGER,

      created_at TEXT DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (quotation_id)
        REFERENCES quotations(id)
        ON DELETE SET NULL
    )
  `);

  /* =========================================
     MATERIALS
  ========================================= */

  db.exec(`
    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      name TEXT NOT NULL,

      category TEXT,

      unit TEXT DEFAULT 'pcs',

      price REAL DEFAULT 0,

      supplier TEXT,

      notes TEXT,

      image_path TEXT,

      image_url TEXT,

      image_source TEXT,

      created_at TEXT DEFAULT CURRENT_TIMESTAMP,

      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  /*
   * These migrations are important because the database
   * may already exist on the user's computer.
   */
  ensureColumn(
    "materials",
    "image_path",
    "TEXT"
  );

  ensureColumn(
    "materials",
    "image_url",
    "TEXT"
  );

  ensureColumn(
    "materials",
    "image_source",
    "TEXT"
  );

  /* =========================================
     MATERIAL INDEXES
  ========================================= */

  db.exec(`
    CREATE INDEX IF NOT EXISTS
    idx_materials_category
    ON materials(category)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS
    idx_materials_name
    ON materials(name)
  `);

  /* =========================================
     INVOICES
  ========================================= */

  db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      invoice_number TEXT NOT NULL UNIQUE,

      quotation_id INTEGER,

      client_id INTEGER,

      client_name TEXT NOT NULL,
      client_phone TEXT,
      client_email TEXT,
      client_location TEXT,

      subject TEXT,
      description TEXT,

      subtotal REAL DEFAULT 0,

      labour_cost REAL DEFAULT 0,

      transport_cost REAL DEFAULT 0,

      transport_description TEXT DEFAULT '',

      tax_rate REAL DEFAULT 0,

      tax_amount REAL DEFAULT 0,

      discount REAL DEFAULT 0,

      total REAL DEFAULT 0,

      amount_paid REAL DEFAULT 0,

      status TEXT DEFAULT 'Draft',

      due_date TEXT,

      terms TEXT,

      notes TEXT,

      payment_info TEXT,

      created_at TEXT DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (quotation_id)
        REFERENCES quotations(id)
        ON DELETE SET NULL,

      FOREIGN KEY (client_id)
        REFERENCES clients(id)
        ON DELETE SET NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      invoice_id INTEGER NOT NULL,

      item_name TEXT NOT NULL,

      description TEXT,

      quantity REAL DEFAULT 1,

      unit TEXT,

      unit_price REAL DEFAULT 0,

      total REAL DEFAULT 0,

      FOREIGN KEY (invoice_id)
        REFERENCES invoices(id)
        ON DELETE CASCADE
    )
  `);

  /* =========================================
     INVOICE MIGRATIONS
  ========================================= */

  ensureColumn(
    "invoices",
    "quotation_id",
    "INTEGER"
  );

  ensureColumn(
    "invoices",
    "client_id",
    "INTEGER"
  );

  ensureColumn(
    "invoices",
    "client_phone",
    "TEXT"
  );

  ensureColumn(
    "invoices",
    "client_email",
    "TEXT"
  );

  ensureColumn(
    "invoices",
    "client_location",
    "TEXT"
  );

  ensureColumn(
    "invoices",
    "subject",
    "TEXT"
  );

  ensureColumn(
    "invoices",
    "description",
    "TEXT"
  );

  ensureColumn(
    "invoices",
    "subtotal",
    "REAL DEFAULT 0"
  );

  ensureColumn(
    "invoices",
    "labour_cost",
    "REAL DEFAULT 0"
  );

  ensureColumn(
    "invoices",
    "transport_cost",
    "REAL DEFAULT 0"
  );

  ensureColumn(
    "invoices",
    "transport_description",
    "TEXT DEFAULT ''"
  );

  ensureColumn(
    "invoices",
    "tax_rate",
    "REAL DEFAULT 0"
  );

  ensureColumn(
    "invoices",
    "tax_amount",
    "REAL DEFAULT 0"
  );

  ensureColumn(
    "invoices",
    "discount",
    "REAL DEFAULT 0"
  );

  ensureColumn(
    "invoices",
    "total",
    "REAL DEFAULT 0"
  );

  ensureColumn(
    "invoices",
    "amount_paid",
    "REAL DEFAULT 0"
  );

  ensureColumn(
    "invoices",
    "status",
    "TEXT DEFAULT 'Draft'"
  );

  ensureColumn(
    "invoices",
    "due_date",
    "TEXT"
  );

  ensureColumn(
    "invoices",
    "terms",
    "TEXT"
  );

  ensureColumn(
    "invoices",
    "notes",
    "TEXT"
  );

  ensureColumn(
    "invoices",
    "payment_info",
    "TEXT"
  );

  /* =========================================
     RECEIPTS
  ========================================= */

  db.exec(`
    CREATE TABLE IF NOT EXISTS receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      receipt_number TEXT NOT NULL UNIQUE,

      invoice_id INTEGER,

      client_id INTEGER,

      client_name TEXT NOT NULL,

      client_phone TEXT,

      client_email TEXT,

      client_location TEXT,

      invoice_number TEXT,

      amount REAL DEFAULT 0,

      payment_method TEXT DEFAULT 'Cash',

      payment_reference TEXT,

      notes TEXT,

      received_date TEXT,

      received_by TEXT,

      created_at TEXT DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (invoice_id)
        REFERENCES invoices(id)
        ON DELETE SET NULL,

      FOREIGN KEY (client_id)
        REFERENCES clients(id)
        ON DELETE SET NULL
    )
  `);

  ensureColumn(
    "receipts",
    "invoice_id",
    "INTEGER"
  );

  ensureColumn(
    "receipts",
    "client_id",
    "INTEGER"
  );

  ensureColumn(
    "receipts",
    "client_phone",
    "TEXT"
  );

  ensureColumn(
    "receipts",
    "client_email",
    "TEXT"
  );

  ensureColumn(
    "receipts",
    "client_location",
    "TEXT"
  );

  ensureColumn(
    "receipts",
    "invoice_number",
    "TEXT"
  );

  ensureColumn(
    "receipts",
    "amount",
    "REAL DEFAULT 0"
  );

  ensureColumn(
    "receipts",
    "payment_method",
    "TEXT DEFAULT 'Cash'"
  );

  ensureColumn(
    "receipts",
    "payment_reference",
    "TEXT"
  );

  ensureColumn(
    "receipts",
    "notes",
    "TEXT"
  );

  ensureColumn(
    "receipts",
    "received_date",
    "TEXT"
  );

  ensureColumn(
    "receipts",
    "received_by",
    "TEXT"
  );

  /* =========================================
     EXPENSES
  ========================================= */

  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      description TEXT NOT NULL,

      category TEXT DEFAULT 'Other',

      amount REAL DEFAULT 0,

      expense_date TEXT,

      project_id INTEGER,

      project_name TEXT,

      paid_to TEXT,

      payment_method TEXT DEFAULT 'Cash',

      notes TEXT,

      created_at TEXT DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE SET NULL
    )
  `);

  ensureColumn(
    "expenses",
    "category",
    "TEXT DEFAULT 'Other'"
  );

  ensureColumn(
    "expenses",
    "amount",
    "REAL DEFAULT 0"
  );

  ensureColumn(
    "expenses",
    "expense_date",
    "TEXT"
  );

  ensureColumn(
    "expenses",
    "project_id",
    "INTEGER"
  );

  ensureColumn(
    "expenses",
    "project_name",
    "TEXT"
  );

  ensureColumn(
    "expenses",
    "paid_to",
    "TEXT"
  );

  ensureColumn(
    "expenses",
    "payment_method",
    "TEXT DEFAULT 'Cash'"
  );

  ensureColumn(
    "expenses",
    "notes",
    "TEXT"
  );

  /* =========================================
     MATERIAL MIGRATIONS
  ========================================= */

  migrateCableUnits();

  /* =========================================
     SEED MATERIALS
  ========================================= */

  seedMaterials();

  console.log(
    "VoltDesk database ready:",
    databasePath
  );
}

/* =========================================
   SAFE COLUMN MIGRATION
========================================= */

function ensureColumn(
  tableName,
  columnName,
  columnDefinition
) {
  const columns = db
    .prepare(
      `PRAGMA table_info(${tableName})`
    )
    .all();

  const exists = columns.some(
    (column) =>
      column.name === columnName
  );

  if (!exists) {
    db.exec(
      `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`
    );

    console.log(
      `Migrated ${tableName}: added column ${columnName}`
    );
  }
}

/* =========================================
   CLIENT FUNCTIONS
========================================= */

function getAllClients() {
  return db
    .prepare(`
      SELECT *
      FROM clients
      ORDER BY id DESC
    `)
    .all();
}

function getClientById(id) {
  return db
    .prepare(`
      SELECT *
      FROM clients
      WHERE id = ?
    `)
    .get(id);
}

function createClient(
  name,
  phone,
  email,
  location
) {
  const result = db
    .prepare(`
      INSERT INTO clients (
        name,
        phone,
        email,
        location
      )
      VALUES (?, ?, ?, ?)
    `)
    .run(
      name,
      phone || "",
      email || "",
      location || ""
    );

  return getClientById(
    Number(result.lastInsertRowid)
  );
}

function updateClient(
  id,
  name,
  phone,
  email,
  location
) {
  db.prepare(`
    UPDATE clients
    SET
      name = ?,
      phone = ?,
      email = ?,
      location = ?
    WHERE id = ?
  `).run(
    name,
    phone || "",
    email || "",
    location || "",
    id
  );

  return getClientById(id);
}

function deleteClient(id) {
  db.prepare(`
    DELETE FROM clients
    WHERE id = ?
  `).run(id);

  return {
    success: true,
  };
}

/* =========================================
   QUOTATION FUNCTIONS
========================================= */

function getAllQuotations() {
  return db
    .prepare(`
      SELECT *
      FROM quotations
      ORDER BY id DESC
    `)
    .all();
}

function getQuotationById(id) {
  const quotation = db
    .prepare(`
      SELECT *
      FROM quotations
      WHERE id = ?
    `)
    .get(id);

  if (!quotation) {
    return null;
  }

  const items = db
    .prepare(`
      SELECT *
      FROM quotation_items
      WHERE quotation_id = ?
      ORDER BY id ASC
    `)
    .all(id);

  return {
    ...quotation,
    transport_cost:
      Number(quotation.transport_cost) || 0,
    transport_description:
      quotation.transport_description || "",
    labour_cost:
      Number(quotation.labour_cost) || 0,
    subtotal:
      Number(quotation.subtotal) || 0,
    total:
      Number(quotation.total) || 0,
    items,
  };
}

function getQuotationWithItems(id) {
  return getQuotationById(id);
}

function createQuotation(quotation) {
  const transaction = db.transaction(() => {
    const result = db
      .prepare(`
        INSERT INTO quotations (
          quotation_number,
          client_id,
          client_name,
          client_phone,
          client_email,
          client_location,
          subject,
          description,
          subtotal,
          labour_cost,
          transport_cost,
          transport_description,
          total,
          status,
          terms
        )
        VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?
        )
      `)
      .run(
        quotation.quotation_number,

        quotation.client_id || null,

        quotation.client_name,

        quotation.client_phone || "",
        quotation.client_email || "",
        quotation.client_location || "",

        quotation.subject || "",
        quotation.description || "",

        Number(
          quotation.subtotal
        ) || 0,

        Number(
          quotation.labour_cost
        ) || 0,

        Number(
          quotation.transport_cost
        ) || 0,

        quotation.transport_description || "",

        Number(
          quotation.total
        ) || 0,

        quotation.status || "Draft",

        quotation.terms || ""
      );

    const quotationId =
      Number(result.lastInsertRowid);

    const itemStatement =
      db.prepare(`
        INSERT INTO quotation_items (
          quotation_id,
          item_name,
          description,
          quantity,
          unit,
          unit_price,
          total
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

    (quotation.items || []).forEach(
      (item) => {
        itemStatement.run(
          quotationId,

          item.item_name,

          item.description || "",

          Number(
            item.quantity
          ) || 0,

          item.unit || "",

          Number(
            item.unit_price
          ) || 0,

          Number(
            item.total
          ) || 0
        );
      }
    );

    return getQuotationById(
      quotationId
    );
  });

  return transaction();
}

function updateQuotation(quotation) {
  const transaction = db.transaction(() => {
    db.prepare(`
      UPDATE quotations
      SET
        quotation_number = ?,
        client_id = ?,
        client_name = ?,
        client_phone = ?,
        client_email = ?,
        client_location = ?,
        subject = ?,
        description = ?,
        subtotal = ?,
        labour_cost = ?,
        transport_cost = ?,
        transport_description = ?,
        total = ?,
        status = ?,
        terms = ?
      WHERE id = ?
    `).run(
      quotation.quotation_number,

      quotation.client_id || null,

      quotation.client_name,

      quotation.client_phone || "",
      quotation.client_email || "",
      quotation.client_location || "",

      quotation.subject || "",
      quotation.description || "",

      Number(
        quotation.subtotal
      ) || 0,

      Number(
        quotation.labour_cost
      ) || 0,

      Number(
        quotation.transport_cost
      ) || 0,

      quotation.transport_description || "",

      Number(
        quotation.total
      ) || 0,

      quotation.status || "Draft",

      quotation.terms || "",

      quotation.id
    );

    db.prepare(`
      DELETE FROM quotation_items
      WHERE quotation_id = ?
    `).run(quotation.id);

    const itemStatement =
      db.prepare(`
        INSERT INTO quotation_items (
          quotation_id,
          item_name,
          description,
          quantity,
          unit,
          unit_price,
          total
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

    (quotation.items || []).forEach(
      (item) => {
        itemStatement.run(
          quotation.id,

          item.item_name,

          item.description || "",

          Number(
            item.quantity
          ) || 0,

          item.unit || "",

          Number(
            item.unit_price
          ) || 0,

          Number(
            item.total
          ) || 0
        );
      }
    );

    return getQuotationById(
      quotation.id
    );
  });

  return transaction();
}

function deleteQuotation(id) {
  const transaction =
    db.transaction(() => {
      db.prepare(`
        DELETE FROM quotation_items
        WHERE quotation_id = ?
      `).run(id);

      db.prepare(`
        DELETE FROM quotations
        WHERE id = ?
      `).run(id);

      return {
        success: true,
      };
    });

  return transaction();
}

/* =========================================
   PROJECT FUNCTIONS
========================================= */

function getAllProjects() {
  return db
    .prepare(`
      SELECT *
      FROM projects
      ORDER BY id DESC
    `)
    .all();
}

function getProjectById(id) {
  return db
    .prepare(`
      SELECT *
      FROM projects
      WHERE id = ?
    `)
    .get(id);
}

function getProjectByQuotationId(
  quotationId
) {
  return db
    .prepare(`
      SELECT *
      FROM projects
      WHERE quotation_id = ?
      LIMIT 1
    `)
    .get(quotationId);
}

function createProject(project) {
  const result = db
    .prepare(`
      INSERT INTO projects (
        name,
        client,
        location,
        start_date,
        estimated_value,
        status,
        progress,
        quotation_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      project.name,

      project.client || "",

      project.location || "",

      project.start_date || "",

      Number(
        project.estimated_value
      ) || 0,

      project.status ||
        "Not Started",

      Number(
        project.progress
      ) || 0,

      project.quotation_id ||
        null
    );

  return getProjectById(
    Number(result.lastInsertRowid)
  );
}

function updateProject(project) {
  db.prepare(`
    UPDATE projects
    SET
      name = ?,
      client = ?,
      location = ?,
      start_date = ?,
      estimated_value = ?,
      status = ?,
      progress = ?,
      quotation_id = ?
    WHERE id = ?
  `).run(
    project.name,

    project.client || "",

    project.location || "",

    project.start_date || "",

    Number(
      project.estimated_value
    ) || 0,

    project.status ||
      "Not Started",

    Number(
      project.progress
    ) || 0,

    project.quotation_id ||
      null,

    project.id
  );

  return getProjectById(
    project.id
  );
}

function updateProjectByQuotationId(
  quotationId,
  updates
) {
  const existing =
    getProjectByQuotationId(
      quotationId
    );

  if (!existing) {
    return null;
  }

  db.prepare(`
    UPDATE projects
    SET
      name = ?,
      client = ?,
      location = ?,
      estimated_value = ?
    WHERE quotation_id = ?
  `).run(
    updates.name ??
      existing.name,

    updates.client ??
      existing.client ??
      "",

    updates.location ??
      existing.location ??
      "",

    Number(
      updates.estimated_value !==
        undefined
        ? updates.estimated_value
        : existing.estimated_value
    ) || 0,

    quotationId
  );

  return getProjectByQuotationId(
    quotationId
  );
}

function deleteProject(id) {
  db.prepare(`
    DELETE FROM projects
    WHERE id = ?
  `).run(id);

  return {
    success: true,
  };
}

/* =========================================
   MATERIAL FUNCTIONS
========================================= */

function getAllMaterials() {
  return db
    .prepare(`
      SELECT *
      FROM materials
      ORDER BY
        category ASC,
        name ASC
    `)
    .all();
}

function getMaterialById(id) {
  return db
    .prepare(`
      SELECT *
      FROM materials
      WHERE id = ?
    `)
    .get(id);
}

function createMaterial(material) {
  const result = db
    .prepare(`
      INSERT INTO materials (
        name,
        category,
        unit,
        price,
        supplier,
        notes,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
    .run(
      material.name,

      material.category || "",

      material.category === "Cables"
        ? "100m roll"
        : material.unit || "pcs",

      Number(material.price) || 0,

      material.supplier || "",

      material.notes || ""
    );

  return getMaterialById(
    Number(result.lastInsertRowid)
  );
}

function updateMaterial(material) {
  db.prepare(`
    UPDATE materials
    SET
      name = ?,
      category = ?,
      unit = ?,
      price = ?,
      supplier = ?,
      notes = ?,
      updated_at = CURRENT_TIMESTAMP

    WHERE id = ?
  `).run(
    material.name,

    material.category || "",

    material.category === "Cables"
      ? "100m roll"
      : material.unit || "pcs",

    Number(material.price) || 0,

    material.supplier || "",

    material.notes || "",

    material.id
  );

  return getMaterialById(
    material.id
  );
}

function deleteMaterial(id) {
  db.prepare(`
    DELETE FROM materials
    WHERE id = ?
  `).run(id);

  return {
    success: true,
  };
}

/* =========================================
   MATERIAL IMAGE FUNCTIONS
========================================= */

function saveMaterialImage(
  materialId,
  imagePath,
  imageUrl,
  sourceName,
  sourceUrl
) {
  db.prepare(`
    UPDATE materials
    SET
      image_path = ?,
      image_url = ?,
      image_source = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    imagePath || "",
    imageUrl || "",
    sourceName || sourceUrl || "",
    materialId
  );

  return getMaterialById(materialId);
}

function removeMaterialImage(materialId) {
  db.prepare(`
    UPDATE materials
    SET
      image_path = NULL,
      image_url = NULL,
      image_source = NULL,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(materialId);

  return getMaterialById(materialId);
}

/* =========================================
   MATERIAL MIGRATIONS
========================================= */

function migrateCableUnits() {
  db.prepare(`
    UPDATE materials
    SET
      unit = '100m roll'
    WHERE category = 'Cables'
      AND (
        unit IS NULL
        OR unit != '100m roll'
      )
  `).run();
}

/* =========================================
   MATERIAL SEEDING
========================================= */

function seedMaterials() {
  const materials = [
    /* =====================================
       CABLES
       ALL PRICES PER 100 METRE ROLL
    ===================================== */
    [
      "1.0mm² Single Core Copper Cable",
      "Cables",
      "100m roll",
      65000,
      "Uganda Electrical Market",
      "Copper single core cable. 100 metre roll."
    ],
    [
      "1.5mm² Single Core Copper Cable",
      "Cables",
      "100m roll",
      85000,
      "Uganda Electrical Market",
      "Commonly used for lighting circuits. 100 metre roll."
    ],
    [
      "2.5mm² Single Core Copper Cable",
      "Cables",
      "100m roll",
      110000,
      "Uganda Electrical Market",
      "Commonly used for socket circuits. 100 metre roll."
    ],
    [
      "4mm² Single Core Copper Cable",
      "Cables",
      "100m roll",
      190000,
      "Uganda Electrical Market",
      "Higher load circuit cable. 100 metre roll."
    ],
    [
      "6mm² Single Core Copper Cable",
      "Cables",
      "100m roll",
      280000,
      "Uganda Electrical Market",
      "Higher current circuits. 100 metre roll."
    ],
    [
      "10mm² Single Core Copper Cable",
      "Cables",
      "100m roll",
      550000,
      "Uganda Electrical Market",
      "Main supply and higher load applications."
    ],
    [
      "16mm² Single Core Copper Cable",
      "Cables",
      "100m roll",
      850000,
      "Uganda Electrical Market",
      "Heavy-duty copper cable."
    ],
    [
      "25mm² Single Core Copper Cable",
      "Cables",
      "100m roll",
      1350000,
      "Uganda Electrical Market",
      "Heavy-duty copper cable."
    ],
    [
      "1.5mm² Twin Cable",
      "Cables",
      "100m roll",
      210000,
      "Uganda Electrical Market",
      "Twin copper cable."
    ],
    [
      "2.5mm² Twin Cable",
      "Cables",
      "100m roll",
      270000,
      "Uganda Electrical Market",
      "Twin copper cable."
    ],
    [
      "4mm² Twin Cable",
      "Cables",
      "100m roll",
      660000,
      "Uganda Electrical Market",
      "Twin copper cable."
    ],
    [
      "1.5mm² Twin & Earth Cable",
      "Cables",
      "100m roll",
      250000,
      "Uganda Electrical Market",
      "Twin and earth cable."
    ],
    [
      "2.5mm² Twin & Earth Cable",
      "Cables",
      "100m roll",
      350000,
      "Uganda Electrical Market",
      "Twin and earth copper cable."
    ],
    [
      "4mm² Twin & Earth Cable",
      "Cables",
      "100m roll",
      650000,
      "Uganda Electrical Market",
      "Twin and earth cable for higher loads."
    ],
    [
      "1.5mm² 2-Core Flexible Cable",
      "Cables",
      "100m roll",
      230000,
      "Uganda Electrical Market",
      "Flexible copper cable."
    ],
    [
      "2.5mm² 2-Core Flexible Cable",
      "Cables",
      "100m roll",
      360000,
      "Uganda Electrical Market",
      "Flexible copper cable."
    ],
    [
      "2.5mm² 3-Core Flexible Cable",
      "Cables",
      "100m roll",
      480000,
      "Uganda Electrical Market",
      "Flexible copper cable."
    ],
    [
      "2.5mm² 4-Core Flexible Cable",
      "Cables",
      "100m roll",
      610000,
      "Uganda Electrical Market",
      "Flexible copper cable."
    ],
    [
      "4mm² 2-Core Flexible Cable",
      "Cables",
      "100m roll",
      700000,
      "Uganda Electrical Market",
      "Heavy-duty flexible cable."
    ],
    [
      "Solar DC Cable 4mm²",
      "Solar",
      "100m roll",
      350000,
      "Uganda Solar Market",
      "UV resistant solar cable."
    ],
    [
      "Solar DC Cable 6mm²",
      "Solar",
      "100m roll",
      450000,
      "Uganda Solar Market",
      "UV resistant solar cable."
    ],
    /* =====================================
       CONDUIT & TRUNKING
    ===================================== */
    [
      "PVC Conduit Pipe 20mm",
      "Conduit & Trunking",
      "length",
      3500,
      "Uganda Electrical Market",
      "Standard PVC conduit length."
    ],
    [
      "PVC Conduit Pipe 25mm",
      "Conduit & Trunking",
      "length",
      4500,
      "Uganda Electrical Market",
      "Standard PVC conduit length."
    ],
    [
      "PVC Conduit Pipe 32mm",
      "Conduit & Trunking",
      "length",
      6500,
      "Uganda Electrical Market",
      "Standard PVC conduit length."
    ],
    [
      "PVC Conduit Pipe 40mm",
      "Conduit & Trunking",
      "length",
      9000,
      "Uganda Electrical Market",
      "Standard PVC conduit length."
    ],
    [
      "PVC Trunking 25x16mm",
      "Conduit & Trunking",
      "length",
      8000,
      "Uganda Electrical Market",
      "PVC surface trunking."
    ],
    [
      "PVC Trunking 40x25mm",
      "Conduit & Trunking",
      "length",
      12000,
      "Uganda Electrical Market",
      "PVC surface trunking."
    ],
    [
      "PVC Trunking 50x50mm",
      "Conduit & Trunking",
      "length",
      18000,
      "Uganda Electrical Market",
      "PVC surface trunking."
    ],
    [
      "Flexible Conduit 20mm",
      "Conduit & Trunking",
      "metre",
      2800,
      "Uganda Electrical Market",
      "Flexible conduit."
    ],
    [
      "Flexible Conduit 25mm",
      "Conduit & Trunking",
      "metre",
      4000,
      "Uganda Electrical Market",
      "Flexible conduit."
    ],
    [
      "Metal Trunking 50x50mm",
      "Conduit & Trunking",
      "length",
      25000,
      "Uganda Electrical Market",
      "Metal cable trunking."
    ],
    /* =====================================
       TRONIC SWITCHES & SOCKETS
    ===================================== */
    [
      "Tronic 1-Gang 1-Way Switch",
      "Switches & Sockets",
      "pcs",
      5000,
      "Tronic Uganda",
      "1 gang 1 way wall switch."
    ],
    [
      "Tronic 1-Gang 2-Way Switch",
      "Switches & Sockets",
      "pcs",
      6500,
      "Tronic Uganda",
      "1 gang 2 way wall switch."
    ],
    [
      "Tronic 2-Gang 1-Way Switch",
      "Switches & Sockets",
      "pcs",
      8500,
      "Tronic Uganda",
      "2 gang wall switch."
    ],
    [
      "Tronic 2-Gang 2-Way Switch",
      "Switches & Sockets",
      "pcs",
      10500,
      "Tronic Uganda",
      "2 gang 2 way wall switch."
    ],
    [
      "Tronic 3-Gang 1-Way Switch",
      "Switches & Sockets",
      "pcs",
      12000,
      "Tronic Uganda",
      "3 gang wall switch."
    ],
    [
      "Tronic 13A Single Socket Outlet",
      "Switches & Sockets",
      "pcs",
      7000,
      "Tronic Uganda",
      "13 amp single socket outlet."
    ],
    [
      "Tronic 13A Twin Socket Outlet",
      "Switches & Sockets",
      "pcs",
      12000,
      "Tronic Uganda",
      "13 amp twin socket outlet."
    ],
    [
      "Tronic 13A Twin Socket with USB",
      "Switches & Sockets",
      "pcs",
      22000,
      "Tronic Uganda",
      "Twin socket with USB charging."
    ],
    [
      "Tronic Cooker Control Unit",
      "Switches & Sockets",
      "pcs",
      28000,
      "Tronic Uganda",
      "Cooker control unit."
    ],
    [
      "Tronic 20A Double Pole Switch",
      "Switches & Sockets",
      "pcs",
      18000,
      "Tronic Uganda",
      "Double pole isolating switch."
    ],
    [
      "Tronic 45A Cooker Control Unit",
      "Switches & Sockets",
      "pcs",
      32000,
      "Tronic Uganda",
      "45 amp cooker control unit."
    ],
    /* =====================================
       CHINT PROTECTION
    ===================================== */
    [
      "CHINT NB1 6A 1P MCB",
      "Protection",
      "pcs",
      12000,
      "CHINT Uganda",
      "Single pole miniature circuit breaker."
    ],
    [
      "CHINT NB1 10A 1P MCB",
      "Protection",
      "pcs",
      12000,
      "CHINT Uganda",
      "Single pole miniature circuit breaker."
    ],
    [
      "CHINT NB1 16A 1P MCB",
      "Protection",
      "pcs",
      13000,
      "CHINT Uganda",
      "Single pole miniature circuit breaker."
    ],
    [
      "CHINT NB1 20A 1P MCB",
      "Protection",
      "pcs",
      14000,
      "CHINT Uganda",
      "Single pole miniature circuit breaker."
    ],
    [
      "CHINT NB1 25A 1P MCB",
      "Protection",
      "pcs",
      14500,
      "CHINT Uganda",
      "Single pole miniature circuit breaker."
    ],
    [
      "CHINT NB1 32A 1P MCB",
      "Protection",
      "pcs",
      15000,
      "CHINT Uganda",
      "Single pole miniature circuit breaker."
    ],
    [
      "CHINT NB1 40A 1P MCB",
      "Protection",
      "pcs",
      17000,
      "CHINT Uganda",
      "Single pole miniature circuit breaker."
    ],
    [
      "CHINT NB1 63A 1P MCB",
      "Protection",
      "pcs",
      22000,
      "CHINT Uganda",
      "Single pole miniature circuit breaker."
    ],
    [
      "CHINT 16A 2P MCB",
      "Protection",
      "pcs",
      30000,
      "CHINT Uganda",
      "Two pole miniature circuit breaker."
    ],
    [
      "CHINT 32A 2P MCB",
      "Protection",
      "pcs",
      35000,
      "CHINT Uganda",
      "Two pole miniature circuit breaker."
    ],
    [
      "CHINT 63A 2P MCB",
      "Protection",
      "pcs",
      50000,
      "CHINT Uganda",
      "Two pole miniature circuit breaker."
    ],
    [
      "CHINT 32A 3P MCB",
      "Protection",
      "pcs",
      65000,
      "CHINT Uganda",
      "Three phase miniature circuit breaker."
    ],
    [
      "CHINT 63A 3P MCB",
      "Protection",
      "pcs",
      95000,
      "CHINT Uganda",
      "Three phase miniature circuit breaker."
    ],
    [
      "CHINT 40A 4P MCB",
      "Protection",
      "pcs",
      120000,
      "CHINT Uganda",
      "Four pole miniature circuit breaker."
    ],
    [
      "CHINT 63A 4P MCB",
      "Protection",
      "pcs",
      160000,
      "CHINT Uganda",
      "Four pole miniature circuit breaker."
    ],
    [
      "CHINT 40A RCCB 2P 30mA",
      "Protection",
      "pcs",
      65000,
      "CHINT Uganda",
      "Residual current circuit breaker."
    ],
    [
      "CHINT 63A RCCB 2P 30mA",
      "Protection",
      "pcs",
      85000,
      "CHINT Uganda",
      "Residual current circuit breaker."
    ],
    [
      "CHINT 40A RCCB 4P 30mA",
      "Protection",
      "pcs",
      120000,
      "CHINT Uganda",
      "Four pole residual current circuit breaker."
    ],
    [
      "CHINT 63A RCCB 4P 30mA",
      "Protection",
      "pcs",
      160000,
      "CHINT Uganda",
      "Four pole residual current circuit breaker."
    ],
    [
      "CHINT 63A Isolator 2P",
      "Protection",
      "pcs",
      45000,
      "CHINT Uganda",
      "Two pole isolator."
    ],
    [
      "CHINT 100A Isolator 2P",
      "Protection",
      "pcs",
      70000,
      "CHINT Uganda",
      "Two pole isolator."
    ],
    [
      "CHINT 63A Isolator 4P",
      "Protection",
      "pcs",
      95000,
      "CHINT Uganda",
      "Four pole isolator."
    ],
    [
      "CHINT 100A Isolator 4P",
      "Protection",
      "pcs",
      150000,
      "CHINT Uganda",
      "Four pole isolator."
    ],
    /* =====================================
       DISTRIBUTION BOARDS
    ===================================== */
    [
      "CHINT 4-Way Consumer Unit",
      "Protection",
      "pcs",
      45000,
      "CHINT Uganda",
      "Consumer distribution board."
    ],
    [
      "CHINT 8-Way Consumer Unit",
      "Protection",
      "pcs",
      75000,
      "CHINT Uganda",
      "Consumer distribution board."
    ],
    [
      "CHINT 12-Way Consumer Unit",
      "Protection",
      "pcs",
      110000,
      "CHINT Uganda",
      "Consumer distribution board."
    ],
    [
      "CHINT 18-Way Consumer Unit",
      "Protection",
      "pcs",
      160000,
      "CHINT Uganda",
      "Consumer distribution board."
    ],
    [
      "CHINT 24-Way Consumer Unit",
      "Protection",
      "pcs",
      220000,
      "CHINT Uganda",
      "Consumer distribution board."
    ],
    /* =====================================
       INDUSTRIAL / CHINT
    ===================================== */
    [
      "CHINT CJX2 9A Contactor",
      "Industrial",
      "pcs",
      55000,
      "CHINT Uganda",
      "AC contactor."
    ],
    [
      "CHINT CJX2 12A Contactor",
      "Industrial",
      "pcs",
      65000,
      "CHINT Uganda",
      "AC contactor."
    ],
    [
      "CHINT CJX2 18A Contactor",
      "Industrial",
      "pcs",
      75000,
      "CHINT Uganda",
      "AC contactor."
    ],
    [
      "CHINT CJX2 25A Contactor",
      "Industrial",
      "pcs",
      90000,
      "CHINT Uganda",
      "Three phase AC contactor."
    ],
    [
      "CHINT CJX2 32A Contactor",
      "Industrial",
      "pcs",
      110000,
      "CHINT Uganda",
      "Three phase AC contactor."
    ],
    [
      "CHINT CJX2 40A Contactor",
      "Industrial",
      "pcs",
      130000,
      "CHINT Uganda",
      "Three phase AC contactor."
    ],
    [
      "CHINT Thermal Overload Relay",
      "Industrial",
      "pcs",
      70000,
      "CHINT Uganda",
      "Motor overload protection."
    ],
    [
      "CHINT 63A Changeover Switch",
      "Industrial",
      "pcs",
      180000,
      "CHINT Uganda",
      "Manual changeover switch."
    ],
    [
      "CHINT 100A Changeover Switch",
      "Industrial",
      "pcs",
      300000,
      "CHINT Uganda",
      "Manual changeover switch."
    ],
    [
      "CHINT 125A Changeover Switch",
      "Industrial",
      "pcs",
      380000,
      "CHINT Uganda",
      "Manual changeover switch."
    ],
    [
      "CHINT Time Switch",
      "Industrial",
      "pcs",
      65000,
      "CHINT Uganda",
      "Programmable time control switch."
    ],
    /* =====================================
       LIGHTING
    ===================================== */
    [
      "LED Bulb 9W",
      "Lighting",
      "pcs",
      3500,
      "Uganda Electrical Market",
      "Standard LED bulb."
    ],
    [
      "LED Bulb 12W",
      "Lighting",
      "pcs",
      4500,
      "Uganda Electrical Market",
      "Standard LED bulb."
    ],
    [
      "LED Bulb 18W",
      "Lighting",
      "pcs",
      6500,
      "Uganda Electrical Market",
      "Standard LED bulb."
    ],
    [
      "LED Downlight 7W",
      "Lighting",
      "pcs",
      10000,
      "Uganda Electrical Market",
      "Recessed LED downlight."
    ],
    [
      "LED Downlight 12W",
      "Lighting",
      "pcs",
      15000,
      "Uganda Electrical Market",
      "Recessed LED downlight."
    ],
    [
      "LED Panel Light 18W",
      "Lighting",
      "pcs",
      25000,
      "Uganda Electrical Market",
      "LED panel fitting."
    ],
    [
      "LED Panel Light 24W",
      "Lighting",
      "pcs",
      35000,
      "Uganda Electrical Market",
      "LED panel fitting."
    ],
    [
      "LED Panel Light 36W",
      "Lighting",
      "pcs",
      45000,
      "Uganda Electrical Market",
      "LED panel fitting."
    ],
    [
      "LED Flood Light 50W",
      "Lighting",
      "pcs",
      55000,
      "Uganda Electrical Market",
      "Outdoor LED floodlight."
    ],
    [
      "LED Flood Light 100W",
      "Lighting",
      "pcs",
      95000,
      "Uganda Electrical Market",
      "High power LED floodlight."
    ],
    [
      "LED Flood Light 200W",
      "Lighting",
      "pcs",
      180000,
      "Uganda Electrical Market",
      "High power LED floodlight."
    ],
    [
      "LED Tube Light 4ft 18W",
      "Lighting",
      "pcs",
      18000,
      "Uganda Electrical Market",
      "LED tube fitting."
    ],
    [
      "Batten Holder",
      "Lighting",
      "pcs",
      2500,
      "Uganda Electrical Market",
      "Lamp holder."
    ],
    [
      "Pendant Holder",
      "Lighting",
      "pcs",
      3500,
      "Uganda Electrical Market",
      "Pendant lamp holder."
    ],
    /* =====================================
       ACCESSORIES
    ===================================== */
    [
      "Junction Box Round",
      "Accessories",
      "pcs",
      1500,
      "Uganda Electrical Market",
      "Round PVC junction box."
    ],
    [
      "Junction Box 4-Way",
      "Accessories",
      "pcs",
      2500,
      "Uganda Electrical Market",
      "PVC junction box."
    ],
    [
      "PVC Inspection Box",
      "Accessories",
      "pcs",
      2500,
      "Uganda Electrical Market",
      "PVC inspection box."
    ],
    [
      "PVC Clips 20mm",
      "Accessories",
      "packet",
      5000,
      "Uganda Electrical Market",
      "PVC conduit clips."
    ],
    [
      "PVC Clips 25mm",
      "Accessories",
      "packet",
      6000,
      "Uganda Electrical Market",
      "PVC conduit clips."
    ],
    [
      "Cable Ties 100mm",
      "Accessories",
      "pack",
      5000,
      "Uganda Electrical Market",
      "Standard cable tie pack."
    ],
    [
      "Cable Ties 200mm",
      "Accessories",
      "pack",
      8000,
      "Uganda Electrical Market",
      "Standard cable tie pack."
    ],
    [
      "Insulation Tape",
      "Accessories",
      "pcs",
      2500,
      "Uganda Electrical Market",
      "Electrical insulation tape."
    ],
    [
      "Earth Rod 1.5m",
      "Accessories",
      "pcs",
      35000,
      "Uganda Electrical Market",
      "Copper bonded earth rod."
    ],
    [
      "Earth Rod 2.4m",
      "Accessories",
      "pcs",
      55000,
      "Uganda Electrical Market",
      "Copper bonded earth rod."
    ],
    [
      "Earth Clamp",
      "Accessories",
      "pcs",
      8000,
      "Uganda Electrical Market",
      "Earth rod clamp."
    ],
    [
      "Cable Lug 10mm²",
      "Accessories",
      "pcs",
      1000,
      "Uganda Electrical Market",
      "Copper cable lug."
    ],
    [
      "Cable Lug 16mm²",
      "Accessories",
      "pcs",
      1500,
      "Uganda Electrical Market",
      "Copper cable lug."
    ],
    [
      "Cable Lug 25mm²",
      "Accessories",
      "pcs",
      2500,
      "Uganda Electrical Market",
      "Copper cable lug."
    ],
    [
      "Cable Lug 35mm²",
      "Accessories",
      "pcs",
      3500,
      "Uganda Electrical Market",
      "Copper cable lug."
    ],
    [
      "Cable Gland 20mm",
      "Accessories",
      "pcs",
      3000,
      "Uganda Electrical Market",
      "Standard cable gland."
    ],
    [
      "Cable Gland 25mm",
      "Accessories",
      "pcs",
      4500,
      "Uganda Electrical Market",
      "Standard cable gland."
    ],
    [
      "Armoured Cable Gland",
      "Accessories",
      "pcs",
      12000,
      "Uganda Electrical Market",
      "Armoured cable gland."
    ],
    /* =====================================
       SOLAR
    ===================================== */
    [
      "MC4 Connector Pair",
      "Solar",
      "pair",
      10000,
      "Uganda Solar Market",
      "Male and female MC4 connector pair."
    ],
    [
      "Solar DC Isolator 32A",
      "Solar",
      "pcs",
      65000,
      "Uganda Solar Market",
      "DC isolator for solar installations."
    ],
    [
      "Solar DC Isolator 63A",
      "Solar",
      "pcs",
      95000,
      "Uganda Solar Market",
      "DC isolator for solar installations."
    ],
    [
      "DC Fuse Holder",
      "Solar",
      "pcs",
      25000,
      "Uganda Solar Market",
      "Solar DC fuse holder."
    ],
    [
      "DC Surge Protection Device",
      "Solar",
      "pcs",
      65000,
      "Uganda Solar Market",
      "DC surge protection."
    ],
    [
      "AC Surge Protection Device",
      "Protection",
      "pcs",
      45000,
      "Uganda Electrical Market",
      "AC surge protection device."
    ],
    [
      "Solar Combiner Box 2 String",
      "Solar",
      "pcs",
      180000,
      "Uganda Solar Market",
      "Solar PV combiner box."
    ],
    [
      "Solar Combiner Box 4 String",
      "Solar",
      "pcs",
      300000,
      "Uganda Solar Market",
      "Solar PV combiner box."
    ],
    /* =====================================
       JOINT BOXES & ENCLOSURES (ADDITIONAL)
    ===================================== */
    [
      "Junction Box 4-Way Weatherproof",
      "Accessories",
      "pcs",
      3500,
      "Uganda Electrical Market",
      "Weatherproof PVC junction box for outdoor use."
    ],
    [
      "Junction Box 6-Way",
      "Accessories",
      "pcs",
      4500,
      "Uganda Electrical Market",
      "6-way PVC junction box for multiple connections."
    ],
    [
      "Junction Box 8-Way",
      "Accessories",
      "pcs",
      6500,
      "Uganda Electrical Market",
      "8-way PVC junction box for complex wiring."
    ],
    [
      "Circular Junction Box 4\"",
      "Accessories",
      "pcs",
      2000,
      "Uganda Electrical Market",
      "Round PVC junction box 4 inch diameter."
    ],
    [
      "Circular Junction Box 6\"",
      "Accessories",
      "pcs",
      3500,
      "Uganda Electrical Market",
      "Round PVC junction box 6 inch diameter."
    ],
    [
      "Metal Junction Box 4-Way",
      "Accessories",
      "pcs",
      6000,
      "Uganda Electrical Market",
      "Galvanized steel junction box."
    ],
    [
      "Metal Junction Box 6-Way",
      "Accessories",
      "pcs",
      9000,
      "Uganda Electrical Market",
      "Galvanized steel junction box."
    ],
    [
      "Weatherproof Enclosure IP65 150x120mm",
      "Accessories",
      "pcs",
      15000,
      "Uganda Electrical Market",
      "IP65 rated weatherproof electrical enclosure."
    ],
    [
      "Weatherproof Enclosure IP65 200x150mm",
      "Accessories",
      "pcs",
      22000,
      "Uganda Electrical Market",
      "IP65 rated weatherproof electrical enclosure."
    ],
    [
      "Weatherproof Enclosure IP65 300x250mm",
      "Accessories",
      "pcs",
      35000,
      "Uganda Electrical Market",
      "IP65 rated weatherproof electrical enclosure."
    ],
    [
      "Weatherproof Enclosure IP65 400x300mm",
      "Accessories",
      "pcs",
      55000,
      "Uganda Electrical Market",
      "IP65 rated weatherproof electrical enclosure."
    ],
    /* =====================================
       INSULATION TAPES & ACCESSORIES (ADDITIONAL)
    ===================================== */
    [
      "Insulation Tape 19mm x 20m Black",
      "Accessories",
      "pcs",
      2500,
      "Uganda Electrical Market",
      "PVC electrical insulation tape 19mm wide."
    ],
    [
      "Insulation Tape 19mm x 20m Red",
      "Accessories",
      "pcs",
      2500,
      "Uganda Electrical Market",
      "PVC electrical insulation tape."
    ],
    [
      "Insulation Tape 19mm x 20m Blue",
      "Accessories",
      "pcs",
      2500,
      "Uganda Electrical Market",
      "PVC electrical insulation tape."
    ],
    [
      "Insulation Tape 19mm x 20m Yellow",
      "Accessories",
      "pcs",
      2500,
      "Uganda Electrical Market",
      "PVC electrical insulation tape."
    ],
    [
      "Insulation Tape 19mm x 20m Green",
      "Accessories",
      "pcs",
      2500,
      "Uganda Electrical Market",
      "PVC electrical insulation tape."
    ],
    [
      "Insulation Tape 25mm x 25m Black",
      "Accessories",
      "pcs",
      4500,
      "Uganda Electrical Market",
      "Heavy-duty PVC insulation tape."
    ],
    [
      "Self-Amalgamating Tape",
      "Accessories",
      "pcs",
      8000,
      "Uganda Electrical Market",
      "Self-fusing silicone tape for waterproofing."
    ],
    [
      "Fiberglass Insulation Tape",
      "Accessories",
      "pcs",
      10000,
      "Uganda Electrical Market",
      "High temperature fiberglass tape."
    ],
    [
      "Cable Marker Tags (Pack 100)",
      "Accessories",
      "pack",
      12000,
      "Uganda Electrical Market",
      "PVC cable identification markers."
    ],
    [
      "Heat Shrink Tubing 3mm (5m Roll)",
      "Accessories",
      "roll",
      8000,
      "Uganda Electrical Market",
      "Heat shrink tubing for cable insulation."
    ],
    [
      "Heat Shrink Tubing 6mm (5m Roll)",
      "Accessories",
      "roll",
      10000,
      "Uganda Electrical Market",
      "Heat shrink tubing for cable insulation."
    ],
    [
      "Heat Shrink Tubing 12mm (5m Roll)",
      "Accessories",
      "roll",
      15000,
      "Uganda Electrical Market",
      "Heat shrink tubing for cable insulation."
    ],
    [
      "Heat Shrink Tubing 25mm (5m Roll)",
      "Accessories",
      "roll",
      22000,
      "Uganda Electrical Market",
      "Heat shrink tubing for cable insulation."
    ],
    /* =====================================
       CONSUMER UNITS - ALL SIZES (CHINT ADDITIONAL)
    ===================================== */
    [
      "CHINT 2-Way Consumer Unit",
      "Protection",
      "pcs",
      25000,
      "CHINT Uganda",
      "Small distribution board with 2 ways."
    ],
    [
      "CHINT 6-Way Consumer Unit",
      "Protection",
      "pcs",
      55000,
      "CHINT Uganda",
      "Consumer distribution board with 6 ways."
    ],
    [
      "CHINT 10-Way Consumer Unit",
      "Protection",
      "pcs",
      95000,
      "CHINT Uganda",
      "Consumer distribution board with 10 ways."
    ],
    [
      "CHINT 14-Way Consumer Unit",
      "Protection",
      "pcs",
      135000,
      "CHINT Uganda",
      "Consumer distribution board with 14 ways."
    ],
    [
      "CHINT 16-Way Consumer Unit",
      "Protection",
      "pcs",
      145000,
      "CHINT Uganda",
      "Consumer distribution board with 16 ways."
    ],
    [
      "CHINT 20-Way Consumer Unit",
      "Protection",
      "pcs",
      185000,
      "CHINT Uganda",
      "Consumer distribution board with 20 ways."
    ],
    [
      "CHINT 30-Way Consumer Unit",
      "Protection",
      "pcs",
      280000,
      "CHINT Uganda",
      "Large consumer distribution board."
    ],
    [
      "CHINT 36-Way Consumer Unit",
      "Protection",
      "pcs",
      350000,
      "CHINT Uganda",
      "Large consumer distribution board."
    ],
    [
      "CHINT 48-Way Consumer Unit",
      "Protection",
      "pcs",
      450000,
      "CHINT Uganda",
      "Industrial distribution board."
    ],
    [
      "CHINT 4-Way 3-Phase Consumer Unit",
      "Protection",
      "pcs",
      120000,
      "CHINT Uganda",
      "3-phase distribution board 4 ways."
    ],
    [
      "CHINT 8-Way 3-Phase Consumer Unit",
      "Protection",
      "pcs",
      180000,
      "CHINT Uganda",
      "3-phase distribution board 8 ways."
    ],
    [
      "CHINT 12-Way 3-Phase Consumer Unit",
      "Protection",
      "pcs",
      240000,
      "CHINT Uganda",
      "3-phase distribution board 12 ways."
    ],
    [
      "CHINT 18-Way 3-Phase Consumer Unit",
      "Protection",
      "pcs",
      320000,
      "CHINT Uganda",
      "3-phase distribution board 18 ways."
    ],
    [
      "CHINT 24-Way 3-Phase Consumer Unit",
      "Protection",
      "pcs",
      420000,
      "CHINT Uganda",
      "3-phase distribution board 24 ways."
    ],
    /* =====================================
       LIGHTING (ADDITIONAL - MORE BULB RATINGS & TYPES)
    ===================================== */
    [
      "LED Bulb 3W",
      "Lighting",
      "pcs",
      2000,
      "Uganda Electrical Market",
      "Low wattage LED bulb for night lights."
    ],
    [
      "LED Bulb 5W",
      "Lighting",
      "pcs",
      2500,
      "Uganda Electrical Market",
      "Standard LED bulb."
    ],
    [
      "LED Bulb 7W",
      "Lighting",
      "pcs",
      3000,
      "Uganda Electrical Market",
      "Standard LED bulb."
    ],
    [
      "LED Bulb 15W",
      "Lighting",
      "pcs",
      5500,
      "Uganda Electrical Market",
      "High lumen LED bulb."
    ],
    [
      "LED Bulb 20W",
      "Lighting",
      "pcs",
      7500,
      "Uganda Electrical Market",
      "High lumen LED bulb."
    ],
    [
      "LED Bulb 25W",
      "Lighting",
      "pcs",
      9500,
      "Uganda Electrical Market",
      "High lumen LED bulb for large spaces."
    ],
    [
      "LED Bulb 30W",
      "Lighting",
      "pcs",
      12000,
      "Uganda Electrical Market",
      "High lumen LED bulb."
    ],
    [
      "LED Bulb 40W",
      "Lighting",
      "pcs",
      18000,
      "Uganda Electrical Market",
      "Very high lumen LED bulb."
    ],
    [
      "LED Bulb 50W",
      "Lighting",
      "pcs",
      25000,
      "Uganda Electrical Market",
      "Industrial LED bulb."
    ],
    [
      "LED Filament Bulb 4W",
      "Lighting",
      "pcs",
      3500,
      "Uganda Electrical Market",
      "Decorative filament LED bulb."
    ],
    [
      "LED Filament Bulb 6W",
      "Lighting",
      "pcs",
      4500,
      "Uganda Electrical Market",
      "Decorative filament LED bulb."
    ],
    [
      "LED Filament Bulb 10W",
      "Lighting",
      "pcs",
      6500,
      "Uganda Electrical Market",
      "Decorative filament LED bulb."
    ],
    [
      "LED Filament Bulb 12W",
      "Lighting",
      "pcs",
      8000,
      "Uganda Electrical Market",
      "Decorative filament LED bulb."
    ],
    [
      "LED Downlight 3W",
      "Lighting",
      "pcs",
      6000,
      "Uganda Electrical Market",
      "Small recessed LED downlight."
    ],
    [
      "LED Downlight 5W",
      "Lighting",
      "pcs",
      8000,
      "Uganda Electrical Market",
      "Recessed LED downlight."
    ],
    [
      "LED Downlight 9W",
      "Lighting",
      "pcs",
      12000,
      "Uganda Electrical Market",
      "Recessed LED downlight."
    ],
    [
      "LED Downlight 15W",
      "Lighting",
      "pcs",
      18000,
      "Uganda Electrical Market",
      "Recessed LED downlight."
    ],
    [
      "LED Downlight 18W",
      "Lighting",
      "pcs",
      22000,
      "Uganda Electrical Market",
      "Large recessed LED downlight."
    ],
    [
      "LED Panel Light 12W",
      "Lighting",
      "pcs",
      18000,
      "Uganda Electrical Market",
      "LED panel fitting."
    ],
    [
      "LED Panel Light 30W",
      "Lighting",
      "pcs",
      40000,
      "Uganda Electrical Market",
      "LED panel fitting."
    ],
    [
      "LED Panel Light 40W",
      "Lighting",
      "pcs",
      55000,
      "Uganda Electrical Market",
      "Large LED panel fitting."
    ],
    [
      "LED Panel Light 60W",
      "Lighting",
      "pcs",
      75000,
      "Uganda Electrical Market",
      "Large LED panel fitting."
    ],
    [
      "LED Flood Light 10W",
      "Lighting",
      "pcs",
      15000,
      "Uganda Electrical Market",
      "Small outdoor LED floodlight."
    ],
    [
      "LED Flood Light 20W",
      "Lighting",
      "pcs",
      25000,
      "Uganda Electrical Market",
      "Outdoor LED floodlight."
    ],
    [
      "LED Flood Light 30W",
      "Lighting",
      "pcs",
      35000,
      "Uganda Electrical Market",
      "Outdoor LED floodlight."
    ],
    [
      "LED Flood Light 150W",
      "Lighting",
      "pcs",
      140000,
      "Uganda Electrical Market",
      "High power LED floodlight."
    ],
    [
      "LED Flood Light 300W",
      "Lighting",
      "pcs",
      280000,
      "Uganda Electrical Market",
      "Industrial LED floodlight."
    ],
    [
      "LED Flood Light 500W",
      "Lighting",
      "pcs",
      450000,
      "Uganda Electrical Market",
      "Industrial LED floodlight."
    ],
    [
      "LED Street Light 50W",
      "Lighting",
      "pcs",
      120000,
      "Uganda Electrical Market",
      "LED street lighting fixture."
    ],
    [
      "LED Street Light 80W",
      "Lighting",
      "pcs",
      180000,
      "Uganda Electrical Market",
      "LED street lighting fixture."
    ],
    [
      "LED Street Light 100W",
      "Lighting",
      "pcs",
      220000,
      "Uganda Electrical Market",
      "LED street lighting fixture."
    ],
    [
      "LED Street Light 150W",
      "Lighting",
      "pcs",
      320000,
      "Uganda Electrical Market",
      "LED street lighting fixture."
    ],
    [
      "LED Tube Light 2ft 9W",
      "Lighting",
      "pcs",
      12000,
      "Uganda Electrical Market",
      "LED tube fitting."
    ],
    [
      "LED Tube Light 3ft 14W",
      "Lighting",
      "pcs",
      15000,
      "Uganda Electrical Market",
      "LED tube fitting."
    ],
    [
      "LED Tube Light 5ft 22W",
      "Lighting",
      "pcs",
      22000,
      "Uganda Electrical Market",
      "LED tube fitting."
    ],
    [
      "LED Tube Light 6ft 28W",
      "Lighting",
      "pcs",
      28000,
      "Uganda Electrical Market",
      "LED tube fitting."
    ],
    [
      "Emergency Light 3W",
      "Lighting",
      "pcs",
      25000,
      "Uganda Electrical Market",
      "Emergency LED light with battery backup."
    ],
    [
      "Emergency Light 6W",
      "Lighting",
      "pcs",
      35000,
      "Uganda Electrical Market",
      "Emergency LED light with battery backup."
    ],
    [
      "Exit Sign LED",
      "Lighting",
      "pcs",
      20000,
      "Uganda Electrical Market",
      "LED illuminated exit sign."
    ],
    [
      "Garden Spike Light 5W",
      "Lighting",
      "pcs",
      15000,
      "Uganda Electrical Market",
      "LED garden spike light."
    ],
    [
      "Garden Spike Light 10W",
      "Lighting",
      "pcs",
      22000,
      "Uganda Electrical Market",
      "LED garden spike light."
    ],
    [
      "Wall Light LED 6W",
      "Lighting",
      "pcs",
      18000,
      "Uganda Electrical Market",
      "Outdoor wall mounted LED light."
    ],
    [
      "Wall Light LED 12W",
      "Lighting",
      "pcs",
      28000,
      "Uganda Electrical Market",
      "Outdoor wall mounted LED light."
    ],
    [
      "Wall Light LED 18W",
      "Lighting",
      "pcs",
      38000,
      "Uganda Electrical Market",
      "Outdoor wall mounted LED light."
    ],
    /* =====================================
       SOLAR PANELS
    ===================================== */
    [
      "Solar Panel 50W Mono",
      "Solar",
      "pcs",
      120000,
      "Uganda Solar Market",
      "50W monocrystalline solar panel."
    ],
    [
      "Solar Panel 100W Mono",
      "Solar",
      "pcs",
      220000,
      "Uganda Solar Market",
      "100W monocrystalline solar panel."
    ],
    [
      "Solar Panel 150W Mono",
      "Solar",
      "pcs",
      320000,
      "Uganda Solar Market",
      "150W monocrystalline solar panel."
    ],
    [
      "Solar Panel 200W Mono",
      "Solar",
      "pcs",
      420000,
      "Uganda Solar Market",
      "200W monocrystalline solar panel."
    ],
    [
      "Solar Panel 250W Mono",
      "Solar",
      "pcs",
      520000,
      "Uganda Solar Market",
      "250W monocrystalline solar panel."
    ],
    [
      "Solar Panel 300W Mono",
      "Solar",
      "pcs",
      620000,
      "Uganda Solar Market",
      "300W monocrystalline solar panel."
    ],
    [
      "Solar Panel 330W Mono",
      "Solar",
      "pcs",
      700000,
      "Uganda Solar Market",
      "330W monocrystalline solar panel."
    ],
    [
      "Solar Panel 350W Mono",
      "Solar",
      "pcs",
      750000,
      "Uganda Solar Market",
      "350W monocrystalline solar panel."
    ],
    [
      "Solar Panel 400W Mono",
      "Solar",
      "pcs",
      850000,
      "Uganda Solar Market",
      "400W monocrystalline solar panel."
    ],
    [
      "Solar Panel 450W Mono",
      "Solar",
      "pcs",
      950000,
      "Uganda Solar Market",
      "450W monocrystalline solar panel."
    ],
    [
      "Solar Panel 500W Mono",
      "Solar",
      "pcs",
      1050000,
      "Uganda Solar Market",
      "500W monocrystalline solar panel."
    ],
    [
      "Solar Panel 50W Poly",
      "Solar",
      "pcs",
      100000,
      "Uganda Solar Market",
      "50W polycrystalline solar panel."
    ],
    [
      "Solar Panel 100W Poly",
      "Solar",
      "pcs",
      190000,
      "Uganda Solar Market",
      "100W polycrystalline solar panel."
    ],
    [
      "Solar Panel 150W Poly",
      "Solar",
      "pcs",
      280000,
      "Uganda Solar Market",
      "150W polycrystalline solar panel."
    ],
    [
      "Solar Panel 200W Poly",
      "Solar",
      "pcs",
      370000,
      "Uganda Solar Market",
      "200W polycrystalline solar panel."
    ],
    [
      "Solar Panel 250W Poly",
      "Solar",
      "pcs",
      460000,
      "Uganda Solar Market",
      "250W polycrystalline solar panel."
    ],
    [
      "Solar Panel 300W Poly",
      "Solar",
      "pcs",
      550000,
      "Uganda Solar Market",
      "300W polycrystalline solar panel."
    ],
    [
      "Solar Panel 330W Poly",
      "Solar",
      "pcs",
      620000,
      "Uganda Solar Market",
      "330W polycrystalline solar panel."
    ],
    [
      "Solar Panel 350W Poly",
      "Solar",
      "pcs",
      670000,
      "Uganda Solar Market",
      "350W polycrystalline solar panel."
    ],
    [
      "Solar Panel Mounting Rails (Pair)",
      "Solar",
      "pair",
      60000,
      "Uganda Solar Market",
      "Aluminum solar panel mounting rails."
    ],
    [
      "Solar Panel Mounting Clamps (Pack 4)",
      "Solar",
      "pack",
      25000,
      "Uganda Solar Market",
      "Mid/end clamps for solar panel mounting."
    ],
    /* =====================================
       SOLAR BATTERIES
    ===================================== */
    [
      "Solar Battery 12V 100Ah Gel",
      "Solar",
      "pcs",
      450000,
      "Uganda Solar Market",
      "12V 100Ah gel deep-cycle battery."
    ],
    [
      "Solar Battery 12V 150Ah Gel",
      "Solar",
      "pcs",
      650000,
      "Uganda Solar Market",
      "12V 150Ah gel deep-cycle battery."
    ],
    [
      "Solar Battery 12V 200Ah Gel",
      "Solar",
      "pcs",
      850000,
      "Uganda Solar Market",
      "12V 200Ah gel deep-cycle battery."
    ],
    [
      "Solar Battery 12V 100Ah AGM",
      "Solar",
      "pcs",
      400000,
      "Uganda Solar Market",
      "12V 100Ah AGM deep-cycle battery."
    ],
    [
      "Solar Battery 12V 150Ah AGM",
      "Solar",
      "pcs",
      580000,
      "Uganda Solar Market",
      "12V 150Ah AGM deep-cycle battery."
    ],
    [
      "Solar Battery 12V 200Ah AGM",
      "Solar",
      "pcs",
      780000,
      "Uganda Solar Market",
      "12V 200Ah AGM deep-cycle battery."
    ],
    [
      "Solar Battery 12V 100Ah Lithium LiFePO4",
      "Solar",
      "pcs",
      850000,
      "Uganda Solar Market",
      "12V 100Ah lithium iron phosphate battery."
    ],
    [
      "Solar Battery 12V 200Ah Lithium LiFePO4",
      "Solar",
      "pcs",
      1500000,
      "Uganda Solar Market",
      "12V 200Ah lithium iron phosphate battery."
    ],
    [
      "Solar Battery 12V 300Ah Lithium LiFePO4",
      "Solar",
      "pcs",
      2200000,
      "Uganda Solar Market",
      "12V 300Ah lithium iron phosphate battery."
    ],
    [
      "Solar Battery 48V 100Ah Lithium LiFePO4",
      "Solar",
      "pcs",
      2500000,
      "Uganda Solar Market",
      "48V 100Ah lithium iron phosphate battery."
    ],
    [
      "Solar Battery 48V 200Ah Lithium LiFePO4",
      "Solar",
      "pcs",
      4500000,
      "Uganda Solar Market",
      "48V 200Ah lithium iron phosphate battery."
    ],
    [
      "Solar Battery 48V 300Ah Lithium LiFePO4",
      "Solar",
      "pcs",
      6500000,
      "Uganda Solar Market",
      "48V 300Ah lithium iron phosphate battery."
    ],
    /* =====================================
       SOLAR INVERTERS
    ===================================== */
    [
      "Solar Inverter 1KVA 12V Pure Sine Wave",
      "Solar",
      "pcs",
      400000,
      "Uganda Solar Market",
      "1KVA pure sine wave solar inverter."
    ],
    [
      "Solar Inverter 2KVA 24V Pure Sine Wave",
      "Solar",
      "pcs",
      650000,
      "Uganda Solar Market",
      "2KVA pure sine wave solar inverter."
    ],
    [
      "Solar Inverter 3KVA 24V Pure Sine Wave",
      "Solar",
      "pcs",
      900000,
      "Uganda Solar Market",
      "3KVA pure sine wave solar inverter."
    ],
    [
      "Solar Inverter 3KVA 48V Pure Sine Wave",
      "Solar",
      "pcs",
      950000,
      "Uganda Solar Market",
      "3KVA pure sine wave solar inverter."
    ],
    [
      "Solar Inverter 5KVA 48V Pure Sine Wave",
      "Solar",
      "pcs",
      1400000,
      "Uganda Solar Market",
      "5KVA pure sine wave solar inverter."
    ],
    [
      "Solar Inverter 7.5KVA 48V Pure Sine Wave",
      "Solar",
      "pcs",
      2200000,
      "Uganda Solar Market",
      "7.5KVA pure sine wave solar inverter."
    ],
    [
      "Solar Inverter 10KVA 48V Pure Sine Wave",
      "Solar",
      "pcs",
      3000000,
      "Uganda Solar Market",
      "10KVA pure sine wave solar inverter."
    ],
    [
      "Solar Inverter 12KVA 48V Pure Sine Wave",
      "Solar",
      "pcs",
      3800000,
      "Uganda Solar Market",
      "12KVA pure sine wave solar inverter."
    ],
    [
      "Solar Inverter 15KVA 48V Pure Sine Wave",
      "Solar",
      "pcs",
      4800000,
      "Uganda Solar Market",
      "15KVA pure sine wave solar inverter."
    ],
    [
      "Solar Inverter 20KVA 48V Pure Sine Wave",
      "Solar",
      "pcs",
      6500000,
      "Uganda Solar Market",
      "20KVA pure sine wave solar inverter."
    ],
    [
      "Hybrid Solar Inverter 3KVA 24V",
      "Solar",
      "pcs",
      1200000,
      "Uganda Solar Market",
      "3KVA hybrid solar inverter with MPPT."
    ],
    [
      "Hybrid Solar Inverter 5KVA 48V",
      "Solar",
      "pcs",
      1800000,
      "Uganda Solar Market",
      "5KVA hybrid solar inverter with MPPT."
    ],
    [
      "Hybrid Solar Inverter 8KVA 48V",
      "Solar",
      "pcs",
      2800000,
      "Uganda Solar Market",
      "8KVA hybrid solar inverter with MPPT."
    ],
    [
      "Hybrid Solar Inverter 10KVA 48V",
      "Solar",
      "pcs",
      3500000,
      "Uganda Solar Market",
      "10KVA hybrid solar inverter with MPPT."
    ],
    /* =====================================
       SOLAR CHARGE CONTROLLERS / REGULATORS
    ===================================== */
    [
      "PWM Charge Controller 10A 12/24V",
      "Solar",
      "pcs",
      45000,
      "Uganda Solar Market",
      "10A PWM solar charge controller."
    ],
    [
      "PWM Charge Controller 20A 12/24V",
      "Solar",
      "pcs",
      65000,
      "Uganda Solar Market",
      "20A PWM solar charge controller."
    ],
    [
      "PWM Charge Controller 30A 12/24V",
      "Solar",
      "pcs",
      85000,
      "Uganda Solar Market",
      "30A PWM solar charge controller."
    ],
    [
      "PWM Charge Controller 40A 12/24V",
      "Solar",
      "pcs",
      110000,
      "Uganda Solar Market",
      "40A PWM solar charge controller."
    ],
    [
      "PWM Charge Controller 60A 12/24V",
      "Solar",
      "pcs",
      160000,
      "Uganda Solar Market",
      "60A PWM solar charge controller."
    ],
    [
      "MPPT Charge Controller 10A 12/24V",
      "Solar",
      "pcs",
      100000,
      "Uganda Solar Market",
      "10A MPPT solar charge controller."
    ],
    [
      "MPPT Charge Controller 20A 12/24V",
      "Solar",
      "pcs",
      150000,
      "Uganda Solar Market",
      "20A MPPT solar charge controller."
    ],
    [
      "MPPT Charge Controller 30A 12/24/48V",
      "Solar",
      "pcs",
      220000,
      "Uganda Solar Market",
      "30A MPPT solar charge controller."
    ],
    [
      "MPPT Charge Controller 40A 12/24/48V",
      "Solar",
      "pcs",
      300000,
      "Uganda Solar Market",
      "40A MPPT solar charge controller."
    ],
    [
      "MPPT Charge Controller 50A 12/24/48V",
      "Solar",
      "pcs",
      380000,
      "Uganda Solar Market",
      "50A MPPT solar charge controller."
    ],
    [
      "MPPT Charge Controller 60A 12/24/48V",
      "Solar",
      "pcs",
      450000,
      "Uganda Solar Market",
      "60A MPPT solar charge controller."
    ],
    [
      "MPPT Charge Controller 80A 12/24/48V",
      "Solar",
      "pcs",
      650000,
      "Uganda Solar Market",
      "80A MPPT solar charge controller."
    ],
    [
      "MPPT Charge Controller 100A 12/24/48V",
      "Solar",
      "pcs",
      850000,
      "Uganda Solar Market",
      "100A MPPT solar charge controller."
    ],
    /* =====================================
       SWITCHES & SOCKETS (ADDITIONAL)
    ===================================== */
    [
      "Tronic 1-Gang 1-Way Dimmer Switch",
      "Switches & Sockets",
      "pcs",
      15000,
      "Tronic Uganda",
      "1 gang dimmer switch."
    ],
    [
      "Tronic 2-Gang 1-Way Dimmer Switch",
      "Switches & Sockets",
      "pcs",
      22000,
      "Tronic Uganda",
      "2 gang dimmer switch."
    ],
    [
      "Tronic 1-Gang 2-Way Dimmer Switch",
      "Switches & Sockets",
      "pcs",
      18000,
      "Tronic Uganda",
      "1 gang 2 way dimmer switch."
    ],
    [
      "Tronic 1-Gang Intermediate Switch",
      "Switches & Sockets",
      "pcs",
      12000,
      "Tronic Uganda",
      "1 gang intermediate switch."
    ],
    [
      "Tronic 2-Gang Intermediate Switch",
      "Switches & Sockets",
      "pcs",
      18000,
      "Tronic Uganda",
      "2 gang intermediate switch."
    ],
    [
      "Tronic 4-Gang 1-Way Switch",
      "Switches & Sockets",
      "pcs",
      15000,
      "Tronic Uganda",
      "4 gang wall switch."
    ],
    [
      "Tronic 4-Gang 2-Way Switch",
      "Switches & Sockets",
      "pcs",
      18000,
      "Tronic Uganda",
      "4 gang 2 way wall switch."
    ],
    [
      "Tronic 13A Single Socket Outlet with USB",
      "Switches & Sockets",
      "pcs",
      16000,
      "Tronic Uganda",
      "Single socket with USB charging."
    ],
    [
      "Tronic 13A Twin Socket Outlet with USB-C",
      "Switches & Sockets",
      "pcs",
      25000,
      "Tronic Uganda",
      "Twin socket with USB-C fast charging."
    ],
    [
      "Tronic 13A Single Switched Socket",
      "Switches & Sockets",
      "pcs",
      8000,
      "Tronic Uganda",
      "13 amp single switched socket outlet."
    ],
    [
      "Tronic 13A Twin Switched Socket",
      "Switches & Sockets",
      "pcs",
      13000,
      "Tronic Uganda",
      "13 amp twin switched socket outlet."
    ],
    [
      "Tronic 15A Round Pin Socket",
      "Switches & Sockets",
      "pcs",
      12000,
      "Tronic Uganda",
      "15 amp round pin socket."
    ],
    [
      "Tronic 5A Round Pin Socket",
      "Switches & Sockets",
      "pcs",
      8000,
      "Tronic Uganda",
      "5 amp round pin socket."
    ],
    [
      "Tronic 15A Round Pin Plug",
      "Switches & Sockets",
      "pcs",
      6000,
      "Tronic Uganda",
      "15 amp round pin plug."
    ],
    [
      "Tronic 5A Round Pin Plug",
      "Switches & Sockets",
      "pcs",
      4000,
      "Tronic Uganda",
      "5 amp round pin plug."
    ],
    [
      "Tronic TV Socket",
      "Switches & Sockets",
      "pcs",
      10000,
      "Tronic Uganda",
      "Coaxial TV socket outlet."
    ],
    [
      "Tronic Telephone Socket",
      "Switches & Sockets",
      "pcs",
      8000,
      "Tronic Uganda",
      "RJ11 telephone socket outlet."
    ],
    [
      "Tronic HDMI Socket",
      "Switches & Sockets",
      "pcs",
      15000,
      "Tronic Uganda",
      "HDMI wall socket."
    ],
    [
      "Tronic Blanking Plate",
      "Switches & Sockets",
      "pcs",
      3000,
      "Tronic Uganda",
      "Blank wall plate."
    ],
    [
      "Tronic Grid Frame 1-Gang",
      "Switches & Sockets",
      "pcs",
      4000,
      "Tronic Uganda",
      "1 gang modular grid frame."
    ],
    [
      "Tronic Grid Frame 2-Gang",
      "Switches & Sockets",
      "pcs",
      6000,
      "Tronic Uganda",
      "2 gang modular grid frame."
    ],
    [
      "Tronic Grid Frame 3-Gang",
      "Switches & Sockets",
      "pcs",
      8000,
      "Tronic Uganda",
      "3 gang modular grid frame."
    ],
    [
      "Tronic Grid Frame 4-Gang",
      "Switches & Sockets",
      "pcs",
      10000,
      "Tronic Uganda",
      "4 gang modular grid frame."
    ],
    /* =====================================
       ARMOURED CABLES
    ===================================== */
    [
      "4mm² 2-Core SWA Cable",
      "Cables",
      "metre",
      15000,
      "Uganda Electrical Market",
      "2-core steel wire armoured cable."
    ],
    [
      "4mm² 3-Core SWA Cable",
      "Cables",
      "metre",
      20000,
      "Uganda Electrical Market",
      "3-core steel wire armoured cable."
    ],
    [
      "4mm² 4-Core SWA Cable",
      "Cables",
      "metre",
      25000,
      "Uganda Electrical Market",
      "4-core steel wire armoured cable."
    ],
    [
      "6mm² 2-Core SWA Cable",
      "Cables",
      "metre",
      20000,
      "Uganda Electrical Market",
      "2-core steel wire armoured cable."
    ],
    [
      "6mm² 3-Core SWA Cable",
      "Cables",
      "metre",
      28000,
      "Uganda Electrical Market",
      "3-core steel wire armoured cable."
    ],
    [
      "6mm² 4-Core SWA Cable",
      "Cables",
      "metre",
      35000,
      "Uganda Electrical Market",
      "4-core steel wire armoured cable."
    ],
    [
      "10mm² 2-Core SWA Cable",
      "Cables",
      "metre",
      30000,
      "Uganda Electrical Market",
      "4-core steel wire armoured cable."
    ],
    [
      "PVC Conduit Bend 20mm",
      "Conduit & Trunking",
      "pcs",
      1500,
      "Uganda Electrical Market",
      "20mm PVC conduit bend for changing conduit direction during slab and wall installation."
    ],
    [
      "PVC Conduit Bend 25mm",
      "Conduit & Trunking",
      "pcs",
      2000,
      "Uganda Electrical Market",
      "25mm PVC conduit bend for electrical conduit routes in slabs and walls."
    ],
    [
      "PVC Conduit Bend 32mm",
      "Conduit & Trunking",
      "pcs",
      3500,
      "Uganda Electrical Market",
      "32mm PVC conduit bend for larger cable routes and slab installations."
    ],
    [
      "PVC Conduit Coupler 20mm",
      "Conduit & Trunking",
      "pcs",
      800,
      "Uganda Electrical Market",
      "20mm PVC coupler used to join two conduit lengths."
    ],
    [
      "PVC Conduit Coupler 25mm",
      "Conduit & Trunking",
      "pcs",
      1000,
      "Uganda Electrical Market",
      "25mm PVC coupler used for joining conduit sections."
    ],
    [
      "PVC Conduit Coupler 32mm",
      "Conduit & Trunking",
      "pcs",
      1500,
      "Uganda Electrical Market",
      "32mm PVC coupler for joining larger conduit sections."
    ],
    [
      "PVC Conduit Tee 20mm",
      "Conduit & Trunking",
      "pcs",
      1500,
      "Uganda Electrical Market",
      "20mm PVC conduit tee used to branch conduit routes."
    ],
    [
      "PVC Conduit Tee 25mm",
      "Conduit & Trunking",
      "pcs",
      2000,
      "Uganda Electrical Market",
      "25mm PVC conduit tee for branching electrical conduit runs."
    ],
    [
      "PVC Conduit Tee 32mm",
      "Conduit & Trunking",
      "pcs",
      3000,
      "Uganda Electrical Market",
      "32mm PVC conduit tee for larger conduit branching arrangements."
    ],
    [
      "PVC Conduit Inspection Bend 20mm",
      "Conduit & Trunking",
      "pcs",
      2500,
      "Uganda Electrical Market",
      "20mm inspection bend providing access for cable pulling at conduit changes of direction."
    ],
    [
      "PVC Conduit Inspection Bend 25mm",
      "Conduit & Trunking",
      "pcs",
      3500,
      "Uganda Electrical Market",
      "25mm inspection bend used to facilitate cable installation through long or changing conduit routes."
    ],
    [
      "PVC Conduit Inspection Bend 32mm",
      "Conduit & Trunking",
      "pcs",
      5000,
      "Uganda Electrical Market",
      "32mm inspection bend for larger electrical conduit installations."
    ],
    [
      "PVC Conduit Male Adaptor 20mm",
      "Conduit & Trunking",
      "pcs",
      1000,
      "Uganda Electrical Market",
      "20mm PVC male adaptor for terminating conduit into electrical boxes and enclosures."
    ],
    [
      "PVC Conduit Male Adaptor 25mm",
      "Conduit & Trunking",
      "pcs",
      1500,
      "Uganda Electrical Market",
      "25mm PVC male adaptor for connecting conduit to boxes and accessories."
    ],
    [
      "PVC Conduit Male Adaptor 32mm",
      "Conduit & Trunking",
      "pcs",
      2000,
      "Uganda Electrical Market",
      "32mm PVC male adaptor for terminating larger conduit runs into boxes and enclosures."
    ],
    [
      "PVC Conduit Bush 20mm",
      "Conduit & Trunking",
      "pcs",
      500,
      "Uganda Electrical Market",
      "20mm PVC bush used to provide a smooth protective termination for conduit."
    ],
    [
      "PVC Conduit Bush 25mm",
      "Conduit & Trunking",
      "pcs",
      700,
      "Uganda Electrical Market",
      "25mm PVC bush for protecting cable insulation at conduit terminations."
    ],
    [
      "PVC Conduit Bush 32mm",
      "Conduit & Trunking",
      "pcs",
      1000,
      "Uganda Electrical Market",
      "32mm PVC bush used at larger conduit terminations."
    ],
    [
      "PVC Conduit Saddle 20mm",
      "Conduit & Trunking",
      "pcs",
      300,
      "Uganda Electrical Market",
      "20mm PVC conduit saddle used to secure conduit to surfaces before plastering or concrete work."
    ],
    [
      "PVC Conduit Saddle 25mm",
      "Conduit & Trunking",
      "pcs",
      400,
      "Uganda Electrical Market",
      "25mm PVC conduit saddle for securing conduit routes."
    ],
    [
      "PVC Conduit Saddle 32mm",
      "Conduit & Trunking",
      "pcs",
      600,
      "Uganda Electrical Market",
      "32mm PVC conduit saddle for securing larger conduit installations."
    ],
    [
      "PVC Conduit Glue / Solvent Cement",
      "Conduit & Trunking",
      "250ml tin",
      8000,
      "Uganda Electrical Market",
      "PVC solvent cement used to permanently bond PVC conduit, bends, couplers and fittings."
    ],
    [
      "PVC Solvent Cement",
      "Conduit & Trunking",
      "500ml tin",
      14000,
      "Uganda Electrical Market",
      "PVC solvent adhesive for joining conduit and PVC electrical fittings."
    ],
    [
      "PVC Primer",
      "Conduit & Trunking",
      "250ml tin",
      7000,
      "Uganda Electrical Market",
      "PVC primer used to prepare conduit surfaces before applying solvent cement."
    ],
    [
      "PVC Conduit Cutting Tool",
      "Electrical Tools",
      "pcs",
      25000,
      "Uganda Electrical Market",
      "Hand tool used for clean and accurate cutting of PVC conduit."
    ],
    [
      "20mm Heavy Gauge PVC Conduit",
      "Conduit & Trunking",
      "length",
      4500,
      "Uganda Electrical Market",
      "Heavy-duty 20mm PVC conduit suitable for concealed wall and slab electrical installations."
    ],
    [
      "25mm Heavy Gauge PVC Conduit",
      "Conduit & Trunking",
      "length",
      6000,
      "Uganda Electrical Market",
      "Heavy-duty 25mm PVC conduit for socket circuits, feeders and larger cable routes."
    ],
    [
      "32mm Heavy Gauge PVC Conduit",
      "Conduit & Trunking",
      "length",
      8500,
      "Uganda Electrical Market",
      "Heavy-duty 32mm PVC conduit for larger cable groups and distribution circuits."
    ],
    [
      "40mm Heavy Gauge PVC Conduit",
      "Conduit & Trunking",
      "length",
      12000,
      "Uganda Electrical Market",
      "Heavy-duty 40mm PVC conduit for major cable routes and distribution installations."
    ],
    [
      "PVC Circular Junction Box 20mm",
      "Boxes & Enclosures",
      "pcs",
      2000,
      "Uganda Electrical Market",
      "Circular PVC junction box used for branching and joining concealed conduit runs."
    ],
    [
      "PVC Circular Junction Box 25mm",
      "Boxes & Enclosures",
      "pcs",
      2500,
      "Uganda Electrical Market",
      "Circular PVC junction box for concealed conduit branching and cable joints."
    ],
    [
      "PVC Circular Junction Box 32mm",
      "Boxes & Enclosures",
      "pcs",
      3500,
      "Uganda Electrical Market",
      "Larger circular PVC junction box suitable for multiple conduit entries."
    ],
    [
      "PVC 3-Way Junction Box",
      "Boxes & Enclosures",
      "pcs",
      2500,
      "Uganda Electrical Market",
      "PVC junction box with multiple conduit entry points for branching electrical circuits."
    ],
    [
      "PVC 4-Way Junction Box",
      "Boxes & Enclosures",
      "pcs",
      3000,
      "Uganda Electrical Market",
      "Four-way PVC junction box for concealed electrical conduit distribution."
    ],
    [
      "PVC 6-Way Junction Box",
      "Boxes & Enclosures",
      "pcs",
      4500,
      "Uganda Electrical Market",
      "Multi-entry PVC junction box used where several conduit routes meet."
    ],
    [
      "PVC Flush Single-Gang Box",
      "Boxes & Enclosures",
      "pcs",
      2500,
      "Uganda Electrical Market",
      "Single-gang PVC flush box for concealed switches and socket accessories."
    ],
    [
      "PVC Flush Double-Gang Box",
      "Boxes & Enclosures",
      "pcs",
      4000,
      "Uganda Electrical Market",
      "Double-gang PVC flush box for multiple switches or socket accessories."
    ],
    [
      "PVC Deep Single-Gang Box",
      "Boxes & Enclosures",
      "pcs",
      3500,
      "Uganda Electrical Market",
      "Deep PVC flush box providing additional space for wiring connections and accessories."
    ],
    [
      "PVC Deep Double-Gang Box",
      "Boxes & Enclosures",
      "pcs",
      5000,
      "Uganda Electrical Market",
      "Deep double-gang PVC box suitable for multiple wiring connections and accessories."
    ],
    [
      "Ceiling Rose / Batten Box",
      "Boxes & Enclosures",
      "pcs",
      2500,
      "Uganda Electrical Market",
      "Ceiling electrical box used for terminating conduit runs at lighting points."
    ],
    [
      "Heavy Duty Circular Ceiling Box",
      "Boxes & Enclosures",
      "pcs",
      3500,
      "Uganda Electrical Market",
      "Heavy-duty circular box for concealed ceiling lighting points and conduit termination."
    ],
    [
      "PVC Inspection Box 100x100mm",
      "Boxes & Enclosures",
      "pcs",
      3500,
      "Uganda Electrical Market",
      "PVC inspection box providing access to concealed cable joints and conduit routes."
    ],
    [
      "PVC Inspection Box 150x150mm",
      "Boxes & Enclosures",
      "pcs",
      5500,
      "Uganda Electrical Market",
      "Larger inspection box for accessible cable joints and multiple conduit connections."
    ],
    [
      "PVC Inspection Box 200x200mm",
      "Boxes & Enclosures",
      "pcs",
      9000,
      "Uganda Electrical Market",
      "Large PVC inspection box for complex concealed cable junctions and conduit routes."
    ],
    [
      "Draw Wire / Conduit Pulling Wire",
      "Installation Materials",
      "100m roll",
      12000,
      "Uganda Electrical Market",
      "Pulling wire used to draw electrical cables through concealed conduit installations."
    ],
    [
      "Electrical Draw Rope",
      "Installation Materials",
      "100m roll",
      15000,
      "Uganda Electrical Market",
      "Strong nylon draw rope used for pulling cables through long conduit runs."
    ],
    [
      "Binding Wire",
      "Installation Materials",
      "kg",
      7000,
      "Uganda Electrical Market",
      "Galvanized binding wire used to secure conduit and electrical boxes to reinforcement before concrete pouring."
    ],
    [
      "Electrical Conduit Fixing Wire",
      "Installation Materials",
      "kg",
      8000,
      "Uganda Electrical Market",
      "Binding wire used for temporarily securing conduit routes to reinforcement during slab preparation."
    ],
    [
      "Cable Tie 200mm",
      "Installation Materials",
      "pack",
      8000,
      "Uganda Electrical Market",
      "Nylon cable ties used for securing electrical cables and conduit accessories."
    ],
    [
      "Cable Tie 300mm",
      "Installation Materials",
      "pack",
      12000,
      "Uganda Electrical Market",
      "Long nylon cable ties for securing larger cable bundles and electrical installations."
    ],
    [
      "PVC Insulation Tape Black",
      "Electrical Consumables",
      "roll",
      2500,
      "Uganda Electrical Market",
      "PVC electrical insulation tape for insulating cable joints and electrical connections."
    ],
    [
      "PVC Insulation Tape Red",
      "Electrical Consumables",
      "roll",
      2500,
      "Uganda Electrical Market",
      "Red PVC insulation tape used for cable identification and electrical insulation."
    ],
    [
      "PVC Insulation Tape Blue",
      "Electrical Consumables",
      "roll",
      2500,
      "Uganda Electrical Market",
      "Blue PVC electrical tape for cable identification and insulation."
    ],
    [
      "PVC Insulation Tape Yellow/Green",
      "Electrical Consumables",
      "roll",
      2500,
      "Uganda Electrical Market",
      "Yellow and green electrical insulation tape used for identifying protective earth conductors."
    ],
    [
      "Electrical Junction Box Cover",
      "Boxes & Enclosures",
      "pcs",
      1000,
      "Uganda Electrical Market",
      "Replacement PVC cover for concealed junction boxes."
    ],
    [
      "PVC Conduit End Cap 20mm",
      "Conduit & Trunking",
      "pcs",
      500,
      "Uganda Electrical Market",
      "20mm PVC end cap used to terminate unused conduit openings."
    ],
    [
      "PVC Conduit End Cap 25mm",
      "Conduit & Trunking",
      "pcs",
      700,
      "Uganda Electrical Market",
      "25mm PVC end cap for terminating conduit sections."
    ],
    [
      "PVC Conduit End Cap 32mm",
      "Conduit & Trunking",
      "pcs",
      1000,
      "Uganda Electrical Market",
      "32mm PVC end cap for closing unused conduit openings."
    ],
    [
      "Flexible Conduit 20mm",
      "Conduit & Trunking",
      "metre",
      2800,
      "Uganda Electrical Market",
      "Flexible conduit used for transitions between rigid conduit and electrical boxes or equipment."
    ],
    [
      "Flexible Conduit 25mm",
      "Conduit & Trunking",
      "metre",
      4000,
      "Uganda Electrical Market",
      "25mm flexible conduit for bends, equipment connections and difficult conduit routes."
    ],
    [
      "Flexible Conduit Connector 20mm",
      "Conduit & Trunking",
      "pcs",
      1500,
      "Uganda Electrical Market",
      "Connector used to join 20mm flexible conduit to electrical boxes or rigid conduit."
    ],
    [
      "Flexible Conduit Connector 25mm",
      "Conduit & Trunking",
      "pcs",
      2000,
      "Uganda Electrical Market",
      "Connector for terminating 25mm flexible conduit into boxes and equipment."
    ],
    [
      "Cable Marker Sleeves",
      "Electrical Consumables",
      "pack",
      8000,
      "Uganda Electrical Market",
      "Cable identification sleeves used to label circuits during electrical installation."
    ],
    [
      "Heat Shrink Tube Assorted",
      "Electrical Consumables",
      "pack",
      15000,
      "Uganda Electrical Market",
      "Heat-shrink tubing used for insulating and protecting cable joints and terminations."
    ],
    [
      "Electrical Joint Connector Block",
      "Electrical Consumables",
      "strip",
      3000,
      "Uganda Electrical Market",
      "Screw terminal connector strip used for electrical wire connections inside junction boxes."
    ],
    [
      "Wago Type Lever Connector 2-Way",
      "Electrical Consumables",
      "pack",
      12000,
      "Uganda Electrical Market",
      "Lever-operated wire connector for secure maintenance-friendly electrical connections."
    ],
    [
      "Wago Type Lever Connector 3-Way",
      "Electrical Consumables",
      "pack",
      15000,
      "Uganda Electrical Market",
      "Three-way lever connector for joining conductors inside electrical boxes."
    ],
    [
      "Wago Type Lever Connector 5-Way",
      "Electrical Consumables",
      "pack",
      20000,
      "Uganda Electrical Market",
      "Five-way lever connector for multiple conductor connections."
    ],
    [
      "Cable Ferrule Assorted",
      "Electrical Consumables",
      "pack",
      15000,
      "Uganda Electrical Market",
      "Insulated and uninsulated ferrules for terminating stranded conductors in terminals."
    ],
    [
      "Cable Lugs Assorted",
      "Electrical Consumables",
      "pack",
      20000,
      "Uganda Electrical Market",
      "Assorted copper cable lugs for secure cable termination in distribution boards and equipment."
    ],
  
  /* =====================================
     LIGHTNING PROTECTION - AIR TERMINATION
  ===================================== */

  [
    "Copper Lightning Air Terminal 300mm",
    "Lightening",
    "pcs",
    45000,
    "Uganda Electrical Market",
    "Solid copper pointed air termination rod for mounting on building roofs."
  ],

  [
    "Copper Lightning Air Terminal 500mm",
    "Lightening",
    "pcs",
    60000,
    "Uganda Electrical Market",
    "Solid copper pointed air termination rod for lightning interception."
  ],

  [
    "Copper Lightning Air Terminal 1000mm",
    "Lightening",
    "pcs",
    85000,
    "Uganda Electrical Market",
    "1 metre solid copper air termination rod for roof lightning protection systems."
  ],

  [
    "Copper Lightning Air Terminal 1500mm",
    "Lightening",
    "pcs",
    120000,
    "Uganda Electrical Market",
    "1.5 metre copper lightning air terminal for larger roof structures."
  ],

  [
    "Copper Lightning Air Terminal 2000mm",
    "Lightening",
    "pcs",
    160000,
    "Uganda Electrical Market",
    "2 metre copper air termination rod for lightning protection installations."
  ],

  [
    "Copper Multiple Point Lightning Terminal",
    "Lightening",
    "pcs",
    85000,
    "Uganda Electrical Market",
    "Multi-point copper terminal used with lightning air rods to improve the air termination arrangement."
  ],

  [
    "Multiple Point Lightning Air Terminal 6-Point",
    "Lightening",
    "pcs",
    120000,
    "Uganda Electrical Market",
    "Six-point copper air termination assembly for roof lightning protection."
  ],

  [
    "Brass Air Terminal Base 16mm",
    "Lightening",
    "pcs",
    35000,
    "Uganda Electrical Market",
    "Brass or gunmetal base for securely mounting a 16mm lightning air terminal."
  ],

  [
    "Brass Air Terminal Base 20mm",
    "Lightening",
    "pcs",
    45000,
    "Uganda Electrical Market",
    "Heavy-duty brass or gunmetal base for mounting larger lightning air terminals."
  ],

  [
    "Copper Air Rod Ridge Base",
    "Lightening",
    "pcs",
    40000,
    "Uganda Electrical Market",
    "Copper or brass ridge mounting base for lightning air termination rods."
  ],

  [
    "Lightning Rod Roof Ridge Saddle",
    "Lightening",
    "pcs",
    18000,
    "Uganda Electrical Market",
    "Roof ridge saddle used to secure lightning air terminal and conductor assemblies."
  ],

  [
    "Lightning Air Terminal Extension Rod 500mm",
    "Lightening",
    "pcs",
    45000,
    "Uganda Electrical Market",
    "Threaded extension section for increasing lightning air terminal height."
  ],

  [
    "Lightning Air Terminal Extension Rod 1000mm",
    "Lightening",
    "pcs",
    70000,
    "Uganda Electrical Market",
    "1 metre extension section for raised lightning air termination systems."
  ],

  /* =====================================
     COPPER CONDUCTORS & TAPES
  ===================================== */

  [
    "Bare Copper Lightning Tape 25x3mm",
    "Lightening",
    "metre",
    22000,
    "Uganda Electrical Market",
    "High-conductivity bare copper tape for lightning air termination and down conductors."
  ],

  [
    "Bare Copper Lightning Tape 25x5mm",
    "Lightening",
    "metre",
    35000,
    "Uganda Electrical Market",
    "Heavy-duty bare copper tape for lightning protection and earthing networks."
  ],

  [
    "Bare Copper Lightning Tape 30x3mm",
    "Lightening",
    "metre",
    28000,
    "Uganda Electrical Market",
    "Copper tape for roof termination, down conductors and earth termination networks."
  ],

  [
    "Bare Copper Lightning Tape 50x3mm",
    "Lightening",
    "metre",
    45000,
    "Uganda Electrical Market",
    "Heavy-duty copper tape for commercial and industrial lightning protection systems."
  ],

  [
    "PVC Covered Copper Lightning Tape 25x3mm",
    "Lightening",
    "metre",
    28000,
    "Uganda Electrical Market",
    "PVC-covered copper tape providing mechanical and environmental protection."
  ],

  [
    "Tinned Copper Lightning Tape 25x3mm",
    "Lightening",
    "metre",
    30000,
    "Uganda Electrical Market",
    "Tinned copper tape offering improved corrosion resistance for lightning protection."
  ],

  [
    "Bare Aluminium Lightning Tape 25x3mm",
    "Lightening",
    "metre",
    10000,
    "Uganda Electrical Market",
    "Bare aluminium tape for approved lightning air termination and down-conductor applications."
  ],

  [
    "Bare Aluminium Lightning Tape 25x5mm",
    "Lightening",
    "metre",
    16000,
    "Uganda Electrical Market",
    "Heavy-duty aluminium tape for lightning protection conductor networks."
  ],

  [
    "Aluminium Lightning Conductor 50x3mm",
    "Lightening",
    "metre",
    24000,
    "Uganda Electrical Market",
    "Wide aluminium strip used for lightning air termination and down-conductor networks."
  ],

  [
    "Copper Lightning Conductor Cable 35mm²",
    "Lightening",
    "metre",
    28000,
    "Uganda Electrical Market",
    "Bare or suitable copper conductor for lightning and earthing applications."
  ],

  [
    "Copper Lightning Conductor Cable 50mm²",
    "Lightening",
    "metre",
    40000,
    "Uganda Electrical Market",
    "High-capacity copper conductor for lightning down-conductor and earthing applications."
  ],

  [
    "Copper Lightning Conductor Cable 70mm²",
    "Lightening",
    "metre",
    55000,
    "Uganda Electrical Market",
    "Heavy-duty copper conductor for industrial lightning and earth termination systems."
  ],

  /* =====================================
     TAPE FIXINGS & CONDUCTOR ACCESSORIES
  ===================================== */

  [
    "Copper Tape Clamp 25x3mm",
    "Lightening",
    "pcs",
    6500,
    "Uganda Electrical Market",
    "Copper or brass clamp for joining 25x3mm copper lightning tape."
  ],

  [
    "Copper Tape Cross Clamp 25x3mm",
    "Lightening",
    "pcs",
    9000,
    "Uganda Electrical Market",
    "Cross connector for creating secure four-way copper tape connections."
  ],

  [
    "Copper Tape T-Joint Clamp 25x3mm",
    "Lightening",
    "pcs",
    8500,
    "Uganda Electrical Market",
    "T-joint clamp for branching copper lightning conductors."
  ],

  [
    "Copper Tape Straight Joint Clamp 25x3mm",
    "Lightening",
    "pcs",
    7500,
    "Uganda Electrical Market",
    "Straight jointing clamp for extending 25x3mm copper tape."
  ],

  [
    "Aluminium Tape Clamp 25x3mm",
    "Lightening",
    "pcs",
    4500,
    "Uganda Electrical Market",
    "Aluminium conductor clamp for lightning protection tape."
  ],

  [
    "Copper Square Tape Clamp 25x3mm",
    "Lightening",
    "pcs",
    8500,
    "Uganda Electrical Market",
    "Square clamp for securing and joining copper lightning tapes."
  ],

  [
    "Bimetallic Copper Aluminium Connector",
    "Lightening",
    "pcs",
    25000,
    "Uganda Electrical Market",
    "Bimetallic connector for safely joining copper and aluminium lightning conductors."
  ],

  [
    "Copper Bonding Clamp",
    "Lightening",
    "pcs",
    12000,
    "Uganda Electrical Market",
    "Copper bonding clamp for connecting metallic building components to the lightning protection system."
  ],

  [
    "Lightning Conductor Test Clamp",
    "Lightening",
    "pcs",
    15000,
    "Uganda Electrical Market",
    "Disconnecting test clamp installed on a lightning down conductor for testing and maintenance."
  ],

  [
    "Lightning Down Conductor Test Joint",
    "Lightening",
    "pcs",
    25000,
    "Uganda Electrical Market",
    "Heavy-duty disconnecting joint for isolating lightning down conductors during earth resistance testing."
  ],

  [
    "Lightning Tape Clip PVC",
    "Lightening",
    "pcs",
    2500,
    "Uganda Electrical Market",
    "Non-metallic clip for securing lightning conductor tape to walls and roof surfaces."
  ],

  [
    "Lightning Tape Clip Metallic",
    "Lightening",
    "pcs",
    4500,
    "Uganda Electrical Market",
    "Metallic conductor clip for securing copper or aluminium lightning tape."
  ],

  [
    "Lightning Tape Spacer Clip",
    "Lightening",
    "pcs",
    5000,
    "Uganda Electrical Market",
    "Spacer-type fixing clip used to maintain separation between conductor tape and the building surface."
  ],

  [
    "Adhesive Lightning Tape Clip",
    "Lightening",
    "pcs",
    5000,
    "Uganda Electrical Market",
    "Adhesive non-penetrating clip for fixing lightning tape where drilling is undesirable."
  ],

  [
    "Lightning Conductor Wall Saddle",
    "Lightening",
    "pcs",
    4000,
    "Uganda Electrical Market",
    "Wall-mounted saddle for routing and securing lightning down conductors."
  ],

  [
    "Lightning Conductor Roof Clip",
    "Lightening",
    "pcs",
    4500,
    "Uganda Electrical Market",
    "Roof clip for securing lightning conductor tape without compromising roof installation."
  ],

  /* =====================================
     DOWN CONDUCTOR PROTECTION
  ===================================== */

  [
    "Lightning Down Conductor Guard 2m",
    "Lightening",
    "pcs",
    35000,
    "Uganda Electrical Market",
    "Protective galvanised or PVC guard tube for the lower section of a lightning down conductor."
  ],

  [
    "Lightning Down Conductor Guard 3m",
    "Lightening",
    "pcs",
    50000,
    "Uganda Electrical Market",
    "3 metre mechanical protection tube for exposed lightning down conductors."
  ],

  [
    "Galvanised Steel Lightning Guard Pipe 2m",
    "Lightening",
    "pcs",
    45000,
    "Uganda Electrical Market",
    "Galvanised steel protective pipe for exposed lightning down conductors."
  ],

  [
    "Lightning Conductor Warning Plate",
    "Lightening",
    "pcs",
    8000,
    "Uganda Electrical Market",
    "Warning identification plate marking a lightning down conductor."
  ],

  [
    "Lightning Protection Danger Sign",
    "Lightening",
    "pcs",
    10000,
    "Uganda Electrical Market",
    "Safety sign used to identify lightning protection and earthing installations."
  ],

  /* =====================================
     EARTH ELECTRODES
  ===================================== */

  [
    "Copper Bonded Earth Rod 12mm x 1.5m",
    "Lightening",
    "pcs",
    70000,
    "Uganda Electrical Market",
    "Copper-bonded steel earth electrode for lightning and electrical earthing systems."
  ],

  [
    "Copper Bonded Earth Rod 16mm x 1.5m",
    "Lightening",
    "pcs",
    85000,
    "Uganda Electrical Market",
    "Copper-bonded earth rod suitable for domestic and small commercial installations."
  ],

  [
    "Copper Bonded Earth Rod 16mm x 2.4m",
    "Lightening",
    "pcs",
    130000,
    "Uganda Electrical Market",
    "2.4 metre copper-bonded steel earth electrode for lightning protection and electrical earthing."
  ],

  [
    "Copper Bonded Earth Rod 20mm x 2.4m",
    "Lightening",
    "pcs",
    170000,
    "Uganda Electrical Market",
    "Heavy-duty 20mm copper-bonded earth electrode for commercial and industrial installations."
  ],

  [
    "Pure Copper Earth Rod 12mm x 1.5m",
    "Lightening",
    "pcs",
    100000,
    "Uganda Electrical Market",
    "Pure copper earth electrode for corrosion-resistant lightning and earthing systems."
  ],

  [
    "Pure Copper Earth Rod 16mm x 2.4m",
    "Lightening",
    "pcs",
    160000,
    "Uganda Electrical Market",
    "Pure copper earth rod for high-quality lightning and electrical earthing systems."
  ],

  [
    "Copper Bonded Earth Rod 20mm x 3m",
    "Lightening",
    "pcs",
    220000,
    "Uganda Electrical Market",
    "Long copper-bonded earth electrode for deep earth termination systems."
  ],

  [
    "Earth Rod Coupler 12mm",
    "Lightening",
    "pcs",
    12000,
    "Uganda Electrical Market",
    "Threaded coupler used to extend compatible earth rods."
  ],

  [
    "Earth Rod Coupler 16mm",
    "Lightening",
    "pcs",
    15000,
    "Uganda Electrical Market",
    "Heavy-duty threaded coupler for extending 16mm earth rods."
  ],

  [
    "Earth Rod Coupler 20mm",
    "Lightening",
    "pcs",
    20000,
    "Uganda Electrical Market",
    "Heavy-duty earth rod extension coupler."
  ],

  [
    "Earth Rod Driving Stud 16mm",
    "Lightening",
    "pcs",
    12000,
    "Uganda Electrical Market",
    "Driving accessory used to protect the threaded end of an earth rod during installation."
  ],

  [
    "Earth Rod Driving Stud 20mm",
    "Lightening",
    "pcs",
    16000,
    "Uganda Electrical Market",
    "Heavy-duty driving stud for 20mm earth electrodes."
  ],

  [
    "Earth Rod To Tape Clamp 25x3mm",
    "Lightening",
    "pcs",
    15000,
    "Uganda Electrical Market",
    "High-strength clamp for connecting copper earth tape to an earth rod."
  ],

  [
    "Earth Rod To Cable Clamp",
    "Lightening",
    "pcs",
    12000,
    "Uganda Electrical Market",
    "Earth electrode clamp for connecting an earthing conductor to a ground rod."
  ],

  [
    "Universal Earth Rod Clamp",
    "Lightening",
    "pcs",
    10000,
    "Uganda Electrical Market",
    "Adjustable brass or copper earth clamp for connecting conductors to earth electrodes."
  ],

  /* =====================================
     EARTH PITS & EARTH TERMINATION
  ===================================== */

  [
    "PVC Earth Inspection Pit 250x250mm",
    "Lightening",
    "pcs",
    45000,
    "Uganda Electrical Market",
    "Inspection chamber for accessing earth rod connections and testing joints."
  ],

  [
    "PVC Earth Inspection Pit 300x300mm",
    "Lightening",
    "pcs",
    65000,
    "Uganda Electrical Market",
    "Medium-size earth inspection chamber for domestic and commercial installations."
  ],

  [
    "PVC Earth Inspection Pit 450x450mm",
    "Lightening",
    "pcs",
    95000,
    "Uganda Electrical Market",
    "Large inspection chamber for multiple earth electrodes and heavy-duty earthing systems."
  ],

  [
    "Concrete Earth Inspection Pit 300x300mm",
    "Lightening",
    "pcs",
    55000,
    "Uganda Electrical Market",
    "Concrete inspection chamber for protecting earth electrode connections."
  ],

  [
    "Concrete Earth Inspection Pit 450x450mm",
    "Lightening",
    "pcs",
    90000,
    "Uganda Electrical Market",
    "Heavy-duty concrete earth pit suitable for commercial and industrial installations."
  ],

  [
    "Earth Pit Cover 300x300mm",
    "Lightening",
    "pcs",
    25000,
    "Uganda Electrical Market",
    "Removable inspection cover for earth electrode chambers."
  ],

  [
    "Earth Pit Cover 450x450mm",
    "Lightening",
    "pcs",
    40000,
    "Uganda Electrical Market",
    "Heavy-duty removable cover for large earth inspection pits."
  ],

  [
    "Earth Pit Bonding Bar 4-Way",
    "Lightening",
    "pcs",
    25000,
    "Uganda Electrical Market",
    "Copper or brass bonding bar for terminating multiple earth conductors inside an earth pit."
  ],

  [
    "Earth Pit Bonding Bar 6-Way",
    "Lightening",
    "pcs",
    35000,
    "Uganda Electrical Market",
    "Six-way earth bar for connecting multiple earth rods and bonding conductors."
  ],

  [
    "Earth Pit Bonding Bar 8-Way",
    "Lightening",
    "pcs",
    45000,
    "Uganda Electrical Market",
    "Eight-way earth termination bar for larger lightning protection systems."
  ],

  [
    "Main Copper Earth Bar 6-Way",
    "Lightening",
    "pcs",
    35000,
    "Uganda Electrical Market",
    "Copper earth bar for central equipotential bonding and earth conductor termination."
  ],

  [
    "Main Copper Earth Bar 12-Way",
    "Lightening",
    "pcs",
    65000,
    "Uganda Electrical Market",
    "Multi-way copper earth bar for commercial electrical and lightning bonding systems."
  ],

  [
    "Main Copper Earth Bar 24-Way",
    "Lightening",
    "pcs",
    120000,
    "Uganda Electrical Market",
    "Large copper equipotential bonding bar for industrial electrical installations."
  ],

  /* =====================================
     EARTH ENHANCEMENT MATERIALS
  ===================================== */

  [
    "Bentonite Earth Enhancement Compound 25kg",
    "Lightening",
    "bag",
    35000,
    "Uganda Electrical Market",
    "Ground enhancement compound used to improve earth electrode contact with surrounding soil."
  ],

  [
    "Bentonite Earth Enhancement Compound 50kg",
    "Lightening",
    "bag",
    65000,
    "Uganda Electrical Market",
    "Bulk bentonite compound for low-resistance earthing installations."
  ],

  [
    "Earthing Enhancement Compound 25kg",
    "Lightening",
    "bag",
    55000,
    "Uganda Electrical Market",
    "Conductive earth enhancement material for improving electrode-to-soil contact."
  ],

  [
    "Conductive Ground Enhancement Compound 25kg",
    "Lightening",
    "bag",
    70000,
    "Uganda Electrical Market",
    "Specialised conductive backfill material for reducing earth resistance."
  ],

  [
    "Earth Electrode Backfill Compound 50kg",
    "Lightening",
    "bag",
    95000,
    "Uganda Electrical Market",
    "Bulk conductive backfill compound for commercial and industrial earth termination systems."
  ],

  /* =====================================
     EARTHING & BONDING ACCESSORIES
  ===================================== */

  [
    "Earth Bonding Clamp 20mm",
    "Lightening",
    "pcs",
    8000,
    "Uganda Electrical Market",
    "Clamp for bonding metallic pipes and structural components to the earth network."
  ],

  [
    "Earth Bonding Clamp 25mm",
    "Lightening",
    "pcs",
    10000,
    "Uganda Electrical Market",
    "Bonding clamp for connecting metallic services to the equipotential earth network."
  ],

  [
    "Earth Bonding Clamp 50mm",
    "Lightening",
    "pcs",
    15000,
    "Uganda Electrical Market",
    "Heavy-duty bonding clamp for larger metallic pipes and structures."
  ],

  [
    "Earth Bonding Clamp 100mm",
    "Lightening",
    "pcs",
    25000,
    "Uganda Electrical Market",
    "Large adjustable clamp for bonding industrial pipework and metallic structures."
  ],

  [
    "Copper Earth Bonding Braid 16mm²",
    "Lightening",
    "metre",
    12000,
    "Uganda Electrical Market",
    "Flexible copper braid for bonding doors, gates, panels and equipment."
  ],

  [
    "Copper Earth Bonding Braid 25mm²",
    "Lightening",
    "metre",
    18000,
    "Uganda Electrical Market",
    "Flexible tinned copper bonding braid for equipotential bonding."
  ],

  [
    "Copper Earth Bonding Braid 35mm²",
    "Lightening",
    "metre",
    25000,
    "Uganda Electrical Market",
    "Heavy-duty flexible copper bonding braid for industrial equipment and structures."
  ],

  [
    "Copper Earth Bonding Cable 16mm²",
    "Lightening",
    "metre",
    12000,
    "Uganda Electrical Market",
    "Copper earth cable for bonding electrical equipment and metallic structures."
  ],

  [
    "Copper Earth Bonding Cable 25mm²",
    "Lightening",
    "metre",
    18000,
    "Uganda Electrical Market",
    "High-capacity copper bonding conductor for electrical and lightning protection systems."
  ],

  [
    "Copper Earth Bonding Cable 35mm²",
    "Lightening",
    "metre",
    25000,
    "Uganda Electrical Market",
    "Heavy-duty copper conductor for equipotential bonding and earth connections."
  ],

  [
    "Copper Earth Bonding Cable 50mm²",
    "Lightening",
    "metre",
    35000,
    "Uganda Electrical Market",
    "Large copper bonding conductor for industrial lightning and earthing installations."
  ],

  [
    "Earth Bonding Lug 16mm²",
    "Lightening",
    "pcs",
    3000,
    "Uganda Electrical Market",
    "Copper cable lug for terminating 16mm² earth bonding conductors."
  ],

  [
    "Earth Bonding Lug 25mm²",
    "Lightening",
    "pcs",
    4500,
    "Uganda Electrical Market",
    "Copper lug for terminating 25mm² earth bonding cables."
  ],

  [
    "Earth Bonding Lug 35mm²",
    "Lightening",
    "pcs",
    6000,
    "Uganda Electrical Market",
    "Heavy-duty copper lug for 35mm² earth conductors."
  ],

  [
    "Earth Bonding Lug 50mm²",
    "Lightening",
    "pcs",
    8000,
    "Uganda Electrical Market",
    "Heavy-duty copper lug for 50mm² bonding conductors."
  ],

  /* =====================================
     ROOF & STRUCTURAL BONDING
  ===================================== */

  [
    "Roof Metal Bonding Clamp",
    "Lightening",
    "pcs",
    12000,
    "Uganda Electrical Market",
    "Clamp for bonding metallic roof structures into the lightning protection system."
  ],

  [
    "Metal Roof Lightning Bond Clamp",
    "Lightening",
    "pcs",
    15000,
    "Uganda Electrical Market",
    "Heavy-duty clamp for connecting metal roofing to lightning protection conductors."
  ],

  [
    "Structural Steel Bonding Clamp",
    "Lightening",
    "pcs",
    18000,
    "Uganda Electrical Market",
    "Clamp for bonding structural steelwork into the building lightning and earthing network."
  ],

  [
    "Pipe Bonding Clamp 1 Inch",
    "Lightening",
    "pcs",
    8000,
    "Uganda Electrical Market",
    "Adjustable bonding clamp for 1-inch metallic pipes."
  ],

  [
    "Pipe Bonding Clamp 2 Inch",
    "Lightening",
    "pcs",
    12000,
    "Uganda Electrical Market",
    "Adjustable bonding clamp for 2-inch metallic pipes."
  ],

  [
    "Pipe Bonding Clamp 4 Inch",
    "Lightening",
    "pcs",
    20000,
    "Uganda Electrical Market",
    "Heavy-duty bonding clamp for large metallic pipework."
  ],

  [
    "Lightning Roof Conductor Holder",
    "Lightening",
    "pcs",
    5000,
    "Uganda Electrical Market",
    "Roof-mounted holder for supporting lightning conductor tape along roof surfaces."
  ],

  [
    "Lightning Roof Conductor Support",
    "Lightening",
    "pcs",
    6500,
    "Uganda Electrical Market",
    "Support bracket for maintaining conductor routing on roof structures."
  ],

  /* =====================================
     SPARK GAPS & ISOLATION
  ===================================== */

  [
    "Lightning Earth Spark Gap",
    "Lightening",
    "pcs",
    85000,
    "Uganda Electrical Market",
    "Spark gap device used to provide controlled separation and bonding within lightning protection systems."
  ],

  [
    "Lightning Isolating Spark Gap",
    "Lightening",
    "pcs",
    95000,
    "Uganda Electrical Market",
    "Isolation spark gap for controlled connection between lightning protection and bonded metallic systems."
  ],

  [
    "Lightning Test Disconnect Link",
    "Lightening",
    "pcs",
    30000,
    "Uganda Electrical Market",
    "Disconnecting link used to isolate earth electrodes for testing."
  ],

  /* =====================================
     LIGHTNING EVENT MONITORING
  ===================================== */

  [
    "Lightning Strike Event Counter",
    "Lightening",
    "pcs",
    350000,
    "Uganda Electrical Market",
    "Digital or electromechanical counter used to record lightning discharge events through the protection system."
  ],

  [
    "Lightning Strike Counter 6-Digit",
    "Lightening",
    "pcs",
    450000,
    "Uganda Electrical Market",
    "Six-digit lightning event counter for commercial and industrial protection systems."
  ],

  [
    "Lightning Current Counter",
    "Lightening",
    "pcs",
    550000,
    "Uganda Electrical Market",
    "Monitoring device used to record lightning current events on a down conductor."
  ],

  /* =====================================
     SURGE PROTECTION
  ===================================== */

  [
    "Type 1 Lightning Surge Protection Device 1P",
    "Lightening",
    "pcs",
    180000,
    "Uganda Electrical Market",
    "Type 1 surge protection device for protection against high-energy lightning transients."
  ],

  [
    "Type 1 Lightning Surge Protection Device 3P",
    "Lightening",
    "pcs",
    450000,
    "Uganda Electrical Market",
    "Three-phase Type 1 surge protection device for commercial and industrial installations."
  ],

  [
    "Type 1+2 Surge Protection Device 1P",
    "Lightening",
    "pcs",
    150000,
    "Uganda Electrical Market",
    "Combined Type 1 and Type 2 SPD for protection against lightning and switching surges."
  ],

  [
    "Type 1+2 Surge Protection Device 3P+N",
    "Lightening",
    "pcs",
    350000,
    "Uganda Electrical Market",
    "Three-phase plus neutral combined surge protection device for distribution boards."
  ],

  [
    "Type 2 Surge Protection Device 1P",
    "Lightening",
    "pcs",
    85000,
    "Uganda Electrical Market",
    "Type 2 SPD for protecting electrical circuits against transient overvoltage."
  ],

  [
    "Type 2 Surge Protection Device 3P+N",
    "Lightening",
    "pcs",
    180000,
    "Uganda Electrical Market",
    "Three-phase plus neutral Type 2 surge protection device."
  ],

  [
    "Type 3 Surge Protection Device",
    "Lightening",
    "pcs",
    65000,
    "Uganda Electrical Market",
    "Final-stage surge protection for sensitive electrical and electronic equipment."
  ],

  [
    "Solar DC Surge Protection Device 600V",
    "Lightening",
    "pcs",
    85000,
    "Uganda Solar Market",
    "DC surge protection device for photovoltaic strings and solar installations."
  ],

  [
    "Solar DC Surge Protection Device 1000V",
    "Lightening",
    "pcs",
    110000,
    "Uganda Solar Market",
    "1000V DC surge protection device for larger photovoltaic systems."
  ],

  [
    "Solar DC Surge Protection Device 1500V",
    "Lightening",
    "pcs",
    180000,
    "Uganda Solar Market",
    "High-voltage DC surge protection for commercial and industrial PV installations."
  ],

  [
    "AC Surge Protection Device 1P+N",
    "Lightening",
    "pcs",
    75000,
    "Uganda Electrical Market",
    "Single-phase AC surge protection for domestic distribution boards."
  ],

  [
    "AC Surge Protection Device 3P+N",
    "Lightening",
    "pcs",
    160000,
    "Uganda Electrical Market",
    "Three-phase AC surge protection for commercial and industrial distribution boards."
  ],

  /* =====================================
     EARTHING TESTING
  ===================================== */

  [
    "Earth Resistance Test Point",
    "Lightening",
    "pcs",
    15000,
    "Uganda Electrical Market",
    "Dedicated test point for measuring earth electrode resistance."
  ],

  [
    "Earth Test Link 2-Way",
    "Lightening",
    "pcs",
    18000,
    "Uganda Electrical Market",
    "Two-way disconnecting earth test link for testing and maintenance."
  ],

  [
    "Earth Test Link Heavy Duty",
    "Lightening",
    "pcs",
    35000,
    "Uganda Electrical Market",
    "Heavy-duty earth disconnecting link for commercial and industrial earthing systems."
  ],

  [
    "Earth Resistance Test Clamp",
    "Lightening",
    "pcs",
    25000,
    "Uganda Electrical Market",
    "Clamp accessory used when testing earth electrode and bonding connections."
  ],

  /* =====================================
     LIGHTNING INSTALLATION HARDWARE
  ===================================== */

  [
    "Lightning Protection Stainless Steel Screw Pack",
    "Lightening",
    "pack",
    15000,
    "Uganda Electrical Market",
    "Corrosion-resistant screws for fixing lightning protection conductor accessories."
  ],

  [
    "Lightning Protection Roof Fastener Pack",
    "Lightening",
    "pack",
    25000,
    "Uganda Electrical Market",
    "Roof fixing hardware for lightning conductor clips and supports."
  ],

  [
    "Lightning Protection Wall Plug & Screw Pack",
    "Lightening",
    "pack",
    12000,
    "Uganda Electrical Market",
    "Wall plugs and corrosion-resistant screws for mounting conductor clips."
  ],

  [
    "Lightning Conductor Stainless Steel Clamp",
    "Lightening",
    "pcs",
    10000,
    "Uganda Electrical Market",
    "Stainless steel clamp for securing lightning conductors in exposed environments."
  ],

  [
    "Lightning Conductor Brass Clamp",
    "Lightening",
    "pcs",
    12000,
    "Uganda Electrical Market",
    "Brass conductor clamp for corrosion-resistant lightning protection connections."
  ],

  [
    "Lightning Protection Expansion Joint",
    "Lightening",
    "pcs",
    35000,
    "Uganda Electrical Market",
    "Flexible joint used where lightning conductors cross building movement or expansion joints."
  ],

  /* =====================================
     COMPLETE LIGHTNING KITS
  ===================================== */

  [
    "Domestic Lightning Protection Kit",
    "Lightening",
    "kit",
    450000,
    "Uganda Electrical Market",
    "Basic residential lightning protection kit containing air terminal, conductor accessories, earth connection components and fixing hardware."
  ],

  [
    "Domestic Lightning Protection Kit Premium",
    "Lightening",
    "kit",
    750000,
    "Uganda Electrical Market",
    "Premium residential lightning protection package with copper air terminal, copper conductor, earth electrode and accessories."
  ],

  [
    "Commercial Lightning Protection Kit",
    "Lightening",
    "kit",
    1500000,
    "Uganda Electrical Market",
    "Commercial lightning protection package containing air termination, copper tape, down-conductor hardware and earth termination components."
  ]
  ];

  const materialExists = db.prepare(`
    SELECT id
    FROM materials
    WHERE
      LOWER(name) = LOWER(?)
      AND LOWER(
        COALESCE(supplier, '')
      ) = LOWER(
        COALESCE(?, '')
      )
    LIMIT 1
  `);

  const insertMaterial = db.prepare(`
    INSERT INTO materials (
      name,
      category,
      unit,
      price,
      supplier,
      notes
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    materials.forEach((material) => {
      if (!Array.isArray(material) || material.length !== 6) {
        console.warn(
          `Skipping invalid material seed:`,
          material
        );
        return;
      }

      const [
        name,
        category,
        unit,
        price,
        supplier,
        notes
      ] = material;

      const exists = materialExists.get(
        name,
        supplier
      );

      if (exists) {
        return;
      }

      insertMaterial.run(
        name,
        category,
        category === "Cables"
          ? "100m roll"
          : unit || "pcs",
        Number(price) || 0,
        supplier || "",
        notes || ""
      );
    });
  });

  transaction();
}

/* =========================================
   INVOICE FUNCTIONS
========================================= */

function getAllInvoices() {
  return db
    .prepare(`
      SELECT *
      FROM invoices
      ORDER BY id DESC
    `)
    .all();
}

function getInvoiceById(id) {
  return db
    .prepare(`
      SELECT *
      FROM invoices
      WHERE id = ?
    `)
    .get(id);
}

function getInvoiceWithItems(id) {
  const invoice = getInvoiceById(id);

  if (!invoice) {
    return null;
  }

  const items = db
    .prepare(`
      SELECT *
      FROM invoice_items
      WHERE invoice_id = ?
      ORDER BY id ASC
    `)
    .all(id);

  return {
    ...invoice,
    items,
  };
}

function createInvoice(invoice, items = []) {
  const transaction = db.transaction(() => {
    const result = db
      .prepare(`
        INSERT INTO invoices (
          invoice_number,
          client_id,
          client_name,
          client_phone,
          client_email,
          client_location,
          subject,
          description,
          subtotal,
          labour_cost,
          transport_cost,
          transport_description,
          tax_rate,
          tax_amount,
          discount,
          total,
          amount_paid,
          status,
          due_date,
          terms,
          notes,
          payment_info
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        invoice.invoice_number || "",
        invoice.client_id || null,
        invoice.client_name || "",
        invoice.client_phone || "",
        invoice.client_email || "",
        invoice.client_location || "",
        invoice.subject || "",
        invoice.description || "",
        Number(invoice.subtotal) || 0,
        Number(invoice.labour_cost) || 0,
        Number(invoice.transport_cost) || 0,
        invoice.transport_description || "",
        Number(invoice.tax_rate) || 0,
        Number(invoice.tax_amount) || 0,
        Number(invoice.discount) || 0,
        Number(invoice.total) || 0,
        Number(invoice.amount_paid) || 0,
        invoice.status || "Draft",
        invoice.due_date || null,
        invoice.terms || "",
        invoice.notes || "",
        invoice.payment_info || ""
      );

    const invoiceId = Number(
      result.lastInsertRowid
    );

    const insertItem = db.prepare(`
      INSERT INTO invoice_items (
        invoice_id,
        item_name,
        description,
        quantity,
        unit,
        unit_price,
        total
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      insertItem.run(
        invoiceId,
        item.item_name || "",
        item.description || "",
        Number(item.quantity) || 0,
        item.unit || "pcs",
        Number(item.unit_price) || 0,
        Number(item.total) ||
          (Number(item.quantity) || 0) *
          (Number(item.unit_price) || 0)
      );
    }

    return getInvoiceWithItems(invoiceId);
  });

  return transaction();
}

function updateInvoice(invoice, items = []) {
  const transaction = db.transaction(() => {
    db.prepare(`
      UPDATE invoices
      SET
        invoice_number = ?,
        client_id = ?,
        client_name = ?,
        client_phone = ?,
        client_email = ?,
        client_location = ?,
        subject = ?,
        description = ?,
        subtotal = ?,
        labour_cost = ?,
        transport_cost = ?,
        transport_description = ?,
        tax_rate = ?,
        tax_amount = ?,
        discount = ?,
        total = ?,
        amount_paid = ?,
        status = ?,
        due_date = ?,
        terms = ?,
        notes = ?,
        payment_info = ?
      WHERE id = ?
    `).run(
      invoice.invoice_number || "",
      invoice.client_id || null,
      invoice.client_name || "",
      invoice.client_phone || "",
      invoice.client_email || "",
      invoice.client_location || "",
      invoice.subject || "",
      invoice.description || "",
      Number(invoice.subtotal) || 0,
      Number(invoice.labour_cost) || 0,
      Number(invoice.transport_cost) || 0,
      invoice.transport_description || "",
      Number(invoice.tax_rate) || 0,
      Number(invoice.tax_amount) || 0,
      Number(invoice.discount) || 0,
      Number(invoice.total) || 0,
      Number(invoice.amount_paid) || 0,
      invoice.status || "Draft",
      invoice.due_date || null,
      invoice.terms || "",
      invoice.notes || "",
      invoice.payment_info || "",
      invoice.id
    );

    db.prepare(`
      DELETE FROM invoice_items
      WHERE invoice_id = ?
    `).run(invoice.id);

    const insertItem = db.prepare(`
      INSERT INTO invoice_items (
        invoice_id,
        item_name,
        description,
        quantity,
        unit,
        unit_price,
        total
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      insertItem.run(
        invoice.id,
        item.item_name || "",
        item.description || "",
        Number(item.quantity) || 0,
        item.unit || "pcs",
        Number(item.unit_price) || 0,
        Number(item.total) ||
          (Number(item.quantity) || 0) *
          (Number(item.unit_price) || 0)
      );
    }

    return getInvoiceWithItems(invoice.id);
  });

  return transaction();
}

function deleteInvoice(id) {
  const transaction = db.transaction(() => {
    db.prepare(`
      DELETE FROM invoice_items
      WHERE invoice_id = ?
    `).run(id);

    db.prepare(`
      DELETE FROM invoices
      WHERE id = ?
    `).run(id);

    return {
      success: true,
    };
  });

  return transaction();
}

/* =========================================
   RECEIPT FUNCTIONS
========================================= */

function getAllReceipts() {
  return db
    .prepare(`
      SELECT *
      FROM receipts
      ORDER BY id DESC
    `)
    .all();
}

function getReceiptById(id) {
  return db
    .prepare(`
      SELECT *
      FROM receipts
      WHERE id = ?
    `)
    .get(id);
}

function createReceipt(receipt) {
  const result = db
    .prepare(`
      INSERT INTO receipts (
        receipt_number,
        invoice_id,
        client_id,
        client_name,
        client_phone,
        client_email,
        client_location,
        invoice_number,
        amount,
        payment_method,
        payment_reference,
        notes,
        received_date,
        received_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      receipt.receipt_number || "",
      receipt.invoice_id || null,
      receipt.client_id || null,
      receipt.client_name || "",
      receipt.client_phone || "",
      receipt.client_email || "",
      receipt.client_location || "",
      receipt.invoice_number || "",
      Number(receipt.amount) || 0,
      receipt.payment_method || "Cash",
      receipt.payment_reference || "",
      receipt.notes || "",
      receipt.received_date || null,
      receipt.received_by || ""
    );

  return getReceiptById(
    Number(result.lastInsertRowid)
  );
}

function updateReceipt(receipt) {
  db.prepare(`
    UPDATE receipts
    SET
      receipt_number = ?,
      invoice_id = ?,
      client_id = ?,
      client_name = ?,
      client_phone = ?,
      client_email = ?,
      client_location = ?,
      invoice_number = ?,
      amount = ?,
      payment_method = ?,
      payment_reference = ?,
      notes = ?,
      received_date = ?,
      received_by = ?
    WHERE id = ?
  `).run(
    receipt.receipt_number || "",
    receipt.invoice_id || null,
    receipt.client_id || null,
    receipt.client_name || "",
    receipt.client_phone || "",
    receipt.client_email || "",
    receipt.client_location || "",
    receipt.invoice_number || "",
    Number(receipt.amount) || 0,
    receipt.payment_method || "Cash",
    receipt.payment_reference || "",
    receipt.notes || "",
    receipt.received_date || null,
    receipt.received_by || "",
    receipt.id
  );

  return getReceiptById(receipt.id);
}

function deleteReceipt(id) {
  db.prepare(`
    DELETE FROM receipts
    WHERE id = ?
  `).run(id);

  return {
    success: true,
  };
}

/* =========================================
   EXPENSE FUNCTIONS
========================================= */

function getAllExpenses() {
  return db
    .prepare(`
      SELECT *
      FROM expenses
      ORDER BY id DESC
    `)
    .all();
}

function getExpenseById(id) {
  return db
    .prepare(`
      SELECT *
      FROM expenses
      WHERE id = ?
    `)
    .get(id);
}

function createExpense(expense) {
  const result = db
    .prepare(`
      INSERT INTO expenses (
        description,
        category,
        amount,
        expense_date,
        project_id,
        project_name,
        paid_to,
        payment_method,
        notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      expense.description || "",
      expense.category || "Other",
      Number(expense.amount) || 0,
      expense.expense_date || null,
      expense.project_id || null,
      expense.project_name || "",
      expense.paid_to || "",
      expense.payment_method || "Cash",
      expense.notes || ""
    );

  return getExpenseById(
    Number(result.lastInsertRowid)
  );
}

function updateExpense(expense) {
  db.prepare(`
    UPDATE expenses
    SET
      description = ?,
      category = ?,
      amount = ?,
      expense_date = ?,
      project_id = ?,
      project_name = ?,
      paid_to = ?,
      payment_method = ?,
      notes = ?
    WHERE id = ?
  `).run(
    expense.description || "",
    expense.category || "Other",
    Number(expense.amount) || 0,
    expense.expense_date || null,
    expense.project_id || null,
    expense.project_name || "",
    expense.paid_to || "",
    expense.payment_method || "Cash",
    expense.notes || "",
    expense.id
  );

  return getExpenseById(expense.id);
}

function deleteExpense(id) {
  db.prepare(`
    DELETE FROM expenses
    WHERE id = ?
  `).run(id);

  return {
    success: true,
  };
}

/* =========================================
   DASHBOARD FUNCTIONS
========================================= */

function getDashboardStats() {
  const clients = db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM clients
    `)
    .get();

  const quotations = db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM quotations
    `)
    .get();

  const projects = db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM projects
    `)
    .get();

  const materials = db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM materials
    `)
    .get();

  const invoices = db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM invoices
    `)
    .get();

  const receipts = db
    .prepare(`
      SELECT
        COALESCE(SUM(amount), 0) AS total
      FROM receipts
    `)
    .get();

  const expenses = db
    .prepare(`
      SELECT
        COALESCE(SUM(amount), 0) AS total
      FROM expenses
    `)
    .get();

  const outstanding = db
    .prepare(`
      SELECT
        COALESCE(SUM(total), 0) AS total
      FROM invoices
      WHERE status != 'Paid'
    `)
    .get();

  return {
    clients: Number(clients?.count || 0),
    quotations: Number(quotations?.count || 0),
    projects: Number(projects?.count || 0),
    materials: Number(materials?.count || 0),
    invoices: Number(invoices?.count || 0),
    receipts: Number(receipts?.total || 0),
    expenses: Number(expenses?.total || 0),
    outstanding: Number(outstanding?.total || 0),
  };
}

/* =========================================
   DATABASE CLOSE
========================================= */

function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

/* =========================================
   EXPORTS
========================================= */

module.exports = {
  initializeDatabase,
  closeDatabase,

  // Clients
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,

  // Quotations
  getAllQuotations,
  getQuotationById,
  getQuotationWithItems,
  createQuotation,
  updateQuotation,
  deleteQuotation,

  // Projects
  getAllProjects,
  getProjectById,
  getProjectByQuotationId,
  createProject,
  updateProject,
  updateProjectByQuotationId,
  deleteProject,

  // Materials
  getAllMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,

  // Material images
  saveMaterialImage,
  removeMaterialImage,

  // Invoices
  getAllInvoices,
  getInvoiceById,
  getInvoiceWithItems,
  createInvoice,
  updateInvoice,
  deleteInvoice,

  // Receipts
  getAllReceipts,
  getReceiptById,
  createReceipt,
  updateReceipt,
  deleteReceipt,

  // Expenses
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,

  // Dashboard
  getDashboardStats,
};
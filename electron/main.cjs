const { app, BrowserWindow, ipcMain, dialog, net } = require("electron");
const path = require("path");
const fs = require("fs");

const {
  initializeDatabase,

  // Clients
  getAllClients,
  createClient,
  updateClient,
  deleteClient,

  // Quotations
  getAllQuotations,
  getQuotationById,
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
  saveMaterialImage,
  removeMaterialImage,

  // Invoices
  getAllInvoices,
  getInvoiceById,
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
} = require("./database.cjs");

/* =========================================
   SETTINGS
========================================= */

const settingsPath = path.join(
  app.getPath("userData"),
  "voltdesk-settings.json"
);

function readSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(
        fs.readFileSync(settingsPath, "utf8")
      );
    }
  } catch (e) {
    console.error("readSettings", e);
  }

  return {};
}

function writeSettings(data) {
  try {
    fs.writeFileSync(
      settingsPath,
      JSON.stringify(data, null, 2),
      "utf8"
    );
  } catch (e) {
    console.error("writeSettings", e);
  }
}

/* =========================================
   HTTP JSON HELPER
========================================= */

async function httpJson(url, options = {}) {
  const init = {
    method: options.method || "GET",
    headers: options.headers || {},
    body: options.body,
  };

  let response;

  try {
    if (
      net &&
      typeof net.fetch === "function"
    ) {
      response = await net.fetch(url, init);
    } else if (typeof fetch === "function") {
      response = await fetch(url, init);
    } else {
      throw new Error(
        "No fetch available in main process."
      );
    }
  } catch (err) {
    const msg =
      err && err.message
        ? err.message
        : String(err);

    throw new Error(
      "Network error: " + msg
    );
  }

  const text = await response.text();

  let data = {};

  try {
    data = text
      ? JSON.parse(text)
      : {};
  } catch {
    data = {
      raw: text,
    };
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

/* =========================================
   IMAGE DOWNLOAD HELPER
========================================= */

async function downloadImage(
  imageUrl,
  destinationPath
) {
  if (
    !imageUrl ||
    typeof imageUrl !== "string"
  ) {
    throw new Error(
      "Invalid image URL."
    );
  }

  let response;

  try {
    if (
      net &&
      typeof net.fetch === "function"
    ) {
      response = await net.fetch(
        imageUrl,
        {
          method: "GET",
          headers: {
            "User-Agent":
              "VoltDesk/1.0",
            Accept:
              "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          },
        }
      );
    } else if (
      typeof fetch === "function"
    ) {
      response = await fetch(
        imageUrl,
        {
          method: "GET",
          headers: {
            "User-Agent":
              "VoltDesk/1.0",
            Accept:
              "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          },
        }
      );
    } else {
      throw new Error(
        "No network fetch support available."
      );
    }
  } catch (error) {
    throw new Error(
      "Could not download image: " +
        (error.message || error)
    );
  }

  if (!response.ok) {
    throw new Error(
      `Image server returned HTTP ${response.status}.`
    );
  }

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  /*
   * Only allow actual image responses.
   * This prevents accidentally saving an HTML page
   * instead of an image.
   */
  if (
    !contentType.toLowerCase().startsWith(
      "image/"
    )
  ) {
    throw new Error(
      "The selected URL did not return an image."
    );
  }

  const arrayBuffer =
    await response.arrayBuffer();

  const buffer = Buffer.from(
    arrayBuffer
  );

  if (!buffer.length) {
    throw new Error(
      "Downloaded image is empty."
    );
  }

  /*
   * Determine extension from content type.
   */
  let extension = ".jpg";

  if (
    contentType.includes("png")
  ) {
    extension = ".png";
  } else if (
    contentType.includes("webp")
  ) {
    extension = ".webp";
  } else if (
    contentType.includes("gif")
  ) {
    extension = ".gif";
  } else if (
    contentType.includes("bmp")
  ) {
    extension = ".bmp";
  } else if (
    contentType.includes("svg")
  ) {
    extension = ".svg";
  } else if (
    contentType.includes("jpeg") ||
    contentType.includes("jpg")
  ) {
    extension = ".jpg";
  }

  const finalPath =
    destinationPath.endsWith(extension)
      ? destinationPath
      : destinationPath + extension;

  fs.writeFileSync(
    finalPath,
    buffer
  );

  return {
    path: finalPath,
    extension,
    size: buffer.length,
    contentType,
  };
}

/* =========================================
   MATERIAL IMAGE DIRECTORY
========================================= */

function getMaterialImagesDirectory() {
  const directory = path.join(
    app.getPath("userData"),
    "material-images"
  );

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, {
      recursive: true,
    });
  }

  return directory;
}

/* =========================================
   SAFE MATERIAL IMAGE FILENAME
========================================= */

function createMaterialImageFilename(
  materialId
) {
  const timestamp =
    Date.now();

  return `material-${materialId}-${timestamp}`;
}

/* =========================================
   WINDOW
========================================= */

function createWindow() {
  // =========================================
  // ICON CONFIGURATION
  // =========================================

  // Determine the correct icon path based on platform
  const isWindows = process.platform === "win32";
  const isMac = process.platform === "darwin";
  const isLinux = process.platform === "linux";

  let iconPath;

  // Try different icon formats based on platform
  if (isWindows) {
    // Windows prefers .ico format
    const icoPath = path.join(__dirname, "assets", "branding", "WamaraLogo.ico");
    const pngPath = path.join(__dirname, "assets", "branding", "WamaraLogo.jpg");
    iconPath = fs.existsSync(icoPath) ? icoPath : pngPath;
  } else if (isMac) {
    // macOS prefers .icns format
    const icnsPath = path.join(__dirname, "assets", "branding", "WamaraLogo.icns");
    const pngPath = path.join(__dirname, "assets", "branding", "WamaraLogo.jpg");
    iconPath = fs.existsSync(icnsPath) ? icnsPath : pngPath;
  } else {
    // Linux uses .png
    iconPath = path.join(__dirname, "assets", "branding", "WamaraLogo.jpg");
  }

  // If icon doesn't exist, log a warning but continue
  if (!fs.existsSync(iconPath)) {
    console.warn("Icon not found at:", iconPath);
    console.warn("Using default Electron icon.");
    iconPath = null;
  } else {
    console.log("Using icon:", iconPath);
  }

  const mainWindow =
    new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 1000,
      minHeight: 650,

      // =========================================
      // SET THE WINDOW ICON HERE
      // =========================================
      icon: iconPath,

      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.join(
          __dirname,
          "preload.cjs"
        ),
      },
    });

  // =========================================
  // Set macOS Dock Icon (optional)
  // =========================================
  if (isMac && iconPath) {
    try {
      app.dock.setIcon(iconPath);
    } catch (dockError) {
      console.warn("Could not set dock icon:", dockError);
    }
  }

  // Development
  mainWindow.loadURL(
    "http://localhost:5173"
  );

  // Production:
  // mainWindow.loadFile(
  //   path.join(
  //     __dirname,
  //     "dist/index.html"
  //   )
  // );
}

/* =========================================
   APP READY
========================================= */

app.whenReady().then(() => {
  initializeDatabase();

  /* =======================================
     MATERIALS
  ======================================= */

  ipcMain.handle(
    "materials:getAll",
    async () => {
      try {
        return getAllMaterials();
      } catch (err) {
        console.error(
          "materials:getAll",
          err
        );
        throw err;
      }
    }
  );

  ipcMain.handle(
    "materials:getById",
    async (_, id) => {
      try {
        return getMaterialById(id);
      } catch (err) {
        console.error(
          "materials:getById",
          err
        );
        throw err;
      }
    }
  );

  ipcMain.handle(
    "materials:create",
    async (_, material) => {
      try {
        return createMaterial(
          material
        );
      } catch (err) {
        console.error(
          "materials:create",
          err
        );
        throw err;
      }
    }
  );

  ipcMain.handle(
    "materials:update",
    async (_, material) => {
      try {
        return updateMaterial(
          material
        );
      } catch (err) {
        console.error(
          "materials:update",
          err
        );
        throw err;
      }
    }
  );

  ipcMain.handle(
    "materials:delete",
    async (_, id) => {
      try {
        return deleteMaterial(id);
      } catch (err) {
        console.error(
          "materials:delete",
          err
        );
        throw err;
      }
    }
  );

  /* =======================================
     MATERIAL IMAGE SEARCH
  ======================================= */

  ipcMain.handle(
    "materials:searchImages",
    async (_, query) => {
      try {
        const settings =
          readSettings();

        const googleApiKey =
          String(
            settings.googleImagesApiKey ||
              ""
          ).trim();

        const googleSearchEngineId =
          String(
            settings.googleSearchEngineId ||
              ""
          ).trim();

        if (!googleApiKey) {
          throw new Error(
            "Google Images API key is not configured. Add it in VoltDesk settings."
          );
        }

        if (!googleSearchEngineId) {
          throw new Error(
            "Google Search Engine ID is not configured. Add it in VoltDesk settings."
          );
        }

        const searchText =
          String(query || "").trim();

        if (!searchText) {
          throw new Error(
            "Enter a material name to search."
          );
        }

        /*
         * Google Programmable Search /
         * Custom Search JSON API.
         */
        const url =
          "https://www.googleapis.com/customsearch/v1" +
          "?key=" +
          encodeURIComponent(
            googleApiKey
          ) +
          "&cx=" +
          encodeURIComponent(
            googleSearchEngineId
          ) +
          "&q=" +
          encodeURIComponent(
            searchText
          ) +
          "&searchType=image" +
          "&num=10" +
          "&safe=active";

        const {
          ok,
          status,
          data,
        } = await httpJson(url);

        if (!ok) {
          const message =
            data &&
            data.error &&
            data.error.message
              ? data.error.message
              : `Google image search failed (${status}).`;

          throw new Error(
            message
          );
        }

        const items =
          Array.isArray(
            data.items
          )
            ? data.items
            : [];

        const results =
          items
            .map(
              (item, index) => ({
                id:
                  item.cacheId ||
                  `${Date.now()}-${index}`,

                title:
                  item.title ||
                  "Material image",

                imageUrl:
                  item.link || "",

                thumbnailUrl:
                  item.image &&
                  item.image.thumbnailLink
                    ? item.image
                        .thumbnailLink
                    : item.link || "",

                sourceUrl:
                  item.image &&
                  item.image.contextLink
                    ? item.image
                        .contextLink
                    : item.link || "",

                sourceName:
                  item.displayLink ||
                  "",
              })
            )
            .filter(
              (item) =>
                Boolean(
                  item.imageUrl
                )
            );

        return {
          success: true,
          items: results,
        };
      } catch (err) {
        console.error(
          "materials:searchImages",
          err
        );

        return {
          success: false,
          items: [],
          error:
            err && err.message
              ? err.message
              : String(err),
        };
      }
    }
  );

  /* =======================================
     SAVE MATERIAL IMAGE
  ======================================= */

  ipcMain.handle(
    "materials:saveImage",
    async (_, payload) => {
      try {
        if (
          !payload ||
          !payload.materialId
        ) {
          throw new Error(
            "Material ID is required."
          );
        }

        const materialId =
          Number(
            payload.materialId
          );

        if (
          !Number.isInteger(
            materialId
          ) ||
          materialId <= 0
        ) {
          throw new Error(
            "Invalid material ID."
          );
        }

        const imageUrl =
          String(
            payload.imageUrl ||
              ""
          ).trim();

        if (!imageUrl) {
          throw new Error(
            "Image URL is required."
          );
        }

        const material =
          getMaterialById(
            materialId
          );

        if (!material) {
          throw new Error(
            "Material not found."
          );
        }

        /*
         * Remove the old local image first
         * only after confirming we have a valid
         * material.
         */
        const oldImagePath =
          material.image_path;

        const imageDirectory =
          getMaterialImagesDirectory();

        const filename =
          createMaterialImageFilename(
            materialId
          );

        const destination =
          path.join(
            imageDirectory,
            filename
          );

        const downloaded =
          await downloadImage(
            imageUrl,
            destination
          );

        /*
         * Save relative/local path information
         * in SQLite.
         */
        const updatedMaterial =
          saveMaterialImage(
            materialId,
            downloaded.path,
            imageUrl,
            payload.sourceName ||
              "",
            payload.sourceUrl ||
              ""
          );

        /*
         * Remove previous image only after
         * successfully downloading and saving
         * the replacement.
         */
        if (
          oldImagePath &&
          oldImagePath !==
            downloaded.path &&
          fs.existsSync(
            oldImagePath
          )
        ) {
          try {
            fs.unlinkSync(
              oldImagePath
            );
          } catch (deleteError) {
            console.warn(
              "Could not remove old material image:",
              deleteError
            );
          }
        }

        return {
          success: true,
          material:
            updatedMaterial,
          path:
            downloaded.path,
        };
      } catch (err) {
        console.error(
          "materials:saveImage",
          err
        );

        return {
          success: false,
          error:
            err && err.message
              ? err.message
              : String(err),
        };
      }
    }
  );

  /* =======================================
     REMOVE MATERIAL IMAGE
  ======================================= */

  ipcMain.handle(
    "materials:removeImage",
    async (_, materialId) => {
      try {
        const id =
          Number(materialId);

        if (
          !Number.isInteger(id) ||
          id <= 0
        ) {
          throw new Error(
            "Invalid material ID."
          );
        }

        const material =
          getMaterialById(id);

        if (!material) {
          throw new Error(
            "Material not found."
          );
        }

        const imagePath =
          material.image_path;

        /*
         * Remove physical file.
         */
        if (
          imagePath &&
          fs.existsSync(
            imagePath
          )
        ) {
          try {
            fs.unlinkSync(
              imagePath
            );
          } catch (fileError) {
            console.warn(
              "Could not delete material image file:",
              fileError
            );
          }
        }

        /*
         * Clear database references.
         */
        const updatedMaterial =
          removeMaterialImage(
            id
          );

        return {
          success: true,
          material:
            updatedMaterial,
        };
      } catch (err) {
        console.error(
          "materials:removeImage",
          err
        );

        return {
          success: false,
          error:
            err && err.message
              ? err.message
              : String(err),
        };
      }
    }
  );

  /* =======================================
     CLIENTS
  ======================================= */

  ipcMain.handle(
    "clients:getAll",
    async () => {
      try {
        return getAllClients();
      } catch (err) {
        console.error(
          "clients:getAll",
          err
        );
        throw err;
      }
    }
  );

  ipcMain.handle(
    "clients:create",
    async (_, client) => {
      try {
        return createClient(
          client.name,
          client.phone,
          client.email,
          client.location
        );
      } catch (err) {
        console.error(
          "clients:create",
          err
        );
        throw err;
      }
    }
  );

  ipcMain.handle(
    "clients:update",
    async (_, client) => {
      try {
        return updateClient(
          client.id,
          client.name,
          client.phone,
          client.email,
          client.location
        );
      } catch (err) {
        console.error(
          "clients:update",
          err
        );
        throw err;
      }
    }
  );

  ipcMain.handle(
    "clients:delete",
    async (_, id) => {
      try {
        return deleteClient(id);
      } catch (err) {
        console.error(
          "clients:delete",
          err
        );
        throw err;
      }
    }
  );

  /* =======================================
     QUOTATIONS
  ======================================= */

  ipcMain.handle(
    "quotations:getAll",
    async () => {
      try {
        return getAllQuotations();
      } catch (err) {
        console.error(
          "quotations:getAll",
          err
        );
        throw err;
      }
    }
  );

  ipcMain.handle(
    "quotations:getById",
    async (_, id) => {
      try {
        return getQuotationById(id);
      } catch (err) {
        console.error(
          "quotations:getById",
          err
        );
        throw err;
      }
    }
  );

  ipcMain.handle(
    "quotations:create",
    async (_, quotation) => {
      try {
        return createQuotation(
          quotation
        );
      } catch (err) {
        console.error(
          "quotations:create",
          err
        );
        throw err;
      }
    }
  );

  ipcMain.handle(
    "quotations:update",
    async (_, quotation) => {
      try {
        return updateQuotation(
          quotation
        );
      } catch (err) {
        console.error(
          "quotations:update",
          err
        );
        throw err;
      }
    }
  );

  ipcMain.handle(
    "quotations:delete",
    async (_, id) => {
      try {
        return deleteQuotation(id);
      } catch (err) {
        console.error(
          "quotations:delete",
          err
        );
        throw err;
      }
    }
  );

  /* =======================================
     PROJECTS
  ======================================= */

  ipcMain.handle(
    "projects:getAll",
    async () => {
      try {
        return getAllProjects();
      } catch (err) {
        console.error(
          "projects:getAll",
          err
        );
        throw err;
      }
    }
  );

  ipcMain.handle(
    "projects:getById",
    async (_, id) => {
      try {
        return getProjectById(id);
      } catch (err) {
        console.error(
          "projects:getById",
          err
        );
        throw err;
      }
    }
  );

  ipcMain.handle(
    "projects:getByQuotationId",
    async (_, quotationId) => {
      try {
        return getProjectByQuotationId(
          quotationId
        );
      } catch (err) {
        console.error(
          "projects:getByQuotationId",
          err
        );
        throw err;
      }
    }
  );

  ipcMain.handle(
    "projects:create",
    async (_, project) => {
      try {
        return createProject(
          project
        );
      } catch (err) {
        console.error(
          "projects:create",
          err
        );
        throw err;
      }
    }
  );

  ipcMain.handle(
    "projects:update",
    async (_, project) => {
      try {
        return updateProject(
          project
        );
      } catch (err) {
        console.error(
          "projects:update",
          err
        );
        throw err;
      }
    }
  );

  ipcMain.handle(
    "projects:updateByQuotationId",
    async (
      _,
      quotationId,
      updates
    ) => {
      try {
        return updateProjectByQuotationId(
          quotationId,
          updates
        );
      } catch (err) {
        console.error(
          "projects:updateByQuotationId",
          err
        );
        throw err;
      }
    }
  );

  ipcMain.handle(
    "projects:delete",
    async (_, id) => {
      try {
        return deleteProject(id);
      } catch (err) {
        console.error(
          "projects:delete",
          err
        );
        throw err;
      }
    }
  );

  /* =======================================
     INVOICES
  ======================================= */

  ipcMain.handle(
    "invoices:getAll",
    async () => {
      try {
        return getAllInvoices();
      } catch (err) {
        console.error(
          "invoices:getAll",
          err
        );
        throw err;
      }
    }
  );

  ipcMain.handle(
    "invoices:getById",
    async (_, id) => {
      try {
        return getInvoiceById(id);
      } catch (err) {
        console.error(
          "invoices:getById",
          err
        );
        throw err;
      }
    }
  );

  ipcMain.handle(
    "invoices:create",
    async (_, invoice) => {
      try {
        return createInvoice(
          invoice
        );
      } catch (err) {
        console.error(
          "invoices:create",
          err
        );
        throw err;
      }
    }
  );

  ipcMain.handle(
    "invoices:update",
    async (_, invoice) => {
      try {
        return updateInvoice(
          invoice
        );
      } catch (err) {
        console.error(
          "invoices:update",
          err
        );
        throw err;
      }
    }
  );

  ipcMain.handle(
    "invoices:delete",
    async (_, id) => {
      try {
        return deleteInvoice(id);
      } catch (err) {
        console.error(
          "invoices:delete",
          err
        );
        throw err;
      }
    }
  );

  /* =======================================
     RECEIPTS
  ======================================= */

  ipcMain.handle(
    "receipts:getAll",
    async () => {
      try {
        return getAllReceipts();
      } catch (err) {
        console.error(
          "receipts:getAll",
          err
        );
        throw err;
      }
    }
  );

  ipcMain.handle(
    "receipts:getById",
    async (_, id) => {
      try {
        return getReceiptById(id);
      } catch (err) {
        console.error(
          "receipts:getById",
          err
        );
        throw err;
      }
    }
  );

  ipcMain.handle(
    "receipts:create",
    async (_, receipt) => {
      try {
        return createReceipt(
          receipt
        );
      } catch (err) {
        console.error(
          "receipts:create",
          err
        );
        throw err;
      }
    }
  );

  ipcMain.handle(
    "receipts:update",
    async (_, receipt) => {
      try {
        return updateReceipt(
          receipt
        );
      } catch (err) {
        console.error(
          "receipts:update",
          err
        );
        throw err;
      }
    }
  );

  ipcMain.handle(
    "receipts:delete",
    async (_, id) => {
      try {
        return deleteReceipt(id);
      } catch (err) {
        console.error(
          "receipts:delete",
          err
        );
        throw err;
      }
    }
  );

  /* =======================================
     EXPENSES
  ======================================= */

  ipcMain.handle(
    "expenses:getAll",
    async () => {
      try {
        return getAllExpenses();
      } catch (err) {
        console.error(
          "expenses:getAll",
          err
        );
        throw err;
      }
    }
  );

  ipcMain.handle(
    "expenses:getById",
    async (_, id) => {
      try {
        return getExpenseById(id);
      } catch (err) {
        console.error(
          "expenses:getById",
          err
        );
        throw err;
      }
    }
  );

  ipcMain.handle(
    "expenses:create",
    async (_, expense) => {
      try {
        return createExpense(
          expense
        );
      } catch (err) {
        console.error(
          "expenses:create",
          err
        );
        throw err;
      }
    }
  );

  ipcMain.handle(
    "expenses:update",
    async (_, expense) => {
      try {
        return updateExpense(
          expense
        );
      } catch (err) {
        console.error(
          "expenses:update",
          err
        );
        throw err;
      }
    }
  );

  ipcMain.handle(
    "expenses:delete",
    async (_, id) => {
      try {
        return deleteExpense(id);
      } catch (err) {
        console.error(
          "expenses:delete",
          err
        );
        throw err;
      }
    }
  );

  /* =======================================
     SETTINGS — GEMINI
  ======================================= */

  ipcMain.handle(
    "settings:getGeminiKey",
    async () => {
      try {
        const settings =
          readSettings();

        return (
          settings.geminiApiKey ||
          ""
        );
      } catch (err) {
        console.error(
          "settings:getGeminiKey",
          err
        );

        return "";
      }
    }
  );

  ipcMain.handle(
    "settings:setGeminiKey",
    async (_, key) => {
      try {
        const settings =
          readSettings();

        settings.geminiApiKey =
          String(
            key || ""
          ).trim();

        writeSettings(
          settings
        );

        return {
          success: true,
        };
      } catch (err) {
        console.error(
          "settings:setGeminiKey",
          err
        );

        throw err;
      }
    }
  );

  /* =======================================
     SETTINGS — GOOGLE IMAGE SEARCH
  ======================================= */

  ipcMain.handle(
    "settings:getGoogleImagesKey",
    async () => {
      try {
        const settings =
          readSettings();

        return (
          settings.googleImagesApiKey ||
          ""
        );
      } catch (err) {
        console.error(
          "settings:getGoogleImagesKey",
          err
        );

        return "";
      }
    }
  );

  ipcMain.handle(
    "settings:setGoogleImagesKey",
    async (_, key) => {
      try {
        const settings =
          readSettings();

        settings.googleImagesApiKey =
          String(
            key || ""
          ).trim();

        writeSettings(
          settings
        );

        return {
          success: true,
        };
      } catch (err) {
        console.error(
          "settings:setGoogleImagesKey",
          err
        );

        throw err;
      }
    }
  );

  ipcMain.handle(
    "settings:getGoogleSearchEngineId",
    async () => {
      try {
        const settings =
          readSettings();

        return (
          settings.googleSearchEngineId ||
          ""
        );
      } catch (err) {
        console.error(
          "settings:getGoogleSearchEngineId",
          err
        );

        return "";
      }
    }
  );

  ipcMain.handle(
    "settings:setGoogleSearchEngineId",
    async (_, id) => {
      try {
        const settings =
          readSettings();

        settings.googleSearchEngineId =
          String(
            id || ""
          ).trim();

        writeSettings(
          settings
        );

        return {
          success: true,
        };
      } catch (err) {
        console.error(
          "settings:setGoogleSearchEngineId",
          err
        );

        throw err;
      }
    }
  );

  /* =======================================
     AI CHAT — GEMINI
  ======================================= */

  ipcMain.handle(
    "ai:chat",
    async (_, payload) => {
      try {
        const settings =
          readSettings();

        const apiKey =
          (
            settings.geminiApiKey ||
            ""
          ).trim();

        if (!apiKey) {
          throw new Error(
            "No Gemini API key set. Open AI Assistant → Settings and add your free key from Google AI Studio."
          );
        }

        const model =
          (payload &&
            payload.model) ||
          "gemini-3.6-flash";

        const contents =
          payload &&
          payload.contents;

        if (
          !Array.isArray(
            contents
          ) ||
          contents.length === 0
        ) {
          throw new Error(
            "Invalid chat payload."
          );
        }

        const url =
          "https://generativelanguage.googleapis.com/v1beta/models/" +
          encodeURIComponent(
            model
          ) +
          ":generateContent?key=" +
          encodeURIComponent(
            apiKey
          );

        const {
          ok,
          status,
          data,
        } = await httpJson(
          url,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              contents,
              generationConfig: {
                temperature: 0.6,
                maxOutputTokens: 2048,
              },
            }),
          }
        );

        if (!ok) {
          const apiMessage =
            data &&
            data.error &&
            data.error.message
              ? data.error.message
              : "Gemini request failed (" +
                status +
                ")";

          if (
            status === 400 &&
            /model/i.test(
              apiMessage
            )
          ) {
            throw new Error(
              apiMessage +
                " Try changing GEMINI_MODEL in AIAssistantPage.tsx to gemini-3.6-flash or gemini-2.5-flash."
            );
          }

          if (
            status === 403 ||
            status === 401
          ) {
            throw new Error(
              apiMessage +
                " Check that the key is from Google AI Studio."
            );
          }

          if (
            status === 429
          ) {
            throw new Error(
              apiMessage +
                " Free-tier quota exceeded — wait and try again."
            );
          }

          throw new Error(
            apiMessage
          );
        }

        const parts =
          data &&
          data.candidates &&
          data.candidates[0] &&
          data.candidates[0].content &&
          data.candidates[0]
            .content.parts;

        const text =
          Array.isArray(
            parts
          )
            ? parts
                .map(
                  function (p) {
                    return (
                      p.text ||
                      ""
                    );
                  }
                )
                .join("")
                .trim()
            : "";

        if (!text) {
          throw new Error(
            "Gemini returned an empty response. Try again or check free-tier quota."
          );
        }

        return {
          text,
        };
      } catch (err) {
        console.error(
          "ai:chat",
          err
        );

        throw err;
      }
    }
  );

  /* =======================================
     PDF GENERATION
  ======================================= */

  ipcMain.handle(
    "print-to-pdf",
    async (
      event,
      html,
      filename
    ) => {
      let pdfWindow = null;

      try {
        pdfWindow =
          new BrowserWindow({
            width: 800,
            height: 1100,
            show: false,

            webPreferences: {
              nodeIntegration: false,
              contextIsolation: true,
            },
          });

        await pdfWindow.loadURL(
          "data:text/html;charset=utf-8," +
            encodeURIComponent(
              html
            )
        );

        await new Promise(
          function (
            resolve
          ) {
            setTimeout(
              resolve,
              800
            );
          }
        );

        const pdfBuffer =
          await pdfWindow.webContents.printToPDF(
            {
              printBackground: true,
              pageSize: "A4",

              margins: {
                top: 0.4,
                bottom: 0.4,
                left: 0.4,
                right: 0.4,
              },
            }
          );

        const result =
          await dialog.showSaveDialog(
            {
              title:
                "Save PDF",

              defaultPath:
                filename ||
                "document.pdf",

              filters: [
                {
                  name: "PDF Files",
                  extensions: [
                    "pdf",
                  ],
                },
              ],
            }
          );

        if (
          result.canceled ||
          !result.filePath
        ) {
          return {
            success: false,
          };
        }

        fs.writeFileSync(
          result.filePath,
          pdfBuffer
        );

        return {
          success: true,
          path:
            result.filePath,
        };
      } catch (error) {
        console.error(
          "PDF generation error:",
          error
        );

        throw error;
      } finally {
        if (
          pdfWindow &&
          !pdfWindow.isDestroyed()
        ) {
          pdfWindow.close();
        }
      }
    }
  );

  /* =======================================
     CREATE MAIN WINDOW
  ======================================= */

  createWindow();
});

/* =========================================
   APP LIFECYCLE
========================================= */

app.on(
  "window-all-closed",
  () => {
    if (
      process.platform !==
      "darwin"
    ) {
      app.quit();
    }
  }
);

app.on(
  "activate",
  () => {
    if (
      BrowserWindow.getAllWindows()
        .length === 0
    ) {
      createWindow();
    }
  }
);
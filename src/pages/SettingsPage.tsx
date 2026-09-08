import { useEffect, useRef, useState } from "react";
import {
  Building2,
  FileText,
  Database,
  Palette,
  Save,
  Phone,
  Mail,
  MapPin,
  Hash,
  Percent,
  CreditCard,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  BriefcaseBusiness,
  Receipt,
  FileSignature,
  WalletCards,
  Monitor,
  Sun,
  Moon,
} from "lucide-react";

import PageHeader from "../components/PageHeader";
import "../styles/SettingsPage.css";

const DEFAULT_SETTINGS = {
  business: {
    name: "Wamara Contractors",
    tagline: "Powering every project. Building trust.",
    phone: "",
    alternatePhone: "",
    email: "",
    address: "",
    city: "Kampala, Uganda",
    tin: "",
    registrationNumber: "",
    website: "",
  },

  documents: {
    currency: "UGX",
    taxEnabled: false,
    taxRate: 18,
    quotationPrefix: "QT",
    invoicePrefix: "INV",
    receiptPrefix: "REC",
    paymentTerms: "Payment due upon receipt",
    quotationValidity: "30 days",
    footerNote:
      "Thank you for choosing Wamara Contractors.",
    paymentInstructions:
      "Payment can be made through the agreed business payment channels.",
  },

  appearance: {
    theme: "light",
    density: "comfortable",
    showBranding: true,
  },
};

function SettingsPage() {
  const [activeSection, setActiveSection] = useState("business");

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const [saveState, setSaveState] = useState("idle");
  const [message, setMessage] = useState("");

  const fileInputRef = useRef(null);

  // ------------------------------------------------------------
  // LOAD SETTINGS
  // ------------------------------------------------------------

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("voltdesk_settings");

      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);

        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsed,
          business: {
            ...DEFAULT_SETTINGS.business,
            ...(parsed.business || {}),
          },
          documents: {
            ...DEFAULT_SETTINGS.documents,
            ...(parsed.documents || {}),
          },
          appearance: {
            ...DEFAULT_SETTINGS.appearance,
            ...(parsed.appearance || {}),
          },
        });
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  }, []);

  // ------------------------------------------------------------
  // APPLY APPEARANCE
  // ------------------------------------------------------------

  useEffect(() => {
    const root = document.documentElement;

    root.setAttribute(
      "data-theme",
      settings.appearance.theme
    );

    root.setAttribute(
      "data-density",
      settings.appearance.density
    );
  }, [
    settings.appearance.theme,
    settings.appearance.density,
  ]);

  // ------------------------------------------------------------
  // UPDATE NESTED SETTINGS
  // ------------------------------------------------------------

  const updateSetting = (section, field, value) => {
    setSettings((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));

    setSaveState("idle");
  };

  // ------------------------------------------------------------
  // SAVE SETTINGS
  // ------------------------------------------------------------

  const handleSave = () => {
    try {
      localStorage.setItem(
        "voltdesk_settings",
        JSON.stringify(settings)
      );

      setSaveState("success");
      setMessage("Settings saved successfully.");

      setTimeout(() => {
        setSaveState("idle");
        setMessage("");
      }, 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);

      setSaveState("error");
      setMessage("Unable to save settings.");
    }
  };

  // ------------------------------------------------------------
  // RESET SETTINGS
  // ------------------------------------------------------------

  const handleReset = () => {
    const confirmed = window.confirm(
      "Reset all VoltDesk settings to their default values?"
    );

    if (!confirmed) return;

    setSettings(DEFAULT_SETTINGS);

    localStorage.setItem(
      "voltdesk_settings",
      JSON.stringify(DEFAULT_SETTINGS)
    );

    setSaveState("success");
    setMessage("Settings have been reset.");
  };

  // ------------------------------------------------------------
  // EXPORT SETTINGS
  // ------------------------------------------------------------

  const handleExport = () => {
    try {
      const data = JSON.stringify(settings, null, 2);

      const blob = new Blob([data], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = "voltdesk-settings-backup.json";

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      setSaveState("success");
      setMessage("Settings backup exported.");
    } catch (error) {
      console.error("Export failed:", error);

      setSaveState("error");
      setMessage("Unable to export settings.");
    }
  };

  // ------------------------------------------------------------
  // IMPORT SETTINGS
  // ------------------------------------------------------------

  const handleImport = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);

        const mergedSettings = {
          ...DEFAULT_SETTINGS,
          ...imported,
          business: {
            ...DEFAULT_SETTINGS.business,
            ...(imported.business || {}),
          },
          documents: {
            ...DEFAULT_SETTINGS.documents,
            ...(imported.documents || {}),
          },
          appearance: {
            ...DEFAULT_SETTINGS.appearance,
            ...(imported.appearance || {}),
          },
        };

        setSettings(mergedSettings);

        localStorage.setItem(
          "voltdesk_settings",
          JSON.stringify(mergedSettings)
        );

        setSaveState("success");
        setMessage("Settings restored successfully.");
      } catch (error) {
        console.error("Import failed:", error);

        setSaveState("error");
        setMessage(
          "Invalid settings file. Please select a valid VoltDesk backup."
        );
      }
    };

    reader.readAsText(file);

    event.target.value = "";
  };

  // ------------------------------------------------------------
  // SETTINGS NAVIGATION
  // ------------------------------------------------------------

  const menuItems = [
    {
      id: "business",
      label: "Business Profile",
      description: "Business identity and contact details",
      icon: Building2,
    },
    {
      id: "documents",
      label: "Documents",
      description: "Invoices, quotations and receipts",
      icon: FileText,
    },
    {
      id: "backup",
      label: "Data & Backup",
      description: "Export and restore your settings",
      icon: Database,
    },
    {
      id: "appearance",
      label: "Appearance",
      description: "Theme and display preferences",
      icon: Palette,
    },
  ];

  return (
    <div className="settings-page">

      <PageHeader
        title="Settings"
        description="Configure VoltDesk for your business."
      />

      {/* -------------------------------------------------------
          NOTIFICATION
      ------------------------------------------------------- */}

      {message && (
        <div
          className={`settings-alert ${
            saveState === "error"
              ? "settings-alert-error"
              : "settings-alert-success"
          }`}
        >
          {saveState === "error" ? (
            <AlertCircle size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}

          <span>{message}</span>
        </div>
      )}

      <div className="settings-layout">

        {/* -----------------------------------------------------
            SETTINGS SIDEBAR
        ----------------------------------------------------- */}

        <aside className="settings-menu">

          <div className="settings-menu-header">
            <div className="settings-menu-logo">
              <BriefcaseBusiness size={20} />
            </div>

            <div>
              <strong>VoltDesk</strong>
              <span>Configuration</span>
            </div>
          </div>

          <div className="settings-menu-items">

            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  className={`settings-menu-item ${
                    activeSection === item.id
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setActiveSection(item.id)
                  }
                >
                  <span className="settings-menu-icon">
                    <Icon size={18} />
                  </span>

                  <span className="settings-menu-text">
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </span>
                </button>
              );
            })}

          </div>

          <div className="settings-sidebar-footer">
            <span className="settings-status-dot"></span>
            <span>VoltDesk is ready</span>
          </div>

        </aside>

        {/* -----------------------------------------------------
            CONTENT
        ----------------------------------------------------- */}

        <main className="settings-content">

          {/* ===================================================
              BUSINESS PROFILE
          =================================================== */}

          {activeSection === "business" && (
            <section className="settings-card">

              <div className="settings-card-header">
                <div className="settings-card-title">
                  <div className="settings-card-icon">
                    <Building2 size={21} />
                  </div>

                  <div>
                    <h2>Business Profile</h2>

                    <p>
                      This information will appear on
                      quotations, invoices and receipts.
                    </p>
                  </div>
                </div>
              </div>

              <div className="settings-form">

                <div className="settings-form-section">
                  <div className="form-section-heading">
                    <Building2 size={17} />
                    <span>Business Information</span>
                  </div>

                  <div className="form-grid">

                    <div className="form-group full-width">
                      <label>
                        Business Name
                        <span className="required">*</span>
                      </label>

                      <div className="input-with-icon">
                        <Building2 size={17} />

                        <input
                          value={settings.business.name}
                          onChange={(e) =>
                            updateSetting(
                              "business",
                              "name",
                              e.target.value
                            )
                          }
                          placeholder="Wamara Contractors"
                        />
                      </div>
                    </div>

                    <div className="form-group full-width">
                      <label>Business Tagline</label>

                      <input
                        value={settings.business.tagline}
                        onChange={(e) =>
                          updateSetting(
                            "business",
                            "tagline",
                            e.target.value
                          )
                        }
                        placeholder="Powering every project. Building trust."
                      />
                    </div>

                    <div className="form-group">
                      <label>Phone Number</label>

                      <div className="input-with-icon">
                        <Phone size={17} />

                        <input
                          value={settings.business.phone}
                          onChange={(e) =>
                            updateSetting(
                              "business",
                              "phone",
                              e.target.value
                            )
                          }
                          placeholder="0700 000 000"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Alternative Phone</label>

                      <div className="input-with-icon">
                        <Phone size={17} />

                        <input
                          value={
                            settings.business.alternatePhone
                          }
                          onChange={(e) =>
                            updateSetting(
                              "business",
                              "alternatePhone",
                              e.target.value
                            )
                          }
                          placeholder="0750 000 000"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Email Address</label>

                      <div className="input-with-icon">
                        <Mail size={17} />

                        <input
                          type="email"
                          value={settings.business.email}
                          onChange={(e) =>
                            updateSetting(
                              "business",
                              "email",
                              e.target.value
                            )
                          }
                          placeholder="info@wamaracontractors.com"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Website</label>

                      <input
                        value={settings.business.website}
                        onChange={(e) =>
                          updateSetting(
                            "business",
                            "website",
                            e.target.value
                          )
                        }
                        placeholder="www.example.com"
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Business Address</label>

                      <div className="input-with-icon">
                        <MapPin size={17} />

                        <input
                          value={settings.business.address}
                          onChange={(e) =>
                            updateSetting(
                              "business",
                              "address",
                              e.target.value
                            )
                          }
                          placeholder="Plot / Street / Building"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>City / Location</label>

                      <input
                        value={settings.business.city}
                        onChange={(e) =>
                          updateSetting(
                            "business",
                            "city",
                            e.target.value
                          )
                        }
                        placeholder="Kampala, Uganda"
                      />
                    </div>

                    <div className="form-group">
                      <label>TIN</label>

                      <input
                        value={settings.business.tin}
                        onChange={(e) =>
                          updateSetting(
                            "business",
                            "tin",
                            e.target.value
                          )
                        }
                        placeholder="Enter TIN"
                      />
                    </div>

                    <div className="form-group">
                      <label>Registration Number</label>

                      <input
                        value={
                          settings.business.registrationNumber
                        }
                        onChange={(e) =>
                          updateSetting(
                            "business",
                            "registrationNumber",
                            e.target.value
                          )
                        }
                        placeholder="Business registration number"
                      />
                    </div>

                  </div>
                </div>

                <div className="settings-form-actions">

                  <button
                    className="secondary-button"
                    onClick={handleReset}
                  >
                    <RotateCcw size={17} />
                    Reset
                  </button>

                  <button
                    className="primary-button"
                    onClick={handleSave}
                  >
                    <Save size={17} />
                    Save Changes
                  </button>

                </div>

              </div>
            </section>
          )}

          {/* ===================================================
              DOCUMENT SETTINGS
          =================================================== */}

          {activeSection === "documents" && (
            <section className="settings-card">

              <div className="settings-card-header">
                <div className="settings-card-title">

                  <div className="settings-card-icon">
                    <FileText size={21} />
                  </div>

                  <div>
                    <h2>Document Settings</h2>

                    <p>
                      Configure how VoltDesk creates and
                      numbers your business documents.
                    </p>
                  </div>

                </div>
              </div>

              <div className="settings-form">

                <div className="settings-form-section">

                  <div className="form-section-heading">
                    <CreditCard size={17} />
                    <span>Currency & Tax</span>
                  </div>

                  <div className="form-grid">

                    <div className="form-group">
                      <label>Default Currency</label>

                      <select
                        value={settings.documents.currency}
                        onChange={(e) =>
                          updateSetting(
                            "documents",
                            "currency",
                            e.target.value
                          )
                        }
                      >
                        <option value="UGX">
                          UGX — Uganda Shilling
                        </option>

                        <option value="USD">
                          USD — US Dollar
                        </option>

                        <option value="KES">
                          KES — Kenya Shilling
                        </option>

                        <option value="TZS">
                          TZS — Tanzania Shilling
                        </option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Tax Rate (%)</label>

                      <div className="input-with-icon">
                        <Percent size={17} />

                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={
                            settings.documents.taxRate
                          }
                          onChange={(e) =>
                            updateSetting(
                              "documents",
                              "taxRate",
                              Number(e.target.value)
                            )
                          }
                        />
                      </div>
                    </div>

                  </div>

                  <label className="toggle-row">

                    <span className="toggle-info">
                      <strong>Enable tax on documents</strong>

                      <small>
                        Automatically include tax calculations
                        on supported documents.
                      </small>
                    </span>

                    <input
                      type="checkbox"
                      checked={
                        settings.documents.taxEnabled
                      }
                      onChange={(e) =>
                        updateSetting(
                          "documents",
                          "taxEnabled",
                          e.target.checked
                        )
                      }
                    />

                    <span className="toggle-switch"></span>

                  </label>

                </div>

                <div className="settings-form-section">

                  <div className="form-section-heading">
                    <Hash size={17} />
                    <span>Document Numbering</span>
                  </div>

                  <div className="prefix-grid">

                    <div className="prefix-card">
                      <FileSignature size={18} />

                      <div>
                        <span>Quotation</span>

                        <input
                          value={
                            settings.documents
                              .quotationPrefix
                          }
                          onChange={(e) =>
                            updateSetting(
                              "documents",
                              "quotationPrefix",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="prefix-card">
                      <FileText size={18} />

                      <div>
                        <span>Invoice</span>

                        <input
                          value={
                            settings.documents
                              .invoicePrefix
                          }
                          onChange={(e) =>
                            updateSetting(
                              "documents",
                              "invoicePrefix",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="prefix-card">
                      <Receipt size={18} />

                      <div>
                        <span>Receipt</span>

                        <input
                          value={
                            settings.documents
                              .receiptPrefix
                          }
                          onChange={(e) =>
                            updateSetting(
                              "documents",
                              "receiptPrefix",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>

                  </div>

                </div>

                <div className="settings-form-section">

                  <div className="form-section-heading">
                    <WalletCards size={17} />
                    <span>Default Payment Information</span>
                  </div>

                  <div className="form-grid">

                    <div className="form-group">
                      <label>Payment Terms</label>

                      <select
                        value={
                          settings.documents.paymentTerms
                        }
                        onChange={(e) =>
                          updateSetting(
                            "documents",
                            "paymentTerms",
                            e.target.value
                          )
                        }
                      >
                        <option>
                          Payment due upon receipt
                        </option>

                        <option>
                          Payment due within 7 days
                        </option>

                        <option>
                          Payment due within 14 days
                        </option>

                        <option>
                          Payment due within 30 days
                        </option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Quotation Validity</label>

                      <select
                        value={
                          settings.documents
                            .quotationValidity
                        }
                        onChange={(e) =>
                          updateSetting(
                            "documents",
                            "quotationValidity",
                            e.target.value
                          )
                        }
                      >
                        <option>7 days</option>
                        <option>14 days</option>
                        <option>30 days</option>
                        <option>60 days</option>
                        <option>90 days</option>
                      </select>
                    </div>

                    <div className="form-group full-width">
                      <label>Payment Instructions</label>

                      <textarea
                        rows="3"
                        value={
                          settings.documents
                            .paymentInstructions
                        }
                        onChange={(e) =>
                          updateSetting(
                            "documents",
                            "paymentInstructions",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Document Footer Note</label>

                      <textarea
                        rows="3"
                        value={
                          settings.documents.footerNote
                        }
                        onChange={(e) =>
                          updateSetting(
                            "documents",
                            "footerNote",
                            e.target.value
                          )
                        }
                      />
                    </div>

                  </div>

                </div>

                <div className="settings-form-actions">

                  <button
                    className="secondary-button"
                    onClick={handleReset}
                  >
                    <RotateCcw size={17} />
                    Reset
                  </button>

                  <button
                    className="primary-button"
                    onClick={handleSave}
                  >
                    <Save size={17} />
                    Save Changes
                  </button>

                </div>

              </div>
            </section>
          )}

          {/* ===================================================
              DATA & BACKUP
          =================================================== */}

          {activeSection === "backup" && (
            <section className="settings-card">

              <div className="settings-card-header">
                <div className="settings-card-title">

                  <div className="settings-card-icon">
                    <Database size={21} />
                  </div>

                  <div>
                    <h2>Data & Backup</h2>

                    <p>
                      Protect your VoltDesk configuration by
                      exporting a backup of your settings.
                    </p>
                  </div>

                </div>
              </div>

              <div className="backup-grid">

                <div className="backup-card">

                  <div className="backup-card-icon export">
                    <Download size={22} />
                  </div>

                  <div className="backup-card-content">

                    <h3>Export Settings</h3>

                    <p>
                      Save your business configuration,
                      document preferences and appearance
                      settings as a backup file.
                    </p>

                    <button
                      className="secondary-button"
                      onClick={handleExport}
                    >
                      <Download size={17} />
                      Export Backup
                    </button>

                  </div>

                </div>

                <div className="backup-card">

                  <div className="backup-card-icon import">
                    <Upload size={22} />
                  </div>

                  <div className="backup-card-content">

                    <h3>Restore Settings</h3>

                    <p>
                      Restore your VoltDesk configuration
                      from a previously exported backup.
                    </p>

                    <button
                      className="secondary-button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                    >
                      <Upload size={17} />
                      Restore Backup
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      hidden
                      onChange={handleImport}
                    />

                  </div>

                </div>

              </div>

              <div className="danger-zone">

                <div>
                  <h3>Reset Configuration</h3>

                  <p>
                    Restore all settings to VoltDesk's
                    original defaults.
                  </p>
                </div>

                <button
                  className="danger-button"
                  onClick={handleReset}
                >
                  <RotateCcw size={17} />
                  Reset Settings
                </button>

              </div>

            </section>
          )}

          {/* ===================================================
              APPEARANCE
          =================================================== */}

          {activeSection === "appearance" && (
            <section className="settings-card">

              <div className="settings-card-header">
                <div className="settings-card-title">

                  <div className="settings-card-icon">
                    <Palette size={21} />
                  </div>

                  <div>
                    <h2>Appearance</h2>

                    <p>
                      Personalize the way VoltDesk looks
                      and feels.
                    </p>
                  </div>

                </div>
              </div>

              <div className="appearance-section">

                <div className="appearance-setting">

                  <div className="appearance-setting-header">

                    <div>
                      <h3>Theme</h3>

                      <p>
                        Choose how VoltDesk should appear.
                      </p>
                    </div>

                  </div>

                  <div className="theme-options">

                    <button
                      className={`theme-option ${
                        settings.appearance.theme ===
                        "light"
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        updateSetting(
                          "appearance",
                          "theme",
                          "light"
                        )
                      }
                    >
                      <Sun size={22} />

                      <strong>Light</strong>

                      <span>
                        Bright and clean
                      </span>
                    </button>

                    <button
                      className={`theme-option ${
                        settings.appearance.theme ===
                        "dark"
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        updateSetting(
                          "appearance",
                          "theme",
                          "dark"
                        )
                      }
                    >
                      <Moon size={22} />

                      <strong>Dark</strong>

                      <span>
                        Easy on the eyes
                      </span>
                    </button>

                    <button
                      className={`theme-option ${
                        settings.appearance.theme ===
                        "system"
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        updateSetting(
                          "appearance",
                          "theme",
                          "system"
                        )
                      }
                    >
                      <Monitor size={22} />

                      <strong>System</strong>

                      <span>
                        Follow Windows
                      </span>
                    </button>

                  </div>

                </div>

                <div className="appearance-setting">

                  <div>
                    <h3>Display Density</h3>

                    <p>
                      Control the amount of space used
                      throughout VoltDesk.
                    </p>
                  </div>

                  <div className="density-options">

                    <button
                      className={
                        settings.appearance.density ===
                        "comfortable"
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        updateSetting(
                          "appearance",
                          "density",
                          "comfortable"
                        )
                      }
                    >
                      Comfortable
                    </button>

                    <button
                      className={
                        settings.appearance.density ===
                        "compact"
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        updateSetting(
                          "appearance",
                          "density",
                          "compact"
                        )
                      }
                    >
                      Compact
                    </button>

                  </div>

                </div>

                <div className="appearance-setting">

                  <div className="appearance-setting-header">

                    <div>
                      <h3>Document Branding</h3>

                      <p>
                        Keep Wamara Contractors branding
                        visible on business documents.
                      </p>
                    </div>

                    <label className="toggle-row compact">

                      <input
                        type="checkbox"
                        checked={
                          settings.appearance
                            .showBranding
                        }
                        onChange={(e) =>
                          updateSetting(
                            "appearance",
                            "showBranding",
                            e.target.checked
                          )
                        }
                      />

                      <span className="toggle-switch"></span>

                    </label>

                  </div>

                </div>

              </div>

              <div className="settings-form-actions">

                <button
                  className="secondary-button"
                  onClick={handleReset}
                >
                  <RotateCcw size={17} />
                  Reset
                </button>

                <button
                  className="primary-button"
                  onClick={handleSave}
                >
                  <Save size={17} />
                  Save Changes
                </button>

              </div>

            </section>
          )}

        </main>
      </div>

    </div>
  );
}

export default SettingsPage;
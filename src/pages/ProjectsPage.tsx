import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  FolderKanban,
  X,
  Pencil,
  Trash2,
  MapPin,
  CalendarDays,
  User,
  FileText,
  LayoutGrid,
  List,
  Rows3,
  Receipt,
  CreditCard,
  ExternalLink,
} from "lucide-react";
import "../styles/ProjectsPage.css";

type Project = {
  id: number;
  name: string;
  client: string;
  location: string;
  start_date: string;
  estimated_value: number;
  status: string;
  progress: number;
  quotation_id?: number | null;
};

type Client = {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  location?: string;
};

type Quotation = {
  id: number;
  quotation_number?: string;
  client_name: string;
  client_location?: string;
  subject: string;
  labour_cost: number;
  total?: number;
  status: string;
  created_at?: string;
};

type Invoice = {
  id: number;
  invoice_number?: string;
  quotation_id?: number | null;
  client_name: string;
  total?: number;
  amount_paid?: number;
  status: string;
  created_at?: string;
};

type Receipt = {
  id: number;
  receipt_number?: string;
  invoice_id?: number | null;
  invoice_number?: string;
  client_name: string;
  amount?: number;
  payment_method?: string;
  created_at?: string;
};

type ViewMode = "detailed" | "grid" | "list";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("detailed");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [status, setStatus] = useState("Not Started");
  const [progress, setProgress] = useState(0);
  const [selectedQuotationId, setSelectedQuotationId] = useState<number | "">("");

  async function loadData() {
    try {
      setIsLoading(true);

      if (!window.electronAPI?.projects) {
        console.error("electronAPI.projects not available");
        return;
      }

      const [projectData, clientData, quotationData, invoiceData, receiptData] =
        await Promise.all([
          window.electronAPI.projects.getAll(),
          window.electronAPI.clients.getAll(),
          window.electronAPI.quotations.getAll(),
          window.electronAPI.invoices?.getAll?.() || Promise.resolve([]),
          window.electronAPI.receipts?.getAll?.() || Promise.resolve([]),
        ]);

      setProjects(projectData || []);
      setClients(clientData || []);
      setQuotations(quotationData || []);
      setInvoices(invoiceData || []);
      setReceipts(receiptData || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function getLabourFromQuotation(quotationId?: number | null): number | null {
    if (!quotationId) return null;
    const quotation = quotations.find((q) => q.id === quotationId);
    if (!quotation) return null;
    return Number(quotation.labour_cost) || 0;
  }

  function getProjectValue(project: Project): number {
    const labour = getLabourFromQuotation(project.quotation_id);
    if (labour !== null) return labour;
    return Number(project.estimated_value) || 0;
  }

  const clientQuotations = useMemo(() => {
    if (!client) return [];
    return quotations.filter(
      (q) =>
        q.client_name?.toLowerCase() === client.toLowerCase() && q.subject
    );
  }, [client, quotations]);

  const filteredProjects = projects.filter((project) =>
    `${project.name} ${project.client} ${project.location}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // =========================================
  // UPDATED: Get ALL documents linked to a project
  // =========================================
  function getProjectDocuments(project: Project) {
    // Get ALL quotations for this client
    const clientQuotations = quotations.filter(
      (q) => q.client_name?.toLowerCase() === project.client?.toLowerCase()
    );

    // Get ALL invoices for this client
    const clientInvoices = invoices.filter(
      (inv) => inv.client_name?.toLowerCase() === project.client?.toLowerCase()
    );

    // Get ALL receipts for this client
    const clientReceipts = receipts.filter(
      (r) => r.client_name?.toLowerCase() === project.client?.toLowerCase()
    );

    // Get the specific linked quotation if it exists
    const linkedQuotation = project.quotation_id
      ? quotations.find((q) => q.id === project.quotation_id) || null
      : null;

    return {
      linkedQuotation,
      clientQuotations,      // ALL quotations for this client
      clientInvoices,        // ALL invoices for this client
      clientReceipts,        // ALL receipts for this client
    };
  }

  function resetForm() {
    setName("");
    setClient("");
    setLocation("");
    setStartDate("");
    setEstimatedValue("");
    setStatus("Not Started");
    setProgress(0);
    setSelectedQuotationId("");
    setEditingProject(null);
  }

  function openAddProjectForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditProjectForm(project: Project) {
    setEditingProject(project);
    setName(project.name);
    setClient(project.client || "");
    setLocation(project.location || "");
    setStartDate(project.start_date || "");

    const labour = getLabourFromQuotation(project.quotation_id);
    setEstimatedValue(
      String(labour !== null ? labour : project.estimated_value || "")
    );

    setStatus(project.status || "Not Started");
    setProgress(project.progress || 0);
    setSelectedQuotationId(project.quotation_id || "");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    resetForm();
  }

  function handleClientChange(clientName: string) {
    setClient(clientName);
    setSelectedQuotationId("");
    setName("");
    setEstimatedValue("");

    const selectedClient = clients.find((c) => c.name === clientName);
    if (selectedClient?.location) {
      setLocation(selectedClient.location);
    }
  }

  function handleQuotationChange(quotationId: string) {
    if (!quotationId) {
      setSelectedQuotationId("");
      setEstimatedValue("");
      return;
    }

    const id = Number(quotationId);
    setSelectedQuotationId(id);

    const quotation = quotations.find((q) => q.id === id);
    if (quotation) {
      setName(quotation.subject || "");
      setEstimatedValue(String(Number(quotation.labour_cost) || 0));
      if (quotation.client_location) {
        setLocation(quotation.client_location);
      }
    }
  }

  function handleProgressChange(value: number) {
    const newProgress = Math.max(0, Math.min(100, value));
    setProgress(newProgress);

    if (newProgress === 0) {
      setStatus("Not Started");
    } else if (newProgress === 100) {
      setStatus("Completed");
    } else if (status === "Not Started" || status === "Completed") {
      setStatus("In Progress");
    }
  }

  async function handleSaveProject(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || isSaving) return;

    setIsSaving(true);

    try {
      let valueToSave = Number(estimatedValue) || 0;

      if (selectedQuotationId) {
        const labour = getLabourFromQuotation(Number(selectedQuotationId));
        if (labour !== null) valueToSave = labour;
      }

      const payload = {
        name: name.trim(),
        client: client.trim(),
        location: location.trim(),
        start_date: startDate,
        estimated_value: valueToSave,
        status,
        progress,
        quotation_id: selectedQuotationId || null,
      };

      if (editingProject) {
        await window.electronAPI.projects.update({
          ...payload,
          id: editingProject.id,
        });
      } else {
        await window.electronAPI.projects.create(payload);
      }

      await loadData();
      closeForm();
    } catch (err: any) {
      console.error(err);
      alert("Failed to save project: " + (err?.message || "Unknown error"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteProject(id: number) {
    if (!window.confirm("Are you sure you want to delete this project?")) return;

    try {
      await window.electronAPI.projects.delete(id);
      await loadData();
      if (selectedProject?.id === id) setSelectedProject(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete project");
    }
  }

  async function openDocument(
    type: "quotation" | "invoice" | "receipt",
    id: number
  ) {
    try {
      let doc: any = null;

      if (type === "quotation") {
        doc = await window.electronAPI.quotations.getById(id);
      } else if (type === "invoice") {
        doc = await window.electronAPI.invoices?.getById?.(id);
      } else if (type === "receipt") {
        doc = await window.electronAPI.receipts?.getById?.(id);
      }

      if (!doc) {
        alert("Document could not be found. It may have been deleted.");
        return;
      }

      const lines: string[] = [];

      if (type === "quotation") {
        lines.push(
          `Quotation: ${doc.quotation_number || `QT-${doc.id}`}`,
          `Client: ${doc.client_name}`,
          `Subject: ${doc.subject}`,
          `Status: ${doc.status}`,
          `Labour: UGX ${Number(doc.labour_cost || 0).toLocaleString()}`,
          `Total: UGX ${Number(doc.total || 0).toLocaleString()}`
        );
      } else if (type === "invoice") {
        lines.push(
          `Invoice: ${doc.invoice_number || `INV-${doc.id}`}`,
          `Client: ${doc.client_name}`,
          `Status: ${doc.status}`,
          `Total: UGX ${Number(doc.total || 0).toLocaleString()}`,
          `Paid: UGX ${Number(doc.amount_paid || 0).toLocaleString()}`
        );
      } else {
        lines.push(
          `Receipt: ${doc.receipt_number || `REC-${doc.id}`}`,
          `Client: ${doc.client_name}`,
          `Amount: UGX ${Number(doc.amount || 0).toLocaleString()}`,
          `Method: ${doc.payment_method || "—"}`,
          `Invoice: ${doc.invoice_number || "—"}`
        );
      }

      alert(lines.join("\n"));
    } catch (err) {
      console.error(err);
      alert("Failed to open document.");
    }
  }

  function formatCurrency(value: number | string) {
    if (!value && value !== 0) return "—";
    return `UGX ${Number(value).toLocaleString()}`;
  }

  function statusClass(status: string) {
    return status.toLowerCase().replace(/\s+/g, "-");
  }

  /* ========== RENDER HELPERS ========== */

  function renderDetailedCard(project: Project) {
    return (
      <div
        className="project-card"
        key={project.id}
        onClick={() => setSelectedProject(project)}
      >
        <div className="project-card-top">
          <div className="project-main-info">
            <div className="project-icon">
              <FolderKanban size={22} />
            </div>
            <div>
              <h3>{project.name}</h3>
              <div className="project-meta">
                <span>
                  <User size={14} />
                  {project.client || "No client"}
                </span>
                <span>
                  <MapPin size={14} />
                  {project.location || "No location"}
                </span>
                {project.start_date && (
                  <span>
                    <CalendarDays size={14} />
                    {project.start_date}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="project-actions" onClick={(e) => e.stopPropagation()}>
            <button
              className="action-button"
              onClick={() => openDocument("quotation", project.quotation_id!)}
              title={
                project.quotation_id
                  ? "Open linked quotation"
                  : "No linked quotation"
              }
              style={{ opacity: project.quotation_id ? 1 : 0.4 }}
              disabled={!project.quotation_id}
            >
              <FileText size={17} />
            </button>
            <button
              className="action-button edit-button"
              onClick={() => openEditProjectForm(project)}
              title="Edit project"
            >
              <Pencil size={17} />
            </button>
            <button
              className="action-button delete-button"
              onClick={() => handleDeleteProject(project.id)}
              title="Delete project"
            >
              <Trash2 size={17} />
            </button>
          </div>
        </div>

        <div className="project-details">
          <div className="project-value">
            <span>
              {project.quotation_id ? "Labour Value" : "Estimated Value"}
            </span>
            <strong>{formatCurrency(getProjectValue(project))}</strong>
          </div>
          <span className={`project-status ${statusClass(project.status)}`}>
            {project.status}
          </span>
        </div>

        <div className="project-progress-section">
          <div className="progress-header">
            <span>Project Progress</span>
            <strong>{project.progress}%</strong>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  function renderGridCard(project: Project) {
    return (
      <div
        className="project-grid-card"
        key={project.id}
        onClick={() => setSelectedProject(project)}
      >
        <div className="project-grid-top">
          <div className="project-icon small">
            <FolderKanban size={18} />
          </div>
          <span className={`project-status ${statusClass(project.status)}`}>
            {project.status}
          </span>
        </div>
        <h3>{project.name}</h3>
        <p className="project-grid-client">{project.client || "No client"}</p>
        <div className="project-grid-footer">
          <strong>{formatCurrency(getProjectValue(project))}</strong>
          <span>{project.progress}%</span>
        </div>
        <div className="progress-bar thin">
          <div
            className="progress-bar-fill"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>
    );
  }

  function renderListRow(project: Project) {
    return (
      <tr
        key={project.id}
        className="project-list-row"
        onClick={() => setSelectedProject(project)}
      >
        <td>
          <div className="list-name-cell">
            <div className="project-icon tiny">
              <FolderKanban size={16} />
            </div>
            <div>
              <strong>{project.name}</strong>
              <small>{project.location || "—"}</small>
            </div>
          </div>
        </td>
        <td>{project.client || "—"}</td>
        <td>{formatCurrency(getProjectValue(project))}</td>
        <td>
          <span className={`project-status ${statusClass(project.status)}`}>
            {project.status}
          </span>
        </td>
        <td>
          <div className="list-progress">
            <div className="progress-bar thin">
              <div
                className="progress-bar-fill"
                style={{ width: `${project.progress}%` }}
              />
            </div>
            <span>{project.progress}%</span>
          </div>
        </td>
        <td onClick={(e) => e.stopPropagation()}>
          <div className="client-actions">
            <button
              className="action-button edit-button"
              onClick={() => openEditProjectForm(project)}
            >
              <Pencil size={16} />
            </button>
            <button
              className="action-button delete-button"
              onClick={() => handleDeleteProject(project.id)}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  /* ========== DETAIL MODAL ========== */

  function renderDetailModal() {
    if (!selectedProject) return null;

    const { linkedQuotation, clientQuotations, clientInvoices, clientReceipts } =
      getProjectDocuments(selectedProject);

    // Get all documents count
    const totalQuotations = clientQuotations.length;
    const totalInvoices = clientInvoices.length;
    const totalReceipts = clientReceipts.length;

    return (
      <div className="modal-overlay" onClick={() => setSelectedProject(null)}>
        <div
          className="project-detail-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <div>
              <p className="page-eyebrow">PROJECT DETAILS</p>
              <h2>{selectedProject.name}</h2>
              <p className="project-client-name">
                <User size={14} />
                {selectedProject.client || "No client"}
              </p>
            </div>
            <button
              className="close-button"
              onClick={() => setSelectedProject(null)}
              type="button"
            >
              <X size={20} />
            </button>
          </div>

          <div className="detail-grid">
            <div className="detail-item">
              <span>Client</span>
              <strong>{selectedProject.client || "—"}</strong>
            </div>
            <div className="detail-item">
              <span>Location</span>
              <strong>{selectedProject.location || "—"}</strong>
            </div>
            <div className="detail-item">
              <span>Start Date</span>
              <strong>{selectedProject.start_date || "—"}</strong>
            </div>
            <div className="detail-item">
              <span>Status</span>
              <span
                className={`project-status ${statusClass(
                  selectedProject.status
                )}`}
              >
                {selectedProject.status}
              </span>
            </div>
            <div className="detail-item">
              <span>
                {selectedProject.quotation_id
                  ? "Labour Value"
                  : "Estimated Value"}
              </span>
              <strong>{formatCurrency(getProjectValue(selectedProject))}</strong>
            </div>
            <div className="detail-item">
              <span>Progress</span>
              <strong>{selectedProject.progress}%</strong>
            </div>
          </div>

          <div className="detail-progress">
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${selectedProject.progress}%` }}
              />
            </div>
          </div>

          {/* =========================================
              UPDATED: ALL DOCUMENTS SECTION
          ========================================= */}
          <div className="documents-section">
            <div className="documents-section-header">
              <h3>All Documents</h3>
              <span className="doc-count-badge">
                {totalQuotations + totalInvoices + totalReceipts} total
              </span>
            </div>

            {/* =========================================
                QUOTATIONS - ALL OF THEM
            ========================================= */}
            <div className="doc-group">
              <div className="doc-group-header">
                <FileText size={15} />
                <span className="doc-group-title">Quotations</span>
                <span className="doc-count">{totalQuotations}</span>
              </div>
              {clientQuotations.length > 0 ? (
                <div className="doc-list">
                  {clientQuotations.map((q) => (
                    <button
                      key={q.id}
                      className={`doc-row ${q.id === selectedProject.quotation_id ? "linked" : ""}`}
                      onClick={() => openDocument("quotation", q.id)}
                    >
                      <div className="doc-row-left">
                        <FileText size={14} />
                        <div>
                          <strong>
                            {q.quotation_number || `QT-${q.id}`}
                          </strong>
                          <small>{q.subject}</small>
                        </div>
                        {q.id === selectedProject.quotation_id && (
                          <span className="linked-badge">Linked</span>
                        )}
                      </div>
                      <div className="doc-row-right">
                        <span className="doc-amount">
                          {formatCurrency(q.total || q.labour_cost || 0)}
                        </span>
                        <span className="doc-status">{q.status}</span>
                        <ExternalLink size={15} />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="doc-empty">No quotations for this client</p>
              )}
            </div>

            {/* =========================================
                INVOICES - ALL OF THEM
            ========================================= */}
            <div className="doc-group">
              <div className="doc-group-header">
                <Receipt size={15} />
                <span className="doc-group-title">Invoices</span>
                <span className="doc-count">{totalInvoices}</span>
              </div>
              {clientInvoices.length > 0 ? (
                <div className="doc-list">
                  {clientInvoices.map((inv) => (
                    <button
                      key={inv.id}
                      className="doc-row"
                      onClick={() => openDocument("invoice", inv.id)}
                    >
                      <div className="doc-row-left">
                        <Receipt size={14} />
                        <div>
                          <strong>
                            {inv.invoice_number || `INV-${inv.id}`}
                          </strong>
                          <small>
                            {inv.status} {inv.created_at ? `• ${new Date(inv.created_at).toLocaleDateString()}` : ""}
                          </small>
                        </div>
                      </div>
                      <div className="doc-row-right">
                        <span className="doc-amount">
                          {formatCurrency(inv.total || 0)}
                        </span>
                        {inv.amount_paid ? (
                          <span className="doc-paid">
                            Paid: {formatCurrency(inv.amount_paid)}
                          </span>
                        ) : null}
                        <ExternalLink size={15} />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="doc-empty">No invoices for this client</p>
              )}
            </div>

            {/* =========================================
                RECEIPTS - ALL OF THEM
            ========================================= */}
            <div className="doc-group">
              <div className="doc-group-header">
                <CreditCard size={15} />
                <span className="doc-group-title">Receipts</span>
                <span className="doc-count">{totalReceipts}</span>
              </div>
              {clientReceipts.length > 0 ? (
                <div className="doc-list">
                  {clientReceipts.map((rec) => (
                    <button
                      key={rec.id}
                      className="doc-row"
                      onClick={() => openDocument("receipt", rec.id)}
                    >
                      <div className="doc-row-left">
                        <CreditCard size={14} />
                        <div>
                          <strong>
                            {rec.receipt_number || `REC-${rec.id}`}
                          </strong>
                          <small>
                            {rec.payment_method || "Cash"} 
                            {rec.created_at ? ` • ${new Date(rec.created_at).toLocaleDateString()}` : ""}
                          </small>
                        </div>
                      </div>
                      <div className="doc-row-right">
                        <span className="doc-amount">
                          {formatCurrency(rec.amount || 0)}
                        </span>
                        {rec.invoice_number && (
                          <span className="doc-invoice-ref">
                            Invoice: {rec.invoice_number}
                          </span>
                        )}
                        <ExternalLink size={15} />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="doc-empty">No receipts for this client</p>
              )}
            </div>
          </div>

          <div className="modal-actions detail-actions">
            <button
              className="secondary-button"
              onClick={() => {
                setSelectedProject(null);
                openEditProjectForm(selectedProject);
              }}
            >
              <Pencil size={16} /> Edit Project
            </button>
            <button
              className="primary-button"
              onClick={() => setSelectedProject(null)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ========== MAIN RENDER ========== */

  return (
    <div className="projects-page">
      {/* HEADER */}
      <div className="projects-header">
        <div className="projects-header-content">
          <div>
            <p className="page-eyebrow">VOLTDESK</p>
            <h1>Projects</h1>
            <p className="page-description">
              Track your electrical projects from start to completion.
            </p>
          </div>

          <button
            className="primary-button add-project-button"
            onClick={openAddProjectForm}
          >
            <Plus size={18} />
            Add Project
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="projects-stats">
        <div className="project-stat-card">
          <div className="stat-icon">
            <FolderKanban size={22} />
          </div>
          <div>
            <span>Total Projects</span>
            <strong>{projects.length}</strong>
          </div>
        </div>
        <div className="project-stat-card">
          <div className="stat-icon">
            <FolderKanban size={22} />
          </div>
          <div>
            <span>In Progress</span>
            <strong>
              {projects.filter((p) => p.status === "In Progress").length}
            </strong>
          </div>
        </div>
        <div className="project-stat-card">
          <div className="stat-icon">
            <FolderKanban size={22} />
          </div>
          <div>
            <span>Completed</span>
            <strong>
              {projects.filter((p) => p.status === "Completed").length}
            </strong>
          </div>
        </div>
      </div>

      {/* LIST / GRID / DETAILED */}
      <div className="projects-card">
        <div className="projects-toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="toolbar-right">
            <span className="projects-count">
              {filteredProjects.length} project
              {filteredProjects.length !== 1 ? "s" : ""}
            </span>

            <div className="view-toggle">
              <button
                className={viewMode === "detailed" ? "active" : ""}
                onClick={() => setViewMode("detailed")}
                title="Detailed cards"
              >
                <Rows3 size={16} />
              </button>
              <button
                className={viewMode === "grid" ? "active" : ""}
                onClick={() => setViewMode("grid")}
                title="Grid view"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                className={viewMode === "list" ? "active" : ""}
                onClick={() => setViewMode("list")}
                title="List view"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="projects-list">
          {isLoading ? (
            <div className="no-projects">
              <p>Loading projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="no-projects">
              <FolderKanban size={42} />
              <h3>No projects found</h3>
              <p>
                Add your first electrical project or create a quotation and mark
                it as Sent to auto-create a project.
              </p>
              <button className="primary-button" onClick={openAddProjectForm}>
                <Plus size={18} />
                Add Project
              </button>
            </div>
          ) : viewMode === "detailed" ? (
            filteredProjects.map(renderDetailedCard)
          ) : viewMode === "grid" ? (
            <div className="projects-grid">
              {filteredProjects.map(renderGridCard)}
            </div>
          ) : (
            <div className="projects-table-wrapper">
              <table className="projects-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Client</th>
                    <th>Value</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>{filteredProjects.map(renderListRow)}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* DETAIL MODAL */}
      {renderDetailModal()}

      {/* ADD / EDIT MODAL */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="project-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="page-eyebrow">
                  {editingProject ? "EDIT PROJECT" : "NEW PROJECT"}
                </p>
                <h2>{editingProject ? "Edit Project" : "Add Project"}</h2>
              </div>
              <button className="close-button" onClick={closeForm} type="button">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProject}>
              <div className="form-group">
                <label>Client *</label>
                <select
                  value={client}
                  onChange={(e) => handleClientChange(e.target.value)}
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {client && (
                <div className="form-group">
                  <label>Link to Quotation (optional)</label>
                  <select
                    value={selectedQuotationId}
                    onChange={(e) => handleQuotationChange(e.target.value)}
                  >
                    <option value="">No quotation linked</option>
                    {clientQuotations.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.subject} — Labour: UGX{" "}
                        {Number(q.labour_cost || 0).toLocaleString()}
                      </option>
                    ))}
                  </select>
                  <small className="form-hint">
                    Selecting a quotation sets the project value to that
                    quotation&apos;s labour amount.
                  </small>
                </div>
              )}

              <div className="form-group">
                <label>Project Name *</label>
                <input
                  type="text"
                  placeholder="Name this project however you want"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    placeholder="Project location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    {selectedQuotationId
                      ? "Labour Value (UGX)"
                      : "Estimated Value (UGX)"}
                  </label>
                  <input
                    type="number"
                    value={estimatedValue}
                    onChange={(e) => setEstimatedValue(e.target.value)}
                    readOnly={Boolean(selectedQuotationId)}
                    className={selectedQuotationId ? "readonly-input" : ""}
                  />
                </div>
                <div className="form-group">
                  <label>Project Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option>Not Started</option>
                    <option>In Progress</option>
                    <option>On Hold</option>
                    <option>Completed</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Project Progress: {progress}%</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) =>
                    handleProgressChange(Number(e.target.value))
                  }
                />
              </div>

              <div className="progress-control">
                <div className="progress-control-header">
                  <span>How far has the project gone?</span>
                  <strong>{progress}%</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) =>
                    handleProgressChange(Number(e.target.value))
                  }
                  className="progress-slider"
                />
                <div className="progress-labels">
                  <span>Not Started</span>
                  <span>In Progress</span>
                  <span>Completed</span>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeForm}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={isSaving}
                >
                  {isSaving
                    ? "Saving..."
                    : editingProject
                    ? "Update Project"
                    : "Save Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
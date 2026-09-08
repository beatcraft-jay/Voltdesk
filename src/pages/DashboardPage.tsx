import { useState, useEffect } from "react";
import {
  Users,
  FolderKanban,
  FileText,
  WalletCards,
  ArrowUpRight,
  Plus,
  ChevronDown,
  FileSignature,
  Receipt,
  CreditCard,
  Briefcase,
  Package,
  DollarSign,
  Zap,
  TrendingUp,
  Activity,
} from "lucide-react";

import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";

// Import the background image so the bundler resolves it correctly
import bgImage from "../assets/branding/bg.png";

import "../styles/DashboardPage.css";

function DashboardPage({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [recentDocuments, setRecentDocuments] = useState([]);

  /* =========================================
     DASHBOARD STATISTICS
  ========================================= */

  const totalClients = clients.length;

  const activeProjects = projects.filter(
    (p) => p.status !== "Completed" && p.status !== "Cancelled"
  ).length;

  const pendingQuotations = quotations.filter(
    (q) => q.status === "Draft" || q.status === "Pending"
  ).length;

  const outstandingInvoices = invoices.filter(
    (inv) =>
      inv.status === "Unpaid" ||
      inv.status === "Partial" ||
      inv.status === "Sent"
  );

  const totalOutstanding = outstandingInvoices.reduce(
    (sum, inv) =>
      sum + (Number(inv.total) || 0) - (Number(inv.amount_paid) || 0),
    0
  );

  /* =========================================
     LOAD DASHBOARD DATA
  ========================================= */

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        const [
          clientsData,
          projectsData,
          quotationsData,
          invoicesData,
          receiptsData,
        ] = await Promise.all([
          window.electronAPI.clients.getAll(),
          window.electronAPI.projects.getAll(),
          window.electronAPI.quotations.getAll(),
          window.electronAPI.invoices.getAll(),
          window.electronAPI.receipts.getAll(),
        ]);

        setClients(clientsData || []);
        setProjects(projectsData || []);
        setQuotations(quotationsData || []);
        setInvoices(invoicesData || []);
        setReceipts(receiptsData || []);

        /* =========================================
           BUILD RECENT DOCUMENTS
        ========================================= */

        const docs = [];

        (quotationsData || []).slice(0, 5).forEach((q) => {
          docs.push({
            id: `qt-${q.id}`,
            type: "Quotation",
            number:
              q.quotation_number ||
              `QT-${String(q.id).padStart(4, "0")}`,
            client: q.client_name || "Unknown Client",
            amount: Number(q.total) || 0,
            status: q.status || "Draft",
            date: q.created_at,
            timestamp: new Date(q.created_at).getTime(),
          });
        });

        (invoicesData || []).slice(0, 5).forEach((inv) => {
          docs.push({
            id: `inv-${inv.id}`,
            type: "Invoice",
            number:
              inv.invoice_number ||
              `INV-${String(inv.id).padStart(4, "0")}`,
            client: inv.client_name || "Unknown Client",
            amount: Number(inv.total) || 0,
            status: inv.status || "Draft",
            date: inv.created_at,
            timestamp: new Date(inv.created_at).getTime(),
          });
        });

        (receiptsData || []).slice(0, 5).forEach((r) => {
          docs.push({
            id: `rec-${r.id}`,
            type: "Receipt",
            number:
              r.receipt_number ||
              `REC-${String(r.id).padStart(4, "0")}`,
            client: r.client_name || "Unknown Client",
            amount: Number(r.amount) || 0,
            status: "Paid",
            date: r.created_at,
            timestamp: new Date(r.created_at).getTime(),
          });
        });

        docs.sort((a, b) => b.timestamp - a.timestamp);
        setRecentDocuments(docs.slice(0, 5));
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  /* =========================================
     NAVIGATION
  ========================================= */

  const handleNavigate = (page) => {
    if (onNavigate) {
      onNavigate(page);
    }
    setShowDropdown(false);
  };

  const handleCreateDocument = (type) => {
    setShowDropdown(false);

    const pages = {
      quotation: "Quotations",
      invoice: "Invoices",
      receipt: "Receipts",
      project: "Projects",
      client: "Clients",
      material: "Materials",
      expense: "Expenses",
    };

    if (pages[type]) {
      handleNavigate(pages[type]);
    }
  };

  /* =========================================
     FORMAT CURRENCY
  ========================================= */

  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `UGX ${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `UGX ${(amount / 1000).toFixed(1)}K`;
    }
    return `UGX ${amount.toLocaleString()}`;
  };

  /* =========================================
     CREATE DOCUMENT OPTIONS
  ========================================= */

  const documentOptions = [
    {
      id: "quotation",
      label: "New Quotation",
      description: "Prepare a client quotation",
      icon: FileSignature,
      color: "#f5b700",
    },
    {
      id: "invoice",
      label: "New Invoice",
      description: "Bill a client",
      icon: Receipt,
      color: "#315b85",
    },
    {
      id: "receipt",
      label: "New Receipt",
      description: "Record a payment",
      icon: CreditCard,
      color: "#10b981",
    },
    {
      id: "project",
      label: "New Project",
      description: "Start an electrical project",
      icon: Briefcase,
      color: "#8b5cf6",
    },
    {
      id: "client",
      label: "New Client",
      description: "Add a business client",
      icon: Users,
      color: "#3b82f6",
    },
    {
      id: "material",
      label: "New Material",
      description: "Add a material",
      icon: Package,
      color: "#f59e0b",
    },
    {
      id: "expense",
      label: "New Expense",
      description: "Record an expense",
      icon: DollarSign,
      color: "#ef4444",
    },
  ];

  /* =========================================
     CLOSE DROPDOWN
  ========================================= */

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showDropdown && !e.target.closest(".create-dropdown")) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showDropdown]);

  /* =========================================
     LOADING
  ========================================= */

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader-container">
          <div className="loader-brand">
            <Zap size={26} />
          </div>
          <div className="loader-spinner"></div>
          <p>Loading VoltDesk...</p>
        </div>
      </div>
    );
  }

  /* =========================================
     DASHBOARD
  ========================================= */

  return (
    <div className="dashboard-page">
      {/* Full-viewport background */}
      <div
        className="dashboard-bg"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="dashboard-bg-overlay" />

      <div className="dashboard-content">
        {/* =====================================
            HEADER
        ===================================== */}
        <PageHeader
          title="Dashboard"
          description="A quick overview of your electrical business."
          action={
            <div className="create-dropdown">
              <button
                className="primary-button create-button"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <Plus size={18} />
                <span>Create Document</span>
                <ChevronDown
                  size={16}
                  className={`dropdown-arrow ${showDropdown ? "rotate" : ""}`}
                />
              </button>

              {showDropdown && (
                <div className="create-dropdown-menu">
                  <div className="dropdown-header">
                    <span>CREATE NEW</span>
                    <small>Choose what you want to create</small>
                  </div>

                  {documentOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.id}
                        className="create-dropdown-item"
                        onClick={() => handleCreateDocument(option.id)}
                      >
                        <span
                          className="dropdown-item-icon"
                          style={{ color: option.color }}
                        >
                          <Icon size={18} />
                        </span>
                        <span className="dropdown-item-text">
                          <strong>{option.label}</strong>
                          <small>{option.description}</small>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          }
        />

        {/* =====================================
            STATS
        ===================================== */}
        <div className="stats-grid">
          <StatCard
            title="Total Clients"
            value={totalClients}
            description="Clients in your system"
            icon={Users}
          />
          <StatCard
            title="Active Projects"
            value={activeProjects}
            description="Currently in progress"
            icon={FolderKanban}
          />
          <StatCard
            title="Pending Quotations"
            value={pendingQuotations}
            description="Awaiting approval"
            icon={FileText}
          />
          <StatCard
            title="Outstanding"
            value={formatCurrency(totalOutstanding)}
            description="Invoices awaiting payment"
            icon={WalletCards}
          />
        </div>

        {/* =====================================
            HERO + ACTIVITY
        ===================================== */}
        <div className="dashboard-grid">
          {/* HERO */}
          <section className="welcome-card">
            <div className="welcome-pattern"></div>

            <div className="welcome-content">
              <div className="welcome-topline">
                <span className="welcome-icon">
                  <Zap size={16} />
                </span>
                <span>WAMARA CONTRACTORS</span>
              </div>

              <h2>
                Powering every project.
                <br />
                <span>Building trust.</span>
              </h2>

              <p>
                Manage quotations, projects, materials, invoices and payments
                from one professional workspace.
              </p>

              <div className="welcome-actions">
                <button
                  className="welcome-cta"
                  onClick={() => handleNavigate("Quotations")}
                >
                  <Plus size={17} />
                  New Quotation
                </button>

                <button
                  className="secondary-hero-button"
                  onClick={() => handleNavigate("Projects")}
                >
                  View Projects
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </div>

            <div className="hero-brand-mark">
              <div className="hero-lightning">
                <Zap size={80} />
              </div>
              <span>VOLTDESK</span>
            </div>
          </section>

          {/* ACTIVITY */}
          <section className="dashboard-side-card">
            <div className="section-heading">
              <div>
                <p className="section-eyebrow">QUICK OVERVIEW</p>
                <h3>Business Activity</h3>
              </div>
              <div className="activity-heading-icon">
                <Activity size={18} />
              </div>
            </div>

            <div className="activity-list">
              <div
                className="activity-item clickable"
                onClick={() => handleNavigate("Quotations")}
              >
                <div className="activity-label">
                  <span className="activity-dot quotation"></span>
                  Quotations
                </div>
                <strong>{quotations.length}</strong>
              </div>

              <div
                className="activity-item clickable"
                onClick={() => handleNavigate("Invoices")}
              >
                <div className="activity-label">
                  <span className="activity-dot invoice"></span>
                  Invoices
                </div>
                <strong>{invoices.length}</strong>
              </div>

              <div
                className="activity-item clickable"
                onClick={() => handleNavigate("Receipts")}
              >
                <div className="activity-label">
                  <span className="activity-dot receipt"></span>
                  Receipts
                </div>
                <strong>{receipts.length}</strong>
              </div>

              <div
                className="activity-item clickable"
                onClick={() => handleNavigate("Projects")}
              >
                <div className="activity-label">
                  <span className="activity-dot project"></span>
                  Projects
                </div>
                <strong>{projects.length}</strong>
              </div>
            </div>

            <div className="activity-footer">
              <TrendingUp size={15} />
              <span>Keep your projects moving forward</span>
            </div>
          </section>
        </div>

        {/* =====================================
            RECENT DOCUMENTS
        ===================================== */}
        <section className="recent-section">
          <div className="section-heading recent-heading">
            <div>
              <p className="section-eyebrow">RECENT ACTIVITY</p>
              <h3>Latest Documents</h3>
            </div>

            <button
              className="view-all-button"
              onClick={() => handleNavigate("Quotations")}
            >
              View All
              <ArrowUpRight size={16} />
            </button>
          </div>

          <div className="table-card">
            {recentDocuments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <FileText size={25} />
                </div>
                <h3>No documents yet</h3>
                <p>
                  Create your first quotation to get started with your
                  electrical business.
                </p>
                <button
                  className="empty-state-button"
                  onClick={() => handleNavigate("Quotations")}
                >
                  <Plus size={16} />
                  Create Quotation
                </button>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>Client</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDocuments.map((doc) => (
                      <tr
                        key={doc.id}
                        className="clickable-row"
                        onClick={() => {
                          if (doc.type === "Quotation") {
                            handleNavigate("Quotations");
                          } else if (doc.type === "Invoice") {
                            handleNavigate("Invoices");
                          } else if (doc.type === "Receipt") {
                            handleNavigate("Receipts");
                          }
                        }}
                      >
                        <td>
                          <div className="document-cell">
                            <div
                              className={`document-icon ${doc.type.toLowerCase()}`}
                            >
                              {doc.type === "Quotation" && (
                                <FileSignature size={16} />
                              )}
                              {doc.type === "Invoice" && <Receipt size={16} />}
                              {doc.type === "Receipt" && (
                                <CreditCard size={16} />
                              )}
                            </div>
                            <div>
                              <span className="font-medium">{doc.number}</span>
                              <small>{doc.type}</small>
                            </div>
                          </div>
                        </td>
                        <td>{doc.client}</td>
                        <td>
                          <span className="amount-cell">
                            {formatCurrency(doc.amount)}
                          </span>
                        </td>
                        <td>
                          <StatusBadge status={doc.status} />
                        </td>
                        <td>
                          <ArrowUpRight size={16} className="row-arrow" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default DashboardPage;
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  X,
  Printer,
  Download,
  WalletCards,
  Banknote,
  CheckCircle2,
} from "lucide-react";
import "../styles/ReceiptsPage.css";
import logo from "../assets/branding/wamara-contractors-logo.png";

type Receipt = {
  id?: number;
  receipt_number: string;
  invoice_id?: number | null;
  client_id?: number | null;
  client_name: string;
  client_phone: string;
  client_email: string;
  client_location: string;
  invoice_number: string;
  amount: number;
  payment_method: string;
  payment_reference: string;
  notes: string;
  received_date: string;
  received_by: string;
  created_at?: string;
};

type Invoice = {
  id: number;
  invoice_number: string;
  client_id?: number | null;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  client_location?: string;
  subject?: string;
  total: number;
  amount_paid: number;
  status: string;
};

function createEmptyReceipt(): Receipt {
  return {
    receipt_number: "",
    invoice_id: null,
    client_id: null,
    client_name: "",
    client_phone: "",
    client_email: "",
    client_location: "",
    invoice_number: "",
    amount: 0,
    payment_method: "Cash",
    payment_reference: "",
    notes: "",
    received_date: new Date().toISOString().slice(0, 10),
    received_by: "",
  };
}

function generateReceiptNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `REC-${year}${month}-${random}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDate(date?: string) {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [showEditor, setShowEditor] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<Receipt | null>(null);
  const [form, setForm] = useState<Receipt>(createEmptyReceipt());
  const [isSaving, setIsSaving] = useState(false);
  const [viewerRemainingBalance, setViewerRemainingBalance] = useState<number | null>(null);

  async function loadData() {
    try {
      setIsLoading(true);

      if (!window.electronAPI?.receipts || !window.electronAPI?.invoices) {
        console.error("electronAPI receipts/invoices not available");
        return;
      }

      const [receiptData, invoiceData] = await Promise.all([
        window.electronAPI.receipts.getAll(),
        window.electronAPI.invoices.getAll(),
      ]);

      setReceipts(Array.isArray(receiptData) ? receiptData : []);
      setInvoices(Array.isArray(invoiceData) ? invoiceData : []);
    } catch (error) {
      console.error("Failed to load receipts:", error);
      alert("Failed to load receipts. Please restart the app.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredReceipts = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return receipts;

    return receipts.filter(
      (r) =>
        r.receipt_number?.toLowerCase().includes(search) ||
        r.client_name?.toLowerCase().includes(search) ||
        r.invoice_number?.toLowerCase().includes(search) ||
        r.payment_method?.toLowerCase().includes(search)
    );
  }, [receipts, searchTerm]);

  const stats = useMemo(() => {
    const totalReceived = receipts.reduce(
      (sum, r) => sum + (Number(r.amount) || 0),
      0
    );
    const thisMonth = receipts
      .filter((r) => {
        if (!r.received_date) return false;
        const d = new Date(r.received_date);
        const now = new Date();
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    return {
      count: receipts.length,
      totalReceived,
      thisMonth,
    };
  }, [receipts]);

  // All invoices available for linking (unpaid / partial first)
  const linkableInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => {
      const balanceA =
        (Number(a.total) || 0) - (Number(a.amount_paid) || 0);
      const balanceB =
        (Number(b.total) || 0) - (Number(b.amount_paid) || 0);
      // Unpaid first, then by id desc
      if (balanceA > 0 && balanceB <= 0) return -1;
      if (balanceA <= 0 && balanceB > 0) return 1;
      return (b.id || 0) - (a.id || 0);
    });
  }, [invoices]);

  // Remaining invoice balance after this receipt payment
  const selectedInvoice = useMemo(() => {
    if (!form.invoice_id) return null;
    return invoices.find((inv) => inv.id === form.invoice_id) || null;
  }, [form.invoice_id, invoices]);

  const remainingAfterPayment = useMemo(() => {
    if (!selectedInvoice) return null;
    const paid = Number(selectedInvoice.amount_paid) || 0;
    const total = Number(selectedInvoice.total) || 0;
    const currentReceipt = Number(form.amount) || 0;
    // When editing, avoid double-counting this receipt's previous amount
    const priorOnThisReceipt = editingReceipt?.invoice_id === form.invoice_id
      ? Number(editingReceipt.amount) || 0
      : 0;
    const remaining = total - paid + priorOnThisReceipt - currentReceipt;
    return remaining;
  }, [selectedInvoice, form.amount, form.invoice_id, editingReceipt]);

  async function openCreateModal() {
    // Refresh invoices so the link dropdown is up to date
    try {
      if (window.electronAPI?.invoices?.getAll) {
        const invoiceData = await window.electronAPI.invoices.getAll();
        setInvoices(Array.isArray(invoiceData) ? invoiceData : []);
      }
    } catch (error) {
      console.error("Failed to refresh invoices:", error);
    }

    const blank = createEmptyReceipt();
    blank.receipt_number = generateReceiptNumber();
    setForm(blank);
    setEditingReceipt(null);
    setShowEditor(true);
  }

  async function openEditModal(receipt: Receipt) {
    try {
      const full = await window.electronAPI.receipts.getById(receipt.id!);
      if (!full) {
        alert("Could not load receipt.");
        return;
      }
      setEditingReceipt(full);
      setForm(full);
      setShowEditor(true);
    } catch (error) {
      console.error(error);
      alert("Failed to open receipt for editing.");
    }
  }

  async function openViewer(receipt: Receipt) {
    try {
      const full = await window.electronAPI.receipts.getById(receipt.id!);
      if (!full) {
        alert("Could not load receipt.");
        return;
      }

      let remaining: number | null = null;
      if (full.invoice_id) {
        try {
          const inv =
            (await window.electronAPI.invoices.getById(full.invoice_id)) ||
            invoices.find((i) => i.id === full.invoice_id);
          if (inv) {
            const paid = Number(inv.amount_paid) || 0;
            const total = Number(inv.total) || 0;
            const bal = total - paid;
            remaining = bal > 0 ? bal : null;
          }
        } catch (e) {
          console.warn("Could not load invoice balance for viewer", e);
        }
      }

      setViewerRemainingBalance(remaining);
      setViewingReceipt(full);
      setShowViewer(true);
    } catch (error) {
      console.error(error);
      alert("Failed to open receipt.");
    }
  }

  async function handleInvoiceSelect(invoiceId: string) {
    if (!invoiceId) {
      setForm((prev) => ({
        ...prev,
        invoice_id: null,
        invoice_number: "",
      }));
      return;
    }

    try {
      const id = Number(invoiceId);

      // Prefer full invoice; fall back to list data if getById fails
      let full =
        (await window.electronAPI.invoices.getById(id)) ||
        invoices.find((inv) => inv.id === id);

      if (!full) {
        alert("Could not load invoice.");
        return;
      }

      const balance = Math.max(
        0,
        (Number(full.total) || 0) - (Number(full.amount_paid) || 0)
      );

      setForm((prev) => ({
        ...prev,
        invoice_id: full.id,
        invoice_number: full.invoice_number || "",
        client_id: full.client_id || null,
        client_name: full.client_name || "",
        client_phone: full.client_phone || "",
        client_email: full.client_email || "",
        client_location: full.client_location || "",
        // If already fully paid, still allow linking; leave amount editable
        amount: balance > 0 ? balance : prev.amount || 0,
      }));
    } catch (error) {
      console.error(error);
      alert("Failed to load invoice details.");
    }
  }

  async function handleSave() {
    if (isSaving) return;

    if (!form.client_name.trim()) {
      alert("Please enter a client name.");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }

    setIsSaving(true);

    try {
      const payload: Receipt = {
        ...form,
        id: editingReceipt?.id,
        amount: Number(form.amount) || 0,
      };

      if (editingReceipt?.id) {
        await window.electronAPI.receipts.update(payload);
      } else {
        await window.electronAPI.receipts.create(payload);
      }

      await loadData();
      setShowEditor(false);
      setEditingReceipt(null);
      setForm(createEmptyReceipt());
    } catch (error: any) {
      console.error(error);
      alert(
        "Failed to save receipt.\n\n" +
          (error?.message || "Check the console for details.")
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id?: number) {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this receipt?")) {
      return;
    }

    try {
      await window.electronAPI.receipts.delete(id);
      await loadData();
      setShowViewer(false);
      setViewingReceipt(null);
    } catch (error) {
      console.error(error);
      alert("Failed to delete receipt.");
    }
  }

  async function downloadPDF(receipt: Receipt) {
    try {
      const full =
        receipt.id
          ? await window.electronAPI.receipts.getById(receipt.id)
          : receipt;

      if (!full) {
        alert("Could not load receipt for PDF.");
        return;
      }

      let logoBase64 = "";
      try {
        const response = await fetch(logo);
        const blob = await response.blob();
        logoBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch (err) {
        console.warn("Could not convert logo:", err);
      }

      let pdfRemaining: number | null = null;
      if (full.invoice_id) {
        try {
          const inv =
            (await window.electronAPI.invoices.getById(full.invoice_id)) ||
            invoices.find((i) => i.id === full.invoice_id);
          if (inv) {
            const bal =
              (Number(inv.total) || 0) - (Number(inv.amount_paid) || 0);
            pdfRemaining = bal > 0 ? bal : null;
          }
        } catch (e) {
          console.warn("Could not load invoice balance for PDF", e);
        }
      }

      const remainingHtml =
        pdfRemaining != null && pdfRemaining > 0
          ? `<small style="display:block;margin-top:8px;font-size:12px;font-weight:700;color:#1f2937">Remaining balance: ${formatCurrency(pdfRemaining)}</small>`
          : "";

      const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
@page { size: A4; margin: 16mm 14mm; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #1f2937;
  background: white;
  font-size: 12px;
  line-height: 1.45;
}
.top {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 22px;
  padding-bottom: 16px;
  border-bottom: 3px solid #f5b700;
}
.company {
  display: flex;
  align-items: center;
  gap: 12px;
}
.company img {
  width: 110px;
  height: 110px;
  object-fit: contain;
}
.company h2 {
  font-size: 20px;
  color: #1e3a5f;
  letter-spacing: 1px;
}
.company h3 {
  font-size: 11px;
  letter-spacing: 2px;
  color: #6b7280;
}
.company p {
  font-size: 10px;
  color: #6b7280;
  margin-top: 2px;
}
.meta {
  text-align: right;
}
.meta h1 {
  font-size: 26px;
  color: #1e3a5f;
  margin-bottom: 8px;
}
.meta p {
  font-size: 12px;
  color: #6b7280;
  margin: 3px 0;
}
.meta strong { color: #1f2937; }
.card {
  padding: 14px;
  background: #faf8f0;
  border-left: 4px solid #f5b700;
  border-radius: 6px;
  margin-bottom: 16px;
}
.card span {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
  color: #b38600;
}
.card strong {
  display: block;
  margin: 6px 0 3px;
  color: #1f2937;
  font-size: 14px;
}
.card p {
  font-size: 12px;
  color: #6b7280;
  margin: 2px 0;
}
.amount-box {
  margin: 24px 0;
  padding: 20px;
  background: #f5b700;
  border-radius: 10px;
  text-align: center;
}
.amount-box span {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #1f2937;
  letter-spacing: 1px;
  margin-bottom: 6px;
}
.amount-box strong {
  font-size: 28px;
  color: #1f2937;
  font-weight: 400;
}
.details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 24px;
  margin-top: 8px;
}
.details div {
  padding: 10px 0;
  border-bottom: 1px solid #e5e7eb;
}
.details span {
  display: block;
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 3px;
}
.details strong {
  color: #1f2937;
  font-size: 13px;
}
.footer {
  margin-top: 36px;
  padding-top: 14px;
  border-top: 1px solid #e5e7eb;
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  color: #1e3a5f;
  letter-spacing: 0.5px;
}
.thanks {
  margin-top: 28px;
  text-align: center;
  font-size: 13px;
  color: #6b7280;
}
.sign-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-top: 36px;
  page-break-inside: avoid;
}
.sign-box span {
  display: block;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.8px;
  color: #6b7280;
  text-transform: uppercase;
  margin-bottom: 28px;
}
.sign-line {
  height: 1px;
  background: #98a2b3;
  margin-bottom: 8px;
}
.sign-box strong {
  display: block;
  font-size: 13px;
  color: #1f2937;
  margin-bottom: 4px;
}
.sign-box p {
  font-size: 11px;
  color: #6b7280;
}
.stamp-box {
  height: 90px;
  border: 1px dashed #98a2b3;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #98a2b3;
  font-size: 11px;
}
</style>
</head>
<body>
  <div class="top">
    <div class="company">
      ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" />` : ""}
      <div>
        <h2>WAMARA</h2>
        <h3>CONTRACTORS</h3>
        <p>Electrical Installation | Solar | Maintenance</p>
        <p>wamaracontractors@gmail.com</p>
        <p>Kampala, Uganda · +256 782 696812</p>
      </div>
    </div>
    <div class="meta">
      <h1>RECEIPT</h1>
      <p>Receipt #: <strong>${full.receipt_number}</strong></p>
      <p>Date: ${formatDate(full.received_date || full.created_at)}</p>
    </div>
  </div>

  <div class="card">
    <span>RECEIVED FROM</span>
    <strong>${full.client_name}</strong>
    ${full.client_phone ? `<p>${full.client_phone}</p>` : ""}
    ${full.client_email ? `<p>${full.client_email}</p>` : ""}
    ${full.client_location ? `<p>${full.client_location}</p>` : ""}
  </div>

  <div class="amount-box">
    <span>AMOUNT received</span>
    <strong>${formatCurrency(full.amount)}</strong>
    ${remainingHtml}
  </div>

  <div class="details">
    <div>
      <span>Payment Method</span>
      <strong>${full.payment_method || "—"}</strong>
    </div>
    <div>
      <span>Reference</span>
      <strong>${full.payment_reference || "—"}</strong>
    </div>
    <div>
      <span>Linked Invoice</span>
      <strong>${full.invoice_number || "—"}</strong>
    </div>
    <div>
      <span>Received Date</span>
      <strong>${formatDate(full.received_date) || "—"}</strong>
    </div>
  </div>

  ${
    full.notes
      ? `<div style="margin-top:18px"><span style="font-size:11px;color:#6b7280">Notes</span><p style="margin-top:4px;color:#1f2937">${full.notes}</p></div>`
      : ""
  }

  <div class="sign-section">
    <div class="sign-box">
      <span>Received by</span>
      <p>Signature</p>
      <div class="sign-line"></div>
      <strong>${full.received_by || "________________"}</strong>
    </div>
    <div class="sign-box">
      <span>Official stamp</span>
      <div class="stamp-box">Stamp here</div>
    </div>
  </div>

  <p class="thanks">Thank you for your payment.</p>
  <div class="footer">
    WAMARA CONTRACTORS · POWERING EVERY PROJECT · BUILDING TRUST
  </div>
</body>
</html>`;

      const filename = `${
        full.client_name
          ? full.client_name.replace(/[/\\?%*:|"<>]/g, "-")
          : "receipt"
      }-${full.receipt_number}.pdf`;

      await window.electronAPI.printToPDF(html, filename);
    } catch (error: any) {
      console.error(error);
      alert("Failed to generate PDF: " + (error?.message || "Unknown error"));
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="receipts-page">
      {/* HEADER */}
      <div className="receipts-header">
        <div>
          <p className="page-eyebrow">PAYMENTS</p>
          <h1>Receipts</h1>
          <p className="page-description">
            Record payments received from clients and link them to invoices.
          </p>
        </div>
        <button className="primary-button" onClick={openCreateModal}>
          <Plus size={18} />
          New Receipt
        </button>
      </div>

      {/* STATS */}
      <div className="receipt-stats">
        <div className="receipt-stat-card">
          <div className="receipt-stat-icon">
            <WalletCards size={22} />
          </div>
          <div>
            <span>Total Receipts</span>
            <strong>{stats.count}</strong>
          </div>
        </div>
        <div className="receipt-stat-card">
          <div className="receipt-stat-icon received">
            <Banknote size={22} />
          </div>
          <div>
            <span>Total Received</span>
            <strong>{formatCurrency(stats.totalReceived)}</strong>
          </div>
        </div>
        <div className="receipt-stat-card">
          <div className="receipt-stat-icon month">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span>This Month</span>
            <strong>{formatCurrency(stats.thisMonth)}</strong>
          </div>
        </div>
      </div>

      {/* LIST */}
      <div className="receipts-card">
        <div className="receipts-toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              placeholder="Search receipt, client or invoice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="receipts-count">
            {filteredReceipts.length} receipt
            {filteredReceipts.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="receipts-table-wrapper">
          <table className="receipts-table">
            <thead>
              <tr>
                <th>Receipt</th>
                <th>Client</th>
                <th>Invoice</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="no-results">
                    Loading receipts...
                  </td>
                </tr>
              ) : filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="no-results">
                    No receipts found. Record a payment from an invoice.
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((receipt) => (
                  <tr key={receipt.id}>
                    <td>
                      <strong className="receipt-number">
                        {receipt.receipt_number}
                      </strong>
                    </td>
                    <td>{receipt.client_name}</td>
                    <td>{receipt.invoice_number || "—"}</td>
                    <td className="amount-cell">
                      {formatCurrency(receipt.amount)}
                    </td>
                    <td>{receipt.payment_method}</td>
                    <td>{formatDate(receipt.received_date)}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="action-button"
                          title="View"
                          onClick={() => openViewer(receipt)}
                        >
                          <Eye size={17} />
                        </button>
                        <button
                          className="action-button"
                          title="Edit"
                          onClick={() => openEditModal(receipt)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="action-button"
                          title="Download PDF"
                          onClick={() => downloadPDF(receipt)}
                        >
                          <Download size={16} />
                        </button>
                        <button
                          className="action-button delete-action"
                          title="Delete"
                          onClick={() => handleDelete(receipt.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDITOR */}
      {showEditor && (
        <div className="modal-overlay">
          <div className="receipt-modal">
            <div className="modal-header">
              <div>
                <p className="page-eyebrow">
                  {editingReceipt ? "EDIT RECEIPT" : "NEW RECEIPT"}
                </p>
                <h2>
                  {editingReceipt ? "Edit Receipt" : "Record Payment"}
                </h2>
              </div>
              <button
                className="close-button"
                onClick={() => setShowEditor(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="receipt-form">
              <div className="form-group full-width quotation-link-box">
                <label>Link to Invoice (recommended)</label>
                <select
                  value={
                    form.invoice_id != null && form.invoice_id !== ""
                      ? String(form.invoice_id)
                      : ""
                  }
                  onChange={(e) => handleInvoiceSelect(e.target.value)}
                >
                  <option value="">
                    {linkableInvoices.length === 0
                      ? "No invoices found — create an invoice first"
                      : "Select an invoice..."}
                  </option>
                  {linkableInvoices.map((inv) => {
                    const paid = Number(inv.amount_paid) || 0;
                    const total = Number(inv.total) || 0;
                    const balance = Math.max(0, total - paid);
                    const statusLabel =
                      balance <= 0
                        ? "Paid"
                        : paid > 0
                        ? "Partial"
                        : inv.status || "Open";
                    return (
                      <option key={inv.id} value={String(inv.id)}>
                        {inv.invoice_number} — {inv.client_name} —{" "}
                        {formatCurrency(balance)} due ({statusLabel})
                      </option>
                    );
                  })}
                </select>
                <small>
                  {linkableInvoices.length === 0
                    ? "Go to Invoices and create/save an invoice first, then return here."
                    : "Selecting an invoice fills client details and the remaining balance. Saving updates the invoice payment status."}
                </small>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Receipt Number</label>
                  <input
                    value={form.receipt_number}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        receipt_number: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Received Date</label>
                  <input
                    type="date"
                    value={form.received_date}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        received_date: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Client Name *</label>
                  <input
                    value={form.client_name}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        client_name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    value={form.client_phone}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        client_phone: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Amount Received (UGX) *</label>
                  <input
                    type="number"
                    min="0"
                    value={form.amount}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        amount: Number(e.target.value) || 0,
                      }))
                    }
                  />
                  {form.invoice_id &&
                    remainingAfterPayment != null &&
                    remainingAfterPayment > 0 && (
                      <small>
                        Remaining balance after this payment:{" "}
                        {formatCurrency(remainingAfterPayment)}
                      </small>
                    )}
                </div>
                <div className="form-group">
                  <label>Payment Method</label>
                  <select
                    value={form.payment_method}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        payment_method: e.target.value,
                      }))
                    }
                  >
                    <option>Cash</option>
                    <option>Mobile Money</option>
                    <option>Bank Transfer</option>
                    <option>Cheque</option>
                    <option>Card</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Payment Reference</label>
                  <input
                    placeholder="Transaction ID / Cheque no."
                    value={form.payment_reference}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        payment_reference: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Invoice Number</label>
                  <input
                    value={form.invoice_number}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        invoice_number: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group full-width">
                  <label>Received By (staff name)</label>
                  <input
                    placeholder="Name of person who received the payment"
                    value={form.received_by}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        received_by: e.target.value,
                      }))
                    }
                  />
                  <small>
                    This name will appear on the receipt with a signature and
                    stamp area.
                  </small>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowEditor(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary-button"
                  disabled={isSaving}
                  onClick={handleSave}
                >
                  {isSaving ? "Saving..." : "Save Receipt"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEWER */}
      {showViewer && viewingReceipt && (
        <div className="modal-overlay">
          <div className="receipt-viewer-modal">
            <div className="modal-header">
              <div>
                <span className="viewer-reference">
                  {viewingReceipt.receipt_number}
                </span>
                <h2>Receipt Preview</h2>
              </div>
              <button
                className="close-button"
                onClick={() => setShowViewer(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="receipt-viewer-body">
              <div className="receipt-document" id="printable-receipt">
                <div className="document-top">
                  <div className="document-company">
                    <img src={logo} alt="Wamara Contractors Logo" />
                    <div>
                      <h2>WAMARA</h2>
                      <h3>CONTRACTORS</h3>
                      <p>Electrical Installation | Solar | Maintenance</p>
                      <p>wamaracontractors@gmail.com</p>
                      <p>Kampala, Uganda · +256 782 696812</p>
                    </div>
                  </div>
                  <div className="document-info">
                    <h1>RECEIPT</h1>
                    <p>
                      Receipt #:{" "}
                      <strong>{viewingReceipt.receipt_number}</strong>
                    </p>
                    <p>
                      Date:{" "}
                      {formatDate(
                        viewingReceipt.received_date ||
                          viewingReceipt.created_at
                      )}
                    </p>
                  </div>
                </div>

                <div className="receipt-client-box">
                  <span>RECEIVED FROM</span>
                  <strong>{viewingReceipt.client_name}</strong>
                  {viewingReceipt.client_phone && (
                    <p>{viewingReceipt.client_phone}</p>
                  )}
                  {viewingReceipt.client_email && (
                    <p>{viewingReceipt.client_email}</p>
                  )}
                  {viewingReceipt.client_location && (
                    <p>{viewingReceipt.client_location}</p>
                  )}
                </div>

                <div className="receipt-amount-box">
                  <span>AMOUNT received</span>
                  <strong>{formatCurrency(viewingReceipt.amount)}</strong>
                  {viewerRemainingBalance != null &&
                    viewerRemainingBalance > 0 && (
                      <small className="receipt-remaining-balance">
                        Balance:{" "}
                        {formatCurrency(viewerRemainingBalance)}
                      </small>
                    )}
                </div>

                <div className="receipt-details-grid">
                  <div>
                    <span>Payment Method</span>
                    <strong>{viewingReceipt.payment_method || "—"}</strong>
                  </div>
                  <div>
                    <span>Reference</span>
                    <strong>
                      {viewingReceipt.payment_reference || "—"}
                    </strong>
                  </div>
                  <div>
                    <span>Linked Invoice</span>
                    <strong>{viewingReceipt.invoice_number || "—"}</strong>
                  </div>
                  <div>
                    <span>Received Date</span>
                    <strong>
                      {formatDate(viewingReceipt.received_date) || "—"}
                    </strong>
                  </div>
                </div>

                {viewingReceipt.notes && (
                  <div className="receipt-notes">
                    <span>Notes</span>
                    <p>{viewingReceipt.notes}</p>
                  </div>
                )}

                <div className="receipt-sign-section">
                  <div className="receipt-sign-box">
                    <span>Received by</span>
                    <div className="receipt-sign-line" />
                    <strong>
                      {viewingReceipt.received_by || "________________"}
                    </strong>
                    <p>Signature</p>
                  </div>
                  <div className="receipt-sign-box">
                    <span>Official stamp</span>
                    <div className="receipt-stamp-box">Stamp here</div>
                  </div>
                </div>

                <p className="receipt-thanks">Thank you for your payment.</p>
                <div className="document-footer">
                  WAMARA CONTRACTORS · POWERING EVERY PROJECT · BUILDING TRUST
                </div>
              </div>
            </div>

            <div className="quotation-modal-footer">
              <button
                className="modal-footer-button cancel-modal-button"
                onClick={() => setShowViewer(false)}
              >
                Close
              </button>
              <div className="modal-footer-right">
                <button
                  className="modal-footer-button edit-modal-button"
                  onClick={() => {
                    setShowViewer(false);
                    openEditModal(viewingReceipt);
                  }}
                >
                  <Pencil size={16} />
                  Edit
                </button>
                <button
                  className="modal-footer-button print-modal-button"
                  onClick={handlePrint}
                >
                  <Printer size={16} />
                  Print
                </button>
                <button
                  className="modal-footer-button download-modal-button"
                  onClick={() => downloadPDF(viewingReceipt)}
                >
                  <Download size={16} />
                  Save PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

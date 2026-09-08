import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";

import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  X,
  Printer,
  Download,
  FileText,
  CheckCircle2,
  Send,
  Clock,
  AlertCircle,
  Receipt,
  Banknote,
  LayoutGrid,
  List,
  Rows3,
} from "lucide-react";
import "../styles/InvoicesPage.css";
import logo from "../assets/branding/wamara-contractors-logo.png";

type InvoiceItem = {
  id?: number;
  item_name: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
};

type Invoice = {
  id?: number;
  invoice_number: string;
  quotation_id?: number | null;
  client_id?: number | null;
  client_name: string;
  client_phone: string;
  client_email: string;
  client_location: string;
  subject: string;
  description: string;
  subtotal: number;
  labour_cost: number;
  transport_cost: number;
  transport_description: string;
  tax_rate: number;
  tax_amount: number;
  discount: number;
  total: number;
  amount_paid: number;
  status: string;
  due_date: string;
  terms: string;
  notes: string;
  payment_info: string;
  created_at?: string;
  items: InvoiceItem[];
};

type Quotation = {
  id: number;
  quotation_number: string;
  client_id?: number | null;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  client_location?: string;
  subject: string;
  description?: string;
  subtotal: number;
  labour_cost: number;
  transport_cost?: number;
  transport_description?: string;
  total: number;
  status: string;
  terms?: string;
  items?: InvoiceItem[];
};

const DEFAULT_TERMS =
  "1. Payment is due within 15 days of invoice date.\n" +
  "2. A late fee may apply to overdue balances.\n" +
  "3. Please include the invoice number with your payment.\n" +
  "4. Thank you for your business.";

const DEFAULT_PAYMENT_INFO =
  "BANK NAME: Equity Bank\n" +
  "ACCOUNT NAME: Wamara Contractors\n" +
  "ACCOUNT NUMBER: 1035102306009\n" +
  "MOBILE MONEY: 0782 696812 | 0706 250546\n" +
  "PAYMENT METHOD: Bank Transfer / Mobile Money / Cash";

function createEmptyInvoice(): Invoice {
  return {
    invoice_number: "",
    quotation_id: null,
    client_id: null,
    client_name: "",
    client_phone: "",
    client_email: "",
    client_location: "",
    subject: "",
    description: "",
    subtotal: 0,
    labour_cost: 0,
    transport_cost: 0,
    transport_description: "",
    tax_rate: 0,
    tax_amount: 0,
    discount: 0,
    total: 0,
    amount_paid: 0,
    status: "Draft",
    due_date: "",
    terms: DEFAULT_TERMS,
    notes: "",
    payment_info: DEFAULT_PAYMENT_INFO,
    items: [
      {
        item_name: "",
        description: "",
        quantity: 1,
        unit: "pcs",
        unit_price: 0,
        total: 0,
      },
    ],
  };
}

function generateInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `INV-${year}${month}-${random}`;
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

function addDaysISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

type ViewMode = "list" | "grid" | "detailed";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const [showEditor, setShowEditor] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [form, setForm] = useState<Invoice>(createEmptyInvoice());
  const [isSaving, setIsSaving] = useState(false);

  async function loadData() {
    try {
      setIsLoading(true);

      if (!window.electronAPI?.invoices || !window.electronAPI?.quotations) {
        console.error("electronAPI invoices/quotations not available");
        return;
      }

      const [invoiceData, quotationData] = await Promise.all([
        window.electronAPI.invoices.getAll(),
        window.electronAPI.quotations.getAll(),
      ]);

      setInvoices(Array.isArray(invoiceData) ? invoiceData : []);
      setQuotations(Array.isArray(quotationData) ? quotationData : []);
    } catch (error) {
      console.error("Failed to load invoices:", error);
      alert("Failed to load invoices. Please restart the app.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredInvoices = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return invoices.filter((inv) => {
      const matchesSearch =
        !search ||
        inv.invoice_number?.toLowerCase().includes(search) ||
        inv.client_name?.toLowerCase().includes(search) ||
        inv.subject?.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "All" || inv.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const totalInvoiced = invoices.reduce(
      (sum, inv) => sum + (Number(inv.total) || 0),
      0
    );
    const paid = invoices.reduce(
      (sum, inv) => sum + (Number(inv.amount_paid) || 0),
      0
    );
    const outstanding = Math.max(0, totalInvoiced - paid);
    const overdue = invoices.filter((inv) => inv.status === "Overdue").length;

    return {
      count: invoices.length,
      totalInvoiced,
      paid,
      outstanding,
      overdue,
      draft: invoices.filter((i) => i.status === "Draft").length,
      unpaid: invoices.filter(
        (i) => i.status === "Unpaid" || i.status === "Sent"
      ).length,
    };
  }, [invoices]);

  /* =========================================
     CREATE / EDIT / VIEW
  ========================================= */

  function openCreateModal() {
    const blank = createEmptyInvoice();
    blank.invoice_number = generateInvoiceNumber();
    blank.due_date = addDaysISO(15);
    setForm(blank);
    setEditingInvoice(null);
    setShowEditor(true);
  }

  async function openEditModal(invoice: Invoice) {
    try {
      const full = await window.electronAPI.invoices.getById(invoice.id!);
      if (!full) {
        alert("Could not load invoice.");
        return;
      }

      setEditingInvoice(full);
      setForm({
        ...full,
        payment_info: full.payment_info?.trim()
          ? full.payment_info
          : DEFAULT_PAYMENT_INFO,
        terms: full.terms?.trim() ? full.terms : DEFAULT_TERMS,
        items:
          full.items?.length > 0
            ? full.items
            : createEmptyInvoice().items,
      });
      setShowEditor(true);
    } catch (error) {
      console.error(error);
      alert("Failed to open invoice for editing.");
    }
  }

  async function openViewer(invoice: Invoice) {
    try {
      const full = await window.electronAPI.invoices.getById(invoice.id!);
      if (!full) {
        alert("Could not load invoice.");
        return;
      }
      setViewingInvoice(full);
      setShowViewer(true);
    } catch (error) {
      console.error(error);
      alert("Failed to open invoice.");
    }
  }

  /* =========================================
     PULL FROM QUOTATION
  ========================================= */

  async function handleQuotationSelect(quotationId: string) {
    if (!quotationId) {
      setForm((prev) => ({
        ...prev,
        quotation_id: null,
      }));
      return;
    }

    try {
      const id = Number(quotationId);
      const full = await window.electronAPI.quotations.getById(id);

      if (!full) {
        alert("Could not load quotation.");
        return;
      }

      const items: InvoiceItem[] =
        (full.items || [])
          .filter((item: any) => item.item_name?.trim())
          .map((item: any) => ({
            item_name: item.item_name,
            description: item.description || "",
            quantity: Number(item.quantity) || 0,
            unit: item.unit || "pcs",
            unit_price: Number(item.unit_price) || 0,
            total: Number(item.total) || 0,
          }));

      setForm((prev) => ({
        ...prev,
        quotation_id: full.id,
        client_id: full.client_id || null,
        client_name: full.client_name || "",
        client_phone: full.client_phone || "",
        client_email: full.client_email || "",
        client_location: full.client_location || "",
        subject: full.subject || "",
        description: full.description || "",
        subtotal: Number(full.subtotal) || 0,
        labour_cost: Number(full.labour_cost) || 0,
        transport_cost: Number(full.transport_cost) || 0,
        transport_description: full.transport_description || "",
        terms: full.terms || prev.terms,
        items:
          items.length > 0
            ? items
            : createEmptyInvoice().items,
      }));
    } catch (error) {
      console.error(error);
      alert("Failed to load quotation details.");
    }
  }

  /* =========================================
     ITEMS
  ========================================= */

  function addItem() {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          item_name: "",
          description: "",
          quantity: 1,
          unit: "pcs",
          unit_price: 0,
          total: 0,
        },
      ],
    }));
  }

  function removeItem(index: number) {
    setForm((prev) => {
      if (prev.items.length <= 1) {
        return {
          ...prev,
          items: [
            {
              item_name: "",
              description: "",
              quantity: 1,
              unit: "pcs",
              unit_price: 0,
              total: 0,
            },
          ],
        };
      }
      return {
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      };
    });
  }

  function updateItem(
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) {
    setForm((prev) => {
      const updated = [...prev.items];
      const item = { ...updated[index], [field]: value };
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;
      item.total = qty * price;
      updated[index] = item;
      return { ...prev, items: updated };
    });
  }

  /* =========================================
     TOTALS
  ========================================= */

  const materialsSubtotal = form.items.reduce(
    (sum, item) =>
      sum +
      (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
    0
  );

  const labourCost = Number(form.labour_cost) || 0;
  const transportCost = Number(form.transport_cost) || 0;
  const discount = Number(form.discount) || 0;
  const taxRate = Number(form.tax_rate) || 0;

  const taxableBase =
    materialsSubtotal + labourCost + transportCost - discount;
  const taxAmount = Math.round((taxableBase * taxRate) / 100);
  const grandTotal = Math.max(0, taxableBase + taxAmount);
  const amountPaid = Number(form.amount_paid) || 0;
  const balanceDue = Math.max(0, grandTotal - amountPaid);

  /* =========================================
     SAVE / DELETE / PAYMENT
  ========================================= */

  async function handleSave(status?: string) {
    if (isSaving) return;

    if (!form.client_name.trim()) {
      alert("Please enter a client name.");
      return;
    }

    if (!form.subject.trim()) {
      alert("Please enter an invoice subject.");
      return;
    }

    const validItems = form.items
      .filter((item) => item.item_name.trim())
      .map((item) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unit_price) || 0;
        return {
          ...item,
          quantity: qty,
          unit_price: price,
          total: qty * price,
        };
      });

    if (validItems.length === 0) {
      alert("Please add at least one invoice item.");
      return;
    }

    let nextStatus = status || form.status || "Draft";

    // Auto status from payment
    if (amountPaid > 0 && amountPaid < grandTotal) {
      nextStatus = "Partial";
    } else if (amountPaid >= grandTotal && grandTotal > 0) {
      nextStatus = "Paid";
    }

    const invoiceData: Invoice = {
      ...form,
      id: editingInvoice?.id,
      items: validItems,
      subtotal: materialsSubtotal,
      labour_cost: labourCost,
      transport_cost: transportCost,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      discount,
      total: grandTotal,
      amount_paid: amountPaid,
      status: nextStatus,
    };

    setIsSaving(true);

    try {
      if (editingInvoice?.id) {
        await window.electronAPI.invoices.update(invoiceData);
      } else {
        await window.electronAPI.invoices.create(invoiceData);
      }

      await loadData();
      setShowEditor(false);
      setEditingInvoice(null);
      setForm(createEmptyInvoice());
    } catch (error: any) {
      console.error(error);
      alert(
        "Failed to save invoice.\n\n" +
          (error?.message || "Check the console for details.")
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id?: number) {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this invoice?")) {
      return;
    }

    try {
      await window.electronAPI.invoices.delete(id);
      await loadData();
      setShowViewer(false);
      setViewingInvoice(null);
    } catch (error) {
      console.error(error);
      alert("Failed to delete invoice.");
    }
  }

  async function markAsPaid(invoice: Invoice) {
    try {
      const full =
        invoice.items?.length
          ? invoice
          : await window.electronAPI.invoices.getById(invoice.id!);

      if (!full) return;

      await window.electronAPI.invoices.update({
        ...full,
        amount_paid: Number(full.total) || 0,
        status: "Paid",
      });

      await loadData();

      if (viewingInvoice?.id === invoice.id) {
        setViewingInvoice({
          ...full,
          amount_paid: Number(full.total) || 0,
          status: "Paid",
        });
      }
    } catch (error) {
      console.error(error);
      alert("Failed to mark invoice as paid.");
    }
  }

  /* =========================================
     PDF
  ========================================= */

  async function downloadPDF(invoice: Invoice) {
    try {
      const loaded =
        invoice.items?.length
          ? invoice
          : await window.electronAPI.invoices.getById(invoice.id!);

      if (!loaded) {
        alert("Could not load invoice for PDF.");
        return;
      }

      const full = {
        ...loaded,
        labour_cost: Number(loaded.labour_cost) || 0,
        transport_cost: Number(loaded.transport_cost) || 0,
        transport_description: loaded.transport_description || "",
        tax_rate: Number(loaded.tax_rate) || 0,
        tax_amount: Number(loaded.tax_amount) || 0,
        discount: Number(loaded.discount) || 0,
        subtotal: Number(loaded.subtotal) || 0,
        total: Number(loaded.total) || 0,
        amount_paid: Number(loaded.amount_paid) || 0,
        items: Array.isArray(loaded.items) ? loaded.items : [],
      };

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

      const balance = Math.max(
        0,
        (Number(full.total) || 0) - (Number(full.amount_paid) || 0)
      );

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
  font-size: 11px;
  line-height: 1.4;
}
.invoice {
  max-width: 100%;
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
  color: #1f2937;
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
.invoice-meta {
  text-align: right;
}
.invoice-meta h1 {
  font-size: 28px;
  color: #1f2937;
  margin-bottom: 8px;
  letter-spacing: 1px;
}
.invoice-meta p {
  font-size: 11px;
  color: #6b7280;
  margin: 3px 0;
}
.invoice-meta strong {
  color: #1f2937;
}
.bill-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-bottom: 22px;
}
.bill-box {
  padding: 12px;
  background: #faf8f0;
  border-left: 4px solid #f5b700;
  border-radius: 6px;
}
.bill-box span {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
  color: #b38600;
}
.bill-box strong {
  display: block;
  margin: 6px 0 3px;
  color: #1f2937;
  font-size: 13px;
}
.bill-box p {
  font-size: 11px;
  color: #6b7280;
  margin: 2px 0;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 18px;
}
thead th {
  background: #1f2937;
  color: #f5b700;
  font-size: 10px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  padding: 10px 8px;
  text-align: left;
}
thead th.right { text-align: right; }
tbody td {
  padding: 10px 8px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 11px;
  color: #374151;
  vertical-align: top;
}
tbody td.right { text-align: right; }
tbody td strong {
  display: block;
  color: #1f2937;
}
tbody td small {
  display: block;
  margin-top: 2px;
  color: #9ca3af;
  font-size: 10px;
}
.bottom-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 20px;
  margin-top: 8px;
}
.payment-box, .terms-box, .totals-box {
  page-break-inside: avoid;
}
.payment-box h4, .terms-box h4 {
  font-size: 11px;
  color: #1f2937;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}
.payment-box p, .terms-box p {
  font-size: 10px;
  color: #6b7280;
  white-space: pre-line;
  line-height: 1.55;
}
.totals-box {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 14px;
}
.totals-box .row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 12px;
  color: #6b7280;
  border-bottom: 1px solid #f3f4f6;
}
.totals-box .row strong {
  color: #1f2937;
}
.totals-box .grand {
  margin-top: 6px;
  padding: 10px 12px;
  background: #1f2937;
  border-radius: 6px;
  color: white;
  border-bottom: none;
}
.totals-box .grand strong {
  color: #f5b700;
  font-size: 15px;
  font-weight: 400;
}
.totals-box .balance {
  margin-top: 6px;
  padding: 10px 12px;
  background: #f5b700;
  border-radius: 6px;
  border-bottom: none;
  color: #1f2937;
  font-weight: 400;
}
.totals-box .balance strong {
  color: #1f2937;
  font-size: 15px;
  font-weight: 400;
}
.footer {
  margin-top: 28px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  text-align: center;
  font-size: 10px;
  color: #1f2937;
  font-weight: 700;
  letter-spacing: 1px;
}
</style>
</head>
<body>
<div class="invoice">
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
    <div class="invoice-meta">
      <h1>INVOICE</h1>
      <p>Invoice #: <strong>${full.invoice_number}</strong></p>
      <p>Date: ${formatDate(full.created_at)}</p>
      <p>Due: ${formatDate(full.due_date) || "—"}</p>
      <p>Status: <strong>${full.status}</strong></p>
    </div>
  </div>

  <div class="bill-grid">
    <div class="bill-box">
      <span>BILL TO</span>
      <strong>${full.client_name}</strong>
      ${full.client_phone ? `<p>${full.client_phone}</p>` : ""}
      ${full.client_email ? `<p>${full.client_email}</p>` : ""}
      ${full.client_location ? `<p>${full.client_location}</p>` : ""}
    </div>
    <div class="bill-box">
      <span>SUBJECT</span>
      <strong>${full.subject}</strong>
      ${full.description ? `<p style="margin-top:5px">${full.description}</p>` : ""}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:36px">#</th>
        <th>Description</th>
        <th class="right" style="width:50px">Qty</th>
        <th style="width:50px">Unit</th>
        <th class="right" style="width:100px">Unit Price</th>
        <th class="right" style="width:110px">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${(full.items || [])
        .map(
          (item, i) => `
      <tr>
        <td>${String(i + 1).padStart(2, "0")}</td>
        <td>
          <strong>${item.item_name}</strong>
        </td>
        <td class="right">${item.quantity}</td>
        <td>${item.unit || "pcs"}</td>
        <td class="right">${formatCurrency(item.unit_price)}</td>
        <td class="right">${formatCurrency(item.total)}</td>
      </tr>`
        )
        .join("")}
    </tbody>
  </table>

  <div class="bottom-grid">
    <div>
      <div class="payment-box" style="margin-bottom:16px">
        <h4>PAYMENT INFORMATION</h4>
        <p>${DEFAULT_PAYMENT_INFO}</p>
      </div>
      <div class="terms-box">
        <h4>TERMS & CONDITIONS</h4>
        <p>${DEFAULT_TERMS}</p>
      </div>
    </div>
    <div class="totals-box">
      <div class="row"><span>Materials Subtotal</span><strong>${formatCurrency(full.subtotal)}</strong></div>
      ${
        full.labour_cost > 0
          ? `<div class="row"><span>Labour / Installation</span><strong>${formatCurrency(full.labour_cost)}</strong></div>`
          : ""
      }
      ${
        full.transport_cost > 0
          ? `<div class="row"><span>Transport${full.transport_description ? ` <small>(${full.transport_description})</small>` : ""}</span><strong>${formatCurrency(full.transport_cost)}</strong></div>`
          : ""
      }
      ${
        full.discount > 0
          ? `<div class="row"><span>Discount</span><strong>-${formatCurrency(full.discount)}</strong></div>`
          : ""
      }
      ${
        full.tax_amount > 0
          ? `<div class="row"><span>Tax (${full.tax_rate}%)</span><strong>${formatCurrency(full.tax_amount)}</strong></div>`
          : ""
      }
      <div class="row grand"><span>TOTAL DUE</span><strong>${formatCurrency(full.total)}</strong></div>
      ${
        full.amount_paid > 0
          ? `<div class="row"><span>Amount Paid</span><strong>${formatCurrency(full.amount_paid)}</strong></div>
             <div class="row balance"><span>Balance</span><strong>${formatCurrency(balance)}</strong></div>`
          : ""
      }
    </div>
  </div>

  <div class="footer">
    THANK YOU FOR YOUR BUSINESS · WAMARA CONTRACTORS · POWERING EVERY PROJECT · BUILDING TRUST
  </div>
</div>
</body>
</html>`;

      const filename = `${
        full.client_name
          ? full.client_name.replace(/[/\\?%*:|"<>]/g, "-")
          : "invoice"
      }-${full.invoice_number}.pdf`;

      await window.electronAPI.printToPDF(html, filename);
    } catch (error: any) {
      console.error(error);
      alert("Failed to generate PDF: " + (error?.message || "Unknown error"));
    }
  }

  function handlePrint() {
    window.print();
  }

  function statusClass(status: string) {
    return `status-badge status-${(status || "draft").toLowerCase()}`;
  }

  return (
    <div className="invoices-page">
      {/* HEADER */}
      <div className="invoices-header">
        <div>
          <p className="page-eyebrow">BILLING</p>
          <h1>Invoices</h1>
          <p className="page-description">
            Create professional invoices from quotations and track payments.
          </p>
        </div>
        <button className="primary-button" onClick={openCreateModal}>
          <Plus size={18} />
          New Invoice
        </button>
      </div>

      {/* STATS */}
      <div className="invoice-stats">
        <div className="invoice-stat-card">
          <div className="invoice-stat-icon">
            <Receipt size={22} />
          </div>
          <div>
            <span>Total Invoiced</span>
            <strong>{formatCurrency(stats.totalInvoiced)}</strong>
          </div>
        </div>
        <div className="invoice-stat-card">
          <div className="invoice-stat-icon paid">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span>Paid</span>
            <strong>{formatCurrency(stats.paid)}</strong>
          </div>
        </div>
        <div className="invoice-stat-card">
          <div className="invoice-stat-icon outstanding">
            <Banknote size={22} />
          </div>
          <div>
            <span>Outstanding</span>
            <strong>{formatCurrency(stats.outstanding)}</strong>
          </div>
        </div>
        <div className="invoice-stat-card">
          <div className="invoice-stat-icon overdue">
            <AlertCircle size={22} />
          </div>
          <div>
            <span>Overdue</span>
            <strong>{stats.overdue}</strong>
          </div>
        </div>
      </div>

      {/* LIST */}
      <div className="invoices-card">

        <div className="invoices-toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              placeholder="Search invoice or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="toolbar-right">
            <select
              className="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Partial">Partial</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>

            <span className="invoices-count">
              {filteredInvoices.length} invoice
              {filteredInvoices.length !== 1 ? "s" : ""}
            </span>

            <div className="view-toggle">
              <button
                type="button"
                className={viewMode === "list" ? "active" : ""}
                onClick={() => setViewMode("list")}
                title="List view"
              >
                <List size={16} />
              </button>
              <button
                type="button"
                className={viewMode === "grid" ? "active" : ""}
                onClick={() => setViewMode("grid")}
                title="Grid view"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                className={viewMode === "detailed" ? "active" : ""}
                onClick={() => setViewMode("detailed")}
                title="Detailed cards"
              >
                <Rows3 size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="invoices-body">
          {isLoading ? (
            <div className="no-results">Loading invoices...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="no-results">No invoices found.</div>
          ) : viewMode === "list" ? (
            <div className="invoices-table-wrapper">
              <table className="invoices-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Client</th>
                    <th>Subject</th>
                    <th>Amount</th>
                    <th>Paid</th>
                    <th>Status</th>
                    <th>Due</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>
                        <strong className="invoice-number">
                          {invoice.invoice_number}
                        </strong>
                      </td>
                      <td>{invoice.client_name}</td>
                      <td>{invoice.subject}</td>
                      <td className="amount-cell">
                        {formatCurrency(invoice.total)}
                      </td>
                      <td>{formatCurrency(invoice.amount_paid)}</td>
                      <td>
                        <span
                          className={`status-badge status-${invoice.status?.toLowerCase()}`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td>{formatDate(invoice.due_date) || "—"}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="action-button"
                            title="View"
                            onClick={() => openViewer(invoice)}
                          >
                            <Eye size={17} />
                          </button>
                          <button
                            className="action-button"
                            title="Edit"
                            onClick={() => openEditModal(invoice)}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="action-button"
                            title="Download PDF"
                            onClick={() => downloadPDF(invoice)}
                          >
                            <Download size={16} />
                          </button>
                          <button
                            className="action-button delete-action"
                            title="Delete"
                            onClick={() => handleDelete(invoice.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : viewMode === "grid" ? (
            <div className="invoices-grid">
              {filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="invoice-grid-card"
                  onClick={() => openViewer(invoice)}
                >
                  <div className="invoice-grid-top">
                    <strong className="invoice-number">
                      {invoice.invoice_number}
                    </strong>
                    <span
                      className={`status-badge status-${invoice.status?.toLowerCase()}`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                  <h3>{invoice.subject || "Untitled"}</h3>
                  <p>{invoice.client_name}</p>
                  <div className="invoice-grid-footer">
                    <strong>{formatCurrency(invoice.total)}</strong>
                    <span>{formatDate(invoice.due_date) || "No due date"}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="invoices-detailed">
              {filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="invoice-detailed-card"
                  onClick={() => openViewer(invoice)}
                >
                  <div className="invoice-detailed-top">
                    <div>
                      <strong className="invoice-number">
                        {invoice.invoice_number}
                      </strong>
                      <h3>{invoice.subject || "Untitled"}</h3>
                      <p>{invoice.client_name}</p>
                    </div>
                    <span
                      className={`status-badge status-${invoice.status?.toLowerCase()}`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                  <div className="invoice-detailed-meta">
                    <span>
                      Total: <strong>{formatCurrency(invoice.total)}</strong>
                    </span>
                    <span>
                      Paid:{" "}
                      <strong>{formatCurrency(invoice.amount_paid)}</strong>
                    </span>
                    <span>Due: {formatDate(invoice.due_date) || "—"}</span>
                  </div>
                  <div
                    className="table-actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="action-button"
                      onClick={() => openViewer(invoice)}
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="action-button"
                      onClick={() => openEditModal(invoice)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="action-button"
                      onClick={() => downloadPDF(invoice)}
                    >
                      <Download size={16} />
                    </button>
                    <button
                      className="action-button delete-action"
                      onClick={() => handleDelete(invoice.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

{showEditor && createPortal(
        <div className="modal-overlay">
          <div className="invoice-modal">
            <div className="modal-header">
              <div>
                <p className="page-eyebrow">
                  {editingInvoice ? "EDIT INVOICE" : "NEW INVOICE"}
                </p>
                <h2>
                  {editingInvoice ? "Edit Invoice" : "Create Invoice"}
                </h2>
              </div>
              <button
                className="close-button"
                onClick={() => setShowEditor(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="invoice-form">
              {/* Pull from quotation */}
              <div className="form-group full-width">
                <label>Create from Quotation</label>
                <select
                  value={form.quotation_id || ""}
                  onChange={(e) => handleQuotationSelect(e.target.value)}
                >
                  <option value="">Select a quotation to prefill...</option>
                  {quotations.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.quotation_number} — {q.client_name} — {q.subject} (
                      {formatCurrency(q.total)})
                    </option>
                  ))}
                </select>
                <small>
                  Selecting a quotation fills client, items, labour and
                  transport. You can still edit everything.
                </small>
              </div>

              <div className="form-grid">
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
                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        due_date: e.target.value,
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
                  <label>Email</label>
                  <input
                    value={form.client_email}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        client_email: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    value={form.client_location}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        client_location: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group full-width">
                  <label>Subject *</label>
                  <input
                    value={form.subject}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        subject: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {/* Items */}
              <div className="items-section">
                <div className="section-title">
                  <h3>Line Items</h3>
                  <button
                    type="button"
                    className="add-item-button"
                    onClick={addItem}
                  >
                    <Plus size={16} />
                    Add Item
                  </button>
                </div>

                <div className="items-table-wrapper">
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Description</th>
                        <th>Qty</th>
                        <th>Unit</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <input
                              value={item.item_name}
                              onChange={(e) =>
                                updateItem(index, "item_name", e.target.value)
                              }
                            />
                          </td>
                          <td>
                            <input
                              value={item.description}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "description",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "quantity",
                                  Number(e.target.value)
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              value={item.unit}
                              onChange={(e) =>
                                updateItem(index, "unit", e.target.value)
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              value={item.unit_price}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "unit_price",
                                  Number(e.target.value)
                                )
                              }
                            />
                          </td>
                          <td>
                            {formatCurrency(
                              (Number(item.quantity) || 0) *
                                (Number(item.unit_price) || 0)
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="item-remove-button"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Extra charges */}
              <div className="form-grid">
                <div className="form-group">
                  <label>Labour Cost (UGX)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.labour_cost}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        labour_cost: Number(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Transport Cost (UGX)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.transport_cost}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        transport_cost: Number(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Transport Description</label>
                  <input
                    value={form.transport_description}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        transport_description: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Discount (UGX)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.discount}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        discount: Number(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Tax Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.tax_rate}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        tax_rate: Number(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Amount Paid (UGX)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.amount_paid}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        amount_paid: Number(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label>Payment Information</label>
                <textarea
                  rows={4}
                  value={form.payment_info}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      payment_info: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="form-group full-width">
                <label>Terms & Conditions</label>
                <textarea
                  rows={4}
                  value={form.terms}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      terms: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Totals */}
              <div className="invoice-totals">
                <div className="total-row">
                  <span>Materials Subtotal</span>
                  <strong>{formatCurrency(materialsSubtotal)}</strong>
                </div>
                {labourCost > 0 && (
                  <div className="total-row">
                    <span>Labour</span>
                    <strong>{formatCurrency(labourCost)}</strong>
                  </div>
                )}
                {transportCost > 0 && (
                  <div className="total-row">
                    <span>Transport</span>
                    <strong>{formatCurrency(transportCost)}</strong>
                  </div>
                )}
                {discount > 0 && (
                  <div className="total-row">
                    <span>Discount</span>
                    <strong>-{formatCurrency(discount)}</strong>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="total-row">
                    <span>Tax ({taxRate}%)</span>
                    <strong>{formatCurrency(taxAmount)}</strong>
                  </div>
                )}
                <div className="total-row grand-total">
                  <span>Total Due</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
                {amountPaid > 0 && (
                  <>
                    <div className="total-row">
                      <span>Amount Paid</span>
                      <strong>{formatCurrency(amountPaid)}</strong>
                    </div>
                    <div className="total-row balance-total-row">
                      <span>Balance</span>
                      <strong>{formatCurrency(balanceDue)}</strong>
                    </div>
                  </>
                )}
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
                  onClick={() => handleSave("Draft")}
                >
                  {isSaving ? "Saving..." : "Save Draft"}
                </button>
                <button
                  type="button"
                  className="download-button"
                  disabled={isSaving}
                  onClick={() => handleSave("Sent")}
                >
                  <Send size={17} />
                  {isSaving ? "Saving..." : "Save & Mark Sent"}
                </button>
              </div>
            </div>
          </div>
        </div>
      , document.body)}

      {/* VIEWER */}
      {showViewer && viewingInvoice && createPortal(
        <div className="modal-overlay">
          <div className="invoice-viewer-modal">
            <div className="modal-header">
              <div>
                <span className="viewer-reference">
                  {viewingInvoice.invoice_number}
                </span>
                <h2>Invoice Preview</h2>
              </div>
              <button
                className="close-button"
                onClick={() => setShowViewer(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="invoice-viewer-body">
              <div className="invoice-document" id="printable-invoice">
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
                    <h1>INVOICE</h1>
                    <p>
                      Invoice #:{" "}
                      <strong>{viewingInvoice.invoice_number}</strong>
                    </p>
                    <p>Date: {formatDate(viewingInvoice.created_at)}</p>
                    <p>Due: {formatDate(viewingInvoice.due_date) || "—"}</p>
                    <p>
                      Status: <strong>{viewingInvoice.status}</strong>
                    </p>
                  </div>
                </div>

                <div className="document-client-section">
                  <div>
                    <span>BILL TO</span>
                    <strong>{viewingInvoice.client_name}</strong>
                    {viewingInvoice.client_phone && (
                      <p>{viewingInvoice.client_phone}</p>
                    )}
                    {viewingInvoice.client_email && (
                      <p>{viewingInvoice.client_email}</p>
                    )}
                    {viewingInvoice.client_location && (
                      <p>{viewingInvoice.client_location}</p>
                    )}
                  </div>
                  <div>
                    <span>SUBJECT</span>
                    <strong>{viewingInvoice.subject}</strong>
                    {viewingInvoice.description && (
                      <p style={{ marginTop: 8 }}>
                        {viewingInvoice.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="document-items">
                  <div className="document-table-header">
                    <span>#</span>
                    <span>Description</span>
                    <span>Qty</span>
                    <span>Unit</span>
                    <span>Unit Price</span>
                    <span>Amount</span>
                  </div>
                  {viewingInvoice.items?.map((item, index) => (
                    <div
                      className="document-item-row"
                      key={item.id || index}
                    >
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <span>
                        <strong>{item.item_name}</strong>
                        {item.description && (
                          <small>{item.description}</small>
                        )}
                      </span>
                      <span>{item.quantity}</span>
                      <span>{item.unit || "pcs"}</span>
                      <span>{formatCurrency(item.unit_price)}</span>
                      <span>{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                </div>

                <div className="document-bottom-grid">
                  <div>
                    <div className="document-payment">
                      <h4>PAYMENT INFORMATION</h4>
                      <p style={{ whiteSpace: "pre-line" }}>
                        {DEFAULT_PAYMENT_INFO}
                      </p>
                    </div>
                    <div className="document-terms">
                      <h4>TERMS & CONDITIONS</h4>
                      <p style={{ whiteSpace: "pre-line" }}>
                        {DEFAULT_TERMS}
                      </p>
                    </div>
                  </div>
                  <div className="document-totals">
                    <div>
                      <span>Materials Subtotal</span>
                      <strong>
                        {formatCurrency(viewingInvoice.subtotal)}
                      </strong>
                    </div>
                    {Number(viewingInvoice.labour_cost) > 0 && (
                      <div>
                        <span>Labour / Installation</span>
                        <strong>
                          {formatCurrency(viewingInvoice.labour_cost)}
                        </strong>
                      </div>
                    )}
                    {Number(viewingInvoice.transport_cost) > 0 && (
                      <div>
                        <span>
                          Transport
                          {viewingInvoice.transport_description && (
                            <small
                              style={{
                                display: "block",
                                fontWeight: 400,
                                color: "#98a2b3",
                              }}
                            >
                              {viewingInvoice.transport_description}
                            </small>
                          )}
                        </span>
                        <strong>
                          {formatCurrency(viewingInvoice.transport_cost)}
                        </strong>
                      </div>
                    )}
                    {Number(viewingInvoice.discount) > 0 && (
                      <div>
                        <span>Discount</span>
                        <strong>
                          -{formatCurrency(viewingInvoice.discount)}
                        </strong>
                      </div>
                    )}
                    {Number(viewingInvoice.tax_amount) > 0 && (
                      <div>
                        <span>Tax ({viewingInvoice.tax_rate}%)</span>
                        <strong>
                          {formatCurrency(viewingInvoice.tax_amount)}
                        </strong>
                      </div>
                    )}
                    <div className="document-grand-total">
                      <span>TOTAL DUE</span>
                      <strong>
                        {formatCurrency(viewingInvoice.total)}
                      </strong>
                    </div>
                    {Number(viewingInvoice.amount_paid) > 0 && (
                      <>
                        <div>
                          <span>Amount Paid</span>
                          <strong>
                            {formatCurrency(viewingInvoice.amount_paid)}
                          </strong>
                        </div>
                        <div className="document-balance">
                          <span>Balance</span>
                          <strong>
                            {formatCurrency(
                              Math.max(
                                0,
                                Number(viewingInvoice.total) -
                                  Number(viewingInvoice.amount_paid)
                              )
                            )}
                          </strong>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="document-footer">
                  THANK YOU FOR YOUR BUSINESS · WAMARA CONTRACTORS · POWERING EVERY PROJECT · BUILDING TRUST
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
                {viewingInvoice.status !== "Paid" && (
                  <button
                    className="modal-footer-button"
                    onClick={() => markAsPaid(viewingInvoice)}
                  >
                    <CheckCircle2 size={16} />
                    Mark Paid
                  </button>
                )}
                <button
                  className="modal-footer-button edit-modal-button"
                  onClick={() => {
                    setShowViewer(false);
                    openEditModal(viewingInvoice);
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
                  onClick={() => downloadPDF(viewingInvoice)}
                >
                  <Download size={16} />
                  Save PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  ChartNoAxesCombined,
  TrendingDown,
  Wallet,
} from "lucide-react";

import "../styles/ExpensesPage.css";

type Expense = {
  id?: number;
  description: string;
  category: string;
  amount: number;
  expense_date: string;
  project_id?: number | null;
  project_name?: string;
  paid_to: string;
  payment_method: string;
  notes: string;
  created_at?: string;
};

type Project = {
  id: number;
  name: string;
  client?: string;
};

const CATEGORIES = [
  "Transport",
  "Materials",
  "Labour",
  "Tools",
  "Fuel",
  "Utilities",
  "Office",
  "Meals",
  "Other",
];

function createEmptyExpense(): Expense {
  return {
    description: "",
    category: "Materials",
    amount: 0,
    expense_date: new Date().toISOString().slice(0, 10),
    project_id: null,
    project_name: "",
    paid_to: "",
    payment_method: "Cash",
    notes: "",
  };
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

function startOfWeek(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay(); // 0 Sun
  const diff = day === 0 ? 6 : day - 1; // Monday start
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);

  const [showEditor, setShowEditor] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState<Expense>(createEmptyExpense());
  const [isSaving, setIsSaving] = useState(false);

  async function loadData() {
    try {
      setIsLoading(true);

      if (!window.electronAPI?.expenses) {
        console.error("electronAPI.expenses not available");
        return;
      }

      const [expenseData, projectData] = await Promise.all([
        window.electronAPI.expenses.getAll(),
        window.electronAPI.projects?.getAll
          ? window.electronAPI.projects.getAll()
          : Promise.resolve([]),
      ]);

      setExpenses(Array.isArray(expenseData) ? expenseData : []);
      setProjects(Array.isArray(projectData) ? projectData : []);
    } catch (error) {
      console.error("Failed to load expenses:", error);
      alert("Failed to load expenses. Please restart the app.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredExpenses = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return expenses.filter((exp) => {
      const matchesSearch =
        !search ||
        exp.description?.toLowerCase().includes(search) ||
        exp.category?.toLowerCase().includes(search) ||
        exp.paid_to?.toLowerCase().includes(search) ||
        exp.project_name?.toLowerCase().includes(search);

      const matchesCategory =
        categoryFilter === "All" || exp.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchTerm, categoryFilter]);

  const stats = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);

    let total = 0;
    let thisWeek = 0;
    let thisMonth = 0;

    for (const exp of expenses) {
      const amount = Number(exp.amount) || 0;
      total += amount;

      if (!exp.expense_date) continue;
      const d = new Date(exp.expense_date);
      if (Number.isNaN(d.getTime())) continue;

      if (d >= monthStart) thisMonth += amount;
      if (d >= weekStart) thisWeek += amount;
    }

    return {
      count: expenses.length,
      total,
      thisWeek,
      thisMonth,
    };
  }, [expenses]);

  function openCreateModal() {
    setForm(createEmptyExpense());
    setEditingExpense(null);
    setShowEditor(true);
  }

  async function openEditModal(expense: Expense) {
    try {
      const full = await window.electronAPI.expenses.getById(expense.id!);
      if (!full) {
        alert("Could not load expense.");
        return;
      }
      setEditingExpense(full);
      setForm({
        ...full,
        project_id: full.project_id ?? null,
      });
      setShowEditor(true);
    } catch (error) {
      console.error(error);
      alert("Failed to open expense for editing.");
    }
  }

  function handleProjectSelect(projectId: string) {
    if (!projectId) {
      setForm((prev) => ({
        ...prev,
        project_id: null,
        project_name: "",
      }));
      return;
    }

    const project = projects.find((p) => p.id === Number(projectId));
    setForm((prev) => ({
      ...prev,
      project_id: Number(projectId),
      project_name: project?.name || "",
    }));
  }

  async function handleSave() {
    if (isSaving) return;

    if (!form.description.trim()) {
      alert("Please enter a description.");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    if (!form.expense_date) {
      alert("Please select a date.");
      return;
    }

    setIsSaving(true);

    try {
      const payload: Expense = {
        ...form,
        id: editingExpense?.id,
        amount: Number(form.amount) || 0,
        project_id: form.project_id || null,
      };

      if (editingExpense?.id) {
        await window.electronAPI.expenses.update(payload);
      } else {
        await window.electronAPI.expenses.create(payload);
      }

      await loadData();
      setShowEditor(false);
      setEditingExpense(null);
      setForm(createEmptyExpense());
    } catch (error: any) {
      console.error(error);
      alert(
        "Failed to save expense.\n\n" +
          (error?.message || "Check the console for details.")
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id?: number) {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    try {
      await window.electronAPI.expenses.delete(id);
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Failed to delete expense.");
    }
  }

  return (
    <div className="expenses-page">
      <div className="expenses-header">
        <div>
          <p className="page-eyebrow">FINANCE</p>
          <h1>Expenses</h1>
          <p className="page-description">
            Track business and project-related expenses.
          </p>
        </div>
        <button className="primary-button" onClick={openCreateModal}>
          <Plus size={18} />
          Add Expense
        </button>
      </div>

      <div className="expense-stats">
        <div className="expense-stat-card">
          <div className="expense-stat-icon month">
            <ChartNoAxesCombined size={22} />
          </div>
          <div>
            <span>This Month</span>
            <strong>{formatCurrency(stats.thisMonth)}</strong>
          </div>
        </div>
        <div className="expense-stat-card">
          <div className="expense-stat-icon week">
            <TrendingDown size={22} />
          </div>
          <div>
            <span>This Week</span>
            <strong>{formatCurrency(stats.thisWeek)}</strong>
          </div>
        </div>
        <div className="expense-stat-card">
          <div className="expense-stat-icon total">
            <Wallet size={22} />
          </div>
          <div>
            <span>All Time</span>
            <strong>{formatCurrency(stats.total)}</strong>
          </div>
        </div>
      </div>

      <div className="expenses-card">
        <div className="expenses-toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              placeholder="Search description, category, paid to..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <span className="expenses-count">
            {filteredExpenses.length} expense
            {filteredExpenses.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="expenses-table-wrapper">
          <table className="expenses-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th>Project</th>
                <th>Paid To</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="no-results">
                    Loading expenses...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="no-results">
                    No expenses found. Click “Add Expense” to record one.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>
                      <strong className="expense-description">
                        {expense.description}
                      </strong>
                      {expense.notes ? (
                        <small className="expense-notes-preview">
                          {expense.notes}
                        </small>
                      ) : null}
                    </td>
                    <td>
                      <span className="category-badge">{expense.category}</span>
                    </td>
                    <td>{expense.project_name || "—"}</td>
                    <td>{expense.paid_to || "—"}</td>
                    <td>{formatDate(expense.expense_date)}</td>
                    <td className="amount-cell">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="action-button"
                          title="Edit"
                          onClick={() => openEditModal(expense)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="action-button delete-action"
                          title="Delete"
                          onClick={() => handleDelete(expense.id)}
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

      {showEditor && (
        <div className="modal-overlay">
          <div className="expense-modal">
            <div className="modal-header">
              <div>
                <p className="page-eyebrow">
                  {editingExpense ? "EDIT EXPENSE" : "NEW EXPENSE"}
                </p>
                <h2>
                  {editingExpense ? "Edit Expense" : "Add Expense"}
                </h2>
              </div>
              <button
                className="close-button"
                onClick={() => setShowEditor(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="expense-form">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Description *</label>
                  <input
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="e.g. Transport to project site"
                  />
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Amount (UGX) *</label>
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
                </div>

                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={form.expense_date}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        expense_date: e.target.value,
                      }))
                    }
                  />
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
                  <label>Paid To</label>
                  <input
                    value={form.paid_to}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        paid_to: e.target.value,
                      }))
                    }
                    placeholder="Supplier / worker / vendor"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Link to Project (optional)</label>
                  <select
                    value={
                      form.project_id != null ? String(form.project_id) : ""
                    }
                    onChange={(e) => handleProjectSelect(e.target.value)}
                  >
                    <option value="">No project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={String(project.id)}>
                        {project.name}
                        {project.client ? ` — ${project.client}` : ""}
                      </option>
                    ))}
                  </select>
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
                    placeholder="Optional notes..."
                  />
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
                  {isSaving ? "Saving..." : "Save Expense"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

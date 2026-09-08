import { useEffect, useState } from "react";
import { Plus, Search, Users, X, Pencil, Trash2 } from "lucide-react";

import "../styles/ClientsPage.css";

type Client = {
  id: number;
  name: string;
  phone: string;
  email: string;
  location: string;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");

  async function loadClients() {
    try {
      setIsLoading(true);
      if (!window.electronAPI?.clients) {
        console.error("electronAPI.clients not available");
        return;
      }
      const data = await window.electronAPI.clients.getAll();
      setClients(data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load clients");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  function resetForm() {
    setName("");
    setPhone("");
    setEmail("");
    setLocation("");
    setEditingClient(null);
  }

  function openAddClientForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditClientForm(client: Client) {
    setEditingClient(client);
    setName(client.name);
    setPhone(client.phone || "");
    setEmail(client.email || "");
    setLocation(client.location || "");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    resetForm();
  }

  async function handleSaveClient(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || isSaving) return;

    setIsSaving(true);
    try {
      if (editingClient) {
        await window.electronAPI.clients.update({
          id: editingClient.id,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          location: location.trim(),
        });
      } else {
        await window.electronAPI.clients.create({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          location: location.trim(),
        });
      }
      await loadClients();
      closeForm();
    } catch (err: any) {
      console.error(err);
      alert("Failed to save client: " + (err?.message || "Unknown error"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteClient(id: number) {
    if (!window.confirm("Are you sure you want to delete this client?")) return;

    try {
      await window.electronAPI.clients.delete(id);
      await loadClients();
    } catch (err) {
      console.error(err);
      alert("Failed to delete client");
    }
  }

  return (
    <div className="clients-page">
      <div className="clients-header">
        <div className="clients-header-content">
          <div>
            <p className="page-eyebrow">VOLTDESK</p>
            <h1>Clients</h1>
            <p className="page-description">
              Manage the people and businesses you work with.
            </p>
          </div>
          <button className="primary-button add-client-button" onClick={openAddClientForm}>
            <Plus size={18} />
            Add Client
          </button>
        </div>
      </div>

      <div className="clients-stats">
        <div className="client-stat-card">
          <div className="stat-icon">
            <Users size={22} />
          </div>
          <div>
            <span>Total Clients</span>
            <strong>{clients.length}</strong>
          </div>
        </div>
      </div>

      <div className="clients-card">
        <div className="clients-toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="clients-count">
            {filteredClients.length} client{filteredClients.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="clients-table-wrapper">
          <table className="clients-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Location</th>
                <th className="actions-column">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5}>
                    <div className="no-results">Loading clients...</div>
                  </td>
                </tr>
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <div className="client-name">
                        <div className="client-avatar">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <strong>{client.name}</strong>
                      </div>
                    </td>
                    <td>{client.phone || "—"}</td>
                    <td>{client.email || "—"}</td>
                    <td>{client.location || "—"}</td>
                    <td>
                      <div className="client-actions">
                        <button
                          className="action-button edit-button"
                          onClick={() => openEditClientForm(client)}
                          title="Edit client"
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          className="action-button delete-button"
                          onClick={() => handleDeleteClient(client.id)}
                          title="Delete client"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>
                    <div className="no-results">No clients found.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="client-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="page-eyebrow">
                  {editingClient ? "EDIT CLIENT" : "NEW CLIENT"}
                </p>
                <h2>{editingClient ? "Edit Client" : "Add Client"}</h2>
              </div>
              <button className="close-button" onClick={closeForm} type="button">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveClient}>
              <div className="form-group">
                <label>Client Name *</label>
                <input
                  type="text"
                  placeholder="Enter client name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. 0700123456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="client@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  placeholder="e.g. Kampala"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={closeForm}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={isSaving}>
                  {isSaving ? "Saving..." : editingClient ? (
                    <>
                      <Pencil size={18} /> Update Client
                    </>
                  ) : (
                    <>
                      <Plus size={18} /> Save Client
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
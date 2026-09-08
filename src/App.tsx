import { useState } from "react";

import "./App.css";

import Sidebar from "./components/Sidebar";

import DashboardPage from "./pages/DashboardPage";
import ClientsPage from "./pages/ClientsPage";
import ProjectsPage from "./pages/ProjectsPage";
import QuotationsPage from "./pages/QuotationsPage";
import InvoicesPage from "./pages/InvoicesPage";
import ReceiptsPage from "./pages/ReceiptsPage";
import MaterialsPage from "./pages/MaterialsPage";
import ExpensesPage from "./pages/ExpensesPage";
import AIAssistantPage from "./pages/AIAssistantPage";
import SettingsPage from "./pages/SettingsPage";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  function renderPage() {
    switch (activePage) {
      case "Dashboard":
        return <DashboardPage onNavigate={setActivePage} />;
      case "Clients":
        return <ClientsPage />;
      case "Projects":
        return <ProjectsPage />;
      case "Quotations":
        return <QuotationsPage />;
      case "Invoices":
        return <InvoicesPage />;
      case "Receipts":
        return <ReceiptsPage />;
      case "Materials":
        return <MaterialsPage />;
      case "Expenses":
        return <ExpensesPage />;
      case "AI Assistant":
        return <AIAssistantPage />;
      case "Settings":
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={setActivePage} />;
    }
  }

  return (
    <div className="app-layout">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
      />

      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  ReceiptText,
  WalletCards,
  Package,
  ChartNoAxesCombined,
  Bot,
  Settings,
} from "lucide-react";

import voltdeskLogo from "../assets/branding/voltdesk-logo.png";
import "../styles/Sidebar.css";

type SidebarProps = {
  activePage: string;
  onNavigate: (page: string) => void;
};

function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const mainNavigation = [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Clients", icon: Users },
    { label: "Projects", icon: FolderKanban },
    { label: "Quotations", icon: FileText },
    { label: "Invoices", icon: ReceiptText },
    { label: "Receipts", icon: WalletCards },
    { label: "Materials", icon: Package },
    { label: "Expenses", icon: ChartNoAxesCombined },
  ];

  const bottomNavigation = [
    { label: "AI Assistant", icon: Bot },
    { label: "Settings", icon: Settings },
  ];

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="brand">
        <div className="brand-logo-wrapper">
          <img
            src={voltdeskLogo}
            alt="VoltDesk by Wamara Contractors"
            className="brand-logo"
          />
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        {mainNavigation.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              className={`nav-item ${
                activePage === item.label ? "active" : ""
              }`}
              onClick={() => onNavigate(item.label)}
            >
              <Icon size={17} strokeWidth={1.8} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="sidebar-bottom">
        {bottomNavigation.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              className={`nav-item ${
                activePage === item.label ? "active" : ""
              }`}
              onClick={() => onNavigate(item.label)}
            >
              <Icon size={17} strokeWidth={1.8} />
              <span>{item.label}</span>
            </button>
          );
        })}

        <div className="powered-by">
          <span>by Wamara Contractors</span>
          <strong>Powering every project · Building trust</strong>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
import { useLocation, useNavigate } from "react-router-dom";

interface HeaderProps {
  onMenuClick: () => void;
  theme: string;
  onThemeChange: (t: string) => void;
}

const PAGE_INFO: Record<string, { title: string; sub: string }> = {
  "/dashboard": { title: "Dashboard", sub: "Business overview" },
  "/products": { title: "Products", sub: "Manage your catalog" },
  "/customers": { title: "Customers", sub: "Shopkeeper directory" },
  "/invoices": { title: "Invoices", sub: "Sales records" },
  "/payments": { title: "Payments", sub: "Payment tracking" },
  "/ledger": { title: "Ledger", sub: "Customer receipt posting" },
  "/new-invoice": { title: "New Invoice", sub: "Create a sales invoice" },
};

function Header({ onMenuClick, theme, onThemeChange }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const info = location.pathname.startsWith("/ledger/")
    ? { title: "Ledger Detail", sub: "Customer ledger statement" }
    : (PAGE_INFO[location.pathname] ?? { title: "SRC Electric", sub: "" });

  return (
    <header
      className="flex items-center gap-[10px] px-[22px] sticky top-0 z-50 backdrop-blur-[10px]"
      style={{
        height: "var(--hh)",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-header)",
      }}
    >
      {/* Hamburger */}
      <button
        onClick={onMenuClick}
        className="p-[6px] rounded-lg transition-all md:hidden flex-shrink-0"
        style={{
          background: "none",
          border: "none",
          color: "var(--text-secondary)",
          cursor: "pointer",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Title */}
      <div>
        <div
          className="font-inter font-bold text-[17px]"
          style={{ color: "var(--text-primary)" }}
        >
          {info.title}
        </div>
        <div
          className="text-[11px] flex items-center gap-1"
          style={{ color: "var(--text-secondary)" }}
        >
          <span className="ldot" />
          {info.sub}
        </div>
      </div>

      <div className="flex-1" />

      {/* Theme Toggle */}
      <div
        className="flex items-center gap-[2px] p-[3px] rounded-[20px] flex-shrink-0"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <button
          onClick={() => onThemeChange("dark")}
          className="w-7 h-7 rounded-[16px] flex items-center justify-center text-[13px] border-none cursor-pointer transition-all"
          style={{
            background: theme === "dark" ? "#e8141c" : "none",
            color: theme === "dark" ? "#fff" : "var(--text-secondary)",
            boxShadow:
              theme === "dark" ? "0 2px 8px rgba(232,20,28,.4)" : "none",
          }}
        >
          🌙
        </button>
        <button
          onClick={() => onThemeChange("light")}
          className="w-7 h-7 rounded-[16px] flex items-center justify-center text-[13px] border-none cursor-pointer transition-all"
          style={{
            background: theme === "light" ? "#e8141c" : "none",
            color: theme === "light" ? "#fff" : "var(--text-secondary)",
            boxShadow:
              theme === "light" ? "0 2px 8px rgba(232,20,28,.4)" : "none",
          }}
        >
          ☀️
        </button>
      </div>

      {/* New Invoice Button */}
      <button
        onClick={() => navigate("/new-invoice")}
        className="btn btn-primary"
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span className="hidden sm:inline">New Invoice</span>
      </button>
    </header>
  );
}

export default Header;

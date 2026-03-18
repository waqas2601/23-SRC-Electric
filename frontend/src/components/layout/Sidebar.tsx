import { useCallback, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getInvoicesAPI } from "../../api/invoices";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [invoiceNotificationCount, setInvoiceNotificationCount] =
    useState<number>(0);

  const fetchInvoiceNotificationCount = useCallback(async () => {
    if (!token) {
      setInvoiceNotificationCount(0);
      return;
    }

    try {
      const [unpaid, partial] = await Promise.all([
        getInvoicesAPI(token, { status: "unpaid", page: 1, limit: 1 }),
        getInvoicesAPI(token, { status: "partial", page: 1, limit: 1 }),
      ]);

      const unpaidTotal = unpaid?.pagination?.total ?? 0;
      const partialTotal = partial?.pagination?.total ?? 0;
      setInvoiceNotificationCount(unpaidTotal + partialTotal);
    } catch {
      setInvoiceNotificationCount(0);
    }
  }, [token]);

  useEffect(() => {
    fetchInvoiceNotificationCount();
  }, [fetchInvoiceNotificationCount]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-[100] flex flex-col transition-transform duration-[280ms] ${
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
      style={{
        width: "240px",
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border)",
        boxSizing: "border-box",
      }}
      id="sidebar"
    >
      <div
        className="flex items-center gap-3 p-[12px_18px_12px]"
        style={{
          borderBottom: "1px solid var(--border)",
          boxSizing: "border-box",
        }}
      >
        <img
          src="/logo.png"
          alt="SRC Electric"
          className="h-[36px] w-auto object-contain"
        />
        <button
          onClick={onClose}
          className="ml-auto text-lg leading-none p-1 rounded-md md:hidden"
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-[14px_10px] overflow-y-auto">
        <div
          className="text-[9px] uppercase tracking-[.15em] px-2 mt-[14px] mb-[5px] font-inter font-semibold"
          style={{ color: "var(--text-muted)" }}
        >
          Overview
        </div>

        <NavLink
          to="/dashboard"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-[10px] px-[11px] py-[9px] rounded-lg cursor-pointer text-[13px] mb-[2px] transition-all duration-[180ms] border relative no-underline ${isActive ? "nav-active" : "nav-inactive"}`
          }
          style={({ isActive }) => ({
            background: isActive ? "var(--electric-glow)" : "transparent",
            color: isActive
              ? "var(--electric-bright)"
              : "var(--text-secondary)",
            borderColor: isActive ? "rgba(26,110,255,.3)" : "transparent",
          })}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r-sm"
                  style={{ background: "#e8141c" }}
                />
              )}
              <svg
                className="w-4 h-4 opacity-80 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              Dashboard
            </>
          )}
        </NavLink>

        <div
          className="text-[9px] uppercase tracking-[.15em] px-2 mt-[14px] mb-[5px] font-inter font-semibold"
          style={{ color: "var(--text-muted)" }}
        >
          Management
        </div>

        <NavLink
          to="/products"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-[10px] px-[11px] py-[9px] rounded-lg cursor-pointer text-[13px] mb-[2px] transition-all duration-[180ms] border relative no-underline ${isActive ? "nav-active" : "nav-inactive"}`
          }
          style={({ isActive }) => ({
            background: isActive ? "var(--electric-glow)" : "transparent",
            color: isActive
              ? "var(--electric-bright)"
              : "var(--text-secondary)",
            borderColor: isActive ? "rgba(26,110,255,.3)" : "transparent",
          })}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r-sm"
                  style={{ background: "#e8141c" }}
                />
              )}
              <svg
                className="w-4 h-4 opacity-80 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
              Products
            </>
          )}
        </NavLink>

        <NavLink
          to="/models"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-[10px] px-[11px] py-[9px] rounded-lg cursor-pointer text-[13px] mb-[2px] transition-all duration-[180ms] border relative no-underline ${isActive ? "nav-active" : "nav-inactive"}`
          }
          style={({ isActive }) => ({
            background: isActive ? "var(--electric-glow)" : "transparent",
            color: isActive
              ? "var(--electric-bright)"
              : "var(--text-secondary)",
            borderColor: isActive ? "rgba(26,110,255,.3)" : "transparent",
          })}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r-sm"
                  style={{ background: "#e8141c" }}
                />
              )}
              <svg
                className="w-4 h-4 opacity-80 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
              Models
            </>
          )}
        </NavLink>

        <NavLink
          to="/customers"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-[10px] px-[11px] py-[9px] rounded-lg cursor-pointer text-[13px] mb-[2px] transition-all duration-[180ms] border relative no-underline ${isActive ? "nav-active" : "nav-inactive"}`
          }
          style={({ isActive }) => ({
            background: isActive ? "var(--electric-glow)" : "transparent",
            color: isActive
              ? "var(--electric-bright)"
              : "var(--text-secondary)",
            borderColor: isActive ? "rgba(26,110,255,.3)" : "transparent",
          })}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r-sm"
                  style={{ background: "#e8141c" }}
                />
              )}
              <svg
                className="w-4 h-4 opacity-80 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Customers
            </>
          )}
        </NavLink>

        <div
          className="text-[9px] uppercase tracking-[.15em] px-2 mt-[14px] mb-[5px] font-inter font-semibold"
          style={{ color: "var(--text-muted)" }}
        >
          Transactions
        </div>

        <NavLink
          to="/invoices"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-[10px] px-[11px] py-[9px] rounded-lg cursor-pointer text-[13px] mb-[2px] transition-all duration-[180ms] border relative no-underline ${isActive ? "nav-active" : "nav-inactive"}`
          }
          style={({ isActive }) => ({
            background: isActive ? "var(--electric-glow)" : "transparent",
            color: isActive
              ? "var(--electric-bright)"
              : "var(--text-secondary)",
            borderColor: isActive ? "rgba(26,110,255,.3)" : "transparent",
          })}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r-sm"
                  style={{ background: "#e8141c" }}
                />
              )}
              <svg
                className="w-4 h-4 opacity-80 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              Invoices
              {invoiceNotificationCount > 0 && (
                <span
                  className="ml-auto font-inter font-bold text-[9px] px-[6px] py-[1px] rounded-[20px]"
                  style={{ background: "#ff4d6a", color: "#fff" }}
                >
                  {invoiceNotificationCount}
                </span>
              )}
            </>
          )}
        </NavLink>

        <NavLink
          to="/payments"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-[10px] px-[11px] py-[9px] rounded-lg cursor-pointer text-[13px] mb-[2px] transition-all duration-[180ms] border relative no-underline ${isActive ? "nav-active" : "nav-inactive"}`
          }
          style={({ isActive }) => ({
            background: isActive ? "var(--electric-glow)" : "transparent",
            color: isActive
              ? "var(--electric-bright)"
              : "var(--text-secondary)",
            borderColor: isActive ? "rgba(26,110,255,.3)" : "transparent",
          })}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r-sm"
                  style={{ background: "#e8141c" }}
                />
              )}
              <svg
                className="w-4 h-4 opacity-80 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="1" y="4" width="22" height="16" rx="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              Payments
            </>
          )}
        </NavLink>

        <NavLink
          to="/ledger"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-[10px] px-[11px] py-[9px] rounded-lg cursor-pointer text-[13px] mb-[2px] transition-all duration-[180ms] border relative no-underline ${isActive ? "nav-active" : "nav-inactive"}`
          }
          style={({ isActive }) => ({
            background: isActive ? "var(--electric-glow)" : "transparent",
            color: isActive
              ? "var(--electric-bright)"
              : "var(--text-secondary)",
            borderColor: isActive ? "rgba(26,110,255,.3)" : "transparent",
          })}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r-sm"
                  style={{ background: "#e8141c" }}
                />
              )}
              <svg
                className="w-4 h-4 opacity-80 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 5h18" />
                <path d="M3 12h18" />
                <path d="M3 19h18" />
              </svg>
              Ledger
            </>
          )}
        </NavLink>

        <NavLink
          to="/new-invoice"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-[10px] px-[11px] py-[9px] rounded-lg cursor-pointer text-[13px] mb-[2px] transition-all duration-[180ms] border relative no-underline ${isActive ? "nav-active" : "nav-inactive"}`
          }
          style={({ isActive }) => ({
            background: isActive ? "var(--electric-glow)" : "transparent",
            color: isActive
              ? "var(--electric-bright)"
              : "var(--text-secondary)",
            borderColor: isActive ? "rgba(26,110,255,.3)" : "transparent",
          })}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r-sm"
                  style={{ background: "#e8141c" }}
                />
              )}
              <svg
                className="w-4 h-4 opacity-80 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              New Invoice
            </>
          )}
        </NavLink>
      </nav>

      {/* Footer */}
      <div
        className="p-[10px]"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div
          className="flex items-center gap-[10px] px-[10px] py-[8px] rounded-lg"
          style={{ background: "var(--electric-glow)" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-inter font-extrabold text-[12px] text-white"
            style={{
              background: "linear-gradient(135deg,var(--electric),#e8141c)",
            }}
          >
            {user?.name?.charAt(0).toUpperCase() ?? "A"}
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="text-[12px] font-medium truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {user?.name ?? "Admin"}
            </div>
            <div
              className="text-[10px]"
              style={{ color: "var(--text-secondary)" }}
            >
              {user?.role ?? "Administrator"}
            </div>
          </div>
          <button
            onClick={logout}
            className="p-[5px] rounded-lg flex-shrink-0 transition-all"
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
            title="Logout"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;

import { NavLink } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-[100] flex flex-col transition-transform duration-[280ms] ${
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
      style={{
        width: "240px",
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border)",
      }}
      id="sidebar"
    >
      {/* Brand */}
      <div
        className="flex items-center gap-3 p-[18px_18px_14px]"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: "linear-gradient(135deg,#2535c8,#e8141c)",
            boxShadow: "0 0 18px rgba(232,20,28,.35)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" />
          </svg>
        </div>
        <div>
          <div
            className="font-inter font-extrabold text-[13px]"
            style={{ color: "var(--text-primary)" }}
          >
            SRC
          </div>
          <div
            className="text-[9px] uppercase tracking-widest mt-[2px]"
            style={{ color: "var(--text-secondary)" }}
          >
            Switch &amp; Socket
          </div>
        </div>
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
              <span
                className="ml-auto font-inter font-bold text-[9px] px-[6px] py-[1px] rounded-[20px]"
                style={{ background: "#ff4d6a", color: "#fff" }}
              >
                3
              </span>
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
            SA
          </div>
          <div>
            <div
              className="text-[12px] font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              SRC Admin
            </div>
            <div
              className="text-[10px]"
              style={{ color: "var(--text-secondary)" }}
            >
              Administrator
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;

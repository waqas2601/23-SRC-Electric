import { NavLink } from "react-router-dom";

function MobileNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[80] md:hidden"
      style={{
        background: "var(--bg-sidebar)",
        borderTop: "1px solid var(--border)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-[3px] py-[7px] px-1 border-none cursor-pointer font-inter text-[9px] font-semibold transition-colors no-underline ${isActive ? "text-[#e8141c]" : ""}`
          }
          style={({ isActive }) => ({
            color: isActive ? "#e8141c" : "var(--text-muted)",
            background: "none",
          })}
        >
          <svg
            width="20"
            height="20"
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
          Home
        </NavLink>

        <NavLink
          to="/invoices"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-[3px] py-[7px] px-1 border-none cursor-pointer font-inter text-[9px] font-semibold transition-colors no-underline relative`
          }
          style={({ isActive }) => ({
            color: isActive ? "#e8141c" : "var(--text-muted)",
            background: "none",
          })}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span
            className="absolute top-[3px] font-inter font-bold text-[8px] flex items-center justify-center"
            style={{
              right: "calc(50% - 15px)",
              background: "#ff4d6a",
              color: "#fff",
              width: "14px",
              height: "14px",
              borderRadius: "50%",
            }}
          >
            3
          </span>
          Invoices
        </NavLink>

        <NavLink
          to="/new-invoice"
          className="flex-1 flex flex-col items-center gap-[3px] py-[7px] px-1 border-none cursor-pointer font-inter text-[9px] font-semibold no-underline"
          style={{ color: "#e8141c", background: "none" }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          New
        </NavLink>

        <NavLink
          to="/customers"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-[3px] py-[7px] px-1 border-none cursor-pointer font-inter text-[9px] font-semibold transition-colors no-underline`
          }
          style={({ isActive }) => ({
            color: isActive ? "#e8141c" : "var(--text-muted)",
            background: "none",
          })}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
          Customers
        </NavLink>

        <NavLink
          to="/payments"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-[3px] py-[7px] px-1 border-none cursor-pointer font-inter text-[9px] font-semibold transition-colors no-underline`
          }
          style={({ isActive }) => ({
            color: isActive ? "#e8141c" : "var(--text-muted)",
            background: "none",
          })}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="1" y="4" width="22" height="16" rx="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
          Payments
        </NavLink>
      </div>
    </nav>
  );
}

export default MobileNav;

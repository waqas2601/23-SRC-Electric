import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import Avatar from "../components/ui/Avatar";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  return (
    <div style={{ animation: "fadeIn .2s ease" }}>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-[18px] flex-wrap gap-[10px]">
        <div>
          <div
            className="font-inter font-extrabold text-[20px]"
            style={{ color: "var(--text-primary)" }}
          >
            Good morning,{" "}
            <span style={{ color: "var(--electric)" }}>SRC Admin</span>
          </div>
          <div
            className="text-[12px] mt-[3px]"
            style={{ color: "var(--text-secondary)" }}
          >
            Here's your business overview for today.
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-[13px] mb-[22px]">
        {" "}
        <StatCard
          label="Total Receivable"
          value="PKR 1,24,500"
          change="12 unpaid invoices"
          changeType="down"
          accentColor="#1a6eff"
          icon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1a6eff"
              strokeWidth="2"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
        <StatCard
          label="Collected (Feb)"
          value="PKR 78,200"
          change="↑ 18% vs last month"
          changeType="up"
          accentColor="#00c97a"
          icon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#00c97a"
              strokeWidth="2"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
        />
        <StatCard
          label="Partial Payments"
          value="8"
          change="invoices pending"
          changeType="neutral"
          accentColor="#ffb020"
          icon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffb020"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <StatCard
          label="Overdue"
          value="PKR 31,000"
          change="3 customers"
          changeType="down"
          accentColor="#ff4d6a"
          icon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ff4d6a"
              strokeWidth="2"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
            </svg>
          }
        />
      </div>

      {/* Two Col */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-[16px]">
        {" "}
        {/* Outstanding Balances */}
        <div className="card">
          <div className="card-hdr">
            <div
              className="card-title"
              style={{ color: "var(--text-primary)" }}
            >
              Outstanding Balances
            </div>
            <button
              className="btn btn-ghost"
              style={{ padding: "5px 11px", fontSize: "11px" }}
            >
              View All
            </button>
          </div>

          {[
            {
              initials: "AE",
              gradient: "default",
              name: "Ahmad Electronics",
              shop: "Main Bazaar, Gujrat",
              amount: "PKR 18,500",
              type: "ov",
              bar: 75,
            },
            {
              initials: "ZT",
              gradient: "cyan",
              name: "Zahid Traders",
              shop: "Saddar, Gujrat",
              amount: "PKR 8,200",
              type: "pa",
              bar: 40,
            },
            {
              initials: "RS",
              gradient: "green",
              name: "Raza Stores",
              shop: "Civil Lines, Gujrat",
              amount: "PKR 12,300",
              type: "ov",
              bar: 60,
            },
            {
              initials: "MK",
              gradient: "purple",
              name: "M. Khan & Sons",
              shop: "Kharian Road",
              amount: "PKR 5,000",
              type: "pa",
              bar: 25,
            },
          ].map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-[11px] px-[17px] py-[12px]"
              style={{ borderBottom: "1px solid rgba(26,110,255,.07)" }}
            >
              <Avatar initials={item.initials} gradient={item.gradient} />
              <div>
                <div
                  className="text-[13px] font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {item.name}
                </div>
                <div
                  className="text-[10px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {item.shop}
                </div>
              </div>
              <div className="ml-auto text-right">
                <div
                  className="font-inter font-bold text-[14px]"
                  style={{ color: item.type === "ov" ? "#ff4d6a" : "#ffb020" }}
                >
                  {item.amount}
                </div>
                <div
                  className="w-[65px] h-[3px] rounded-sm mt-[3px]"
                  style={{ background: "rgba(128,128,128,.15)" }}
                >
                  <div
                    className="h-[3px] rounded-sm"
                    style={{
                      width: `${item.bar}%`,
                      background: item.type === "ov" ? "#ff4d6a" : "#ffb020",
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Recent Invoices */}
        <div className="card">
          <div className="card-hdr">
            <div
              className="card-title"
              style={{ color: "var(--text-primary)" }}
            >
              Recent Invoices
            </div>
            <button
              className="btn btn-ghost"
              style={{ padding: "5px 11px", fontSize: "11px" }}
              onClick={() => navigate("/invoices")}
            >
              View All
            </button>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    inv: "#INV-0042",
                    customer: "Ahmad Electronics",
                    amount: "PKR 22,000",
                    status: "unpaid" as const,
                  },
                  {
                    inv: "#INV-0041",
                    customer: "Zahid Traders",
                    amount: "PKR 11,500",
                    status: "partial" as const,
                  },
                  {
                    inv: "#INV-0040",
                    customer: "Raza Stores",
                    amount: "PKR 8,800",
                    status: "paid" as const,
                  },
                  {
                    inv: "#INV-0039",
                    customer: "M. Khan",
                    amount: "PKR 15,200",
                    status: "partial" as const,
                  },
                ].map((row) => (
                  <tr key={row.inv}>
                    <td style={{ color: "var(--electric-bright)" }}>
                      {row.inv}
                    </td>
                    <td>{row.customer}</td>
                    <td>{row.amount}</td>
                    <td>
                      <Badge status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

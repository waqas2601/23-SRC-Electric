import { useState, useEffect, useCallback } from "react";
import Badge from "../components/ui/Badge";
import Avatar from "../components/ui/Avatar";
import CustomerModal from "../components/ui/CustomerModal";
import { useAuth } from "../context/AuthContext";
import {
  getCustomersAPI,
  updateCustomerAPI,
  type Customer,
} from "../api/customers";
import { useToast } from "../context/ToastContext";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const GRADIENTS = ["default", "cyan", "green", "purple", "red"];

function getGradient(index: number) {
  return GRADIENTS[index % GRADIENTS.length];
}

function Customers() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCustomers = useCallback(async () => {
    if (!token) {
      setCustomers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const all: typeof customers = [];
      let page = 1, totalPages = 1;
      while (page <= totalPages) {
        const data = await getCustomersAPI(token, { q: search || undefined, page, limit: 100 });
        all.push(...(data.items ?? []));
        totalPages = data.pagination?.totalPages ?? 1;
        page += 1;
      }
      setCustomers(all);
    } catch (err: any) {
      const message = err.message || "Failed to load customers";
      setError(message);
      showToast("error", message);
    } finally {
      setIsLoading(false);
    }
  }, [token, search, showToast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleEdit = (customer: Customer) => {
    setEditCustomer(customer);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId || !token) return;
    setDeleteLoading(true);
    try {
      await updateCustomerAPI(token, deleteId, { is_active: false });
      setDeleteId(null);
      await fetchCustomers();
      showToast("success", "Customer deactivated successfully");
    } catch (err: any) {
      showToast("error", err.message || "Failed to deactivate customer");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditCustomer(null);
  };

  return (
    <div style={{ animation: "fadeIn .2s ease" }}>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-[18px] flex-wrap gap-[10px]">
        <div
          className="font-inter font-extrabold text-[20px]"
          style={{ color: "var(--text-primary)" }}
        >
          Customers <span style={{ color: "var(--electric)" }}>Directory</span>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditCustomer(null);
            setModalOpen(true);
          }}
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
          <span className="hidden sm:inline">Add Customer</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-[16px]">
        <div className="s-box" style={{ maxWidth: "320px" }}>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ color: "var(--text-muted)", flexShrink: 0 }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, address or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="p-[10px_13px] rounded-lg mb-[16px] text-[12px] font-inter"
          style={{
            background: "rgba(255,77,106,.1)",
            border: "1px solid rgba(255,77,106,.2)",
            color: "#ff4d6a",
          }}
        >
          {error}
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl tbl-customers">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Notes</th>
                {/* Status column removed */}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                        style={{
                          borderColor: "#e8141c",
                          borderTopColor: "transparent",
                        }}
                      />
                      <span style={{ color: "var(--text-muted)" }}>
                        Loading...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-8"
                    style={{ color: "var(--text-muted)" }}
                  >
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map((c, index) => (
                  <tr key={c._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar
                          initials={getInitials(c.name)}
                          gradient={getGradient(index)}
                        />
                        <div>
                          <div
                            className="font-medium text-[13px] truncate max-w-[140px] sm:max-w-[220px]"
                            style={{ color: "var(--text-primary)" }}
                            title={c.name}
                          >
                            {c.name}
                          </div>
                          <div
                            className="text-[10px] truncate max-w-[140px] sm:max-w-[220px]"
                            style={{ color: "var(--text-secondary)" }}
                            title={c.shop_name ?? ""}
                          >
                            {c.shop_name ?? "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      <div
                        className="truncate max-w-[130px]"
                        title={c.phone ?? ""}
                      >
                        {c.phone ?? "—"}
                      </div>
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      <div
                        className="truncate max-w-[150px] sm:max-w-[220px]"
                        title={c.address ?? ""}
                      >
                        {c.address ?? "—"}
                      </div>
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      <div
                        className="truncate max-w-[150px] sm:max-w-[220px]"
                        title={c.notes ?? ""}
                      >
                        {c.notes ?? "—"}
                      </div>
                    </td>
                    {/* Status cell removed */}
                    <td>
                      <div className="flex items-center gap-[6px] whitespace-nowrap">
                        <button
                          className="btn btn-ghost"
                          style={{ padding: "4px 10px", fontSize: "11px" }}
                          onClick={() => handleEdit(c)}
                        >
                          Edit
                        </button>
                        <button
                          style={{
                            padding: "4px 10px",
                            fontSize: "11px",
                            background: "rgba(255,77,106,.1)",
                            border: "1px solid rgba(255,77,106,.2)",
                            color: "#ff4d6a",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontFamily: "Inter",
                            fontWeight: 600,
                          }}
                          onClick={() => setDeleteId(c._id)}
                        >
                          Delete
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

      {/* Delete Confirmation */}
      {deleteId && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setDeleteId(null)}
        >
          <div
            className="w-full max-w-[380px] rounded-xl overflow-hidden"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
              animation: "fadeIn .2s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center p-[28px_24px_20px]">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                style={{
                  background: "rgba(255,77,106,.1)",
                  border: "1px solid rgba(255,77,106,.2)",
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ff4d6a"
                  strokeWidth="2"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </div>
              <div
                className="font-inter font-bold text-[16px] mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Deactivate Customer?
              </div>
              <div
                className="text-[13px]"
                style={{ color: "var(--text-secondary)" }}
              >
                {customers.find((c) => c._id === deleteId)?.name ?? "This customer"} will be deactivated and hidden from active lists.
              </div>
            </div>
            <div className="flex gap-[9px] p-[0_24px_24px]">
              <button
                className="btn btn-ghost flex-1 justify-center"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary flex-1 justify-center"
                onClick={handleDelete}
                disabled={deleteLoading}
                style={{
                  background: "#ff4d6a",
                  boxShadow: "0 4px 18px rgba(255,77,106,.3)",
                  opacity: deleteLoading ? 0.7 : 1,
                }}
              >
                {deleteLoading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Deactivating...
                  </>
                ) : (
                  "Yes, Deactivate"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <CustomerModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        onSuccess={fetchCustomers}
        customer={editCustomer}
      />
    </div>
  );
}

export default Customers;

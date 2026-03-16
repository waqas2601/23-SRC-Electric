import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCustomersAPI, type Customer } from "../api/customers";
import { getInvoicesAPI } from "../api/invoices";

interface InvoiceListItem {
  _id: string;
  customer_id:
    | {
        _id: string;
      }
    | string;
}

function customerIdOf(invoice: InvoiceListItem): string {
  return typeof invoice.customer_id === "string"
    ? invoice.customer_id
    : invoice.customer_id?._id;
}

function Ledger() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    if (!token) {
      setError("Session expired. Please login again.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const allCustomers: Customer[] = [];
      const allInvoices: InvoiceListItem[] = [];

      let cPage = 1;
      let cTotalPages = 1;
      while (cPage <= cTotalPages) {
        const data = await getCustomersAPI(token, { page: cPage, limit: 100 });
        allCustomers.push(...(data.items ?? []));
        cTotalPages = data.pagination?.totalPages ?? 1;
        cPage += 1;
      }

      let iPage = 1;
      let iTotalPages = 1;
      while (iPage <= iTotalPages) {
        const data = await getInvoicesAPI(token, { page: iPage, limit: 100 });
        allInvoices.push(...((data.items ?? []) as InvoiceListItem[]));
        iTotalPages = data.pagination?.totalPages ?? 1;
        iPage += 1;
      }

      setCustomers(allCustomers);
      setInvoices(allInvoices);
    } catch (err: any) {
      setError(err.message || "Failed to load ledger customers");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const ledgerCustomers = useMemo(() => {
    const invoiceCustomerIds = new Set(
      invoices.map(customerIdOf).filter(Boolean),
    );
    return customers.filter((c) => invoiceCustomerIds.has(c._id));
  }, [customers, invoices]);

  const filteredCustomers = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return ledgerCustomers;
    return ledgerCustomers.filter((c) => {
      const name = c.name?.toLowerCase() ?? "";
      const shop = c.shop_name?.toLowerCase() ?? "";
      return name.includes(q) || shop.includes(q);
    });
  }, [ledgerCustomers, searchText]);

  return (
    <div style={{ animation: "fadeIn .2s ease" }}>
      <div className="flex items-center justify-between mb-[16px] flex-wrap gap-[10px]">
        <div
          className="font-inter font-extrabold text-[20px]"
          style={{ color: "var(--text-primary)" }}
        >
          Customer <span style={{ color: "var(--electric)" }}>Ledger</span>
        </div>
        <input
          className="fi"
          style={{ maxWidth: 280 }}
          placeholder="Search customer..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {error && (
        <div
          className="p-[10px_13px] rounded-lg mb-[14px] text-[12px] font-inter"
          style={{
            background: "rgba(255,77,106,.1)",
            border: "1px solid rgba(255,77,106,.2)",
            color: "#ff4d6a",
          }}
        >
          {error}
        </div>
      )}

      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Customer Name</th>
                <th>DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={3}
                    className="text-center py-8"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="text-center py-8"
                    style={{ color: "var(--text-muted)" }}
                  >
                    No ledger customers found
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c, idx) => (
                  <tr key={c._id}>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {idx + 1}
                    </td>
                    <td>
                      <div className="font-medium text-[13px]">{c.name}</div>
                      <div
                        className="text-[11px]"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {c.shop_name || "—"}
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost"
                        style={{ height: 30, padding: "0 12px", fontSize: 11 }}
                        onClick={() => navigate(`/ledger/view/${c._id}`)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Ledger;

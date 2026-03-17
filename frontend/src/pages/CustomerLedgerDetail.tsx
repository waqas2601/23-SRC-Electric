import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  getCustomerByIdAPI,
  setCustomerOpeningBalanceAPI,
  type Customer,
} from "../api/customers";
import { getInvoicesAPI } from "../api/invoices";
import {
  createCustomerLedgerPaymentAPI,
  getCustomerLedgerPaymentsAPI,
  type LedgerPayment,
} from "../api/ledgerPayments";
import LedgerPaymentModal from "../components/ui/LedgerPaymentModal";
import Modal from "../components/ui/Modal";
import { downloadLedgerPdf } from "../utils/ledgerPdf";

interface InvoiceListItem {
  _id: string;
  invoice_no: string;
  invoice_date: string;
  total_amount: number;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function CustomerLedgerDetail() {
  const { customerId = "" } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { showToast } = useToast();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [payments, setPayments] = useState<LedgerPayment[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [recordOpen, setRecordOpen] = useState(false);
  const [recordLoading, setRecordLoading] = useState(false);

  const [openingBalanceOpen, setOpeningBalanceOpen] = useState(false);
  const [openingBalanceInput, setOpeningBalanceInput] = useState("");
  const [openingBalanceLoading, setOpeningBalanceLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!token || !customerId) {
      setError("Session expired. Please login again.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const [customerData, paymentData] = await Promise.all([
        getCustomerByIdAPI(token, customerId),
        getCustomerLedgerPaymentsAPI(token, customerId),
      ]);

      const allInvoices: InvoiceListItem[] = [];
      let page = 1;
      let totalPages = 1;
      while (page <= totalPages) {
        const data = await getInvoicesAPI(token, {
          customerId,
          page,
          limit: 100,
        });
        allInvoices.push(...((data.items ?? []) as InvoiceListItem[]));
        totalPages = data.pagination?.totalPages ?? 1;
        page += 1;
      }

      setCustomer(customerData as Customer);
      setInvoices(allInvoices);
      setPayments(paymentData ?? []);
    } catch (err: any) {
      setError(err.message || "Failed to load customer ledger");
    } finally {
      setIsLoading(false);
    }
  }, [token, customerId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const totals = useMemo(() => {
    const opening = customer?.opening_balance ?? 0;
    const totalInvoiced = invoices.reduce(
      (s, i) => s + (i.total_amount ?? 0),
      0,
    );
    const totalPaid = payments.reduce((s, p) => s + (p.amount ?? 0), 0);
    const totalOutstanding = opening + totalInvoiced;
    const remaining = Math.max(0, totalOutstanding - totalPaid);
    return {
      opening,
      totalInvoiced,
      totalPaid,
      totalOutstanding,
      remaining,
    };
  }, [customer, invoices, payments]);

  const ledgerRows = useMemo(() => {
    const txns: Array<{
      id: string;
      date?: string;
      description: string;
      debit: number;
      credit: number;
      type: "opening" | "invoice" | "payment";
      paymentId?: string;
    }> = [];

    txns.push({
      id: "opening-balance",
      date: undefined,
      description: "Opening Balance",
      debit: 0,
      credit: customer?.opening_balance ?? 0,
      type: "opening",
    });

    invoices.forEach((inv) => {
      txns.push({
        id: `inv-${inv._id}`,
        date: inv.invoice_date,
        description: `Inv #${inv.invoice_no}`,
        debit: 0,
        credit: inv.total_amount ?? 0,
        type: "invoice",
      });
    });

    payments.forEach((p) => {
      txns.push({
        id: `pay-${p._id}`,
        date: p.payment_date,
        description: `Payment (${p.method})`,
        debit: p.amount ?? 0,
        credit: 0,
        type: "payment",
        paymentId: p._id,
      });
    });

    txns.sort((a, b) => {
      if (a.type === "opening" && b.type !== "opening") return -1;
      if (b.type === "opening" && a.type !== "opening") return 1;

      const ta = new Date(a.date ?? 0).getTime();
      const tb = new Date(b.date ?? 0).getTime();
      if (ta !== tb) return ta - tb;
      if (a.type === b.type) return 0;
      return a.type === "invoice" ? -1 : 1;
    });

    let running = 0;
    return txns.map((t) => {
      running += t.credit - t.debit;
      return { ...t, balance: running };
    });
  }, [invoices, payments, customer]);

  const handleRecordPayment = async (payload: {
    customerId: string;
    amount: number;
    method: "CASH" | "BANK" | "OTHER";
    notes?: string;
  }) => {
    if (!token || !customerId) return;
    setRecordLoading(true);
    try {
      await createCustomerLedgerPaymentAPI(token, customerId, {
        amount: payload.amount,
        method: payload.method,
        notes: payload.notes,
      });
      setRecordOpen(false);
      await fetchDetail();
      showToast("success", "Payment recorded");
    } catch (err: any) {
      showToast("error", err.message || "Failed to record payment");
    } finally {
      setRecordLoading(false);
    }
  };

  const handleSetOpeningBalance = async () => {
    if (!token || !customer) return;
    const value = Number(openingBalanceInput);
    if (!Number.isFinite(value) || value < 0) {
      showToast("error", "Please enter valid opening balance");
      return;
    }

    setOpeningBalanceLoading(true);
    try {
      await setCustomerOpeningBalanceAPI(token, customer._id, value);
      setOpeningBalanceOpen(false);
      setOpeningBalanceInput("");
      await fetchDetail();
      showToast("success", "Opening balance set");
    } catch (err: any) {
      showToast("error", err.message || "Failed to set opening balance");
    } finally {
      setOpeningBalanceLoading(false);
    }
  };

  return (
    <div style={{ animation: "fadeIn .2s ease" }}>
      <div className="flex items-center justify-between mb-[14px] flex-wrap gap-[8px]">
        <button className="btn btn-ghost" onClick={() => navigate("/ledger")}>
          ← Back to Ledger
        </button>
        <div className="flex gap-[8px]">
          <button
            className="btn btn-ghost"
            disabled={isPrinting || isLoading || ledgerRows.length === 0}
            onClick={async () => {
              if (!customer) return;
              setIsPrinting(true);
              try {
                await downloadLedgerPdf({
                  customerName: customer.name,
                  shopName: customer.shop_name,
                  phone: customer.phone,
                  rows: ledgerRows,
                  totals,
                });
              } finally {
                setIsPrinting(false);
              }
            }}
          >
            {isPrinting ? "Preparing..." : "Print PDF"}
          </button>
          <button className="btn btn-primary" onClick={() => setRecordOpen(true)}>
            Record Payment
          </button>
        </div>
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

      {isLoading ? (
        <div
          className="card p-[20px] text-center"
          style={{ color: "var(--text-secondary)" }}
        >
          Loading customer ledger...
        </div>
      ) : !customer ? (
        <div
          className="card p-[20px] text-center"
          style={{ color: "var(--text-secondary)" }}
        >
          Customer not found.
        </div>
      ) : (
        <div className="flex flex-col gap-[12px]">
          <div className="card p-[14px]">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div
                  className="font-inter font-bold text-[20px]"
                  style={{ color: "var(--text-primary)" }}
                >
                  {customer.name}
                </div>
                <div
                  className="text-[12px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {customer.shop_name || "No shop name"}
                </div>
              </div>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setOpeningBalanceInput(String(customer.opening_balance ?? ""));
                  setOpeningBalanceOpen(true);
                }}
              >
                {customer.opening_balance_set ? "Edit Opening Balance" : "+ Set Opening Balance"}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-hdr">
              <div
                className="card-title"
                style={{ color: "var(--text-primary)" }}
              >
                Ledger
              </div>
            </div>
            <div className="tbl-wrap">
              <table className="tbl tbl-invoice-detail">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Debit</th>
                    <th>Credit</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-8"
                        style={{ color: "var(--text-muted)" }}
                      >
                        No ledger entries yet
                      </td>
                    </tr>
                  ) : (
                    ledgerRows.map((row, idx) => (
                      <tr key={row.id}>
                        <td style={{ color: "var(--text-secondary)" }}>
                          {idx + 1}
                        </td>
                        <td style={{ color: "var(--text-secondary)" }}>
                          {row.date ? formatDate(row.date) : "—"}
                        </td>
                        <td>{row.description}</td>
                        <td
                          className="font-inter font-bold"
                          style={{
                            color:
                              row.debit > 0
                                ? "#00c97a"
                                : "var(--text-secondary)",
                          }}
                        >
                          {row.debit > 0 ? row.debit.toLocaleString() : "—"}
                        </td>
                        <td
                          className="font-inter font-bold"
                          style={{
                            color:
                              row.credit > 0
                                ? "#00c97a"
                                : "var(--text-secondary)",
                          }}
                        >
                          {row.credit > 0 ? row.credit.toLocaleString() : "—"}
                        </td>
                        <td
                          className="font-inter font-bold"
                          style={{
                            color: row.balance > 0 ? "#ff4d6a" : "#00c97a",
                          }}
                        >
                          {row.balance.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-[14px]">
            <div
              className="font-inter font-bold text-[14px] mb-[10px]"
              style={{ color: "var(--text-primary)" }}
            >
              Summary
            </div>
            <div className="flex flex-col gap-[8px] text-[13px]">
              <div
                className="flex justify-between p-[10px] rounded-lg"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border)",
                }}
              >
                <span style={{ color: "var(--text-secondary)" }}>
                  Opening Balance
                </span>
                <span style={{ color: "var(--text-primary)" }}>
                  PKR {totals.opening.toLocaleString()}
                </span>
              </div>
              <div
                className="flex justify-between p-[10px] rounded-lg"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border)",
                }}
              >
                <span style={{ color: "var(--text-secondary)" }}>
                  Total Invoiced
                </span>
                <span style={{ color: "var(--text-primary)" }}>
                  PKR {totals.totalInvoiced.toLocaleString()}
                </span>
              </div>
              <div
                className="flex justify-between p-[10px] rounded-lg"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border)",
                }}
              >
                <span style={{ color: "var(--text-secondary)" }}>
                  Total Outstanding
                </span>
                <span style={{ color: "var(--text-primary)" }}>
                  PKR {totals.totalOutstanding.toLocaleString()}
                </span>
              </div>
              <div
                className="flex justify-between p-[10px] rounded-lg"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border)",
                }}
              >
                <span style={{ color: "var(--text-secondary)" }}>
                  Total Paid
                </span>
                <span style={{ color: "#00c97a" }}>
                  PKR {totals.totalPaid.toLocaleString()}
                </span>
              </div>
              <div
                className="flex justify-between mt-[2px] pt-[12px]"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <span
                  className="font-inter font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Remaining
                </span>
                <span
                  className="font-inter font-semibold"
                  style={{
                    color: totals.remaining > 0 ? "#ff4d6a" : "#00c97a",
                  }}
                >
                  PKR {totals.remaining.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <LedgerPaymentModal
        isOpen={recordOpen}
        token={token || ""}
        fixedCustomer={
          customer
            ? {
                _id: customer._id,
                name: customer.name,
                shop_name: customer.shop_name,
              }
            : null
        }
        isSubmitting={recordLoading}
        onClose={() => setRecordOpen(false)}
        onSubmit={handleRecordPayment}
      />

      <Modal
        isOpen={openingBalanceOpen}
        onClose={() => setOpeningBalanceOpen(false)}
        title="Set Opening Balance"
      >
        <div className="p-[18px] flex flex-col gap-[12px]">
          <input
            className="fi"
            type="number"
            min={0}
            placeholder="Enter opening balance"
            value={openingBalanceInput}
            onChange={(e) => setOpeningBalanceInput(e.target.value)}
          />
          <div className="flex justify-end gap-[8px]">
            <button
              className="btn btn-ghost"
              onClick={() => setOpeningBalanceOpen(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSetOpeningBalance}
              disabled={openingBalanceLoading}
            >
              {openingBalanceLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default CustomerLedgerDetail;

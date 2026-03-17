import { useEffect, useMemo, useState } from "react";
import Modal from "./Modal";
import { getCustomersAPI, type Customer } from "../../api/customers";

interface LedgerPaymentModalProps {
  isOpen: boolean;
  token: string;
  isSubmitting: boolean;
  fixedCustomer?: {
    _id: string;
    name: string;
    shop_name?: string;
  } | null;
  onClose: () => void;
  onSubmit: (payload: {
    customerId: string;
    amount: number;
    method: "CASH" | "BANK" | "OTHER";
    notes?: string;
  }) => Promise<void>;
}

function LedgerPaymentModal({
  isOpen,
  token,
  isSubmitting,
  fixedCustomer,
  onClose,
  onSubmit,
}: LedgerPaymentModalProps) {
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [showResults, setShowResults] = useState(false);

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"CASH" | "BANK" | "OTHER">("CASH");
  // Payment date removed, backend handles it
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const q = customerQuery.trim();
    const timeout = setTimeout(async () => {
      setCustomerLoading(true);
      try {
        const data = await getCustomersAPI(token, {
          q: q || undefined,
          limit: 8,
        });
        setCustomerResults(data.items ?? []);
      } catch {
        setCustomerResults([]);
      } finally {
        setCustomerLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [customerQuery, token, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setCustomerQuery("");
      setCustomerResults([]);
      setCustomerLoading(false);
      setSelectedCustomer(null);
      setAmount("");
      setMethod("CASH");
      // setPaymentDate removed
      setNotes("");
      setError("");
      setShowResults(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!fixedCustomer || !isOpen) return;
    setSelectedCustomer({
      _id: fixedCustomer._id,
      name: fixedCustomer.name,
      shop_name: fixedCustomer.shop_name,
      is_active: true,
    });
    setCustomerQuery("");
    setShowResults(false);
  }, [fixedCustomer, isOpen]);

  const selectedCustomerText = useMemo(() => {
    if (!selectedCustomer) return "";
    return selectedCustomer.shop_name
      ? `${selectedCustomer.name} · ${selectedCustomer.shop_name}`
      : selectedCustomer.name;
  }, [selectedCustomer]);

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      setError("Please select a customer");
      return;
    }

    const amountNum = Math.round(Number(amount));
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setError("");
    await onSubmit({
      customerId: selectedCustomer._id,
      amount: amountNum,
      method,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Ledger Payment">
      <div className="p-[18px] flex flex-col gap-[12px] relative">
        {error && (
          <div
            className="p-[10px_13px] rounded-lg text-[12px] font-inter"
            style={{
              background: "rgba(255,77,106,.1)",
              border: "1px solid rgba(255,77,106,.2)",
              color: "#ff4d6a",
            }}
          >
            {error}
          </div>
        )}

        <div className="relative z-20">
          <label
            className="block text-[10px] uppercase tracking-[.1em] mb-[6px] font-inter font-semibold"
            style={{ color: "var(--text-secondary)" }}
          >
            Customer
          </label>
          {fixedCustomer ? (
            <div
              className="fi"
              style={{ display: "flex", alignItems: "center" }}
            >
              {fixedCustomer.name}
              {fixedCustomer.shop_name ? ` · ${fixedCustomer.shop_name}` : ""}
            </div>
          ) : (
            <input
              className="fi pr-8"
              placeholder="Search customer..."
              value={selectedCustomer ? selectedCustomerText : customerQuery}
              onFocus={() => {
                if (!selectedCustomer) setShowResults(true);
              }}
              onChange={(e) => {
                setSelectedCustomer(null);
                setCustomerQuery(e.target.value);
                setShowResults(true);
              }}
            />
          )}

          {!fixedCustomer && (customerQuery || selectedCustomer) && (
            <button
              className="absolute right-3 top-[35px] w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
              style={{
                background: "rgba(255,77,106,.18)",
                border: "none",
                color: "#ff4d6a",
                cursor: "pointer",
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                setSelectedCustomer(null);
                setCustomerQuery("");
                setShowResults(false);
              }}
            >
              ✕
            </button>
          )}

          {!fixedCustomer && showResults && !selectedCustomer && (
            <div
              className="absolute left-0 right-0 mt-1 rounded-lg overflow-hidden"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
                maxHeight: 230,
                overflowY: "auto",
              }}
            >
              {customerLoading ? (
                <div
                  className="px-3 py-3 text-[12px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Searching...
                </div>
              ) : customerResults.length === 0 ? (
                <div
                  className="px-3 py-3 text-[12px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  No customer found
                </div>
              ) : (
                customerResults.map((c) => (
                  <button
                    key={c._id}
                    className="w-full text-left px-3 py-3"
                    style={{
                      background: "transparent",
                      border: "none",
                      borderBottom: "1px solid var(--border)",
                      color: "var(--text-primary)",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--electric-glow)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSelectedCustomer(c);
                      setCustomerQuery("");
                      setShowResults(false);
                    }}
                  >
                    <div className="text-[13px] font-semibold">{c.name}</div>
                    <div
                      className="text-[11px]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {c.shop_name || "No shop name"}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
          <div>
            <label
              className="block text-[10px] uppercase tracking-[.1em] mb-[6px] font-inter font-semibold"
              style={{ color: "var(--text-secondary)" }}
            >
              Amount (PKR)
            </label>
            <input
              className="fi"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000"
            />
          </div>

          <div>
            <label
              className="block text-[10px] uppercase tracking-[.1em] mb-[6px] font-inter font-semibold"
              style={{ color: "var(--text-secondary)" }}
            >
              Method
            </label>
            <select
              className="fi"
              value={method}
              onChange={(e) =>
                setMethod(e.target.value as "CASH" | "BANK" | "OTHER")
              }
            >
              <option value="CASH">Cash</option>
              <option value="BANK">Bank</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <div>{/* Payment Date field removed, backend handles it */}</div>

        <div>
          <label
            className="block text-[10px] uppercase tracking-[.1em] mb-[6px] font-inter font-semibold"
            style={{ color: "var(--text-secondary)" }}
          >
            Notes (Optional)
          </label>
          <input
            className="fi"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes..."
          />
        </div>

        <div className="flex justify-end gap-[8px] pt-[2px]">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{ opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? "Saving..." : "Record Payment"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default LedgerPaymentModal;

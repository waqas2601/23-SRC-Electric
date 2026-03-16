import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { getCustomersAPI } from "../../api/customers";

interface Customer {
  _id: string;
  name: string;
  shop_name?: string;
  phone?: string;
}

interface CustomerSearchProps {
  onSelect: (customer: Customer | null, newName?: string) => void;
  selectedCustomer: Customer | null;
  newCustomerName?: string;
}

function CustomerSearch({
  onSelect,
  selectedCustomer,
  newCustomerName,
}: CustomerSearchProps) {
  const { token } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const justSelectedRef = useRef(false);

  // Close on outside click
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  // Search customers whenever query changes
  useEffect(() => {
    if (!token) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await getCustomersAPI(token, {
          q: query || undefined,
          limit: 10,
        });
        setResults(data.items ?? []);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, token]);

  const updateDropdownPos = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  const handleSelect = (customer: Customer) => {
    justSelectedRef.current = true;
    onSelect(customer);
    setIsOpen(false);
    setQuery("");
    setTimeout(() => {
      justSelectedRef.current = false;
    }, 300);
  };

  const handleFocus = () => {
    if (justSelectedRef.current) return;
    updateDropdownPos();
    setIsOpen(true);
    // if re-clicking with new name typed, restore query
    if (!selectedCustomer && newCustomerName) {
      setQuery(newCustomerName);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    onSelect(null, val);
  };

  const isNew = !selectedCustomer && !!newCustomerName?.trim();
  const exactMatch = results.some(
    (r) =>
      r.name.toLowerCase() === (query || newCustomerName || "").toLowerCase(),
  );

  // What shows in the input
  const displayValue = isOpen
    ? query
    : selectedCustomer
      ? selectedCustomer.name
      : (newCustomerName ?? "");

  return (
    <div ref={wrapperRef} className="relative">
      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          className="fi pr-8"
          placeholder="Search or type customer name..."
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          style={{
            borderColor:
              isNew && !exactMatch
                ? "rgba(255,176,32,.6)"
                : selectedCustomer
                  ? "rgba(0,201,122,.5)"
                  : undefined,
          }}
        />

        {/* Green dot — selected */}
        {selectedCustomer && !isOpen && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: "12px",
                lineHeight: 1,
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(null, "");
                setQuery("");
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Yellow dot — new */}
        {isNew && !isOpen && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: "#ffb020" }}
            />
          </div>
        )}

        {/* Spinner */}
        {isLoading && isOpen && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div
              className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "#e8141c", borderTopColor: "transparent" }}
            />
          </div>
        )}
      </div>

      {/* Status hint below input */}
      {!isOpen && selectedCustomer && (
        <div
          className="flex items-center gap-1 mt-[5px] text-[11px] px-1"
          style={{ color: "#00c97a" }}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {selectedCustomer.shop_name ?? "Existing customer selected"}
          {selectedCustomer.phone && ` · ${selectedCustomer.phone}`}
        </div>
      )}

      {!isOpen && isNew && !exactMatch && (
        <div
          className="flex items-center gap-1 mt-[5px] text-[11px] px-1"
          style={{ color: "#ffb020" }}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          New customer "<strong>{newCustomerName}</strong>" will be created on
          submit
        </div>
      )}

      {/* Dropdown — fixed so it's never clipped */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
            zIndex: 9999,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
            maxHeight: "240px",
            overflowY: "auto",
          }}
        >
          {results.length > 0 ? (
            <>
              <div
                className="px-3 py-2 text-[9px] uppercase tracking-widest font-inter font-semibold"
                style={{
                  color: "var(--text-muted)",
                  borderBottom: "1px solid var(--border)",
                  position: "sticky",
                  top: 0,
                  background: "var(--bg-card)",
                }}
              >
                Select existing customer
              </div>
              {results.map((c) => (
                <div
                  key={c._id}
                  className="flex items-center gap-3 px-3 py-[11px] cursor-pointer"
                  style={{ borderBottom: "1px solid rgba(26,110,255,.07)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--electric-glow)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(c);
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center font-inter font-bold text-[11px] text-white flex-shrink-0"
                    style={{
                      background: "linear-gradient(135deg,#1a1a2e,#2535c8)",
                    }}
                  >
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[13px] font-medium truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {c.name}
                    </div>
                    {c.shop_name && (
                      <div
                        className="text-[10px] truncate"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {c.shop_name}
                      </div>
                    )}
                  </div>
                  {c.phone && (
                    <div
                      className="text-[10px] flex-shrink-0"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {c.phone}
                    </div>
                  )}
                </div>
              ))}
            </>
          ) : (
            <div
              className="px-3 py-5 text-center text-[12px]"
              style={{ color: "var(--text-muted)" }}
            >
              {query ? `No customer found for "${query}"` : "Type to search..."}
            </div>
          )}

          {/* New customer hint */}
          {query.trim() && !exactMatch && (
            <div
              className="flex items-center gap-3 px-3 py-[10px]"
              style={{
                borderTop: "1px solid var(--border)",
                background: "rgba(255,176,32,.05)",
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: "rgba(255,176,32,.1)",
                  border: "1px solid rgba(255,176,32,.3)",
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ffb020"
                  strokeWidth="2.5"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <div>
                <div
                  className="text-[12px] font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  Use "<span style={{ color: "#ffb020" }}>{query}</span>" as new
                  customer
                </div>
                <div
                  className="text-[10px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Will be created when invoice is generated
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CustomerSearch;

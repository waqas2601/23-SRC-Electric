import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { getProductsAPI, type Product } from "../../api/products";

interface ProductSearchProps {
  onAdd: (product: Product, quantity: number) => void;
}

function ProductSearch({ onAdd }: ProductSearchProps) {
  const { token } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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

  useEffect(() => {
    if (!token) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await getProductsAPI(token, {
          q: query || undefined,
          isActive: true,
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

  const handleSelect = (product: Product) => {
    setSelected(product);
    setQuery(product.name);
    setQuantity(1);
    setIsOpen(false);
  };

  const handleAdd = () => {
    if (!selected || quantity < 1) return;
    onAdd(selected, quantity);
    setSelected(null);
    setQuery("");
    setQuantity(1);
  };

  const notFound = query.trim() && !isLoading && results.length === 0;

  return (
    <div ref={wrapperRef} className="flex flex-col gap-[10px]">
      {/* Row: search + qty + add */}
      <div className="flex gap-[9px] items-center">
        {/* Search */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            className="fi pr-8"
            placeholder="Search product..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
              setIsOpen(true);
              updateDropdownPos();
            }}
            onFocus={() => {
              updateDropdownPos();
              setIsOpen(true);
            }}
            style={{
              borderColor: selected
                ? "rgba(0,201,122,.5)"
                : "var(--border-input)",
            }}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div
                className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin"
                style={{
                  borderColor: "#e8141c",
                  borderTopColor: "transparent",
                }}
              />
            </div>
          )}
          {selected && !isLoading && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
              style={{
                background: "rgba(255,77,106,.2)",
                border: "none",
                color: "#ff4d6a",
                cursor: "pointer",
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                setSelected(null);
                setQuery("");
              }}
            >
              ✕
            </button>
          )}

          {/* Dropdown */}
          {isOpen && !selected && (
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
                    className="px-3 py-[9px] text-[9px] uppercase tracking-widest font-inter font-semibold"
                    style={{
                      color: "var(--text-muted)",
                      borderBottom: "1px solid var(--border)",
                      position: "sticky",
                      top: 0,
                      background: "var(--bg-card)",
                    }}
                  >
                    Select product
                  </div>
                  {results.map((p) => (
                    <div
                      key={p._id}
                      className="flex items-center gap-3 px-3 py-[11px] cursor-pointer"
                      style={{ borderBottom: "1px solid rgba(26,110,255,.06)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "var(--electric-glow)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelect(p);
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-inter font-bold text-[12px] flex-shrink-0"
                        style={{
                          background: "var(--electric-glow)",
                          color: "var(--electric-bright)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        {p.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-[13px] font-semibold truncate"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {p.name}
                        </div>
                        <div
                          className="text-[10px]"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {p.sku} · {(p.model || "NO MODEL").replace(/_/g, " ")}
                        </div>
                      </div>
                      <div
                        className="text-[12px] font-inter font-bold flex-shrink-0"
                        style={{ color: "var(--electric-bright)" }}
                      >
                        PKR {p.price.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </>
              ) : notFound ? (
                <div
                  className="px-3 py-5 text-center text-[12px]"
                  style={{ color: "#ff4d6a" }}
                >
                  No product found. Add it from Products page first.
                </div>
              ) : (
                <div
                  className="px-3 py-5 text-center text-[12px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Type to search products...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quantity — only show when product selected */}
        {selected && (
          <div className="flex items-center gap-[6px] flex-shrink-0">
            <button
              className="w-8 h-[38px] rounded-lg font-bold text-[16px] flex items-center justify-center"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                cursor: "pointer",
              }}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              −
            </button>
            <input
              className="fi text-center font-inter font-bold"
              style={{ width: "52px", padding: "0 8px" }}
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            />
            <button
              className="w-8 h-[38px] rounded-lg font-bold text-[16px] flex items-center justify-center"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                cursor: "pointer",
              }}
              onClick={() => setQuantity((q) => q + 1)}
            >
              +
            </button>
          </div>
        )}

        {/* Add button */}
        <button
          className="btn btn-primary flex-shrink-0"
          onClick={handleAdd}
          disabled={!selected}
          style={{
            opacity: !selected ? 0.4 : 1,
            cursor: !selected ? "not-allowed" : "pointer",
          }}
        >
          + Add
        </button>
      </div>
    </div>
  );
}

export default ProductSearch;

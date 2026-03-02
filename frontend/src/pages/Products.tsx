import { useState } from "react";
import Badge from "../components/ui/Badge";
import Chip from "../components/ui/Chip";

const CATEGORIES = [
  "All",
  "Wires",
  "Switches",
  "Breakers",
  "Lighting",
  "Fittings",
];

const PRODUCTS = [
  {
    emoji: "⚡",
    name: "3-Core Copper Wire",
    sub: "1.5mm / per meter",
    sku: "SRC-W-001",
    category: "Wires",
    price: "PKR 85",
    stock: "In Stock",
  },
  {
    emoji: "🔌",
    name: "MCB 32A Single Pole",
    sub: "Schneider / piece",
    sku: "SRC-B-014",
    category: "Breakers",
    price: "PKR 420",
    stock: "In Stock",
  },
  {
    emoji: "💡",
    name: "LED Bulb 18W",
    sub: "Philips / piece",
    sku: "SRC-L-007",
    category: "Lighting",
    price: "PKR 320",
    stock: "Low Stock",
  },
  {
    emoji: "🔧",
    name: "Junction Box IP65",
    sub: "150×100mm / piece",
    sku: "SRC-J-022",
    category: "Fittings",
    price: "PKR 190",
    stock: "In Stock",
  },
  {
    emoji: "🎛️",
    name: "Modular Switch 6A",
    sub: "Legrand / piece",
    sku: "SRC-S-031",
    category: "Switches",
    price: "PKR 145",
    stock: "Out of Stock",
  },
];

const stockColor: Record<string, string> = {
  "In Stock": "#00c97a",
  "Low Stock": "#ffb020",
  "Out of Stock": "#ff4d6a",
};

function Products() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = PRODUCTS.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div
      style={{ animation: "fadeIn .2s ease" }}
      className="w-full overflow-hidden"
    >
      {" "}
      {/* Page Header */}
      <div className="flex items-center justify-between mb-[18px] flex-wrap gap-[10px]">
        <div
          className="font-inter font-extrabold text-[20px]"
          style={{ color: "var(--text-primary)" }}
        >
          Products <span style={{ color: "var(--electric)" }}>Catalog</span>
        </div>
        <button className="btn btn-primary">
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
          <span className="hidden sm:inline">Add Product</span>
        </button>
      </div>
      {/* Search + Chips */}
      <div className="flex items-center gap-[10px] mb-[16px] flex-wrap">
        <div
          className="s-box"
          style={{ flex: 1, minWidth: "160px", maxWidth: "280px" }}
        >
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
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: "none",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              fontFamily: "Roboto Mono",
              fontSize: "12px",
              width: "100%",
            }}
          />
        </div>
        <div className="flex gap-[7px] flex-wrap">
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              active={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
            />
          ))}
        </div>
      </div>
      {/* Table */}
      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-8"
                    style={{ color: "var(--text-muted)" }}
                  >
                    No products found
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.sku}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-[6px] flex items-center justify-center text-[14px] flex-shrink-0"
                          style={{
                            background:
                              "linear-gradient(135deg,#1a1a2e,#2535c8)",
                          }}
                        >
                          {p.emoji}
                        </div>
                        <div>
                          <div
                            className="font-medium text-[12px]"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {p.name}
                          </div>
                          <div
                            className="text-[10px]"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {p.sub}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "var(--electric-bright)" }}>{p.sku}</td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {p.category}
                    </td>
                    <td className="font-inter font-bold">{p.price}</td>
                    <td style={{ color: stockColor[p.stock] }}>{p.stock}</td>
                    <td>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: "4px 10px", fontSize: "11px" }}
                      >
                        Edit
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

export default Products;

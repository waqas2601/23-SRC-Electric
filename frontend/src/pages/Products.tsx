import { useState, useEffect, useCallback } from "react";
import Chip from "../components/ui/Chip";
import ProductModal from "../components/ui/ProductModal";
import { useAuth } from "../context/AuthContext";
import { getProductsAPI, deleteProductAPI } from "../api/products";

const CATEGORIES = [
  "All",
  "BULB",
  "TUBE_LIGHT",
  "SWITCH",
  "SOCKET",
  "PLUG",
  "WIRE",
  "CABLE",
  "MCB",
  "BREAKER",
  "DB_BOX",
  "FAN",
  "HOLDER",
  "ADAPTER",
  "EXTENSION_BOARD",
  "DIMMER",
  "SENSOR",
  "CHARGER",
  "INVERTER",
  "BATTERY",
  "OTHER",
];

interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  sku: string;
  is_active: boolean;
}

function Products() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getProductsAPI(token!, {
        q: search || undefined,
        category: activeCategory !== "All" ? activeCategory : undefined,
        limit: 50,
        isActive: true,
      });
      console.log("API Response:", data); // ← add this

      setProducts(data.items ?? []);
    } catch (err: any) {
      setError(err.message || "Failed to load products");
    } finally {
      setIsLoading(false);
    }
  }, [token, search, activeCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleEdit = (product: Product) => {
    setEditProduct(product);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await deleteProductAPI(token!, deleteId);
      setDeleteId(null);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || "Failed to delete product");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditProduct(null);
  };

  return (
    <div style={{ animation: "fadeIn .2s ease" }}>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-[18px] flex-wrap gap-[10px]">
        <div
          className="font-inter font-extrabold text-[20px]"
          style={{ color: "var(--text-primary)" }}
        >
          Products <span style={{ color: "var(--electric)" }}>Catalog</span>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditProduct(null);
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
          />
        </div>
        <div className="flex gap-[7px] flex-wrap">
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat}
              label={cat.replace("_", " ")}
              active={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
            />
          ))}
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
          <table className="tbl">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
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
              ) : products.length === 0 ? (
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
                products.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-[6px] flex items-center justify-center text-[14px] flex-shrink-0 font-inter font-bold"
                          style={{
                            background: "var(--electric-glow)",
                            color: "var(--electric-bright)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {p.name.charAt(0).toUpperCase()}
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
                            {p.category.replace("_", " ")}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "var(--electric-bright)" }}>{p.sku}</td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {p.category.replace("_", " ")}
                    </td>
                    <td className="font-inter font-bold">
                      PKR {p.price.toLocaleString()}
                    </td>
                    <td style={{ color: p.is_active ? "#00c97a" : "#ff4d6a" }}>
                      {p.is_active ? "Active" : "Inactive"}
                    </td>
                    <td>
                      <div className="flex items-center gap-[6px]">
                        <button
                          className="btn btn-ghost"
                          style={{ padding: "4px 10px", fontSize: "11px" }}
                          onClick={() => handleEdit(p)}
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
                          onClick={() => setDeleteId(p._id)}
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

      {/* Delete Confirmation Modal */}
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
            {/* Icon */}
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
                Delete Product?
              </div>
              <div
                className="text-[13px]"
                style={{ color: "var(--text-secondary)" }}
              >
                This product will be marked as inactive and won't appear in the
                list anymore.
              </div>
            </div>

            {/* Buttons */}
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
                    Deleting...
                  </>
                ) : (
                  "Yes, Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <ProductModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        onSuccess={fetchProducts}
        product={editProduct}
      />
    </div>
  );
}

export default Products;

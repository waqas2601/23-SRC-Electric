import { useState, useEffect, useCallback, useMemo } from "react";
import Chip from "../components/ui/Chip";
import ProductModal from "../components/ui/ProductModal";
import { useAuth } from "../context/AuthContext";
import {
  DEFAULT_PRODUCT_MODELS,
  getProductsAPI,
  getProductModelsAPI,
  normalizeModelLabel,
  deleteProductAPI,
  type Product,
} from "../api/products";
import { useToast } from "../context/ToastContext";

const TYPE_FILTERS = [
  { label: "All", value: "" },
  { label: "With Model", value: "model" },
  { label: "Single", value: "direct" },
];

function Products() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editVariants, setEditVariants] = useState<Product[] | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeTypeFilter, setActiveTypeFilter] = useState<
    "" | "model" | "direct"
  >("");
  const [activeModelFilter, setActiveModelFilter] = useState("");

  useEffect(() => {
    if (!token) return;
    getProductModelsAPI(token)
      .then((data) => setModels(data.models ?? []))
      .catch(() => setModels(DEFAULT_PRODUCT_MODELS));
  }, [token]);

  const fetchProducts = useCallback(async () => {
    if (!token) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const data = await getProductsAPI(token, {
        q: search || undefined,
        isActive: true,
        limit: 100,
      });
      setProducts(data.items ?? []);
    } catch (err: any) {
      const message = err.message || "Failed to load products";
      setError(message);
      showToast("error", message);
    } finally {
      setIsLoading(false);
    }
  }, [token, search, showToast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async () => {
    if (!deleteId || !token) return;
    setDeleteLoading(true);
    try {
      const ids = deleteId.split(",").filter(Boolean);
      await Promise.all(ids.map((id) => deleteProductAPI(token, id)));
      setDeleteId(null);
      await fetchProducts();
      showToast("success", "Product deleted successfully");
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete product");
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatModel = (value?: string | null) => {
    if (!value?.trim()) return "—";
    return value.replace(/_/g, " ");
  };

  const toModelKey = (value?: string | null) =>
    value ? normalizeModelLabel(value) : "";

  const modelProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          p.type === "model" &&
          (activeTypeFilter ? p.type === activeTypeFilter : true) &&
          (activeModelFilter
            ? toModelKey(p.model) === activeModelFilter
            : true),
      ),
    [products, activeTypeFilter, activeModelFilter],
  );

  const directProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          (p.type === "direct" || !p.model) &&
          (activeTypeFilter ? "direct" === activeTypeFilter : true),
      ),
    [products, activeTypeFilter],
  );

  const modelLabels = useMemo(() => {
    const fromProducts = Array.from(
      new Set(
        modelProducts
          .map((p) => toModelKey(p.model))
          .filter(Boolean) as string[],
      ),
    );
    const ordered = Array.from(new Set(models.map((m) => toModelKey(m))));
    for (const label of fromProducts) {
      if (!ordered.includes(label)) ordered.push(label);
    }
    return ordered;
  }, [models, modelProducts]);

  const groupedModelProducts = useMemo(() => {
    const grouped = modelProducts.reduce(
      (acc, p) => {
        if (!acc[p.name]) acc[p.name] = [];
        acc[p.name].push(p);
        return acc;
      },
      {} as Record<string, Product[]>,
    );
    return Object.entries(grouped);
  }, [modelProducts]);

  return (
    <div style={{ animation: "fadeIn .2s ease" }}>
      {/* Header */}
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
            setEditVariants(null);
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

      {/* Search */}
      <div className="flex items-center gap-[10px] mb-[13px]">
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
            placeholder="Search products..."
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

      {/* Filters */}
      <div className="flex gap-[7px] flex-wrap mb-[12px]">
        {TYPE_FILTERS.map((f) => (
          <Chip
            key={f.value}
            label={f.label}
            active={activeTypeFilter === f.value}
            onClick={() => {
              setActiveTypeFilter(f.value as "" | "model" | "direct");
              if (f.value === "direct") setActiveModelFilter("");
            }}
          />
        ))}
      </div>

      {(activeTypeFilter === "" || activeTypeFilter === "model") && (
        <div className="flex gap-[7px] flex-wrap mb-[14px]">
          <Chip
            label="All Models"
            active={activeModelFilter === ""}
            onClick={() => setActiveModelFilter("")}
          />
          {modelLabels.map((m) => (
            <Chip
              key={m}
              label={formatModel(m)}
              active={activeModelFilter === m}
              onClick={() => setActiveModelFilter(m)}
            />
          ))}
        </div>
      )}

      {/* Model Products */}
      <div className="card">
        <div
          className="p-[14px_14px_8px] border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div
            className="font-inter font-bold text-[14px]"
            style={{ color: "var(--text-primary)" }}
          >
            Model Based Products
          </div>
          {modelLabels.length > 0 && (
            <div className="flex flex-wrap gap-[6px] mt-[8px]">
              {modelLabels.map((m) => (
                <span key={m} className="chip">
                  {formatModel(m)}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="tbl-wrap">
          <table className="tbl tbl-products">
            <thead>
              <tr>
                <th style={{ width: "40px" }}>#</th>
                <th>Name</th>
                {modelLabels.map((m) => (
                  <th key={m}>{formatModel(m)}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={3 + modelLabels.length}
                    className="text-center py-8"
                  >
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
              ) : groupedModelProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={3 + modelLabels.length}
                    className="text-center py-8"
                    style={{ color: "var(--text-muted)" }}
                  >
                    No model products found
                  </td>
                </tr>
              ) : (
                groupedModelProducts.map(([name, variants], index) => (
                  <tr key={name}>
                    <td
                      className="text-[12px] font-inter font-semibold"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {index + 1}
                    </td>

                    {/* Name */}
                    <td>
                      <div className="flex items-center gap-[10px]">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-inter font-bold text-[13px] flex-shrink-0"
                          style={{
                            background: "var(--electric-glow)",
                            color: "var(--electric-bright)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {name.charAt(0)}
                        </div>
                        <span
                          className="font-inter font-semibold text-[13px] truncate max-w-[140px] sm:max-w-[220px]"
                          style={{ color: "var(--text-primary)" }}
                          title={name}
                        >
                          {name}
                        </span>
                      </div>
                    </td>

                    {modelLabels.map((m) => {
                      const variant = variants.find(
                        (v) => toModelKey(v.model) === m,
                      );
                      return (
                        <td key={m}>
                          {variant ? (
                            <span
                              className="font-inter font-bold text-[13px]"
                              style={{ color: "var(--electric-bright)" }}
                            >
                              PKR {variant.price.toLocaleString()}
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-muted)" }}>
                              —
                            </span>
                          )}
                        </td>
                      );
                    })}

                    <td>
                      <div className="flex items-center gap-[6px] whitespace-nowrap">
                        <button
                          className="btn btn-ghost"
                          style={{ padding: "4px 10px", fontSize: "11px" }}
                          onClick={() => {
                            setEditProduct(null);
                            setEditVariants(variants);
                            setModalOpen(true);
                          }}
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
                          onClick={() =>
                            setDeleteId(variants.map((v) => v._id).join(","))
                          }
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

      {/* Direct Products */}
      <div className="card mt-[14px]">
        <div
          className="p-[14px] border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div
            className="font-inter font-bold text-[14px]"
            style={{ color: "var(--text-primary)" }}
          >
            Single Products
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: "40px" }}>#</th>
                <th>Name</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-8"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : directProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-8"
                    style={{ color: "var(--text-muted)" }}
                  >
                    No direct products found
                  </td>
                </tr>
              ) : (
                directProducts.map((p, index) => (
                  <tr key={p._id}>
                    <td style={{ color: "var(--text-muted)" }}>{index + 1}</td>
                    <td
                      style={{ color: "var(--text-primary)", fontWeight: 600 }}
                    >
                      {p.name}
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>{p.sku}</td>
                    <td>
                      <span
                        className="font-inter font-bold text-[13px]"
                        style={{ color: "var(--electric-bright)" }}
                      >
                        PKR {p.price.toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-[6px] whitespace-nowrap">
                        <button
                          className="btn btn-ghost"
                          style={{ padding: "4px 10px", fontSize: "11px" }}
                          onClick={() => {
                            setEditProduct(p);
                            setEditVariants(null);
                            setModalOpen(true);
                          }}
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

      {/* Delete Modal */}
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
                Delete Product?
              </div>
              <div
                className="text-[13px]"
                style={{ color: "var(--text-secondary)" }}
              >
                {deleteId?.includes(",")
                  ? "All model variants of this product will be permanently deleted."
                  : "This product will be permanently deleted."}
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
        onClose={() => {
          setModalOpen(false);
          setEditProduct(null);
          setEditVariants(null);
        }}
        onSaved={fetchProducts}
        product={editProduct ?? undefined}
        allVariants={editVariants ?? undefined}
      />
    </div>
  );
}

export default Products;

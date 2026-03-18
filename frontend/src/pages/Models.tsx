import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getProductModelsAPI,
  createProductModelAPI,
  updateProductModelAPI,
  deleteProductModelAPI,
} from "../api/products";
import { useToast } from "../context/ToastContext";

interface ProductModel {
  _id: string;
  label: string;
  sku_prefix: string;
}

function Models() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<ProductModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLabel, setFormLabel] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchModels = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError("");
    try {
      const data = await getProductModelsAPI(token);
      setItems(data.items as ProductModel[]);
    } catch (err: any) {
      setError(err.message || "Failed to load models");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const openAdd = () => {
    setEditingId(null);
    setFormLabel("");
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (model: ProductModel) => {
    setEditingId(model._id);
    setFormLabel(model.label);
    setFormError("");
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setFormLabel("");
    setFormError("");
    setEditingId(null);
  };

  const handleSave = async () => {
    const label = formLabel.trim();
    if (!label || label.length < 2) {
      setFormError("Label must be at least 2 characters");
      return;
    }
    if (!token) return;
    setSaving(true);
    setFormError("");
    try {
      if (editingId) {
        await updateProductModelAPI(token, editingId, label);
        showToast("success", "Model updated");
      } else {
        await createProductModelAPI(token, label);
        showToast("success", "Model created");
      }
      closeForm();
      await fetchModels();
    } catch (err: any) {
      setFormError(err.message || "Failed to save model");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !token) return;
    setDeleteLoading(true);
    try {
      await deleteProductModelAPI(token, deleteId);
      setDeleteId(null);
      await fetchModels();
      showToast("success", "Model deleted");
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete model");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div style={{ animation: "fadeIn .2s ease" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-[18px] flex-wrap gap-[10px]">
        <div
          className="font-inter font-extrabold text-[20px]"
          style={{ color: "var(--text-primary)" }}
        >
          Product <span style={{ color: "var(--electric)" }}>Models</span>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Model
        </button>
      </div>

      {/* Inline Form */}
      {formOpen && (
        <div
          className="card p-[18px] mb-[16px]"
          style={{ border: "1px solid var(--border)" }}
        >
          <div
            className="font-inter font-semibold text-[14px] mb-[14px]"
            style={{ color: "var(--text-primary)" }}
          >
            {editingId ? "Edit Model" : "Add Model"}
          </div>
          <div className="flex flex-col sm:flex-row gap-[10px] items-start">
            <input
              className="fi flex-1"
              type="text"
              placeholder="Model label (e.g. AB Series)"
              value={formLabel}
              onChange={(e) => setFormLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
              style={{ border: "1px solid var(--border)", padding: "8px 12px", fontSize: "14px" }}
            />
            <div className="flex gap-[8px]">
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button className="btn btn-ghost" onClick={closeForm} disabled={saving}>
                Cancel
              </button>
            </div>
          </div>
          {formError && (
            <div className="text-[12px] mt-[8px]" style={{ color: "#ff4d6a" }}>
              {formError}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="p-[10px_13px] rounded-lg mb-[16px] text-[12px] font-inter"
          style={{ background: "rgba(255,77,106,.1)", border: "1px solid rgba(255,77,106,.2)", color: "#ff4d6a" }}
        >
          {error}
        </div>
      )}

      {/* Mobile Cards */}
      <div className="md:hidden flex flex-col gap-[10px]">
        {isLoading ? (
          <div className="card p-6 text-center" style={{ color: "var(--text-muted)" }}>Loading...</div>
        ) : items.length === 0 ? (
          <div className="card p-6 text-center" style={{ color: "var(--text-muted)" }}>No models found</div>
        ) : (
          items.map((m) => (
            <div key={m._id} className="card p-[14px]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-inter font-semibold text-[15px]" style={{ color: "var(--text-primary)" }}>
                    {m.label}
                  </div>
                  <div className="text-[11px] mt-[2px]" style={{ color: "var(--text-secondary)" }}>
                    SKU Prefix: {m.sku_prefix}
                  </div>
                </div>
                <div className="flex items-center gap-[6px]">
                  <button
                    className="btn btn-ghost"
                    style={{ padding: "6px 10px", fontSize: "11px" }}
                    onClick={() => openEdit(m)}
                  >
                    Edit
                  </button>
                  <button
                    style={{ padding: "6px 10px", fontSize: "11px", background: "rgba(255,77,106,.1)", border: "1px solid rgba(255,77,106,.2)", color: "#ff4d6a", borderRadius: "8px", cursor: "pointer", fontFamily: "Inter", fontWeight: 600 }}
                    onClick={() => setDeleteId(m._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="card hidden md:block">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Label</th>
                <th>SKU Prefix</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#e8141c", borderTopColor: "transparent" }} />
                      <span style={{ color: "var(--text-muted)" }}>Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8" style={{ color: "var(--text-muted)" }}>
                    No models found
                  </td>
                </tr>
              ) : (
                items.map((m, index) => (
                  <tr key={m._id}>
                    <td style={{ color: "var(--text-secondary)" }}>{index + 1}</td>
                    <td className="font-medium">{m.label}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{m.sku_prefix}</td>
                    <td>
                      <div className="flex items-center gap-[6px]">
                        <button
                          className="btn btn-ghost"
                          style={{ padding: "4px 10px", fontSize: "11px" }}
                          onClick={() => openEdit(m)}
                        >
                          Edit
                        </button>
                        <button
                          style={{ padding: "4px 10px", fontSize: "11px", background: "rgba(255,77,106,.1)", border: "1px solid rgba(255,77,106,.2)", color: "#ff4d6a", borderRadius: "8px", cursor: "pointer", fontFamily: "Inter", fontWeight: 600 }}
                          onClick={() => setDeleteId(m._id)}
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
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(0,0,0,0.4)", animation: "fadeIn .2s ease" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center p-[28px_24px_20px]">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                style={{ background: "rgba(255,77,106,.1)", border: "1px solid rgba(255,77,106,.2)" }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff4d6a" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </div>
              <div className="font-inter font-bold text-[16px] mb-2" style={{ color: "var(--text-primary)" }}>
                Delete Model?
              </div>
              <div className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                {items.find((m) => m._id === deleteId)?.label ?? "This model"} will be permanently deleted.
              </div>
            </div>
            <div className="flex gap-[9px] p-[0_24px_24px]">
              <button className="btn btn-ghost flex-1 justify-center" onClick={() => setDeleteId(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary flex-1 justify-center"
                onClick={handleDelete}
                disabled={deleteLoading}
                style={{ background: "#ff4d6a", boxShadow: "0 4px 18px rgba(255,77,106,.3)", opacity: deleteLoading ? 0.7 : 1 }}
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
    </div>
  );
}

export default Models;

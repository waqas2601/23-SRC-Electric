import { useState, useEffect } from "react";
import Modal from "./Modal";
import { useAuth } from "../../context/AuthContext";
import { addCustomerAPI, updateCustomerAPI } from "../../api/customers";

interface Customer {
  _id?: string;
  name: string;
  shop_name?: string;
  address?: string;
  phone?: string;
  notes?: string;
}

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer?: Customer | null;
}

function CustomerModal({
  isOpen,
  onClose,
  onSuccess,
  customer,
}: CustomerModalProps) {
  const { token } = useAuth();
  const [name, setName] = useState("");
  const [shopName, setShopName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = !!customer;

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setShopName(customer.shop_name ?? "");
      setAddress(customer.address ?? "");
      setPhone(customer.phone ?? "");
      setNotes(customer.notes ?? "");
    } else {
      setName("");
      setShopName("");
      setAddress("");
      setPhone("");
      setNotes("");
    }
    setError("");
  }, [customer, isOpen]);

  const handleSubmit = async () => {
    if (!name) {
      setError("Customer name is required");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      if (isEditing && customer?._id) {
        await updateCustomerAPI(token!, customer._id, {
          name,
          shop_name: shopName,
          address,
          phone,
          notes,
        });
      } else {
        await addCustomerAPI(token!, {
          name,
          shop_name: shopName,
          address,
          phone,
          notes,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Customer" : "Add Customer"}
    >
      <div className="p-[20px] flex flex-col gap-[13px]">
        {/* Error */}
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

        {/* Name */}
        <div>
          <label
            className="block text-[10px] uppercase tracking-[.1em] mb-[6px] font-inter font-semibold"
            style={{ color: "var(--text-secondary)" }}
          >
            Customer Name <span style={{ color: "#ff4d6a" }}>*</span>
          </label>
          <input
            className="fi"
            placeholder="e.g. Ahmad Electronics"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Shop Name */}
        <div>
          <label
            className="block text-[10px] uppercase tracking-[.1em] mb-[6px] font-inter font-semibold"
            style={{ color: "var(--text-secondary)" }}
          >
            Shop Name
          </label>
          <input
            className="fi"
            placeholder="e.g. Ahmad Electronics Store"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
          />
        </div>

        {/* Address + Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[13px]">
          <div>
            <label
              className="block text-[10px] uppercase tracking-[.1em] mb-[6px] font-inter font-semibold"
              style={{ color: "var(--text-secondary)" }}
            >
              Address
            </label>
            <input
              className="fi"
              placeholder="e.g. Main Bazaar, Gujrat"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div>
            <label
              className="block text-[10px] uppercase tracking-[.1em] mb-[6px] font-inter font-semibold"
              style={{ color: "var(--text-secondary)" }}
            >
              Phone
            </label>
            <input
              className="fi"
              placeholder="e.g. 03001234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label
            className="block text-[10px] uppercase tracking-[.1em] mb-[6px] font-inter font-semibold"
            style={{ color: "var(--text-secondary)" }}
          >
            Notes (Optional)
          </label>
          <input
            className="fi"
            placeholder="Any additional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-[9px] justify-end pt-[4px]">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isLoading}
            style={{ opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              "Update Customer"
            ) : (
              "Add Customer"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default CustomerModal;

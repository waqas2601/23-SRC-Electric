import { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}

function Modal({
  isOpen,
  onClose,
  title,
  children,
  width = "480px",
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-xl flex flex-col"
        style={{
          maxWidth: width,
          maxHeight: "calc(100vh - 48px)",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
          animation: "fadeIn .2s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — always visible */}
        <div
          className="flex items-center justify-between px-[20px] py-[16px] flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div
            className="font-inter font-bold text-[15px]"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[16px] transition-all"
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* Content — scrollable */}
        <div style={{ overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

export default Modal;

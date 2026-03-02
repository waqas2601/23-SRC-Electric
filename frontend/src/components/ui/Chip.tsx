interface ChipProps {
  label: string;
  active?: boolean;
  onClick: () => void;
}

function Chip({ label, active = false, onClick }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className="chip"
      style={{
        background: active ? "#e8141c" : "var(--chip-bg)",
        color: active ? "#fff" : "var(--text-secondary)",
        borderColor: active ? "#e8141c" : "var(--border)",
        boxShadow: active ? "0 2px 12px rgba(232,20,28,.3)" : "none",
      }}
    >
      {label}
    </button>
  );
}

export default Chip;

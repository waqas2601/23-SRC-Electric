interface StatCardProps {
  label: string;
  value: string;
  change: string;
  changeType: "up" | "down" | "neutral";
  accentColor: string;
  icon: React.ReactNode;
  loading?: boolean;
}

function StatCard({
  label,
  value,
  change,
  changeType,
  accentColor,
  icon,
  loading,
}: StatCardProps) {
  const changeColors = {
    up: "#00c97a",
    down: "#ff4d6a",
    neutral: "var(--text-secondary)",
  };

  return (
    <div
      className="relative overflow-hidden rounded-xl p-4 transition-all duration-200 hover:scale-[1.01]"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: accentColor }}
      />

      {/* Top row — label + icon */}
      <div className="flex items-start justify-between mb-[9px]">
        <div
          className="text-[10px] uppercase tracking-[.12em] font-inter font-semibold pr-2"
          style={{ color: "var(--text-secondary)", lineHeight: "1.4" }}
        >
          {label}
        </div>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--electric-glow)" }}
        >
          {icon}
        </div>
      </div>

      {loading ? (
        <>
          <div className="h-[26px] w-[60%] rounded-md mb-[8px] animate-pulse" style={{ background: "var(--border)" }} />
          <div className="h-[12px] w-[80%] rounded-md animate-pulse" style={{ background: "var(--border)" }} />
        </>
      ) : (
        <>
          {/* Value */}
          <div
            className="font-inter font-extrabold leading-none mb-[6px] text-[18px] sm:text-[22px]"
            style={{ color: "var(--text-primary)" }}
          >
            {value}
          </div>

          {/* Change */}
          <div className="text-[11px]" style={{ color: changeColors[changeType] }}>
            {change}
          </div>
        </>
      )}
    </div>
  );
}

export default StatCard;

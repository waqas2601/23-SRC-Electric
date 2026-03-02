interface AvatarProps {
  initials: string;
  gradient?: string;
  size?: "sm" | "md" | "lg";
}

const gradients: Record<string, string> = {
  default: "linear-gradient(135deg,#1a1a2e,#2535c8)",
  green: "linear-gradient(135deg,#1a5200,#00c97a)",
  cyan: "linear-gradient(135deg,#0d4a8c,#00d4ff)",
  purple: "linear-gradient(135deg,#4a0d8c,#9b59ff)",
  red: "linear-gradient(135deg,#2535c8,#e8141c)",
};

const sizes = {
  sm: { box: "w-8 h-8", font: "text-[11px]", radius: "8px" },
  md: { box: "w-[34px] h-[34px]", font: "text-[12px]", radius: "8px" },
  lg: { box: "w-[42px] h-[42px]", font: "text-[14px]", radius: "8px" },
};

function Avatar({ initials, gradient = "default", size = "md" }: AvatarProps) {
  const s = sizes[size];

  return (
    <div
      className={`${s.box} flex items-center justify-center flex-shrink-0 font-inter font-extrabold text-white ${s.font}`}
      style={{
        background: gradients[gradient] ?? gradient,
        borderRadius: s.radius,
      }}
    >
      {initials}
    </div>
  );
}

export default Avatar;

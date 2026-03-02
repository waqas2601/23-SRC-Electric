interface BadgeProps {
  status: "paid" | "partial" | "unpaid" | "overdue" | "clear";
}

function Badge({ status }: BadgeProps) {
  const styles: Record<string, string> = {
    paid: "badge-paid",
    clear: "badge-paid",
    partial: "badge-partial",
    unpaid: "badge-unpaid",
    overdue: "badge-unpaid",
  };

  const labels: Record<string, string> = {
    paid: "Paid",
    clear: "Clear",
    partial: "Partial",
    unpaid: "Unpaid",
    overdue: "Overdue",
  };

  return <span className={`badge ${styles[status]}`}>{labels[status]}</span>;
}

export default Badge;

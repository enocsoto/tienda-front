interface BadgeProps {
  children: React.ReactNode;
  variant?: "sky" | "emerald" | "amber" | "red" | "slate";
}

const variants = {
  sky: "bg-sky-100 text-sky-700",
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  slate: "bg-slate-100 text-slate-600",
};

export function Badge({ children, variant = "sky" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${variants[variant]}`}
    >
      {children}
    </span>
  );
}

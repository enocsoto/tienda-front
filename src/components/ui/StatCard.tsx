import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "danger" | "primary";
  subtitle?: string;
}

const variants = {
  default: "bg-white border-slate-200 text-slate-800",
  success: "bg-emerald-600 border-transparent text-white",
  danger: "bg-red-500 border-transparent text-white",
  primary: "bg-sky-600 border-transparent text-white",
};

const iconVariants = {
  default: "bg-sky-50 text-sky-600",
  success: "bg-white/20 text-white",
  danger: "bg-white/20 text-white",
  primary: "bg-white/20 text-white",
};

export function StatCard({
  title,
  value,
  icon: Icon,
  variant = "default",
  subtitle,
}: StatCardProps) {
  const isColored = variant !== "default";

  return (
    <div
      className={`rounded-2xl border p-6 flex items-center gap-4 shadow-sm ${variants[variant]}`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconVariants[variant]}`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p
          className={`text-sm font-medium truncate ${isColored ? "text-white/80" : "text-slate-500"}`}
        >
          {title}
        </p>
        <p className={`text-2xl font-bold mt-0.5 ${isColored ? "text-white" : "text-slate-800"}`}>
          {value}
        </p>
        {subtitle && (
          <p className={`text-xs mt-0.5 ${isColored ? "text-white/70" : "text-slate-400"}`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

import { Filter } from "lucide-react";
import type { Granularity } from "../types";

interface SalesFiltersProps {
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
  desde: string;
  hasta: string;
  onDesdeChange: (v: string) => void;
  onHastaChange: (v: string) => void;
  onFilterSubmit: (e: React.FormEvent) => void;
}

const GRANULARITY_LABELS: Record<Granularity, string> = {
  daily: "Diario",
  weekly: "Semanal",
  monthly: "Mensual",
  custom: "Personalizado",
};

export function SalesFilters({
  granularity,
  onGranularityChange,
  desde,
  hasta,
  onDesdeChange,
  onHastaChange,
  onFilterSubmit,
}: SalesFiltersProps) {
  return (
    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
          <Filter className="w-4 h-4 shrink-0" />
          Vista:
        </div>
        {(["daily", "weekly", "monthly", "custom"] as const).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => onGranularityChange(g)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              granularity === g
                ? "bg-sky-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:border-sky-200"
            }`}
          >
            {GRANULARITY_LABELS[g]}
          </button>
        ))}
      </div>
      {granularity === "custom" && (
        <form onSubmit={onFilterSubmit} className="flex flex-wrap gap-3 items-end mt-3">
          <div className="flex flex-col">
            <label className="text-xs text-slate-400 mb-1 font-medium">Desde</label>
            <input
              type="date"
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              value={desde}
              onChange={(e) => onDesdeChange(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-slate-400 mb-1 font-medium">Hasta</label>
            <input
              type="date"
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              value={hasta}
              onChange={(e) => onHastaChange(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium text-sm"
          >
            Aplicar
          </button>
        </form>
      )}
    </div>
  );
}

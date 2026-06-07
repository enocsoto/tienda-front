import { Search, ChevronLeft, ChevronRight } from "lucide-react";

interface InventoryToolbarProps {
  search: string;
  onSearchChange: (q: string) => void;
  isAdmin: boolean;
  showInactiveOnly: boolean;
  onToggleInactive: (checked: boolean) => void;
  page: number;
  totalPages: number;
  loading: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export function InventoryToolbar({
  search,
  onSearchChange,
  isAdmin,
  showInactiveOnly,
  onToggleInactive,
  page,
  totalPages,
  loading,
  onPrevPage,
  onNextPage,
}: InventoryToolbarProps) {
  return (
    <div className="px-4 py-4 sm:px-6 border-b border-slate-100 flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm sm:flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            placeholder="Buscar producto..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm focus:bg-white focus:border-sky-400 focus:outline-none focus:ring-3 focus:ring-sky-100 transition-all"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        {isAdmin && (
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer shrink-0 sm:order-3 w-full sm:w-auto">
            <input
              type="checkbox"
              checked={showInactiveOnly}
              onChange={(e) => onToggleInactive(e.target.checked)}
              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            Ver solo inactivos
          </label>
        )}
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-3 shrink-0">
            <p className="text-sm text-slate-500 whitespace-nowrap order-2 sm:order-1">
              Página {page} de {totalPages}
            </p>
            <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onPrevPage}
                disabled={page <= 1 || loading}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
              <button
                type="button"
                onClick={onNextPage}
                disabled={page >= totalPages || loading}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

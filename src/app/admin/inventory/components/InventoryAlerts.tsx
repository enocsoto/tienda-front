import { AlertTriangle } from "lucide-react";

interface InventoryAlertsProps {
  showInactiveOnly: boolean;
  lowStock: number;
  outOfStock: number;
}

export function InventoryAlerts({ showInactiveOnly, lowStock, outOfStock }: InventoryAlertsProps) {
  if (showInactiveOnly || (lowStock === 0 && outOfStock === 0)) return null;

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {outOfStock > 0 && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-2.5 rounded-xl">
          <AlertTriangle className="w-4 h-4" />
          {outOfStock} producto{outOfStock > 1 ? "s" : ""} sin producto
        </div>
      )}
      {lowStock > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium px-4 py-2.5 rounded-xl">
          <AlertTriangle className="w-4 h-4" />
          {lowStock} producto{lowStock > 1 ? "s" : ""} con cantidad crítica
        </div>
      )}
    </div>
  );
}

export function InactiveBanner() {
  return (
    <div className="px-4 sm:px-6 py-3 bg-slate-100 border-b border-slate-200 text-sm text-slate-600">
      Vista de productos <span className="font-semibold text-slate-800">inactivos</span> — usa
      Reactivar para volver a habilitarlos en ventas y tienda pública.
    </div>
  );
}

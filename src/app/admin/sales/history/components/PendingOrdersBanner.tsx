import { formatCOP } from "@/lib/format";
import { Package, CheckCircle2, Loader2 } from "lucide-react";
import type { Sale } from "../types";
import { saleKey } from "../utils/sale-utils";

interface PendingOrdersBannerProps {
  pedidos: Sale[];
  confirmandoId: string | null;
  onConfirmarPago: (saleId: string) => void;
}

export function PendingOrdersBanner({
  pedidos,
  confirmandoId,
  onConfirmarPago,
}: PendingOrdersBannerProps) {
  if (pedidos.length === 0) return null;

  return (
    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-amber-100 bg-amber-100/50">
        <h2 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Pedidos pendientes de confirmar pago ({pedidos.length})
        </h2>
        <p className="text-xs text-amber-700 mt-1">
          Estos pedidos no se incluyen en el balance ni reportes hasta que confirmes que recibiste el pago.
        </p>
      </div>
      <div className="divide-y divide-amber-100">
        {pedidos.map((p, index) => {
          const key = saleKey(p, index);
          return (
            <div
              key={key}
              className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 hover:bg-amber-50/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800">{p.cliente_nombre}</p>
                <p className="text-sm text-slate-500">{p.cliente_telefono}</p>
                {p.direccion && <p className="text-xs text-slate-400 mt-0.5">{p.direccion}</p>}
                {p.fecha_hora_entrega && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Entrega: {new Date(p.fecha_hora_entrega).toLocaleString("es-CO")}
                  </p>
                )}
                <p className="text-sm font-semibold text-sky-700 mt-1">{formatCOP(Number(p.total))}</p>
                <p className="text-xs text-slate-400 capitalize">{p.metodo_pago?.toLowerCase()}</p>
              </div>
              <button
                type="button"
                onClick={() => onConfirmarPago(key)}
                disabled={confirmandoId === key}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors"
              >
                {confirmandoId === key ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {confirmandoId === key ? "Confirmando…" : "Confirmar pago"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

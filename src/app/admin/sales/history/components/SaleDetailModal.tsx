import { formatCOP } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { X, Receipt } from "lucide-react";
import type { Sale } from "../types";
import { formatCantidadItem, itemNombreProducto } from "../utils/sale-utils";

interface SaleDetailModalProps {
  sale: Sale | null;
  onClose: () => void;
}

export function SaleDetailModal({ sale, onClose }: SaleDetailModalProps) {
  if (!sale) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="venta-detalle-titulo"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full max-h-[min(90vh,720px)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="min-w-0">
            <h2 id="venta-detalle-titulo" className="text-lg font-bold text-slate-900">
              Detalle de venta
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {new Date(sale.fecha).toLocaleString("es-CO", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors shrink-0"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1 space-y-4">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">Tipo</dt>
              <dd className="mt-0.5">
                <Badge variant={sale.tipo?.toUpperCase() === "CONTADO" ? "emerald" : "amber"}>
                  {sale.tipo?.toUpperCase() ?? sale.tipo}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">Método de pago</dt>
              <dd className="mt-0.5 text-slate-800 capitalize">{sale.metodo_pago?.toLowerCase() ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">Cliente</dt>
              <dd className="mt-0.5 text-slate-800">{sale.cliente_nombre || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">Teléfono</dt>
              <dd className="mt-0.5 text-slate-800">{sale.cliente_telefono || "—"}</dd>
            </div>
            {sale.origen && (
              <div>
                <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">Origen</dt>
                <dd className="mt-0.5 text-slate-800">{sale.origen}</dd>
              </div>
            )}
            {sale.pago_confirmado === false && (
              <div className="sm:col-span-2">
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  Pago pendiente de confirmar
                </p>
              </div>
            )}
            {sale.direccion && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">Entrega</dt>
                <dd className="mt-0.5 text-slate-700">{sale.direccion}</dd>
              </div>
            )}
            {sale.fecha_hora_entrega && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">Fecha / hora entrega</dt>
                <dd className="mt-0.5 text-slate-700">
                  {new Date(sale.fecha_hora_entrega).toLocaleString("es-CO")}
                </dd>
              </div>
            )}
            {sale.notas?.trim() && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">Notas</dt>
                <dd className="mt-0.5 text-slate-700 whitespace-pre-wrap">{sale.notas}</dd>
              </div>
            )}
          </dl>

          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-sky-600" />
              Productos
            </h3>
            {(sale.items ?? []).length > 0 ? (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                      <th className="text-left font-semibold py-2 px-3">Producto</th>
                      <th className="text-right font-semibold py-2 px-2 w-14">Cant.</th>
                      <th className="text-right font-semibold py-2 px-2">V. unit.</th>
                      <th className="text-right font-semibold py-2 px-3">Subt.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(sale.items ?? []).map((it, ii) => (
                      <tr key={ii}>
                        <td className="py-2.5 px-3 text-slate-800">{itemNombreProducto(it)}</td>
                        <td className="py-2.5 px-2 text-right tabular-nums text-slate-700">
                          {formatCantidadItem(it.cantidad)}
                        </td>
                        <td className="py-2.5 px-2 text-right tabular-nums text-slate-700 whitespace-nowrap">
                          {it.precio_unitario != null && Number.isFinite(Number(it.precio_unitario))
                            ? formatCOP(Number(it.precio_unitario))
                            : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-slate-800 font-medium whitespace-nowrap">
                          {it.subtotal != null && Number.isFinite(Number(it.subtotal))
                            ? formatCOP(Number(it.subtotal))
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-2">No hay líneas de producto registradas.</p>
            )}
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <span className="text-sm font-medium text-slate-600">Total venta</span>
            <span className="text-lg font-bold text-sky-700">{formatCOP(Number(sale.total))}</span>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

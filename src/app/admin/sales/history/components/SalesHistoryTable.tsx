import { formatCOP } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { BarChart3, Receipt } from "lucide-react";
import type { Sale } from "../types";
import { countSaleItems, saleKey } from "../utils/sale-utils";

interface SalesHistoryTableProps {
  sales: Sale[];
  loading: boolean;
  onSelectSale: (sale: Sale) => void;
}

export function SalesHistoryTable({ sales, loading, onSelectSale }: SalesHistoryTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
            <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[12rem] w-[12rem]">
              Ítems
            </th>
            <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
            <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Método</th>
            <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</th>
            <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="py-4 px-6">
                  <div className="h-4 bg-slate-100 rounded w-36" />
                </td>
                <td className="py-4 px-4 min-w-[12rem] w-[12rem]">
                  <div className="h-4 bg-slate-100 rounded w-36" />
                </td>
                <td className="py-4 px-4">
                  <div className="h-5 bg-slate-100 rounded-full w-20" />
                </td>
                <td className="py-4 px-4">
                  <div className="h-4 bg-slate-100 rounded w-24" />
                </td>
                <td className="py-4 px-4">
                  <div className="h-4 bg-slate-100 rounded w-20" />
                </td>
                <td className="py-4 px-4">
                  <div className="h-4 bg-slate-100 rounded w-16 ml-auto" />
                </td>
              </tr>
            ))
          ) : sales.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-16 text-center">
                <BarChart3 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 font-medium text-sm">No hay ventas en este período</p>
              </td>
            </tr>
          ) : (
            sales.map((sale, index) => {
              const itemCount = countSaleItems(sale);
              return (
                <tr
                  key={saleKey(sale, index)}
                  className="hover:bg-sky-50/50 transition-colors cursor-pointer"
                  onClick={() => onSelectSale(sale)}
                  tabIndex={0}
                  aria-label="Abrir detalle de venta"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectSale(sale);
                    }
                  }}
                >
                  <td className="py-4 px-6 align-top">
                    <p className="text-sm font-medium text-slate-800">
                      {new Date(sale.fecha).toLocaleDateString("es-CO")}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(sale.fecha).toLocaleTimeString("es-CO", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </td>
                  <td className="py-4 px-4 align-top min-w-[12rem] w-[12rem]">
                    {itemCount > 0 ? (
                      <div className="flex items-start gap-2">
                        <Receipt className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" aria-hidden />
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {itemCount} producto{itemCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">—</p>
                    )}
                  </td>
                  <td className="py-4 px-4 align-top">
                    <Badge variant={sale.tipo?.toUpperCase() === "CONTADO" ? "emerald" : "amber"}>
                      {sale.tipo?.toUpperCase() ?? sale.tipo}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 align-top text-sm text-slate-600 capitalize">
                    {sale.metodo_pago?.toLowerCase() ?? sale.metodo_pago}
                  </td>
                  <td className="py-4 px-4 align-top text-sm text-slate-600">
                    {sale.cliente_nombre || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="py-4 px-4 align-top text-right">
                    <span className="text-sm font-bold text-sky-700">{formatCOP(Number(sale.total))}</span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

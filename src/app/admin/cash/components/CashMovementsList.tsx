import { formatCOP } from "@/lib/format";
import type { Movement } from "../types";
import { etiquetaMedioPagoEgreso } from "../utils/date-range";

interface CashMovementsListProps {
  movimientos: Movement[];
  periodoMultiDia: boolean;
}

export function CashMovementsList({ movimientos, periodoMultiDia }: CashMovementsListProps) {
  if (movimientos.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-800">
          {periodoMultiDia ? "Movimientos del periodo" : "Movimientos del día"}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          La fecha indicada es la del pago o movimiento (fecha contable), no el filtro de consulta.
        </p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <ul className="divide-y divide-slate-100">
          {movimientos.map((m) => (
            <li key={`${m.tipo}-${m.id}`} className="px-5 py-3 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2 flex-wrap">
                  <p className="text-sm font-medium text-slate-800 truncate min-w-0 flex-1">
                    {m.descripcion}
                  </p>
                  {m.tipo === "egreso" && (
                    <span
                      className="shrink-0 text-xs font-semibold text-sky-800 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-lg"
                      title="Medio de pago del egreso"
                    >
                      {etiquetaMedioPagoEgreso(m.medio_pago)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {periodoMultiDia && (
                    <span>
                      {new Date(m.fecha).toLocaleDateString("es-CO", {
                        day: "2-digit",
                        month: "short",
                      })}
                      {" · "}
                    </span>
                  )}
                  {new Date(m.fecha).toLocaleTimeString("es-CO", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {m.tipo === "prestamo" && m.prestamista && ` · ${m.prestamista}`}
                  {m.tipo === "egreso" && m.categoria && ` · ${m.categoria.replace(/_/g, " ")}`}
                  {m.tipo === "pago_prestamo" && m.prestamista && ` · ${m.prestamista}`}
                </p>
              </div>
              <span
                className={`text-sm font-bold shrink-0 ${
                  m.tipo === "prestamo" ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {m.tipo === "prestamo" ? "+" : "−"} {formatCOP(m.monto)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

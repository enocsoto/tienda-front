"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { formatCOP, parseLocalDate } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toast, ToastMessage } from "@/components/ui/Toast";
import { CreditCard, Clock, CheckCircle } from "lucide-react";

interface Credit {
  id: string;
  monto_original: number;
  monto_pagado: number;
  saldo_pendiente: number;
  fecha_vencimiento?: string;
  sale?: {
    id: string;
    cliente_nombre?: string;
  };
}

export default function CreditosPage() {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagoAmount, setPagoAmount] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const loadCredits = async () => {
    setLoading(true);
    try {
      const data = await fetchApi("/ventas/creditos");
      setCredits(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCredits();
  }, []);

  const handlePago = async (saleId: string, maxPago: number) => {
    const amount = Number(pagoAmount[saleId] || 0);
    if (amount <= 0 || amount > maxPago) {
      setToast({ text: "Monto inválido. Debe ser mayor a 0 y menor al saldo.", type: "error" });
      return;
    }

    try {
      await fetchApi(`/ventas/${saleId}/pago`, {
        method: "PATCH",
        body: JSON.stringify({ monto: amount }),
      });
      setToast({ text: `Abono de ${formatCOP(amount)} registrado con éxito`, type: "success" });
      setPagoAmount((prev) => ({ ...prev, [saleId]: "" }));
      loadCredits();
    } catch (err: unknown) {
      setToast({
        text: err instanceof Error ? err.message : "Error al registrar el pago",
        type: "error",
      });
    }
  };

  const totalDeuda = credits.reduce((acc, c) => acc + Number(c.saldo_pendiente), 0);

  const isVencido = (fechaStr?: string) => {
    if (!fechaStr) return false;
    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    return parseLocalDate(fechaStr) < inicioHoy;
  };

  return (
    <div className="max-w-6xl">
      <PageHeader
        title="Cuentas por Cobrar"
        subtitle={`${credits.length} créditos pendientes · Deuda total: ${formatCOP(totalDeuda)}`}
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto px-2 sm:px-4">
          <table className="w-full text-left min-w-[640px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="py-4 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Vencimiento
                </th>
                <th className="py-4 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Original
                </th>
                <th className="py-4 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Pagado
                </th>
                <th className="py-4 px-5 text-xs font-semibold text-red-500 uppercase tracking-wider">
                  Saldo
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Registrar Abono
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="py-4 px-4">
                        <div className="h-4 bg-slate-100 rounded w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : credits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <CheckCircle className="w-10 h-10 text-emerald-200 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium text-sm">
                      No hay créditos pendientes
                    </p>
                  </td>
                </tr>
              ) : (
                credits.map((c) => {
                  const vencido = isVencido(c.fecha_vencimiento);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                            <CreditCard className="w-4 h-4 text-slate-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-slate-800">
                              {c.sale?.cliente_nombre || "Cliente sin nombre"}
                            </p>
                            <p className="text-xs text-slate-400">Venta #{c.sale?.id ? String(c.sale.id).slice(-8) : "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        {c.fecha_vencimiento ? (
                          <div
                            className={`flex items-center gap-1.5 text-sm font-medium ${
                              vencido ? "text-red-600" : "text-amber-600"
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            {parseLocalDate(c.fecha_vencimiento).toLocaleDateString("es-AR")}
                            {vencido && (
                              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md font-semibold">
                                Vencido
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 text-sm">Sin fecha</span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-sm text-slate-500">
                        {formatCOP(Number(c.monto_original))}
                      </td>
                      <td className="py-4 px-5 text-sm font-medium text-emerald-600">
                        {formatCOP(Number(c.monto_pagado))}
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-sm font-bold text-red-600">
                          {formatCOP(Number(c.saldo_pendiente))}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">
                              $
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              className="w-24 pl-6 pr-3 py-1.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 transition-all"
                              value={pagoAmount[c.sale?.id ?? ""] || ""}
                              onChange={(e) =>
                                setPagoAmount({ ...pagoAmount, [c.sale?.id ?? ""]: e.target.value })
                              }
                            />
                          </div>
                          <button
                            onClick={() =>
                              c.sale?.id && handlePago(c.sale.id, Number(c.saldo_pendiente))
                            }
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-1.5 px-3.5 rounded-xl transition-colors shadow-sm"
                          >
                            Abonar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}

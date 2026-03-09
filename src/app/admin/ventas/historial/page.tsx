"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { formatCOP } from "@/lib/format";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { Toast, ToastMessage } from "@/components/ui/Toast";
import { Filter, ArrowLeft, BarChart3, FileDown, DollarSign, ShoppingCart, Package, CheckCircle2, Loader2 } from "lucide-react";

type Granularity = "daily" | "weekly" | "monthly" | "custom";

interface SaleItemDisplay {
  product?: { nombre?: string };
  cantidad?: number;
  precio_unitario?: number;
  subtotal?: number;
}

interface Sale {
  id?: string;
  _id?: string | { $oid?: string };
  fecha: string;
  tipo: string;
  metodo_pago: string;
  cliente_nombre?: string;
  cliente_telefono?: string;
  total: number;
  origen?: string;
  pago_confirmado?: boolean;
  direccion?: string;
  fecha_hora_entrega?: string;
  items?: SaleItemDisplay[];
}

interface SalesSummary {
  from: string;
  to: string;
  granularity: string;
  totalVentas: number;
  montoTotal: number;
  contado: number;
  credito: number;
  groups: Array<{ periodKey: string; periodLabel: string; total: number; count: number }>;
  topProduct: { productId: string; nombre: string; cantidadTotal: number; ingresos: number } | null;
}

function saleKey(sale: Sale, index: number): string {
  if (sale.id && typeof sale.id === "string") return sale.id;
  const raw = (sale as unknown as Record<string, unknown>)._id;
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object" && "$oid" in raw && typeof (raw as { $oid: string }).$oid === "string")
    return (raw as { $oid: string }).$oid;
  return `sale-${index}`;
}

function getDateRangeForGranularity(g: Granularity, from?: string, to?: string): { from: string; to: string } | null {
  if (g === "custom") {
    if (from && to) return { from, to };
    return null;
  }
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  let start: Date;
  let end: Date;
  switch (g) {
    case "daily": {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(start);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "weekly": {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "monthly": {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    }
    default: {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(start);
      end.setHours(23, 59, 59, 999);
    }
  }
  return {
    from: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
    to: `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`,
  };
}

export default function HistorialVentasPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [pedidosPendientes, setPedidosPendientes] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [granularity, setGranularity] = useState<Granularity>("monthly");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const dateRange = getDateRangeForGranularity(granularity, desde, hasta);
  const queryFrom = dateRange?.from ?? "";
  const queryTo = dateRange?.to ?? "";

  const loadData = useCallback(async (from: string, to: string, gran: Granularity) => {
    setLoading(true);
    try {
      const [historialData, summaryData] = await Promise.all([
        fetchApi(`/ventas/historial?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
        fetchApi(
          `/reports/sales?granularity=${gran === "custom" ? "monthly" : gran}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
        ),
      ]);
      setSales(Array.isArray(historialData) ? historialData : []);
      setSummary(summaryData as SalesSummary | null);
    } catch (err) {
      console.error(err);
      setToast({ text: err instanceof Error ? err.message : "Error al cargar datos", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPedidosPendientes = useCallback(async () => {
    try {
      const data = await fetchApi("/ventas/pedidos-pendientes-pago");
      setPedidosPendientes(Array.isArray(data) ? data : []);
    } catch {
      setPedidosPendientes([]);
    }
  }, []);

  useEffect(() => {
    loadPedidosPendientes();
  }, [loadPedidosPendientes]);

  useEffect(() => {
    if (queryFrom && queryTo) loadData(queryFrom, queryTo, granularity);
  }, [queryFrom, queryTo, granularity, loadData]);

  const handleConfirmarPago = async (saleId: string) => {
    setConfirmandoId(saleId);
    try {
      await fetchApi(`/ventas/${saleId}/confirmar-pago`, { method: "PATCH" });
      setToast({ text: "Pago confirmado correctamente", type: "success" });
      await loadPedidosPendientes();
      if (queryFrom && queryTo) loadData(queryFrom, queryTo, granularity);
    } catch (err) {
      setToast({ text: err instanceof Error ? err.message : "Error al confirmar pago", type: "error" });
    } finally {
      setConfirmandoId(null);
    }
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    if (granularity === "custom" && desde && hasta) {
      loadData(desde, hasta, "custom");
    }
  };

  const totalVentas = sales.reduce((acc, s) => acc + Number(s.total), 0);

  const handleExportPdf = async () => {
    if (!queryFrom || !queryTo) {
      setToast({ text: "Selecciona un rango de fechas para exportar", type: "error" });
      return;
    }
    setPdfLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const params = new URLSearchParams({
        granularity: granularity === "custom" ? "monthly" : granularity,
        from: queryFrom,
        to: queryTo,
      });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/reports/sales/pdf?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Error al generar el PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte-ventas-${granularity}-${queryFrom}-${queryTo}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setToast({ text: "PDF descargado correctamente", type: "success" });
    } catch (err) {
      setToast({ text: err instanceof Error ? err.message : "Error al exportar PDF", type: "error" });
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Historial de Ventas"
        subtitle={
          summary
            ? `${summary.totalVentas} ventas · Total: ${formatCOP(summary.montoTotal)}`
            : `${sales.length} ventas encontradas · Total: ${formatCOP(totalVentas)}`
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={pdfLoading || loading}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors"
            >
              <FileDown className="w-4 h-4" />
              {pdfLoading ? "Generando…" : "Exportar PDF"}
            </button>
            <Link
              href="/admin/ventas"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-sky-600 font-medium transition-colors bg-white border border-slate-200 px-4 py-2 rounded-xl hover:border-sky-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al POS
            </Link>
          </div>
        }
      />

      {pedidosPendientes.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-100 bg-amber-100/50">
            <h2 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Pedidos pendientes de confirmar pago ({pedidosPendientes.length})
            </h2>
            <p className="text-xs text-amber-700 mt-1">
              Estos pedidos no se incluyen en el balance ni reportes hasta que confirmes que recibiste el pago.
            </p>
          </div>
          <div className="divide-y divide-amber-100">
            {pedidosPendientes.map((p, index) => (
              <div
                key={saleKey(p, index)}
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
                  onClick={() => handleConfirmarPago(saleKey(p, index))}
                  disabled={confirmandoId === saleKey(p, index)}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors"
                >
                  {confirmandoId === saleKey(p, index) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {confirmandoId === saleKey(p, index) ? "Confirmando…" : "Confirmar pago"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            title="Total facturado"
            value={formatCOP(summary.montoTotal)}
            icon={DollarSign}
            variant="primary"
          />
          <StatCard
            title="Ventas"
            value={String(summary.totalVentas)}
            icon={ShoppingCart}
            subtitle={`Contado: ${summary.contado} · Crédito: ${summary.credito}`}
          />
          {summary.topProduct && (
            <StatCard
              title="Producto más vendido"
              value={summary.topProduct.nombre}
              icon={Package}
              subtitle={`${summary.topProduct.cantidadTotal} unidades · ${formatCOP(summary.topProduct.ingresos)}`}
            />
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
                onClick={() => setGranularity(g)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  granularity === g
                    ? "bg-sky-600 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-sky-200"
                }`}
              >
                {g === "daily" ? "Diario" : g === "weekly" ? "Semanal" : g === "monthly" ? "Mensual" : "Personalizado"}
              </button>
            ))}
          </div>
          {granularity === "custom" && (
            <form onSubmit={handleFilter} className="flex flex-wrap gap-3 items-end mt-3">
              <div className="flex flex-col">
                <label className="text-xs text-slate-400 mb-1 font-medium">Desde</label>
                <input
                  type="date"
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-slate-400 mb-1 font-medium">Hasta</label>
                <input
                  type="date"
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
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

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
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
                  <td colSpan={5} className="py-16 text-center">
                    <BarChart3 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium text-sm">No hay ventas en este período</p>
                  </td>
                </tr>
              ) : (
                sales.map((sale, index) => (
                  <tr key={saleKey(sale, index)} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
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
                    <td className="py-4 px-4">
                      <Badge variant={sale.tipo?.toUpperCase() === "CONTADO" ? "emerald" : "amber"}>
                        {sale.tipo?.toUpperCase() ?? sale.tipo}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-600 capitalize">
                      {sale.metodo_pago?.toLowerCase() ?? sale.metodo_pago}
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-600">
                      {sale.cliente_nombre || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm font-bold text-sky-700">{formatCOP(Number(sale.total))}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}

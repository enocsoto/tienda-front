"use client";

import { useState } from "react";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import { StatCard } from "@/components/ui/StatCard";
import { Toast, ToastMessage } from "@/components/ui/Toast";
import { ArrowLeft, TrendingUp, TrendingDown, BarChart2, Search } from "lucide-react";

interface Utilidad {
  total_ventas: number;
  total_gastos: number;
  utilidad_neta: number;
}

export default function UtilidadPage() {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [utilidad, setUtilidad] = useState<Utilidad | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const handleConsultar = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      const data = await fetchApi(`/caja/utilidad?from=${desde}&to=${hasta}`);
      setUtilidad(data);
    } catch (err: unknown) {
      setToast({ text: err instanceof Error ? err.message : "Error al consultar", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/caja"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-sky-600 font-medium transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Caja
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center">
          <BarChart2 className="w-5 h-5 text-sky-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Cálculo de Utilidades</h1>
          <p className="text-sm text-slate-500">Ventas vs. egresos y costos en un período</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
        <p className="text-sm text-slate-500 mb-5 leading-relaxed">
          El sistema cruzará todas las ventas realizadas contra los costos y gastos registrados
          en el período seleccionado para determinar tu ganancia neta.
        </p>

        <form onSubmit={handleConsultar} className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col flex-1 min-w-[150px]">
            <label className="text-sm font-medium text-slate-700 mb-1.5">Desde</label>
            <input
              type="date"
              className="px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-700 focus:bg-white focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 transition-all"
              value={desde}
              required
              onChange={(e) => setDesde(e.target.value)}
            />
          </div>
          <div className="flex flex-col flex-1 min-w-[150px]">
            <label className="text-sm font-medium text-slate-700 mb-1.5">Hasta</label>
            <input
              type="date"
              className="px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-700 focus:bg-white focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 transition-all"
              value={hasta}
              required
              onChange={(e) => setHasta(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 px-6 rounded-xl transition-colors shadow-sm disabled:opacity-60 text-sm"
          >
            <Search className="w-4 h-4" />
            {loading ? "Calculando..." : "Calcular"}
          </button>
        </form>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="h-4 bg-slate-100 rounded w-1/2 mb-3" />
              <div className="h-8 bg-slate-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      )}

      {!loading && utilidad && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard
            title="Ventas Totales"
            value={`$${Number(utilidad.total_ventas).toFixed(2)}`}
            icon={TrendingUp}
            subtitle={`Período: ${desde} — ${hasta}`}
          />
          <StatCard
            title="Egresos y Costos"
            value={`$${Number(utilidad.total_gastos).toFixed(2)}`}
            icon={TrendingDown}
            variant="danger"
            subtitle="Gastos del período"
          />
          <StatCard
            title="Utilidad Neta"
            value={`$${Number(utilidad.utilidad_neta).toFixed(2)}`}
            icon={BarChart2}
            variant={Number(utilidad.utilidad_neta) >= 0 ? "success" : "danger"}
            subtitle={Number(utilidad.utilidad_neta) >= 0 ? "Ganancia neta" : "Pérdida neta"}
          />
        </div>
      )}

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}

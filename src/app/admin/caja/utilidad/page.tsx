"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import { StatCard } from "@/components/ui/StatCard";
import { Toast, ToastMessage } from "@/components/ui/Toast";
import { formatCOP } from "@/lib/format";
import { ArrowLeft, TrendingUp, TrendingDown, BarChart2, Search, Filter, CreditCard } from "lucide-react";

type Granularity = "daily" | "weekly" | "monthly" | "custom";

interface Utilidad {
  total_ventas_contado: number;
  total_ventas_credito: number;
  total_ventas: number;
  total_gastos: number;
  utilidad_neta: number;
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

export default function UtilidadPage() {
  const [granularity, setGranularity] = useState<Granularity>("monthly");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [utilidad, setUtilidad] = useState<Utilidad | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const dateRange = getDateRangeForGranularity(granularity, desde, hasta);
  const queryFrom = dateRange?.from ?? "";
  const queryTo = dateRange?.to ?? "";

  const loadUtilidad = useCallback(async (from: string, to: string) => {
    setLoading(true);
    try {
      const data = await fetchApi(`/caja/utilidad?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
      setUtilidad(data);
    } catch (err: unknown) {
      setToast({ text: err instanceof Error ? err.message : "Error al consultar", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (queryFrom && queryTo) {
      loadUtilidad(queryFrom, queryTo);
    } else if (granularity === "custom") {
      setUtilidad(null);
    }
  }, [queryFrom, queryTo, granularity, loadUtilidad]);

  const handleConsultar = (e: React.FormEvent) => {
    e.preventDefault();
    if (granularity !== "custom") return;
    if (!desde || !hasta) {
      setToast({ text: "Selecciona las fechas desde y hasta", type: "error" });
      return;
    }
    loadUtilidad(desde, hasta);
  };

  return (
    <div className="w-full max-w-4xl">
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

        <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium w-full sm:w-auto">
            <Filter className="w-4 h-4 shrink-0" />
            Vista:
          </div>
          <div className="flex flex-wrap gap-2">
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
        </div>
        {granularity === "custom" && (
          <form onSubmit={handleConsultar} className="flex flex-wrap gap-3 items-end mt-4">
            <div className="flex flex-col">
              <label className="text-xs text-slate-400 mb-1 font-medium">Desde</label>
              <input
                type="date"
                className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-400 mb-1 font-medium">Hasta</label>
              <input
                type="date"
                className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 px-5 rounded-xl transition-colors shadow-sm disabled:opacity-60 text-sm"
            >
              <Search className="w-4 h-4" />
              {loading ? "Calculando..." : "Calcular"}
            </button>
          </form>
        )}
      </div>

      {loading && (
        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="h-4 bg-slate-100 rounded w-1/2 mb-3" />
              <div className="h-8 bg-slate-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      )}

      {!loading && utilidad && (
        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          <StatCard
            title="Ventas Contado"
            value={formatCOP(utilidad.total_ventas_contado ?? 0)}
            icon={TrendingUp}
            subtitle={`Período: ${queryFrom} — ${queryTo}`}
          />
          <StatCard
            title="Total Crédito"
            value={formatCOP(utilidad.total_ventas_credito ?? 0)}
            icon={CreditCard}
            subtitle="Ventas a crédito"
          />
          <StatCard
            title="Egresos y Costos"
            value={formatCOP(utilidad.total_gastos ?? 0)}
            icon={TrendingDown}
            variant="danger"
            subtitle="Gastos del período"
          />
          <StatCard
            title="Utilidad Neta"
            value={formatCOP(utilidad.utilidad_neta ?? 0)}
            icon={BarChart2}
            variant={Number(utilidad.utilidad_neta ?? 0) >= 0 ? "success" : "danger"}
            subtitle={Number(utilidad.utilidad_neta ?? 0) >= 0 ? "Ganancia neta" : "Pérdida neta"}
          />
        </div>
      )}

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}

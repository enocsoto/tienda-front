"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Toast, ToastMessage } from "@/components/ui/Toast";
import { formatCOP } from "@/lib/format";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  Calendar,
  BarChart2,
  Banknote,
  X,
} from "lucide-react";

interface Balance {
  base_caja?: number;
  total_ingresos: number;
  total_egresos: number;
  balance_neto: number;
}

export default function CajaPage() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [showEgreso, setShowEgreso] = useState(false);
  const [egresoDesc, setEgresoDesc] = useState("");
  const [egresoMonto, setEgresoMonto] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const loadBalance = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchApi(`/caja/balance?date=${date}`);
      setBalance(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  const handleEgreso = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetchApi("/caja/egreso", {
        method: "POST",
        body: JSON.stringify({
          descripcion: egresoDesc,
          monto: Number(egresoMonto),
        }),
      });
      setShowEgreso(false);
      setEgresoDesc("");
      setEgresoMonto("");
      setToast({ text: "Egreso registrado correctamente", type: "success" });
      loadBalance();
    } catch (err: unknown) {
      setToast({ text: err instanceof Error ? err.message : "Error al registrar egreso", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const isPositive = balance ? Number(balance.balance_neto) >= 0 : true;

  return (
    <div>
      <PageHeader
        title="Manejo de Caja"
        subtitle="Balance y egresos del día"
        actions={
          <div className="flex items-center gap-3">
            <Link
              href="/admin/caja/utilidad"
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-sky-600 bg-white border border-slate-200 hover:border-sky-200 px-4 py-2.5 rounded-xl transition-all"
            >
              <BarChart2 className="w-4 h-4" />
              Utilidades
            </Link>
            <button
              onClick={() => setShowEgreso(!showEgreso)}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 px-5 rounded-xl transition-colors shadow-sm text-sm"
            >
              <Plus className="w-4 h-4" />
              Registrar Egreso
            </button>
          </div>
        }
      />

      {/* Date selector */}
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-4 h-4 text-slate-400" />
        <label className="text-sm font-medium text-slate-600">Fecha:</label>
        <input
          type="date"
          className="px-4 py-2 border border-slate-200 rounded-xl bg-white text-slate-700 text-sm font-medium focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 transition-all"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {/* Egreso form */}
      {showEgreso && (
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6 mb-6 max-w-lg">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-red-600 flex items-center gap-2">
              <TrendingDown className="w-4.5 h-4.5" />
              Registrar Egreso
            </h3>
            <button
              onClick={() => setShowEgreso(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleEgreso} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Descripción (ej: Pago a proveedor, Luz...)"
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-900 focus:bg-white focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all"
              value={egresoDesc}
              onChange={(e) => setEgresoDesc(e.target.value)}
            />
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">
                $
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                required
                className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-900 focus:bg-white focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all"
                value={egresoMonto}
                onChange={(e) => setEgresoMonto(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEgreso(false)}
                className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl text-sm font-medium shadow-sm transition-colors disabled:opacity-60"
              >
                {saving ? "Registrando..." : "Guardar Egreso"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse"
            >
              <div className="h-4 bg-slate-100 rounded w-1/2 mb-3" />
              <div className="h-8 bg-slate-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : balance ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {balance.base_caja != null && (
            <StatCard
              title="Base de caja"
              value={formatCOP(Number(balance.base_caja))}
              icon={Banknote}
              subtitle="Inicio del día"
            />
          )}
          <StatCard
            title="Total Ingresos"
            value={formatCOP(Number(balance.total_ingresos))}
            icon={TrendingUp}
            subtitle="Ventas del día"
          />
          <StatCard
            title="Total Egresos"
            value={formatCOP(Number(balance.total_egresos))}
            icon={TrendingDown}
            variant="danger"
            subtitle="Gastos registrados"
          />
          <StatCard
            title="Balance Neto"
            value={formatCOP(Number(balance.balance_neto))}
            icon={Wallet}
            variant={isPositive ? "success" : "danger"}
            subtitle={isPositive ? "Base + ingresos − egresos" : "Resultado negativo"}
          />
        </div>
      ) : (
        <div className="text-red-500 text-sm font-medium">Error al cargar el balance.</div>
      )}

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Toast, ToastMessage } from "@/components/ui/Toast";
import { fechaLocalYMD, formatCOP } from "@/lib/format";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  Calendar,
  BarChart2,
  Banknote,
  X,
  HandCoins,
  Smartphone,
  Filter,
  Send,
} from "lucide-react";

type Granularity = "daily" | "weekly" | "monthly" | "custom";

interface Balance {
  base_caja?: number;
  base_caja_diaria?: number;
  dias_en_periodo?: number;
  fecha?: string;
  fecha_hasta?: string;
  total_ventas?: number;
  total_ventas_nequi_transferencia?: number;
  total_prestamos?: number;
  total_ingresos: number;
  total_egresos: number;
  total_egresos_nequi_transferencia?: number;
  balance_neto: number;
}

interface Movement {
  tipo: "egreso" | "prestamo" | "pago_prestamo";
  id: string;
  monto: number;
  descripcion: string;
  fecha: string;
  categoria?: string;
  medio_pago?: string;
  prestamista?: string;
}

function etiquetaMedioPagoEgreso(medio?: string): string {
  if (medio === "NEQUI") return "Nequi";
  if (medio === "TRANSFERENCIA") return "Transferencia";
  return "Efectivo";
}

function getDateRangeForGranularity(
  g: Granularity,
  dayForDaily: string,
  from?: string,
  to?: string
): { from: string; to: string } | null {
  if (g === "custom") {
    if (from && to) return { from, to };
    return null;
  }
  if (g === "daily") {
    if (!dayForDaily) return null;
    return { from: dayForDaily, to: dayForDaily };
  }
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  let start: Date;
  let end: Date;
  switch (g) {
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

export default function CajaPage() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);
  const [granularity, setGranularity] = useState<Granularity>("daily");
  const [date, setDate] = useState(() => fechaLocalYMD());
  const [desde, setDesde] = useState(() => fechaLocalYMD());
  const [hasta, setHasta] = useState(() => fechaLocalYMD());

  const [showEgreso, setShowEgreso] = useState(false);
  const [showPrestamo, setShowPrestamo] = useState(false);
  const [egresoDesc, setEgresoDesc] = useState("");
  const [egresoMonto, setEgresoMonto] = useState("");
  const [egresoCategoria, setEgresoCategoria] = useState("");
  const [egresoMedioPago, setEgresoMedioPago] = useState<"NEQUI" | "TRANSFERENCIA" | "EFECTIVO">("EFECTIVO");
  /** Día contable del egreso (antes se tomaba solo el fin del período del filtro). */
  const [egresoFecha, setEgresoFecha] = useState("");
  const [prestamoDesc, setPrestamoDesc] = useState("");
  const [prestamoFecha, setPrestamoFecha] = useState("");
  const [prestamoMonto, setPrestamoMonto] = useState("");
  const [prestamoPrestamista, setPrestamoPrestamista] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [movimientos, setMovimientos] = useState<Movement[]>([]);

  const dateRange = getDateRangeForGranularity(granularity, date, desde, hasta);
  const queryFrom = dateRange?.from ?? "";
  const queryTo = dateRange?.to ?? "";

  const loadBalance = useCallback(async () => {
    if (!queryFrom || !queryTo) return;
    setLoading(true);
    try {
      const qs = `from=${encodeURIComponent(queryFrom)}&to=${encodeURIComponent(queryTo)}`;
      const [balanceData, movimientosData] = await Promise.all([
        fetchApi(`/caja/balance?${qs}`),
        fetchApi(`/caja/movimientos?${qs}`),
      ]);
      setBalance(balanceData);
      setMovimientos(Array.isArray(movimientosData) ? movimientosData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [queryFrom, queryTo]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  /** Respaldo si el formulario no trae fecha (no debería ocurrir). */
  const fechaRegistroMovimiento = queryTo || date || fechaLocalYMD();

  const handleEgreso = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetchApi("/caja/egreso", {
        method: "POST",
        body: JSON.stringify({
          descripcion: egresoDesc,
          monto: Number(egresoMonto),
          fecha: egresoFecha || fechaRegistroMovimiento,
          categoria: egresoCategoria || undefined,
          medio_pago: egresoMedioPago,
        }),
      });
      setShowEgreso(false);
      setEgresoDesc("");
      setEgresoMonto("");
      setEgresoCategoria("");
      setEgresoMedioPago("EFECTIVO");
      setToast({ text: "Egreso registrado correctamente", type: "success" });
      await loadBalance();
    } catch (err: unknown) {
      setToast({ text: err instanceof Error ? err.message : "Error al registrar egreso", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handlePrestamo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetchApi("/caja/prestamo", {
        method: "POST",
        body: JSON.stringify({
          descripcion: prestamoDesc,
          monto: Number(prestamoMonto),
          fecha: prestamoFecha || fechaRegistroMovimiento,
          prestamista: prestamoPrestamista || undefined,
        }),
      });
      setShowPrestamo(false);
      setPrestamoDesc("");
      setPrestamoMonto("");
      setPrestamoPrestamista("");
      setToast({ text: "Préstamo registrado correctamente", type: "success" });
      await loadBalance();
    } catch (err: unknown) {
      setToast({ text: err instanceof Error ? err.message : "Error al registrar préstamo", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const isPositive = balance ? Number(balance.balance_neto) >= 0 : true;
  const periodoMultiDia = Boolean(queryFrom && queryTo && queryFrom !== queryTo);
  const etiquetaVentasPeriodo = periodoMultiDia ? "Ventas del periodo" : "Ventas del día";
  const subtituloBase =
    "Monto fijo de referencia — no se multiplica por días (diario, semanal o mensual)";

  return (
    <div>
      <PageHeader
        title="Manejo de Caja"
        subtitle={
          queryFrom && queryTo && queryFrom !== queryTo
            ? `Balance y egresos del periodo (${queryFrom} → ${queryTo})`
            : "Balance y egresos del día"
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/cash/profit"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-sky-600 bg-white border border-slate-200 hover:border-sky-200 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap"
            >
              <BarChart2 className="w-4 h-4 shrink-0" />
              Utilidades
            </Link>
            <button
              type="button"
              onClick={() => {
                if (!showPrestamo) {
                  setPrestamoFecha(queryTo || date || fechaLocalYMD());
                }
                setShowPrestamo((v) => !v);
              }}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2.5 px-4 sm:px-5 rounded-xl transition-colors shadow-sm text-sm whitespace-nowrap"
            >
              <HandCoins className="w-4 h-4 shrink-0" />
              Registrar Préstamo
            </button>
            <button
              type="button"
              onClick={() => {
                if (!showEgreso) {
                  setEgresoFecha(queryTo || date || fechaLocalYMD());
                }
                setShowEgreso((v) => !v);
              }}
              className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 px-4 sm:px-5 rounded-xl transition-colors shadow-sm text-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4 shrink-0" />
              Registrar Egreso
            </button>
          </div>
        }
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
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
          {granularity === "daily" && (
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <Calendar className="w-4 h-4 text-slate-400" />
              <label className="text-sm font-medium text-slate-600">Día:</label>
              <input
                type="date"
                className="px-4 py-2 border border-slate-200 rounded-xl bg-white text-slate-700 text-sm font-medium focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 transition-all"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          )}
          {granularity === "custom" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                loadBalance();
              }}
              className="flex flex-wrap gap-3 items-end mt-3"
            >
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
      </div>

      {/* Préstamo form */}
      {showPrestamo && (
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-6 mb-6 max-w-lg">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-emerald-600 flex items-center gap-2">
              <HandCoins className="w-4.5 h-4.5" />
              Registrar Préstamo Recibido
            </h3>
            <button
              onClick={() => setShowPrestamo(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handlePrestamo} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5" htmlFor="caja-prestamo-fecha">
                Fecha del movimiento
              </label>
              <input
                id="caja-prestamo-fecha"
                type="date"
                required
                value={prestamoFecha}
                onChange={(e) => setPrestamoFecha(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-900 focus:bg-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
              />
            </div>
            <input
              type="text"
              placeholder="Descripción (ej: Préstamo para compra de inventario)"
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-900 focus:bg-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
              value={prestamoDesc}
              onChange={(e) => setPrestamoDesc(e.target.value)}
            />
            <input
              type="text"
              placeholder="Prestamista (opcional)"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-900 focus:bg-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
              value={prestamoPrestamista}
              onChange={(e) => setPrestamoPrestamista(e.target.value)}
            />
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">
                $
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                required
                className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-900 focus:bg-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
                value={prestamoMonto}
                onChange={(e) => setPrestamoMonto(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPrestamo(false)}
                className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-medium shadow-sm transition-colors disabled:opacity-60"
              >
                {saving ? "Registrando..." : "Guardar Préstamo"}
              </button>
            </div>
          </form>
        </div>
      )}

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
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5" htmlFor="caja-egreso-fecha">
                Fecha del pago
              </label>
              <input
                id="caja-egreso-fecha"
                type="date"
                required
                value={egresoFecha}
                onChange={(e) => setEgresoFecha(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-900 focus:bg-white focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all"
              />
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Es el día en que se realizó el pago. La lista de movimientos muestra esta fecha (no el
                rango del filtro de arriba).
              </p>
            </div>
            <select
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-900 focus:bg-white focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all"
              value={egresoCategoria}
              onChange={(e) => setEgresoCategoria(e.target.value)}
            >
              <option value="">Categoría (opcional)</option>
              <option value="PROVEEDOR">Proveedor</option>
              <option value="SERVICIOS">Servicios</option>
              <option value="PAGO_PRESTAMO">Pago de préstamo</option>
              <option value="OTROS">Otros</option>
            </select>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Medio de pago</label>
              <select
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-900 focus:bg-white focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all"
                value={egresoMedioPago}
                onChange={(e) =>
                  setEgresoMedioPago(e.target.value as "NEQUI" | "TRANSFERENCIA" | "EFECTIVO")
                }
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="NEQUI">Nequi</option>
                <option value="TRANSFERENCIA">Transferencia</option>
              </select>
              <p className="text-xs text-slate-400 mt-1.5">
                Pagos a proveedor por Nequi o transferencia cuentan en el KPI de egresos digitales.
              </p>
            </div>
            <input
              type="text"
              placeholder="Descripción (ej: Pago a proveedor, Pago de préstamo...)"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 7 }).map((_, i) => (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {balance.base_caja != null && (
            <StatCard
              title="Base de caja"
              value={formatCOP(Number(balance.base_caja))}
              icon={Banknote}
              variant="primary"
              subtitle={subtituloBase}
            />
          )}
          <StatCard
            title="Ventas"
            value={formatCOP(Number(balance.total_ventas ?? balance.total_ingresos))}
            icon={TrendingUp}
            variant="success"
            subtitle={etiquetaVentasPeriodo}
          />
          <StatCard
            title="Nequi / Transferencia"
            value={formatCOP(Number(balance.total_ventas_nequi_transferencia ?? 0))}
            icon={Smartphone}
            variant="violet"
            subtitle="Ingresos por ventas digitales"
          />
          <StatCard
            title="Egresos Nequi / Transf."
            value={formatCOP(Number(balance.total_egresos_nequi_transferencia ?? 0))}
            icon={Send}
            variant="danger"
            subtitle="Solo egresos marcados Nequi o transferencia (no efectivo)"
          />
          <StatCard
            title="Préstamos recibidos"
            value={formatCOP(Number(balance.total_prestamos ?? 0))}
            icon={HandCoins}
            variant="amber"
            subtitle={periodoMultiDia ? "Préstamos del periodo" : "Préstamos del día"}
          />
          <StatCard
            title="Total Egresos"
            value={formatCOP(Number(balance.total_egresos))}
            icon={TrendingDown}
            variant="danger"
            subtitle="Todos los egresos (efectivo + Nequi / transf.) y pagos a préstamos"
          />
          <StatCard
            title="Balance Neto"
            value={formatCOP(Number(balance.balance_neto))}
            icon={Wallet}
            variant={isPositive ? "success" : "danger"}
            subtitle={
              isPositive
                ? `${formatCOP(Number(balance.base_caja_diaria ?? 150_000))} fijos + ventas + préstamos − egresos (la base no suma por días)`
                : "Resultado negativo"
            }
          />
        </div>
      ) : (
        <div className="text-red-500 text-sm font-medium">Error al cargar el balance.</div>
      )}

      {/* Movimientos del periodo */}
      {!loading && movimientos.length > 0 && (
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
                      <p className="text-sm font-medium text-slate-800 truncate min-w-0 flex-1">{m.descripcion}</p>
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
                        <span>{new Date(m.fecha).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}{" · "}</span>
                      )}
                      {new Date(m.fecha).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
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
      )}

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}

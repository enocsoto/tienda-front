"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toast } from "@/components/ui/Toast";
import { BarChart2, HandCoins, Plus } from "lucide-react";
import { useCashPage } from "./hooks/useCashPage";
import { CashFilters } from "./components/CashFilters";
import { CashBalanceStats } from "./components/CashBalanceStats";
import { CashMovementsList } from "./components/CashMovementsList";
import { EgresoForm, PrestamoForm } from "./components/CashForms";

export default function CajaPage() {
  const c = useCashPage();

  const subtitle =
    c.queryFrom && c.queryTo && c.queryFrom !== c.queryTo
      ? `Balance y egresos del periodo (${c.queryFrom} → ${c.queryTo})`
      : "Balance y egresos del día";

  return (
    <div>
      <PageHeader
        title="Manejo de Caja"
        subtitle={subtitle}
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
              onClick={c.openPrestamo}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2.5 px-4 sm:px-5 rounded-xl transition-colors shadow-sm text-sm whitespace-nowrap"
            >
              <HandCoins className="w-4 h-4 shrink-0" />
              Registrar Préstamo
            </button>
            <button
              type="button"
              onClick={c.openEgreso}
              className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 px-4 sm:px-5 rounded-xl transition-colors shadow-sm text-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4 shrink-0" />
              Registrar Egreso
            </button>
          </div>
        }
      />

      <CashFilters
        granularity={c.granularity}
        onGranularityChange={c.setGranularity}
        date={c.date}
        onDateChange={c.setDate}
        desde={c.desde}
        hasta={c.hasta}
        onDesdeChange={c.setDesde}
        onHastaChange={c.setHasta}
        onCustomSubmit={(e) => {
          e.preventDefault();
          c.loadBalance();
        }}
      />

      {c.showPrestamo && (
        <PrestamoForm
          prestamoDesc={c.prestamoDesc}
          setPrestamoDesc={c.setPrestamoDesc}
          prestamoFecha={c.prestamoFecha}
          setPrestamoFecha={c.setPrestamoFecha}
          prestamoMonto={c.prestamoMonto}
          setPrestamoMonto={c.setPrestamoMonto}
          prestamoPrestamista={c.prestamoPrestamista}
          setPrestamoPrestamista={c.setPrestamoPrestamista}
          saving={c.saving}
          onClose={() => c.setShowPrestamo(false)}
          onSubmit={c.handlePrestamo}
        />
      )}

      {c.showEgreso && (
        <EgresoForm
          egresoDesc={c.egresoDesc}
          setEgresoDesc={c.setEgresoDesc}
          egresoMonto={c.egresoMonto}
          setEgresoMonto={c.setEgresoMonto}
          egresoCategoria={c.egresoCategoria}
          setEgresoCategoria={c.setEgresoCategoria}
          egresoMedioPago={c.egresoMedioPago}
          setEgresoMedioPago={c.setEgresoMedioPago}
          egresoFecha={c.egresoFecha}
          setEgresoFecha={c.setEgresoFecha}
          saving={c.saving}
          onClose={() => c.setShowEgreso(false)}
          onSubmit={c.handleEgreso}
        />
      )}

      <CashBalanceStats
        balance={c.balance}
        loading={c.loading}
        periodoMultiDia={c.periodoMultiDia}
        isPositive={c.isPositive}
      />

      {!c.loading && (
        <CashMovementsList movimientos={c.movimientos} periodoMultiDia={c.periodoMultiDia} />
      )}

      <Toast message={c.toast} onClose={() => c.setToast(null)} />
    </div>
  );
}

"use client";

import Link from "next/link";
import { formatCOP } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Toast } from "@/components/ui/Toast";
import { ArrowLeft, FileDown, DollarSign, ShoppingCart, Package } from "lucide-react";
import { useSalesHistory } from "./hooks/useSalesHistory";
import { PendingOrdersBanner } from "./components/PendingOrdersBanner";
import { SalesFilters } from "./components/SalesFilters";
import { SalesHistoryTable } from "./components/SalesHistoryTable";
import { SaleDetailModal } from "./components/SaleDetailModal";

export default function HistorialVentasPage() {
  const h = useSalesHistory();

  const subtitle = h.summary
    ? `${h.summary.totalVentas} ventas · Total: ${formatCOP(h.summary.montoTotal)}`
    : `${h.sales.length} ventas encontradas · Total: ${formatCOP(h.totalVentas)}`;

  return (
    <div>
      <PageHeader
        title="Historial de Ventas"
        subtitle={subtitle}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={h.handleExportPdf}
              disabled={h.pdfLoading || h.loading}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors"
            >
              <FileDown className="w-4 h-4" />
              {h.pdfLoading ? "Generando…" : "Exportar PDF"}
            </button>
            <Link
              href="/admin/sales"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-sky-600 font-medium transition-colors bg-white border border-slate-200 px-4 py-2 rounded-xl hover:border-sky-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al POS
            </Link>
          </div>
        }
      />

      <PendingOrdersBanner
        pedidos={h.pedidosPendientes}
        confirmandoId={h.confirmandoId}
        onConfirmarPago={h.handleConfirmarPago}
      />

      {h.summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            title="Total facturado"
            value={formatCOP(h.summary.montoTotal)}
            icon={DollarSign}
            variant="primary"
          />
          <StatCard
            title="Ventas"
            value={String(h.summary.totalVentas)}
            icon={ShoppingCart}
            subtitle={`Contado: ${h.summary.contado} · Crédito: ${h.summary.credito}`}
          />
          {h.summary.topProduct && (
            <StatCard
              title="Producto más vendido"
              value={h.summary.topProduct.nombre}
              icon={Package}
              subtitle={`${h.summary.topProduct.cantidadTotal} unidades · ${formatCOP(h.summary.topProduct.ingresos)}`}
            />
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <SalesFilters
          granularity={h.granularity}
          onGranularityChange={h.setGranularity}
          desde={h.desde}
          hasta={h.hasta}
          onDesdeChange={h.setDesde}
          onHastaChange={h.setHasta}
          onFilterSubmit={h.handleFilter}
        />
        <SalesHistoryTable
          sales={h.sales}
          loading={h.loading}
          onSelectSale={h.setDetailSale}
        />
      </div>

      <SaleDetailModal sale={h.detailSale} onClose={() => h.setDetailSale(null)} />
      <Toast message={h.toast} onClose={() => h.setToast(null)} />
    </div>
  );
}

"use client";

import Link from "next/link";
import { Plus, Upload, FolderTree, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toast } from "@/components/ui/Toast";
import { PAGE_SIZE } from "./types";
import { useInventoryList } from "./hooks/useInventoryList";
import { InventoryAlerts } from "./components/InventoryAlerts";
import { InactiveBanner } from "./components/InventoryAlerts";
import { InventoryToolbar } from "./components/InventoryToolbar";
import { InventoryTable } from "./components/InventoryTable";
import { ImportExcelModal } from "./components/ImportExcelModal";

export default function InventarioPage() {
  const inv = useInventoryList();

  const subtitle = inv.showInactiveOnly
    ? `${inv.total} producto${inv.total !== 1 ? "s" : ""} inactivo${inv.total !== 1 ? "s" : ""}`
    : inv.total <= PAGE_SIZE
      ? `${inv.total} producto${inv.total !== 1 ? "s" : ""} activo${inv.total !== 1 ? "s" : ""}`
      : `${inv.fromItem}-${inv.toItem} de ${inv.total} productos activos`;

  return (
    <div>
      <PageHeader
        title="Inventario"
        subtitle={subtitle}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {inv.isAdmin && (
              <Link
                href="/admin/inventory/categories"
                className="flex items-center gap-2 border border-slate-200 text-slate-700 hover:border-sky-200 hover:text-sky-700 bg-white font-medium py-2.5 px-5 rounded-xl transition-colors shadow-sm text-sm"
              >
                <FolderTree className="w-4 h-4" />
                Categorías
              </Link>
            )}
            {inv.isAdmin && (
              <button
                type="button"
                onClick={inv.openImport}
                className="flex items-center gap-2 border border-sky-600 text-sky-600 hover:bg-sky-50 font-medium py-2.5 px-5 rounded-xl transition-colors shadow-sm text-sm"
              >
                <Upload className="w-4 h-4" />
                Importar Excel/CSV
              </button>
            )}
            <Link
              href="/admin/inventory/new"
              className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 px-5 rounded-xl transition-colors shadow-sm text-sm"
            >
              <Plus className="w-4 h-4" />
              Nuevo Producto
            </Link>
          </div>
        }
      />

      {inv.loadError && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          <span className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="h-4 w-4" />
            {inv.loadError}
          </span>
          <button
            type="button"
            onClick={() => inv.loadProducts(inv.search, inv.page)}
            className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      <InventoryAlerts
        showInactiveOnly={inv.showInactiveOnly}
        lowStock={inv.lowStock}
        outOfStock={inv.outOfStock}
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {inv.showInactiveOnly && <InactiveBanner />}

        <InventoryToolbar
          search={inv.search}
          onSearchChange={inv.handleSearchChange}
          isAdmin={inv.isAdmin}
          showInactiveOnly={inv.showInactiveOnly}
          onToggleInactive={inv.toggleInactiveView}
          page={inv.page}
          totalPages={inv.totalPages}
          loading={inv.loading}
          onPrevPage={() => inv.goToPage(Math.max(1, inv.page - 1))}
          onNextPage={() => inv.goToPage(Math.min(inv.totalPages, inv.page + 1))}
        />

        <InventoryTable
          products={inv.products}
          loading={inv.loading}
          isAdmin={inv.isAdmin}
          showInactiveOnly={inv.showInactiveOnly}
          sortBy={inv.sortBy}
          sortOrder={inv.sortOrder}
          gananciaGlobal={inv.gananciaGlobal}
          deletingId={inv.deletingId}
          reactivatingId={inv.reactivatingId}
          listQuery={inv.listQuery}
          onSort={inv.handleSort}
          onDeactivate={inv.handleDeactivate}
          onReactivate={inv.handleReactivate}
        />
      </div>

      <ImportExcelModal
        open={inv.importOpen}
        importing={inv.importing}
        importResult={inv.importResult}
        fileInputRef={inv.fileInputRef}
        onClose={inv.closeImport}
        onSubmit={inv.handleImportSubmit}
        onFileChange={() => inv.importResult && inv.setImportResult(null)}
      />

      <Toast message={inv.toast} onClose={() => inv.setToast(null)} />
    </div>
  );
}

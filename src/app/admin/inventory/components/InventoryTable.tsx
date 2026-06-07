import Link from "next/link";
import { ChevronUp, ChevronDown, Pencil, Ban, RotateCcw, Package } from "lucide-react";
import { formatCOP } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { inventoryListQueryString, type InventoryListQuery } from "@/lib/inventory";
import { textoPorcentajeVenta } from "../utils/margin-display";
import type { Product, SortField, SortOrder } from "../types";

interface SortHeaderProps {
  field: SortField;
  label: string;
  className?: string;
  sortBy: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
}

function SortHeader({ field, label, className, sortBy, sortOrder, onSort }: SortHeaderProps) {
  return (
    <th className={className}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-1 w-full text-left hover:text-sky-600 transition-colors"
      >
        {label}
        {sortBy === field ? (
          sortOrder === "ASC" ? (
            <ChevronUp className="w-3.5 h-3.5 text-sky-500" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-sky-500" />
          )
        ) : (
          <span className="w-3.5 h-3.5 opacity-30" aria-hidden />
        )}
      </button>
    </th>
  );
}

interface InventoryTableProps {
  products: Product[];
  loading: boolean;
  isAdmin: boolean;
  showInactiveOnly: boolean;
  sortBy: SortField;
  sortOrder: SortOrder;
  gananciaGlobal: number | null;
  deletingId: string | null;
  reactivatingId: string | null;
  listQuery: () => InventoryListQuery;
  onSort: (field: SortField) => void;
  onDeactivate: (e: React.MouseEvent, product: Product) => void;
  onReactivate: (e: React.MouseEvent, product: Product) => void;
}

export function InventoryTable({
  products,
  loading,
  isAdmin,
  showInactiveOnly,
  sortBy,
  sortOrder,
  gananciaGlobal,
  deletingId,
  reactivatingId,
  listQuery,
  onSort,
  onDeactivate,
  onReactivate,
}: InventoryTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            <SortHeader
              className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider"
              field="nombre"
              label="Producto"
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={onSort}
            />
            <SortHeader
              className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider"
              field="categoria"
              label="Categoría"
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={onSort}
            />
            <SortHeader
              className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider"
              field="costo"
              label="Costo"
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={onSort}
            />
            <th
              className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right"
              title="Por defecto: margen global del sistema. Si P. venta fue editado a mano, muestra el % real (precio vs costo)."
            >
              % Venta
            </th>
            <SortHeader
              className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider"
              field="precio_venta"
              label="P. Venta"
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={onSort}
            />
            <SortHeader
              className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider"
              field="stock_actual"
              label="Cantidad"
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={onSort}
            />
            <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Unidad
            </th>
            {isAdmin && (
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                Acción
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="py-4 px-6">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                </td>
                <td className="py-4 px-4">
                  <div className="h-5 bg-slate-100 rounded-full w-20" />
                </td>
                <td className="py-4 px-4">
                  <div className="h-4 bg-slate-100 rounded w-16" />
                </td>
                <td className="py-4 px-4">
                  <div className="h-4 bg-slate-100 rounded w-12 ml-auto" />
                </td>
                <td className="py-4 px-4">
                  <div className="h-4 bg-slate-100 rounded w-16" />
                </td>
                <td className="py-4 px-4">
                  <div className="h-4 bg-slate-100 rounded w-10" />
                </td>
                <td className="py-4 px-4">
                  <div className="h-4 bg-slate-100 rounded w-14" />
                </td>
                {isAdmin && <td className="py-4 px-4" />}
              </tr>
            ))
          ) : products.length === 0 ? (
            <tr>
              <td colSpan={isAdmin ? 8 : 7} className="py-16 text-center">
                <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 font-medium text-sm">
                  {showInactiveOnly ? "No hay productos inactivos" : "No hay productos registrados"}
                </p>
              </td>
            </tr>
          ) : (
            products.map((p) => {
              const pctVenta = textoPorcentajeVenta(p.costo, p.precio_venta, gananciaGlobal);
              return (
                <tr
                  key={p.id}
                  className={`transition-colors ${
                    showInactiveOnly
                      ? "bg-slate-50/40 hover:bg-slate-100/60"
                      : "hover:bg-slate-50/60"
                  }`}
                >
                  <td className="py-4 px-6">
                    <p className="font-semibold text-slate-800 text-sm">{p.nombre}</p>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant="sky">{p.categoria}</Badge>
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-600">{formatCOP(p.costo)}</td>
                  <td
                    className="py-4 px-4 text-sm text-slate-600 text-right tabular-nums"
                    title={pctVenta.title}
                  >
                    {pctVenta.texto}
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-semibold text-sm text-sky-700">
                      {formatCOP(p.precio_venta)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {p.stock_actual === 0 ? (
                      <Badge variant="red">Sin producto</Badge>
                    ) : p.stock_actual <= 5 ? (
                      <Badge variant="amber">{p.stock_actual} bajo</Badge>
                    ) : (
                      <span className="text-sm font-medium text-slate-700">{p.stock_actual}</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-600">{p.unidad ?? "unidad"}</td>
                  {isAdmin && (
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {showInactiveOnly ? (
                          <button
                            type="button"
                            onClick={(e) => onReactivate(e, p)}
                            disabled={reactivatingId === p.id}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                            title="Reactivar producto"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Reactivar
                          </button>
                        ) : (
                          <>
                            <Link
                              href={`/admin/inventory/edit/${p.id}${inventoryListQueryString(listQuery())}`}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <Pencil className="w-3 h-3" />
                              Editar
                            </Link>
                            <button
                              type="button"
                              onClick={(e) => onDeactivate(e, p)}
                              disabled={deletingId === p.id}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                              title="Desactivar producto"
                            >
                              <Ban className="w-3 h-3" />
                              Desactivar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

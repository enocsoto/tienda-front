"use client";

import Image from "next/image";
import { formatCOP } from "@/lib/format";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Package,
  Loader2,
} from "lucide-react";
import { isUnidadDecimal, type Product } from "../types";

interface CatalogGridProps {
  productos: Product[];
  loading: boolean;
  searchInput: string;
  onSearchInputChange: (v: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  page: number;
  totalPages: number;
  totalProductos: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onAddToCart: (product: Product) => void;
}

export function CatalogGrid({
  productos,
  loading,
  searchInput,
  onSearchInputChange,
  onSearchSubmit,
  page,
  totalPages,
  totalProductos,
  onPrevPage,
  onNextPage,
  onAddToCart,
}: CatalogGridProps) {
  return (
    <section className="flex-1 min-w-0 order-2">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Productos</h2>
      <form onSubmit={onSearchSubmit} className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none"
            aria-label="Buscar producto"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700 transition-colors"
          >
            Buscar
          </button>
        </div>
      </form>
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {productos.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-4 bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
              >
                <div className="relative w-16 h-16 shrink-0 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center">
                  {p.imagen ? (
                    <Image
                      src={p.imagen}
                      alt={p.nombre}
                      fill
                      className="object-cover"
                      sizes="64px"
                      unoptimized
                    />
                  ) : (
                    <Package className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 truncate">{p.nombre}</p>
                  <p className="text-sm text-slate-500">{p.categoria}</p>
                  <p className="text-sky-600 font-semibold mt-0.5">
                    {formatCOP(p.precio_venta)}
                    {isUnidadDecimal(p.unidad) && (
                      <span className="text-slate-500 font-normal text-xs"> /g</span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onAddToCart(p)}
                  disabled={p.stock_actual <= 0}
                  className="shrink-0 flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </button>
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
              <p className="text-sm text-slate-600">
                Página {page} de {totalPages}
                {totalProductos > 0 && <span className="ml-1">({totalProductos} productos)</span>}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onPrevPage}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={onNextPage}
                  disabled={page >= totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  aria-label="Página siguiente"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

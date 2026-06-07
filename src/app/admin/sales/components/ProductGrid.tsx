"use client";

import Image from "next/image";
import { formatCOP } from "@/lib/format";
import { Search, ArrowRight, Package } from "lucide-react";
import { getUnidadSufijo, isUnidadDecimal, type CartItem, type Product } from "../types";

interface ProductGridProps {
  products: Product[];
  cart: CartItem[];
  search: string;
  onSearchChange: (v: string) => void;
  onAddToCart: (product: Product) => void;
  onGoCheckout: () => void;
}

export function ProductGrid({
  products,
  cart,
  search,
  onSearchChange,
  onAddToCart,
  onGoCheckout,
}: ProductGridProps) {
  return (
    <div className="flex-1 flex flex-col gap-4 min-w-0">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Punto de Venta</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{products.length} productos</span>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={onGoCheckout}
              className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm px-4 py-2 rounded-xl shadow-sm transition-colors"
            >
              Siguiente
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar producto..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:border-sky-400 focus:outline-none focus:ring-3 focus:ring-sky-100 transition-all shadow-sm"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 pb-4">
          {products.map((p) => {
            const inCart = cart.find((c) => c.id === p.id);
            return (
              <button
                key={p.id}
                onClick={() => onAddToCart(p)}
                disabled={p.stock_actual <= 0}
                className={`relative p-4 rounded-2xl flex items-stretch gap-3 text-left transition-all border ${
                  p.stock_actual <= 0
                    ? "bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed"
                    : inCart
                      ? "bg-sky-600 border-sky-600 text-white shadow-md shadow-sky-200"
                      : "bg-white border-slate-200 hover:border-sky-300 hover:shadow-md hover:shadow-sky-100 active:scale-95"
                }`}
              >
                <div
                  className={`relative w-14 h-14 shrink-0 rounded-xl overflow-hidden flex items-center justify-center ${
                    inCart ? "bg-white/20" : "bg-slate-100"
                  }`}
                >
                  {p.imagen ? (
                    <Image
                      src={p.imagen}
                      alt={p.nombre}
                      fill
                      className="object-cover"
                      sizes="56px"
                      unoptimized
                    />
                  ) : (
                    <Package className={`w-7 h-7 ${inCart ? "text-white/70" : "text-slate-400"}`} />
                  )}
                </div>
                <div className="min-w-0 flex-1 flex flex-col py-0.5">
                  {inCart && (
                    <span className="absolute top-2.5 right-2.5 min-w-[1.25rem] h-5 px-1 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">
                      {isUnidadDecimal(inCart.unidad ?? p.unidad)
                        ? `${inCart.cantidad % 1 === 0 ? inCart.cantidad : inCart.cantidad.toFixed(2)}${getUnidadSufijo(inCart.unidad ?? p.unidad).trim()}`
                        : inCart.cantidad}
                    </span>
                  )}
                  <h3
                    className={`font-semibold text-sm leading-tight mb-1 ${
                      inCart ? "text-white" : "text-slate-800"
                    }`}
                  >
                    {p.nombre}
                  </h3>
                  <p className={`font-bold text-lg mt-auto ${inCart ? "text-white" : "text-sky-600"}`}>
                    {formatCOP(p.precio_venta)}
                  </p>
                  <p className={`text-xs mt-0.5 ${inCart ? "text-white/70" : "text-slate-400"}`}>
                    {p.stock_actual <= 0
                      ? "Sin producto"
                      : p.stock_actual <= 5
                        ? `⚠ ${isUnidadDecimal(p.unidad) ? `${p.stock_actual}${getUnidadSufijo(p.unidad)}` : p.stock_actual} restantes`
                        : `Cantidad: ${isUnidadDecimal(p.unidad) ? `${p.stock_actual}${getUnidadSufijo(p.unidad)}` : p.stock_actual}`}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { formatCOP } from "@/lib/format";
import { ShoppingCart, Plus, Minus } from "lucide-react";
import { isUnidadDecimal, type CartEntry } from "../types";

interface CartPanelProps {
  cart: CartEntry[];
  totalCarrito: number;
  onContinue: () => void;
  onUpdateCantidad: (productId: string, delta: number) => void;
  onSetCantidadDirect: (productId: string, value: number) => void;
  onRemove: (productId: string) => void;
  compact?: boolean;
}

function CartItemRow({
  e,
  compact,
  onUpdateCantidad,
  onSetCantidadDirect,
  onRemove,
}: {
  e: CartEntry;
  compact?: boolean;
  onUpdateCantidad: (productId: string, delta: number) => void;
  onSetCantidadDirect: (productId: string, value: number) => void;
  onRemove: (productId: string) => void;
}) {
  const btnSize = compact ? "w-7 h-7" : "w-8 h-8";
  const iconSize = compact ? "w-3 h-3" : "w-4 h-4";
  const inputWidth = compact ? "w-9 text-xs py-0.5" : "w-12 text-sm py-1";

  return (
    <li className={`px-4 ${compact ? "py-2" : "py-3"} flex items-center gap-2`}>
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-slate-900 truncate ${compact ? "text-sm" : ""}`}>
          {e.product.nombre}
        </p>
        <p className={`text-sky-600 ${compact ? "text-xs" : "text-xs"}`}>
          {formatCOP(e.product.precio_venta * e.cantidad)}
        </p>
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          onClick={() => onUpdateCantidad(e.product.id, -1)}
          className={`${btnSize} rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors`}
          aria-label="Disminuir cantidad"
        >
          <Minus className={iconSize} />
        </button>
        <input
          type="number"
          min={1}
          max={e.product.stock_actual}
          step={isUnidadDecimal(e.product.unidad) ? 10 : 1}
          value={
            isUnidadDecimal(e.product.unidad)
              ? e.cantidad % 1 === 0
                ? e.cantidad
                : e.cantidad.toFixed(1)
              : e.cantidad
          }
          onChange={(ev) => {
            const v = ev.target.value;
            const num = isUnidadDecimal(e.product.unidad)
              ? parseFloat(v) || 0
              : Math.floor(parseFloat(v) || 0);
            onSetCantidadDirect(e.product.id, num);
          }}
          className={`${inputWidth} text-center font-medium tabular-nums border border-slate-200 rounded-lg px-1 focus:border-sky-400 focus:ring-1 focus:ring-sky-100 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
          aria-label="Cantidad"
        />
        {isUnidadDecimal(e.product.unidad) && (
          <span className={`text-slate-500 self-center ${compact ? "text-[10px]" : "text-xs"}`}>g</span>
        )}
        <button
          type="button"
          onClick={() => onUpdateCantidad(e.product.id, 1)}
          disabled={e.cantidad >= e.product.stock_actual}
          className={`${btnSize} rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors`}
          aria-label="Aumentar cantidad"
        >
          <Plus className={iconSize} />
        </button>
      </div>
      <button
        type="button"
        onClick={() => onRemove(e.product.id)}
        className={`text-slate-400 hover:text-red-500 shrink-0 ${compact ? "text-[11px] px-1" : "text-xs p-1"}`}
        aria-label="Quitar"
      >
        Quitar
      </button>
    </li>
  );
}

export function CartPanel({
  cart,
  totalCarrito,
  onContinue,
  onUpdateCantidad,
  onSetCantidadDirect,
  onRemove,
  compact,
}: CartPanelProps) {
  if (compact) {
    return (
      <ul className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
        {cart.map((e) => (
          <CartItemRow
            key={e.product.id}
            e={e}
            compact
            onUpdateCantidad={onUpdateCantidad}
            onSetCantidadDirect={onSetCantidadDirect}
            onRemove={onRemove}
          />
        ))}
      </ul>
    );
  }

  return (
    <aside className="lg:w-[320px] xl:w-[360px] shrink-0 order-1">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden sticky lg:top-24">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-sky-600" />
          <span className="font-semibold text-slate-800">Tu pedido</span>
        </div>
        {cart.length === 0 ? (
          <div className="px-4 py-8 text-center text-slate-500 text-sm">
            <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-slate-200" />
            <p>Agrega productos desde el catálogo</p>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-slate-100 max-h-[50vh] overflow-y-auto">
              {cart.map((e) => (
                <CartItemRow
                  key={e.product.id}
                  e={e}
                  onUpdateCantidad={onUpdateCantidad}
                  onSetCantidadDirect={onSetCantidadDirect}
                  onRemove={onRemove}
                />
              ))}
            </ul>
            <div className="px-4 py-4 bg-slate-50 border-t border-slate-100">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-slate-800">Total a pagar</span>
                <span className="text-xl font-bold text-sky-600">{formatCOP(totalCarrito)}</span>
              </div>
              <button
                type="button"
                onClick={onContinue}
                className="w-full rounded-xl bg-sky-600 py-3 font-semibold text-white hover:bg-sky-700 transition-colors"
              >
                Continuar con datos de envío
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

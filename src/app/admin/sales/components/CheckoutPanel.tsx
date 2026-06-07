import { formatCOP } from "@/lib/format";
import {
  Search,
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  Check,
  User,
  Calendar,
} from "lucide-react";
import {
  getStepForUnidad,
  getUnidadSufijo,
  isUnidadDecimal,
  type CartItem,
  type Product,
} from "../types";

interface CheckoutPanelProps {
  cart: CartItem[];
  total: number;
  saving: boolean;
  tipoVenta: string;
  setTipoVenta: (v: string) => void;
  metodoPago: string;
  setMetodoPago: (v: string) => void;
  clienteNombre: string;
  setClienteNombre: (v: string) => void;
  fechaVencimiento: string;
  setFechaVencimiento: (v: string) => void;
  fechaVenta: string;
  setFechaVenta: (v: string) => void;
  fechaMinVenta: string;
  fechaMaxVenta: string;
  searchCheckout: string;
  setSearchCheckout: (v: string) => void;
  searchResults: Product[];
  setSearchResults: (v: Product[]) => void;
  searchCheckoutLoading: boolean;
  onBack: () => void;
  onAddProduct: (product: Product) => void;
  onUpdateQty: (id: string, delta: number) => void;
  onSetQtyDirect: (id: string, value: string) => void;
  onRemove: (id: string) => void;
  formatCantidad: (item: CartItem) => string;
  onCheckout: () => void;
}

export function CheckoutPanel(props: CheckoutPanelProps) {
  const creditInvalid =
    props.tipoVenta === "credito" && (!props.clienteNombre || !props.fechaVencimiento);

  return (
    <div className="flex flex-col max-w-2xl mx-auto gap-6">
      <button
        type="button"
        onClick={props.onBack}
        className="inline-flex items-center gap-1.5 text-slate-600 hover:text-sky-600 font-medium text-sm w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a productos
      </button>
      <h2 className="text-xl font-bold text-slate-900">Confirmar venta</h2>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <span className="font-semibold text-slate-800 text-sm">Productos seleccionados</span>
          <span className="bg-sky-100 text-sky-700 text-xs font-bold px-2.5 py-1 rounded-full">
            {props.cart.length} {props.cart.length === 1 ? "producto" : "productos"}
          </span>
        </div>
        <div className="px-5 py-3 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              value={props.searchCheckout}
              onChange={(e) => props.setSearchCheckout(e.target.value)}
              placeholder="Buscar producto para agregar..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none"
              aria-label="Buscar producto para agregar"
            />
            {props.searchCheckout && (
              <button
                type="button"
                onClick={() => {
                  props.setSearchCheckout("");
                  props.setSearchResults([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
                aria-label="Limpiar búsqueda"
              >
                ×
              </button>
            )}
            {props.searchResults.length > 0 && (
              <ul className="absolute left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-10 py-1">
                {props.searchResults.map((p) => {
                  const inCart = props.cart.some((c) => c.id === p.id);
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => {
                          props.onAddProduct(p);
                          props.setSearchCheckout("");
                          props.setSearchResults([]);
                        }}
                        disabled={p.stock_actual <= 0}
                        className={`w-full px-4 py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed ${
                          inCart ? "bg-sky-50" : ""
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-800 truncate">{p.nombre}</p>
                          <p className="text-xs text-slate-500">
                            {formatCOP(p.precio_venta)}
                            {isUnidadDecimal(p.unidad) &&
                              `/${getUnidadSufijo(p.unidad).trim() || "g"}`}
                            {p.stock_actual <= 0 && " · Sin stock"}
                          </p>
                        </div>
                        <Plus className="w-4 h-4 text-sky-600 shrink-0" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {props.searchCheckout && props.searchCheckoutLoading && (
              <p className="absolute left-9 top-full mt-1 text-xs text-slate-500">Buscando...</p>
            )}
            {props.searchCheckout &&
              !props.searchCheckoutLoading &&
              props.searchResults.length === 0 &&
              props.searchCheckout.trim().length >= 2 && (
                <p className="absolute left-9 top-full mt-1 text-xs text-slate-500">
                  No se encontraron productos
                </p>
              )}
          </div>
        </div>
        <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
          {props.cart.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800">{item.nombre}</p>
                <p className="text-xs text-slate-400">
                  {props.formatCantidad(item)} × {formatCOP(item.precio_venta)}
                  {isUnidadDecimal(item.unidad) &&
                    `/${getUnidadSufijo(item.unidad).trim() || "g"}`}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => props.onUpdateQty(item.id, -1)}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
                  aria-label="Disminuir cantidad"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min={isUnidadDecimal(item.unidad) ? 0.001 : 1}
                  max={item.stock_actual}
                  step={getStepForUnidad(item.unidad)}
                  value={item.cantidad}
                  onChange={(e) => props.onSetQtyDirect(item.id, e.target.value)}
                  className="w-14 text-center text-sm font-medium tabular-nums border border-slate-200 rounded-lg px-1 py-1 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  aria-label={`Cantidad de ${item.nombre}`}
                />
                <button
                  type="button"
                  onClick={() => props.onUpdateQty(item.id, 1)}
                  disabled={item.cantidad >= item.stock_actual}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  aria-label="Aumentar cantidad"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-sm font-bold text-sky-700 w-20 text-right shrink-0">
                {formatCOP(item.subtotal)}
              </span>
              <button
                type="button"
                onClick={() => props.onRemove(item.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                aria-label="Quitar producto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-600">Total</span>
            <span className="text-2xl font-extrabold text-slate-900">{formatCOP(props.total)}</span>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block" htmlFor="pos-fecha-venta">
              Fecha de la venta
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                id="pos-fecha-venta"
                type="date"
                min={props.fechaMinVenta}
                max={props.fechaMaxVenta}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 text-slate-700"
                value={props.fechaVenta}
                onChange={(e) => props.setFechaVenta(e.target.value)}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Por defecto el día de hoy; ajústala si registras una venta de otro día.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Tipo</label>
              <select
                value={props.tipoVenta}
                onChange={(e) => {
                  const v = e.target.value;
                  props.setTipoVenta(v);
                  if (v === "contado") props.setFechaVencimiento("");
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 bg-white"
              >
                <option value="contado">Contado</option>
                <option value="credito">Crédito</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Pago</label>
              <select
                value={props.metodoPago}
                onChange={(e) => props.setMetodoPago(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 bg-white"
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">
                Cliente {props.tipoVenta === "contado" ? "(opcional)" : ""}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={
                    props.tipoVenta === "contado"
                      ? "Nombre del cliente (opcional)"
                      : "Nombre del cliente"
                  }
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  value={props.clienteNombre}
                  onChange={(e) => props.setClienteNombre(e.target.value)}
                  autoComplete="name"
                />
              </div>
            </div>
            {props.tipoVenta === "credito" && (
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">
                  Vencimiento del crédito
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="date"
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 text-slate-600"
                    value={props.fechaVencimiento}
                    onChange={(e) => props.setFechaVencimiento(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
          <button
            onClick={props.onCheckout}
            disabled={props.saving || creditInvalid}
            className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100 text-sm"
          >
            {props.saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Procesando...
              </span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Registrar Venta · {formatCOP(props.total)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

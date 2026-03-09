"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { formatCOP } from "@/lib/format";
import { Search, User, Calendar, Check, ArrowRight, ArrowLeft, Plus, Minus, Trash2 } from "lucide-react";
import { Toast, ToastMessage } from "@/components/ui/Toast";

interface Product {
  id: string;
  nombre: string;
  categoria: string;
  precio_venta: number;
  stock_actual: number;
}

interface CartItem extends Product {
  cantidad: number;
  subtotal: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const [step, setStep] = useState<"products" | "checkout">("products");
  const [tipoVenta, setTipoVenta] = useState("contado");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [clienteNombre, setClienteNombre] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");

  const loadProducts = useCallback(async () => {
    try {
      const data = await fetchApi(`/inventario${search ? `?search=${search}` : ""}`);
      setProducts(data || []);
    } catch {
      /* ignore */
    }
  }, [search]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const addToCart = (product: Product) => {
    if (product.stock_actual <= 0) return;
    setCart((prev) => {
      const existing = prev.find((p) => p.id === product.id);
      if (existing) {
        if (existing.cantidad >= product.stock_actual) return prev;
        return prev.map((p) =>
          p.id === product.id
            ? { ...p, cantidad: p.cantidad + 1, subtotal: (p.cantidad + 1) * p.precio_venta }
            : p
        );
      }
      return [...prev, { ...product, cantidad: 1, subtotal: product.precio_venta }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((p) => p.id !== id));
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((p) =>
          p.id === id
            ? {
                ...p,
                cantidad: Math.max(1, Math.min(p.cantidad + delta, p.stock_actual)),
                subtotal: Math.max(1, Math.min(p.cantidad + delta, p.stock_actual)) * p.precio_venta,
              }
            : p
        )
    );
  };

  const total = cart.reduce((acc, item) => acc + item.subtotal, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (tipoVenta === "credito" && (!clienteNombre || !fechaVencimiento)) {
      setToast({ text: "El crédito requiere nombre del cliente y fecha de vencimiento", type: "error" });
      return;
    }

    setSaving(true);
    try {
      await fetchApi("/ventas", {
        method: "POST",
        body: JSON.stringify({
          tipo: tipoVenta.toUpperCase(),
          metodo_pago: metodoPago.toUpperCase(),
          cliente_nombre: clienteNombre || undefined,
          fecha_vencimiento: fechaVencimiento || undefined,
          items: cart.map((item) => ({ product_id: item.id, cantidad: item.cantidad })),
        }),
      });
      setToast({ text: `Venta de ${formatCOP(total)} registrada con éxito`, type: "success" });
      setCart([]);
      setClienteNombre("");
      setFechaVencimiento("");
      setStep("products");
      loadProducts();
    } catch (err: unknown) {
      setToast({ text: err instanceof Error ? err.message : "Error al registrar la venta", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (step === "checkout") {
    return (
      <div className="flex flex-col max-w-2xl mx-auto gap-6">
        <button
          type="button"
          onClick={() => setStep("products")}
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
              {cart.length} {cart.length === 1 ? "producto" : "productos"}
            </span>
          </div>
          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{item.nombre}</p>
                  <p className="text-xs text-slate-400">{item.cantidad} × {formatCOP(item.precio_venta)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateQty(item.id, -1)}
                    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
                    aria-label="Disminuir cantidad"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium tabular-nums">{item.cantidad}</span>
                  <button
                    type="button"
                    onClick={() => updateQty(item.id, 1)}
                    disabled={item.cantidad >= item.stock_actual}
                    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                    aria-label="Aumentar cantidad"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm font-bold text-sky-700 w-20 text-right shrink-0">{formatCOP(item.subtotal)}</span>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.id)}
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
              <span className="text-2xl font-extrabold text-slate-900">{formatCOP(total)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Tipo</label>
                <select
                  value={tipoVenta}
                  onChange={(e) => setTipoVenta(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 bg-white"
                >
                  <option value="contado">Contado</option>
                  <option value="credito">Crédito</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Pago</label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 bg-white"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>
            </div>
            {tipoVenta === "credito" && (
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Nombre del cliente"
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="date"
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 text-slate-600"
                    value={fechaVencimiento}
                    onChange={(e) => setFechaVencimiento(e.target.value)}
                  />
                </div>
              </div>
            )}
            <button
              onClick={handleCheckout}
              disabled={saving || (tipoVenta === "credito" && (!clienteNombre || !fechaVencimiento))}
              className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100 text-sm"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Procesando...
                </span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Registrar Venta · {formatCOP(total)}
                </>
              )}
            </button>
          </div>
        </div>
        <Toast message={toast} onClose={() => setToast(null)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-9rem)]">
      {/* Products panel */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Punto de Venta</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{products.length} productos</span>
            {step === "products" && cart.length > 0 && (
              <button
                type="button"
                onClick={() => setStep("checkout")}
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
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 pb-4">
            {products.map((p) => {
              const inCart = cart.find((c) => c.id === p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={p.stock_actual <= 0}
                  className={`relative p-4 rounded-2xl flex flex-col text-left transition-all border ${
                    p.stock_actual <= 0
                      ? "bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed"
                      : inCart
                      ? "bg-sky-600 border-sky-600 text-white shadow-md shadow-sky-200"
                      : "bg-white border-slate-200 hover:border-sky-300 hover:shadow-md hover:shadow-sky-100 active:scale-95"
                  }`}
                >
                  {inCart && (
                    <span className="absolute top-2.5 right-2.5 w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">
                      {inCart.cantidad}
                    </span>
                  )}
                  <h3
                    className={`font-semibold text-sm leading-tight mb-2 ${
                      inCart ? "text-white" : "text-slate-800"
                    }`}
                  >
                    {p.nombre}
                  </h3>
                  <p
                    className={`font-bold text-lg mt-auto ${
                      inCart ? "text-white" : "text-sky-600"
                    }`}
                  >
                    {formatCOP(p.precio_venta)}
                  </p>
                  <p className={`text-xs mt-0.5 ${inCart ? "text-white/70" : "text-slate-400"}`}>
                    {p.stock_actual <= 0
                      ? "Sin stock"
                      : p.stock_actual <= 5
                      ? `⚠ ${p.stock_actual} restantes`
                      : `Stock: ${p.stock_actual}`}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}

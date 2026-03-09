"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { fetchPublicApi } from "@/lib/api";
import { formatCOP } from "@/lib/format";
import {
  ShoppingCart,
  Store,
  MapPin,
  User,
  Phone,
  CreditCard,
  CalendarClock,
  Plus,
  Minus,
  MessageSquare,
  Check,
  Loader2,
  Copy,
  Search,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";

const UNIDADES_DECIMALES = ["gramos", "g", "kg", "litro", "ml", "lb"];

function isUnidadDecimal(unidad?: string): boolean {
  return !!unidad && UNIDADES_DECIMALES.includes(unidad.toLowerCase());
}

interface Product {
  id: string;
  nombre: string;
  categoria: string;
  precio_venta: number;
  stock_actual: number;
  unidad?: string;
  imagen?: string;
}

interface CartEntry {
  product: Product;
  cantidad: number;
}

interface NequiCuentaPublic {
  numero: string;
  nombreMasked: string;
  apellidoMasked: string;
}

function getDefaultFechaHoraEntrega(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:00:00`;
}

const CATALOGO_PAGE_SIZE = 12;

export default function ComprarPage() {
  const [productos, setProductos] = useState<Product[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [step, setStep] = useState<"catalogo" | "datos">("catalogo");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProductos, setTotalProductos] = useState(0);

  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [metodoPago, setMetodoPago] = useState<"EFECTIVO" | "NEQUI">("EFECTIVO");
  const [fechaHoraEntrega, setFechaHoraEntrega] = useState("");
  const [modoEntrega, setModoEntrega] = useState<"PROGRAMADA" | "LO_ANTES_POSIBLE">("PROGRAMADA");
  const [notas, setNotas] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [nequiCuentas, setNequiCuentas] = useState<NequiCuentaPublic[]>([]);
  const [nequiCopiedIndex, setNequiCopiedIndex] = useState<number | null>(null);

  const copyNequiNumber = (numero: string, index: number) => {
    navigator.clipboard.writeText(numero);
    setNequiCopiedIndex(index);
    setTimeout(() => setNequiCopiedIndex(null), 2000);
  };

  const loadCatalogo = useCallback(async (pageNum = 1, search = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(pageNum));
      params.set("limit", String(CATALOGO_PAGE_SIZE));
      if (search.trim()) params.set("search", search.trim());
      const data = await fetchPublicApi(`/pedidos/catalogo?${params.toString()}`);
      if (data?.productos) setProductos(data.productos);
      if (data?.categorias) setCategorias(data.categorias ?? []);
      setTotalPages(Math.max(1, data?.totalPages ?? 1));
      setTotalProductos(data?.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar catálogo");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadNequi = useCallback(async () => {
    try {
      const data = await fetchPublicApi("/pedidos/nequi");
      setNequiCuentas(Array.isArray(data) ? data : []);
    } catch {
      setNequiCuentas([]);
    }
  }, []);

  useEffect(() => {
    loadCatalogo(1, "");
    setFechaHoraEntrega(getDefaultFechaHoraEntrega());
  }, [loadCatalogo]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setPage(1);
    loadCatalogo(1, searchInput);
  };

  const goToPage = (newPage: number) => {
    const p = Math.max(1, Math.min(totalPages, newPage));
    setPage(p);
    loadCatalogo(p, searchQuery);
  };

  useEffect(() => {
    if (step === "datos") loadNequi();
  }, [step, loadNequi]);

  const addToCart = (product: Product) => {
    if (product.stock_actual <= 0) return;
    const esGramos = isUnidadDecimal(product.unidad);
    const cantidadInicial = esGramos ? Math.min(100, product.stock_actual) : 1;
    setCart((prev) => {
      const existing = prev.find((e) => e.product.id === product.id);
      if (existing) {
        const delta = esGramos ? 100 : 1;
        const nuevaCantidad = Math.min(existing.cantidad + delta, product.stock_actual);
        if (nuevaCantidad <= existing.cantidad) return prev;
        return prev.map((e) =>
          e.product.id === product.id ? { ...e, cantidad: nuevaCantidad } : e
        );
      }
      return [...prev, { product, cantidad: cantidadInicial }];
    });
  };

  const updateCantidad = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((e) => {
          if (e.product.id !== productId) return e;
          const esGramos = isUnidadDecimal(e.product.unidad);
          const step = esGramos ? 10 : 1;
          const minQty = esGramos ? 1 : 1;
          const newQty = Math.max(minQty, Math.min(e.product.stock_actual, e.cantidad + delta * step));
          return { ...e, cantidad: newQty };
        })
        .filter((e) => e.cantidad > 0)
    );
  };

  const setCantidadDirect = (productId: string, value: number) => {
    setCart((prev) =>
      prev
        .map((e) => {
          if (e.product.id !== productId) return e;
          const esGramos = isUnidadDecimal(e.product.unidad);
          const minQty = esGramos ? 1 : 1;
          const parsed = Number(value);
          if (Number.isNaN(parsed) || parsed < minQty) return { ...e, cantidad: minQty };
          const newQty = Math.max(minQty, Math.min(e.product.stock_actual, parsed));
          return { ...e, cantidad: newQty };
        })
        .filter((e) => e.cantidad > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((e) => e.product.id !== productId));
  };

  const totalCarrito = cart.reduce((sum, e) => sum + e.product.precio_venta * e.cantidad, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (cart.length === 0) {
      setError("Agrega al menos un producto al carrito.");
      return;
    }
    if (modoEntrega === "PROGRAMADA" && !fechaHoraEntrega) {
      setError("Selecciona la fecha y hora de entrega deseada o marca 'Lo antes posible'.");
      return;
    }
    const fechaEntregaValue =
      modoEntrega === "PROGRAMADA" ? fechaHoraEntrega : "LO_ANTES_POSIBLE";

    setSubmitting(true);
    try {
      await fetchPublicApi("/pedidos", {
        method: "POST",
        body: JSON.stringify({
          items: cart.map((e) => ({ product_id: e.product.id, cantidad: e.cantidad })),
          cliente_nombre: clienteNombre.trim(),
          cliente_telefono: clienteTelefono.trim(),
          direccion: direccion.trim(),
          metodo_pago: metodoPago,
          fecha_hora_entrega: fechaEntregaValue,
          notas: notas.trim() || undefined,
        }),
      });
      setSuccess(true);
      setCart([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar el pedido");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-sky-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Pedido enviado</h1>
          <p className="text-slate-600 mb-8">
            Te contactaremos por WhatsApp para confirmar. Revisa tu teléfono.
          </p>
          <button
            type="button"
            onClick={() => setSuccess(false)}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-medium text-white hover:bg-sky-700"
          >
            Hacer otro pedido
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-sky-600 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-slate-900">Comprar por WhatsApp</span>
          </div>
          <Link
            href="/"
            className="text-sm text-slate-500 hover:text-sky-600 transition-colors"
          >
            Admin
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {step === "catalogo" && (
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Izquierda: productos seleccionados (carrito) y total a pagar */}
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
                        <li key={e.product.id} className="px-4 py-3 flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 text-sm truncate">{e.product.nombre}</p>
                            <p className="text-xs text-sky-600">{formatCOP(e.product.precio_venta * e.cantidad)}</p>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => updateCantidad(e.product.id, -1)}
                              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
                              aria-label="Disminuir cantidad"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              min={isUnidadDecimal(e.product.unidad) ? 1 : 1}
                              max={e.product.stock_actual}
                              step={isUnidadDecimal(e.product.unidad) ? 10 : 1}
                              value={isUnidadDecimal(e.product.unidad)
                                ? (e.cantidad % 1 === 0 ? e.cantidad : e.cantidad.toFixed(1))
                                : e.cantidad}
                              onChange={(ev) => {
                                const v = ev.target.value;
                                const num = isUnidadDecimal(e.product.unidad)
                                  ? parseFloat(v) || 0
                                  : Math.floor(parseFloat(v) || 0);
                                setCantidadDirect(e.product.id, num);
                              }}
                              className="w-12 text-center text-sm font-medium tabular-nums border border-slate-200 rounded-lg py-1 px-1 focus:border-sky-400 focus:ring-1 focus:ring-sky-100 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              aria-label="Cantidad"
                            />
                            {isUnidadDecimal(e.product.unidad) && (
                              <span className="text-xs text-slate-500 self-center">g</span>
                            )}
                            <button
                              type="button"
                              onClick={() => updateCantidad(e.product.id, 1)}
                              disabled={e.cantidad >= e.product.stock_actual}
                              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                              aria-label="Aumentar cantidad"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(e.product.id)}
                            className="text-slate-400 hover:text-red-500 text-xs p-1 shrink-0"
                            aria-label="Quitar"
                          >
                            Quitar
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="px-4 py-4 bg-slate-50 border-t border-slate-100">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-semibold text-slate-800">Total a pagar</span>
                        <span className="text-xl font-bold text-sky-600">{formatCOP(totalCarrito)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep("datos")}
                        className="w-full rounded-xl bg-sky-600 py-3 font-semibold text-white hover:bg-sky-700 transition-colors"
                      >
                        Continuar con datos de envío
                      </button>
                    </div>
                  </>
                )}
              </div>
            </aside>

            {/* Derecha: catálogo de productos */}
            <section className="flex-1 min-w-0 order-2">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Productos</h2>
              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="search"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
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
                        <div className="w-16 h-16 shrink-0 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center">
                          {p.imagen ? (
                            <img
                              src={p.imagen}
                              alt={p.nombre}
                              className="w-full h-full object-cover"
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
                          onClick={() => addToCart(p)}
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
                        {totalProductos > 0 && (
                          <span className="ml-1">({totalProductos} productos)</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => goToPage(page - 1)}
                          disabled={page <= 1}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                          aria-label="Página anterior"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Anterior
                        </button>
                        <button
                          type="button"
                          onClick={() => goToPage(page + 1)}
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
          </div>
        )}

        {step === "datos" && (
          <div className="w-full max-w-lg mx-auto">
            <button
              type="button"
              onClick={() => setStep("catalogo")}
              className="text-sm text-slate-500 hover:text-sky-600 mb-4"
            >
              ← Volver al catálogo
            </button>

            {/* Resumen editable del pedido */}
            <div className="mb-5 bg-slate-50 rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-700">
                  {cart.length} producto(s) · Total {formatCOP(totalCarrito)}
                </p>
                <button
                  type="button"
                  onClick={() => setStep("catalogo")}
                  className="text-xs font-medium text-sky-600 hover:text-sky-700"
                >
                  Editar productos
                </button>
              </div>
              {cart.length > 0 && (
                <ul className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                  {cart.map((e) => (
                    <li key={e.product.id} className="py-2 flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {e.product.nombre}
                        </p>
                        <p className="text-xs text-sky-600">
                          {formatCOP(e.product.precio_venta * e.cantidad)}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateCantidad(e.product.id, -1)}
                          className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                          aria-label="Disminuir cantidad"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={e.product.stock_actual}
                          step={isUnidadDecimal(e.product.unidad) ? 10 : 1}
                          value={isUnidadDecimal(e.product.unidad)
                            ? (e.cantidad % 1 === 0 ? e.cantidad : e.cantidad.toFixed(1))
                            : e.cantidad}
                          onChange={(ev) => {
                            const v = ev.target.value;
                            const num = isUnidadDecimal(e.product.unidad)
                              ? parseFloat(v) || 0
                              : Math.floor(parseFloat(v) || 0);
                            setCantidadDirect(e.product.id, num);
                          }}
                          className="w-9 text-center text-xs font-medium tabular-nums border border-slate-200 rounded-lg py-0.5 px-0.5 focus:border-sky-400 focus:ring-1 focus:ring-sky-100 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          aria-label="Cantidad"
                        />
                        {isUnidadDecimal(e.product.unidad) && (
                          <span className="text-[10px] text-slate-500 self-center">g</span>
                        )}
                        <button
                          type="button"
                          onClick={() => updateCantidad(e.product.id, 1)}
                          disabled={e.cantidad >= e.product.stock_actual}
                          className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                          aria-label="Aumentar cantidad"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(e.product.id)}
                        className="text-[11px] text-slate-400 hover:text-red-500 px-1"
                      >
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-slate-700 mb-1">
                    <User className="w-4 h-4 inline mr-1" />
                    Nombre
                  </label>
                  <input
                    id="nombre"
                    type="text"
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none"
                    placeholder="Tu nombre"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="telefono" className="block text-sm font-medium text-slate-700 mb-1">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Teléfono (WhatsApp)
                  </label>
                  <input
                    id="telefono"
                    type="tel"
                    value={clienteTelefono}
                    onChange={(e) => setClienteTelefono(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none"
                    placeholder="Ej: 300 123 4567"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="direccion" className="block text-sm font-medium text-slate-700 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Dirección de entrega
                </label>
                <input
                  id="direccion"
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none"
                  placeholder="Calle, barrio, ciudad"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <CalendarClock className="w-4 h-4 inline mr-1" />
                  Entrega
                </label>
                <div className="flex gap-3 mb-3">
                  <label className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 cursor-pointer transition-colors has-[:checked]:border-sky-500 has-[:checked]:bg-sky-50">
                    <input
                      type="radio"
                      name="modoEntrega"
                      value="LO_ANTES_POSIBLE"
                      checked={modoEntrega === "LO_ANTES_POSIBLE"}
                      onChange={() => setModoEntrega("LO_ANTES_POSIBLE")}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-slate-700">Lo antes posible</span>
                  </label>
                  <label className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 cursor-pointer transition-colors has-[:checked]:border-sky-500 has-[:checked]:bg-sky-50">
                    <input
                      type="radio"
                      name="modoEntrega"
                      value="PROGRAMADA"
                      checked={modoEntrega === "PROGRAMADA"}
                      onChange={() => setModoEntrega("PROGRAMADA")}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-slate-700">Programar envío</span>
                  </label>
                </div>
                {modoEntrega === "PROGRAMADA" ? (
                  <>
                    <input
                      id="fecha"
                      type="datetime-local"
                      step="3600"
                      value={fechaHoraEntrega.slice(0, 16)}
                      onChange={(e) =>
                        setFechaHoraEntrega(
                          e.target.value ? `${e.target.value}:00` : getDefaultFechaHoraEntrega(),
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none"
                      required={modoEntrega === "PROGRAMADA"}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Indica día y hora exacta (ej. 5:00 PM)
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-slate-500">
                    La tienda preparará tu pedido y lo enviará lo más pronto posible.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <CreditCard className="w-4 h-4 inline mr-1" />
                  Forma de pago
                </label>
                <div className="flex gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 cursor-pointer transition-colors has-[:checked]:border-sky-500 has-[:checked]:bg-sky-50">
                    <input
                      type="radio"
                      name="pago"
                      value="EFECTIVO"
                      checked={metodoPago === "EFECTIVO"}
                      onChange={() => setMetodoPago("EFECTIVO")}
                      className="sr-only"
                    />
                    <span className="font-medium text-slate-700">Efectivo</span>
                  </label>
                  <label className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 cursor-pointer transition-colors has-[:checked]:border-sky-500 has-[:checked]:bg-sky-50">
                    <input
                      type="radio"
                      name="pago"
                      value="NEQUI"
                      checked={metodoPago === "NEQUI"}
                      onChange={() => setMetodoPago("NEQUI")}
                      className="sr-only"
                    />
                    <span className="font-medium text-slate-700">Nequi</span>
                  </label>
                </div>
                {metodoPago === "NEQUI" && (
                  <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-xs font-medium text-slate-500 mb-2">
                      Transfiere a una de estas cuentas Nequi (como se muestra en la app):
                    </p>
                    {nequiCuentas.length === 0 ? (
                      <p className="text-sm text-slate-500">No hay cuentas Nequi configuradas.</p>
                    ) : (
                      <ul className="space-y-2">
                        {nequiCuentas.map((c, i) => (
                          <li
                            key={i}
                            className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-white border border-slate-100"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-semibold text-slate-800">{c.numero}</span>
                              <button
                                type="button"
                                onClick={() => copyNequiNumber(c.numero, i)}
                                className="shrink-0 inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-slate-500 hover:bg-sky-50 hover:text-sky-600 transition-colors text-xs font-medium"
                                title="Copiar número"
                              >
                                {nequiCopiedIndex === i ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                    Copiado
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    Copiar
                                  </>
                                )}
                              </button>
                            </div>
                            <span className="text-sm text-slate-600 shrink-0">
                              {c.nombreMasked} {c.apellidoMasked}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="notas" className="block text-sm font-medium text-slate-700 mb-1">
                  <MessageSquare className="w-4 h-4 inline mr-1" />
                  Notas (opcional)
                </label>
                <textarea
                  id="notas"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none resize-none"
                  placeholder="Instrucciones adicionales para la entrega"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-sky-600 py-3 font-semibold text-white hover:bg-sky-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enviando pedido…
                  </>
                ) : (
                  <>
                    Enviar pedido por WhatsApp
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}

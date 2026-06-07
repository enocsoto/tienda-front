"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchApi } from "@/lib/api";
import { fechaLocalYMD, formatCOP } from "@/lib/format";
import type { ToastMessage } from "@/components/ui/Toast";
import {
  getStepForUnidad,
  getUnidadSufijo,
  isUnidadDecimal,
  type CartItem,
  type PosStep,
  type Product,
} from "../types";

export function usePosCart() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [step, setStep] = useState<PosStep>("products");
  const [tipoVenta, setTipoVenta] = useState("contado");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [clienteNombre, setClienteNombre] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [fechaVenta, setFechaVenta] = useState(() => fechaLocalYMD());
  const [searchCheckout, setSearchCheckout] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchCheckoutLoading, setSearchCheckoutLoading] = useState(false);

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

  useEffect(() => {
    if (step === "checkout") setFechaVenta(fechaLocalYMD());
  }, [step]);

  const fechaMinVenta = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 5);
    return fechaLocalYMD(d);
  }, []);
  const fechaMaxVenta = fechaLocalYMD();

  const searchProductsForCheckout = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchCheckoutLoading(true);
    try {
      const data = await fetchApi(`/inventario?search=${encodeURIComponent(query.trim())}`);
      setSearchResults(Array.isArray(data) ? data : []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchCheckoutLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchProductsForCheckout(searchCheckout), 250);
    return () => clearTimeout(t);
  }, [searchCheckout, searchProductsForCheckout]);

  const addProductToCart = (product: Product) => {
    if (product.stock_actual <= 0) return;
    setCart((prev) => {
      const existing = prev.find((p) => p.id === product.id);
      const stepQty = getStepForUnidad(product.unidad);
      const cantidadInicial = 1;
      if (existing) {
        const nuevaCantidad = Math.min(existing.cantidad + stepQty, product.stock_actual);
        return prev.map((p) =>
          p.id === product.id
            ? { ...p, cantidad: nuevaCantidad, subtotal: nuevaCantidad * p.precio_venta }
            : p,
        );
      }
      return [...prev, { ...product, cantidad: cantidadInicial, subtotal: cantidadInicial * product.precio_venta }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((p) => p.id !== id));
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const stepQty = getStepForUnidad(p.unidad);
        const minQty = isUnidadDecimal(p.unidad) ? 0.001 : 1;
        const nuevaCantidad = Math.max(minQty, Math.min(p.cantidad + delta * stepQty, p.stock_actual));
        return { ...p, cantidad: nuevaCantidad, subtotal: nuevaCantidad * p.precio_venta };
      }),
    );
  };

  const setQtyDirect = (id: string, rawValue: string | number) => {
    const item = cart.find((p) => p.id === id);
    const esDecimal = item && isUnidadDecimal(item.unidad);
    const num =
      typeof rawValue === "string"
        ? esDecimal
          ? parseFloat(rawValue.replace(",", "."))
          : parseInt(rawValue, 10)
        : rawValue;
    if (Number.isNaN(num) || num < (esDecimal ? 0.001 : 1)) return;
    setCart((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const cantidad = Math.min(num, p.stock_actual);
        return { ...p, cantidad, subtotal: cantidad * p.precio_venta };
      }),
    );
  };

  const formatCantidad = (item: CartItem) =>
    isUnidadDecimal(item.unidad)
      ? `${item.cantidad % 1 === 0 ? item.cantidad : item.cantidad.toFixed(2)}${getUnidadSufijo(item.unidad)}`
      : String(item.cantidad);

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
          fecha: fechaVenta,
          cliente_nombre: clienteNombre.trim() || undefined,
          fecha_vencimiento: tipoVenta === "credito" && fechaVencimiento ? fechaVencimiento : undefined,
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

  return {
    products,
    cart,
    search,
    setSearch,
    saving,
    toast,
    setToast,
    step,
    setStep,
    tipoVenta,
    setTipoVenta,
    metodoPago,
    setMetodoPago,
    clienteNombre,
    setClienteNombre,
    fechaVencimiento,
    setFechaVencimiento,
    fechaVenta,
    setFechaVenta,
    searchCheckout,
    setSearchCheckout,
    searchResults,
    setSearchResults,
    searchCheckoutLoading,
    fechaMinVenta,
    fechaMaxVenta,
    addProductToCart,
    removeFromCart,
    updateQty,
    setQtyDirect,
    formatCantidad,
    total,
    handleCheckout,
  };
}

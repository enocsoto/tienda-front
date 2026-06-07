"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchPublicApi } from "@/lib/api";
import {
  getDefaultFechaHoraEntrega,
  isUnidadDecimal,
  type CartEntry,
  type MetodoPago,
  type ModoEntrega,
  type NequiCuentaPublic,
  type Product,
  type PurchaseStep,
} from "../types";

export function usePurchaseCart() {
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [step, setStep] = useState<PurchaseStep>("catalogo");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("EFECTIVO");
  const [fechaHoraEntrega, setFechaHoraEntrega] = useState("");
  const [modoEntrega, setModoEntrega] = useState<ModoEntrega>("PROGRAMADA");
  const [notas, setNotas] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [nequiCuentas, setNequiCuentas] = useState<NequiCuentaPublic[]>([]);
  const [nequiCopiedIndex, setNequiCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    setFechaHoraEntrega(getDefaultFechaHoraEntrega());
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
    if (step === "datos") loadNequi();
  }, [step, loadNequi]);

  const copyNequiNumber = (numero: string, index: number) => {
    navigator.clipboard.writeText(numero);
    setNequiCopiedIndex(index);
    setTimeout(() => setNequiCopiedIndex(null), 2000);
  };

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
          e.product.id === product.id ? { ...e, cantidad: nuevaCantidad } : e,
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
          const stepQty = esGramos ? 10 : 1;
          const minQty = 1;
          const newQty = Math.max(minQty, Math.min(e.product.stock_actual, e.cantidad + delta * stepQty));
          return { ...e, cantidad: newQty };
        })
        .filter((e) => e.cantidad > 0),
    );
  };

  const setCantidadDirect = (productId: string, value: number) => {
    setCart((prev) =>
      prev
        .map((e) => {
          if (e.product.id !== productId) return e;
          const minQty = 1;
          const parsed = Number(value);
          if (Number.isNaN(parsed) || parsed < minQty) return { ...e, cantidad: minQty };
          const newQty = Math.max(minQty, Math.min(e.product.stock_actual, parsed));
          return { ...e, cantidad: newQty };
        })
        .filter((e) => e.cantidad > 0),
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
    const fechaEntregaValue = modoEntrega === "PROGRAMADA" ? fechaHoraEntrega : "LO_ANTES_POSIBLE";

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

  return {
    cart,
    step,
    setStep,
    clienteNombre,
    setClienteNombre,
    clienteTelefono,
    setClienteTelefono,
    direccion,
    setDireccion,
    metodoPago,
    setMetodoPago,
    fechaHoraEntrega,
    setFechaHoraEntrega,
    modoEntrega,
    setModoEntrega,
    notas,
    setNotas,
    submitting,
    success,
    setSuccess,
    error,
    setError,
    nequiCuentas,
    nequiCopiedIndex,
    copyNequiNumber,
    addToCart,
    updateCantidad,
    setCantidadDirect,
    removeFromCart,
    totalCarrito,
    handleSubmit,
  };
}

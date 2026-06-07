"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { fechaLocalYMD } from "@/lib/format";
import type { ToastMessage } from "@/components/ui/Toast";
import type { Balance, Granularity, MedioPagoEgreso, Movement } from "../types";
import { getDateRangeForGranularity } from "../utils/date-range";

export function useCashPage() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);
  const [granularity, setGranularity] = useState<Granularity>("daily");
  const [date, setDate] = useState(() => fechaLocalYMD());
  const [desde, setDesde] = useState(() => fechaLocalYMD());
  const [hasta, setHasta] = useState(() => fechaLocalYMD());
  const [showEgreso, setShowEgreso] = useState(false);
  const [showPrestamo, setShowPrestamo] = useState(false);
  const [egresoDesc, setEgresoDesc] = useState("");
  const [egresoMonto, setEgresoMonto] = useState("");
  const [egresoCategoria, setEgresoCategoria] = useState("");
  const [egresoMedioPago, setEgresoMedioPago] = useState<MedioPagoEgreso>("EFECTIVO");
  const [egresoFecha, setEgresoFecha] = useState("");
  const [prestamoDesc, setPrestamoDesc] = useState("");
  const [prestamoFecha, setPrestamoFecha] = useState("");
  const [prestamoMonto, setPrestamoMonto] = useState("");
  const [prestamoPrestamista, setPrestamoPrestamista] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [movimientos, setMovimientos] = useState<Movement[]>([]);

  const dateRange = getDateRangeForGranularity(granularity, date, desde, hasta);
  const queryFrom = dateRange?.from ?? "";
  const queryTo = dateRange?.to ?? "";

  const loadBalance = useCallback(async () => {
    if (!queryFrom || !queryTo) return;
    setLoading(true);
    try {
      const qs = `from=${encodeURIComponent(queryFrom)}&to=${encodeURIComponent(queryTo)}`;
      const [balanceData, movimientosData] = await Promise.all([
        fetchApi(`/caja/balance?${qs}`),
        fetchApi(`/caja/movimientos?${qs}`),
      ]);
      setBalance(balanceData);
      setMovimientos(Array.isArray(movimientosData) ? movimientosData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [queryFrom, queryTo]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  const fechaRegistroMovimiento = queryTo || date || fechaLocalYMD();

  const handleEgreso = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetchApi("/caja/egreso", {
        method: "POST",
        body: JSON.stringify({
          descripcion: egresoDesc,
          monto: Number(egresoMonto),
          fecha: egresoFecha || fechaRegistroMovimiento,
          categoria: egresoCategoria || undefined,
          medio_pago: egresoMedioPago,
        }),
      });
      setShowEgreso(false);
      setEgresoDesc("");
      setEgresoMonto("");
      setEgresoCategoria("");
      setEgresoMedioPago("EFECTIVO");
      setToast({ text: "Egreso registrado correctamente", type: "success" });
      await loadBalance();
    } catch (err: unknown) {
      setToast({ text: err instanceof Error ? err.message : "Error al registrar egreso", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handlePrestamo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetchApi("/caja/prestamo", {
        method: "POST",
        body: JSON.stringify({
          descripcion: prestamoDesc,
          monto: Number(prestamoMonto),
          fecha: prestamoFecha || fechaRegistroMovimiento,
          prestamista: prestamoPrestamista || undefined,
        }),
      });
      setShowPrestamo(false);
      setPrestamoDesc("");
      setPrestamoMonto("");
      setPrestamoPrestamista("");
      setToast({ text: "Préstamo registrado correctamente", type: "success" });
      await loadBalance();
    } catch (err: unknown) {
      setToast({ text: err instanceof Error ? err.message : "Error al registrar préstamo", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const openPrestamo = () => {
    if (!showPrestamo) setPrestamoFecha(queryTo || date || fechaLocalYMD());
    setShowPrestamo((v) => !v);
  };

  const openEgreso = () => {
    if (!showEgreso) setEgresoFecha(queryTo || date || fechaLocalYMD());
    setShowEgreso((v) => !v);
  };

  const periodoMultiDia = Boolean(queryFrom && queryTo && queryFrom !== queryTo);
  const isPositive = balance ? Number(balance.balance_neto) >= 0 : true;

  return {
    balance,
    loading,
    granularity,
    setGranularity,
    date,
    setDate,
    desde,
    setDesde,
    hasta,
    setHasta,
    showEgreso,
    setShowEgreso,
    showPrestamo,
    setShowPrestamo,
    egresoDesc,
    setEgresoDesc,
    egresoMonto,
    setEgresoMonto,
    egresoCategoria,
    setEgresoCategoria,
    egresoMedioPago,
    setEgresoMedioPago,
    egresoFecha,
    setEgresoFecha,
    prestamoDesc,
    setPrestamoDesc,
    prestamoFecha,
    setPrestamoFecha,
    prestamoMonto,
    setPrestamoMonto,
    prestamoPrestamista,
    setPrestamoPrestamista,
    saving,
    toast,
    setToast,
    movimientos,
    queryFrom,
    queryTo,
    loadBalance,
    handleEgreso,
    handlePrestamo,
    openPrestamo,
    openEgreso,
    periodoMultiDia,
    isPositive,
  };
}

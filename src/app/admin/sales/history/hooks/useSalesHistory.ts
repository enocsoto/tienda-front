"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import type { ToastMessage } from "@/components/ui/Toast";
import type { Granularity, Sale, SalesSummary } from "../types";
import { getDateRangeForGranularity } from "../utils/sale-utils";

export function useSalesHistory() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [pedidosPendientes, setPedidosPendientes] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [granularity, setGranularity] = useState<Granularity>("monthly");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [detailSale, setDetailSale] = useState<Sale | null>(null);

  const dateRange = getDateRangeForGranularity(granularity, desde, hasta);
  const queryFrom = dateRange?.from ?? "";
  const queryTo = dateRange?.to ?? "";

  const loadData = useCallback(async (from: string, to: string, gran: Granularity) => {
    setLoading(true);
    try {
      const [historialData, summaryData] = await Promise.all([
        fetchApi(`/ventas/historial?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
        fetchApi(
          `/reports/sales?granularity=${gran === "custom" ? "monthly" : gran}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        ),
      ]);
      setSales(Array.isArray(historialData) ? historialData : []);
      setSummary(summaryData as SalesSummary | null);
    } catch (err) {
      console.error(err);
      setToast({ text: err instanceof Error ? err.message : "Error al cargar datos", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPedidosPendientes = useCallback(async () => {
    try {
      const data = await fetchApi("/ventas/pedidos-pendientes-pago");
      setPedidosPendientes(Array.isArray(data) ? data : []);
    } catch {
      setPedidosPendientes([]);
    }
  }, []);

  useEffect(() => {
    loadPedidosPendientes();
  }, [loadPedidosPendientes]);

  useEffect(() => {
    if (queryFrom && queryTo) loadData(queryFrom, queryTo, granularity);
  }, [queryFrom, queryTo, granularity, loadData]);

  useEffect(() => {
    if (!detailSale) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetailSale(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detailSale]);

  const handleConfirmarPago = async (saleId: string) => {
    setConfirmandoId(saleId);
    try {
      await fetchApi(`/ventas/${saleId}/confirmar-pago`, { method: "PATCH" });
      setToast({ text: "Pago confirmado correctamente", type: "success" });
      await loadPedidosPendientes();
      if (queryFrom && queryTo) loadData(queryFrom, queryTo, granularity);
    } catch (err) {
      setToast({ text: err instanceof Error ? err.message : "Error al confirmar pago", type: "error" });
    } finally {
      setConfirmandoId(null);
    }
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    if (granularity === "custom" && desde && hasta) {
      loadData(desde, hasta, "custom");
    }
  };

  const handleExportPdf = async () => {
    if (!queryFrom || !queryTo) {
      setToast({ text: "Selecciona un rango de fechas para exportar", type: "error" });
      return;
    }
    setPdfLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const params = new URLSearchParams({
        granularity: granularity === "custom" ? "monthly" : granularity,
        from: queryFrom,
        to: queryTo,
      });
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/reports/sales/pdf?${params}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      if (!res.ok) throw new Error("Error al generar el PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte-ventas-${granularity}-${queryFrom}-${queryTo}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setToast({ text: "PDF descargado correctamente", type: "success" });
    } catch (err) {
      setToast({ text: err instanceof Error ? err.message : "Error al exportar PDF", type: "error" });
    } finally {
      setPdfLoading(false);
    }
  };

  const totalVentas = sales.reduce((acc, s) => acc + Number(s.total), 0);

  return {
    sales,
    summary,
    pedidosPendientes,
    loading,
    pdfLoading,
    confirmandoId,
    toast,
    setToast,
    granularity,
    setGranularity,
    desde,
    setDesde,
    hasta,
    setHasta,
    detailSale,
    setDetailSale,
    handleConfirmarPago,
    handleFilter,
    handleExportPdf,
    totalVentas,
  };
}

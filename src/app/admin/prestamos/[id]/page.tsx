"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toast, ToastMessage } from "@/components/ui/Toast";
import { formatCOP, formatNumberInput, parseNumberInput } from "@/lib/format";
import { ArrowLeft, ArrowDownToLine, X, FileDown } from "lucide-react";

interface LoanPayment {
  id: string;
  monto: number;
  descripcion: string;
  prestamista?: string;
  fecha: string;
}

interface LoanDetail {
  id: string;
  monto: number;
  descripcion: string;
  prestamista?: string;
  fecha: string;
  pagos: LoanPayment[];
  totalPagado: number;
  saldoPendiente: number;
}

export default function PrestamoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loan, setLoan] = useState<LoanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPago, setShowPago] = useState(false);
  const [pagoDesc, setPagoDesc] = useState("");
  const [pagoMonto, setPagoMonto] = useState("");
  const [pagoFecha, setPagoFecha] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const loadLoan = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await fetchApi(`/caja/prestamos/${id}`);
      setLoan(data);
    } catch (err) {
      console.error(err);
      setToast({ text: "Error al cargar préstamo", type: "error" });
      router.push("/admin/prestamos");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadLoan();
  }, [loadLoan]);

  const handleRegistrarPago = async (e: React.FormEvent) => {
    e.preventDefault();
    const monto = parseNumberInput(pagoMonto);
    if (monto < 0.01) {
      setToast({ text: "El monto debe ser mayor a 0", type: "error" });
      return;
    }
    if (loan && monto > loan.saldoPendiente) {
      setToast({ text: "El monto no puede superar el saldo pendiente", type: "error" });
      return;
    }
    setSaving(true);
    try {
      await fetchApi(`/caja/prestamos/${id}/pagos`, {
        method: "POST",
        body: JSON.stringify({
          descripcion: pagoDesc,
          monto,
          fecha: pagoFecha,
          prestamista: loan?.prestamista,
        }),
      });
      setShowPago(false);
      setPagoDesc("");
      setPagoMonto("");
      setPagoFecha(new Date().toISOString().split("T")[0]);
      setToast({ text: "Reembolso registrado correctamente", type: "success" });
      loadLoan();
    } catch (err: unknown) {
      setToast({ text: err instanceof Error ? err.message : "Error al registrar reembolso", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDescargarComanda = async () => {
    setPdfLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/caja/prestamos/${id}/pdf`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!res.ok) throw new Error("Error al generar el PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prestamo-${loan?.descripcion?.slice(0, 20) || id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setToast({ text: "Préstamo descargado correctamente", type: "success" });
    } catch (err) {
      setToast({ text: err instanceof Error ? err.message : "Error al descargar", type: "error" });
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!loan) return null;

  return (
    <div>
      <PageHeader
        title="Detalle del Préstamo"
        subtitle={loan.descripcion}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleDescargarComanda}
              disabled={pdfLoading}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white font-medium py-2.5 px-5 rounded-xl transition-colors shadow-sm text-sm disabled:opacity-60"
            >
              <FileDown className="w-4 h-4" />
              {pdfLoading ? "Generando…" : "Descargar préstamo"}
            </button>
            {loan.saldoPendiente > 0 && (
              <button
                onClick={() => setShowPago(!showPago)}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 px-5 rounded-xl transition-colors shadow-sm text-sm"
              >
                <ArrowDownToLine className="w-4 h-4" />
                Registrar Reembolso
              </button>
            )}
          </div>
        }
      />

      <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/prestamos" className="text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Préstamos
        </Link>
      </div>

      {/* Form reembolso */}
      {showPago && (
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6 mb-6 max-w-lg">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-red-600 flex items-center gap-2">
              <ArrowDownToLine className="w-4.5 h-4.5" />
              Registrar Reembolso al Administrador
            </h3>
            <button
              onClick={() => setShowPago(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Saldo pendiente: <span className="font-bold text-slate-700">{formatCOP(loan.saldoPendiente)}</span>
          </p>
          <form onSubmit={handleRegistrarPago} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Descripción (ej: Reembolso parcial)"
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-900 focus:bg-white focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all"
              value={pagoDesc}
              onChange={(e) => setPagoDesc(e.target.value)}
            />
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  required
                  className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-900 focus:bg-white focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all"
                  value={pagoMonto}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setPagoMonto(raw ? formatNumberInput(parseInt(raw, 10)) : "");
                  }}
                />
              </div>
              <input
                type="date"
                className="px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-900 focus:bg-white focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all"
                value={pagoFecha}
                onChange={(e) => setPagoFecha(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPago(false)}
                className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl text-sm font-medium shadow-sm transition-colors disabled:opacity-60"
              >
                {saving ? "Registrando..." : "Guardar Reembolso"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Monto prestado</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{formatCOP(loan.monto)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total reembolsado</p>
          <p className="text-xl font-bold text-slate-700 mt-1">{formatCOP(loan.totalPagado)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Saldo pendiente</p>
          <p className={`text-xl font-bold mt-1 ${loan.saldoPendiente > 0 ? "text-red-600" : "text-emerald-600"}`}>
            {formatCOP(loan.saldoPendiente)}
          </p>
        </div>
      </div>

      {/* Info prestamista */}
      {loan.prestamista && (
        <p className="text-sm text-slate-500 mb-4">
          Prestamista: <span className="font-medium text-slate-700">{loan.prestamista}</span>
        </p>
      )}

      {/* Historial de reembolsos */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <h3 className="px-5 py-4 font-semibold text-slate-800 border-b border-slate-100">
          Historial de reembolsos
        </h3>
        {loan.pagos.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No hay reembolsos registrados
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {loan.pagos.map((p) => (
              <li key={p.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">{p.descripcion}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(p.fecha).toLocaleDateString("es-CO", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                    {p.prestamista && ` · ${p.prestamista}`}
                  </p>
                </div>
                <span className="text-sm font-bold text-red-600">− {formatCOP(p.monto)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}

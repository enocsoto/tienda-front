"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toast, ToastMessage } from "@/components/ui/Toast";
import { formatCOP } from "@/lib/format";
import { HandCoins, Plus, ArrowLeft, ChevronRight, X } from "lucide-react";

interface Loan {
  id: string;
  monto: number;
  descripcion: string;
  prestamista?: string;
  fecha: string;
}

export default function PrestamosPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNuevo, setShowNuevo] = useState(false);
  const [desc, setDesc] = useState("");
  const [monto, setMonto] = useState("");
  const [prestamista, setPrestamista] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const loadLoans = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchApi("/caja/prestamos");
      setLoans(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setToast({ text: "Error al cargar préstamos", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLoans();
  }, [loadLoans]);

  const handleNuevoPrestamo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetchApi("/caja/prestamo", {
        method: "POST",
        body: JSON.stringify({
          descripcion: desc,
          monto: Number(monto),
          fecha,
          prestamista: prestamista || undefined,
        }),
      });
      setShowNuevo(false);
      setDesc("");
      setMonto("");
      setPrestamista("");
      setFecha(new Date().toISOString().split("T")[0]);
      setToast({ text: "Préstamo registrado correctamente", type: "success" });
      loadLoans();
    } catch (err: unknown) {
      setToast({ text: err instanceof Error ? err.message : "Error al registrar préstamo", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Préstamos a la Tienda"
        subtitle="Registro de préstamos recibidos y reembolsos a administradores"
        actions={
          <button
            onClick={() => setShowNuevo(!showNuevo)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2.5 px-5 rounded-xl transition-colors shadow-sm text-sm"
          >
            <Plus className="w-4 h-4" />
            Registrar Préstamo
          </button>
        }
      />

      <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/caja" className="text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Caja
        </Link>
      </div>

      {/* Form nuevo préstamo */}
      {showNuevo && (
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-6 mb-6 max-w-lg">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-emerald-600 flex items-center gap-2">
              <HandCoins className="w-4.5 h-4.5" />
              Registrar Préstamo Recibido
            </h3>
            <button
              onClick={() => setShowNuevo(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleNuevoPrestamo} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Descripción (ej: Préstamo para compra de inventario)"
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-900 focus:bg-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
            <input
              type="text"
              placeholder="Prestamista / Administrador (opcional)"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-900 focus:bg-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
              value={prestamista}
              onChange={(e) => setPrestamista(e.target.value)}
            />
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">$</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  required
                  className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-900 focus:bg-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                />
              </div>
              <input
                type="date"
                className="px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-900 focus:bg-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowNuevo(false)}
                className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-medium shadow-sm transition-colors disabled:opacity-60"
              >
                {saving ? "Registrando..." : "Guardar Préstamo"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de préstamos */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 animate-pulse">
            <div className="h-4 bg-slate-100 rounded w-1/3 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-slate-50 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      ) : loans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <HandCoins className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No hay préstamos registrados</p>
          <p className="text-sm text-slate-400 mt-1">Registra un préstamo cuando un administrador preste dinero a la tienda</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {loans.map((loan) => (
              <li key={loan.id}>
                <Link
                  href={`/admin/prestamos/${loan.id}`}
                  className="block px-5 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{loan.descripcion}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(loan.fecha).toLocaleDateString("es-CO", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                        {loan.prestamista && ` · ${loan.prestamista}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-bold text-emerald-600">{formatCOP(loan.monto)}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}

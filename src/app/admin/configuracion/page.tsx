"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toast, ToastMessage } from "@/components/ui/Toast";
import { Percent, Save, Store, Image, CreditCard, Plus, Pencil, Trash2 } from "lucide-react";

interface NequiCuenta {
  numero: string;
  nombre: string;
  apellido?: string;
}

const TIENDA_NOMBRE_KEY = "kiosko_tienda_nombre";
const TIENDA_LOGO_KEY = "kiosko_tienda_logo";
export const TIENDA_UPDATED_EVENT = "kiosko-tienda-updated";

function getTiendaFromStorage() {
  if (typeof window === "undefined") return { nombre: "", logo: "" };
  return {
    nombre: localStorage.getItem(TIENDA_NOMBRE_KEY) || "",
    logo: localStorage.getItem(TIENDA_LOGO_KEY) || "",
  };
}

export default function ConfiguracionPage() {
  const [ganancia, setGanancia] = useState<number | "">("");
  const [tiendaNombre, setTiendaNombre] = useState("");
  const [tiendaLogo, setTiendaLogo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingTienda, setSavingTienda] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [nequiCuentas, setNequiCuentas] = useState<NequiCuenta[]>([]);
  const [nequiLoading, setNequiLoading] = useState(true);
  const [nequiSaving, setNequiSaving] = useState(false);
  const [nequiForm, setNequiForm] = useState<NequiCuenta>({ numero: "", nombre: "", apellido: "" });
  const [nequiEditingIndex, setNequiEditingIndex] = useState<number | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      const data = await fetchApi("/config/ganancia");
      if (data) setGanancia(data.ganancia);
    } catch {
      setToast({ text: "Error al cargar la configuración", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadNequi = useCallback(async () => {
    try {
      const data = await fetchApi("/config/nequi");
      setNequiCuentas(Array.isArray(data) ? data : []);
    } catch {
      setNequiCuentas([]);
    } finally {
      setNequiLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
    loadNequi();
    const tienda = getTiendaFromStorage();
    setTiendaNombre(tienda.nombre);
    setTiendaLogo(tienda.logo);
  }, [loadConfig, loadNequi]);

  const handleSaveTienda = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTienda(true);
    try {
      localStorage.setItem(TIENDA_NOMBRE_KEY, tiendaNombre.trim() || "Kiosko");
      localStorage.setItem(TIENDA_LOGO_KEY, tiendaLogo.trim());
      window.dispatchEvent(new CustomEvent(TIENDA_UPDATED_EVENT));
      setToast({ text: "Datos de la tienda actualizados", type: "success" });
    } catch {
      setToast({ text: "Error al guardar los datos de la tienda", type: "error" });
    } finally {
      setSavingTienda(false);
    }
  };

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setTiendaLogo(String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = await fetchApi("/config/ganancia", {
        method: "PUT",
        body: JSON.stringify({ ganancia: Number(ganancia) }),
      });
      setGanancia(data.ganancia);
      setToast({ text: "Margen de ganancia actualizado correctamente", type: "success" });
    } catch (err: unknown) {
      setToast({
        text: err instanceof Error ? err.message : "Error al guardar",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNequi = async (e: React.FormEvent) => {
    e.preventDefault();
    const { numero, nombre, apellido } = nequiForm;
    if (!numero.trim() || !nombre.trim()) {
      setToast({ text: "Número y nombre son obligatorios", type: "error" });
      return;
    }
    setNequiSaving(true);
    try {
      let next = [...nequiCuentas];
      if (nequiEditingIndex !== null) {
        next[nequiEditingIndex] = { numero: numero.trim(), nombre: nombre.trim(), apellido: apellido?.trim() || "" };
        setNequiEditingIndex(null);
      } else {
        next.push({ numero: numero.trim(), nombre: nombre.trim(), apellido: apellido?.trim() || "" });
      }
      await fetchApi("/config/nequi", { method: "POST", body: JSON.stringify({ cuentas: next }) });
      setNequiCuentas(next);
      setNequiForm({ numero: "", nombre: "", apellido: "" });
      setToast({ text: "Cuenta Nequi guardada", type: "success" });
    } catch (err) {
      setToast({ text: err instanceof Error ? err.message : "Error al guardar", type: "error" });
    } finally {
      setNequiSaving(false);
    }
  };

  const handleEditNequi = (index: number) => {
    const c = nequiCuentas[index];
    setNequiForm({ numero: c.numero, nombre: c.nombre, apellido: c.apellido ?? "" });
    setNequiEditingIndex(index);
  };

  const handleDeleteNequi = async (index: number) => {
    const next = nequiCuentas.filter((_, i) => i !== index);
    setNequiSaving(true);
    try {
      await fetchApi("/config/nequi", { method: "POST", body: JSON.stringify({ cuentas: next }) });
      setNequiCuentas(next);
      if (nequiEditingIndex === index) {
        setNequiEditingIndex(null);
        setNequiForm({ numero: "", nombre: "", apellido: "" });
      } else if (nequiEditingIndex !== null && nequiEditingIndex > index) {
        setNequiEditingIndex(nequiEditingIndex - 1);
      }
      setToast({ text: "Cuenta Nequi eliminada", type: "success" });
    } catch (err) {
      setToast({ text: err instanceof Error ? err.message : "Error al eliminar", type: "error" });
    } finally {
      setNequiSaving(false);
    }
  };

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Configuración Global"
        subtitle="Administra los parámetros generales del sistema"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Card header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center">
            <Percent className="w-4.5 h-4.5 text-sky-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800 text-sm">Margen de Ganancia</h2>
            <p className="text-xs text-slate-400">
              Se aplica automáticamente a todos los productos
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-1/3" />
              <div className="h-11 bg-slate-100 rounded-xl w-1/2" />
              <div className="h-10 bg-slate-100 rounded-xl w-1/3" />
            </div>
          ) : (
            <form onSubmit={handleSave} className="flex flex-col gap-5 max-w-xs">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Porcentaje de ganancia
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    required
                    className="w-full pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 font-semibold text-lg focus:bg-white focus:border-sky-400 focus:outline-none focus:ring-3 focus:ring-sky-100 transition-all"
                    value={ganancia}
                    onChange={(e) =>
                      setGanancia(e.target.value ? Number(e.target.value) : "")
                    }
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400 font-semibold">
                    %
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Ej: 30 significa que el precio de venta = costo × 1.30
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 w-fit bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 px-6 rounded-xl transition-colors shadow-sm disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {saving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </form>
          )}
        </div>
        </div>

        {/* Datos de la tienda */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center">
            <Store className="w-4.5 h-4.5 text-sky-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800 text-sm">Datos de la tienda</h2>
            <p className="text-xs text-slate-400">
              Nombre y logo que se muestran en el menú
            </p>
          </div>
        </div>
        <div className="px-6 py-6">
          <form onSubmit={handleSaveTienda} className="flex flex-col gap-5 max-w-md">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Nombre de la tienda
              </label>
              <input
                type="text"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm focus:bg-white focus:border-sky-400 focus:outline-none focus:ring-3 focus:ring-sky-100 transition-all"
                placeholder="Ej: Kiosko, Mi Tienda..."
                value={tiendaNombre}
                onChange={(e) => setTiendaNombre(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Logo (URL o imagen)
              </label>
              <input
                type="url"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm focus:bg-white focus:border-sky-400 focus:outline-none focus:ring-3 focus:ring-sky-100 transition-all"
                placeholder="https://... o sube una imagen"
                value={tiendaLogo.startsWith("data:") ? "" : tiendaLogo}
                onChange={(e) => setTiendaLogo(e.target.value)}
              />
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-slate-400">o</span>
                <label className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-700 cursor-pointer">
                  <Image className="w-3.5 h-3.5" />
                  Subir imagen
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleLogoFile}
                  />
                </label>
              </div>
              {tiendaLogo && (
                <div className="mt-2 w-12 h-12 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                  {tiendaLogo.startsWith("data:") || tiendaLogo.startsWith("http") ? (
                    <img src={tiendaLogo} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Store className="w-6 h-6 text-slate-300" />
                  )}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={savingTienda}
              className="flex items-center justify-center gap-2 w-fit bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 px-6 rounded-xl transition-colors shadow-sm disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {savingTienda ? "Guardando..." : "Guardar datos de la tienda"}
            </button>
          </form>
        </div>
        </div>

        {/* Formas de pago Nequi */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-2">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center">
              <CreditCard className="w-4.5 h-4.5 text-sky-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800 text-sm">Formas de pago Nequi</h2>
              <p className="text-xs text-slate-400">
                Cuentas para transferencia. El cliente verá el número y nombre enmascarado (ej. Jua*** Per***).
              </p>
            </div>
          </div>
          <div className="px-6 py-6">
            {nequiLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-10 bg-slate-100 rounded-xl w-2/3" />
                <div className="h-24 bg-slate-100 rounded-xl" />
              </div>
            ) : (
              <>
                {nequiCuentas.length > 0 && (
                  <ul className="space-y-3 mb-6">
                    {nequiCuentas.map((c, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between gap-4 py-3 px-4 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <div>
                          <p className="font-medium text-slate-800">{c.numero}</p>
                          <p className="text-sm text-slate-500">
                            {c.nombre} {c.apellido || ""}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditNequi(i)}
                            className="p-2 rounded-lg text-sky-600 hover:bg-sky-50"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteNequi(i)}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <form onSubmit={handleSaveNequi} className="flex flex-col gap-4 max-w-md">
                  <h3 className="text-sm font-medium text-slate-700">
                    {nequiEditingIndex !== null ? "Editar cuenta" : "Agregar cuenta Nequi"}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Número (celular)</label>
                      <input
                        type="text"
                        value={nequiForm.numero}
                        onChange={(e) => setNequiForm((p) => ({ ...p, numero: e.target.value }))}
                        placeholder="300 123 4567"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Nombre</label>
                      <input
                        type="text"
                        value={nequiForm.nombre}
                        onChange={(e) => setNequiForm((p) => ({ ...p, nombre: e.target.value }))}
                        placeholder="Juan"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Apellido (opcional)</label>
                      <input
                        type="text"
                        value={nequiForm.apellido}
                        onChange={(e) => setNequiForm((p) => ({ ...p, apellido: e.target.value }))}
                        placeholder="Pérez"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={nequiSaving}
                      className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium py-2 px-4 rounded-xl disabled:opacity-60"
                    >
                      <Save className="w-4 h-4" />
                      {nequiEditingIndex !== null ? "Guardar cambios" : "Guardar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setNequiEditingIndex(null); setNequiForm({ numero: "", nombre: "", apellido: "" }); }}
                      className="inline-flex items-center gap-1.5 border border-slate-200 text-slate-700 text-sm font-medium py-2 px-4 rounded-xl hover:bg-slate-50"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar cuenta
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}

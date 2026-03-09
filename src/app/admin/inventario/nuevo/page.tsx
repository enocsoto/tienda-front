"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { fetchApi } from "@/lib/api";
import { formatNumberInput, parseNumberInput } from "@/lib/format";
import { getCategoriasDisponibles, crearCategoria } from "@/lib/inventario";
import Link from "next/link";
import { ArrowLeft, ChevronDown, Package, Save, ImageIcon } from "lucide-react";

const OPCION_NUEVA_CATEGORIA = "__nueva__";

const UNIDADES_OPCIONES = ["unidad", "bulto", "bolsa", "caja", "paquete", "litro", "ml", "kg", "gramos", "lb"];

interface FormState {
  nombre: string;
  categoria: string;
  nuevaCategoria: string;
  costo: string;
  stock_actual: string;
  unidad: string;
  imagen: string;
}

const initialForm: FormState = {
  nombre: "",
  categoria: "",
  nuevaCategoria: "",
  costo: "",
  stock_actual: "",
  unidad: "unidad",
  imagen: "",
};

export default function NuevoProductoPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getCategoriasDisponibles().then((list) => {
      setCategorias(list);
      setForm((prev) => {
        if (!prev.categoria && list.length > 0 && list[0] !== OPCION_NUEVA_CATEGORIA) {
          return { ...prev, categoria: list[0] };
        }
        return prev;
      });
    });
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      if (name === "costo") {
        setForm((prev) => ({ ...prev, costo: value }));
        return;
      }
      setForm((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleCostoBlur = useCallback(() => {
    const parsed = parseNumberInput(form.costo);
    setForm((prev) => ({ ...prev, costo: formatNumberInput(parsed) }));
  }, [form.costo]);

  const handleImageFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setForm((prev) => ({ ...prev, imagen: dataUrl }));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      let categoriaFinal = form.categoria.trim() || "General";
      if (form.categoria === OPCION_NUEVA_CATEGORIA) {
        const nueva = form.nuevaCategoria.trim();
        if (!nueva) {
          setError("Escribe el nombre de la nueva categoría");
          setSaving(false);
          return;
        }
        categoriaFinal = await crearCategoria(nueva);
      }

      await fetchApi("/inventario", {
        method: "POST",
        body: JSON.stringify({
          nombre: form.nombre,
          categoria: categoriaFinal,
          costo: parseNumberInput(form.costo),
          stock_actual: Number(form.stock_actual),
          unidad: form.unidad || "unidad",
          imagen: form.imagen.trim() || undefined,
        }),
      });
      router.refresh();
      router.push("/admin/inventario");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al crear el producto");
      setSaving(false);
    }
  };

  const mostrarInputNuevaCategoria = form.categoria === OPCION_NUEVA_CATEGORIA;

  return (
    <div className="max-w-2xl">
      {/* Back link */}
      <Link
        href="/admin/inventario"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-sky-600 font-medium transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al inventario
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center">
          <Package className="w-5 h-5 text-sky-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Nuevo Producto</h1>
          <p className="text-sm text-slate-500">
            El precio de venta se calculará automáticamente
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 text-sm border border-red-100 font-medium flex items-start gap-2">
            <span>⚠</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Imagen del producto
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 text-sm font-medium hover:bg-slate-100 cursor-pointer transition-colors shrink-0">
                <ImageIcon className="w-4 h-4" />
                Subir imagen desde el dispositivo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFile}
                  className="sr-only"
                />
              </label>
              <span className="text-slate-400 text-sm self-center">o</span>
              <input
                type="url"
                name="imagen"
                value={form.imagen?.startsWith("data:") ? "" : form.imagen}
                onChange={handleChange}
                placeholder="Pegar URL (ej. https://ejemplo.com/imagen.jpg)"
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm focus:bg-white focus:border-sky-400 focus:outline-none focus:ring-3 focus:ring-sky-100 transition-all"
              />
            </div>
            {form.imagen && (
              <div className="mt-3 flex items-start gap-3">
                <div className="relative w-32 h-32 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                  <Image
                    src={form.imagen}
                    alt="Vista previa"
                    fill
                    className="object-cover"
                    sizes="128px"
                    unoptimized
                    onError={(e) => {
                      (e.target as HTMLImageElement).parentElement?.classList.add("hidden");
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, imagen: "" }))}
                  className="text-sm text-slate-500 hover:text-red-600 transition-colors"
                >
                  Quitar imagen
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="nuevo-producto-nombre" className="block text-sm font-medium text-slate-700 mb-1.5">
                Nombre del Producto <span className="text-red-400" aria-hidden>*</span>
              </label>
              <input
                id="nuevo-producto-nombre"
                type="text"
                name="nombre"
                required
                value={form.nombre}
                onChange={handleChange}
                placeholder="Ej: Coca-Cola 600ml"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:border-sky-400 focus:outline-none focus:ring-3 focus:ring-sky-100 transition-all"
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="nuevo-producto-categoria" className="block text-sm font-medium text-slate-700 mb-1.5">
                Categoría
              </label>
              <div className="relative">
                <select
                  id="nuevo-producto-categoria"
                  name="categoria"
                  value={form.categoria || (categorias[0] ?? "")}
                  onChange={handleChange}
                  className="w-full pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm focus:bg-white focus:border-sky-400 focus:outline-none focus:ring-3 focus:ring-sky-100 transition-all appearance-none"
                >
                {categorias.length === 0 && <option value="">Cargando...</option>}
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                {categorias.length > 0 && (
                  <option value={OPCION_NUEVA_CATEGORIA}>+ Crear nueva categoría...</option>
                )}
                </select>
                <ChevronDown
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"
                  aria-hidden
                />
              </div>
              {mostrarInputNuevaCategoria && (
                <div className="mt-3">
                  <label htmlFor="nuevo-producto-nueva-categoria" className="block text-xs font-medium text-slate-500 mb-1">
                    Nombre de la nueva categoría
                  </label>
                  <input
                    id="nuevo-producto-nueva-categoria"
                    type="text"
                    name="nuevaCategoria"
                    value={form.nuevaCategoria}
                    onChange={handleChange}
                    placeholder="Ej: Gaseosas, Lácteos..."
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 text-sm focus:border-sky-400 focus:outline-none focus:ring-3 focus:ring-sky-100 transition-all"
                    autoComplete="off"
                  />
                </div>
              )}
            </div>
            <div>
              <label htmlFor="nuevo-producto-costo" className="block text-sm font-medium text-slate-700 mb-1.5">
                Costo ($) <span className="text-red-400" aria-hidden>*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm" aria-hidden>
                  $
                </span>
                <input
                  id="nuevo-producto-costo"
                  type="text"
                  inputMode="decimal"
                  name="costo"
                  required
                  value={form.costo}
                  onChange={handleChange}
                  onBlur={handleCostoBlur}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:border-sky-400 focus:outline-none focus:ring-3 focus:ring-sky-100 transition-all"
                />
              </div>
            </div>
            <div>
              <label htmlFor="nuevo-producto-stock" className="block text-sm font-medium text-slate-700 mb-1.5">
                Cantidad inicial <span className="text-red-400" aria-hidden>*</span>
              </label>
              <input
                id="nuevo-producto-stock"
                type="number"
                name="stock_actual"
                min={0}
                required
                value={form.stock_actual}
                onChange={handleChange}
                placeholder="0"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:border-sky-400 focus:outline-none focus:ring-3 focus:ring-sky-100 transition-all"
              />
            </div>
            <div>
              <label htmlFor="nuevo-producto-unidad" className="block text-sm font-medium text-slate-700 mb-1.5">
                Unidad
              </label>
              <select
                id="nuevo-producto-unidad"
                name="unidad"
                value={form.unidad}
                onChange={handleChange}
                className="w-full pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm focus:bg-white focus:border-sky-400 focus:outline-none focus:ring-3 focus:ring-sky-100 transition-all appearance-none"
              >
                {UNIDADES_OPCIONES.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-sky-50 border border-sky-100 rounded-xl px-4 py-3">
            <p className="text-xs text-sky-700 font-medium">
              💡 El precio de venta se calculará automáticamente aplicando el margen de ganancia
              configurado en el sistema.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/admin/inventario"
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 px-6 rounded-xl transition-colors shadow-sm disabled:opacity-60 text-sm"
            >
              <Save className="w-4 h-4" />
              {saving ? "Guardando..." : "Guardar Producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

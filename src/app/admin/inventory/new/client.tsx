"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { crearCategoria, getCategoriasDisponibles } from "@/lib/inventory";
import { parseNumberInput } from "@/lib/format";
import Link from "next/link";
import { ArrowLeft, Package, Save } from "lucide-react";
import { useProductMargin } from "../hooks/useProductMargin";
import { ProductInfoCard, OPCION_NUEVA_CATEGORIA } from "../components/ProductInfoCard";
import { ProductFormFields } from "../components/ProductFormFields";

export default function NuevoProductoPage() {
  const router = useRouter();
  const margin = useProductMargin();
  const [form, setForm] = useState({
    nombre: "",
    categoria: "",
    nuevaCategoria: "",
    costo: 0,
    stock_actual: 0,
    precio_venta: 0,
    unidad: "unidad",
    imagen: "",
  });
  const [categorias, setCategorias] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const marginInicializado = useRef(false);
  const margenEditadoPorUsuario = useRef(false);

  useEffect(() => {
    Promise.all([getCategoriasDisponibles(), fetchApi("/config/ganancia")])
      .then(([list, config]) => {
        setCategorias(list);
        const raw = Number((config as { ganancia?: number }).ganancia);
        if (!margenEditadoPorUsuario.current && !marginInicializado.current && Number.isFinite(raw)) {
          margin.initFromGananciaGlobal(raw);
          marginInicializado.current = true;
        }
        setForm((prev) => {
          if (!prev.categoria && list.length > 0 && list[0] !== OPCION_NUEVA_CATEGORIA) {
            return { ...prev, categoria: list[0] };
          }
          return prev;
        });
      })
      .catch(() => setError("Error al cargar categorías o configuración"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncPrecioToForm = (precio: number) => {
    setForm((prev) => ({ ...prev, precio_venta: precio }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "costo") {
      margin.setCostoDisplay(value);
      setForm((prev) => ({ ...prev, costo: parseNumberInput(value) }));
      return;
    }
    if (name === "precio_venta") {
      margin.setPrecioVentaDisplay(value);
      setForm((prev) => ({ ...prev, precio_venta: parseNumberInput(value) }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      [name]: e.target.type === "number" ? Number(value) : value,
    }));
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setForm((prev) => ({ ...prev, imagen: dataUrl }));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

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

      const costo = margin.parseCosto();
      const precio_venta = margin.computeSubmitPrecio();

      await fetchApi("/inventario", {
        method: "POST",
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          categoria: categoriaFinal,
          costo,
          precio_venta,
          stock_actual: Number(form.stock_actual),
          unidad: form.unidad || "unidad",
          imagen: form.imagen.trim() || undefined,
        }),
      });
      router.refresh();
      router.push("/admin/inventory");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al crear el producto");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl w-full min-w-0 space-y-4 animate-pulse">
        <div className="h-5 bg-slate-100 rounded w-32 mb-8" />
        <div className="h-8 bg-slate-100 rounded w-64 mb-2" />
        <div className="bg-white rounded-2xl border border-slate-100 p-8 space-y-4">
          <div className="h-20 bg-slate-100 rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-11 bg-slate-100 rounded-xl" />
            <div className="h-11 bg-slate-100 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl w-full min-w-0">
      <Link
        href="/admin/inventory"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-sky-600 font-medium transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al inventario
      </Link>

      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center shrink-0">
          <Package className="w-5 h-5 text-sky-600" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900">Nuevo Producto</h1>
          <p className="text-sm text-slate-500">Define costo, margen y precio de venta</p>
        </div>
      </div>

      <ProductInfoCard
        idPrefix="nuevo-producto"
        nombre={form.nombre}
        categoria={form.categoria}
        nuevaCategoria={form.nuevaCategoria}
        imagen={form.imagen}
        precioVentaDisplay={margin.precioVentaDisplay}
        precioVentaResaltado={margin.precioVentaResaltado}
        onPrecioChange={handleChange}
        onPrecioBlur={() => {
          const parsed = margin.handlePrecioVentaBlur();
          setForm((prev) => ({ ...prev, precio_venta: parsed }));
        }}
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-8">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 text-sm border border-red-100 font-medium">
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <ProductFormFields
            idPrefix="nuevo-producto"
            stockLabel="Cantidad inicial"
            form={form}
            categorias={categorias}
            costoDisplay={margin.costoDisplay}
            gananciaDisplay={margin.gananciaDisplay}
            onChange={handleChange}
            onCostoBlur={() => {
              const parsed = margin.handleCostoBlur(syncPrecioToForm);
              setForm((prev) => ({ ...prev, costo: parsed }));
            }}
            onGananciaChange={(e) => {
              margenEditadoPorUsuario.current = true;
              margin.setGananciaDisplay(e.target.value);
            }}
            onGananciaBlur={() => margin.handleGananciaBlur(syncPrecioToForm)}
            onImageFile={handleImageFile}
            onRemoveImage={() => setForm((prev) => ({ ...prev, imagen: "" }))}
          />

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
            <Link
              href="/admin/inventory"
              className="w-full sm:w-auto text-center px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 px-6 rounded-xl transition-colors shadow-sm disabled:opacity-60 text-sm"
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

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { fetchApi } from "@/lib/api";
import { getCategoriasDisponibles, crearCategoria } from "@/lib/inventory";
import { formatNumberInput, parseNumberInput } from "@/lib/format";
import Link from "next/link";
import { ArrowLeft, Pencil, Save, ImageIcon } from "lucide-react";

interface EditProductClientProps {
  id: string;
}

const UNIDADES_OPCIONES = ["unidad", "bulto", "bolsa", "caja", "paquete", "litro", "ml", "kg", "gramos", "lb"];

const OPCION_NUEVA_CATEGORIA = "__nueva__";

export function EditProductClient({ id }: EditProductClientProps) {
  const router = useRouter();
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
  const [costoDisplay, setCostoDisplay] = useState("0");
  const [precioVentaDisplay, setPrecioVentaDisplay] = useState("0");
  const [gananciaPct, setGananciaPct] = useState(0);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const [data, list, gananciaRes] = await Promise.all([
          fetchApi(`/inventario/${id}`),
          getCategoriasDisponibles(),
          fetchApi("/config/ganancia").catch(() => ({ ganancia: 0 })),
        ]);
        setGananciaPct(Number((gananciaRes as { ganancia?: number }).ganancia) || 0);
        const cat = (data.categoria as string)?.trim() || "General";
        const merged =
          cat && !list.includes(cat) ? [...list, cat] : list.length ? list : [cat];
        setCategorias(merged);
        setForm({
          nombre: data.nombre ?? "",
          categoria: cat,
          nuevaCategoria: "",
          costo: data.costo,
          stock_actual: data.stock_actual,
          precio_venta: data.precio_venta,
          unidad: data.unidad ?? "unidad",
          imagen: data.imagen ?? "",
        });
        setCostoDisplay(formatNumberInput(data.costo));
        setPrecioVentaDisplay(formatNumberInput(data.precio_venta));
      } catch {
        setError("Error al cargar el producto");
      } finally {
        setLoading(false);
      }
    };
    if (id) loadProduct();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "costo") {
      setCostoDisplay(value);
      setForm((prev) => ({ ...prev, costo: parseNumberInput(value) }));
      return;
    }
    if (name === "precio_venta") {
      setPrecioVentaDisplay(value);
      setForm((prev) => ({ ...prev, precio_venta: parseNumberInput(value) }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      [name]: e.target.type === "number" ? Number(value) : value,
    }));
  };

  const handleCostoBlur = () => {
    const parsed = parseNumberInput(costoDisplay);
    setForm((prev) => ({ ...prev, costo: parsed }));
    setCostoDisplay(formatNumberInput(parsed));
    const recalculado = parseFloat((parsed * (1 + gananciaPct / 100)).toFixed(2));
    setForm((prev) => ({ ...prev, precio_venta: recalculado }));
    setPrecioVentaDisplay(formatNumberInput(recalculado));
  };

  const handlePrecioVentaBlur = () => {
    const parsed = parseNumberInput(precioVentaDisplay);
    setForm((prev) => ({ ...prev, precio_venta: parsed }));
    setPrecioVentaDisplay(formatNumberInput(parsed));
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

      await fetchApi(`/inventario/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          categoria: categoriaFinal,
          costo: Number(form.costo),
          precio_venta: parseNumberInput(precioVentaDisplay),
          stock_actual: Number(form.stock_actual),
          unidad: form.unidad || "unidad",
          imagen: form.imagen.trim(),
        }),
      });
      router.push("/admin/inventory");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al actualizar el producto");
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="max-w-2xl space-y-4 animate-pulse">
        <div className="h-5 bg-slate-100 rounded w-32 mb-8" />
        <div className="h-8 bg-slate-100 rounded w-64 mb-2" />
        <div className="bg-white rounded-2xl border border-slate-100 p-8 space-y-4">
          <div className="h-20 bg-slate-100 rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-11 bg-slate-100 rounded-xl" />
            <div className="h-11 bg-slate-100 rounded-xl" />
          </div>
        </div>
      </div>
    );

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/inventory"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-sky-600 font-medium transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al inventario
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center">
          <Pencil className="w-5 h-5 text-sky-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Editar Producto</h1>
          <p className="text-sm text-slate-500">Nombre, categoría, costo, precio de venta y stock</p>
        </div>
      </div>

      {/* Product info card */}
      <div className="bg-sky-50 border border-sky-100 rounded-2xl px-6 py-4 mb-6 flex items-center gap-4">
        {form.imagen ? (
          <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-200 shrink-0">
            <Image
              src={form.imagen}
              alt={form.nombre}
              fill
              className="object-cover"
              sizes="80px"
              unoptimized
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
            <ImageIcon className="w-8 h-8 text-slate-400" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-slate-800 truncate">{form.nombre || "Sin nombre"}</h3>
          <p className="text-sm text-slate-500 mt-0.5 truncate">
            {form.categoria === OPCION_NUEVA_CATEGORIA
              ? form.nuevaCategoria.trim() || "Nueva categoría…"
              : form.categoria || "—"}
          </p>
        </div>
        <div className="shrink-0 w-full sm:w-52 sm:text-right">
          <label
            className="text-xs text-slate-400 font-medium block mb-1 sm:text-right"
            htmlFor="editar-producto-precio-venta-card"
          >
            Precio de venta ($)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">$</span>
            <input
              id="editar-producto-precio-venta-card"
              type="text"
              inputMode="decimal"
              name="precio_venta"
              value={precioVentaDisplay}
              onChange={handleChange}
              onBlur={handlePrecioVentaBlur}
              placeholder="0"
              className="w-full pl-8 pr-3 py-2 border border-sky-200 rounded-xl bg-white text-sky-900 text-base font-bold focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 text-sm border border-red-100 font-medium">
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="editar-producto-nombre">
                Nombre del producto
              </label>
              <input
                id="editar-producto-nombre"
                type="text"
                name="nombre"
                required
                value={form.nombre}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm focus:bg-white focus:border-sky-400 focus:outline-none focus:ring-3 focus:ring-sky-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="editar-producto-categoria">
                Categoría (tipo)
              </label>
              <select
                id="editar-producto-categoria"
                name="categoria"
                value={form.categoria}
                onChange={handleChange}
                className="w-full pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm focus:bg-white focus:border-sky-400 focus:outline-none focus:ring-3 focus:ring-sky-100 transition-all appearance-none"
              >
                {categorias.length === 0 && <option value="">Cargando…</option>}
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value={OPCION_NUEVA_CATEGORIA}>+ Nueva categoría</option>
              </select>
            </div>
            {form.categoria === OPCION_NUEVA_CATEGORIA && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="editar-producto-nueva-categoria">
                  Nombre de la nueva categoría
                </label>
                <input
                  id="editar-producto-nueva-categoria"
                  type="text"
                  name="nuevaCategoria"
                  value={form.nuevaCategoria}
                  onChange={handleChange}
                  placeholder="Ej. Abarrotes"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm focus:bg-white focus:border-sky-400 focus:outline-none focus:ring-3 focus:ring-sky-100 transition-all"
                />
              </div>
            )}
          </div>

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
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Nuevo Costo ($)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">
                  $
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  name="costo"
                  required
                  value={costoDisplay}
                  onChange={handleChange}
                  onBlur={handleCostoBlur}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm focus:bg-white focus:border-sky-400 focus:outline-none focus:ring-3 focus:ring-sky-100 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Unidades en tienda
              </label>
              <input
                type="number"
                name="stock_actual"
                min="0"
                required
                value={form.stock_actual}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm focus:bg-white focus:border-sky-400 focus:outline-none focus:ring-3 focus:ring-sky-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Unidad
              </label>
              <select
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

          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <p className="text-xs text-amber-700 font-medium">
              💡 Puedes ajustar el precio de venta manualmente. Si cambias el costo y sales del campo,
              el precio se recalcula con el margen configurado; puedes volver a editarlo después si lo
              necesitas.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/admin/inventory"
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
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import Image from "next/image";
import { ChevronDown, ImageIcon } from "lucide-react";
import { OPCION_NUEVA_CATEGORIA } from "./ProductInfoCard";

export const UNIDADES_OPCIONES = [
  "unidad",
  "bulto",
  "bolsa",
  "caja",
  "paquete",
  "litro",
  "ml",
  "kg",
  "gramos",
  "lb",
];

interface ProductFormFieldsProps {
  form: {
    nombre: string;
    categoria: string;
    nuevaCategoria: string;
    stock_actual: number;
    unidad: string;
    imagen: string;
  };
  categorias: string[];
  costoDisplay: string;
  gananciaDisplay: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onCostoBlur: () => void;
  onGananciaChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGananciaBlur: () => void;
  onImageFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  idPrefix?: string;
  stockLabel?: string;
}

export function ProductFormFields({
  form,
  categorias,
  costoDisplay,
  gananciaDisplay,
  onChange,
  onCostoBlur,
  onGananciaChange,
  onGananciaBlur,
  onImageFile,
  onRemoveImage,
  idPrefix = "producto",
  stockLabel = "Unidades en tienda",
}: ProductFormFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor={`${idPrefix}-nombre`}>
            Nombre del producto <span className="text-red-400" aria-hidden>*</span>
          </label>
          <input
            id={`${idPrefix}-nombre`}
            type="text"
            name="nombre"
            required
            value={form.nombre}
            onChange={onChange}
            placeholder="Ej: Coca-Cola 600ml"
            autoComplete="off"
            className="w-full min-w-0 px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm focus:bg-white focus:border-sky-400 focus:outline-none focus:ring-3 focus:ring-sky-100 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor={`${idPrefix}-categoria`}>
            Categoría
          </label>
          <div className="relative">
            <select
              id={`${idPrefix}-categoria`}
              name="categoria"
              value={form.categoria}
              onChange={onChange}
              className="w-full min-w-0 pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm focus:bg-white focus:border-sky-400 focus:outline-none focus:ring-3 focus:ring-sky-100 transition-all appearance-none"
            >
              {categorias.length === 0 && <option value="">Cargando…</option>}
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value={OPCION_NUEVA_CATEGORIA}>+ Nueva categoría</option>
            </select>
            <ChevronDown
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"
              aria-hidden
            />
          </div>
        </div>
        {form.categoria === OPCION_NUEVA_CATEGORIA && (
          <div>
            <label
              className="block text-sm font-medium text-slate-700 mb-1.5"
              htmlFor={`${idPrefix}-nueva-categoria`}
            >
              Nombre de la nueva categoría
            </label>
            <input
              id={`${idPrefix}-nueva-categoria`}
              type="text"
              name="nuevaCategoria"
              value={form.nuevaCategoria}
              onChange={onChange}
              placeholder="Ej. Abarrotes"
              className="w-full min-w-0 px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm focus:bg-white focus:border-sky-400 focus:outline-none focus:ring-3 focus:ring-sky-100 transition-all"
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Imagen del producto</label>
        <div className="flex flex-col gap-3">
          <label className="flex w-full items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 text-sm font-medium hover:bg-slate-100 cursor-pointer transition-colors">
            <ImageIcon className="w-4 h-4 shrink-0" />
            <span className="text-center">Subir imagen desde el dispositivo</span>
            <input type="file" accept="image/*" onChange={onImageFile} className="sr-only" />
          </label>
          <p className="text-xs text-slate-400 text-center sm:text-left">o pegar URL de imagen</p>
          <input
            type="url"
            name="imagen"
            value={form.imagen?.startsWith("data:") ? "" : form.imagen}
            onChange={onChange}
            placeholder="https://ejemplo.com/imagen.jpg"
            className="w-full min-w-0 px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm focus:bg-white focus:border-sky-400 focus:outline-none focus:ring-3 focus:ring-sky-100 transition-all"
          />
        </div>
        {form.imagen && (
          <div className="mt-3 flex flex-col sm:flex-row items-start gap-3">
            <div className="relative w-full max-w-[8rem] aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
              <Image
                src={form.imagen}
                alt="Vista previa del producto"
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
              onClick={onRemoveImage}
              className="text-sm text-slate-500 hover:text-red-600 transition-colors"
            >
              Quitar imagen
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor={`${idPrefix}-costo`}>
            Costo ($) <span className="text-red-400" aria-hidden>*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">$</span>
            <input
              id={`${idPrefix}-costo`}
              type="text"
              inputMode="decimal"
              name="costo"
              required
              value={costoDisplay}
              onChange={onChange}
              onBlur={onCostoBlur}
              placeholder="0"
              className="w-full min-w-0 pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm focus:bg-white focus:border-sky-400 focus:outline-none focus:ring-3 focus:ring-sky-100 transition-all"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor={`${idPrefix}-ganancia`}>
            Porcentaje de ganancia
          </label>
          <div className="relative">
            <input
              id={`${idPrefix}-ganancia`}
              type="text"
              inputMode="decimal"
              name="ganancia"
              value={gananciaDisplay}
              onChange={onGananciaChange}
              onBlur={onGananciaBlur}
              placeholder="0"
              className="w-full min-w-0 pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm focus:bg-white focus:border-sky-400 focus:outline-none focus:ring-3 focus:ring-sky-100 transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">%</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor={`${idPrefix}-stock`}>
            {stockLabel} <span className="text-red-400" aria-hidden>*</span>
          </label>
          <input
            id={`${idPrefix}-stock`}
            type="number"
            name="stock_actual"
            min={0}
            required
            value={form.stock_actual}
            onChange={onChange}
            placeholder="0"
            className="w-full min-w-0 px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm focus:bg-white focus:border-sky-400 focus:outline-none focus:ring-3 focus:ring-sky-100 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor={`${idPrefix}-unidad`}>
            Unidad
          </label>
          <select
            id={`${idPrefix}-unidad`}
            name="unidad"
            value={form.unidad}
            onChange={onChange}
            className="w-full min-w-0 pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm focus:bg-white focus:border-sky-400 focus:outline-none focus:ring-3 focus:ring-sky-100 transition-all appearance-none"
          >
            {UNIDADES_OPCIONES.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
        <p className="text-xs text-amber-700 font-medium">
          El % de ganancia aplica a este producto. Si lo cambias, se actualiza el precio de venta. Si
          cambias el costo, se recalcula el precio con el mismo %. Si editas el precio de venta (arriba),
          se actualiza el % automáticamente.
        </p>
      </div>
    </>
  );
}

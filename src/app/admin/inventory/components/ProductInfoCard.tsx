import Image from "next/image";
import { ImageIcon } from "lucide-react";

export const OPCION_NUEVA_CATEGORIA = "__nueva__";

interface ProductInfoCardProps {
  nombre: string;
  categoria: string;
  nuevaCategoria: string;
  imagen: string;
  precioVentaDisplay: string;
  precioVentaResaltado: boolean;
  onPrecioChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPrecioBlur: () => void;
  idPrefix?: string;
}

export function ProductInfoCard({
  nombre,
  categoria,
  nuevaCategoria,
  imagen,
  precioVentaDisplay,
  precioVentaResaltado,
  onPrecioChange,
  onPrecioBlur,
  idPrefix = "producto",
}: ProductInfoCardProps) {
  const precioId = `${idPrefix}-precio-venta-card`;

  return (
    <div className="bg-sky-50 border border-sky-100 rounded-2xl px-4 py-4 sm:px-6 mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-4 min-w-0 w-full">
        {imagen ? (
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-200 shrink-0">
            <Image
              src={imagen}
              alt={nombre || "Imagen del producto"}
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
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
            <ImageIcon className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-slate-800 truncate text-sm sm:text-base">
            {nombre || "Sin nombre"}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
            {categoria === OPCION_NUEVA_CATEGORIA
              ? nuevaCategoria.trim() || "Nueva categoría…"
              : categoria || "—"}
          </p>
        </div>
      </div>
      <div className="w-full sm:w-52 sm:shrink-0 pt-3 sm:pt-0 border-t border-sky-200/60 sm:border-t-0">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 mb-1.5 sm:justify-end sm:text-right">
          <label className="text-xs text-slate-500 font-medium shrink-0" htmlFor={precioId}>
            Precio de venta ($)
          </label>
          {precioVentaResaltado && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-sky-700 bg-sky-200/80 px-2 py-0.5 rounded-full animate-pulse shrink-0">
              Actualizado
            </span>
          )}
        </div>
        <div className="relative w-full min-w-0">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">
            $
          </span>
          <input
            id={precioId}
            type="text"
            inputMode="decimal"
            name="precio_venta"
            value={precioVentaDisplay}
            onChange={onPrecioChange}
            onBlur={onPrecioBlur}
            placeholder="0"
            className={`w-full min-w-0 pl-8 pr-3 py-2.5 sm:py-2 border rounded-xl text-base font-bold transition-all duration-500 focus:outline-none ${
              precioVentaResaltado
                ? "border-sky-500 bg-sky-100 text-sky-800 ring-2 ring-sky-400/60 shadow-md shadow-sky-200/80 sm:scale-[1.02]"
                : "border-sky-200 bg-white text-sky-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            }`}
          />
        </div>
      </div>
    </div>
  );
}

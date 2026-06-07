import { X, CheckCircle } from "lucide-react";
import type { ImportResult } from "../types";

interface ImportExcelModalProps {
  open: boolean;
  importing: boolean;
  importResult: ImportResult | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onFileChange: () => void;
}

export function ImportExcelModal({
  open,
  importing,
  importResult,
  fileInputRef,
  onClose,
  onSubmit,
  onFileChange,
}: ImportExcelModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Importar Excel/CSV</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <p className="text-sm text-slate-500">
            Formato soportado: columnas Fecha, Descripción Artículo, Cant, Valor/Unidad (Factura),
            Valor/Unidad (Tienda). En Excel la categoría se toma del nombre de la pestaña; en CSV
            puede indicarse o usarse General.
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Archivo</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              disabled={importing}
              onChange={onFileChange}
              className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-sky-50 file:text-sky-700 file:font-medium hover:file:bg-sky-100 disabled:opacity-60"
            />
          </div>
          {importResult && (
            <div
              className={`rounded-xl border p-4 space-y-2 ${
                importResult.errors.length === 0
                  ? "border-green-200 bg-green-50"
                  : "border-amber-200 bg-amber-50"
              }`}
            >
              {importResult.errors.length === 0 ? (
                <p className="flex items-center gap-2 text-sm font-medium text-green-800">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  Importación completada correctamente
                </p>
              ) : null}
              <p className="text-sm font-medium text-slate-800">
                {importResult.created} producto(s) creados/actualizados, {importResult.entriesCreated}{" "}
                ingreso(s) registrados.
              </p>
              {importResult.errors.length > 0 && (
                <ul className="text-sm text-red-600 list-disc list-inside">
                  {importResult.errors.map((e, i) => (
                    <li key={i}>
                      Fila {e.row}: {e.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={importing || (!!importResult && importResult.errors.length === 0)}
              className="px-4 py-2 rounded-xl bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing
                ? "Importando…"
                : importResult && importResult.errors.length === 0
                  ? "Completado"
                  : "Importar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

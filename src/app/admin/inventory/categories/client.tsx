"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  actualizarCategoria,
  eliminarCategoria,
  fetchCategoriasDetalle,
  type CategoriaRow,
} from "@/lib/inventory";
import { Toast, ToastMessage } from "@/components/ui/Toast";
import { ArrowLeft, Check, FolderTree, Pencil, Trash2, X } from "lucide-react";

/** Clave estable para React (evita `key=""` cuando falta id). */
function rowKey(r: CategoriaRow): string {
  const id = r.id?.trim();
  if (id) return id;
  return `nombre:${r.nombre.trim()}`;
}

export default function CategoriasAdminPage() {
  const [rows, setRows] = useState<CategoriaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchCategoriasDetalle();
      setRows(list);
    } catch {
      setToast({ text: "Error al cargar categorías", type: "error" });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = (r: CategoriaRow) => {
    if (r.nombre.trim().toLowerCase() === "general") return;
    if (!r.id?.trim()) {
      setToast({ text: "No se puede editar: falta el identificador de la categoría.", type: "error" });
      return;
    }
    setEditingKey(rowKey(r));
    setEditValue(r.nombre);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue("");
  };

  const saveEdit = async (r: CategoriaRow) => {
    const nombre = editValue.trim();
    if (!nombre) {
      setToast({ text: "El nombre no puede estar vacío", type: "error" });
      return;
    }
    const id = r.id?.trim();
    if (!id) {
      setToast({ text: "No se puede guardar: falta el identificador de la categoría.", type: "error" });
      return;
    }
    const k = rowKey(r);
    setSavingKey(k);
    try {
      const res = await actualizarCategoria(id, nombre);
      setToast({
        text:
          res.productos_actualizados > 0
            ? `Categoría actualizada (${res.productos_actualizados} producto(s) reasignados)`
            : "Categoría actualizada",
        type: "success",
      });
      cancelEdit();
      await load();
    } catch (err: unknown) {
      setToast({ text: err instanceof Error ? err.message : "Error al guardar", type: "error" });
    } finally {
      setSavingKey(null);
    }
  };

  const handleDelete = async (r: CategoriaRow) => {
    if (r.nombre.trim().toLowerCase() === "general") return;
    const id = r.id?.trim();
    if (!id) {
      setToast({ text: "No se puede eliminar: falta el identificador de la categoría.", type: "error" });
      return;
    }
    const ok = window.confirm(
      `¿Eliminar la categoría «${r.nombre}»?\nLos productos pasarán a la categoría General.`
    );
    if (!ok) return;
    const k = rowKey(r);
    setDeletingKey(k);
    try {
      const res = await eliminarCategoria(id);
      setToast({
        text: `${res.productos_actualizados} producto(s) movidos a ${res.productos_movidos_a}.`,
        type: "success",
      });
      await load();
    } catch (err: unknown) {
      setToast({ text: err instanceof Error ? err.message : "Error al eliminar", type: "error" });
    } finally {
      setDeletingKey(null);
    }
  };

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
          <FolderTree className="w-5 h-5 text-sky-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Categorías</h1>
          <p className="text-sm text-slate-500">
            Editar nombre o eliminar. Al eliminar, los productos se mueven a General.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="p-8 text-sm text-slate-500">No hay categorías.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => {
              const k = rowKey(r);
              const esGeneral = r.nombre.trim().toLowerCase() === "general";
              const isEditing = editingKey === k;
              const tieneId = Boolean(r.id?.trim());
              return (
                <li
                  key={k}
                  className="flex flex-wrap items-center gap-3 px-5 py-3.5 hover:bg-slate-50/80 transition-colors"
                >
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 min-w-[12rem] px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void saveEdit(r);
                          if (e.key === "Escape") cancelEdit();
                        }}
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => saveEdit(r)}
                          disabled={savingKey === k}
                          className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                          aria-label="Guardar"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                          aria-label="Cancelar"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 font-medium text-slate-800 min-w-0">{r.nombre}</span>
                      {esGeneral && (
                        <span className="text-xs text-slate-400 font-medium shrink-0">(reservada)</span>
                      )}
                      <div className="flex items-center gap-1 shrink-0">
                        {!esGeneral && tieneId && (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(r)}
                              className="p-2 rounded-lg text-slate-500 hover:bg-sky-50 hover:text-sky-700 transition-colors"
                              aria-label={`Editar ${r.nombre}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(r)}
                              disabled={deletingKey === k}
                              className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                              aria-label={`Eliminar ${r.nombre}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {!esGeneral && !tieneId && (
                          <span className="text-xs text-amber-600 font-medium">Sin ID — recarga o revisa la API</span>
                        )}
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}

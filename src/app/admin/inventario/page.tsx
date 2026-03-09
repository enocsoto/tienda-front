"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { formatCOP } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Search, Plus, Pencil, Package, AlertTriangle, Trash2, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Upload, X, CheckCircle } from "lucide-react";
import { API_URL } from "@/lib/api";

interface Product {
  id: string;
  nombre: string;
  categoria: string;
  costo: number;
  precio_venta: number;
  stock_actual: number;
  unidad?: string;
}

const PAGE_SIZE = 10;

type SortField = "nombre" | "categoria" | "costo" | "precio_venta" | "stock_actual";
type SortOrder = "ASC" | "DESC";

export default function InventarioPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [user, setUser] = useState<{ role?: string } | null>(null);
  const [sortBy, setSortBy] = useState<SortField>("nombre");
  const [sortOrder, setSortOrder] = useState<SortOrder>("ASC");
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    created: number;
    entriesCreated: number;
    errors: Array<{ row: number; message: string }>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch {
      setUser(null);
    }
  }, []);

  const loadProducts = useCallback(async (q = "", pageNum = 1) => {
    setLoadError(null);
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      params.set("page", String(pageNum));
      params.set("limit", String(PAGE_SIZE));
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      const raw = await fetchApi(`/inventario?${params.toString()}`);
      const res = raw as { data?: unknown[]; total?: number; page?: number; totalPages?: number };
      // Soporta respuesta paginada { data, total, totalPages } o array directo (fallback)
      const data = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(raw)
          ? raw
          : [];
      const list = data as Record<string, unknown>[];
      const toId = (p: Record<string, unknown>): string => {
        if (typeof p.id === "string") return p.id;
        const oid = p._id;
        if (oid && typeof oid === "object" && "$oid" in oid) {
          const val = (oid as { $oid: string }).$oid;
          return typeof val === "string" ? val : String(oid);
        }
        if (typeof oid === "string") return oid;
        return String(oid ?? "");
      };
      setProducts(list.map((p) => ({ ...p, id: toId(p) })) as Product[]);
      setTotal(
        typeof res.total === "number" ? res.total : Array.isArray(raw) ? raw.length : 0
      );
      setTotalPages(
        typeof res.totalPages === "number" ? res.totalPages : Array.isArray(raw) ? 1 : 1
      );
    } catch (err) {
      console.error(err);
      setLoadError(err instanceof Error ? err.message : "Error al cargar el inventario");
      setProducts([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder]);

  const pathname = usePathname();

  const handleSort = (field: SortField) => {
    setSortBy(field);
    setSortOrder((prev) => (sortBy === field && prev === "ASC" ? "DESC" : "ASC"));
    setPage(1);
  };

  const SortHeader = ({
    field,
    label,
    className,
  }: {
    field: SortField;
    label: string;
    className?: string;
  }) => (
    <th className={className}>
      <button
        type="button"
        onClick={() => handleSort(field)}
        className="inline-flex items-center gap-1 w-full text-left hover:text-sky-600 transition-colors"
      >
        {label}
        {sortBy === field ? (
          sortOrder === "ASC" ? (
            <ChevronUp className="w-3.5 h-3.5 text-sky-500" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-sky-500" />
          )
        ) : (
          <span className="w-3.5 h-3.5 opacity-30" aria-hidden />
        )}
      </button>
    </th>
  );

  // Cargar lista al montar, al cambiar página, búsqueda o orden (debounce 300ms)
  useEffect(() => {
    if (pathname !== "/admin/inventario") return;
    const timer = window.setTimeout(() => {
      loadProducts(search, page);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [pathname, search, page, sortBy, sortOrder, loadProducts]);

  const handleImportSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = fileInputRef.current;
    if (!input?.files?.length) return;
    const file = input.files[0];
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`${API_URL}/inventario/importar-excel`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Error ${res.status}`);
      }
      const data = (await res.json()) as {
        created?: number;
        entriesCreated?: number;
        errors?: Array<{ row: number; message: string }>;
      };
      setImportResult({
        created: data.created ?? 0,
        entriesCreated: data.entriesCreated ?? 0,
        errors: data.errors ?? [],
      });
      input.value = "";
      await loadProducts(search, page);
    } catch (err) {
      setImportResult({
        created: 0,
        entriesCreated: 0,
        errors: [{ row: 0, message: err instanceof Error ? err.message : "Error al importar" }],
      });
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product?.id) return;
    if (!confirm(`¿Eliminar "${product.nombre}" del inventario? Esta acción no se puede deshacer.`)) return;
    setDeletingId(product.id);
    try {
      await fetchApi(`/inventario/${product.id}`, { method: "DELETE" });
      await loadProducts(search, page);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error al eliminar el producto");
    } finally {
      setDeletingId(null);
    }
  };

  const lowStock = products.filter((p) => p.stock_actual <= 5 && p.stock_actual > 0).length;
  const outOfStock = products.filter((p) => p.stock_actual === 0).length;

  const fromItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const toItem = Math.min(page * PAGE_SIZE, total);

  return (
    <div>
      <PageHeader
        title="Inventario"
        subtitle={
          total <= PAGE_SIZE
            ? `${total} producto${total !== 1 ? "s" : ""}`
            : `${fromItem}-${toItem} de ${total} productos`
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setImportOpen(true); setImportResult(null); }}
              className="flex items-center gap-2 border border-sky-600 text-sky-600 hover:bg-sky-50 font-medium py-2.5 px-5 rounded-xl transition-colors shadow-sm text-sm"
            >
              <Upload className="w-4 h-4" />
              Importar Excel/CSV
            </button>
            <Link
              href="/admin/inventario/nuevo"
              className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 px-5 rounded-xl transition-colors shadow-sm text-sm"
            >
              <Plus className="w-4 h-4" />
              Nuevo Producto
            </Link>
          </div>
        }
      />

      {/* Error al cargar */}
      {loadError && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          <span className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="h-4 w-4" />
            {loadError}
          </span>
          <button
            type="button"
            onClick={() => loadProducts(search, page)}
            className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Alerts */}
      {(lowStock > 0 || outOfStock > 0) && (
        <div className="flex flex-wrap gap-3 mb-6">
          {outOfStock > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-2.5 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
              {outOfStock} producto{outOfStock > 1 ? "s" : ""} sin producto
            </div>
          )}
          {lowStock > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium px-4 py-2.5 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
              {lowStock} producto{lowStock > 1 ? "s" : ""} con cantidad crítica
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar - búsqueda en tiempo real */}
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              placeholder="Buscar producto..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm focus:bg-white focus:border-sky-400 focus:outline-none focus:ring-3 focus:ring-sky-100 transition-all"
              value={search}
              onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <SortHeader className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider" field="nombre" label="Producto" />
                <SortHeader className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider" field="categoria" label="Categoría" />
                <SortHeader className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider" field="costo" label="Costo" />
                <SortHeader className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider" field="precio_venta" label="P. Venta" />
                <SortHeader className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider" field="stock_actual" label="Cantidad" />
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Unidad
                </th>
                {isAdmin && (
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                    Acción
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6">
                      <div className="h-4 bg-slate-100 rounded w-3/4" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-5 bg-slate-100 rounded-full w-20" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-100 rounded w-16" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-100 rounded w-16" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-100 rounded w-10" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-100 rounded w-14" />
                    </td>
                    {isAdmin && <td className="py-4 px-4" />}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-16 text-center">
                    <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium text-sm">No hay productos registrados</p>
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <p className="font-semibold text-slate-800 text-sm">{p.nombre}</p>
                      <p className="text-xs text-slate-400 mt-0.5">#{String(p.id).slice(-8)}</p>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="sky">{p.categoria}</Badge>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-600">
                      {formatCOP(p.costo)}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-sm text-sky-700">
                        {formatCOP(p.precio_venta)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {p.stock_actual === 0 ? (
                        <Badge variant="red">Sin producto</Badge>
                      ) : p.stock_actual <= 5 ? (
                        <Badge variant="amber">{p.stock_actual} bajo</Badge>
                      ) : (
                        <span className="text-sm font-medium text-slate-700">
                          {p.stock_actual}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-600">
                      {p.unidad ?? "unidad"}
                    </td>
                    {isAdmin && (
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/admin/inventario/editar/${p.id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Pencil className="w-3 h-3" />
                            Editar
                          </Link>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, p)}
                            disabled={deletingId === p.id}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-3 h-3" />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Página {page} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Importar Excel/CSV */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">Importar Excel/CSV</h2>
              <button
                type="button"
                onClick={() => { setImportOpen(false); setImportResult(null); }}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleImportSubmit} className="p-6 space-y-4">
              <p className="text-sm text-slate-500">
                Formato soportado: columnas Fecha, Descripción Artículo, Cant, Valor/Unidad (Factura), Valor/Unidad (Tienda). En Excel la categoría se toma del nombre de la pestaña; en CSV puede indicarse o usarse General.
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Archivo</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  disabled={importing}
                  onChange={() => importResult && setImportResult(null)}
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
                    {importResult.created} producto(s) creados/actualizados, {importResult.entriesCreated} ingreso(s) registrados.
                  </p>
                  {importResult.errors.length > 0 && (
                    <ul className="text-sm text-red-600 list-disc list-inside">
                      {importResult.errors.map((e, i) => (
                        <li key={i}>Fila {e.row}: {e.message}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setImportOpen(false); setImportResult(null); }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={importing || (!!importResult && importResult.errors.length === 0)}
                  className="px-4 py-2 rounded-xl bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? "Importando…" : importResult && importResult.errors.length === 0 ? "Completado" : "Importar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

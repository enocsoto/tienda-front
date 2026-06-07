"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { fetchApi, API_URL } from "@/lib/api";
import {
  inventoryListHref,
  inventoryListQueryFromParams,
  type InventoryListQuery,
} from "@/lib/inventory";
import type { ToastMessage } from "@/components/ui/Toast";
import {
  PAGE_SIZE,
  SORT_FIELDS,
  type ImportResult,
  type Product,
  type SortField,
  type SortOrder,
} from "../types";

export function useInventoryList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);
  const [showInactiveOnly, setShowInactiveOnly] = useState(false);
  const [user, setUser] = useState<{ role?: string } | null>(null);
  const [sortBy, setSortBy] = useState<SortField>("nombre");
  const [sortOrder, setSortOrder] = useState<SortOrder>("ASC");
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadSeqRef = useRef(0);
  const [gananciaGlobal, setGananciaGlobal] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch {
      setUser(null);
    }
  }, []);

  const listQuery = (): InventoryListQuery => ({
    page,
    search,
    sortBy,
    sortOrder,
    inactivos: showInactiveOnly || undefined,
  });

  const replaceListUrl = useCallback(
    (state: InventoryListQuery) => {
      router.replace(inventoryListHref("/admin/inventory", state), { scroll: false });
    },
    [router],
  );

  useEffect(() => {
    if (pathname !== "/admin/inventory") return;
    const fromUrl = inventoryListQueryFromParams(searchParams);
    const nextPage = fromUrl.page ?? 1;
    const nextSearch = fromUrl.search ?? "";
    const nextSortBy = SORT_FIELDS.includes(fromUrl.sortBy as SortField)
      ? (fromUrl.sortBy as SortField)
      : "nombre";
    const nextSortOrder: SortOrder = fromUrl.sortOrder === "DESC" ? "DESC" : "ASC";
    setPage((p) => (p !== nextPage ? nextPage : p));
    setSearch((s) => (s !== nextSearch ? nextSearch : s));
    setSortBy((sb) => (sb !== nextSortBy ? nextSortBy : sb));
    setSortOrder((so) => (so !== nextSortOrder ? nextSortOrder : so));
    const nextInactivos = fromUrl.inactivos ?? false;
    setShowInactiveOnly((v) => (v !== nextInactivos ? nextInactivos : v));
  }, [pathname, searchParams]);

  useEffect(() => {
    if (pathname !== "/admin/inventory") return;
    fetchApi("/config/ganancia")
      .then((d) => {
        const raw = Number((d as { ganancia?: number }).ganancia);
        setGananciaGlobal(Number.isFinite(raw) ? raw : 0);
      })
      .catch(() => setGananciaGlobal(0));
  }, [pathname]);

  const loadProducts = useCallback(
    async (q = "", pageNum = 1, inactiveOnly = showInactiveOnly) => {
      const seq = ++loadSeqRef.current;
      setLoadError(null);
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (q) params.set("search", q);
        params.set("page", String(pageNum));
        params.set("limit", String(PAGE_SIZE));
        params.set("sortBy", sortBy);
        params.set("sortOrder", sortOrder);
        if (inactiveOnly) params.set("activo", "inactive");
        const raw = await fetchApi(`/inventario?${params.toString()}`, { cache: "no-store" });
        if (seq !== loadSeqRef.current) return null;
        const res = raw as { data?: unknown[]; total?: number; page?: number; totalPages?: number };
        const data = Array.isArray(res?.data) ? res.data : Array.isArray(raw) ? raw : [];
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
        setTotal(typeof res.total === "number" ? res.total : Array.isArray(raw) ? raw.length : 0);
        const tp = typeof res.totalPages === "number" ? res.totalPages : Array.isArray(raw) ? 1 : 1;
        setTotalPages(tp);
        return { count: list.length, totalPages: tp, page: pageNum };
      } catch (err) {
        if (seq !== loadSeqRef.current) return null;
        console.error(err);
        setLoadError(err instanceof Error ? err.message : "Error al cargar el inventario");
        setProducts([]);
        setTotal(0);
        setTotalPages(1);
        return { count: 0, totalPages: 1, page: pageNum };
      } finally {
        if (seq === loadSeqRef.current) setLoading(false);
      }
    },
    [sortBy, sortOrder, showInactiveOnly],
  );

  const reloadWithPageClamp = useCallback(
    async (pageNum: number) => {
      const result = await loadProducts(search, pageNum, showInactiveOnly);
      if (!result) return;
      if (result.count === 0 && pageNum > 1) {
        const prev = Math.max(1, pageNum - 1);
        setPage(prev);
        replaceListUrl({
          page: prev,
          search,
          sortBy,
          sortOrder,
          inactivos: showInactiveOnly || undefined,
        });
        await loadProducts(search, prev, showInactiveOnly);
      }
    },
    [loadProducts, search, showInactiveOnly, sortBy, sortOrder, replaceListUrl],
  );

  const handleSort = (field: SortField) => {
    const nextOrder: SortOrder = sortBy === field && sortOrder === "ASC" ? "DESC" : "ASC";
    setSortBy(field);
    setSortOrder(nextOrder);
    setPage(1);
    replaceListUrl({
      page: 1,
      search,
      sortBy: field,
      sortOrder: nextOrder,
      inactivos: showInactiveOnly || undefined,
    });
  };

  useEffect(() => {
    if (pathname !== "/admin/inventory") return;
    const timer = window.setTimeout(() => {
      loadProducts(search, page, showInactiveOnly);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [pathname, search, page, sortBy, sortOrder, showInactiveOnly, loadProducts]);

  const handleImportSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAdmin) return;
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
      await loadProducts(search, page, showInactiveOnly);
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

  const handleDeactivate = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product?.id || !isAdmin) return;
    if (
      !confirm(
        `¿Desactivar "${product.nombre}"? Dejará de aparecer en ventas y en la tienda pública.`,
      )
    ) {
      return;
    }
    setDeletingId(product.id);
    try {
      await fetchApi(`/inventario/${product.id}`, { method: "DELETE" });
      await reloadWithPageClamp(page);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error al desactivar el producto");
    } finally {
      setDeletingId(null);
    }
  };

  const handleReactivate = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product?.id || !isAdmin) return;
    if (!confirm(`¿Reactivar "${product.nombre}"? Volverá a estar disponible para ventas.`)) return;
    setReactivatingId(product.id);
    try {
      const updated = (await fetchApi(`/inventario/${product.id}`, {
        method: "PATCH",
        body: JSON.stringify({ activo: true }),
      })) as { activo?: boolean } | null;
      if (updated && updated.activo === false) {
        throw new Error("El producto no se reactivó en el servidor");
      }
      setProducts((prev) => prev.filter((x) => x.id !== product.id));
      setTotal((t) => Math.max(0, t - 1));
      await reloadWithPageClamp(page);
      setToast({ text: `${product.nombre} reactivado correctamente`, type: "success" });
    } catch (err) {
      console.error(err);
      setToast({
        text: err instanceof Error ? err.message : "Error al reactivar el producto",
        type: "error",
      });
    } finally {
      setReactivatingId(null);
    }
  };

  const toggleInactiveView = (checked: boolean) => {
    setShowInactiveOnly(checked);
    setPage(1);
    replaceListUrl({
      page: 1,
      search,
      sortBy,
      sortOrder,
      inactivos: checked || undefined,
    });
  };

  const handleSearchChange = (q: string) => {
    setSearch(q);
    setPage(1);
    replaceListUrl({
      page: 1,
      search: q,
      sortBy,
      sortOrder,
      inactivos: showInactiveOnly || undefined,
    });
  };

  const goToPage = (next: number) => {
    setPage(next);
    replaceListUrl({
      page: next,
      search,
      sortBy,
      sortOrder,
      inactivos: showInactiveOnly || undefined,
    });
  };

  const lowStock = products.filter((p) => p.stock_actual <= 5 && p.stock_actual > 0).length;
  const outOfStock = products.filter((p) => p.stock_actual === 0).length;
  const fromItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const toItem = Math.min(page * PAGE_SIZE, total);

  const openImport = () => {
    setImportOpen(true);
    setImportResult(null);
  };

  const closeImport = () => {
    setImportOpen(false);
    setImportResult(null);
  };

  return {
    products,
    loading,
    search,
    page,
    total,
    totalPages,
    loadError,
    deletingId,
    reactivatingId,
    showInactiveOnly,
    isAdmin,
    sortBy,
    sortOrder,
    importOpen,
    importing,
    importResult,
    fileInputRef,
    gananciaGlobal,
    toast,
    setToast,
    listQuery,
    loadProducts,
    handleSort,
    handleImportSubmit,
    handleDeactivate,
    handleReactivate,
    toggleInactiveView,
    handleSearchChange,
    goToPage,
    lowStock,
    outOfStock,
    fromItem,
    toItem,
    openImport,
    closeImport,
    setImportResult,
  };
}

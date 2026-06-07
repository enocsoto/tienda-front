"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchPublicApi } from "@/lib/api";
import { CATALOGO_PAGE_SIZE, type Product } from "../types";

export function usePurchaseCatalog() {
  const [productos, setProductos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProductos, setTotalProductos] = useState(0);
  const [error, setError] = useState("");

  const loadCatalogo = useCallback(async (pageNum = 1, search = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(pageNum));
      params.set("limit", String(CATALOGO_PAGE_SIZE));
      if (search.trim()) params.set("search", search.trim());
      const data = await fetchPublicApi(`/pedidos/catalogo?${params.toString()}`);
      if (data?.productos) setProductos(data.productos);
      setTotalPages(Math.max(1, data?.totalPages ?? 1));
      setTotalProductos(data?.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar catálogo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalogo(1, "");
  }, [loadCatalogo]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setPage(1);
    loadCatalogo(1, searchInput);
  };

  const goToPage = (newPage: number) => {
    const p = Math.max(1, Math.min(totalPages, newPage));
    setPage(p);
    loadCatalogo(p, searchQuery);
  };

  return {
    productos,
    loading,
    searchQuery,
    searchInput,
    setSearchInput,
    page,
    totalPages,
    totalProductos,
    error,
    setError,
    handleSearch,
    goToPage,
  };
}

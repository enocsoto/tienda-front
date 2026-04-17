import { fetchApi } from "./api";

/** Categorías sugeridas para una tienda cuando aún no hay productos en el inventario */
export const CATEGORIAS_SUGERIDAS = [
  "General",
  "Bebidas",
  "Snacks",
  "Lácteos",
  "Panadería",
  "Limpieza",
  "Abarrotes",
  "Higiene",
  "Congelados",
  "Otros",
] as const;

const OPCION_OTRA = "Otra";

export type CategoriaRow = { id: string; nombre: string };

/**
 * Lista categorías con id (para administración).
 */
function extractCategoryId(o: { id?: string; _id?: unknown }): string {
  if (typeof o.id === "string" && o.id.trim()) return o.id.trim();
  const raw = o._id;
  if (raw && typeof raw === "object" && "toString" in raw && typeof (raw as { toString(): string }).toString === "function") {
    return String((raw as { toString(): string }).toString());
  }
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  return "";
}

export async function fetchCategoriasDetalle(): Promise<CategoriaRow[]> {
  try {
    const raw = (await fetchApi("/inventario/categorias")) as unknown;
    if (!Array.isArray(raw)) return [];
    return raw
      .map((item) => {
        if (typeof item === "string") return { id: "", nombre: item };
        const o = item as { id?: string; _id?: unknown; nombre?: string };
        return { id: extractCategoryId(o), nombre: String(o.nombre ?? "") };
      })
      .filter((r) => r.nombre);
  } catch {
    return [];
  }
}

/**
 * Obtiene los nombres de categoría desde el backend (para selects de producto).
 */
export async function getCategoriasDisponibles(): Promise<string[]> {
  const rows = await fetchCategoriasDetalle();
  return rows.map((r) => r.nombre);
}

/**
 * Crea una nueva categoría en el backend.
 */
export async function crearCategoria(nombre: string): Promise<string> {
  const res = (await fetchApi("/inventario/categorias", {
    method: "POST",
    body: JSON.stringify({ nombre: nombre.trim() }),
  })) as { nombre: string };
  return res.nombre;
}

export async function actualizarCategoria(
  id: string,
  nombre: string
): Promise<{ id: string; nombre: string; productos_actualizados: number }> {
  return fetchApi(`/inventario/categorias/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ nombre: nombre.trim() }),
  }) as Promise<{ id: string; nombre: string; productos_actualizados: number }>;
}

export async function eliminarCategoria(id: string): Promise<{
  message: string;
  productos_movidos_a: string;
  productos_actualizados: number;
}> {
  return fetchApi(`/inventario/categorias/${encodeURIComponent(id)}`, {
    method: "DELETE",
  }) as Promise<{
    message: string;
    productos_movidos_a: string;
    productos_actualizados: number;
  }>;
}

export { OPCION_OTRA };

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

/**
 * Obtiene las categorías desde el backend (entidad Category).
 */
export async function getCategoriasDisponibles(): Promise<string[]> {
  try {
    const list = (await fetchApi("/inventario/categorias")) as string[];
    return Array.isArray(list) ? list.filter(Boolean) : [];
  } catch {
    return [];
  }
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

export { OPCION_OTRA };

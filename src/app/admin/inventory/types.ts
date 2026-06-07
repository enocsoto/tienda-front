export interface Product {
  id: string;
  nombre: string;
  categoria: string;
  costo: number;
  precio_venta: number;
  stock_actual: number;
  unidad?: string;
}

export const PAGE_SIZE = 10;

export type SortField = "nombre" | "categoria" | "costo" | "precio_venta" | "stock_actual";
export type SortOrder = "ASC" | "DESC";

export const SORT_FIELDS: SortField[] = [
  "nombre",
  "categoria",
  "costo",
  "precio_venta",
  "stock_actual",
];

export interface ImportResult {
  created: number;
  entriesCreated: number;
  errors: Array<{ row: number; message: string }>;
}

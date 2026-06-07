export const UNIDADES_DECIMALES = ["gramos", "g", "kg", "litro", "ml", "lb"];

export function isUnidadDecimal(unidad?: string): boolean {
  return !!unidad && UNIDADES_DECIMALES.includes(unidad.toLowerCase());
}

export function getStepForUnidad(unidad?: string): number {
  if (!unidad) return 1;
  const u = unidad.toLowerCase();
  if (u === "litro" || u === "kg" || u === "lb") return 0.1;
  return 1;
}

export function getUnidadSufijo(unidad?: string): string {
  if (!unidad) return "";
  const u = unidad.toLowerCase();
  if (u === "gramos" || u === "g") return " g";
  if (u === "kg") return " kg";
  if (u === "lb") return " lb";
  if (u === "litro") return " L";
  if (u === "ml") return " ml";
  return "";
}

export interface Product {
  id: string;
  nombre: string;
  categoria: string;
  precio_venta: number;
  stock_actual: number;
  unidad?: string;
  imagen?: string;
}

export interface CartItem extends Product {
  cantidad: number;
  subtotal: number;
}

export type PosStep = "products" | "checkout";

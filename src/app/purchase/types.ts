export const UNIDADES_DECIMALES = ["gramos", "g", "kg", "litro", "ml", "lb"];

export function isUnidadDecimal(unidad?: string): boolean {
  return !!unidad && UNIDADES_DECIMALES.includes(unidad.toLowerCase());
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

export interface CartEntry {
  product: Product;
  cantidad: number;
}

export interface NequiCuentaPublic {
  numero: string;
  nombreMasked: string;
  apellidoMasked: string;
}

export const CATALOGO_PAGE_SIZE = 12;

export type PurchaseStep = "catalogo" | "datos";
export type MetodoPago = "EFECTIVO" | "NEQUI";
export type ModoEntrega = "PROGRAMADA" | "LO_ANTES_POSIBLE";

export function getDefaultFechaHoraEntrega(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:00:00`;
}

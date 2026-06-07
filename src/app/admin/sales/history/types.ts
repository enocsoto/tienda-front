export type Granularity = "daily" | "weekly" | "monthly" | "custom";

export interface SaleItemDisplay {
  product?: { nombre?: string };
  cantidad?: number;
  precio_unitario?: number;
  subtotal?: number;
}

export interface Sale {
  id?: string;
  _id?: string | { $oid?: string };
  fecha: string;
  tipo: string;
  metodo_pago: string;
  cliente_nombre?: string;
  cliente_telefono?: string;
  total: number;
  origen?: string;
  pago_confirmado?: boolean;
  direccion?: string;
  fecha_hora_entrega?: string;
  notas?: string;
  items?: SaleItemDisplay[];
}

export interface SalesSummary {
  from: string;
  to: string;
  granularity: string;
  totalVentas: number;
  montoTotal: number;
  contado: number;
  credito: number;
  groups: Array<{ periodKey: string; periodLabel: string; total: number; count: number }>;
  topProduct: { productId: string; nombre: string; cantidadTotal: number; ingresos: number } | null;
}

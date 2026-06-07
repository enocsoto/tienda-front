export type Granularity = "daily" | "weekly" | "monthly" | "custom";

export interface Balance {
  base_caja?: number;
  base_caja_diaria?: number;
  dias_en_periodo?: number;
  fecha?: string;
  fecha_hasta?: string;
  total_ventas?: number;
  total_ventas_nequi_transferencia?: number;
  total_prestamos?: number;
  total_ingresos: number;
  total_egresos: number;
  total_egresos_nequi_transferencia?: number;
  balance_neto: number;
}

export interface Movement {
  tipo: "egreso" | "prestamo" | "pago_prestamo";
  id: string;
  monto: number;
  descripcion: string;
  fecha: string;
  categoria?: string;
  medio_pago?: string;
  prestamista?: string;
}

export type MedioPagoEgreso = "NEQUI" | "TRANSFERENCIA" | "EFECTIVO";

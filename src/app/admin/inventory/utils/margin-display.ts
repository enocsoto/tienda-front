import { formatGananciaPct } from "@/lib/format";

export const PRECIO_IGUAL_EPS = 0.02;

/** Misma fórmula que el backend: costo × (1 + ganancia/100), 2 decimales */
export function precioVentaEsperadoPorMargenGlobal(costo: number, gananciaPct: number): number {
  return parseFloat((costo * (1 + gananciaPct / 100)).toFixed(2));
}

/**
 * Si P. venta coincide con el precio teórico del margen global → muestra ese %.
 * Si el admin editó P. venta → muestra el margen real (costo vs precio).
 */
export function textoPorcentajeVenta(
  costo: number,
  precioVenta: number,
  gananciaGlobal: number | null,
): { texto: string; title: string } {
  if (!Number.isFinite(costo) || costo <= 0) {
    return { texto: "—", title: "" };
  }
  if (gananciaGlobal === null) {
    return { texto: "…", title: "Cargando margen global…" };
  }
  const esperado = precioVentaEsperadoPorMargenGlobal(costo, gananciaGlobal);
  if (Math.abs(precioVenta - esperado) <= PRECIO_IGUAL_EPS) {
    return {
      texto: `${formatGananciaPct(gananciaGlobal)} %`,
      title: "Precio de venta alineado con el margen global configurado",
    };
  }
  const real = ((precioVenta - costo) / costo) * 100;
  return {
    texto: `${formatGananciaPct(real)} %`,
    title: "Precio de venta distinto al margen global: margen real (precio vs costo)",
  };
}

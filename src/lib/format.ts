/**
 * Formato de moneda en pesos colombianos (COP).
 * Ej: 1500 -> "$1.500", 12000 -> "$12.000"
 */
export function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Parsea una fecha solo-día (YYYY-MM-DD) como fecha local para evitar que
 * medianoche UTC se muestre como el día anterior en zonas como Colombia (UTC-5).
 */
export function parseLocalDate(dateStr: string): Date {
  const part = dateStr.split("T")[0];
  const [y, m, d] = part.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

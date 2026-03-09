/**
 * Formato de moneda en pesos colombianos (COP).
 * Ej: 1500 -> "$1.500", 12000 -> "$12.000"
 */
export function formatCOP(value: number | null | undefined): string {
  const n = Number(value);
  if (Number.isNaN(n)) return "$0";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Formato de número para inputs de costo/precio (separador de miles).
 * Ej: 6600 -> "6.600", 1234567 -> "1.234.567"
 */
export function formatNumberInput(value: number): string {
  if (Number.isNaN(value) || value === null || value === undefined) return "";
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Parsea string de input con formato colombiano (punto=miles, coma=decimal).
 * Acepta: "6.600", "6,6", "6600", "1.234,56"
 */
export function parseNumberInput(str: string): number {
  const s = String(str ?? "").trim().replace(/\s/g, "");
  if (!s) return 0;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma >= 0 && lastDot >= 0) {
    const [intPart, decPart] =
      lastComma > lastDot
        ? [s.substring(0, lastComma).replace(/\./g, ""), s.substring(lastComma + 1)]
        : [s.substring(0, lastDot).replace(/,/g, ""), s.substring(lastDot + 1)];
    return parseFloat(intPart + "." + decPart) || 0;
  }
  if (lastComma >= 0) {
    const after = s.substring(lastComma + 1);
    if (after.length === 3 && /^\d{3}$/.test(after)) {
      return parseFloat(s.replace(/,/g, "")) || 0;
    }
    return parseFloat(s.replace(",", ".")) || 0;
  }
  if (lastDot >= 0) {
    const after = s.substring(lastDot + 1);
    if (after.length === 3 && /^\d{3}$/.test(after)) {
      return parseFloat(s.replace(/\./g, "")) || 0;
    }
    const intPart = s.substring(0, lastDot).replace(/\./g, "");
    return parseFloat(intPart + "." + after) || 0;
  }
  return parseFloat(s) || 0;
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

import type { Granularity } from "../types";

export function etiquetaMedioPagoEgreso(medio?: string): string {
  if (medio === "NEQUI") return "Nequi";
  if (medio === "TRANSFERENCIA") return "Transferencia";
  return "Efectivo";
}

export function getDateRangeForGranularity(
  g: Granularity,
  dayForDaily: string,
  from?: string,
  to?: string,
): { from: string; to: string } | null {
  if (g === "custom") {
    if (from && to) return { from, to };
    return null;
  }
  if (g === "daily") {
    if (!dayForDaily) return null;
    return { from: dayForDaily, to: dayForDaily };
  }
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  let start: Date;
  let end: Date;
  switch (g) {
    case "weekly": {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "monthly": {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    }
    default: {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(start);
      end.setHours(23, 59, 59, 999);
    }
  }
  return {
    from: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
    to: `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`,
  };
}

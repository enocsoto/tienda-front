import type { Granularity, Sale, SaleItemDisplay } from "../types";

export function itemNombreProducto(it: SaleItemDisplay): string {
  const fromNested = it.product?.nombre?.trim();
  if (fromNested) return fromNested;
  const flat = (it as unknown as { nombre?: string }).nombre?.trim();
  if (flat) return flat;
  return "Producto";
}

export function formatCantidadItem(c: number | undefined): string {
  if (c === undefined || !Number.isFinite(Number(c))) return "—";
  const n = Number(c);
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export function saleKey(sale: Sale, index: number): string {
  if (sale.id && typeof sale.id === "string") return sale.id;
  const raw = (sale as unknown as Record<string, unknown>)._id;
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object" && "$oid" in raw && typeof (raw as { $oid: string }).$oid === "string")
    return (raw as { $oid: string }).$oid;
  return `sale-${index}`;
}

export function countSaleItems(sale: Sale): number {
  return (sale.items ?? []).length;
}

export function getDateRangeForGranularity(
  g: Granularity,
  from?: string,
  to?: string,
): { from: string; to: string } | null {
  if (g === "custom") {
    if (from && to) return { from, to };
    return null;
  }
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  let start: Date;
  let end: Date;
  switch (g) {
    case "daily": {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(start);
      end.setHours(23, 59, 59, 999);
      break;
    }
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

import { useRef, useState, useEffect } from "react";
import { formatGananciaPct, formatNumberInput, parseNumberInput } from "@/lib/format";

/** costo × (1 + ganancia/100), 2 decimales — misma fórmula que el backend */
export function precioDesdeMargen(costo: number, gananciaPct: number): number {
  return parseFloat((costo * (1 + gananciaPct / 100)).toFixed(2));
}

/** Margen real del producto a partir de costo y precio de venta */
export function margenDesdePrecio(costo: number, precioVenta: number): number {
  if (!Number.isFinite(costo) || costo <= 0) return 0;
  return parseFloat((((precioVenta - costo) / costo) * 100).toFixed(2));
}

export function normalizarPct(pct: number): number {
  if (!Number.isFinite(pct)) return 0;
  return Math.abs(pct - Math.round(pct)) < 1e-6 ? Math.round(pct) : parseFloat(pct.toFixed(2));
}

export function useProductMargin(initialCosto = 0, initialPrecio = 0) {
  const [costoDisplay, setCostoDisplay] = useState(formatNumberInput(initialCosto));
  const [precioVentaDisplay, setPrecioVentaDisplay] = useState(formatNumberInput(initialPrecio));
  const [gananciaDisplay, setGananciaDisplay] = useState("0");
  const [precioVentaResaltado, setPrecioVentaResaltado] = useState(false);
  const precioHighlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (precioHighlightTimeoutRef.current) clearTimeout(precioHighlightTimeoutRef.current);
    };
  }, []);

  const resaltarPrecioVenta = () => {
    if (precioHighlightTimeoutRef.current) clearTimeout(precioHighlightTimeoutRef.current);
    setPrecioVentaResaltado(true);
    precioHighlightTimeoutRef.current = setTimeout(() => setPrecioVentaResaltado(false), 1800);
  };

  const aplicarPrecioVenta = (precio: number, options?: { resaltar?: boolean }) => {
    const anterior = parseNumberInput(precioVentaDisplay);
    const cambio = Math.abs(anterior - precio) > 0.001;
    setPrecioVentaDisplay(formatNumberInput(precio));
    if (options?.resaltar && cambio) resaltarPrecioVenta();
    return precio;
  };

  const aplicarMargen = (pct: number) => {
    const limpio = normalizarPct(pct);
    setGananciaDisplay(formatGananciaPct(limpio));
    return limpio;
  };

  /** Lee el % del input visible (fuente de verdad al recalcular o guardar). */
  const margenDesdeDisplay = (raw = gananciaDisplay): number => {
    const pct = normalizarPct(parseNumberInput(raw));
    setGananciaDisplay(formatGananciaPct(pct));
    return pct;
  };

  const initFromProduct = (costo: number, precioVenta: number) => {
    const margen = normalizarPct(margenDesdePrecio(costo, precioVenta));
    setGananciaDisplay(formatGananciaPct(margen));
    setCostoDisplay(formatNumberInput(costo));
    setPrecioVentaDisplay(formatNumberInput(precioVenta));
  };

  /** Nuevo producto: margen inicial desde configuración global */
  const initFromGananciaGlobal = (gananciaPct: number) => {
    aplicarMargen(gananciaPct);
  };

  const handleCostoBlur = (onPrecioChange: (precio: number) => void) => {
    const parsed = parseNumberInput(costoDisplay);
    setCostoDisplay(formatNumberInput(parsed));
    const pct = margenDesdeDisplay();
    const precio = precioDesdeMargen(parsed, pct);
    aplicarPrecioVenta(precio, { resaltar: true });
    onPrecioChange(precio);
    return parsed;
  };

  const handleGananciaBlur = (onPrecioChange: (precio: number) => void) => {
    const pct = margenDesdeDisplay();
    const costo = parseNumberInput(costoDisplay);
    if (costo > 0) {
      const precio = precioDesdeMargen(costo, pct);
      aplicarPrecioVenta(precio, { resaltar: true });
      onPrecioChange(precio);
    }
  };

  const handlePrecioVentaBlur = () => {
    const parsed = parseNumberInput(precioVentaDisplay);
    setPrecioVentaDisplay(formatNumberInput(parsed));
    const costo = parseNumberInput(costoDisplay);
    if (costo > 0) aplicarMargen(normalizarPct(margenDesdePrecio(costo, parsed)));
    return parsed;
  };

  const parseGananciaPct = (raw: string): number => normalizarPct(parseNumberInput(raw));

  const computeSubmitPrecio = (): number => {
    const costo = parseFloat(parseNumberInput(costoDisplay).toFixed(2));
    const pct = margenDesdeDisplay();
    if (costo > 0) {
      return precioDesdeMargen(costo, pct);
    }
    return parseFloat(parseNumberInput(precioVentaDisplay).toFixed(2));
  };

  return {
    costoDisplay,
    setCostoDisplay,
    precioVentaDisplay,
    setPrecioVentaDisplay,
    gananciaDisplay,
    setGananciaDisplay,
    precioVentaResaltado,
    initFromProduct,
    initFromGananciaGlobal,
    handleCostoBlur,
    handleGananciaBlur,
    handlePrecioVentaBlur,
    parseGananciaPct,
    computeSubmitPrecio,
    parseCosto: () => parseFloat(parseNumberInput(costoDisplay).toFixed(2)),
  };
}

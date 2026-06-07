import { describe, expect, it } from "vitest";
import {
  precioVentaEsperadoPorMargenGlobal,
  textoPorcentajeVenta,
  PRECIO_IGUAL_EPS,
} from "./margin-display";

describe("precioVentaEsperadoPorMargenGlobal", () => {
  it("calcula costo × (1 + margen/100) con 2 decimales", () => {
    expect(precioVentaEsperadoPorMargenGlobal(100, 20)).toBe(120);
    expect(precioVentaEsperadoPorMargenGlobal(33.33, 10)).toBe(36.66);
  });
});

describe("textoPorcentajeVenta", () => {
  it("muestra guión si costo no es válido", () => {
    expect(textoPorcentajeVenta(0, 100, 20)).toEqual({ texto: "—", title: "" });
  });

  it("muestra margen global si precio coincide con el esperado", () => {
    const costo = 100;
    const ganancia = 25;
    const precio = precioVentaEsperadoPorMargenGlobal(costo, ganancia);
    const result = textoPorcentajeVenta(costo, precio, ganancia);
    expect(result.texto).toContain("25");
    expect(result.title).toContain("margen global");
  });

  it("muestra margen real si precio difiere del esperado", () => {
    const result = textoPorcentajeVenta(100, 150, 20);
    expect(result.texto).toContain("50");
    expect(result.title).toContain("margen real");
  });

  it("tolera diferencia dentro de PRECIO_IGUAL_EPS", () => {
    const costo = 100;
    const ganancia = 20;
    const esperado = precioVentaEsperadoPorMargenGlobal(costo, ganancia);
    const result = textoPorcentajeVenta(costo, esperado + PRECIO_IGUAL_EPS / 2, ganancia);
    expect(result.title).toContain("margen global");
  });
});

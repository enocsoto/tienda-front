import { describe, expect, it } from "vitest";
import { isAdminRole, isAdminOnlyPath, getDefaultAdminRoute } from "./auth";

describe("isAdminRole", () => {
  it("retorna true solo para admin", () => {
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("cashier")).toBe(false);
    expect(isAdminRole(null)).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
  });
});

describe("isAdminOnlyPath", () => {
  it("detecta rutas admin-only", () => {
    expect(isAdminOnlyPath("/admin/settings")).toBe(true);
    expect(isAdminOnlyPath("/admin/inventory/edit/abc123")).toBe(true);
    expect(isAdminOnlyPath("/admin/sales")).toBe(false);
  });
});

describe("getDefaultAdminRoute", () => {
  it("redirige según rol", () => {
    expect(getDefaultAdminRoute("admin")).toBe("/admin/settings");
    expect(getDefaultAdminRoute("cashier")).toBe("/admin/sales");
  });
});

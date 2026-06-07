export interface StoredUser {
  username: string;
  role: string;
}

/** Rutas accesibles solo con `role === 'admin'`. */
export const ADMIN_ONLY_PATH_PREFIXES = [
  "/admin/settings",
  "/admin/inventory/categories",
  "/admin/inventory/new",
  "/admin/inventory/edit",
] as const;

export function isAdminRole(role: string | undefined | null): boolean {
  return role === "admin";
}

export function isAdminOnlyPath(pathname: string): boolean {
  return ADMIN_ONLY_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function getDefaultAdminRoute(role: string | undefined | null): string {
  return isAdminRole(role) ? "/admin/settings" : "/admin/sales";
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredUser;
    if (!parsed?.username || !parsed?.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

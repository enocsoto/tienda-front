"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { use, useEffect, useState } from "react";
import {
  Settings,
  Package,
  ShoppingCart,
  Wallet,
  Bell,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Store,
  History,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { Toast, ToastMessage } from "@/components/ui/Toast";

const SIDEBAR_COLLAPSED_KEY = "kiosko-sidebar-collapsed";
const TIENDA_NOMBRE_KEY = "kiosko_tienda_nombre";
const TIENDA_LOGO_KEY = "kiosko_tienda_logo";
const TIENDA_UPDATED_EVENT = "kiosko-tienda-updated";

/** Promesas estables para use() cuando Next.js no inyecta params/searchParams (evita crear promesas en cada render). */
const EMPTY_PARAMS = Promise.resolve({}) as Promise<Record<string, string | string[]>>;
const EMPTY_SEARCH = Promise.resolve({}) as Promise<Record<string, string | string[] | undefined>>;

function getTiendaFromStorage() {
  if (typeof window === "undefined") return { nombre: "Kiosko", logo: "" };
  return {
    nombre: localStorage.getItem(TIENDA_NOMBRE_KEY) || "Kiosko",
    logo: localStorage.getItem(TIENDA_LOGO_KEY) || "",
  };
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  children?: { name: string; href: string; icon: React.ElementType }[];
}

const navItems: NavItem[] = [
  { name: "Configuración", href: "/admin/configuracion", icon: Settings },
  {
    name: "Inventario",
    href: "/admin/inventario",
    icon: Package,
  },
  {
    name: "Ventas",
    href: "/admin/ventas",
    icon: ShoppingCart,
    children: [
      { name: "Punto de Venta", href: "/admin/ventas", icon: ShoppingCart },
      { name: "Historial", href: "/admin/ventas/historial", icon: History },
      { name: "Créditos", href: "/admin/creditos", icon: CreditCard },
    ],
  },
  {
    name: "Caja",
    href: "/admin/caja",
    icon: Wallet,
    children: [
      { name: "Balance Diario", href: "/admin/caja", icon: Wallet },
      { name: "Utilidades", href: "/admin/caja/utilidad", icon: TrendingUp },
    ],
  },
  { name: "Notificaciones", href: "/admin/notificaciones", icon: Bell },
];

type AdminLayoutProps = {
  children: React.ReactNode;
  params?: Promise<Record<string, string | string[]>>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default function AdminLayout(props: AdminLayoutProps) {
  const { children } = props;
  // Desenvolver las promesas para cumplir con la API asíncrona de Next.js 15+ (sin enumerar ni acceder a claves).
  use(props.params ?? EMPTY_PARAMS);
  use(props.searchParams ?? EMPTY_SEARCH);
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [unread, setUnread] = useState(0);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  });
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [tienda, setTienda] = useState({ nombre: "Kiosko", logo: "" });
  const [toast, setToast] = useState<ToastMessage | null>(null);

  /** Cuando está recogido, al pasar el mouse se expande para poder elegir opción; al salir vuelve a recogido */
  const isCollapsed = sidebarCollapsed && !sidebarHovered;

  useEffect(() => {
    setTienda(getTiendaFromStorage());
    const onTiendaUpdated = () => setTienda(getTiendaFromStorage());
    window.addEventListener(TIENDA_UPDATED_EVENT, onTiendaUpdated);
    return () => window.removeEventListener(TIENDA_UPDATED_EVENT, onTiendaUpdated);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!token || !storedUser) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.replace("/");
      return;
    }
    try {
      setUser(JSON.parse(storedUser));
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.replace("/");
    }
  }, [router]);

  useEffect(() => {
    if (!user) return;

    let isActive = true;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const loadUnread = async (showToastOnIncrease: boolean) => {
      try {
        const { fetchApi } = await import("@/lib/api");
        const data = await fetchApi("/notifications/unread-count");
        if (!isActive || !data) return;

        setUnread((prev) => {
          const previous = prev ?? 0;
          const next =
            typeof (data as { count?: unknown }).count === "number"
              ? (data as { count: number }).count
              : previous;

          if (
            showToastOnIncrease &&
            next > previous &&
            pathname !== "/admin/notificaciones"
          ) {
            const diff = next - previous;
            setToast({
              text:
                diff === 1
                  ? "Tienes 1 nueva notificación"
                  : `Tienes ${diff} nuevas notificaciones`,
              type: "success",
            });
          }

          return next;
        });
      } catch {
        // Ignorar errores de polling
      }
    };

    // Primer fetch sin mostrar toast
    loadUnread(false);
    intervalId = setInterval(() => {
      loadUnread(true);
    }, 30000);

    return () => {
      isActive = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [user, pathname]);

  // Auto-expand section that matches current path
  useEffect(() => {
    navItems.forEach((item) => {
      if (item.children) {
        const isActive = item.children.some((c) => pathname.startsWith(c.href));
        if (isActive) {
          setExpanded((prev) => (prev.includes(item.name) ? prev : [...prev, item.name]));
        }
      }
    });
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  const toggleExpand = (name: string) => {
    setExpanded((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  if (!user)
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Cargando...</p>
        </div>
      </div>
    );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar fijo: solo el contenido central hace scroll */}
      <aside
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
        className={`shrink-0 bg-white border-r border-slate-200 flex flex-col shadow-sm transition-[width] duration-200 ${
          isCollapsed ? "w-16" : "w-52"
        }`}
      >
        {/* Logo + Toggle */}
        <div
          className={`border-b border-slate-100 flex items-center ${
            isCollapsed ? "justify-center gap-1.5 px-0 py-3" : "gap-2 px-4 py-4"
          }`}
        >
          <div className={`flex items-center gap-2 min-w-0 ${!isCollapsed ? "flex-1" : ""}`}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shrink-0 overflow-hidden bg-sky-600">
              {tienda.logo ? (
                <img src={tienda.logo} alt="" className="w-full h-full object-cover" />
              ) : (
                <Store className="w-4 h-4 text-white" />
              )}
            </div>
            {!isCollapsed && (
              <div className="min-w-[7rem] flex-shrink-0">
                <p className="font-bold text-slate-900 text-sm leading-tight break-words">
                  {tienda.nombre || "Kiosko"}
                </p>
                <p className="text-[10px] text-slate-400 leading-tight">Gestión</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            title={sidebarCollapsed ? "Expandir barra" : "Recoger barra"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav
          className={`flex-1 py-3 space-y-0.5 overflow-y-auto min-h-0 ${
            isCollapsed ? "px-1.5" : "px-2"
          }`}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = !!item.children;
            const isExpanded = expanded.includes(item.name);
            const firstChildHref = hasChildren ? item.children![0].href : item.href;
            const isActive =
              item.href === "/admin/notificaciones"
                ? pathname === item.href
                : pathname.startsWith(item.href);
            const isGroupActive = hasChildren && item.children!.some((c) => pathname.startsWith(c.href));

            if (isCollapsed) {
              return (
                <Link
                  key={item.name}
                  href={firstChildHref}
                  className={`relative flex items-center justify-center py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isGroupActive || isActive
                      ? "bg-sky-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                  title={item.name}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {item.name === "Notificaciones" && unread > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </Link>
              );
            }

            if (hasChildren) {
              return (
                <div key={item.name}>
                  <button
                    onClick={() => toggleExpand(item.name)}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-sm font-medium transition-all ${
                      isGroupActive
                        ? "bg-sky-50 text-sky-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5 shrink-0" />
                    <span className="flex-1 text-left">{item.name}</span>
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform text-slate-400 ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                  {isExpanded && (
                    <div className="ml-3 mt-0.5 space-y-0.5 border-l-2 border-slate-100 pl-2">
                      {item.children!.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              isChildActive
                                ? "bg-sky-600 text-white shadow-sm"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                            }`}
                          >
                            <ChildIcon className="w-3.5 h-3.5 shrink-0" />
                            {child.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <Icon className="w-4.5 h-4.5 shrink-0" />
                <span className="flex-1">{item.name}</span>
                {item.name === "Notificaciones" && unread > 0 && (
                  <span
                    className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? "bg-white/20 text-white" : "bg-red-500 text-white"
                    }`}
                  >
                    {unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User (abajo) */}
        <div
          className={`border-t border-slate-100 flex ${
            isCollapsed ? "justify-center px-1.5 py-2" : "px-2 py-2"
          }`}
        >
          <div
            className={`flex items-center rounded-lg bg-slate-50 ${
              isCollapsed ? "justify-center p-1.5" : "gap-2 px-2 py-1.5 min-w-0"
            }`}
          >
            <div className="w-7 h-7 bg-sky-100 rounded-full flex items-center justify-center shrink-0">
              <span className="text-sky-700 text-[10px] font-bold uppercase">
                {user.username.charAt(0)}
              </span>
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800 truncate">{user.username}</p>
                <p className="text-[10px] text-slate-400 capitalize truncate">{user.role}</p>
              </div>
            )}
          </div>
        </div>

        {/* Logout */}
        <div className={`border-t border-slate-100 ${isCollapsed ? "px-1.5 py-2" : "px-2 py-2"}`}>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center rounded-lg text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all ${
              isCollapsed ? "justify-center p-2" : "gap-2 px-2 py-2"
            }`}
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Content: solo esta zona hace scroll */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-medium">
            {new Date().toLocaleDateString("es-AR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/notificaciones"
              className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </Link>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
        <Toast message={toast} onClose={() => setToast(null)} />
      </div>
    </div>
  );
}

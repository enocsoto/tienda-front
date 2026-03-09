"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toast, ToastMessage } from "@/components/ui/Toast";
import { Bell, BellOff, ChevronRight, CheckCheck } from "lucide-react";

interface Notificacion {
  id: string;
  mensaje: string;
  tipo: string;
  observaciones?: string;
  fecha_enviada: string;
  fecha_visto?: string;
  emisor?: string;
}

const tipoConfig: Record<string, { label: string; color: string }> = {
  CREDITO_VENCIDO: { label: "Crédito", color: "bg-red-100 text-red-700" },
  STOCK_CRITICO: { label: "Poco stock", color: "bg-amber-100 text-amber-700" },
  PEDIDO_RECIBIDO: { label: "Pedido recibido", color: "bg-emerald-100 text-emerald-700" },
  VENTA_ANULADA: { label: "Venta", color: "bg-slate-100 text-slate-600" },
  MARKUP_CAMBIO: { label: "Config", color: "bg-sky-100 text-sky-700" },
};

export default function NotificacionesPage() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const router = useRouter();

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await fetchApi("/notifications");
      const list = Array.isArray(data) ? data : [];
      setNotificaciones(
        list.map((n: Notificacion & { _id?: unknown }) => ({
          ...n,
          id: n.id ?? (typeof n._id === "string" ? n._id : (n._id as { toString?: () => string })?.toString?.()),
        }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetchApi(`/notifications/${id}/seen`, { method: "PATCH" });
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === id ? { ...n, fecha_visto: new Date().toISOString() } : n))
      );
      router.refresh();
    } catch {
      /* ignore */
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetchApi("/notifications/mark-all-seen", { method: "PATCH" });
      setToast({ text: "Todas las notificaciones marcadas como leídas", type: "success" });
      loadNotifications();
      router.refresh();
    } catch {
      /* ignore */
    }
  };

  const handleAction = async (notif: Notificacion) => {
    if (!notif.fecha_visto) await markAsRead(notif.id);
    const routes: Record<string, string> = {
      CREDITO_VENCIDO: "/admin/creditos",
      STOCK_CRITICO: "/admin/inventario",
      PEDIDO_RECIBIDO: "/admin/ventas/historial",
      VENTA_ANULADA: "/admin/ventas/historial",
      MARKUP_CAMBIO: "/admin/configuracion",
    };
    if (routes[notif.tipo]) router.push(routes[notif.tipo]);
  };

  const unreadCount = notificaciones.filter((n) => !n.fecha_visto).length;

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Notificaciones"
        subtitle={`${unreadCount} sin leer`}
        actions={
          unreadCount > 0 ? (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-sky-600 bg-white border border-slate-200 hover:border-sky-200 px-4 py-2 rounded-xl transition-all"
            >
              <CheckCheck className="w-4 h-4" />
              Marcar todas como leídas
            </button>
          ) : undefined
        }
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-5 animate-pulse flex gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : notificaciones.length === 0 ? (
          <div className="py-20 text-center">
            <BellOff className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-medium text-sm">No tienes notificaciones</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notificaciones.map((n) => {
              const config = tipoConfig[n.tipo] || { label: n.tipo, color: "bg-slate-100 text-slate-600" };
              const isUnread = !n.fecha_visto;
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-4 p-5 transition-colors ${
                    isUnread ? "bg-sky-50/40 hover:bg-sky-50" : "bg-white hover:bg-slate-50/60"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isUnread ? "bg-sky-100" : "bg-slate-100"
                    }`}
                  >
                    <Bell
                      className={`w-5 h-5 ${isUnread ? "text-sky-600" : "text-slate-400"}`}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      {isUnread && (
                        <span className="w-2 h-2 bg-sky-500 rounded-full mt-1.5 shrink-0" />
                      )}
                      <p
                        className={`text-sm font-semibold ${
                          isUnread ? "text-slate-800" : "text-slate-500"
                        }`}
                      >
                        {n.mensaje}
                      </p>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${config.color}`}
                      >
                        {config.label}
                      </span>
                    </div>
                    {n.observaciones && (
                      <p className="text-xs text-slate-400 mt-1 ml-4">{n.observaciones}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1.5 ml-4">
                      {new Date(n.fecha_enviada).toLocaleString("es-AR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {n.emisor && <span className="ml-2">· {n.emisor}</span>}
                    </p>
                  </div>

                  {/* Action */}
                  <button
                    onClick={() => handleAction(n)}
                    className={`shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition-colors ${
                      isUnread
                        ? "bg-sky-100 hover:bg-sky-200 text-sky-700"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-500"
                    }`}
                  >
                    Ver
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}

import { formatCOP } from "@/lib/format";
import {
  User,
  Phone,
  MapPin,
  CalendarClock,
  CreditCard,
  MessageSquare,
  Loader2,
  Check,
  Copy,
} from "lucide-react";
import {
  getDefaultFechaHoraEntrega,
  type CartEntry,
  type MetodoPago,
  type ModoEntrega,
  type NequiCuentaPublic,
} from "../types";
import { CartPanel } from "./CartPanel";

interface CheckoutFormProps {
  cart: CartEntry[];
  totalCarrito: number;
  clienteNombre: string;
  setClienteNombre: (v: string) => void;
  clienteTelefono: string;
  setClienteTelefono: (v: string) => void;
  direccion: string;
  setDireccion: (v: string) => void;
  metodoPago: MetodoPago;
  setMetodoPago: (v: MetodoPago) => void;
  fechaHoraEntrega: string;
  setFechaHoraEntrega: (v: string) => void;
  modoEntrega: ModoEntrega;
  setModoEntrega: (v: ModoEntrega) => void;
  notas: string;
  setNotas: (v: string) => void;
  submitting: boolean;
  nequiCuentas: NequiCuentaPublic[];
  nequiCopiedIndex: number | null;
  onCopyNequi: (numero: string, index: number) => void;
  onBackToCatalog: () => void;
  onUpdateCantidad: (productId: string, delta: number) => void;
  onSetCantidadDirect: (productId: string, value: number) => void;
  onRemove: (productId: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function CheckoutForm({
  cart,
  totalCarrito,
  clienteNombre,
  setClienteNombre,
  clienteTelefono,
  setClienteTelefono,
  direccion,
  setDireccion,
  metodoPago,
  setMetodoPago,
  fechaHoraEntrega,
  setFechaHoraEntrega,
  modoEntrega,
  setModoEntrega,
  notas,
  setNotas,
  submitting,
  nequiCuentas,
  nequiCopiedIndex,
  onCopyNequi,
  onBackToCatalog,
  onUpdateCantidad,
  onSetCantidadDirect,
  onRemove,
  onSubmit,
}: CheckoutFormProps) {
  return (
    <div className="w-full max-w-lg mx-auto">
      <button
        type="button"
        onClick={onBackToCatalog}
        className="text-sm text-slate-500 hover:text-sky-600 mb-4"
      >
        ← Volver al catálogo
      </button>

      <div className="mb-5 bg-slate-50 rounded-xl border border-slate-200 p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-slate-700">
            {cart.length} producto(s) · Total {formatCOP(totalCarrito)}
          </p>
          <button
            type="button"
            onClick={onBackToCatalog}
            className="text-xs font-medium text-sky-600 hover:text-sky-700"
          >
            Editar productos
          </button>
        </div>
        {cart.length > 0 && (
          <CartPanel
            cart={cart}
            totalCarrito={totalCarrito}
            onContinue={() => {}}
            onUpdateCantidad={onUpdateCantidad}
            onSetCantidadDirect={onSetCantidadDirect}
            onRemove={onRemove}
            compact
          />
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-slate-700 mb-1">
              <User className="w-4 h-4 inline mr-1" />
              Nombre
            </label>
            <input
              id="nombre"
              type="text"
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none"
              placeholder="Tu nombre"
              required
            />
          </div>
          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-slate-700 mb-1">
              <Phone className="w-4 h-4 inline mr-1" />
              Teléfono (WhatsApp)
            </label>
            <input
              id="telefono"
              type="tel"
              value={clienteTelefono}
              onChange={(e) => setClienteTelefono(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none"
              placeholder="Ej: 300 123 4567"
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="direccion" className="block text-sm font-medium text-slate-700 mb-1">
            <MapPin className="w-4 h-4 inline mr-1" />
            Dirección de entrega
          </label>
          <input
            id="direccion"
            type="text"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none"
            placeholder="Calle, barrio, ciudad"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <CalendarClock className="w-4 h-4 inline mr-1" />
            Entrega
          </label>
          <div className="flex gap-3 mb-3">
            <label className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 cursor-pointer transition-colors has-[:checked]:border-sky-500 has-[:checked]:bg-sky-50">
              <input
                type="radio"
                name="modoEntrega"
                value="LO_ANTES_POSIBLE"
                checked={modoEntrega === "LO_ANTES_POSIBLE"}
                onChange={() => setModoEntrega("LO_ANTES_POSIBLE")}
                className="sr-only"
              />
              <span className="text-sm font-medium text-slate-700">Lo antes posible</span>
            </label>
            <label className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 cursor-pointer transition-colors has-[:checked]:border-sky-500 has-[:checked]:bg-sky-50">
              <input
                type="radio"
                name="modoEntrega"
                value="PROGRAMADA"
                checked={modoEntrega === "PROGRAMADA"}
                onChange={() => setModoEntrega("PROGRAMADA")}
                className="sr-only"
              />
              <span className="text-sm font-medium text-slate-700">Programar envío</span>
            </label>
          </div>
          {modoEntrega === "PROGRAMADA" ? (
            <>
              <input
                id="fecha"
                type="datetime-local"
                step="3600"
                value={fechaHoraEntrega.slice(0, 16)}
                onChange={(e) =>
                  setFechaHoraEntrega(
                    e.target.value ? `${e.target.value}:00` : getDefaultFechaHoraEntrega(),
                  )
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none"
                required={modoEntrega === "PROGRAMADA"}
              />
              <p className="text-xs text-slate-500 mt-1">Indica día y hora exacta (ej. 5:00 PM)</p>
            </>
          ) : (
            <p className="text-xs text-slate-500">
              La tienda preparará tu pedido y lo enviará lo más pronto posible.
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <CreditCard className="w-4 h-4 inline mr-1" />
            Forma de pago
          </label>
          <div className="flex gap-3">
            <label className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 cursor-pointer transition-colors has-[:checked]:border-sky-500 has-[:checked]:bg-sky-50">
              <input
                type="radio"
                name="pago"
                value="EFECTIVO"
                checked={metodoPago === "EFECTIVO"}
                onChange={() => setMetodoPago("EFECTIVO")}
                className="sr-only"
              />
              <span className="font-medium text-slate-700">Efectivo</span>
            </label>
            <label className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 cursor-pointer transition-colors has-[:checked]:border-sky-500 has-[:checked]:bg-sky-50">
              <input
                type="radio"
                name="pago"
                value="NEQUI"
                checked={metodoPago === "NEQUI"}
                onChange={() => setMetodoPago("NEQUI")}
                className="sr-only"
              />
              <span className="font-medium text-slate-700">Nequi</span>
            </label>
          </div>
          {metodoPago === "NEQUI" && (
            <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs font-medium text-slate-500 mb-2">
                Transfiere a una de estas cuentas Nequi (como se muestra en la app):
              </p>
              {nequiCuentas.length === 0 ? (
                <p className="text-sm text-slate-500">No hay cuentas Nequi configuradas.</p>
              ) : (
                <ul className="space-y-2">
                  {nequiCuentas.map((c, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-white border border-slate-100"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-slate-800">{c.numero}</span>
                        <button
                          type="button"
                          onClick={() => onCopyNequi(c.numero, i)}
                          className="shrink-0 inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-slate-500 hover:bg-sky-50 hover:text-sky-600 transition-colors text-xs font-medium"
                          title="Copiar número"
                        >
                          {nequiCopiedIndex === i ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              Copiado
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copiar
                            </>
                          )}
                        </button>
                      </div>
                      <span className="text-sm text-slate-600 shrink-0">
                        {c.nombreMasked} {c.apellidoMasked}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <div>
          <label htmlFor="notas" className="block text-sm font-medium text-slate-700 mb-1">
            <MessageSquare className="w-4 h-4 inline mr-1" />
            Notas (opcional)
          </label>
          <textarea
            id="notas"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none resize-none"
            placeholder="Instrucciones adicionales para la entrega"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-sky-600 py-3 font-semibold text-white hover:bg-sky-700 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Enviando pedido…
            </>
          ) : (
            <>Enviar pedido por WhatsApp</>
          )}
        </button>
      </form>
    </div>
  );
}

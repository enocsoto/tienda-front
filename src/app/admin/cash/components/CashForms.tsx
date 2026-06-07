import { TrendingDown, HandCoins, X } from "lucide-react";
import type { MedioPagoEgreso } from "../types";

interface EgresoFormProps {
  egresoDesc: string;
  setEgresoDesc: (v: string) => void;
  egresoMonto: string;
  setEgresoMonto: (v: string) => void;
  egresoCategoria: string;
  setEgresoCategoria: (v: string) => void;
  egresoMedioPago: MedioPagoEgreso;
  setEgresoMedioPago: (v: MedioPagoEgreso) => void;
  egresoFecha: string;
  setEgresoFecha: (v: string) => void;
  saving: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function EgresoForm(props: EgresoFormProps) {
  return (
    <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6 mb-6 max-w-lg">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-red-600 flex items-center gap-2">
          <TrendingDown className="w-4.5 h-4.5" />
          Registrar Egreso
        </h3>
        <button onClick={props.onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      <form onSubmit={props.onSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5" htmlFor="caja-egreso-fecha">
            Fecha del pago
          </label>
          <input
            id="caja-egreso-fecha"
            type="date"
            required
            value={props.egresoFecha}
            onChange={(e) => props.setEgresoFecha(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-900 focus:bg-white focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all"
          />
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Es el día en que se realizó el pago. La lista de movimientos muestra esta fecha (no el rango
            del filtro de arriba).
          </p>
        </div>
        <select
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-900 focus:bg-white focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all"
          value={props.egresoCategoria}
          onChange={(e) => props.setEgresoCategoria(e.target.value)}
        >
          <option value="">Categoría (opcional)</option>
          <option value="PROVEEDOR">Proveedor</option>
          <option value="SERVICIOS">Servicios</option>
          <option value="PAGO_PRESTAMO">Pago de préstamo</option>
          <option value="OTROS">Otros</option>
        </select>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Medio de pago</label>
          <select
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-900 focus:bg-white focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all"
            value={props.egresoMedioPago}
            onChange={(e) => props.setEgresoMedioPago(e.target.value as MedioPagoEgreso)}
          >
            <option value="EFECTIVO">Efectivo</option>
            <option value="NEQUI">Nequi</option>
            <option value="TRANSFERENCIA">Transferencia</option>
          </select>
          <p className="text-xs text-slate-400 mt-1.5">
            Pagos a proveedor por Nequi o transferencia cuentan en el KPI de egresos digitales.
          </p>
        </div>
        <input
          type="text"
          placeholder="Descripción (ej: Pago a proveedor, Pago de préstamo...)"
          required
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-900 focus:bg-white focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all"
          value={props.egresoDesc}
          onChange={(e) => props.setEgresoDesc(e.target.value)}
        />
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">$</span>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            required
            className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-900 focus:bg-white focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all"
            value={props.egresoMonto}
            onChange={(e) => props.setEgresoMonto(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={props.onClose}
            className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={props.saving}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl text-sm font-medium shadow-sm transition-colors disabled:opacity-60"
          >
            {props.saving ? "Registrando..." : "Guardar Egreso"}
          </button>
        </div>
      </form>
    </div>
  );
}

interface PrestamoFormProps {
  prestamoDesc: string;
  setPrestamoDesc: (v: string) => void;
  prestamoFecha: string;
  setPrestamoFecha: (v: string) => void;
  prestamoMonto: string;
  setPrestamoMonto: (v: string) => void;
  prestamoPrestamista: string;
  setPrestamoPrestamista: (v: string) => void;
  saving: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function PrestamoForm(props: PrestamoFormProps) {
  return (
    <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-6 mb-6 max-w-lg">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-emerald-600 flex items-center gap-2">
          <HandCoins className="w-4.5 h-4.5" />
          Registrar Préstamo Recibido
        </h3>
        <button onClick={props.onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      <form onSubmit={props.onSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5" htmlFor="caja-prestamo-fecha">
            Fecha del movimiento
          </label>
          <input
            id="caja-prestamo-fecha"
            type="date"
            required
            value={props.prestamoFecha}
            onChange={(e) => props.setPrestamoFecha(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-900 focus:bg-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
          />
        </div>
        <input
          type="text"
          placeholder="Descripción (ej: Préstamo para compra de inventario)"
          required
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-900 focus:bg-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
          value={props.prestamoDesc}
          onChange={(e) => props.setPrestamoDesc(e.target.value)}
        />
        <input
          type="text"
          placeholder="Prestamista (opcional)"
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-900 focus:bg-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
          value={props.prestamoPrestamista}
          onChange={(e) => props.setPrestamoPrestamista(e.target.value)}
        />
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">$</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            required
            className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-900 focus:bg-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
            value={props.prestamoMonto}
            onChange={(e) => props.setPrestamoMonto(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={props.onClose}
            className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={props.saving}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-medium shadow-sm transition-colors disabled:opacity-60"
          >
            {props.saving ? "Registrando..." : "Guardar Préstamo"}
          </button>
        </div>
      </form>
    </div>
  );
}

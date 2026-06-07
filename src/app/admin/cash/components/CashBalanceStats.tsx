import { formatCOP } from "@/lib/format";
import { StatCard } from "@/components/ui/StatCard";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Banknote,
  HandCoins,
  Smartphone,
  Send,
} from "lucide-react";
import type { Balance } from "../types";

interface CashBalanceStatsProps {
  balance: Balance | null;
  loading: boolean;
  periodoMultiDia: boolean;
  isPositive: boolean;
}

export function CashBalanceStats({
  balance,
  loading,
  periodoMultiDia,
  isPositive,
}: CashBalanceStatsProps) {
  const etiquetaVentasPeriodo = periodoMultiDia ? "Ventas del periodo" : "Ventas del día";
  const subtituloBase =
    "Monto fijo de referencia — no se multiplica por días (diario, semanal o mensual)";

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
            <div className="h-4 bg-slate-100 rounded w-1/2 mb-3" />
            <div className="h-8 bg-slate-100 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (!balance) {
    return <div className="text-red-500 text-sm font-medium">Error al cargar el balance.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {balance.base_caja != null && (
        <StatCard
          title="Base de caja"
          value={formatCOP(Number(balance.base_caja))}
          icon={Banknote}
          variant="primary"
          subtitle={subtituloBase}
        />
      )}
      <StatCard
        title="Ventas"
        value={formatCOP(Number(balance.total_ventas ?? balance.total_ingresos))}
        icon={TrendingUp}
        variant="success"
        subtitle={etiquetaVentasPeriodo}
      />
      <StatCard
        title="Nequi / Transferencia"
        value={formatCOP(Number(balance.total_ventas_nequi_transferencia ?? 0))}
        icon={Smartphone}
        variant="violet"
        subtitle="Ingresos por ventas digitales"
      />
      <StatCard
        title="Egresos Nequi / Transf."
        value={formatCOP(Number(balance.total_egresos_nequi_transferencia ?? 0))}
        icon={Send}
        variant="danger"
        subtitle="Solo egresos marcados Nequi o transferencia (no efectivo)"
      />
      <StatCard
        title="Préstamos recibidos"
        value={formatCOP(Number(balance.total_prestamos ?? 0))}
        icon={HandCoins}
        variant="amber"
        subtitle={periodoMultiDia ? "Préstamos del periodo" : "Préstamos del día"}
      />
      <StatCard
        title="Total Egresos"
        value={formatCOP(Number(balance.total_egresos))}
        icon={TrendingDown}
        variant="danger"
        subtitle="Todos los egresos (efectivo + Nequi / transf.) y pagos a préstamos"
      />
      <StatCard
        title="Balance Neto"
        value={formatCOP(Number(balance.balance_neto))}
        icon={Wallet}
        variant={isPositive ? "success" : "danger"}
        subtitle={
          isPositive
            ? `${formatCOP(Number(balance.base_caja_diaria ?? 150_000))} fijos + ventas + préstamos − egresos (la base no suma por días)`
            : "Resultado negativo"
        }
      />
    </div>
  );
}

"use client";

import Link from "next/link";
import { Store, Check } from "lucide-react";
import { usePurchaseCatalog } from "./hooks/usePurchaseCatalog";
import { usePurchaseCart } from "./hooks/usePurchaseCart";
import { CatalogGrid } from "./components/CatalogGrid";
import { CartPanel } from "./components/CartPanel";
import { CheckoutForm } from "./components/CheckoutForm";

export default function PurchasePage() {
  const catalog = usePurchaseCatalog();
  const cartState = usePurchaseCart();

  const displayError = catalog.error || cartState.error;

  if (cartState.success) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-sky-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Pedido enviado</h1>
          <p className="text-slate-600 mb-8">
            Te contactaremos por WhatsApp para confirmar. Revisa tu teléfono.
          </p>
          <button
            type="button"
            onClick={() => cartState.setSuccess(false)}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-medium text-white hover:bg-sky-700"
          >
            Hacer otro pedido
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-sky-600 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-slate-900">Comprar por WhatsApp</span>
          </div>
          <Link href="/" className="text-sm text-slate-500 hover:text-sky-600 transition-colors">
            Admin
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {displayError && (
          <div
            role="alert"
            className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700"
          >
            {displayError}
          </div>
        )}

        {cartState.step === "catalogo" && (
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            <CartPanel
              cart={cartState.cart}
              totalCarrito={cartState.totalCarrito}
              onContinue={() => cartState.setStep("datos")}
              onUpdateCantidad={cartState.updateCantidad}
              onSetCantidadDirect={cartState.setCantidadDirect}
              onRemove={cartState.removeFromCart}
            />
            <CatalogGrid
              productos={catalog.productos}
              loading={catalog.loading}
              searchInput={catalog.searchInput}
              onSearchInputChange={catalog.setSearchInput}
              onSearchSubmit={catalog.handleSearch}
              page={catalog.page}
              totalPages={catalog.totalPages}
              totalProductos={catalog.totalProductos}
              onPrevPage={() => catalog.goToPage(catalog.page - 1)}
              onNextPage={() => catalog.goToPage(catalog.page + 1)}
              onAddToCart={cartState.addToCart}
            />
          </div>
        )}

        {cartState.step === "datos" && (
          <CheckoutForm
            cart={cartState.cart}
            totalCarrito={cartState.totalCarrito}
            clienteNombre={cartState.clienteNombre}
            setClienteNombre={cartState.setClienteNombre}
            clienteTelefono={cartState.clienteTelefono}
            setClienteTelefono={cartState.setClienteTelefono}
            direccion={cartState.direccion}
            setDireccion={cartState.setDireccion}
            metodoPago={cartState.metodoPago}
            setMetodoPago={cartState.setMetodoPago}
            fechaHoraEntrega={cartState.fechaHoraEntrega}
            setFechaHoraEntrega={cartState.setFechaHoraEntrega}
            modoEntrega={cartState.modoEntrega}
            setModoEntrega={cartState.setModoEntrega}
            notas={cartState.notas}
            setNotas={cartState.setNotas}
            submitting={cartState.submitting}
            nequiCuentas={cartState.nequiCuentas}
            nequiCopiedIndex={cartState.nequiCopiedIndex}
            onCopyNequi={cartState.copyNequiNumber}
            onBackToCatalog={() => cartState.setStep("catalogo")}
            onUpdateCantidad={cartState.updateCantidad}
            onSetCantidadDirect={cartState.setCantidadDirect}
            onRemove={cartState.removeFromCart}
            onSubmit={cartState.handleSubmit}
          />
        )}
      </div>
    </main>
  );
}

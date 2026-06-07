"use client";

import { Toast } from "@/components/ui/Toast";
import { usePosCart } from "./hooks/usePosCart";
import { ProductGrid } from "./components/ProductGrid";
import { CheckoutPanel } from "./components/CheckoutPanel";

export default function POSPage() {
  const pos = usePosCart();

  if (pos.step === "checkout") {
    return (
      <>
        <CheckoutPanel
          cart={pos.cart}
          total={pos.total}
          saving={pos.saving}
          tipoVenta={pos.tipoVenta}
          setTipoVenta={pos.setTipoVenta}
          metodoPago={pos.metodoPago}
          setMetodoPago={pos.setMetodoPago}
          clienteNombre={pos.clienteNombre}
          setClienteNombre={pos.setClienteNombre}
          fechaVencimiento={pos.fechaVencimiento}
          setFechaVencimiento={pos.setFechaVencimiento}
          fechaVenta={pos.fechaVenta}
          setFechaVenta={pos.setFechaVenta}
          fechaMinVenta={pos.fechaMinVenta}
          fechaMaxVenta={pos.fechaMaxVenta}
          searchCheckout={pos.searchCheckout}
          setSearchCheckout={pos.setSearchCheckout}
          searchResults={pos.searchResults}
          setSearchResults={pos.setSearchResults}
          searchCheckoutLoading={pos.searchCheckoutLoading}
          onBack={() => pos.setStep("products")}
          onAddProduct={pos.addProductToCart}
          onUpdateQty={pos.updateQty}
          onSetQtyDirect={pos.setQtyDirect}
          onRemove={pos.removeFromCart}
          formatCantidad={pos.formatCantidad}
          onCheckout={pos.handleCheckout}
        />
        <Toast message={pos.toast} onClose={() => pos.setToast(null)} />
      </>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-9rem)]">
      <ProductGrid
        products={pos.products}
        cart={pos.cart}
        search={pos.search}
        onSearchChange={pos.setSearch}
        onAddToCart={pos.addProductToCart}
        onGoCheckout={() => pos.setStep("checkout")}
      />
      <Toast message={pos.toast} onClose={() => pos.setToast(null)} />
    </div>
  );
}

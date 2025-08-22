// src/Cart.jsx
import React from "react";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import Button from "./components/ui/button.jsx";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./components/ui/sheet.jsx";

// Lokalny pomocnik do formatowania ceny (żeby Cart.jsx był samowystarczalny)
const currency = (n) =>
  new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(n);

/**
 * Cart – kontrolowany koszyk (brak SheetTrigger; sterowanie tylko przez propsy open/setOpen)
 *
 * Props:
 *  - t: tłumaczenia (obiekt)
 *  - cart: [{ image, title, size, turnaround, personalization, price, qty }, ...]
 *  - subtotal: number
 *  - removeFromCart: (index) => void
 *  - updateQty?: (index, delta) => void  // jeśli podasz, pokaże przyciski +/-; jeśli nie, pokaże tylko ilość
 *  - open: boolean
 *  - setOpen: (boolean) => void
 */
export default function Cart({
  t,
  cart,
  subtotal,
  removeFromCart,
  updateQty,
  open,
  setOpen,
}) {
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* UWAGA: brak <SheetTrigger> – unikamy button-in-button i sterujemy stanem z zewnątrz */}
      <SheetContent
        side="right"
        className="p-0 w-full sm:!max-w-[400px] md:!max-w-[420px]"
      >
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" /> {t.cart}
            </SheetTitle>
            <Button variant="ghost" onClick={() => setOpen(false)}>✕</Button>
          </div>
        </SheetHeader>

        <div className="mt-4 space-y-3 px-4 pb-4">
          {cart.length === 0 ? (
            <div className="text-slate-500 py-10 text-center">{t.empty_cart}</div>
          ) : (
            <div className="space-y-3">
              {cart.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-center border rounded-xl p-3">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-16 h-16 rounded object-cover"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-slate-500">
                      {item.size} • {item.turnaround} • {item.personalization}
                    </div>
                    <div className="text-sm font-semibold">{currency(item.price)}</div>
                  </div>

                  {/* Sterowanie ilością: jeśli podasz updateQty, pokażemy +/-; w przeciwnym razie tylko ilość */}
                  <div className="flex items-center gap-2">
                    {typeof updateQty === "function" ? (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQty(idx, -1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-6 text-center text-sm">{item.qty}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQty(idx, 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <span className="text-sm">x {item.qty}</span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromCart(idx)}
                      aria-label={`Usuń ${item.title} z koszyka`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between font-semibold text-lg pt-2 border-t">
                <span>{t.subtotal}</span>
                <span>{currency(subtotal)}</span>
              </div>

              <a href="#order">
                <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0">
                  {t.checkout}
                </Button>
              </a>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                {t.continue_shopping}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

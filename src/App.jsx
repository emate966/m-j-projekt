import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Star,
  Sparkles,
  Info,
  CheckCircle2,
  CreditCard,
  Image as ImageIcon,
} from "lucide-react";

import Button from "./components/ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card.jsx";
import { Badge } from "./components/ui/badge.jsx";
import { Input } from "./components/ui/input.jsx";
import { Textarea } from "./components/ui/textarea.jsx";
import { Label } from "./components/ui/label.jsx";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./components/ui/sheet.jsx";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./components/ui/select.jsx";

// ==================================
// CONFIG
// ==================================
const BRAND = {
  name: "TwojaPodobizna.pl",
  tagline: "Twoja figurka z podobieństwem – unikatowy prezent",
  phone: "+48 600 000 000",
  email: "kontakt@minity.pl",
  address: "ul. Przykładowa 1, 00-000 Warszawa",
  primary: "from-cyan-500 to-blue-600",
};

const DEFAULT_IMAGES = [
  "https://placehold.co/600x800/png?text=Figurka+1",
  "https://placehold.co/600x800/png?text=Figurka+2",
  "https://placehold.co/600x800/png?text=Figurka+3",
  "https://placehold.co/600x800/png?text=Figurka+4",
];

const PRODUCTS = [
  {
    id: "mini",
    name: "Pakiet MINI",
    price: 199,
    oldPrice: 249,
    rating: 4.7,
    short: "15 cm, uproszczone detale – świetne na start",
    features: ["Wysokość ~15 cm", "1 osoba", "Podstawowe podobieństwo twarzy", "Czas realizacji 7–10 dni"],
    image: DEFAULT_IMAGES[0],
  },
  {
    id: "standard",
    name: "Pakiet STANDARD",
    price: 349,
    oldPrice: 399,
    rating: 4.9,
    short: "20 cm, bardziej dopracowane detale, bestseller",
    features: ["Wysokość ~20 cm", "1–2 osoby", "Dokładniejsze rysy twarzy", "Czas realizacji 5–7 dni"],
    image: DEFAULT_IMAGES[1],
    bestseller: true,
  },
  {
    id: "premium",
    name: "Pakiet PREMIUM",
    price: 599,
    oldPrice: 699,
    rating: 5.0,
    short: "25 cm, najwyższa jakość + personalizacja stroju i pozy",
    features: ["Wysokość ~25 cm", "Do 2 osób + zwierzak", "Pełna personalizacja", "Priorytet: 3–5 dni"],
    image: DEFAULT_IMAGES[2],
  },
];

const TRANSLATIONS = {
  pl: {
    hero_cta: "Zamów figurkę",
    how_title: "Jak to działa",
    how_steps: [
      "Wybierz pakiet i dodaj do koszyka",
      "Prześlij zdjęcia i opis (strój, poza, dodatki)",
      "Zatwierdź wizualizację, a my tworzymy figurkę",
      "Odbierz przesyłkę i uśmiech :)",
    ],
    gallery: "Inspiracje i realizacje",
    offer: "Wybierz pakiet",
    add_to_cart: "Dodaj do koszyka",
    qty: "Ilość",
    upload_ref: "Zdjęcia referencyjne (max 5)",
    notes: "Dodatkowe informacje",
    cart: "Koszyk",
    empty_cart: "Twój koszyk jest pusty",
    subtotal: "Suma",
    checkout: "Złóż zamówienie",
    customer_data: "Dane do zamówienia",
    name: "Imię i nazwisko",
    email: "E-mail",
    phone: "Telefon",
    address: "Adres dostawy",
    pay_info: "Po złożeniu zamówienia otrzymasz e-mail z linkiem do wizualizacji i płatności online.",
    language: "Język",
    size: "Rozmiar",
    turnaround: "Czas realizacji",
    personalization: "Personalizacja",
    continue_shopping: "Kontynuuj zakupy",
    success: "Dziękujemy! Twoje zamówienie zostało zarejestrowane.",
  },
};

// ==================================
// Helpers
// ==================================
const currency = (n) =>
  new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(n);

// ==================================
// MAIN APP
// ==================================
export default function App() {
  const [lang] = useState("pl");
  const t = TRANSLATIONS[lang];

  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);

  function addToCart(product) {
    setCart((prev) => [...prev, product]);
    setCartOpen(true);
  }

  function removeFromCart(idx) {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateQty(idx, delta) {
    setCart((prev) =>
      prev.map((it, i) =>
        i === idx ? { ...it, qty: Math.max(1, it.qty + delta) } : it
      )
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-800">
      <Header t={t} onOpenCart={() => setCartOpen(true)} />
      <main className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
        <Hero t={t} />
        <Offer t={t} onAdd={(item) => addToCart(item)} />
        <HowItWorks t={t} />
        <Gallery t={t} />
        <OrderForm t={t} />
      </main>
      <Footer />
      <Cart
        t={t}
        cart={cart}
        subtotal={subtotal}
        removeFromCart={removeFromCart}
        updateQty={updateQty}
        open={cartOpen}
        setOpen={setCartOpen}
      />
    </div>
  );
}

// ==================================
// SUBCOMPONENTS
// ==================================
function Header({ t, onOpenCart }) {
  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <h1 className="font-bold">{BRAND.name}</h1>
        <Button variant="outline" className="gap-2" onClick={onOpenCart}>
          <ShoppingCart className="w-4 h-4" /> {t.cart}
        </Button>
      </div>
    </header>
  );
}

function Hero({ t }) {
  return (
    <section className="py-12 md:py-16">
      <motion.h1 className="text-3xl md:text-4xl font-bold">{BRAND.tagline}</motion.h1>
      <p className="mt-4 text-lg text-slate-600">
        Figurki tworzone na podstawie zdjęć ! Tworzymy figurkę całego ciała lub tylko głowę a ciało wybierasz Ty !
      </p>
      <a href="#offer">
        <Button className={`mt-6 bg-gradient-to-r ${BRAND.primary} text-white`}>
          {t.hero_cta}
        </Button>
      </a>
    </section>
  );
}

function Offer({ t, onAdd }) {
  return (
    <section id="offer" className="py-10">
      <h2 className="text-2xl font-bold mb-6">{t.offer}</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {PRODUCTS.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle>{p.name}</CardTitle>
              <Badge><Star className="w-4 h-4" /> {p.rating}</Badge>
            </CardHeader>
            <CardContent>
              <img src={p.image} alt={p.name} className="rounded-xl w-full h-56 object-cover mb-4" />
              <ul className="text-sm text-slate-700 mb-4 list-disc pl-5">
                {p.features.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl font-extrabold">{currency(p.price)}</div>
                  <div className="text-xs line-through text-slate-400">{currency(p.oldPrice)}</div>
                </div>
                <Button
                  onClick={() =>
                    onAdd({ id: p.id, title: p.name, price: p.price, qty: 1, image: p.image })
                  }
                  className={`bg-gradient-to-r ${BRAND.primary} text-white`}
                >
                  {t.add_to_cart}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function HowItWorks({ t }) {
  return (
    <section className="py-12">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Sparkles className="w-6 h-6" /> {t.how_title}</h2>
      <div className="grid md:grid-cols-4 gap-4">
        {t.how_steps.map((step, i) => (
          <Card key={i}><CardContent className="p-5">{step}</CardContent></Card>
        ))}
      </div>
    </section>
  );
}

function Gallery({ t }) {
  return (
    <section className="py-12">
      <h2 className="text-2xl font-bold mb-6">{t.gallery}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {DEFAULT_IMAGES.map((src, i) => (
          <img key={i} src={src} alt="" className="rounded-2xl w-full h-64 object-cover shadow" />
        ))}
      </div>
    </section>
  );
}

function OrderForm({ t }) {
  return (
    <section id="order" className="py-12">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><ImageIcon className="w-6 h-6"/> {t.customer_data}</h2>
      <form className="grid md:grid-cols-2 gap-6">
        <Card><CardContent className="p-5 space-y-4">
          <div>
            <Label>{t.name}</Label>
            <Input required />
          </div>
          <div>
            <Label>{t.email}</Label>
            <Input type="email" required />
          </div>
          <div>
            <Label>{t.address}</Label>
            <Textarea required />
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Podgląd przed produkcją</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Darmowa dostawa</div>
        </CardContent></Card>
        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" className={`bg-gradient-to-r ${BRAND.primary} text-white`}>
            <CreditCard className="w-4 h-4 mr-2"/> {t.checkout}
          </Button>
        </div>
      </form>
    </section>
  );
}

function Cart({ t, cart, subtotal, removeFromCart, updateQty, open, setOpen }) {
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="p-0 w-full sm:!max-w-[400px] md:!max-w-[420px]">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2"><ShoppingCart className="w-5 h-5"/> {t.cart}</SheetTitle>
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
                  <img src={item.image} alt={item.title} className="w-16 h-16 rounded object-cover" />
                  <div className="flex-1">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm font-semibold">{currency(item.price)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => updateQty(idx, -1)}><Minus className="w-4 h-4" /></Button>
                    <span className="w-6 text-center text-sm">{item.qty}</span>
                    <Button variant="outline" size="icon" onClick={() => updateQty(idx, 1)}><Plus className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => removeFromCart(idx)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between font-semibold text-lg pt-2 border-t">
                <span>{t.subtotal}</span>
                <span>{currency(subtotal)}</span>
              </div>
              <Button className={`w-full bg-gradient-to-r ${BRAND.primary} text-white`}>{t.checkout}</Button>
              <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>{t.continue_shopping}</Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="text-sm text-slate-600">© {new Date().getFullYear()} {BRAND.name}</div>
        <div className="text-sm text-slate-600 flex items-center gap-4">
          <a href={`mailto:${BRAND.email}`} className="underline">{BRAND.email}</a>
          <span>{BRAND.phone}</span>
          <span>{BRAND.address}</span>
        </div>
      </div>
    </footer>
  );
}

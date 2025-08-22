import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Star,
  Sparkles,
  CheckCircle2,
  CreditCard,
  Image as ImageIcon,
  ChevronDown,
} from "lucide-react";

import Button from "./components/ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card.jsx";
import { Badge } from "./components/ui/badge.jsx";
import { Input } from "./components/ui/input.jsx";
import { Textarea } from "./components/ui/textarea.jsx";
import { Label } from "./components/ui/label.jsx";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./components/ui/sheet.jsx";
// import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./components/ui/select.jsx";

// ==================================
// CONFIG
// ==================================
const BRAND = {
  name: "TwojaPodobizna.pl",
  tagline: "Figurka z podobieństwem – Pomysł na unikatowy prezent",
  phone: "+48 600 000 000",
  email: "kontakt@minity.pl",
  address: "ul. Przykładowa 1, 00-000 Warszawa",
  primary: "from-cyan-500 to-blue-600",
};

const DEFAULT_IMAGES = [
  "https://placehold.co/600x800/png?text=Figurka+1",
  "https://placehold.co/600x800/png?text=Figurka+2",
  "https://placehold.co/600x800/png?text=Figurka+3",
  "https://placehold.co/1200x1400/png?text=Realizacja",
];

// Główne zdjęcie hero (po prawej) – możesz podmienić na realną realizację
const HERO_IMAGE = DEFAULT_IMAGES[3];

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
        {/* HERO: LEWY TEKST + PRAWA FOTKA REALIZACJI */}
        <Hero t={t} />

        {/* SEK CJA PAKIETÓW CELowo niżej – duży odstęp */}
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
    <section className="py-10 md:py-16 lg:py-20">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Lewa kolumna: nagłówek + opis */}
        <div className="max-w-xl">
       <motion.h1
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
  className="text-3xl md:text-5xl font-bold tracking-tight"
>
  {BRAND.tagline}
</motion.h1>

<h2 className="mt-6 md:mt-8 text-xl md:text-2xl font-semibold">
  Wyślij nam kilka zdjęć i gotowe!
</h2>

<p className="mt-3 md:mt-4 text-lg md:text-xl text-slate-600">
  Stworzymy figurkę całego ciała lub podmienimy głowę z wybranym przez Ciebie modelem!
</p>

 <a href="#offer" className="group inline-flex items-center gap-3 mt-12 md:mt-16 ml-12 md:ml-24">
   <span className="sr-only">Przewiń do sekcji ofert</span>
   <span className="w-12 h-12 md:w-14 md:h-14 rounded-full border border-slate-300 flex items-center justify-center transition-transform group-hover:translate-y-1">
<ChevronDown className="w-6 h-6 md:w-7 md:h-7" />
</span>
 <span className="text-slate-600 text-base md:text-lg">Przewiń w dół</span>
 </a>



</div>

        {/* Prawa kolumna: zdjęcie realizacji */}
        <div className="relative">
          <div className="rounded-2xl overflow-hidden border bg-white shadow-sm">
            <img
              src={HERO_IMAGE}
              alt="Przykładowa realizacja figurki – TwojaPodobizna.pl"
              className="w-full h-[360px] md:h-[520px] object-cover"
            />
          </div>
          <div className="absolute bottom-3 right-3 text-xs bg-white/80 backdrop-blur px-3 py-1.5 rounded-full border">
            Realizacja klienta
          </div>
        </div>
      </div>
    </section>
  );
}

function Offer({ t, onAdd }) {
  return (
    <section id="offer" className="pt-0 mt-10 md:mt-20 lg:mt-28 pb-10">
      <h2 className="text-2xl font-bold mb-6">{t.offer}</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {PRODUCTS.map((p) => (
          <ProductCard key={p.id} p={p} t={t} onAdd={onAdd} />
        ))}
      </div>
    </section>
  );
}
function ProductCard({ p, t, onAdd }) {
  const isPremium = p.id === "premium";

  // wybory klienta
  const [sizeCm, setSizeCm] = useState("15");  // 15 / 18 / 23
  const [persons, setPersons] = useState(3);   // premium: 3..10
  const [bobble, setBobble] = useState(false); // Kiwająca głowa
  const [qty, setQty] = useState(1);

  // dopłaty
  const sizeSurcharge = sizeCm === "18" ? 40 : sizeCm === "23" ? 80 : 0;
  const basePrice = isPremium ? 550 : p.price;
  const personsSurcharge = isPremium ? Math.max(0, persons - 3) * 150 : 0;
  const bobbleSurcharge = bobble ? 50 : 0;

  // ceny
  const dynamicPrice = basePrice + sizeSurcharge + personsSurcharge + bobbleSurcharge; // za 1 szt.
  const totalPrice = dynamicPrice * qty; // za pozycję (szt. × ilość)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{p.name}</span>
          <Badge className="flex items-center gap-1">
            <Star className="w-4 h-4" /> {p.rating}
          </Badge>
        </CardTitle>
      </CardHeader>

  <CardContent className="flex h-full flex-col pb-5">
        <img src={p.image} alt={p.name} className="rounded-xl w-full h-56 object-cover mb-4" />

        {/* WYBÓR OPCJI */}
        <div className="space-y-3 mb-4">
          {/* Rozmiar – natywny select */}
          <div>
            <Label className="text-xs">{t.size}</Label>
            <select
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              value={sizeCm}
              onChange={(e) => setSizeCm(e.target.value)}
            >
              <option value="15">15 cm (cena podstawowa)</option>
              <option value="18">18 cm (+40 zł)</option>
              <option value="23">23 cm (+80 zł)</option>
            </select>
          </div>

          {/* Liczba osób – tylko Premium */}
          {isPremium ? (
            <div>
              <Label className="text-xs">Liczba osób</Label>
              <select
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                value={String(persons)}
                onChange={(e) => setPersons(Number(e.target.value))}
              >
                {[3,4,5,6,7,8,9,10].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <div className="text-xs text-slate-500 mt-1">
                3 osoby = 550 zł, każda następna +150 zł
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-600">
              Osoby: {p.id === "mini" ? "1" : "2"}
            </div>
          )}

          {/* Kiwająca głowa */}
          <label className="flex items-center gap-2 text-sm select-none">
            <input
              type="checkbox"
              className="size-4 accent-blue-600"
              checked={bobble}
              onChange={(e) => setBobble(e.target.checked)}
            />
            <span>Kiwająca głowa (+50 zł)</span>
          </label>

          {/* Czas realizacji */}
          <div className="text-sm text-slate-600">Czas realizacji: 3–5 dni roboczych</div>

          {/* Ilość */}
          <div className="flex items-center gap-2">
            <Label className="text-xs">{t.qty}</Label>
            <Button variant="outline" size="icon" onClick={() => setQty(Math.max(1, qty - 1))}>
              <Minus className="w-4 h-4" />
            </Button>
            <span className="w-6 text-center text-sm">{qty}</span>
            <Button variant="outline" size="icon" onClick={() => setQty(qty + 1)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* CENA + DODAJ */}
          <div className="mt-auto mb-2 flex items-end justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            {/* łączna cena pozycji */}
            <div className="text-2xl font-extrabold">{currency(totalPrice)}</div>
            {/* cena jednostkowa */}
            <div className="text-xs text-slate-500">{currency(dynamicPrice)} / szt.</div>

            {!isPremium && p.oldPrice && (
              <div className="text-xs line-through text-slate-400">{currency(p.oldPrice)}</div>
            )}
          </div>

          <Button
            className={`shrink-0 whitespace-nowrap h-10 px-4 bg-gradient-to-r ${BRAND.primary} text-white`}
            onClick={() =>
              onAdd({
                id: p.id,
                title: p.name,
                price: dynamicPrice, // cena za sztukę
                qty,
                image: p.image,
                options: {
                  sizeCm,
                  ...(isPremium ? { persons } : { persons: p.id === "mini" ? 1 : 2 }),
                  bobble,
                },
              })
            }
          >
            {t.add_to_cart}
          </Button>
        </div>
      </CardContent>
    </Card>
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
                    <div className="text-sm font-semibold">
                      {currency(item.price * item.qty)}   {/* cena pozycji */}
                    </div>
                    <div className="text-xs text-slate-500">
                      {currency(item.price)} / szt.       {/* informacyjnie: cena za sztukę */}
                    </div>
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

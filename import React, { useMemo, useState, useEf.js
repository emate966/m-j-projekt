import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Package2, Sparkles, Upload, CheckCircle2, Trash2, Plus, Minus, Star, Languages, Menu, CreditCard, Image as ImageIcon, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

// ================================
// CONFIG (łatwe do edycji)
// ================================
const BRAND = {
  name: "MiniTy",
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
    notes: "Dodatkowe informacje (np. preferencje: strój, poza, rekwizyty)",
    cart: "Koszyk",
    empty_cart: "Twój koszyk jest pusty",
    subtotal: "Suma",
    checkout: "Złóż zamówienie",
    customer_data: "Dane do zamówienia",
    name: "Imię i nazwisko",
    email: "E-mail",
    phone: "Telefon",
    address: "Adres dostawy",
    pay_later: "Zamów z płatnością po akceptacji wizualizacji",
    pay_info:
      "Po złożeniu zamówienia otrzymasz e-mail z linkiem do wizualizacji i płatności online (Stripe/Przelewy24).",
    language: "Język",
    size: "Rozmiar",
    turnaround: "Czas realizacji",
    personalization: "Personalizacja",
    remove: "Usuń",
    continue_shopping: "Kontynuuj zakupy",
    success: "Dziękujemy! Twoje zamówienie zostało zarejestrowane.",
  },
  en: {
    hero_cta: "Order your figurine",
    how_title: "How it works",
    how_steps: [
      "Choose a package and add to cart",
      "Upload photos and notes (outfit, pose, extras)",
      "Approve preview, we craft your figurine",
      "Receive your parcel and smile :)",
    ],
    gallery: "Inspiration & examples",
    offer: "Choose a package",
    add_to_cart: "Add to cart",
    qty: "Qty",
    upload_ref: "Reference photos (max 5)",
    notes: "Additional notes (outfit, pose, props)",
    cart: "Cart",
    empty_cart: "Your cart is empty",
    subtotal: "Subtotal",
    checkout: "Checkout",
    customer_data: "Customer details",
    name: "Full name",
    email: "Email",
    phone: "Phone",
    address: "Shipping address",
    pay_later: "Order with payment after preview approval",
    pay_info:
      "After placing the order you'll get an email with a preview link and online payment (Stripe).",
    language: "Language",
    size: "Size",
    turnaround: "Turnaround",
    personalization: "Personalization",
    remove: "Remove",
    continue_shopping: "Continue shopping",
    success: "Thank you! Your order has been recorded.",
  },
};

// ================================
// Helpers
// ================================
const currency = (n) => new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(n);

function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, [key, value]);
  return [value, setValue];
}

// ================================
// Main App
// ================================
export default function MiniTyStore() {
  const [lang, setLang] = useLocalStorage("minity.lang", "pl");
  const t = TRANSLATIONS[lang];
  const [cart, setCart] = useLocalStorage("minity.cart", []);
  const [files, setFiles] = useState([]);
  const [notes, setNotes] = useLocalStorage("minity.notes", "");
  const [order, setOrder] = useLocalStorage("minity.order", {
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [success, setSuccess] = useState(false);

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);

  function addToCart(product) {
    setCart((prev) => {
      const exists = prev.find((p) => p.id === product.id && p.size === product.size && p.turnaround === product.turnaround && p.personalization === product.personalization);
      if (exists) {
        return prev.map((p) => p === exists ? { ...p, qty: p.qty + product.qty } : p);
      }
      return [...prev, product];
    });
  }

  function removeFromCart(idx) {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  }

  function clearCart() {
    setCart([]);
    setFiles([]);
    setNotes("");
  }

  function onUpload(e) {
    const list = Array.from(e.target.files || []);
    const limited = [...files, ...list].slice(0, 5);
    setFiles(limited);
  }

  function handleCheckout(e) {
    e.preventDefault();
    // W prawdziwym wdrożeniu zapis do bazy + wysyłka maila + link do płatności (Stripe/Przelewy24).
    const payload = {
      brand: BRAND,
      lang,
      cart,
      files: files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
      notes,
      order,
      timestamp: new Date().toISOString(),
    };
    try {
      console.log("ORDER", payload);
      // Symulacja sukcesu
      setSuccess(true);
      clearCart();
    } catch (e) {
      alert("Wystąpił błąd. Spróbuj ponownie.");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-800">
      <Header lang={lang} setLang={setLang} t={t} />
      <main className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
        <Hero t={t} />
        <Offer t={t} onAdd={(item) => addToCart(item)} />
        <HowItWorks t={t} />
        <Gallery t={t} />
        <OrderForm
          t={t}
          files={files}
          onUpload={onUpload}
          notes={notes}
          setNotes={setNotes}
          order={order}
          setOrder={setOrder}
          onCheckout={handleCheckout}
          success={success}
        />
      </main>
      <Footer />
      <Cart t={t} cart={cart} subtotal={subtotal} removeFromCart={removeFromCart} />
    </div>
  );
}

function Header({ lang, setLang, t }) {
  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package2 className="w-6 h-6" />
          <span className="font-bold">{BRAND.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Select value={lang} onValueChange={setLang}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pl">🇵🇱 {TRANSLATIONS.pl.language}</SelectItem>
              <SelectItem value="en">🇬🇧 {TRANSLATIONS.en.language}</SelectItem>
            </SelectContent>
          </Select>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2"><ShoppingCart className="w-4 h-4" /> {t.cart}</Button>
            </SheetTrigger>
            {/* Placeholder to trigger cart from header (actual cart is a portal at the end) */}
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function Hero({ t }) {
  return (
    <section className="py-12 md:py-16">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-extrabold tracking-tight">
            {BRAND.tagline}
          </motion.h1>
          <p className="mt-4 text-lg text-slate-600">
            Figurki tworzone na podstawie Twoich zdjęć. Idealne na urodziny, rocznice i wyjątkowe okazje.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a href="#offer">
              <Button size="lg" className={`shadow-lg bg-gradient-to-r ${BRAND.primary} text-white border-0`}>{t.hero_cta}</Button>
            </a>
            <Badge variant="secondary" className="px-3 py-2 text-sm flex items-center gap-1"><Star className="w-4 h-4"/> 4.9/5 na bazie 500+ realizacji</Badge>
          </div>
          <div className="mt-6 text-sm text-slate-500 flex items-center gap-2">
            <Info className="w-4 h-4"/> Wysyłka w całej Polsce. Darmowa od 299 zł.
          </div>
        </div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative">
          <img src={DEFAULT_IMAGES[3]} alt="Przykładowa figurka" className="rounded-2xl shadow-xl w-full object-cover"/>
          <Badge className="absolute top-3 left-3 bg-white/90 text-slate-900 shadow">3D • Handmade • Premium</Badge>
        </motion.div>
      </div>
    </section>
  );
}

function Offer({ t, onAdd }) {
  const [size, setSize] = useState("standard");
  const [turnaround, setTurnaround] = useState("normal");
  const [personalization, setPersonalization] = useState("basic");

  return (
    <section id="offer" className="py-10">
      <h2 className="text-2xl md:text-3xl font-bold mb-6">{t.offer}</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {PRODUCTS.map((p) => (
          <Card key={p.id} className="rounded-2xl shadow-sm border-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  {p.bestseller && <Badge className="bg-amber-500">Bestseller</Badge>}
                  {p.name}
                </CardTitle>
                <Badge variant="secondary" className="flex items-center gap-1"><Star className="w-4 h-4" /> {p.rating}</Badge>
              </div>
              <p className="text-slate-600">{p.short}</p>
            </CardHeader>
            <CardContent>
              <img src={p.image} alt={p.name} className="rounded-xl w-full h-56 object-cover mb-4" />
              <ul className="space-y-1 text-sm text-slate-700 mb-4 list-disc pl-5">
                {p.features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div>
                  <Label className="text-xs">{t.size}</Label>
                  <Select value={size} onValueChange={setSize}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mini">~15 cm</SelectItem>
                      <SelectItem value="standard">~20 cm</SelectItem>
                      <SelectItem value="premium">~25 cm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">{t.turnaround}</Label>
                  <Select value={turnaround} onValueChange={setTurnaround}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">5–7 dni</SelectItem>
                      <SelectItem value="express">48–72h (+99 zł)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">{t.personalization}</Label>
                  <Select value={personalization} onValueChange={setPersonalization}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Standard</SelectItem>
                      <SelectItem value="custom">Stroje/pozy niestandardowe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl font-extrabold">{currency(p.price)}</div>
                  <div className="text-xs line-through text-slate-400">{currency(p.oldPrice)}</div>
                </div>
                <AddToCartButton
                  label={t.add_to_cart}
                  onClick={() =>
                    onAdd({
                      id: p.id,
                      title: p.name,
                      price: p.price + (turnaround === "express" ? 99 : 0) + (personalization === "custom" ? 79 : 0),
                      qty: 1,
                      size,
                      turnaround,
                      personalization,
                      image: p.image,
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function AddToCartButton({ onClick, label }) {
  return (
    <Button onClick={onClick} className={`bg-gradient-to-r ${BRAND.primary} text-white border-0 shadow-lg flex items-center gap-2`}>
      <Plus className="w-4 h-4" /> {label}
    </Button>
  );
}

function HowItWorks({ t }) {
  return (
    <section className="py-12">
      <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2"><Sparkles className="w-6 h-6" /> {t.how_title}</h2>
      <div className="grid md:grid-cols-4 gap-4">
        {t.how_steps.map((step, i) => (
          <Card key={i} className="rounded-2xl">
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold mb-3">{i + 1}</div>
              <p className="text-slate-700">{step}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function Gallery({ t }) {
  return (
    <section className="py-12">
      <h2 className="text-2xl md:text-3xl font-bold mb-6">{t.gallery}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {DEFAULT_IMAGES.map((src, i) => (
          <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <img src={src} alt={`Figurka ${i + 1}`} className="rounded-2xl w-full h-64 object-cover shadow" />
          </motion.div>
        ))}
      </div>
      <p className="text-sm text-slate-500 mt-3">Zdjęcia poglądowe. Po złożeniu zamówienia przygotujemy wizualizację do akceptacji.</p>
    </section>
  );
}

function OrderForm({ t, files, onUpload, notes, setNotes, order, setOrder, onCheckout, success }) {
  return (
    <section className="py-12">
      <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2"><ImageIcon className="w-6 h-6"/> {t.customer_data}</h2>
      {success && (
        <div className="mb-6 p-4 border rounded-xl bg-green-50 text-green-700 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5"/> {t.success}
        </div>
      )}
      <form onSubmit={onCheckout} className="grid md:grid-cols-2 gap-6">
        <Card className="rounded-2xl">
          <CardContent className="p-5 space-y-4">
            <div>
              <Label>{t.name}</Label>
              <Input required value={order.name} onChange={(e) => setOrder({ ...order, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t.email}</Label>
                <Input type="email" required value={order.email} onChange={(e) => setOrder({ ...order, email: e.target.value })} />
              </div>
              <div>
                <Label>{t.phone}</Label>
                <Input value={order.phone} onChange={(e) => setOrder({ ...order, phone: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>{t.address}</Label>
              <Textarea required value={order.address} onChange={(e) => setOrder({ ...order, address: e.target.value })} />
            </div>
            <div>
              <Label>{t.notes}</Label>
              <Textarea placeholder="np. garnitur, poza superbohatera, dodaj psa" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div>
              <Label>{t.upload_ref}</Label>
              <Input type="file" accept="image/*" multiple onChange={onUpload} />
              <p className="text-xs text-slate-500 mt-1">Akceptujemy JPG/PNG, do 10MB/szt., maksymalnie 5 zdjęć.</p>
              {files?.length > 0 && (
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {files.map((f, i) => (
                    <div key={i} className="text-xs p-2 border rounded-lg bg-white">{f.name}</div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <SummaryCard t={t} />

        <div className="md:col-span-2 flex items-center justify-between">
          <p className="text-sm text-slate-500 max-w-xl">{t.pay_info}</p>
          <Button type="submit" size="lg" className={`bg-gradient-to-r ${BRAND.primary} text-white border-0`}>
            <CreditCard className="w-4 h-4 mr-2"/> {t.checkout}
          </Button>
        </div>
      </form>
    </section>
  );
}

function SummaryCard({ t }) {
  // Placeholder z benefitami i polityką.
  return (
    <Card className="rounded-2xl h-full">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> 100% satysfakcji lub poprawki gratis</div>
        <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Darmowa dostawa od 299 zł</div>
        <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Podgląd przed produkcją</div>
        <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Ręczne wykończenie premium</div>
      </CardContent>
    </Card>
  );
}

function Cart({ t, cart, subtotal, removeFromCart }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    // Otwórz koszyk, gdy coś dodano
    if (cart.length > 0) setOpen(true);
  }, [cart.length]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="hidden" aria-hidden />
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><ShoppingCart className="w-5 h-5"/> {t.cart}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-slate-500 py-10 text-center">{t.empty_cart}</div>
          ) : (
            <div className="space-y-3">
              {cart.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-center border rounded-xl p-3">
                  <img src={item.image} alt={item.title} className="w-16 h-16 rounded object-cover" />
                  <div className="flex-1">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-slate-500">{item.size} • {item.turnaround} • {item.personalization}</div>
                    <div className="text-sm font-semibold">{currency(item.price)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">x {item.qty}</span>
                    <Button variant="ghost" size="icon" onClick={() => removeFromCart(idx)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between font-semibold text-lg pt-2 border-t">
                <span>{t.subtotal}</span>
                <span>{currency(subtotal)}</span>
              </div>
              <a href="#order">
                <Button className={`w-full bg-gradient-to-r ${BRAND.primary} text-white border-0`}>{t.checkout}</Button>
              </a>
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
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="text-sm text-slate-600">
          © {new Date().getFullYear()} {BRAND.name}. Wszystkie prawa zastrzeżone.
        </div>
        <div className="text-sm text-slate-600 flex items-center gap-4">
          <a href={`mailto:${BRAND.email}`} className="underline">{BRAND.email}</a>
          <span>{BRAND.phone}</span>
          <span>{BRAND.address}</span>
        </div>
      </div>
    </footer>
  );
}

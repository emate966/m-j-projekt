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
  Phone,
  Mail
} from "lucide-react";

import FAQSection from "./FAQSection.jsx";
import Button from "./components/ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card.jsx";
import { Badge } from "./components/ui/badge.jsx";
import { Input } from "./components/ui/input.jsx";
import { Textarea } from "./components/ui/textarea.jsx";
import { Label } from "./components/ui/label.jsx";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./components/ui/sheet.jsx";

// Ujednolicone źródło API
const API_BASE =
  import.meta.env.VITE_API_URL ??
  import.meta.env.VITE_API ??
  "http://localhost:8000";

// ==================================
// CONFIG
// ==================================
const BRAND = {
  name: "TwojaPodobizna.pl",
  tagline: "Figurka z podobieństwem – Pomysł na unikatowy prezent",
  phone: "+48 733 456 474",
  email: "emate966@gmail.com",
  address: "ul. Armii Krajowej 6, 42-690 Boruszowice",
  primary: "from-cyan-500 to-blue-600",
};

const DEFAULT_IMAGES = [
  "https://placehold.co/600x800/png?text=Figurka+1",
  "https://placehold.co/600x800/png?text=Figurka+2",
  "https://placehold.co/600x800/png?text=Figurka+3",
  "https://placehold.co/1200x1400/png?text=Realizacja",
];

// Główne zdjęcie hero (po prawej)
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

// MODELE – lista produktowa 5 w rzędzie (na dużych ekranach)
const MODELS = Array.from({ length: 15 }).map((_, i) => ({
  id: `model-${i + 1}`,
  name: `Model #${i + 1}`,
  image: `https://placehold.co/600x800/png?text=Model+${i + 1}`,
  rating: (4 + (i % 10) / 10).toFixed(1),
}));

// TEMATY – przykładowe kategorie
const THEMES = [
  { key: "dzien-dziadka", title: "Dzień Dziadka" },
  { key: "slub", title: "Ślub" },
  { key: "urodziny", title: "Urodziny" },
  { key: "sport", title: "Sport" },
  { key: "zawody", title: "Zawody / Praca" },
];

const TRANSLATIONS = {
  pl: {
    hero_cta: "Zamów figurkę",
    how_title: "Jak to działa",
    how_steps: [
      "Wybierz pakiet i dodaj do koszyka",
      "Prześlij zdjęcia i opis (model, dodatki)",
      "Dostaniesz darmową wizualizację. Płacisz dopiero po akceptacji.",
      "Odbierz przesyłkę i uśmiech :)",
    ],
    gallery: "Inspiracje i realizacje",
    offer: "Wybierz pakiet",
    add_to_cart: "Dodaj do koszyka",
    qty: "Ilość",
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
    pay_info: "Po złożeniu zamówienia otrzymasz e-mail z linkiem do wizualizacji. Zwykle trwa to 2 dni robocze",
    language: "Język",
    size: "Rozmiar",
    turnaround: "Czas realizacji",
    personalization: "Personalizacja",
    continue_shopping: "Kontynuuj zakupy",
    success: "Dziękujemy! Twoje zamówienie zostało zarejestrowane.",
    nav_gallery: "Galeria",
    nav_models: "Modele",
    nav_themes: "Tematycznie",
    nav_contact: "Kontakt",
    nav_faq: "FAQ", // ⬅️ nowa etykieta
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

  // Trwały koszyk
  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem("cart");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [cartOpen, setCartOpen] = useState(false);
  const [page, setPage] = useState("home"); // "home" | "gallery" | "models" | "themes" | "faq"

  // zapisz koszyk przy każdej zmianie
  React.useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch (e) {
      console.error("Błąd zapisu koszyka:", e);
    }
  }, [cart]);

  // na wszelki wypadek – zsynchronizuj po starcie
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("cart");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setCart(parsed);
      }
    } catch (e) {
      console.error("Błąd odczytu koszyka:", e);
    }
  }, []);

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

  // prosta nawigacja SPA – bez routera
  function navigate(to) {
    setPage(to);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-800">
      <Header t={t} onOpenCart={() => setCartOpen(true)} navigate={navigate} page={page} />

      <main className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
        {page === "home" && (
          <>
            <Hero t={t} />
            <HowItWorks t={t} />
            <Offer t={t} onAdd={(item) => addToCart(item)} />
            <Gallery t={t} />
            <OrderForm t={t} cart={cart} />
          </>
        )}

        {page === "gallery" && (
          <section className="py-10 md:py-14">
            <h2 className="text-3xl font-bold mb-6">{t.nav_gallery}</h2>
            <Gallery t={t} />
          </section>
        )}

        {page === "models" && (
          <ModelsPage
            t={t}
            onPick={(model) => {
              console.log("Wybrano model:", model);
            }}
          />
        )}

        {page === "themes" && <ThemesPage />}

        {page === "faq" && (
          <section className="py-10 md:py-14">
            <FAQSection />
          </section>
        )}
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
function Header({ t, onOpenCart, navigate, page }) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
        {/* Logo + kontakt */}
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => navigate("home")}
            className="font-bold tracking-tight hover:opacity-80 text-lg md:text-xl lg:text-2xl whitespace-nowrap"
            aria-label="Przejdź na stronę główną"
          >
            {BRAND.name}
          </button>
          <div className="hidden md:flex items-center gap-4 text-sm text-slate-600">
            <a href={`tel:${BRAND.phone.replace(/\s/g, "")}`} className="flex items-center gap-1 hover:text-slate-800">
              <Phone className="w-4 h-4" /> {BRAND.phone}
            </a>
            <a href={`mailto:${BRAND.email}`} className="flex items-center gap-1 hover:text-slate-800">
              <Mail className="w-4 h-4" /> {BRAND.email}
            </a>
          </div>
        </div>

        {/* Nawigacja */}
        <nav className="flex items-center gap-2 md:gap-3">
          <NavButton active={page === "models"} onClick={() => navigate("models")}>
            <span className="text-base md:text-lg font-normal">Modele</span>
          </NavButton>

          <NavButton active={page === "themes"} onClick={() => navigate("themes")}>
            <span className="text-base md:text-lg font-normal">Inspiracje</span>
          </NavButton>

          {/* NOWE: FAQ */}
          <NavButton active={page === "faq"} onClick={() => navigate("faq")}>
            <span className="text-base md:text-lg font-normal">{t.nav_faq ?? "FAQ"}</span>
          </NavButton>

          <div className="md:hidden text-xs text-slate-600 pr-1">
            <a href={`tel:${BRAND.phone.replace(/\s/g, "")}`} className="hover:underline">{BRAND.phone}</a>
            <span className="mx-1">•</span>
            <a href={`mailto:${BRAND.email}`} className="hover:underline">{BRAND.email}</a>
          </div>

          {/* Koszyk */}
          <div className="min-w-[180px] ml-6 md:ml-8">
            <button
              type="button"
              onClick={onOpenCart}
              className={`w-full h-10 inline-flex items-center justify-center gap-2 rounded-md px-6 text-sm font-medium text-white shadow-sm
                          bg-gradient-to-r ${BRAND.primary}
                          hover:brightness-105 active:scale-[0.99]
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400`}
            >
              <ShoppingCart className="w-4 h-4" />
              {t.cart}
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}

function NavButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-3 py-1.5 rounded-full text-sm border transition",
        active ? "border-slate-900 text-slate-900" : "border-slate-300 text-slate-700 hover:border-slate-400"
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Hero({ t }) {
  return (
    <section className="py-10 md:py-16 lg:py-20">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
        <div className="max-w-xl">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-3xl md:text-5xl font-bold tracking-tight"
          >
            {BRAND.tagline}
          </motion.h1>

          <h2 className="mt-8 md:mt-10 text-xl md:text-2xl font-semibold">
            Stworzymy figurkę całego ciała lub podmienimy głowę z wybranym przez Ciebie modelem!
          </h2>

          <p className="mt-8 md:mt-12 text-lg md:text-xl text-slate-600 leading-relaxed md:leading-loose">
            Wyślij nam kilka zdjęć i gotowe!
          </p>

          <a href="#offer" className="group inline-flex items-center gap-3 mt-12 md:mt-16 ml-12 md:ml-24">
            <span className="sr-only">Przewiń do sekcji ofert</span>
            <span className="w-12 h-12 md:w-14 md:h-14 rounded-full border border-slate-300 flex items-center justify-center transition-transform group-hover:translate-y-1">
              <ChevronDown className="w-6 h-6 md:w-7 md:h-7" />
            </span>
            <span className="text-slate-600 text-base md:text-lg">Przewiń w dół</span>
          </a>
        </div>

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

  const personsCount = isPremium ? persons : (p.id === "standard" ? 2 : 1);

  const sizeSurcharge = sizeCm === "18" ? 40 : sizeCm === "23" ? 80 : 0;
  const basePrice = isPremium ? 550 : p.price;
  const personsSurcharge = isPremium ? Math.max(0, persons - 3) * 150 : 0;
  const bobbleSurcharge = bobble
    ? (p.id === "standard" || isPremium ? 50 * personsCount : 50)
    : 0;

  const dynamicPrice = basePrice + sizeSurcharge + personsSurcharge + bobbleSurcharge; // za 1 szt.
  const totalPrice = dynamicPrice * qty; // za pozycję

  return (
    <Card className="h-full">
      <CardHeader className="text-center">
        <CardTitle>{p.name}</CardTitle>
      </CardHeader>

      <CardContent className="flex h-full flex-col pb-5">
        <img src={p.image} alt={p.name} className="rounded-xl w-full h-56 object-cover mb-4" />

        {/* WYBÓR OPCJI */}
        <div className="space-y-3 mb-4">
          {/* Rozmiar */}
          <div>
            <Label className="text-xs block text-center">{t.size}</Label>
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
              <Label className="text-xs block text-center">Liczba osób</Label>
              <select
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                value={String(persons)}
                onChange={(e) => setPersons(Number(e.target.value))}
              >
                {[3,4,5,6,7,8,9,10].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <div className="text-xs text-slate-500 mt-1 text-center">
                3 osoby = 550 zł, każda następna +150 zł
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-600 text-center">
              Osoby: {p.id === "mini" ? "1" : "2"}
            </div>
          )}

          {/* Kiwająca głowa */}
          <div className="flex justify-center">
            <label className="flex items-center gap-2 text-sm select-none">
              <input
                type="checkbox"
                className="size-4 accent-blue-600"
                checked={bobble}
                onChange={(e) => setBobble(e.target.checked)}
              />
              <span>
                {p.id === "standard" || isPremium
                  ? "Kiwająca głowa (+50 zł / osoba)"
                  : "Kiwająca głowa (+50 zł)"}
              </span>
            </label>
          </div>

          <div className="text-sm text-slate-600 text-center">Czas realizacji: 3–5 dni roboczych</div>

          {/* Ilość */}
          <div className="flex items-center justify-center gap-2">
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
        <div className="mt-auto mb-2 flex flex-col items-center gap-1">
          <div className="text-2xl font-extrabold">{currency(totalPrice)}</div>
          <div className="text-xs text-slate-500">{currency(dynamicPrice)} / szt.</div>
          {!isPremium && p.oldPrice && (
            <div className="text-xs line-through text-slate-400">{currency(p.oldPrice)}</div>
          )}

          <Button
            className={`mt-2 shrink-0 whitespace-nowrap h-10 px-4 bg-gradient-to-r ${BRAND.primary} text-white`}
            onClick={() =>
              onAdd({
                id: p.id,
                title: p.name,
                price: dynamicPrice,
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
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-yellow-500" />
        {t.how_title}
      </h2>
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

function ModelsPage({ t }) {
  const [isSending, setIsSending] = React.useState(false);
  const [preview, setPreview] = React.useState(null);
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [status, setStatus] = React.useState(null); // "success" | "error" | null

  // ESC zamyka modal
  React.useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setPreview(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openPreview = (m) => setPreview(m);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);
    setIsSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Nie udało się wysłać zapytania.");
      }
      setStatus("success");
      setEmail("");
      setMessage("");
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="py-10 md:py-14">
      <h2 className="text-3xl font-bold mb-1">{t.nav_models}</h2>
      <p className="text-slate-600 mb-6">
        Wybierz bazowy model ciała – później podmienimy głowę i dopasujemy szczegóły.
      </p>

      {/* Siatka modeli */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
        {MODELS.map((m) => (
          <Card key={m.id} className="relative h-full group hover:shadow-md transition">
            <button
              type="button"
              className="absolute inset-0 z-10 cursor-pointer rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400"
              onClick={() => openPreview(m)}
              aria-label={`Obejrzyj ${m.name}`}
            />
            <CardContent className="p-3 flex flex-col">
              <img
                src={m.image}
                alt={m.name}
                className="rounded-xl w-full h-48 object-cover mb-3"
              />
              <div className="flex items-center justify-between">
                <div className="font-medium truncate">{m.name}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <Star className="w-3 h-3" /> {m.rating}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Formularz zapytania */}
      <Card className="bg-blue-50 border border-blue-200">
        <CardContent className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-center">
            {t.models_question ||
              "Nie znalazłeś/aś odpowiedniego modelu dla siebie? Napisz do Nas czego potrzebujesz."}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-3 max-w-xl mx-auto">
            <div>
              <Label>E-mail</Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jan@example.com"
              />
            </div>
            <div>
              <Label>Twoje zapytanie</Label>
              <Textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Opisz czego potrzebujesz..."
              />
            </div>
            <Button
              type="submit"
              disabled={isSending}
              className={`bg-gradient-to-r ${BRAND.primary} text-white`}
            >
              {isSending ? "Wysyłam…" : "Wyślij"}
            </Button>
          </form>

          {status === "success" && (
            <div className="text-green-700 text-sm text-center">
              Dziękujemy! Twoje zapytanie zostało wysłane.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal podglądu */}
      {preview && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-slate-500 hover:text-slate-800"
              onClick={() => setPreview(null)}
              aria-label="Zamknij podgląd"
            >
              ✕
            </button>
            <img
              src={(preview.previewImage || preview.image).replace("600x800", "1200x1600")}
              alt={preview.name}
              className="w-full max-h-[80vh] object-contain rounded-lg"
            />
            <div className="mt-3 text-center font-medium">{preview.name}</div>
          </div>
        </div>
      )}
    </section>
  );
}

function ThemesPage() {
  const THEMES_LOCAL = [
    { key: "dla-szefa", title: "Dla szefa" },
    { key: "babcia-dziadek", title: "Dzień babci i dziadka" },
    { key: "mama-tata", title: "Dzień mamy i taty" },
    { key: "dyplomowe", title: "Dyplomowe" },
    { key: "dzieci", title: "Dzieci" },
    { key: "urodzinowe", title: "Urodzinowe" },
    { key: "rocznica", title: "Na rocznicę" },
    { key: "zawodowe", title: "Zawodowe / Praca" },
    { key: "slubne", title: "Ślubne" },
    { key: "inne", title: "Inne" },
  ];

  const mkImgs = (title, n = 8) =>
    Array.from({ length: n }, (_, i) =>
      `https://placehold.co/1200x900/png?text=${encodeURIComponent(title)}+${i + 1}`
    );
  const IMAGES = Object.fromEntries(
    THEMES_LOCAL.map(t => [t.key, mkImgs(t.title)])
  );

  const [preview, setPreview] = React.useState(null); // { title, src }

  React.useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setPreview(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <section className="py-10 md:py-14">
      <h2 className="text-3xl font-bold mb-1">Inspiracje</h2>
      <p className="text-slate-600 mb-6">
        Wybierz okazję lub temat i zainspiruj się naszymi realizacjami.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {THEMES_LOCAL.map((t) => (
          <a key={t.key} href={`#theme-${t.key}`} className="block">
            <Card className="cursor-pointer hover:shadow-md transition border rounded-xl">
              <CardContent className="p-0">
                <img
                  src={`https://placehold.co/800x600/png?text=${encodeURIComponent(t.title)}`}
                  alt={t.title}
                  className="rounded-t-xl w-full h-36 object-cover"
                />
                <div className="p-3 font-medium text-center">{t.title}</div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      {THEMES_LOCAL.map((t) => (
        <div key={t.key} id={`theme-${t.key}`} className="mb-10 scroll-mt-24">
          <h3 className="text-xl font-semibold mb-3">{t.title}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {IMAGES[t.key].map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPreview({ title: `${t.title} – realizacja ${i + 1}`, src })}
                className="text-left"
                aria-label={`Powiększ: ${t.title} realizacja ${i + 1}`}
              >
                <img
                  src={src}
                  alt={`${t.title} realizacja ${i + 1}`}
                  className="rounded-xl w-full h-48 object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      ))}

      {preview && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-4xl w-[92vw] md:w-auto p-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-slate-500 hover:text-slate-800"
              onClick={() => setPreview(null)}
              aria-label="Zamknij podgląd"
            >
              ✕
            </button>
            <img
              src={preview.src}
              alt={preview.title}
              className="w-full max-h-[80vh] object-contain rounded-lg"
            />
            <div className="mt-3 text-center font-medium">{preview.title}</div>
          </div>
        </div>
      )}
    </section>
  );
}

function OrderForm({ t, cart }) {
  const [files, setFiles] = React.useState([]);
  const [previews, setPreviews] = React.useState([]);
  const [notes, setNotes] = React.useState("");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [address, setAddress] = React.useState("");

  const [filesError, setFilesError] = React.useState("");
  const [notesError, setNotesError] = React.useState("");
  const [emailError, setEmailError] = React.useState("");
  const [phoneError, setPhoneError] = React.useState("");
  const [isDragging, setIsDragging] = React.useState(false);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [serverError, setServerError] = React.useState("");
  const [serverSuccess, setServerSuccess] = React.useState("");
  const [statusUrl, setStatusUrl] = React.useState(null);

  const fileInputRef = React.useRef(null);

  // ===== Walidacje =====
  function validateFilesCount(count) {
    if (count < 1) { setFilesError("Dodaj przynajmniej 1 zdjęcie."); return false; }
    if (count > 30) { setFilesError("Możesz dodać maksymalnie 30 zdjęć."); return false; }
    setFilesError(""); return true;
  }
  function validateNotes(value) {
    const ok = value.trim().length >= 20;
    setNotesError(ok ? "" : "Opisz szczegóły — minimum 20 znaków.");
    return ok;
  }
  function validateEmail(value) {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
    setEmailError(ok ? "" : "Podaj poprawny adres e-mail."); return ok;
  }
  const digitsOnly = (s) => (s || "").replace(/\D+/g, "");
  function formatPLPhoneDisplay(raw) {
    const all = digitsOnly(raw);
    let hasCC = false, local = all;
    if (all.startsWith("0048")) { hasCC = true; local = all.slice(4); }
    else if (all.startsWith("48") && all.length >= 11) { hasCC = true; local = all.slice(2); }
    const grouped = local.slice(0, 9).replace(/(\d{3})(?=\d)/g, "$1 ").trim();
    return hasCC ? `+48 ${grouped}` : grouped;
  }
  function validatePhone(raw) {
    const all = digitsOnly(raw);
    let local = all;
    if (all.startsWith("0048")) local = all.slice(4);
    else if (all.startsWith("48") && all.length >= 11) local = all.slice(2);
    const ok = local.length === 9;
    setPhoneError(ok ? "" : "Podaj polski numer: 9 cyfr lub +48 i 9 cyfr.");
    return ok;
  }
  function handlePhoneChange(e) {
    const val = e.target.value.replace(/[^\d+ ]+/g, "");
    setPhone(formatPLPhoneDisplay(val));
  }

  // ===== Pliki =====
  const makeKey = (f) => `${f.name}|${f.size}|${f.lastModified}`;
  const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
  const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp"]);
  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

  function processFiles(incoming) {
    const existingKeys = new Set(files.map(makeKey));
    const tooLarge = [], wrongType = [];
    const filtered = [];

    for (const f of incoming) {
      const ext = (f.name.split(".").pop() || "").toLowerCase();
      const okType = ALLOWED_MIME.has(f.type) || ALLOWED_EXT.has(ext);
      const okSize = f.size <= MAX_SIZE;
      if (!okType) { wrongType.push(f.name); continue; }
      if (!okSize) { tooLarge.push(f.name); continue; }
      if (existingKeys.has(makeKey(f))) continue;
      filtered.push(f);
    }

    let next = [...files, ...filtered];
    if (next.length > 30) next = next.slice(0, 30);
    setFiles(next);

    const msgs = [];
    if (wrongType.length) msgs.push("Dozwolone typy: JPG, PNG, WEBP. Pominięte: " + wrongType.join(", "));
    if (tooLarge.length) msgs.push("Za duży plik (>10 MB): " + tooLarge.join(", "));
    setFilesError(msgs.join(" "));
    validateFilesCount(next.length);
  }

  function handleFilesChange(e) {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    processFiles(picked);
    e.target.value = "";
  }
  function removeFile(idx) {
    const next = files.filter((_, i) => i !== idx);
    setFiles(next); validateFilesCount(next.length);
  }

  // Drag & Drop
  function handleDragOver(e) { e.preventDefault(); setIsDragging(true); }
  function handleDragLeave(e) { e.preventDefault(); setIsDragging(false); }
  function handleDrop(e) { e.preventDefault(); setIsDragging(false);
    const dropped = Array.from(e.dataTransfer?.files || []); if (dropped.length) processFiles(dropped);
  }
  function handleOpenFileDialog() { fileInputRef.current?.click(); }

  // Miniatury
  React.useEffect(() => {
    const next = files.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setPreviews((prev) => { prev.forEach((p) => URL.revokeObjectURL(p.url)); return next; });
    return () => { next.forEach((p) => URL.revokeObjectURL(p.url)); };
  }, [files]);

  // ===== Submit: XHR + progress =====
  async function handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation?.();

    setServerError(""); setServerSuccess(""); setStatusUrl(null);

    const okFiles = validateFilesCount(files.length);
    const okNotes = validateNotes(notes);
    const okEmail = validateEmail(email);
    const okPhone = validatePhone(phone);
    if (!okFiles || !okNotes || !okEmail || !okPhone) {
      const anchorId = !okFiles ? "upload-block" : !okNotes ? "notes-block" : !okEmail ? "email-field" : "phone-field";
      document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const fd = new FormData();
    fd.append("name", name);
    fd.append("email", email);
    fd.append("phone", phone);
    fd.append("address", address);
    fd.append("notes", notes);
    files.forEach((f) => fd.append("photos", f, f.name));
    if (Array.isArray(cart) && cart.length) fd.append("cart", JSON.stringify(cart)); // opcjonalnie

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const xhr = new XMLHttpRequest();
      xhr.responseType = "json";
      xhr.open("POST", `${API_BASE}/api/orders`);

      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
      };
      xhr.onerror = () => {
        setServerError("Problem z połączeniem. Spróbuj ponownie.");
        setIsSubmitting(false);
      };
      xhr.onload = () => {
        setIsSubmitting(false);
        const body =
          xhr.response ||
          (() => {
            try { return JSON.parse(xhr.responseText); } catch { return null; }
          })();

        // 🔎 logger do debugowania
        try { console.log("POST /api/orders →", xhr.status, body); } catch {}

        if (xhr.status >= 200 && xhr.status < 300) {
          const su = body?.status_url || null;
          setServerSuccess("Dziękujemy! Zamówienie zostało przesłane. Sprawdź e-mail lub status poniżej.");
          setStatusUrl(su);
          if (su) localStorage.setItem("lastOrderStatusUrl", su);

          // reset pól formularza (nie czyścimy koszyka!)
          setFiles([]); setPreviews([]); setNotes(""); setName(""); setEmail(""); setPhone(""); setAddress("");
          setUploadProgress(0);
        } else {
          const msg = body?.error || `Błąd serwera (${xhr.status}). Spróbuj ponownie.`;
          setServerError(msg);
        }
      };

      xhr.send(fd);
    } catch (err) {
      setIsSubmitting(false);
      setServerError("Nie udało się wysłać zamówienia.");
    }
  }

  return (
    <section id="order" className="py-12">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 via-green-500 to-yellow-400">
          <ImageIcon className="w-4 h-4 text-white" strokeWidth={2.4} />
        </span>
        {t.customer_data}
      </h2>

      {/* zwykły formularz (bez method="dialog") */}
      <form className="grid md:grid-cols-2 gap-6" onSubmit={handleSubmit} noValidate>
        {/* LEWA kolumna */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div>
              <Label>{t.name}</Label>
              <Input required placeholder="Jan Kowalski" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div id="email-field">
              <Label>{t.email}</Label>
              <Input
                type="email" required placeholder="jan@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (emailError) validateEmail(e.target.value); }}
                onBlur={(e) => validateEmail(e.target.value)}
                aria-invalid={!!emailError} aria-describedby={emailError ? "email-error" : undefined}
              />
              {emailError && <div id="email-error" className="mt-2 text-sm text-red-600" role="alert">{emailError}</div>}
            </div>
            <div id="phone-field">
              <Label>{t.phone}</Label>
              <Input
                type="tel" required placeholder="+48 600 000 000 lub 600 000 000"
                value={phone} onChange={handlePhoneChange} onBlur={(e) => validatePhone(e.target.value)}
                aria-invalid={!!phoneError} aria-describedby={phoneError ? "phone-error" : undefined}
              />
              {phoneError && <div id="phone-error" className="mt-2 text-sm text-red-600" role="alert">{phoneError}</div>}
            </div>
            <div>
              <Label>{t.address}</Label>
              <Textarea required placeholder="Ulica, numer, kod pocztowy, miejscowość" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* PRAWA kolumna */}
        <Card>
          <CardContent className="p-5 space-y-5">
            <div className="space-y-2">
              <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600" /><span>Napisz który pakiet Cię interesuje</span></div>
              <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600" /><span>Dodaj zdjęcia</span></div>
              <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600" /><span>Zaczekaj na projekt, zwykle trwa to do 2 dni roboczych.</span></div>
            </div>

            {/* Upload + DnD + miniatury */}
            <div id="upload-block" className="space-y-3">
              <input
                ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                multiple className="hidden" onChange={handleFilesChange}
                aria-invalid={!!filesError} aria-describedby={filesError ? "upload-error" : undefined}
              />
              <div
                role="button" tabIndex={0}
                onClick={handleOpenFileDialog}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleOpenFileDialog()}
                onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                className={[
                  "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition",
                  isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-slate-400",
                ].join(" ")}
              >
                <p className="font-medium">Przeciągnij i upuść zdjęcia tutaj</p>
                <p className="text-sm text-slate-600 mt-1">…albo kliknij, aby wybrać z dysku</p>
                <p className="text-xs text-slate-500 mt-2">Możesz dodać wiele zdjęć naraz. Maksymalnie 30 zdjęć. Dodane: {files.length}/30</p>
              </div>

              {filesError && <div id="upload-error" className="text-sm text-red-600" role="alert">{filesError}</div>}

              {previews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {previews.map((p, idx) => (
                    <div key={idx} className="relative group">
                      <img src={p.url} alt={`Załącznik ${idx + 1}`} className="w-full h-28 object-cover rounded-lg border" />
                      <button type="button" onClick={() => removeFile(idx)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition bg-white/90 border rounded-md px-2 py-1 text-xs" aria-label="Usuń zdjęcie">
                        Usuń
                      </button>
                      <div className="mt-1 text-[11px] text-slate-600 truncate">{files[idx].name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Opis */}
            <div id="notes-block">
              <Label>{t.notes}</Label>
              <Textarea
                className="mt-2"
                placeholder="Opisz jak ma wyglądać Twoja figurka"
                value={notes}
                onChange={(e) => { const v = e.target.value; setNotes(v); if (notesError) validateNotes(v); }}
                onBlur={(e) => validateNotes(e.target.value)}
                aria-invalid={!!notesError} aria-describedby={notesError ? "notes-error" : undefined}
              />
              {notesError && <div id="notes-error" className="mt-2 text-sm text-red-600" role="alert">{notesError}</div>}
            </div>

            {/* Pasek postępu + komunikaty + link do statusu */}
            {isSubmitting && (
              <div className="space-y-2">
                <div className="text-sm text-slate-600">Wysyłanie… {uploadProgress}%</div>
                <div className="w-full h-2 rounded bg-slate-200 overflow-hidden">
                  <div className="h-2 bg-blue-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
            {serverSuccess && (
              <div className="rounded-md border border-green-200 bg-green-50 p-3 text-green-700 text-sm">
                {serverSuccess}
              </div>
            )}
            {serverError && <div className="text-red-600 text-sm">{serverError}</div>}
            {statusUrl && (
              <a
                href={statusUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-blue-600 underline mt-1"
              >
                Zobacz status zamówienia
              </a>
            )}
          </CardContent>
        </Card>

        {/* Przycisk wysyłki */}
        <div className="md:col-span-2 flex flex-col items-end gap-2">
          <div className="text-sm text-slate-600 mb-1">{t.pay_info}</div>
          <Button type="submit" disabled={isSubmitting} className={`bg-gradient-to-r ${BRAND.primary} text-white`}>
            <CreditCard className="w-4 h-4 mr-2" />
            {isSubmitting ? `Wysyłam… ${uploadProgress}%` : t.checkout}
          </Button>
        </div>
      </form>
    </section>
  );
}

function Cart({ t, cart, subtotal, removeFromCart, updateQty, open, setOpen }) {
  const [isPaying, setIsPaying] = React.useState(false);
  const [payError, setPayError] = React.useState("");

  async function startCheckout() {
    setPayError("");

    if (!cart?.length) {
      setPayError("Koszyk jest pusty.");
      return;
    }
    if (isPaying) return; // podwójne kliknięcia

    try {
      setIsPaying(true);

      // Minimalny payload – backend sam liczy ceny (nie ufamy frontowi)
      const payload = {
        items: cart.map((it) => ({
          product_id: it.id,             // "mini" | "standard" | "premium"
          qty: Number(it.qty || 1),
          options: {
            sizeCm: String(it?.options?.sizeCm ?? "15"),
            persons: Number(it?.options?.persons ?? (it.id === "standard" ? 2 : 1)),
            bobble: !!it?.options?.bobble,
          },
        })),
        last_status_url: localStorage.getItem("lastOrderStatusUrl") || null,
      };

      console.group("[checkout] request →");
      console.log("API:", `${API_BASE}/api/payments/checkout/session`);
      console.log("payload:", payload);

      const res = await fetch(`${API_BASE}/api/payments/checkout/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const rawText = await res.text();
      let data = {};
      try { data = rawText ? JSON.parse(rawText) : {}; } catch (_) {
        // zostawimy rawText w logu/komunikacie
      }

      console.log("status:", res.status);
      console.log("response (raw):", rawText);
      console.log("response (json):", data);
      console.groupEnd();

      if (!res.ok) {
        const msg =
          (data && (data.error_verbose || data.error)) ||
          `Błąd płatności (HTTP ${res.status}).`;
        throw new Error(msg);
      }

      const url = data?.url;
      if (!url) {
        throw new Error("Brak adresu sesji płatności w odpowiedzi (pole `url`).");
      }

      // 🔒 Twardy redirect do bramki (Stripe Checkout / mock)
      window.location.assign(url);
    } catch (e) {
      console.error("[checkout] error:", e);
      setPayError(e?.message || "Wystąpił błąd płatności.");
    } finally {
      // jeśli przekierowanie nastąpiło, kod poniżej i tak się nie wykona
      setIsPaying(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="p-0 w-full sm:!max-w-[400px] md:!max-w-[420px] flex flex-col"
      >
        {/* Header */}
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" /> {t.cart}
            </SheetTitle>
            <Button variant="ghost" onClick={() => setOpen(false)}>✕</Button>
          </div>
        </SheetHeader>

        {/* Scroll area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-slate-500 py-10 text-center">{t.empty_cart}</div>
          ) : (
            cart.map((item, idx) => {
              const isPremium = item.id === "premium";
              const basePrice = isPremium
                ? 550
                : (PRODUCTS.find((p) => p.id === item.id)?.price || item.price);

              const sizeSurcharge =
                item.options.sizeCm === "18" ? 40 :
                item.options.sizeCm === "23" ? 80 : 0;

              const personsCount = isPremium
                ? item.options.persons
                : item.id === "standard" ? 2 : 1;

              const personsSurcharge = isPremium
                ? Math.max(0, personsCount - 3) * 150
                : 0;

              const bobbleSurcharge = item.options.bobble
                ? (item.id === "standard" || isPremium ? 50 * personsCount : 50)
                : 0;

              const unitPrice = basePrice + sizeSurcharge + personsSurcharge + bobbleSurcharge;

              return (
                <div key={idx} className="flex gap-3 items-start border rounded-xl p-3">
                  <img src={item.image} alt={item.title} className="w-16 h-16 rounded object-cover" />
                  <div className="flex-1">
                    <div className="font-medium">{item.title}</div>

                    <div className="text-xs text-slate-600">
                      Rozmiar: {item.options.sizeCm} cm • Osoby: {personsCount} • Kiwająca głowa:{" "}
                      {item.options.bobble ? `tak (x${personsCount})` : "nie"}
                    </div>

                    <div className="mt-1 space-y-0.5 text-[11px] text-slate-500">
                      <div>bazowa: {currency(basePrice)}</div>
                      {sizeSurcharge > 0 && <div>rozmiar: +{currency(sizeSurcharge)}</div>}
                      {personsSurcharge > 0 && (
                        <div>
                          osoby (premium): +{currency(personsSurcharge)}{" "}
                          {personsCount > 3 && `(150 zł x ${personsCount - 3})`}
                        </div>
                      )}
                      {bobbleSurcharge > 0 && (
                        <div>
                          kiwająca głowa: +{currency(bobbleSurcharge)}{" "}
                          {(item.id === "standard" || isPremium) ? `(50 zł x ${personsCount})` : ""}
                        </div>
                      )}
                    </div>

                    <div className="mt-1 text-sm font-semibold">
                      {currency(unitPrice * item.qty)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {currency(unitPrice)} / szt.
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={() => updateQty(idx, -1)}>
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-6 text-center text-sm">{item.qty}</span>
                      <Button variant="outline" size="icon" onClick={() => updateQty(idx, 1)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removeFromCart(idx)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sticky footer */}
        <div className="border-t p-4 space-y-3">
          <div className="flex items-center justify-between font-semibold text-lg">
            <span>{t.subtotal}</span>
            <span>{currency(subtotal)}</span>
          </div>

          <div className="flex flex-col gap-3">
            {/* BŁĄD PŁATNOŚCI */}
            {payError && (
              <div
                className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700 text-sm"
                role="alert"
                aria-live="polite"
              >
                {payError}
              </div>
            )}

            <Button
              className={`w-full bg-gradient-to-r ${BRAND.primary} text-white`}
              onClick={() => {
                setOpen(false);
                setTimeout(() => {
                  document.getElementById("order")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 0);
              }}
            >
              Składam bezpłatne zamówienie projektu
            </Button>

            <button
              type="button"
              onClick={startCheckout}
              disabled={isPaying || !cart?.length || subtotal <= 0}
              className="w-full h-10 inline-flex items-center justify-center rounded-md px-4 text-sm font-medium text-white shadow-sm
                         bg-gradient-to-r from-emerald-500 to-green-600
                         hover:brightness-105 active:scale-[0.99]
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 disabled:opacity-60"
            >
              {isPaying ? "Przekierowuję do płatności…" : "Zaakceptowałem projekt, kupuję"}
            </button>
          </div>
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
          <a href={`tel:${BRAND.phone.replace(/\s/g, "")}`}>{BRAND.phone}</a>
          <span>{BRAND.address}</span>
        </div>
      </div>
    </footer>
  );
}

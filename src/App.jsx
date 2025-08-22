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
      "Prześlij zdjęcia i opis (model, dodatki)",
      "Dostaniesz darmową wizualizację. Płacisz dopiero po akceptacji.",
      "Odbierz przesyłkę i uśmiech :)",
    ],
    gallery: "Inspiracje i realizacje",
    offer: "Wybierz pakiet",
    add_to_cart: "Dodaj do koszyka",
    qty: "Ilość",
    // upload_ref: "Zdjęcia referencyjne (max 5)",
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

  // ile osób dla wyceny (STANDARD = 2, MINI = 1, PREMIUM = wybór)
  const personsCount = isPremium ? persons : (p.id === "standard" ? 2 : 1);

  // dopłaty
  const sizeSurcharge = sizeCm === "18" ? 40 : sizeCm === "23" ? 80 : 0;
  const basePrice = isPremium ? 550 : p.price;
  const personsSurcharge = isPremium ? Math.max(0, persons - 3) * 150 : 0;

  // ZMIANA: bobble per osoba dla STANDARD i PREMIUM; w MINI stałe 50 zł
  const bobbleSurcharge = bobble
    ? (p.id === "standard" || isPremium ? 50 * personsCount : 50)
    : 0;

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
            <span>
              {p.id === "standard" || isPremium
                ? "Kiwająca głowa (+50 zł / osoba)"
                : "Kiwająca głowa (+50 zł)"}
            </span>
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
    setServerError(""); setServerSuccess("");

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
    if (Array.isArray(cart) && cart.length) fd.append("cart", JSON.stringify(cart));

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "http://localhost:4000/api/orders");
      xhr.open("POST", `${import.meta.env.VITE_API_URL}/api/orders`);

      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
      };
      xhr.onerror = () => {
        setServerError("Problem z połączeniem. Spróbuj ponownie.");
        setIsSubmitting(false);
      };
      xhr.onload = () => {
        setIsSubmitting(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          setServerSuccess("Dziękujemy! Zamówienie zostało przesłane. Sprawdź e-mail.");
          // reset (opcjonalnie)
          setFiles([]); setPreviews([]); setNotes(""); setName(""); setEmail(""); setPhone(""); setAddress("");
          setUploadProgress(0);
        } else {
          setServerError(`Błąd serwera (${xhr.status}). Spróbuj ponownie.`);
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
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <ImageIcon className="w-6 h-6" /> {t.customer_data}
      </h2>

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
            {/* Checklist */}
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

            {/* Pasek postępu + komunikaty */}
            {isSubmitting && (
              <div className="space-y-2">
                <div className="text-sm text-slate-600">Wysyłanie… {uploadProgress}%</div>
                <div className="w-full h-2 rounded bg-slate-200 overflow-hidden">
                  <div className="h-2 bg-blue-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
            {serverSuccess && <div className="text-green-700 text-sm">{serverSuccess}</div>}
            {serverError && <div className="text-red-600 text-sm">{serverError}</div>}
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
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="p-0 w-full sm:!max-w-[400px] md:!max-w-[420px]">
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
              {cart.map((item, idx) => {
                const isPremium = item.id === "premium";
                const basePrice = isPremium
                  ? 550
                  : (PRODUCTS.find((p) => p.id === item.id)?.price || item.price);

                const sizeSurcharge = item.options.sizeCm === "18"
                  ? 40
                  : item.options.sizeCm === "23"
                  ? 80
                  : 0;

                const personsCount = isPremium
                  ? item.options.persons
                  : item.id === "standard"
                  ? 2
                  : 1;

                const personsSurcharge = isPremium
                  ? Math.max(0, personsCount - 3) * 150
                  : 0;

                const bobbleSurcharge = item.options.bobble
                  ? (item.id === "standard" || isPremium ? 50 * personsCount : 50)
                  : 0;

                const unitPrice =
                  basePrice + sizeSurcharge + personsSurcharge + bobbleSurcharge;

                return (
                  <div key={idx} className="flex gap-3 items-start border rounded-xl p-3">
                    <img src={item.image} alt={item.title} className="w-16 h-16 rounded object-cover" />
                    <div className="flex-1">
                      <div className="font-medium">{item.title}</div>

                      {/* Szczegóły opcji */}
                      <div className="text-xs text-slate-600">
                        Rozmiar: {item.options.sizeCm} cm • Osoby: {personsCount} • Kiwająca głowa:{" "}
                        {item.options.bobble ? `tak (x${personsCount})` : "nie"}
                      </div>

                      {/* Breakdown ceny jednostkowej */}
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
                            {(item.id === "standard" || isPremium)
                              ? `(50 zł x ${personsCount})`
                              : ""}
                          </div>
                        )}
                      </div>

                      {/* Ceny */}
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
              })}

              <div className="flex items-center justify-between font-semibold text-lg pt-2 border-t">
                <span>{t.subtotal}</span>
                <span>{currency(subtotal)}</span>
              </div>

              {/* Przyciski akcji (z odstępem) */}
              <div className="flex flex-col gap-3">
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
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    // TODO: podłącz płatność/checkout
                    console.log("Zaakceptowałem projekt, kupuje");
                  }}
                >
                  Zaakceptowałem projekt, kupuje
                </Button>
              </div>
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
require("dotenv").config();

const path = require("path");
const fs = require("fs");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const multer = require("multer");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const Database = require("better-sqlite3");
const mime = require("mime-types");

// ====== Konfiguracja ======
const PORT = process.env.PORT || 4000;
const ALLOWED_ORIGIN = (process.env.ALLOWED_ORIGIN || "").split(",").map(s => s.trim()).filter(Boolean);
const UPLOAD_DIR = path.join(__dirname, "uploads");
const UPLOAD_ORDERS_DIR = path.join(UPLOAD_DIR, "orders");

fs.mkdirSync(UPLOAD_ORDERS_DIR, { recursive: true });

// ====== Baza danych (SQLite) ======
const db = new Database(path.join(__dirname, "data.sqlite"));
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  cart_json TEXT,
  subtotal_cents INTEGER,
  files_json TEXT,
  created_at TEXT
);
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT,
  ip TEXT
);
`);

// ====== Express ======
const app = express();

app.use(helmet());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // np. curl/postman
    if (ALLOWED_ORIGIN.length === 0 || ALLOWED_ORIGIN.includes(origin)) return cb(null, true);
    return cb(new Error("CORS not allowed for origin: " + origin), false);
  }
}));

// Statyczne serwowanie uploadów
app.use("/uploads", express.static(UPLOAD_DIR, {
  maxAge: "7d",
  index: false,
}));

// ====== Limity zapytań ======
const createLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
});
app.use("/api/", createLimiter);

// ====== Multer (uploady) ======
const allowedMimes = new Set(["image/jpeg", "image/png", "image/webp"]);
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_ORDERS_DIR),
  filename: (req, file, cb) => {
    const ext = mime.extension(file.mimetype) || file.originalname.split(".").pop();
    const base = path.basename(file.originalname, "." + ext).replace(/[^\w\-]+/g, "_");
    cb(null, `${Date.now()}-${uuidv4()}-${base}.${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 30 },
  fileFilter: (req, file, cb) => {
    if (!allowedMimes.has(file.mimetype)) return cb(new Error("INVALID_FILE_TYPE"));
    cb(null, true);
  }
}).array("photos", 30);

// ====== Pricing (zgodnie z frontem) ======
const PRODUCTS = {
  mini: { id: "mini", price: 199 },
  standard: { id: "standard", price: 349 },
  premium: { id: "premium", price: 599 }, // front ma „base 550” dla serwera – patrz niżej
};

function normalizeItem(item) {
  // oczekiwane: { id, qty, options: { sizeCm, persons?, bobble } }
  const id = String(item.id || "").trim();
  const qty = Math.max(1, parseInt(item.qty ?? 1, 10));
  const sizeCm = ["15", "18", "23"].includes(String(item.options?.sizeCm)) ? String(item.options.sizeCm) : "15";
  const bobble = !!item.options?.bobble;

  let personsCount;
  if (id === "premium") {
    const p = parseInt(item.options?.persons ?? 3, 10);
    personsCount = Math.min(10, Math.max(3, isNaN(p) ? 3 : p));
  } else if (id === "standard") {
    personsCount = 2;
  } else { // mini
    personsCount = 1;
  }

  return { id, qty, sizeCm, bobble, personsCount };
}

function calcUnitPrice(it) {
  const isPremium = it.id === "premium";
  const basePrice = isPremium ? 550 : (PRODUCTS[it.id]?.price ?? 0); // premium bazuje na 550 zgodnie z frontem
  const sizeSurcharge = it.sizeCm === "18" ? 40 : (it.sizeCm === "23" ? 80 : 0);
  const personsSurcharge = isPremium ? Math.max(0, it.personsCount - 3) * 150 : 0;
  const bobbleSurcharge = it.bobble ? ((it.id === "standard" || isPremium) ? 50 * it.personsCount : 50) : 0;
  return basePrice + sizeSurcharge + personsSurcharge + bobbleSurcharge;
}

function calcCartTotals(cartArray) {
  const norm = cartArray.map(normalizeItem);
  const items = norm.map(n => {
    const unit = calcUnitPrice(n);
    return { ...n, unitPrice: unit, lineTotal: unit * n.qty };
  });
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  return { items, subtotal };
}

// ====== Mailer (opcjonalny) ======
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

// ====== Endpoints ======

// Health
app.get("/api/health", (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// Kontakt (ModelsPage)
app.post("/api/contact", async (req, res) => {
  const { email, message } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email))) {
    return res.status(400).json({ error: "Podaj poprawny e-mail." });
  }
  if (!message || String(message).trim().length < 5) {
    return res.status(400).json({ error: "Wiadomość jest za krótka." });
  }
  const id = uuidv4();
  const createdAt = new Date().toISOString();
  const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.socket.remoteAddress || null;

  db.prepare(`INSERT INTO contacts (id, email, message, created_at, ip) VALUES (?, ?, ?, ?, ?)`)
    .run(id, String(email).trim(), String(message).trim(), createdAt, ip);

  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.MAIL_FROM || `"Formularz" <no-reply@localhost>`,
        to: process.env.MAIL_TO || String(email).trim(),
        subject: "Nowe zapytanie (Modele) – TwojaPodobizna.pl",
        text: `Email: ${email}\n\nWiadomość:\n${message}\n\n${createdAt}`,
      });
    } catch (e) {
      // nie blokuj użytkownika gdy mail padnie
      console.error("Mailer error /contact:", e.message);
    }
  }

  res.status(201).json({ ok: true, id });
});

// Zamówienia (OrderForm) — multipart + pliki
app.post("/api/orders", (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      if (err.message === "INVALID_FILE_TYPE") {
        return res.status(400).json({ error: "Dozwolone pliki: JPG, PNG, WEBP." });
      }
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "Za duży plik. Maks. 10 MB." });
      }
      if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({ error: "Za dużo plików. Maks. 30." });
      }
      console.error("Upload error:", err);
      return res.status(400).json({ error: "Błąd przesyłania plików." });
    }

    const { name, email, phone, address, notes } = req.body || {};
    const cartRaw = req.body.cart;

    // Walidacje podstawowe
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email))) {
      return res.status(400).json({ error: "Podaj poprawny e-mail." });
    }
    if (!phone || String(phone).replace(/\D+/g, "").length < 9) {
      return res.status(400).json({ error: "Podaj poprawny numer telefonu." });
    }
    if (!address || String(address).trim().length < 3) {
      return res.status(400).json({ error: "Podaj adres dostawy." });
    }
    if (!notes || String(notes).trim().length < 20) {
      return res.status(400).json({ error: "Opisz szczegóły – minimum 20 znaków." });
    }
    const files = req.files || [];
    if (files.length < 1) {
      return res.status(400).json({ error: "Dodaj przynajmniej 1 zdjęcie." });
    }

    // Parsowanie koszyka
    let cart = [];
    try {
      if (cartRaw) cart = JSON.parse(cartRaw);
      if (!Array.isArray(cart)) cart = [];
    } catch (_) {
      cart = [];
    }

    // Przeliczenie cen po stronie serwera
    const { items, subtotal } = calcCartTotals(cart);
    const orderId = uuidv4();
    const createdAt = new Date().toISOString();

    // Zapis do bazy
    const filesPublic = files.map(f => ({
      originalName: f.originalname,
      mime: f.mimetype,
      size: f.size,
      url: `/uploads/orders/${path.basename(f.path)}`
    }));

    db.prepare(`
      INSERT INTO orders (id, name, email, phone, address, notes, cart_json, subtotal_cents, files_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderId,
      String(name || "").trim(),
      String(email).trim(),
      String(phone).trim(),
      String(address).trim(),
      String(notes).trim(),
      JSON.stringify(items),
      Math.round(subtotal * 100), // w groszach
      JSON.stringify(filesPublic),
      createdAt
    );

    // E-mail (opcjonalnie)
    if (transporter) {
      try {
        const listFiles = filesPublic.map(f => `- ${f.originalName} (${f.mime}, ${(f.size/1024).toFixed(0)} KB)`).join("\n");
        await transporter.sendMail({
          from: process.env.MAIL_FROM || `"Zamówienia" <no-reply@localhost>`,
          to: process.env.MAIL_TO || String(email).trim(),
          subject: `Nowe zamówienie #${orderId} – TwojaPodobizna.pl`,
          text:
`ID: ${orderId}
Imię i nazwisko: ${name || "-"}
E-mail: ${email}
Telefon: ${phone}
Adres: ${address}

Notatki:
${notes}

Suma (PLN): ${ (subtotal).toFixed(2) }

Pliki (${filesPublic.length}):
${listFiles}
`,
        });
      } catch (e) {
        console.error("Mailer error /orders:", e.message);
      }
    }

    res.status(201).json({
      ok: true,
      orderId,
      subtotal,
      files: filesPublic
    });
  });
});

// Fallback
app.use((err, req, res, next) => {
  console.error("Unhandled:", err);
  res.status(500).json({ error: "Wewnętrzny błąd serwera." });
});

// Start
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
  if (ALLOWED_ORIGIN.length) console.log("CORS allowed:", ALLOWED_ORIGIN.join(", "));
});

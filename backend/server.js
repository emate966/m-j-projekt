// server.js — stabilna wersja (ESM, bez top-level await)
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import rateLimit from "express-rate-limit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import { z } from "zod";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";

app.use(cors({ origin: FRONTEND_ORIGIN, credentials: false }));
app.use(express.json());

// Rate limit
const limiter = rateLimit({ windowMs: 60 * 1000, max: 60 });
app.use(limiter);

// Katalogi
const UPLOAD_DIR = path.join(__dirname, "uploads");
const DB_DIR = path.join(__dirname, "db");
const DB_FILE = path.join(DB_DIR, "orders.json");

// Tworzenie katalogów synchronicznie (bez await)
try {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.mkdirSync(DB_DIR, { recursive: true });
} catch (e) {
  console.error("Could not create directories", e);
}

app.use("/uploads", express.static(UPLOAD_DIR));

// Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || "";
    cb(null, `${Date.now()}-${uuidv4()}${ext}`);
  },
});

const allowedMimes = new Set(["image/jpeg", "image/png", "image/webp"]);

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB per file
    files: 30,
  },
  fileFilter: (req, file, cb) => {
    if (allowedMimes.has(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid file type. Only JPG, PNG, WEBP allowed."));
  },
});

// Walidacja
const orderSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  address: z.string().min(5),
  notes: z.string().min(20),
  cart: z.string().optional(), // JSON string
});

// Health
app.get("/health", (req, res) => res.json({ ok: true }));

// Prosta "baza" JSON
function appendOrderSync(order) {
  try {
    const exists = fs.existsSync(DB_FILE)
      ? fs.readFileSync(DB_FILE, "utf8")
      : "[]";
    const arr = JSON.parse(exists);
    arr.push(order);
    fs.writeFileSync(DB_FILE, JSON.stringify(arr, null, 2), "utf8");
  } catch (e) {
    console.error("DB write error", e);
  }
}

// POST /api/orders
app.post("/api/orders", upload.array("photos", 30), async (req, res) => {
  try {
    const parsed = orderSchema.safeParse(req.body);
    if (!parsed.success) {
      // Sprzątanie plików gdy walidacja nie przeszła
      if (req.files?.length) {
        for (const f of req.files) {
          try {
            fs.unlinkSync(f.path);
          } catch {}
        }
      }
      return res
        .status(400)
        .json({ ok: false, error: "Validation error", details: parsed.error.flatten() });
    }

    const filesMeta = (req.files || []).map((f) => ({
      filename: path.basename(f.path),
      originalName: f.originalname,
      mime: f.mimetype,
      size: f.size,
      url: `/uploads/${path.basename(f.path)}`,
    }));

    const id = uuidv4();
    const cart = parsed.data.cart ? JSON.parse(parsed.data.cart) : null;
    const orderRecord = {
      id,
      createdAt: new Date().toISOString(),
      ...parsed.data,
      cart,
      photos: filesMeta,
      status: "PENDING_DESIGN",
    };

    appendOrderSync(orderRecord);

    // Email
    try {
      const info = await sendOrderEmail(orderRecord);
      res.json({
        ok: true,
        orderId: id,
        previewUrl: info?.previewUrl || null,
        filesReceived: filesMeta.length,
      });
    } catch (e) {
      console.error("Email error", e);
      res.json({
        ok: true,
        orderId: id,
        email: "failed",
        filesReceived: filesMeta.length,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

// Email
async function getTransporter() {
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  ) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else {
    const test = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: test.smtp.host,
      port: test.smtp.port,
      secure: test.smtp.secure,
      auth: { user: test.user, pass: test.pass },
    });
    transporter._ethereal = true;
    return transporter;
  }
}

async function sendOrderEmail(order) {
  const transporter = await getTransporter();
  const from =
    process.env.SMTP_FROM ||
    "TwojaPodobizna <no-reply@twojapodobizna.pl>";
  const to = order.email;

  const subject = `Zamówienie projektu #${order.id}`;
  const text = [
    `Cześć ${order.name},`,
    ``,
    `Dziękujemy za przesłanie zamówienia projektu figurki.`,
    `W ciągu 2 dni roboczych przygotujemy darmową wizualizację.`,
    `Po akceptacji wyślemy link do płatności online.`,
    ``,
    `ID zamówienia: ${order.id}`,
    `Liczba zdjęć: ${order.photos.length}`,
    ``,
    `— Zespół TwojaPodobizna.pl`,
  ].join("\n");

  const html = `
    <p>Cześć ${escapeHtml(order.name)},</p>
    <p>Dziękujemy za przesłanie zamówienia projektu figurki.</p>
    <p>W ciągu <strong>2 dni roboczych</strong> przygotujemy darmową wizualizację.<br/>
    Po akceptacji wyślemy link do płatności online.</p>
    <p><strong>ID zamówienia:</strong> ${order.id}<br/>
    <strong>Liczba zdjęć:</strong> ${order.photos.length}</p>
    <p>— Zespół TwojaPodobizna.pl</p>
  `;

  const info = await transporter.sendMail({ from, to, subject, text, html });
  const previewUrl = transporter._ethereal
    ? nodemailer.getTestMessageUrl(info)
    : null;
  return { info, previewUrl };
}

function escapeHtml(str = "") {
  return str.replace(/[&<>\"']/g, (s) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[s]);
}

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
  if (FRONTEND_ORIGIN === "*") {
    console.log(
      "CORS: allowing all origins (set FRONTEND_ORIGIN in .env for production)"
    );
  } else {
    console.log(`CORS: allowing origin ${FRONTEND_ORIGIN}`);
  }
});

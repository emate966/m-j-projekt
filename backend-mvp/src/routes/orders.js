// src/routes/orders.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

import { sendOrderConfirmation, sendAdminCopy } from '../services/mail.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function buildOrdersRouter(db, UPLOAD_DIR) {
  const router = express.Router();

  // Upewnij się, że katalog uploadów istnieje
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  // Multer – proste limity i filtry
  const MAX_FILES = 30;
  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '';
      const base = crypto.randomBytes(16).toString('hex');
      cb(null, `${Date.now()}_${base}${ext}`);
    },
  });
  const upload = multer({
    storage,
    limits: { fileSize: MAX_SIZE, files: MAX_FILES },
    fileFilter: (_req, file, cb) => {
      const okMime = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
      if (!okMime) return cb(new Error('INVALID_FILE_TYPE'));
      cb(null, true);
    },
  });

  // POST /api/orders — publiczny
  router.post('/', upload.array('photos', MAX_FILES), async (req, res) => {
    try {
      const { name, email, phone, address, notes } = req.body;
      const now = new Date().toISOString();

      // Walidacja minimalna
      if (!email || !phone || !address || !notes) {
        return res.status(400).json({ error: 'MISSING_FIELDS' });
      }

      // Koszyk z frontu (opcjonalny)
      let itemsFromClient = [];
      try {
        if (req.body.cart) itemsFromClient = JSON.parse(req.body.cart);
      } catch {
        /* ignore */
      }

      // policz subtotal w groszach (jeśli cart przyszedł)
      const subtotal =
        Array.isArray(itemsFromClient)
          ? Math.max(
              0,
              itemsFromClient.reduce((s, it) => {
                const q = Number(it?.qty || 1);
                const p = Number(it?.price || 0);
                return s + Math.round(p * 100) * q;
              }, 0)
            )
          : 0;

      const id = crypto.randomUUID();
      const public_token = crypto.randomBytes(32).toString('hex');

      // Insert zamówienia
      await db.run(
        `INSERT INTO orders (id, created_at, status, variant, model_id, email, name, phone, address, notes, subtotal, public_token)
         VALUES (?, ?, 'pending', NULL, NULL, ?, ?, ?, ?, ?, ?, ?)`,
        id, now, email || null, name || null, phone || null, address || null, notes || null, subtotal, public_token
      );

      // Insert pozycji (jeśli przysłano)
      if (Array.isArray(itemsFromClient) && itemsFromClient.length) {
        for (const it of itemsFromClient) {
          const title = String(it?.title || it?.id || 'Produkt');
          const qty = Math.max(1, Number(it?.qty || 1));
          const unit_price = Math.max(0, Math.round(Number(it?.price || 0) * 100));
          const product_id = String(it?.id || null);
          const options_json = JSON.stringify(it?.options || {});
          await db.run(
            `INSERT INTO order_items (order_id, product_id, title, unit_price, qty, options_json)
             VALUES (?, ?, ?, ?, ?, ?)`,
            id, product_id, title, unit_price, qty, options_json
          );
        }
      }

      // Insert zdjęć (jeśli są)
      const files = Array.isArray(req.files) ? req.files : [];
      for (const f of files) {
        await db.run(
          `INSERT INTO order_photos (order_id, filename, original_name, mime, size)
           VALUES (?, ?, ?, ?, ?)`,
          id, f.filename, f.originalname, f.mimetype, f.size
        );
      }

      // Zbuduj publiczny URL statusu
      const base =
        process.env.PUBLIC_STATUS_BASE ||
        `${req.protocol}://${req.get('host')}/public/orders`;
      const status_url = `${base}/${id}?token=${public_token}`;

      // Maile (dev-fallback => console.log w services/mail.js)
      try {
        if (email) await sendOrderConfirmation(email, { id, status: 'pending', subtotal, status_url });
        await sendAdminCopy({ id, email, name, phone, address, notes, subtotal, filesCount: files.length });
      } catch (e) {
        console.warn('[MAIL WARNING]', e?.message || e);
      }

      return res.json({
        ok: true,
        orderId: id,
        status: 'pending',
        subtotal,
        status_url,
      });
    } catch (err) {
      console.error('POST /api/orders error:', err);
      const m = String(err?.message || '');
      if (m.includes('LIMIT_FILE_SIZE')) {
        return res.status(400).json({ error: 'FILE_TOO_LARGE' });
      }
      if (m.includes('INVALID_FILE_TYPE')) {
        return res.status(400).json({ error: 'INVALID_FILE_TYPE' });
      }
      return res.status(500).json({ error: 'SERVER_ERROR' });
    }
  });

  return router;
}

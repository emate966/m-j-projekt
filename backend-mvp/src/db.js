// src/db.js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

sqlite3.verbose();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Domyślna baza: <repo>/data.sqlite (możesz nadpisać envem DATABASE_FILE)
const DEFAULT_DB_FILE = process.env.DATABASE_FILE
  || path.join(__dirname, '..', 'data.sqlite');

let dbPromise = null;

export async function initDB(databaseFile) {
  const filename = databaseFile || DEFAULT_DB_FILE;
  console.log('[DB] Using file:', filename);

  const dir = path.dirname(filename);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = await open({ filename, driver: sqlite3.Database });

  // Dobre praktyki
  await db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
  `);

  // 1) Bazowy schemat (bez indeksu na public_token — indeks dodamy po migracji)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL, -- pending | paid | fulfilled | cancelled
      variant TEXT,
      model_id TEXT,
      email TEXT,
      name TEXT,
      phone TEXT,
      address TEXT,
      notes TEXT,
      subtotal INTEGER DEFAULT 0, -- grosze
      public_token TEXT
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      product_id TEXT,
      title TEXT,
      unit_price INTEGER, -- grosze
      qty INTEGER,
      options_json TEXT,
      FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS order_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      filename TEXT,
      original_name TEXT,
      mime TEXT,
      size INTEGER,
      FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_photos_order_id ON order_photos(order_id);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
  `);

  // 2) Migracja: jeśli w istniejącej tabeli orders nie ma public_token → dodaj kolumnę
  const cols = await db.all(`PRAGMA table_info('orders')`);
  const hasPublicToken = cols.some(c => c.name === 'public_token');
  if (!hasPublicToken) {
    await db.exec(`ALTER TABLE orders ADD COLUMN public_token TEXT;`);
    console.log('[DB] Migrated: added orders.public_token');
  }

  // 3) Indeks na public_token — dopiero PO upewnieniu się, że kolumna istnieje
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_orders_public_token ON orders(public_token);
  `);

  return db;
}

export async function getDb() {
  if (!dbPromise) dbPromise = initDB(DEFAULT_DB_FILE);
  return dbPromise;
}

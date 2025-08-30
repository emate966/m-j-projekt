import { getDb } from '../src/db.js';

const id = process.argv[2];
if (!id) {
  console.error('Podaj ID zamówienia jako argument.');
  process.exit(1);
}

const db = await getDb();
const order = await db.get('SELECT * FROM orders WHERE id = ?', id);
const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', id);
const photos = await db.all('SELECT * FROM order_photos WHERE order_id = ?', id);

console.log({ order, items, photos });
process.exit(0);

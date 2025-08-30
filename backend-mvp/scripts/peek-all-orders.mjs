import { getDb } from '../src/db.js';

const db = await getDb();
const rows = await db.all(`
  SELECT id, created_at, status, email, name, subtotal
  FROM orders
  ORDER BY datetime(created_at) DESC
  LIMIT 100
`);
console.log(rows);

// src/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import fs from 'fs';
import archiver from 'archiver';

import { initDB } from './db.js';
import { buildOrdersRouter } from './routes/orders.js';
import { buildMiscRouter } from './routes/misc.js';
import { buildPaymentsRouter } from './routes/payments.js';
import { sendStatusUpdate } from './services/mail.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env z katalogu głównego repo
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const PORT = process.env.PORT || 8000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');
const DATABASE_FILE = process.env.DATABASE_FILE || path.join(__dirname, '../data.sqlite');
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const ADMIN_TOKEN = (process.env.ADMIN_TOKEN || '').trim();

const app = express();
app.disable('x-powered-by');

// Bezpieczne nagłówki + logi
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan('tiny'));

// CORS (zezwól na Authorization)
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  })
);

app.use(express.json({ limit: '2mb' }));

// Proste Bearer auth
function requireAdmin(req, res, next) {
  const auth = req.get('authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  const provided = (m && m[1] ? m[1].trim() : '');
  if (!ADMIN_TOKEN || provided !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }
  next();
}

// Log pomocniczy
if (ADMIN_TOKEN) {
  console.log('[SECURITY] ADMIN_TOKEN set:', ADMIN_TOKEN.slice(0, 8) + '…');
} else {
  console.warn('[SECURITY] ADMIN_TOKEN is not set. Protected endpoints will return 401.');
}

// Statyczne uploady
app.use('/uploads', express.static(UPLOAD_DIR));

// DB init
const db = await initDB(DATABASE_FILE);

// Mały helper do bezpiecznych nazw plików
function safeFilename(s) {
  return String(s || '').replace(/[\/\\:*?"<>|]+/g, '_').replace(/\s+/g, ' ').trim();
}

// ----------------------------------------------------
// PUBLIC STATUS (HTML lub JSON) — bez PII
// GET /public/orders/:id?token=xxx[&format=json]
// ----------------------------------------------------
app.get('/public/orders/:id', async (req, res) => {
  const { id } = req.params;
  const token = String(req.query.token || '');
  if (!token) {
    return res
      .status(404)
      .send(
        `<!doctype html><meta charset="utf-8"><title>Nie znaleziono</title><body style="font-family:system-ui;padding:2rem">Nie znaleziono zamówienia.</body></html>`
      );
  }

  try {
    const row = await db.get(
      `SELECT id, created_at, status, subtotal
       FROM orders
       WHERE id = ? AND public_token = ?`,
      id,
      token
    );

    if (!row) {
      return res
        .status(404)
        .send(
          `<!doctype html><meta charset="utf-8"><title>Nie znaleziono</title><body style="font-family:system-ui;padding:2rem">Nie znaleziono zamówienia.</body></html>`
        );
    }

    const wantsJson =
      req.query.format === 'json' || (req.get('accept') || '').includes('application/json');
    if (wantsJson) return res.json(row);

    const date = new Date(row.created_at).toLocaleString('pl-PL');
    const amount = (row.subtotal ?? 0) / 100;

    return res.send(`<!doctype html>
<html lang="pl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Status zamówienia</title>
<body style="font-family:system-ui;background:#f6f7f9;margin:0">
  <main style="max-width:720px;margin:40px auto;padding:24px;background:#fff;border-radius:16px;box-shadow:0 6px 24px rgba(0,0,0,.08)">
    <h1 style="margin:0 0 8px">Status zamówienia</h1>
    <p style="margin:0 0 16px;color:#666">Zamówienie zostało zarejestrowane. Poniżej bieżący status.</p>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0">
      <div style="padding:12px 16px;background:#fafbfc;border:1px solid #eef0f3;border-radius:12px">
        <div style="font-size:12px;color:#6b7280">Status</div>
        <div style="font-size:18px;font-weight:600;text-transform:capitalize">${row.status}</div>
      </div>
      <div style="padding:12px 16px;background:#fafbfc;border:1px solid #eef0f3;border-radius:12px">
        <div style="font-size:12px;color:#6b7280">Data</div>
        <div style="font-size:18px;font-weight:600">${date}</div>
      </div>
      <div style="padding:12px 16px;background:#fafbfc;border:1px solid #eef0f3;border-radius:12px">
        <div style="font-size:12px;color:#6b7280">Kwota (subtotal)</div>
        <div style="font-size:18px;font-weight:600">${amount.toLocaleString('pl-PL', {style:'currency', currency:'PLN'})}</div>
      </div>
    </div>

    <p style="color:#6b7280">Pełny numer zamówienia znajdziesz w wiadomości e-mail z potwierdzeniem.</p>
  </main>
</body></html>`);
  } catch (e) {
    console.error('GET /public/orders/:id error:', e);
    return res
      .status(500)
      .send(
        `<!doctype html><meta charset="utf-8"><title>Błąd</title><body style="font-family:system-ui;padding:2rem">Wystąpił błąd serwera.</body></html>`
      );
  }
});

// ===== helpers dla filtrowania/sortowania/paginacji (admin) =====
function normStr(v) {
  return ('' + (v ?? '')).trim();
}
function parseIntSafe(v, def) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : def;
}
function toIsoBoundary(input, endOfDay = false) {
  const s = normStr(input);
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const iso = new Date(s + (endOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z')).toISOString();
    return iso;
  }
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function buildAdminFilters(qs) {
  const conds = [];
  const params = [];

  const q = normStr(qs.q || '');
  if (q) {
    const like = `%${q.toLowerCase()}%`;
    conds.push('(LOWER(o.email) LIKE ? OR LOWER(o.name) LIKE ? OR o.id LIKE ?)');
    params.push(like, like, like);
  }

  const fromIso = toIsoBoundary(qs.from, false);
  const toIso = toIsoBoundary(qs.to, true);
  if (fromIso) {
    conds.push('datetime(o.created_at) >= datetime(?)');
    params.push(fromIso);
  }
  if (toIso) {
    conds.push('datetime(o.created_at) <= datetime(?)');
    params.push(toIso);
  }

  const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
  return { where, params };
}

function buildSorting(sortByRaw, sortDirRaw) {
  const SORTABLE = {
    created_at: 'o.created_at',
    status: 'o.status',
    subtotal: 'o.subtotal',
    email: 'o.email',
    name: 'o.name',
    photos_count: 'photos_count',
  };
  const col = SORTABLE[normStr(sortByRaw)] || SORTABLE.created_at;
  const dir = normStr(sortDirRaw).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  return `ORDER BY ${col} ${dir}`;
}

// ----------------------------------------------------
// ADMIN — lista zamówień (PII)
// GET /api/admin/orders
// ----------------------------------------------------
app.get('/api/admin/orders', requireAdmin, async (req, res) => {
  try {
    const page = parseIntSafe(req.query.page, 1);
    const pageSizeRaw = parseIntSafe(req.query.page_size, 20);
    const pageSize = Math.min(pageSizeRaw, 100);
    const offset = (page - 1) * pageSize;

    const { where, params } = buildAdminFilters(req.query);
    const orderBy = buildSorting(req.query.sort_by, req.query.sort_dir);

    const baseSelect = `
      SELECT
        o.id, o.created_at, o.status, o.email, o.name, o.phone, o.subtotal,
        (SELECT COUNT(1) FROM order_photos p WHERE p.order_id = o.id) AS photos_count
      FROM orders o
      ${where}
      ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const rows = await db.all(baseSelect, ...params, pageSize, offset);

    const totalRow = await db.get(
      `SELECT COUNT(1) AS total FROM orders o ${where}`,
      ...params
    );
    const total = totalRow?.total || 0;

    res.set('X-Total-Count', String(total));
    res.json({ items: rows, total, page, page_size: pageSize });
  } catch (e) {
    console.error('GET /api/admin/orders error:', e);
    res.status(500).json({ error: 'Błąd pobierania zamówień.' });
  }
});

// ----------------------------------------------------
// ADMIN — eksport CSV
// GET /api/admin/orders.csv
// ----------------------------------------------------
app.get('/api/admin/orders.csv', requireAdmin, async (req, res) => {
  try {
    const { where, params } = buildAdminFilters(req.query);
    const orderBy = buildSorting(req.query.sort_by, req.query.sort_dir);

    const rows = await db.all(
      `
      SELECT
        o.id, o.created_at, o.status, o.email, o.name, o.phone, o.subtotal,
        (SELECT COUNT(1) FROM order_photos p WHERE p.order_id = o.id) AS photos_count
      FROM orders o
      ${where}
      ${orderBy}
      `,
      ...params
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
    res.write('\uFEFF');

    const head = [
      'id',
      'created_at',
      'status',
      'email',
      'name',
      'phone',
      'subtotal_pln',
      'photos_count',
    ];
    res.write(head.join(',') + '\r\n');

    for (const r of rows) {
      const line = [
        r.id,
        r.created_at,
        r.status,
        r.email || '',
        r.name || '',
        r.phone || '',
        ((r.subtotal || 0) / 100).toFixed(2),
        r.photos_count || 0,
      ]
        .map((v) => {
          const s = String(v ?? '');
          if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
          return s;
        })
        .join(',');
      res.write(line + '\r\n');
    }
    res.end();
  } catch (e) {
    console.error('GET /api/admin/orders.csv error:', e);
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

// ----------------------------------------------------
// ADMIN — szczegóły zamówienia
// GET /api/orders/:id
// ----------------------------------------------------
app.get('/api/orders/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const order = await db.get('SELECT * FROM orders WHERE id = ?', id);
    if (!order) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Order not found' });
    }
    const items = await db.all('SELECT * FROM order_items WHERE order_id = ? ORDER BY id', id);
    const photos = await db.all('SELECT * FROM order_photos WHERE order_id = ? ORDER BY id', id);
    res.json({ order, items, photos });
  } catch (err) {
    console.error('GET /api/orders/:id error:', err);
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

// ----------------------------------------------------
// ZIP: wszystkie zdjęcia z zamówienia — nazwy z klientem
// GET /api/admin/orders/:id/photos.zip
// ----------------------------------------------------
app.get('/api/admin/orders/:id/photos.zip', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const ord = await db.get('SELECT name FROM orders WHERE id = ?', id);
    const clientSafe = safeFilename(ord?.name || 'klient');

    const photos = await db.all(
      'SELECT filename, original_name FROM order_photos WHERE order_id = ? ORDER BY id',
      id
    );

    if (!photos || photos.length === 0) {
      return res.status(404).json({ error: 'NO_PHOTOS' });
    }

    const zipName = `${clientSafe}-order-${id}-photos.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err) => {
      console.error('ZIP error:', err);
      try { res.status(500).end(); } catch (_) {}
    });
    archive.pipe(res);

    for (let i = 0; i < photos.length; i++) {
      const p = photos[i];
      const filePath = path.join(UPLOAD_DIR, p.filename);
      if (fs.existsSync(filePath)) {
        const base = safeFilename(p.original_name || p.filename);
        const numbered = String(i + 1).padStart(2, '0');
        const name = `${clientSafe}_${numbered}_${base}`;
        archive.file(filePath, { name });
      } else {
        console.warn('Missing file for ZIP:', filePath);
      }
    }

    archive.finalize();
  } catch (e) {
    console.error('GET /api/admin/orders/:id/photos.zip error:', e);
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

// ----------------------------------------------------
// PANEL ADMINA — HTML (bez kolumny ID, kolory statusów)
// ----------------------------------------------------
app.get('/admin', (_req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="pl">
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Panel admina — zamówienia</title>
<link rel="preconnect" href="/" />
<style>
  body{font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f6f7f9;margin:0}
  header{background:#fff;border-bottom:1px solid #e5e7eb;padding:12px 16px;display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap}
  main{max-width:1100px;margin:24px auto;padding:0 16px}
  table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden}
  th,td{padding:10px 12px;border-bottom:1px solid #eef0f3;font-size:14px;vertical-align:middle}
  th{background:#fafbfc;text-align:left;color:#374151}
  tr:hover{background:#fafafa}
  .controls{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  .pill{padding:2px 10px;border-radius:999px;font-size:12px;border:1px solid #e5e7eb;background:#fafbfc;color:#374151;text-transform:capitalize}
  .pill.pending{background:#e0f2fe;border-color:#bae6fd;color:#075985}
  .pill.in_progress{background:#fef9c3;border-color:#fde68a;color:#92400e}
  .pill.fulfilled{background:#dcfce7;border-color:#bbf7d0;color:#065f46}
  .pill.cancelled{background:#fee2e2;border-color:#fecaca;color:#991b1b}
  .row-actions{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
  .btn{height:32px;padding:0 10px;border:1px solid #e5e7eb;background:#fff;border-radius:8px;cursor:pointer}
  .btn.primary{background:#2563eb;color:#fff;border-color:#2563eb}
  .btn.secondary{background:#0f766e;color:#fff;border-color:#0f766e}
  input[type=text], input[type=date], select{height:32px;padding:0 10px;border:1px solid #e5e7eb;border-radius:8px}
  .overlay{position:fixed;inset:0;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;z-index:50}
  .modal{background:#fff;max-width:90vw;max-height:90vh;width:1000px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.25);display:flex;flex-direction:column}
  .modal-header{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid #e5e7eb}
  .modal-body{padding:12px;overflow:auto}
  .thumbs{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px}
  .thumb{border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;background:#fafafa}
  .thumb img{display:block;width:100%;height:140px;object-fit:cover}
  .thumb .cap{font-size:12px;color:#374151;padding:6px 8px;display:flex;justify-content:space-between;gap:6px;align-items:center}
  .pager{display:flex;gap:8px;align-items:center;justify-content:flex-end;margin-top:10px}
</style>
<body>
<header>
  <div class="controls">
    <strong>Panel admina</strong>
    <span class="pill" id="status">brak tokenu</span>
    <button id="setToken" class="btn">Ustaw token</button>
    <button id="refresh" class="btn">Odśwież</button>
    <button id="exportCsv" class="btn secondary">Eksport CSV</button>
  </div>
  <div class="controls">
    <label>Filtr: <input id="q" type="text" placeholder="szukaj po email / imię" /></label>
    <label>Od: <input id="from" type="date" /></label>
    <label>Do: <input id="to" type="date" /></label>
    <label>Sortuj:
      <select id="sortBy">
        <option value="created_at">data</option>
        <option value="status">status</option>
        <option value="subtotal">kwota</option>
        <option value="email">email</option>
        <option value="name">imię</option>
        <option value="photos_count">zdjęcia</option>
      </select>
      <select id="sortDir">
        <option value="desc">malejąco</option>
        <option value="asc">rosnąco</option>
      </select>
    </label>
    <label>Na stronę:
      <select id="pageSize">
        <option>10</option><option selected>20</option><option>50</option><option>100</option>
      </select>
    </label>
  </div>
</header>
<main>
  <table id="tbl">
    <thead>
      <tr>
        <th>Data</th>
        <th>Status</th>
        <th>Klient</th>
        <th>E-mail</th>
        <th>Kwota</th>
        <th>Akcje</th>
      </tr>
    </thead>
    <tbody id="rows"><tr><td colspan="6">Ładowanie…</td></tr></tbody>
  </table>
  <div class="pager">
    <button id="prev" class="btn">◀</button>
    <span id="pageInfo">Strona 1/1</span>
    <button id="next" class="btn">▶</button>
  </div>
</main>
<script src="/admin.js" defer></script>
</body>
</html>`);
});

// ----------------------------------------------------
// PANEL ADMINA — JS (fallback POST /status gdy PATCH się nie powiedzie)
// ----------------------------------------------------
app.get('/admin.js', (_req, res) => {
  res.type('application/javascript').send(
`const API=location.origin;
const statuses=['pending','in_progress','fulfilled','cancelled'];

const state = {
  q: '',
  from: '',
  to: '',
  sortBy: 'created_at',
  sortDir: 'desc',
  page: 1,
  pageSize: 20,
  total: 0,
};

function statusClass(s){
  switch(String(s||'').toLowerCase()){
    case 'pending': return 'pending';
    case 'in_progress': return 'in_progress';
    case 'fulfilled': return 'fulfilled';
    case 'cancelled': return 'cancelled';
    default: return '';
  }
}

function getToken(){ return localStorage.getItem('ADMIN_TOKEN') || ''; }
function setToken(t){ localStorage.setItem('ADMIN_TOKEN', t); updateBadge(); }
function updateBadge(){ document.getElementById('status').textContent = getToken() ? 'token ustawiony' : 'brak tokenu'; }
updateBadge();

const $ = (id)=>document.getElementById(id);

$('setToken').onclick = () => {
  const t = prompt('Wklej ADMIN_TOKEN (.env na backendzie):', getToken());
  if (t !== null) setToken(t.trim());
};
$('refresh').onclick = () => { state.page = 1; load(); };
$('exportCsv').onclick = exportCsv;

$('q').addEventListener('input', (e) => { state.q = e.target.value; state.page = 1; debounceLoad(); });
$('from').addEventListener('change', (e) => { state.from = e.target.value; state.page = 1; load(); });
$('to').addEventListener('change', (e) => { state.to = e.target.value; state.page = 1; load(); });
$('sortBy').addEventListener('change', (e) => { state.sortBy = e.target.value; state.page = 1; load(); });
$('sortDir').addEventListener('change', (e) => { state.sortDir = e.target.value; state.page = 1; load(); });
$('pageSize').addEventListener('change', (e) => { state.pageSize = parseInt(e.target.value,10)||20; state.page = 1; load(); });

$('prev').onclick = () => { if (state.page>1){ state.page--; load(); } };
$('next').onclick = () => {
  const pages = Math.max(1, Math.ceil(state.total / state.pageSize));
  if (state.page < pages){ state.page++; load(); }
};

let _t;
function debounceLoad(){ clearTimeout(_t); _t = setTimeout(load, 250); }

function qs(){
  const p = new URLSearchParams();
  if (state.q) p.set('q', state.q);
  if (state.from) p.set('from', state.from);
  if (state.to) p.set('to', state.to);
  p.set('sort_by', state.sortBy);
  p.set('sort_dir', state.sortDir);
  p.set('page', String(state.page));
  p.set('page_size', String(state.pageSize));
  return p.toString();
}

async function load(){
  const token = getToken();
  const rowsEl = $('rows');
  rowsEl.innerHTML = '<tr><td colspan="6">Ładowanie…</td></tr>';
  if (!token){ rowsEl.innerHTML = '<tr><td colspan="6">Ustaw token.</td></tr>'; return; }
  try{
    const res = await fetch(API + '/api/admin/orders?' + qs(), { headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' } });
    if (!res.ok){ throw new Error('HTTP '+res.status); }
    const data = await res.json();
    window.__orders = data.items || [];
    state.total = data.total || 0;
    render(window.__orders);
    const pages = Math.max(1, Math.ceil(state.total / state.pageSize));
    $('pageInfo').textContent = 'Strona ' + state.page + '/' + pages;
    $('prev').disabled = state.page <= 1;
    $('next').disabled = state.page >= pages;
  }catch(e){
    rowsEl.innerHTML = '<tr><td colspan="6">Błąd pobierania: '+(e.message||e)+'</td></tr>';
  }
}

function render(items){
  const rowsEl = $('rows');
  if (!items.length){ rowsEl.innerHTML = '<tr><td colspan="6">Brak wyników.</td></tr>'; return; }

  rowsEl.innerHTML = '';
  for (const r of items){
    const tr = document.createElement('tr');
    const dt = new Date(r.created_at).toLocaleString('pl-PL');
    const amount = (r.subtotal || 0) / 100;

    tr.innerHTML =
      '<td>'+dt+'</td>' +
      '<td><span class="pill '+statusClass(r.status)+'">'+r.status+'</span></td>' +
      '<td>'+(r.name || '—')+'</td>' +
      '<td>'+(r.email || '—')+'</td>' +
      '<td>'+amount.toLocaleString('pl-PL',{style:'currency',currency:'PLN'})+'</td>' +
      '<td class="row-actions"></td>';

    const act = tr.querySelector('.row-actions');

    const photosBtn = document.createElement('button');
    photosBtn.className = 'btn';
    photosBtn.textContent = 'Zdjęcia (' + (r.photos_count || 0) + ')';
    photosBtn.onclick = () => openPhotos(r.id);

    const zipBtn = document.createElement('button');
    zipBtn.className = 'btn';
    zipBtn.textContent = 'Pobierz zdjęcia (.zip)';
    zipBtn.onclick = () => downloadZip(r.id);

    const sel = document.createElement('select');
    for (const s of statuses){
      const opt = document.createElement('option');
      opt.value = s; opt.textContent = s;
      if (s === r.status) opt.selected = true;
      sel.appendChild(opt);
    }

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn primary';
    saveBtn.textContent = 'Zapisz';
    saveBtn.onclick = async () => {
      saveBtn.disabled = true;
      try{
        const payload = JSON.stringify({ status: sel.value });
        // 1) próbuj PATCH
        let res = await fetch(API + '/api/admin/orders/' + r.id, {
          method: 'PATCH',
          headers: {
            'Authorization': 'Bearer ' + getToken(),
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: payload
        });
        if (!res.ok){
          // 2) fallback: POST /status
          res = await fetch(API + '/api/admin/orders/' + r.id + '/status', {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + getToken(),
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: payload
          });
        }
        const data = await res.json().catch(()=>({}));
        if (!res.ok) throw new Error(data.error || ('HTTP '+res.status));
        await load();
      }catch(e){ alert('Błąd: ' + (e.message || e)); }
      finally{ saveBtn.disabled = false; }
    };

    act.appendChild(photosBtn);
    act.appendChild(zipBtn);
    act.appendChild(sel);
    act.appendChild(saveBtn);

    rowsEl.appendChild(tr);
  }
}

async function openPhotos(id){
  const token = getToken();
  if (!token) return alert('Ustaw token.');
  try{
    const res = await fetch(API + '/api/orders/' + id, { headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' } });
    const data = await res.json().catch(()=>({}));
    if (!res.ok) throw new Error(data.error || ('HTTP '+res.status));
    const photos = (data.photos || []);
    showPhotosModal(id, photos);
  }catch(e){ alert('Błąd pobierania zdjęć: ' + (e.message||e)); }
}

function showPhotosModal(id, photos){
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.tabIndex = -1;

  const modal = document.createElement('div');
  modal.className = 'modal';

  const head = document.createElement('div');
  head.className = 'modal-header';
  head.innerHTML = '<strong>Zdjęcia — ' + id + '</strong>';
  const close = document.createElement('button');
  close.className = 'btn';
  close.textContent = 'Zamknij';
  close.onclick = () => document.body.removeChild(overlay);
  head.appendChild(close);

  const body = document.createElement('div');
  body.className = 'modal-body';

  if (!photos.length){
    body.innerHTML = '<div>Brak zdjęć w tym zamówieniu.</div>';
  }else{
    const grid = document.createElement('div');
    grid.className = 'thumbs';
    for (const p of photos){
      const card = document.createElement('div');
      card.className = 'thumb';
      const img = document.createElement('img');
      img.src = '/uploads/' + p.filename;
      img.alt = p.original_name || p.filename;
      img.loading = 'lazy';
      img.onclick = () => window.open(img.src, '_blank');

      const cap = document.createElement('div');
      cap.className = 'cap';
      const nameSpan = document.createElement('span');
      nameSpan.textContent = (p.original_name || p.filename);
      nameSpan.title = nameSpan.textContent;
      nameSpan.style.whiteSpace = 'nowrap';
      nameSpan.style.overflow = 'hidden';
      nameSpan.style.textOverflow = 'ellipsis';

      const link = document.createElement('a');
      link.href = img.src;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = 'Otwórz';

      cap.appendChild(nameSpan);
      cap.appendChild(link);

      card.appendChild(img);
      card.appendChild(cap);
      grid.appendChild(card);
    }
    body.appendChild(grid);
  }

  modal.appendChild(head);
  modal.appendChild(body);
  overlay.appendChild(modal);
  overlay.onclick = (e) => { if (e.target === overlay) document.body.removeChild(overlay); };
  document.addEventListener('keydown', escClose);
  function escClose(ev){ if (ev.key === 'Escape'){ try{ document.body.removeChild(overlay); }catch(_){} document.removeEventListener('keydown', escClose); } }
  document.body.appendChild(overlay);
  overlay.focus();
}

async function exportCsv(){
  const token = getToken();
  if (!token) return alert('Ustaw token.');
  try{
    const res = await fetch(API + '/api/admin/orders.csv?' + qs(), { headers: { 'Authorization': 'Bearer ' + token } });
    if (!res.ok) throw new Error('HTTP '+res.status);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
    a.href = url; a.download = 'orders-' + ts + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }catch(e){ alert('Błąd eksportu: ' + (e.message||e)); }
}

async function downloadZip(id){
  const token = getToken();
  if (!token) return alert('Ustaw token.');
  try{
    const res = await fetch(API + '/api/admin/orders/' + id + '/photos.zip', { headers: { 'Authorization': 'Bearer ' + token } });
    if (!res.ok) throw new Error('HTTP '+res.status);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const cd = res.headers.get('Content-Disposition') || '';
    const m = cd.match(/filename="([^"]+)"/i);
    const fname = m ? m[1] : ('order-' + id + '-photos.zip');

    const a = document.createElement('a');
    a.href = url;
    a.download = fname;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }catch(e){ alert('Błąd pobierania ZIP: ' + (e.message||e)); }
}

load();
`
  );
});

// ----------------------------------------------------
// ADMIN — zmiana statusu (PATCH or POST fallback)
// PATCH /api/admin/orders/:id   body: { status }
// POST  /api/admin/orders/:id/status  body: { status }
// ----------------------------------------------------
async function updateOrderStatusHandler(req, res) {
  const { id } = req.params;
  const { status } = req.body || {};

  const ALLOWED = new Set(['pending', 'in_progress', 'fulfilled', 'cancelled']);
  if (!ALLOWED.has(String(status))) {
    return res.status(400).json({ error: 'INVALID_STATUS', allowed: Array.from(ALLOWED) });
  }

  try {
    const existing = await db.get(
      `SELECT id, email, public_token, created_at, subtotal
       FROM orders
       WHERE id = ?`,
      id
    );
    if (!existing) return res.status(404).json({ error: 'NOT_FOUND' });

    await db.run(`UPDATE orders SET status = ? WHERE id = ?`, status, id);

    const base =
      process.env.PUBLIC_STATUS_BASE || `${req.protocol}://${req.get('host')}/public/orders`;
    const status_url = `${base}/${id}?token=${existing.public_token}`;

    if (existing.email) {
      try {
        await sendStatusUpdate(existing.email, {
          ...existing,
          status,
          status_url,
        });
      } catch (mailErr) {
        console.error('MAIL_ERROR (status update):', mailErr);
      }
    }

    return res.json({ ok: true, order: { id, status }, status_url });
  } catch (e) {
    console.error('[STATUS_UPDATE_ERROR]', e);
    return res.status(500).json({ error: 'SERVER_ERROR' });
  }
}

app.patch('/api/admin/orders/:id', requireAdmin, updateOrderStatusHandler);
app.post('/api/admin/orders/:id/status', requireAdmin, updateOrderStatusHandler);

// ----------------------------------------------------
// Inne trasy API
// ----------------------------------------------------
const createOrderLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'RATE_LIMITED', retry_after: 300 },
});

app.use('/api', buildMiscRouter());
app.use('/api/orders', createOrderLimiter, buildOrdersRouter(db, UPLOAD_DIR));
app.use('/api/payments', buildPaymentsRouter(db, STRIPE_SECRET_KEY));

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Start
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
  console.log(`CORS allowed origin: ${CLIENT_URL}`);
});

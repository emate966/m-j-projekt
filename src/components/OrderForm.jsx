import { useEffect, useRef, useState } from 'react';

const API_BASE = import.meta.env.VITE_API ?? 'http://localhost:8000';

export default function OrderForm() {
  // 2A) Stan na nowo otrzymany link + ostatni zapisany link
  const [statusUrl, setStatusUrl] = useState(null);
  const [lastUrl, setLastUrl] = useState(() => localStorage.getItem('lastOrderStatusUrl'));

  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef(null);

  // (opcjonalne) odśwież baner ostatniego linku przy montażu
  useEffect(() => {
    const saved = localStorage.getItem('lastOrderStatusUrl');
    if (saved) setLastUrl(saved);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setMessage('');
    setStatusUrl(null);

    try {
      const form = e.currentTarget;
      const hasFileInput = form.querySelector('input[type="file"]');
      let res;

      if (hasFileInput) {
        // multipart/form-data (z plikami)
        const fd = new FormData(form);
        res = await fetch(`${API_BASE}/api/orders`, { method: 'POST', body: fd });
      } else {
        // JSON (bez plików)
        const fd = new FormData(form);
        const payload = Object.fromEntries(fd.entries());
        res = await fetch(`${API_BASE}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      const su = data.status_url ?? null;
      setMessage('Dziękujemy! Zamówienie zostało przesłane. Sprawdź status lub e-mail.');

      // 2B) Zapamiętanie i zapis do localStorage
      if (su) {
        setStatusUrl(su);
        setLastUrl(su);
        localStorage.setItem('lastOrderStatusUrl', su);
      }

      form.reset();
    } catch (err) {
      setMessage(`Błąd: ${err?.message || 'Nie udało się złożyć zamówienia.'}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} ref={formRef}>
      {/* 2D) Baner z ostatnim linkiem do statusu (opcjonalny) */}
      {lastUrl && (
        <div
          style={{
            marginBottom: 12,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #bfdbfe',
            background: '#eff6ff',
            fontSize: 14,
          }}
        >
          Ostatnie zamówienie:{' '}
          <a href={lastUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>
            zobacz status
          </a>
        </div>
      )}

      {/* Pola formularza – dopasuj do swoich potrzeb */}
      <div>
        <label>
          Imię i nazwisko
          <br />
          <input name="name" required />
        </label>
      </div>

      <div>
        <label>
          E-mail
          <br />
          <input type="email" name="email" required />
        </label>
      </div>

      <div>
        <label>
          Telefon
          <br />
          <input name="phone" />
        </label>
      </div>

      <div>
        <label>
          Adres
          <br />
          <textarea name="address" rows="3" />
        </label>
      </div>

      <div>
        <label>
          Uwagi
          <br />
          <textarea name="notes" rows="3" />
        </label>
      </div>

      <div>
        <label>
          Zdjęcia (opcjonalnie)
          <br />
          <input type="file" name="photos" multiple accept="image/jpeg,image/png,image/webp" />
        </label>
      </div>

      <button type="submit" disabled={submitting} style={{ marginTop: 8 }}>
        {submitting ? 'Wysyłanie…' : 'Wyślij zamówienie'}
      </button>

      {/* Komunikaty */}
      {message && <p style={{ marginTop: 10 }}>{message}</p>}

      {/* 2C) Przycisk do statusu po sukcesie */}
      {statusUrl && (
        <a
          href={statusUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            marginTop: 8,
            padding: '8px 12px',
            borderRadius: 6,
            background: '#2563eb',
            color: '#fff',
            textDecoration: 'none',
          }}
        >
          Zobacz status zamówienia
        </a>
      )}
    </form>
  );
}

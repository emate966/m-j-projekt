# Figurki Backend MVP (Express + SQLite)

Minimalny backend do Twojego sklepu z figurkami personalizowanymi.

## 1) Instalacja

```bash
cd backend-mvp
cp .env.example .env
npm install
npm run dev
```

- Edytuj `.env`:
  - `CLIENT_URL` ustaw na origin frontendu,
  - opcjonalnie uzupełnij klucze Stripe później.

## 2) Endpointy (MVP)

- `POST /api/orders` – przyjęcie zamówienia (multipart/form-data).
  - Pola: `name, email, phone, address, notes, cart (JSON)`, pliki pod kluczem `photos`.
  - Zwraca: `{ ok: true, orderId }`.

- `GET /api/orders/:id` – szczegóły zamówienia.

- `GET /api/orders/admin/list` oraz `GET /api/admin/orders` – lista zamówień (JSON).

- `POST /api/contact` – prosty kontakt (200 OK).

- `POST /api/payments/session` – (opcjonalnie, po konfiguracji Stripe) utworzenie sesji płatności.

## 3) Upload plików

- Pliki zapisywane do folderu `uploads/`.
- Limit 10 MB / plik, max 30 plików, typy: JPEG / PNG / WEBP.
- Dostępne pod URL: `/uploads/<filename>`.

## 4) Połączenie z frontendem

- W pliku frontendu ustaw `VITE_API_URL` na adres backendu, np. `http://localhost:8000`.
- Formularz `OrderForm` już jest kompatybilny (wysyła FormData na `/api/orders`).

## 5) Płatności (Stripe) – później

- Uzupełnij `STRIPE_SECRET_KEY` i `STRIPE_WEBHOOK_SECRET` w `.env`.
- Wywołuj z frontu `POST /api/payments/session` z `{ orderId }` i przekieruj na `url` z odpowiedzi.

## 6) Uwierzytelnianie admina (na później)

- Na MVP endpointy admina są otwarte. Przed produkcją dodaj auth (np. Basic Auth / JWT) i CORS tylko dla panelu.

---

Powodzenia! 🚀

import express from 'express';
const router = express.Router();

export function buildMiscRouter() {
  // Prosty endpoint kontaktu, zgodny z Twoim frontem
  router.post('/contact', async (req, res) => {
    try {
      const { email, message } = req.body || {};
      if (!email || !message) return res.status(400).json({ error: 'Brak email lub message.' });
      // TODO: wysyłka maila / zapis do CRM – na razie tylko OK
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: 'Błąd wysyłki wiadomości.' });
    }
  });

  router.get('/health', (_req, res) => res.json({ ok: true }));
  return router;
}

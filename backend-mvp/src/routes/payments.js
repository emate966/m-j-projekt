// src/routes/payments.js
import express from 'express';
import Stripe from 'stripe';

export function buildPaymentsRouter(db, STRIPE_SECRET_KEY) {
  const router = express.Router();

  // ⬇️ ważne: klucz trymujemy, żeby wyciąć spacje/znaki końca linii
  const KEY = String(STRIPE_SECRET_KEY || '').trim();
  const USING_STRIPE = !!KEY;

  // ===== DIAGNOSTYKA =====
  router.get('/config', (req, res) => {
    const clientUrl =
      process.env.CLIENT_URL ||
      `${req.protocol}://${req.get('host')}`;
    res.json({
      mode: USING_STRIPE ? 'stripe' : 'mock',
      client_url: clientUrl,
      stripe_key_present: USING_STRIPE,
      // bezpieczny podgląd (pierwsze 7, ostatnie 4)
      key_preview: USING_STRIPE ? `${KEY.slice(0,7)}…${KEY.slice(-4)}` : null,
    });
  });

  // szybki test klucza: zwraca ID konta lub błąd
  router.get('/diag', async (req, res) => {
    if (!USING_STRIPE) {
      return res.json({ ok: false, mode: 'mock', error: 'NO_SECRET_KEY' });
    }
    try {
      const stripe = new Stripe(KEY);
      // prosta operacja autoryzacyjna
      const acct = await stripe.accounts.retrieve();
      return res.json({
        ok: true,
        account_id: acct?.id || null,
        details_submitted: acct?.details_submitted ?? null,
      });
    } catch (e) {
      return res.status(400).json({
        ok: false,
        error: 'INVALID_API_KEY',
        error_verbose: e?.message || String(e),
      });
    }
  });

  // Kalkulacja PLN -> grosze
  function calcUnitAmountGrosze(item) {
    const productId = String(item?.product_id || '').trim();
    const options = item?.options || {};
    const isPremium = productId === 'premium';

    const base =
      isPremium ? 550 :
      (productId === 'standard' ? 349 : 199);

    const sizeCm = String(options.sizeCm || '15');
    const sizeSurcharge = sizeCm === '18' ? 40 : sizeCm === '23' ? 80 : 0;

    let persons = isPremium
      ? Number(options.persons ?? 3)
      : (productId === 'standard' ? 2 : 1);
    if (!Number.isFinite(persons) || persons < 1) persons = isPremium ? 3 : (productId === 'standard' ? 2 : 1);
    if (isPremium) persons = Math.min(Math.max(persons, 3), 10);

    const bobble = Boolean(options.bobble);
    const personsSurcharge = isPremium ? Math.max(0, persons - 3) * 150 : 0;
    const bobbleSurcharge = bobble
      ? ((isPremium || productId === 'standard') ? 50 * persons : 50)
      : 0;

    const unitPLN = base + sizeSurcharge + personsSurcharge + bobbleSurcharge;
    return Math.round(unitPLN * 100);
  }

  // ===== CHECKOUT SESSION =====
  router.post('/checkout/session', async (req, res) => {
    const isProd = process.env.NODE_ENV === 'production';

    try {
      const { items = [], order_id = null, last_status_url = null } = req.body || {};

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          error: 'EMPTY_ITEMS',
          ...(isProd ? {} : { error_verbose: 'Brak pozycji w koszyku.' }),
        });
      }

      // Tryb MOCK, gdy brak klucza
      if (!USING_STRIPE) {
        const origin = process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`;
        const mockUrl = `${origin}/success?mock=1`;
        console.log('[payments][mock] →', mockUrl);
        return res.json({ url: mockUrl });
      }

      const stripe = new Stripe(KEY);

      const line_items = items.map((it, idx) => {
        const product_id = String(it?.product_id || '').trim();
        if (!['mini', 'standard', 'premium'].includes(product_id)) {
          throw new Error(`INVALID_PRODUCT_ID at index ${idx}`);
        }
        const qty = Number(it?.qty || 1);
        if (!Number.isFinite(qty) || qty < 1) {
          throw new Error(`INVALID_QTY at index ${idx}`);
        }
        const unit_amount = calcUnitAmountGrosze(it);
        if (!Number.isFinite(unit_amount) || unit_amount <= 0) {
          throw new Error(`INVALID_PRICE_CALC at index ${idx}`);
        }
        const name =
          `Figurka ${product_id} ${(it?.options?.sizeCm || '15')}cm` +
          (it?.options?.bobble ? ' + kiwająca' : '');

        return {
          price_data: {
            currency: 'pln',
            unit_amount,
            product_data: { name },
          },
          quantity: qty,
        };
      });

      const clientBase = process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`;
      const success_url = `${clientBase}/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancel_url  = `${clientBase}/cancel`;

      console.log('[payments] creating session:', {
        items: items.length,
        success_url,
        cancel_url,
        order_id: order_id || null,
        last_status_url: last_status_url || null,
      });

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items,
        success_url,
        cancel_url,
        metadata: {
          order_id: order_id ? String(order_id) : '',
          last_status_url: last_status_url || '',
        },
      });

      console.log('[payments] session created →', session?.id);
      return res.json({ url: session.url });
    } catch (e) {
      const verbose =
        e?.message ||
        e?.raw?.message ||
        e?.toString?.() ||
        'Unknown error';
      console.error('POST /api/payments/checkout/session error:', verbose);
      return res.status(500).json({
        error: 'Nie udało się utworzyć sesji płatności.',
        ...(process.env.NODE_ENV === 'production' ? {} : { error_verbose: verbose }),
      });
    }
  });

  return router;
}

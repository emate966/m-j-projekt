// src/services/mail.js
import nodemailer from 'nodemailer';

function getTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }

  // DEV fallback — log do konsoli zamiast wysyłki
  return {
    sendMail: async (opts) => {
      console.log('[MAIL:DEV_FALLBACK] >>>');
      console.log(JSON.stringify(opts, null, 2));
      console.log('<<< [MAIL:DEV_FALLBACK]');
      return { messageId: 'dev-fallback' };
    }
  };
}

const transporter = getTransport();

function renderOrderHtml(order, items = []) {
  const lines = items.map(
    it => `<li>${it.title ?? 'Produkt'} × ${it.qty ?? 1} — ${(it.unit_price ?? 0)/100} PLN</li>`
  ).join('');

  return `
    <div style="font-family: Arial, sans-serif; line-height:1.5">
      <h2>Dziękujemy za zamówienie #${order.id}</h2>
      <p>Status: <b>${order.status}</b></p>
      <p>Data: ${order.created_at}</p>
      ${items.length ? `<h3>Pozycje</h3><ul>${lines}</ul>` : ''}
      <p>Kwota (subtotal): <b>${(order.subtotal ?? 0)/100} PLN</b></p>
      <hr/>
      <p>Imię i nazwisko: ${order.name ?? '-'}</p>
      <p>E-mail: ${order.email ?? '-'}</p>
      <p>Telefon: ${order.phone ?? '-'}</p>
      <p>Adres: ${order.address ?? '-'}</p>
      ${order.notes ? `<p>Uwagi: ${order.notes}</p>` : ''}
    </div>
  `;
}

export async function sendOrderConfirmation(to, order, items = []) {
  const from = process.env.MAIL_FROM || 'no-reply@example.com';
  const html = renderOrderHtml(order, items);

  await transporter.sendMail({
    from,
    to,
    subject: `Potwierdzenie zamówienia #${order.id}`,
    html,
  });
}

export async function sendAdminCopy(order, items = []) {
  const to = process.env.MAIL_ADMIN;
  if (!to) return;

  const from = process.env.MAIL_FROM || 'no-reply@example.com';
  const html = renderOrderHtml(order, items);

  await transporter.sendMail({
    from,
    to,
    subject: `NOWE zamówienie #${order.id} (${order.email ?? '-'})`,
    html,
  });
}

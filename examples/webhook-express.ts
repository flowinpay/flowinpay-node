import express from 'express';
import { parseWebhookEvent } from 'flowinpay';

// Exemplo: receber e validar webhooks da FlowinPay com Express.
// Rode com: FLOWINPAY_WEBHOOK_SECRET=whsec_... npx tsx examples/webhook-express.ts

const app = express();
const SECRET = process.env.FLOWINPAY_WEBHOOK_SECRET!;

// IMPORTANTE: express.raw preserva o corpo bruto, necessário para validar a assinatura.
app.post('/webhooks/flowinpay', express.raw({ type: 'application/json' }), (req, res) => {
  let payload;
  try {
    payload = parseWebhookEvent(req.body, {
      signature: req.header('X-FlowinPay-Signature'),
      secret: SECRET,
    });
  } catch {
    return res.status(401).send('assinatura inválida');
  }

  // Responda rápido — o timeout do webhook é de 5 segundos.
  res.sendStatus(200);

  switch (payload.event) {
    case 'charge.completed':
      console.log('✅ Pago:', payload.charge?.correlation_id);
      break;
    case 'charge.expired':
      console.log('⏰ Expirou:', payload.charge?.correlation_id);
      break;
    case 'withdrawal.completed':
      console.log('💸 Saque concluído:', payload.withdrawal?.id);
      break;
    default:
      console.log('Evento:', payload.event);
  }
});

app.listen(3000, () => console.log('Ouvindo webhooks em http://localhost:3000'));

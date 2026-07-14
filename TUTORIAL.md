# Receba PIX com split automático em Node.js em 5 minutos

Neste tutorial você vai criar uma cobrança PIX, dividir o valor automaticamente com um
coprodutor (split) e liberar o produto quando o pagamento for confirmado — tudo com o
SDK oficial da [FlowinPay](https://app.flowinpay.com.br).

## Pré-requisitos

- Node.js 18 ou superior
- Uma conta na FlowinPay com KYC aprovado
- Uma **App ID** (chave de API) — gere no painel em **Integrações → API Keys** com os
  escopos `charge:create`, `webhook:create` e `balance:read`

## 1. Instale o SDK

```bash
npm install flowinpay
```

## 2. Crie uma cobrança com split

```ts
import { FlowinPay } from 'flowinpay';

const fp = new FlowinPay({ apiKey: process.env.FLOWINPAY_API_KEY! });

const { charge } = await fp.charges.create({
  value: 100,                 // R$ 100,00
  description: 'Mentoria Pro',
  callbackUrl: 'https://seusite.com/webhooks/flowinpay',
  split: [
    // O coprodutor recebe 10% (R$ 10). A taxa da FlowinPay (2% + R$ 1) sai primeiro.
    { type: 'percentage', value: 10, recipient: 'PUBLIC_ID_DO_COPRODUTOR' },
  ],
});

console.log('Copia-e-cola:', charge.br_code);
console.log('Link de pagamento:', charge.payment_link_url);
```

Exiba o `br_code` (copia-e-cola) ou o QR Code (`charge.qr_code_image`) para o cliente.
Numa cobrança de R$ 100: **taxa R$ 3 · coprodutor R$ 10 · você fica com R$ 87** — o crédito
cai direto no saldo de cada um quando o PIX é confirmado.

> O `PUBLIC_ID` do recebedor fica no painel dele em **Minha Conta → "ID de recebedor (Split)"**.

## 3. Seja avisado do pagamento (webhook)

Registre uma vez o endpoint que vai receber os eventos:

```ts
const { webhook } = await fp.webhooks.create({
  url: 'https://seusite.com/webhooks/flowinpay',
  events: ['charge.completed'],
});
// Guarde webhook.secret (whsec_...) — só aparece agora.
```

E no seu servidor, valide a assinatura e libere o produto:

```ts
import express from 'express';
import { parseWebhookEvent } from 'flowinpay';

const app = express();

app.post('/webhooks/flowinpay', express.raw({ type: 'application/json' }), (req, res) => {
  let payload;
  try {
    payload = parseWebhookEvent(req.body, {
      signature: req.header('X-FlowinPay-Signature'),
      secret: process.env.FLOWINPAY_WEBHOOK_SECRET!,
    });
  } catch {
    return res.status(401).send('assinatura inválida');
  }

  res.sendStatus(200); // responda em até 5 segundos

  if (payload.event === 'charge.completed') {
    console.log('Pagamento confirmado!', payload.charge?.correlation_id);
    // 👉 aqui você libera o acesso / envia o produto
  }
});

app.listen(3000);
```

## 4. Consulte saldo e saque

```ts
const { balance } = await fp.balance.get();
console.log('Disponível:', balance.available);

await fp.withdrawals.create({
  value: 50,
  pixKey: 'voce@email.com',
  pixKeyType: 'email',
});
```

Pronto — você recebeu PIX, dividiu automaticamente e liberou o produto na confirmação.
Documentação completa em https://app.flowinpay.com.br/docs.

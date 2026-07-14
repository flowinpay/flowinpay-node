# FlowinPay — SDK Node.js / TypeScript

SDK oficial da [FlowinPay](https://app.flowinpay.com.br) — gateway de pagamentos **PIX** brasileiro com **split automático**, saque na hora, checkout e webhooks assinados.

- ⚡ Cobranças PIX instantâneas (QR Code + copia-e-cola) em uma chamada
- 🔀 Split de pagamento (porcentagem ou valor fixo) entre até 3 recebedores
- 💸 Saques via PIX (cash out)
- 🔒 Verificação de assinatura de webhook (HMAC-SHA256)
- 📦 Zero dependências, TypeScript nativo, ESM + CommonJS

## Instalação

```bash
npm install flowinpay
```

Requer **Node.js 18+** (usa `fetch` nativo).

## Início rápido

```ts
import { FlowinPay } from 'flowinpay';

const fp = new FlowinPay({ apiKey: 'fpk_sua_chave_aqui' });

// Cria uma cobrança PIX de R$ 100 com split
const { charge } = await fp.charges.create({
  value: 100,
  description: 'Pedido #123',
  callbackUrl: 'https://seusite.com/webhooks/flowinpay',
  split: [
    { type: 'percentage', value: 10, recipient: 'PUBLIC_ID_DO_COPRODUTOR' },
  ],
});

console.log(charge.br_code);          // PIX copia-e-cola (exiba para o pagador)
console.log(charge.payment_link_url); // link de pagamento pronto
console.log(charge.qr_code_image);    // URL do QR Code
```

> A **App ID** (`fpk_...`) você gera no painel em **Integrações → API Keys**, com os escopos desejados.

## Cobranças

```ts
// Criar
const { charge } = await fp.charges.create({ value: 50, description: 'Curso' });

// Consultar
const { charge: c } = await fp.charges.get(charge.id);

// Listar
const { charges } = await fp.charges.list();

// Cancelar
await fp.charges.cancel(charge.id);
```

## Saldo e saques

```ts
// Saldo disponível / bloqueado / total
const { balance } = await fp.balance.get();
console.log(balance.available);

// Solicitar saque PIX
const { withdrawal } = await fp.withdrawals.create({
  value: 100,
  pixKey: 'voce@email.com',
  pixKeyType: 'email', // 'cpf' | 'cnpj' | 'email' | 'phone' | 'random'
});
```

## Webhooks

### Registrar um webhook

```ts
const { webhook } = await fp.webhooks.create({
  url: 'https://seusite.com/webhooks/flowinpay',
  events: ['charge.completed', 'charge.expired'],
});

// ⚠️ Guarde o secret — só é exibido nesta resposta:
console.log(webhook.secret); // whsec_...
```

### Verificar a assinatura (Express)

A FlowinPay assina cada webhook com `X-FlowinPay-Signature` = `HMAC-SHA256(corpo_bruto, secret)`.
**Use sempre o corpo bruto (raw body)** — não o JSON já parseado.

```ts
import express from 'express';
import { parseWebhookEvent } from 'flowinpay';

const app = express();
const SECRET = 'whsec_seu_secret';

// raw body é essencial para validar a assinatura
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

  res.sendStatus(200); // responda rápido (timeout de 5s)

  if (payload.event === 'charge.completed') {
    console.log('Pago!', payload.charge?.correlation_id);
    // ...libere o produto
  }
});
```

Eventos: `charge.created`, `charge.completed`, `charge.expired`, `charge.cancelled`, `charge.refunded`, `withdrawal.completed`, `withdrawal.failed`, `dispute.opened`, `dispute.accepted`, `dispute.rejected`, `dispute.cancelled`.

## Tratamento de erros

```ts
import { FlowinPayError } from 'flowinpay';

try {
  await fp.charges.create({ value: 1 }); // abaixo do mínimo
} catch (err) {
  if (err instanceof FlowinPayError) {
    console.log(err.status); // 422
    console.log(err.message); // mensagem da API
    console.log(err.errors);  // erros de validação por campo
  }
}
```

## Documentação

- Docs completos: https://app.flowinpay.com.br/docs
- Versão legível por IA: https://app.flowinpay.com.br/llms.txt

## Licença

MIT © FlowinPay

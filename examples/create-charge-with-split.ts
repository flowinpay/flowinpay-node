import { FlowinPay } from 'flowinpay';

// Exemplo: criar uma cobrança PIX de R$ 100 com split de 10% para um coprodutor.
// Rode com: FLOWINPAY_API_KEY=fpk_... npx tsx examples/create-charge-with-split.ts

const fp = new FlowinPay({ apiKey: process.env.FLOWINPAY_API_KEY! });

const { charge } = await fp.charges.create({
  value: 100,
  description: 'Pedido de exemplo',
  callbackUrl: 'https://seusite.com/webhooks/flowinpay',
  customerName: 'João Silva',
  customerEmail: 'joao@email.com',
  split: [{ type: 'percentage', value: 10, recipient: 'PUBLIC_ID_DO_COPRODUTOR' }],
});

console.log('Cobrança criada:', charge.id);
console.log('Copia-e-cola:', charge.br_code);
console.log('Link:', charge.payment_link_url);
console.log('Expira em:', charge.expires_at);

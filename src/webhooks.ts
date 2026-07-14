import { createHmac, timingSafeEqual } from 'node:crypto';
import type { WebhookPayload } from './types.js';

/**
 * Verifica a assinatura de um webhook da FlowinPay.
 *
 * A FlowinPay envia o header `X-FlowinPay-Signature` = HMAC-SHA256(corpo_bruto, secret)
 * em hexadecimal. Use SEMPRE o corpo BRUTO (raw body), não o JSON já parseado.
 *
 * @param rawBody  Corpo bruto da requisição (string ou Buffer).
 * @param signature Valor do header `X-FlowinPay-Signature`.
 * @param secret   Secret do webhook (`whsec_...`), obtido na criação.
 * @returns true se a assinatura é válida.
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signature: string | undefined | null,
  secret: string,
): boolean {
  if (!signature) return false;

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);

  // timingSafeEqual exige buffers de mesmo tamanho.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Faz o parse do payload do webhook. Se `secret` for informado, valida a
 * assinatura antes e lança um erro se for inválida.
 *
 * @throws Error se a assinatura for inválida (quando secret é informado).
 */
export function parseWebhookEvent(
  rawBody: string | Buffer,
  options?: { signature?: string | null; secret?: string },
): WebhookPayload {
  if (options?.secret) {
    const ok = verifyWebhookSignature(rawBody, options.signature ?? null, options.secret);
    if (!ok) throw new Error('FlowinPay: assinatura de webhook inválida.');
  }
  const text = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
  return JSON.parse(text) as WebhookPayload;
}

// Tipos da API FlowinPay v1. Campos de RESPOSTA seguem o formato da API (snake_case);
// os de ENTRADA usam camelCase e são mapeados internamente pelo SDK.

export interface FlowinPayOptions {
  /** Sua App ID (chave de API), formato `fpk_...`. */
  apiKey: string;
  /** Base URL da API. Padrão: https://app.flowinpay.com.br/api/v1 */
  baseUrl?: string;
  /** Timeout por requisição, em ms. Padrão: 30000. */
  timeoutMs?: number;
}

// ─── Split ───────────────────────────────────────────────────────────────────
export interface SplitItem {
  /** `percentage` (1 a 99) ou `fixed` (valor em reais). */
  type: 'percentage' | 'fixed';
  /** A porcentagem (se percentage) ou o valor em reais (se fixed). */
  value: number;
  /** `public_id` da conta FlowinPay que vai receber (painel → Minha Conta). */
  recipient: string;
}

// ─── Cobranças ───────────────────────────────────────────────────────────────
export interface CreateChargeInput {
  /** Valor em reais (mín R$ 2, máx R$ 150). */
  value: number;
  description?: string;
  /** URL para receber webhooks desta cobrança (cria o webhook automaticamente). */
  callbackUrl?: string;
  customerName?: string;
  customerEmail?: string;
  /** CPF/CNPJ do pagador. */
  customerTaxId?: string;
  customerPhone?: string;
  /** Divisão do pagamento entre até 3 recebedores. */
  split?: SplitItem[];
  /** Opcional — usa a adquirente padrão da conta se omitido. */
  acquirerId?: number;
}

export interface Charge {
  id: number;
  correlation_id: string;
  value: string;
  fee_value: string;
  status: string;
  br_code: string;
  qr_code_image: string;
  payment_link_url: string;
  expires_at: string;
  [key: string]: unknown;
}

export interface CreateChargeResponse {
  message: string;
  charge: Charge;
}

// ─── Saques ──────────────────────────────────────────────────────────────────
export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';

export interface CreateWithdrawalInput {
  /** Valor em reais (mín R$ 10). */
  value: number;
  /** Chave PIX de destino. */
  pixKey: string;
  pixKeyType: PixKeyType;
  description?: string;
}

export interface Withdrawal {
  id: number;
  value: string;
  fee_value: string;
  net_value: string;
  pix_key: string;
  pix_key_type: PixKeyType;
  status: string;
  description: string | null;
  created_at: string;
  [key: string]: unknown;
}

export interface CreateWithdrawalResponse {
  message: string;
  withdrawal: Withdrawal;
}

// ─── Saldo ───────────────────────────────────────────────────────────────────
export interface Balance {
  available: number;
  blocked: number;
  total: number;
}

export interface BalanceResponse {
  balance: Balance;
}

// ─── Webhooks ────────────────────────────────────────────────────────────────
export type WebhookEvent =
  | 'charge.created'
  | 'charge.completed'
  | 'charge.expired'
  | 'charge.cancelled'
  | 'charge.refunded'
  | 'withdrawal.completed'
  | 'withdrawal.failed'
  | 'dispute.opened'
  | 'dispute.accepted'
  | 'dispute.rejected'
  | 'dispute.cancelled';

export interface CreateWebhookInput {
  url: string;
  events: WebhookEvent[];
  description?: string;
}

export interface Webhook {
  id: number;
  url: string;
  events: WebhookEvent[];
  is_active: boolean;
  /** O secret (`whsec_...`) só é retornado na criação. Guarde-o. */
  secret?: string;
  created_at: string;
  [key: string]: unknown;
}

export interface CreateWebhookResponse {
  message: string;
  webhook: Webhook;
}

/** Payload recebido no seu endpoint quando um evento ocorre. */
export interface WebhookPayload {
  event: WebhookEvent;
  charge?: Charge;
  withdrawal?: Withdrawal;
  [key: string]: unknown;
}

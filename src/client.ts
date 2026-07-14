import type {
  BalanceResponse,
  Charge,
  CreateChargeInput,
  CreateChargeResponse,
  CreateWebhookInput,
  CreateWebhookResponse,
  CreateWithdrawalInput,
  CreateWithdrawalResponse,
  FlowinPayOptions,
  Webhook,
  Withdrawal,
} from './types.js';

const DEFAULT_BASE_URL = 'https://app.flowinpay.com.br/api/v1';

/** Erro lançado quando a API responde com status de erro (4xx/5xx). */
export class FlowinPayError extends Error {
  readonly status: number;
  /** Erros de validação por campo (quando status 422). */
  readonly errors?: Record<string, string[]>;
  readonly body: unknown;

  constructor(status: number, message: string, body: unknown, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'FlowinPayError';
    this.status = status;
    this.body = body;
    this.errors = errors;
  }
}

export class FlowinPay {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(options: FlowinPayOptions) {
    if (!options?.apiKey) throw new Error('FlowinPay: `apiKey` é obrigatória.');
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs ?? 30_000;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let res: Response;
    try {
      res = await fetch(this.baseUrl + path, {
        method,
        headers: {
          'X-Api-Key': this.apiKey,
          Accept: 'application/json',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (err) {
      throw new FlowinPayError(0, `FlowinPay: falha de rede — ${(err as Error).message}`, null);
    } finally {
      clearTimeout(timer);
    }

    const text = await res.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!res.ok) {
      const d = (data ?? {}) as { message?: string; errors?: Record<string, string[]> };
      throw new FlowinPayError(res.status, d.message ?? `HTTP ${res.status}`, data, d.errors);
    }
    return data as T;
  }

  /** Cobranças PIX. */
  charges = {
    /** Cria uma cobrança PIX (opcionalmente com split). Requer escopo `charge:create` e KYC aprovado. */
    create: (input: CreateChargeInput): Promise<CreateChargeResponse> =>
      this.request('POST', '/charges', {
        value: input.value,
        description: input.description,
        callbackUrl: input.callbackUrl,
        customer_name: input.customerName,
        customer_email: input.customerEmail,
        customer_tax_id: input.customerTaxId,
        customer_phone: input.customerPhone,
        split: input.split,
        acquirer_id: input.acquirerId,
      }),

    /** Lista cobranças. Requer escopo `charge:read`. */
    list: (): Promise<{ charges: Charge[] } & Record<string, unknown>> =>
      this.request('GET', '/charges'),

    /** Consulta uma cobrança pelo id. Requer escopo `charge:read`. */
    get: (id: number | string): Promise<{ charge: Charge } & Record<string, unknown>> =>
      this.request('GET', `/charges/${id}`),

    /** Cancela uma cobrança. Requer escopo `charge:cancel` e KYC aprovado. */
    cancel: (id: number | string): Promise<Record<string, unknown>> =>
      this.request('POST', `/charges/${id}/cancel`),
  };

  /** Saques (PIX out). */
  withdrawals = {
    /** Solicita um saque via PIX. Requer escopo `withdrawal:create` e KYC aprovado. */
    create: (input: CreateWithdrawalInput): Promise<CreateWithdrawalResponse> =>
      this.request('POST', '/withdrawals', {
        value: input.value,
        pix_key: input.pixKey,
        pix_key_type: input.pixKeyType,
        description: input.description,
      }),

    /** Lista saques. Requer escopo `withdrawal:read`. */
    list: (): Promise<{ withdrawals: Withdrawal[] } & Record<string, unknown>> =>
      this.request('GET', '/withdrawals'),
  };

  /** Saldo e resumo financeiro. Requer escopo `balance:read`. */
  balance = {
    get: (): Promise<BalanceResponse> => this.request('GET', '/balance'),
  };

  /** Extrato de transações. Requer escopo `balance:read`. */
  transactions = {
    list: (): Promise<Record<string, unknown>> => this.request('GET', '/transactions'),
    get: (id: number | string): Promise<Record<string, unknown>> =>
      this.request('GET', `/transactions/${id}`),
  };

  /** Taxas vigentes. */
  fees = {
    current: (): Promise<Record<string, unknown>> => this.request('GET', '/fees/current'),
  };

  /** Resumo do dashboard. Requer escopo `balance:read`. */
  summary = {
    get: (): Promise<Record<string, unknown>> => this.request('GET', '/summary'),
  };

  /** Gestão de webhooks. */
  webhooks = {
    /** Cria um webhook. Requer escopo `webhook:create`. Guarde o `secret` retornado. */
    create: (input: CreateWebhookInput): Promise<CreateWebhookResponse> =>
      this.request('POST', '/webhooks', input),

    list: (): Promise<{ webhooks: Webhook[] } & Record<string, unknown>> =>
      this.request('GET', '/webhooks'),

    /** Remove um webhook. Requer escopo `webhook:create`. */
    delete: (id: number | string): Promise<Record<string, unknown>> =>
      this.request('DELETE', `/webhooks/${id}`),
  };
}

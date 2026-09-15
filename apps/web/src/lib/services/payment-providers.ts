import type { PaymentProviderType } from "@/generated/prisma/enums";

export interface PaymentInitiationRequest {
  referenceNumber: string;
  amountEtb: number;
  payerPhone: string;
}

export interface PaymentInitiationResult {
  externalTransactionId: string;
  /** Mock providers settle immediately; a real provider would return "pending"
   * and confirm asynchronously via webhook. */
  status: "COMPLETED" | "PENDING";
}

export interface PaymentProvider {
  readonly type: PaymentProviderType;
  readonly displayName: string;
  initiate(request: PaymentInitiationRequest): Promise<PaymentInitiationResult>;
}

/**
 * Sandbox/mock implementation shared by all providers for this prototype.
 * Real integrations (CBE, Telebirr, bank transfer) would implement the same
 * `PaymentProvider` interface against each provider's actual API, so the
 * rest of the application never has to change.
 */
class MockPaymentProvider implements PaymentProvider {
  constructor(
    public readonly type: PaymentProviderType,
    public readonly displayName: string
  ) {}

  async initiate(request: PaymentInitiationRequest): Promise<PaymentInitiationResult> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return {
      externalTransactionId: `${this.type}-${request.referenceNumber}-${Date.now().toString(36)}`,
      status: "COMPLETED",
    };
  }
}

const providers: Record<PaymentProviderType, PaymentProvider> = {
  CBE: new MockPaymentProvider("CBE", "Commercial Bank of Ethiopia"),
  TELEBIRR: new MockPaymentProvider("TELEBIRR", "telebirr"),
  BANK_TRANSFER: new MockPaymentProvider("BANK_TRANSFER", "Bank Transfer"),
  CASH: new MockPaymentProvider("CASH", "Cash (recorded manually)"),
};

export function getPaymentProvider(type: PaymentProviderType): PaymentProvider {
  return providers[type];
}

export function listPaymentProviders(): PaymentProvider[] {
  return Object.values(providers);
}

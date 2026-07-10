export interface UsageSnapshot {
  autoPercent: number | null;
  apiPercent: number | null;
  totalPercent: number | null;
  billingCycleEnd: string | null;
  displayMessage: string | null;
}

export type AuthResult =
  | { ok: true; accessToken: string; dbPath: string }
  | { ok: false; reason: string; dbPath?: string };

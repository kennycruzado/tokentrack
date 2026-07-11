export interface UsageSnapshot {
  autoPercent: number | null;
  apiPercent: number | null;
  billingCycleEnd: string | null;
}

export type AuthResult =
  | { ok: true; accessToken: string; dbPath: string }
  | { ok: false; reason: string; dbPath?: string };

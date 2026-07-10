import type { UsageSnapshot } from "./types";

const USAGE_URL =
  "https://api2.cursor.sh/aiserver.v1.DashboardService/GetCurrentPeriodUsage";

interface PlanUsage {
  autoPercentUsed?: number;
  apiPercentUsed?: number;
  totalPercentUsed?: number;
}

interface PeriodUsageResponse {
  planUsage?: PlanUsage;
  billingCycleEnd?: string | number;
  displayMessage?: string;
  autoModelSelectedDisplayMessage?: string;
  namedModelSelectedDisplayMessage?: string;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function formatCycleEnd(value: string | number | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  let date: Date;
  if (typeof value === "number") {
    date = new Date(value > 1e12 ? value : value * 1000);
  } else if (/^\d+$/.test(value)) {
    const n = Number(value);
    date = new Date(n > 1e12 ? n : n * 1000);
  } else {
    date = new Date(value);
  }
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

export class UsageFetchError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = "UsageFetchError";
  }
}

/**
 * Fetch current-period Auto / API usage percentages from Cursor's dashboard API.
 */
export async function fetchCurrentPeriodUsage(
  accessToken: string
): Promise<UsageSnapshot> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  let response: Response;
  try {
    response = await fetch(USAGE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Connect-Protocol-Version": "1",
      },
      body: "{}",
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new UsageFetchError("Usage request timed out");
    }
    throw new UsageFetchError(
      `Network error: ${err instanceof Error ? err.message : String(err)}`
    );
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 401 || response.status === 403) {
    throw new UsageFetchError(
      "Session expired. Sign in to Cursor again, then refresh.",
      response.status
    );
  }

  if (!response.ok) {
    throw new UsageFetchError(
      `Usage API returned HTTP ${response.status}`,
      response.status
    );
  }

  let data: PeriodUsageResponse;
  try {
    data = (await response.json()) as PeriodUsageResponse;
  } catch {
    throw new UsageFetchError("Usage API returned invalid JSON");
  }

  const plan = data.planUsage ?? {};
  const autoPercent = toNumber(plan.autoPercentUsed);
  const apiPercent = toNumber(plan.apiPercentUsed);
  const totalPercent = toNumber(plan.totalPercentUsed);

  return {
    autoPercent,
    apiPercent,
    totalPercent,
    billingCycleEnd: formatCycleEnd(data.billingCycleEnd),
    displayMessage:
      data.displayMessage ??
      data.autoModelSelectedDisplayMessage ??
      data.namedModelSelectedDisplayMessage ??
      null,
  };
}

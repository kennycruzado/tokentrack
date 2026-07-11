import * as vscode from "vscode";
import type { UsageSnapshot } from "./types";

const TRUSTED_TOOLTIP_COMMANDS = [
  "tokentrack.openDashboard",
  "tokentrack.refresh",
] as const;

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, value));
}

const FILLED = "█";
const EMPTY = "░";
const BAR_WIDTH = 5;
/** Each block represents this many percent (100 / 5 = 20). */
const BLOCK_PERCENT = 100 / BAR_WIDTH;

/**
 * 5 blocks × 20% each. Ceil so entering a band lights that block:
 *   0%        → ░░░░░
 *   1–20%     → █░░░░
 *   21–40%    → ██░░░
 *   41–60%    → ███░░
 *   61–80%    → ████░
 *   81–100%   → █████
 */
export function formatBar(percent: number): string {
  const pct = clampPercent(percent);
  const filled =
    pct <= 0 ? 0 : Math.min(BAR_WIDTH, Math.ceil(pct / BLOCK_PERCENT));
  return FILLED.repeat(filled) + EMPTY.repeat(BAR_WIDTH - filled);
}

export function formatStatusText(label: string, percent: number): string {
  const pct = Math.round(clampPercent(percent));
  return `${label}: ${formatBar(pct)} ${pct}%`;
}

/** Escape API/user text so it cannot inject markdown links or formatting. */
export function escapeMarkdown(text: string): string {
  return text.replace(/[\\`*_{}[\]()#+\-.!|>]/g, "\\$&");
}

export function buildTooltip(
  snapshot: UsageSnapshot,
  kind: "fpm" | "api"
): vscode.MarkdownString {
  const md = new vscode.MarkdownString(undefined, true);
  md.isTrusted = { enabledCommands: [...TRUSTED_TOOLTIP_COMMANDS] };
  md.supportHtml = false;

  const lines: string[] = ["**TokenTrack**", ""];

  if (snapshot.autoPercent !== null) {
    const text = `FPM (First-party models): ${snapshot.autoPercent.toFixed(1)}%`;
    lines.push(kind === "fpm" ? `**${text}**` : text);
  }
  if (snapshot.apiPercent !== null) {
    const text = `API: ${snapshot.apiPercent.toFixed(1)}%`;
    lines.push(kind === "api" ? `**${text}**` : text);
  }

  if (snapshot.billingCycleEnd) {
    lines.push(`Renews: ${escapeMarkdown(snapshot.billingCycleEnd)}`);
  }

  lines.push(
    "",
    "[Open usage dashboard](command:tokentrack.openDashboard) · [Refresh](command:tokentrack.refresh)"
  );

  md.appendMarkdown(lines.join("\n"));
  return md;
}

/** Status-bar hex colors (custom ThemeColor ids are unreliable here). */
export const fpmColor = "#3DDC97";
export const apiColor = "#F5A623";

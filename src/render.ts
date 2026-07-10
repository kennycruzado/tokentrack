import * as vscode from "vscode";
import type { UsageSnapshot } from "./types";

const FILLED = "█";
const EMPTY = "░";

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, value));
}

export function formatBar(percent: number, width: number): string {
  const w = Math.max(1, Math.floor(width));
  const pct = clampPercent(percent);
  const filled = Math.round((pct / 100) * w);
  const empty = Math.max(0, w - filled);
  return FILLED.repeat(filled) + EMPTY.repeat(empty);
}

export function formatStatusText(
  label: string,
  percent: number,
  barWidth: number
): string {
  const pct = Math.round(clampPercent(percent));
  return `${label} ${formatBar(pct, barWidth)} ${pct}%`;
}

export function buildTooltip(
  snapshot: UsageSnapshot,
  kind: "auto" | "api" | "total"
): vscode.MarkdownString {
  const md = new vscode.MarkdownString(undefined, true);
  md.isTrusted = true;
  md.supportHtml = false;

  const lines: string[] = ["**TokenTrack**", ""];

  if (snapshot.autoPercent !== null) {
    const text = `Auto: ${snapshot.autoPercent.toFixed(1)}%`;
    lines.push(kind === "auto" ? `**${text}**` : text);
  }
  if (snapshot.apiPercent !== null) {
    const text = `API: ${snapshot.apiPercent.toFixed(1)}%`;
    lines.push(kind === "api" ? `**${text}**` : text);
  }
  if (snapshot.totalPercent !== null) {
    const text = `Total: ${snapshot.totalPercent.toFixed(1)}%`;
    lines.push(kind === "total" ? `**${text}**` : text);
  }

  if (snapshot.billingCycleEnd) {
    lines.push(`Renews: ${snapshot.billingCycleEnd}`);
  }
  if (snapshot.displayMessage) {
    lines.push("", snapshot.displayMessage);
  }

  lines.push(
    "",
    "[Open usage dashboard](command:tokentrack.openDashboard) · [Refresh](command:tokentrack.refresh)"
  );

  md.appendMarkdown(lines.join("\n"));
  return md;
}

export const autoColor = new vscode.ThemeColor("tokentrack.auto");
export const apiColor = new vscode.ThemeColor("tokentrack.api");
export const totalColor = new vscode.ThemeColor("tokentrack.total");

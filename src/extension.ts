import * as vscode from "vscode";
import { readAccessToken } from "./auth";
import {
  apiColor,
  autoColor,
  buildTooltip,
  formatStatusText,
  totalColor,
} from "./render";
import type { UsageSnapshot } from "./types";
import { fetchCurrentPeriodUsage, UsageFetchError } from "./usage";

let autoItem: vscode.StatusBarItem | undefined;
let apiItem: vscode.StatusBarItem | undefined;
let totalItem: vscode.StatusBarItem | undefined;
let pollTimer: ReturnType<typeof setInterval> | undefined;
let refreshing = false;
let lastSnapshot: UsageSnapshot | null = null;

function getConfig() {
  const cfg = vscode.workspace.getConfiguration("tokentrack");
  return {
    pollIntervalSeconds: Math.max(5, cfg.get<number>("pollIntervalSeconds", 15)),
    barWidth: Math.max(4, Math.min(20, cfg.get<number>("barWidth", 8))),
    showAuto: cfg.get<boolean>("showAuto", true),
    showApi: cfg.get<boolean>("showApi", true),
  };
}

function ensureItems(context: vscode.ExtensionContext): void {
  if (!autoItem) {
    autoItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      101
    );
    autoItem.command = "tokentrack.refresh";
    autoItem.color = autoColor;
    context.subscriptions.push(autoItem);
  }
  if (!apiItem) {
    apiItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    apiItem.command = "tokentrack.refresh";
    apiItem.color = apiColor;
    context.subscriptions.push(apiItem);
  }
  if (!totalItem) {
    totalItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      99
    );
    totalItem.command = "tokentrack.refresh";
    totalItem.color = totalColor;
    context.subscriptions.push(totalItem);
  }
}

function showLoading(): void {
  const { showAuto, showApi, barWidth } = getConfig();
  if (showAuto && autoItem) {
    autoItem.text = `Auto ${"░".repeat(barWidth)} …`;
    autoItem.tooltip = "TokenTrack: loading…";
    autoItem.show();
  }
  if (showApi && apiItem) {
    apiItem.text = `API ${"░".repeat(barWidth)} …`;
    apiItem.tooltip = "TokenTrack: loading…";
    apiItem.show();
  }
  totalItem?.hide();
}

function showError(message: string): void {
  if (autoItem) {
    autoItem.text = "$(warning) TokenTrack";
    autoItem.tooltip = message;
    autoItem.color = undefined;
    autoItem.show();
  }
  apiItem?.hide();
  totalItem?.hide();
}

function applySnapshot(snapshot: UsageSnapshot): void {
  const { showAuto, showApi, barWidth } = getConfig();
  lastSnapshot = snapshot;

  const hasAuto = snapshot.autoPercent !== null;
  const hasApi = snapshot.apiPercent !== null;
  const hasSplit = hasAuto || hasApi;

  if (hasSplit) {
    totalItem?.hide();

    if (showAuto && hasAuto && autoItem) {
      autoItem.text = formatStatusText("Auto", snapshot.autoPercent!, barWidth);
      autoItem.tooltip = buildTooltip(snapshot, "auto");
      autoItem.color = autoColor;
      autoItem.show();
    } else {
      autoItem?.hide();
    }

    if (showApi && hasApi && apiItem) {
      apiItem.text = formatStatusText("API", snapshot.apiPercent!, barWidth);
      apiItem.tooltip = buildTooltip(snapshot, "api");
      apiItem.color = apiColor;
      apiItem.show();
    } else {
      apiItem?.hide();
    }
    return;
  }

  // Fallback: total only when Auto/API split is absent
  autoItem?.hide();
  apiItem?.hide();

  if (snapshot.totalPercent !== null && totalItem) {
    totalItem.text = formatStatusText("Total", snapshot.totalPercent, barWidth);
    totalItem.tooltip = buildTooltip(snapshot, "total");
    totalItem.color = totalColor;
    totalItem.show();
  } else {
    showError("No usage percentages returned for this plan.");
  }
}

async function refreshUsage(): Promise<void> {
  if (refreshing) {
    return;
  }
  refreshing = true;
  try {
    const auth = await readAccessToken();
    if (!auth.ok) {
      showError(auth.reason);
      return;
    }

    const snapshot = await fetchCurrentPeriodUsage(auth.accessToken);
    applySnapshot(snapshot);
  } catch (err) {
    const message =
      err instanceof UsageFetchError
        ? err.message
        : err instanceof Error
          ? err.message
          : String(err);
    showError(message);
  } finally {
    refreshing = false;
  }
}

function clearPollTimer(): void {
  if (pollTimer !== undefined) {
    clearInterval(pollTimer);
    pollTimer = undefined;
  }
}

function startPoller(): void {
  clearPollTimer();
  const { pollIntervalSeconds } = getConfig();
  pollTimer = setInterval(() => {
    void refreshUsage();
  }, pollIntervalSeconds * 1000);
}

export function activate(context: vscode.ExtensionContext): void {
  ensureItems(context);
  showLoading();

  context.subscriptions.push(
    vscode.commands.registerCommand("tokentrack.refresh", () => {
      void refreshUsage();
    }),
    vscode.commands.registerCommand("tokentrack.openDashboard", () => {
      void vscode.env.openExternal(
        vscode.Uri.parse("https://cursor.com/dashboard/usage")
      );
    }),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (!e.affectsConfiguration("tokentrack")) {
        return;
      }
      startPoller();
      if (lastSnapshot) {
        applySnapshot(lastSnapshot);
      } else {
        void refreshUsage();
      }
    })
  );

  context.subscriptions.push({
    dispose: () => clearPollTimer(),
  });

  startPoller();
  void refreshUsage();
}

export function deactivate(): void {
  clearPollTimer();
}

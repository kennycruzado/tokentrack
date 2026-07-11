import * as vscode from "vscode";
import { readAccessToken } from "./auth";
import {
  apiColor,
  buildTooltip,
  formatStatusText,
  fpmColor,
} from "./render";
import type { UsageSnapshot } from "./types";
import { fetchCurrentPeriodUsage, UsageFetchError } from "./usage";

let fpmItem: vscode.StatusBarItem | undefined;
let apiItem: vscode.StatusBarItem | undefined;
let pollTimer: ReturnType<typeof setInterval> | undefined;
let refreshing = false;
let lastSnapshot: UsageSnapshot | null = null;

function getConfig() {
  const cfg = vscode.workspace.getConfiguration("tokentrack");
  return {
    pollIntervalSeconds: Math.max(
      5,
      Math.min(600, cfg.get<number>("pollIntervalSeconds", 15))
    ),
    showFpm: cfg.get<boolean>("showFpm", true),
    showApi: cfg.get<boolean>("showApi", true),
  };
}

function ensureItems(context: vscode.ExtensionContext): void {
  // Right-aligned: higher priority sits further left → FPM, API
  if (!fpmItem) {
    fpmItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      101
    );
    fpmItem.command = "tokentrack.refresh";
    fpmItem.color = fpmColor;
    context.subscriptions.push(fpmItem);
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
}

function showLoading(): void {
  const { showFpm, showApi } = getConfig();
  if (showFpm && fpmItem) {
    fpmItem.text = "FPM: ░░░░░ …";
    fpmItem.tooltip = "TokenTrack: loading…";
    fpmItem.color = fpmColor;
    fpmItem.show();
  }
  if (showApi && apiItem) {
    apiItem.text = "API: ░░░░░ …";
    apiItem.tooltip = "TokenTrack: loading…";
    apiItem.color = apiColor;
    apiItem.show();
  }
}

function showError(message: string): void {
  if (fpmItem) {
    fpmItem.text = "$(warning) TokenTrack";
    fpmItem.tooltip = message;
    fpmItem.color = undefined;
    fpmItem.show();
  }
  apiItem?.hide();
}

function applySnapshot(snapshot: UsageSnapshot): void {
  const { showFpm, showApi } = getConfig();
  lastSnapshot = snapshot;

  const hasFpm = snapshot.autoPercent !== null;
  const hasApi = snapshot.apiPercent !== null;

  if (!hasFpm && !hasApi) {
    showError("No usage percentages returned for this plan.");
    return;
  }

  if (showFpm && hasFpm && fpmItem) {
    fpmItem.text = formatStatusText("FPM", snapshot.autoPercent!);
    fpmItem.tooltip = buildTooltip(snapshot, "fpm");
    fpmItem.color = fpmColor;
    fpmItem.show();
  } else {
    fpmItem?.hide();
  }

  if (showApi && hasApi && apiItem) {
    apiItem.text = formatStatusText("API", snapshot.apiPercent!);
    apiItem.tooltip = buildTooltip(snapshot, "api");
    apiItem.color = apiColor;
    apiItem.show();
  } else {
    apiItem?.hide();
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
      lastSnapshot = null;
      showError(auth.reason);
      return;
    }

    const snapshot = await fetchCurrentPeriodUsage(auth.accessToken);
    applySnapshot(snapshot);
  } catch (err) {
    const expired =
      err instanceof UsageFetchError &&
      (err.status === 401 || err.status === 403);
    if (expired) {
      lastSnapshot = null;
    }
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

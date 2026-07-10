import { execFile } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { promisify } from "util";
import type { AuthResult } from "./types";

const ACCESS_TOKEN_KEY = "cursorAuth/accessToken";
const execFileAsync = promisify(execFile);

/** Resolve Cursor's state.vscdb path for the current OS. */
export function getStateDbPath(): string {
  const home = os.homedir();
  switch (process.platform) {
    case "darwin":
      return path.join(
        home,
        "Library",
        "Application Support",
        "Cursor",
        "User",
        "globalStorage",
        "state.vscdb"
      );
    case "win32":
      return path.join(
        process.env.APPDATA || path.join(home, "AppData", "Roaming"),
        "Cursor",
        "User",
        "globalStorage",
        "state.vscdb"
      );
    default:
      return path.join(
        home,
        ".config",
        "Cursor",
        "User",
        "globalStorage",
        "state.vscdb"
      );
  }
}

function valueToString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (value instanceof Uint8Array) {
    const trimmed = Buffer.from(value).toString("utf8").trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (Buffer.isBuffer(value)) {
    const trimmed = value.toString("utf8").trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

/**
 * Open the live DB file (respects WAL) without loading the whole multi‑GB
 * file into memory — unlike sql.js.
 */
function readViaNodeSqlite(dbPath: string): string | null {
  const sqlite = require("node:sqlite") as {
    DatabaseSync: new (
      path: string,
      options?: { readOnly?: boolean }
    ) => {
      prepare(sql: string): {
        get: (...params: unknown[]) => { value?: unknown } | undefined;
      };
      close(): void;
    };
  };

  const db = new sqlite.DatabaseSync(dbPath, { readOnly: true });
  try {
    const row = db
      .prepare("SELECT value FROM ItemTable WHERE key = ?")
      .get(ACCESS_TOKEN_KEY);
    return valueToString(row?.value);
  } finally {
    db.close();
  }
}

/** Fallback when node:sqlite is unavailable in the extension host. */
async function readViaSqliteCli(dbPath: string): Promise<string | null> {
  // Key is a fixed constant — safe to embed. Avoids shell interpolation.
  const sql = `SELECT value FROM ItemTable WHERE key='${ACCESS_TOKEN_KEY}';`;
  const { stdout } = await execFileAsync(
    "sqlite3",
    ["-readonly", dbPath, sql],
    {
      encoding: "utf8",
      maxBuffer: 2 * 1024 * 1024,
      timeout: 10_000,
      windowsHide: true,
    }
  );
  const trimmed = stdout.replace(/\r?\n$/, "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isModuleNotFound(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  const code =
    typeof err === "object" && err !== null && "code" in err
      ? String((err as { code?: unknown }).code ?? "")
      : "";
  return (
    code === "ERR_UNKNOWN_BUILTIN_MODULE" ||
    code === "MODULE_NOT_FOUND" ||
    /Cannot find module ['"]node:sqlite['"]/i.test(message) ||
    /No such built-in module:\s*node:sqlite/i.test(message)
  );
}

/**
 * Read cursorAuth/accessToken from Cursor's local SQLite DB.
 * Does not cache the token — re-read on each refresh so logout clears access.
 */
export async function readAccessToken(): Promise<AuthResult> {
  const dbPath = getStateDbPath();

  if (!fs.existsSync(dbPath)) {
    return {
      ok: false,
      reason:
        "Cursor state database not found. Is Cursor installed and signed in?",
      dbPath,
    };
  }

  const errors: string[] = [];

  try {
    const accessToken = readViaNodeSqlite(dbPath);
    if (accessToken) {
      return { ok: true, accessToken, dbPath };
    }
    return {
      ok: false,
      reason: "No access token found. Sign in to Cursor, then refresh.",
      dbPath,
    };
  } catch (err) {
    if (!isModuleNotFound(err)) {
      errors.push(
        `node:sqlite: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  try {
    const accessToken = await readViaSqliteCli(dbPath);
    if (accessToken) {
      return { ok: true, accessToken, dbPath };
    }
    return {
      ok: false,
      reason: "No access token found. Sign in to Cursor, then refresh.",
      dbPath,
    };
  } catch (err) {
    errors.push(
      `sqlite3: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return {
    ok: false,
    reason: `Failed to query Cursor auth (${errors.join("; ") || "no reader available"}).`,
    dbPath,
  };
}

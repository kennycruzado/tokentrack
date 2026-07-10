import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";
import type { AuthResult } from "./types";

const ACCESS_TOKEN_KEY = "cursorAuth/accessToken";

let sqlPromise: Promise<SqlJsStatic> | undefined;

function getSql(): Promise<SqlJsStatic> {
  if (!sqlPromise) {
    const wasmPath = path.join(__dirname, "sql-wasm.wasm");
    sqlPromise = initSqlJs({
      locateFile: () => wasmPath,
    });
  }
  return sqlPromise;
}

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

function wipeBuffer(buffer: Buffer | undefined): void {
  if (buffer && buffer.length > 0) {
    buffer.fill(0);
  }
}

function readItemValue(db: Database, key: string): string | null {
  const stmt = db.prepare("SELECT value FROM ItemTable WHERE key = ?");
  try {
    stmt.bind([key]);
    if (stmt.step()) {
      const row = stmt.getAsObject() as { value?: string | Uint8Array };
      const value = row.value;
      if (typeof value === "string") {
        return value;
      }
      if (value instanceof Uint8Array) {
        const text = Buffer.from(value).toString("utf8");
        // value may share backing store with wasm heap; do not mutate it.
        return text;
      }
    }
    return null;
  } finally {
    stmt.free();
  }
}

/**
 * Read cursorAuth/accessToken from Cursor's local SQLite DB.
 * Does not cache the token — re-read on each refresh so logout clears access.
 * sql.js requires loading the DB file into memory; the Node buffer is wiped
 * immediately after the in-memory DB is constructed.
 */
export async function readAccessToken(): Promise<AuthResult> {
  const dbPath = getStateDbPath();

  if (!fs.existsSync(dbPath)) {
    return {
      ok: false,
      reason: "Cursor state database not found. Is Cursor installed and signed in?",
      dbPath,
    };
  }

  let SQL: SqlJsStatic;
  try {
    SQL = await getSql();
  } catch (err) {
    return {
      ok: false,
      reason: `Failed to load SQLite engine: ${err instanceof Error ? err.message : String(err)}`,
      dbPath,
    };
  }

  let fileBuffer: Buffer | undefined;
  try {
    fileBuffer = fs.readFileSync(dbPath);
  } catch (err) {
    return {
      ok: false,
      reason: `Cannot read Cursor state database: ${err instanceof Error ? err.message : String(err)}`,
      dbPath,
    };
  }

  let db: Database | undefined;
  try {
    // sql.js copies into its wasm heap; wipe our Node copy right away.
    db = new SQL.Database(fileBuffer);
    wipeBuffer(fileBuffer);
    fileBuffer = undefined;

    const accessToken = readItemValue(db, ACCESS_TOKEN_KEY);
    if (!accessToken || accessToken.trim().length === 0) {
      return {
        ok: false,
        reason: "No access token found. Sign in to Cursor, then refresh.",
        dbPath,
      };
    }
    return { ok: true, accessToken: accessToken.trim(), dbPath };
  } catch (err) {
    return {
      ok: false,
      reason: `Failed to query Cursor auth: ${err instanceof Error ? err.message : String(err)}`,
      dbPath,
    };
  } finally {
    wipeBuffer(fileBuffer);
    db?.close();
  }
}

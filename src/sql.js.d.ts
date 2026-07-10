declare module "sql.js" {
  export interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | Buffer | null) => Database;
  }

  export interface Database {
    prepare(sql: string): Statement;
    close(): void;
  }

  export interface Statement {
    bind(values?: unknown[]): boolean;
    step(): boolean;
    getAsObject(params?: object): object;
    free(): void;
  }

  export interface SqlJsConfig {
    locateFile?(file: string): string;
  }

  export default function initSqlJs(
    config?: SqlJsConfig
  ): Promise<SqlJsStatic>;
}

/**
 * Database Verification Module
 * Verifies that data has been seeded correctly
 */

import { logInfo, logSuccess, logWarn, logError, logDebug, startSpinner, stopSpinner } from "../lib/logger";
import { executeSqlQuery } from "../lib/sql";
import { getConnectionString } from "./connection";

export interface TableCount {
  tableName: string;
  count: number;
}

export interface VerificationResult {
  success: boolean;
  tables: TableCount[];
  warnings: string[];
}

/**
 * Get ALL table counts in a single SQL round-trip using dynamic SQL + STRING_AGG.
 * Returns pipe-delimited "TableName:Count" pairs from one query instead of N queries.
 */
async function getAllTableCounts(connectionString: string): Promise<TableCount[]> {
  try {
    // Build dynamic SQL that counts every table in one shot
    const query =
      "DECLARE @sql NVARCHAR(MAX) = ''; " +
      "SELECT @sql = @sql + 'SELECT ''' + TABLE_NAME + ':'' + CAST(COUNT(*) AS NVARCHAR) FROM [' + TABLE_NAME + '] UNION ALL ' " +
      "FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME; " +
      "SET @sql = LEFT(@sql, LEN(@sql) - 10); " +
      "SET @sql = 'SELECT STRING_AGG(r, ''|'') FROM (' + @sql + ') AS t(r)'; " +
      "EXEC sp_executesql @sql;";

    const result = await executeSqlQuery(connectionString, query);

    if (result.success && result.result) {
      return result.result
        .split("|")
        .map((pair: string) => {
          const colonIdx = pair.lastIndexOf(":");
          if (colonIdx === -1) return null;
          const tableName = pair.substring(0, colonIdx).trim();
          const count = parseInt(pair.substring(colonIdx + 1).trim(), 10);
          return { tableName, count: isNaN(count) ? 0 : count };
        })
        .filter((t): t is TableCount => t !== null)
        .sort((a, b) => a.tableName.localeCompare(b.tableName));
    }

    return [];
  } catch (error) {
    logDebug(`Could not get table counts: ${error instanceof Error ? error.message : "Unknown error"}`);
    return [];
  }
}

/**
 * Verify seeded data - dynamically checks all tables in one SQL query
 */
export async function verifySeededData(): Promise<VerificationResult> {
  logInfo("Verifying seeded data...");

  const result: VerificationResult = {
    success: true,
    tables: [],
    warnings: [],
  };

  const connectionString = await getConnectionString();
  if (!connectionString) {
    logError("Cannot verify data without connection string");
    return { success: false, tables: [], warnings: ["Connection string not found"] };
  }

  startSpinner("Checking all table row counts...");

  result.tables = await getAllTableCounts(connectionString);

  if (result.tables.length === 0) {
    stopSpinner(false, "No tables found");
    logWarn("No tables found in database - migrations may not have run");
    return { success: false, tables: [], warnings: ["No tables found"] };
  }

  stopSpinner(true, `Checked ${String(result.tables.length)} tables`);

  logInfo("");
  logInfo("Table row counts:");

  const emptyTables: string[] = [];

  for (const table of result.tables) {
    if (table.count === 0) {
      logWarn(`  ${table.tableName.padEnd(35)} 0 rows`);
      emptyTables.push(table.tableName);
    } else {
      logInfo(`  ${table.tableName.padEnd(35)} ${String(table.count)} rows ✓`);
    }
  }

  logInfo("");

  if (emptyTables.length > 0) {
    result.warnings = emptyTables.map(t => `${t} is empty`);
    // Only fail if core identity tables are empty
    const coreTables = ["AspNetRoles", "AspNetUsers"];
    const coreEmpty = coreTables.filter(t => emptyTables.includes(t));
    if (coreEmpty.length > 0) {
      result.success = false;
      logWarn(`Core tables are empty: ${coreEmpty.join(", ")}`);
    } else {
      logInfo(`${String(emptyTables.length)} tables are empty (may be expected for unused features)`);
    }
  } else {
    logSuccess("All tables have data!");
  }

  return result;
}

/**
 * Check if database has any data
 */
export async function isDatabaseEmpty(): Promise<boolean> {
  logDebug("Checking if database is empty...");

  const connectionString = await getConnectionString();
  if (!connectionString) return true;

  try {
    const result = await executeSqlQuery(connectionString, "SELECT COUNT(*) FROM [AspNetUsers]");
    if (result.success && result.result) {
      return parseInt(result.result, 10) === 0;
    }
    return true;
  } catch (error) {
    logDebug(`Could not check if database is empty: ${error instanceof Error ? error.message : "Unknown error"}`);
    return true;
  }
}

/**
 * Display database statistics
 */
export async function showDatabaseStats(): Promise<void> {
  logInfo("Database Statistics:");
  logInfo("");

  const connectionString = await getConnectionString();
  if (!connectionString) {
    logError("Cannot show stats without connection string");
    return;
  }

  startSpinner("Collecting database statistics...");
  const tables = await getAllTableCounts(connectionString);
  stopSpinner(true, "Statistics collected");

  for (const table of tables) {
    logInfo(`  ${table.tableName.padEnd(35)} ${String(table.count)} rows`);
  }

  logInfo("");
}

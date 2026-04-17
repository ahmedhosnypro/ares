/**
 * Database Connection Module
 * Tests SQL Server connection using .NET
 */

import { logInfo, logSuccess, logError, logDebug, startSpinner, stopSpinner } from "../lib/logger";
import { testSqlConnection } from "../lib/sql";
import { parseEnvFile } from "../config/validate";
import { fileExists } from "../lib/utils";

export interface ConnectionTestResult {
  success: boolean;
  version?: string;
  error?: string;
  retries: number;
}

/**
 * Extract connection string from backend .env file
 */
export async function getConnectionString(): Promise<string | null> {
  const envPath = "backend/.env";

  if (!(await fileExists(envPath))) {
    logError(`Backend .env file not found: ${envPath}`);
    return null;
  }

  try {
    const env = await parseEnvFile(envPath);
    const connString = env.ConnectionStrings__DefaultConnection;

    if (!connString) {
      logError("Connection string not found in backend/.env");
      return null;
    }

    return connString;
  } catch (error) {
    logError(`Failed to read connection string: ${error instanceof Error ? error.message : "Unknown error"}`);
    return null;
  }
}

/**
 * Test database connection with retries
 */
export async function testDatabaseConnection(
  connectionString: string,
  maxRetries = 3,
  retryDelay = 5000
): Promise<ConnectionTestResult> {
  logInfo("Testing database connection...");

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    startSpinner(`Attempt ${String(attempt)}/${String(maxRetries)}: Connecting to database...`);

    try {
      const result = await testSqlConnection(connectionString);

      if (result.success) {
        stopSpinner(true, `Connected to SQL Server: ${result.version ?? "unknown version"}`);
        return {
          success: true,
          version: result.version,
          retries: attempt,
        };
      }

      stopSpinner(false, `Connection failed: ${result.error ?? "Unknown error"}`);

      if (attempt < maxRetries) {
        logInfo(`Retrying in ${String(retryDelay / 1000)} seconds...`);
        await Bun.sleep(retryDelay);
      }
    } catch (error) {
      stopSpinner(false, `Connection test failed: ${error instanceof Error ? error.message : "Unknown error"}`);

      if (attempt < maxRetries) {
        logInfo(`Retrying in ${String(retryDelay / 1000)} seconds...`);
        await Bun.sleep(retryDelay);
      }
    }
  }

  return {
    success: false,
    error: "Failed to connect after multiple attempts",
    retries: maxRetries,
  };
}

/**
 * Test connection and provide helpful error messages
 */
export async function verifyDatabaseConnection(): Promise<boolean> {
  logInfo("Verifying database connection...");

  // Get connection string from .env
  const connectionString = await getConnectionString();
  if (!connectionString) {
    logError("Cannot test connection without connection string");
    return false;
  }

  logDebug("Connection string loaded from backend/.env");

  // Replace database name with 'master' for initial connection test
  // The actual database will be created by migrations
  const testConnectionString = connectionString.replace(/Database=[^;]+/, "Database=master");
  logDebug("Testing connection to master database first...");

  // Test connection
  const result = await testDatabaseConnection(testConnectionString);

  if (result.success) {
    logSuccess("Database connection verified!");
    if (result.version) {
      logInfo(`SQL Server version: ${result.version}`);
    }
    return true;
  }

  // Connection failed - provide helpful error messages
  logError("Database connection failed");
  logInfo("");
  logInfo("Troubleshooting steps:");
  logInfo("  1. Ensure SQL Server is running");
  logInfo("  2. Check the connection string in backend/.env");
  logInfo("  3. Verify the database credentials");
  logInfo("  4. Check if the SQL Server port (1433) is accessible");
  logInfo("");
  logInfo("To start SQL Server with Docker:");
  logInfo('  docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourPassword123!" \\');
  logInfo("    -p 1433:1433 --name mssql \\");
  logInfo("    -d mcr.microsoft.com/mssql/server:2022-latest");
  logInfo("");

  return false;
}

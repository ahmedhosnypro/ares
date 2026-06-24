import { $ } from "bun";
import { logDebug } from "./logger";
import { commandExists } from "./utils";
import * as path from "node:path";
import { unlink } from "node:fs/promises";

export interface ConnectionInfo {
  server: string;
  port: string;
  database: string;
  user: string;
  password: string;
}

export function parseConnectionString(connString: string): ConnectionInfo | null {
  try {
    const serverMatch = connString.match(/Server=([^,;]+)(?:,(\d+))?/);
    const databaseMatch = connString.match(/Database=([^;]+)/);
    const userMatch = connString.match(/User=([^;]+)/);
    const passwordMatch = connString.match(/Password=([^;]+)/);

    if (!serverMatch?.[1] || !databaseMatch?.[1] || !userMatch?.[1] || !passwordMatch?.[1]) {
      return null;
    }

    return {
      server: serverMatch[1],
      port: serverMatch[2] || "1433",
      database: databaseMatch[1],
      user: userMatch[1],
      password: passwordMatch[1],
    };
  } catch {
    return null;
  }
}

export function buildConnectionString(info: ConnectionInfo): string {
  return `Server=${info.server},${info.port};Database=${info.database};User=${info.user};Password=${info.password};TrustServerCertificate=True;Encrypt=false;Connect Timeout=5`;
}

export async function testSqlConnection(
  connectionString: string
): Promise<{ success: boolean; version?: string; error?: string }> {
  const tempFile = path.join(process.cwd(), "scripts/setup", `test-sql-${Date.now().toString()}.csx`);
  try {
    const hasDotnetScript = await commandExists("dotnet-script");
    if (!hasDotnetScript) {
      return {
        success: false,
        error: "dotnet-script is not installed. Run: dotnet tool install --global dotnet-script",
      };
    }

    // Create a minimal C# test program
    const testProgram = `#r "nuget: Microsoft.Data.SqlClient, 5.2.0"
using Microsoft.Data.SqlClient;

try {
    using var conn = new SqlConnection(Args[0]);
    await conn.OpenAsync();
    
    var cmd = new SqlCommand("SELECT @@VERSION", conn);
    var version = await cmd.ExecuteScalarAsync();
    
    Console.WriteLine($"SUCCESS:{version?.ToString() ?? "Unknown"}");
} catch (Exception ex) {
    Console.WriteLine($"ERROR:{ex.Message}");
}
`;

    await Bun.write(tempFile, testProgram);

    logDebug(`Testing SQL connection with temp file: ${tempFile}`);

    // Try to run with dotnet script - pass arguments after --
    const result = await $`dotnet script ${tempFile} -- ${connectionString}`.text();

    if (result.startsWith("SUCCESS:")) {
      const version = result.substring(8).trim();
      return { success: true, version };
    } else if (result.startsWith("ERROR:")) {
      const error = result.substring(6).trim();
      return { success: false, error };
    } else {
      return { success: false, error: "Unknown error" };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Connection test failed",
    };
  } finally {
    try {
      await unlink(tempFile);
    } catch {
      // Ignore cleanup error
    }
  }
}

export async function executeSqlQuery(
  connectionString: string,
  query: string
): Promise<{ success: boolean; result?: string; error?: string }> {
  const tempFile = path.join(process.cwd(), "scripts/setup", `exec-sql-${Date.now().toString()}.csx`);
  try {
    const testProgram = `#r "nuget: Microsoft.Data.SqlClient, 5.2.0"
using Microsoft.Data.SqlClient;
using System.Text.Json;

try {
    using var conn = new SqlConnection(Args[0]);
    await conn.OpenAsync();
    
    var cmd = new SqlCommand(Args[1], conn);
    var result = await cmd.ExecuteScalarAsync();
    
    Console.WriteLine($"SUCCESS:{result?.ToString() ?? ""}");
} catch (Exception ex) {
    Console.WriteLine($"ERROR:{ex.Message}");
}
`;

    await Bun.write(tempFile, testProgram);

    logDebug(`Executing SQL query: ${query}`);

    // Pass arguments after --
    const result = await $`dotnet script ${tempFile} -- ${connectionString} ${query}`.text();

    if (result.startsWith("SUCCESS:")) {
      const queryResult = result.substring(8).trim();
      return { success: true, result: queryResult };
    } else if (result.startsWith("ERROR:")) {
      const error = result.substring(6).trim();
      return { success: false, error };
    } else {
      return { success: false, error: "Unknown error" };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Query execution failed",
    };
  } finally {
    try {
      await unlink(tempFile);
    } catch {
      // Ignore cleanup error
    }
  }
}

export async function executeSqlQueryRows(
  connectionString: string,
  query: string
): Promise<{ success: boolean; rows?: string[]; error?: string }> {
  const tempFile = path.join(process.cwd(), "scripts/setup", `exec-sql-rows-${Date.now().toString()}.csx`);
  try {
    const testProgram = `#r "nuget: Microsoft.Data.SqlClient, 5.2.0"
using Microsoft.Data.SqlClient;

try {
    using var conn = new SqlConnection(Args[0]);
    await conn.OpenAsync();
    
    var cmd = new SqlCommand(Args[1], conn);
    using var reader = await cmd.ExecuteReaderAsync();
    
    Console.WriteLine("SUCCESS:");
    while (await reader.ReadAsync()) {
        Console.WriteLine(reader[0]?.ToString() ?? "");
    }
} catch (Exception ex) {
    Console.WriteLine($"ERROR:{ex.Message}");
}
`;

    await Bun.write(tempFile, testProgram);

    logDebug(`Executing SQL rows query: ${query}`);

    const result = await $`dotnet script ${tempFile} -- ${connectionString} ${query}`.text();

    if (result.startsWith("SUCCESS:")) {
      const rows = result
        .substring(8)
        .split("\n")
        .map(r => r.trim())
        .filter(Boolean);
      return { success: true, rows };
    } else if (result.startsWith("ERROR:")) {
      return { success: false, error: result.substring(6).trim() };
    } else {
      return { success: false, error: "Unknown error" };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Query execution failed",
    };
  } finally {
    try {
      await unlink(tempFile);
    } catch {
      // Ignore cleanup error
    }
  }
}

export async function getTableCount(connectionString: string, tableName: string): Promise<number> {
  const result = await executeSqlQuery(connectionString, `SELECT COUNT(*) FROM ${tableName}`);

  if (result.success && result.result) {
    return parseInt(result.result, 10);
  }

  return 0;
}

export async function checkDatabaseExists(connectionString: string, databaseName: string): Promise<boolean> {
  const result = await executeSqlQuery(
    connectionString,
    `SELECT COUNT(*) FROM sys.databases WHERE name = '${databaseName}'`
  );

  if (result.success && result.result) {
    return parseInt(result.result, 10) > 0;
  }

  return false;
}

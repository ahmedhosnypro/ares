/**
 * SQL Server Check Module
 * Checks for SQL Server availability
 */

import { logDebug, logInfo, logWarn, logError } from "../lib/logger";
import { testSqlConnection } from "../lib/sql";
import { askYesNo, checkTcpPort } from "../lib/utils";

export interface SqlServerInfo {
  accessible: boolean;
  version?: string;
  host: string;
  port: number;
}

export async function checkSqlServer(
  host = "localhost",
  port = 1433,
  user = "sa",
  password = "YourPassword123!"
): Promise<SqlServerInfo> {
  logDebug(`Checking SQL Server at ${host}:${port.toString()}...`);

  // Fast TCP check first
  const isPortOpen = await checkTcpPort(host, port);
  if (!isPortOpen) {
    logDebug(`SQL Server port ${port.toString()} is closed at ${host}`);
    return {
      accessible: false,
      host,
      port,
    };
  }

  // Full connection test only if port is open
  const connectionString = `Server=${host},${port.toString()};Database=master;User=${user};Password=${password};TrustServerCertificate=True;Encrypt=false;Connect Timeout=5`;

  const result = await testSqlConnection(connectionString);

  if (result.success) {
    logDebug(`SQL Server is accessible: ${result.version ?? "unknown version"}`);
    return {
      accessible: true,
      version: result.version,
      host,
      port,
    };
  }

  logDebug(`SQL Server is not accessible: ${result.error ?? "unknown error"}`);
  return {
    accessible: false,
    host,
    port,
  };
}

export function getSqlServerInstallInstructions(osType: string, isDocker: boolean): string {
  if (isDocker) {
    return `
SQL Server is not accessible. If you're in a devcontainer, try:

Host: mssql (not localhost)
Port: 1433

The SQL Server container should be running via docker-compose.
Check: docker ps | grep mssql
`;
  }

  switch (osType) {
    case "linux":
      return `
Install SQL Server on Linux using Docker:

1. Pull the image:
   docker pull mcr.microsoft.com/mssql/server:2022-latest

2. Run the container:
   docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourPassword123!" \\
     -p 1433:1433 --name mssql \\
     -d mcr.microsoft.com/mssql/server:2022-latest

3. Verify it's running:
   docker ps | grep mssql

Or install natively:
https://learn.microsoft.com/en-us/sql/linux/sql-server-linux-setup
`;

    case "darwin":
      return `
Install SQL Server on macOS using Docker:

1. Install Docker Desktop:
   https://www.docker.com/products/docker-desktop

2. Pull the image:
   docker pull mcr.microsoft.com/mssql/server:2022-latest

3. Run the container:
   docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourPassword123!" \\
     -p 1433:1433 --name mssql \\
     -d mcr.microsoft.com/mssql/server:2022-latest

4. Verify it's running:
   docker ps | grep mssql
`;

    case "windows":
      return `
Install SQL Server on Windows:

1. Download SQL Server Express:
   https://www.microsoft.com/en-us/sql-server/sql-server-downloads

2. Or use Docker:
   docker pull mcr.microsoft.com/mssql/server:2022-latest
   docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourPassword123!" ^
     -p 1433:1433 --name mssql ^
     -d mcr.microsoft.com/mssql/server:2022-latest
`;

    default:
      return "Visit https://www.microsoft.com/en-us/sql-server to install SQL Server";
  }
}

export async function showSqlServerStatus(info: SqlServerInfo, osType: string, isDocker: boolean): Promise<boolean> {
  if (!info.accessible) {
    logError(`SQL Server is not accessible at ${info.host}:${info.port.toString()}`);
    logWarn(getSqlServerInstallInstructions(osType, isDocker));

    const shouldContinue = await askYesNo(
      "SQL Server is required. Have you started SQL Server and want to retry?",
      true
    );

    return shouldContinue;
  }

  logInfo(`SQL Server is accessible at ${info.host}:${info.port.toString()} ✓`);
  if (info.version) {
    logInfo(`Version: ${info.version}`);
  }

  return true;
}

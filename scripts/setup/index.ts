/**
 * Ares Car Rental Setup Script - Main Entry Point
 *
 * This is the main orchestration script that coordinates all setup phases.
 */

import {
  printBanner,
  logStep,
  logInfo,
  logError,
  logSuccess,
  logWarn,
  logDebug,
  setDebugMode,
  startSpinner,
  stopSpinner,
} from "./lib/logger";
import { getOSType, getArch } from "./lib/utils";
import {
  detectOS,
  isSupportedOS,
  getOSDisplayName,
  checkDotnet,
  installDotnetEfTool,
  installDotnetScriptTool,
  checkNode,
  checkBun,
  checkSqlServer,
  checkRequiredPorts,
  type SystemCheckResult,
  type SqlServerInfo,
} from "./checks";
import { setupBackendEnv, setupFrontendEnv, validateAllConfigs } from "./config";
import { verifyDatabaseConnection, setupDatabase, setupSeeding, verifySeededData } from "./database";
import { setupBackendBuild, setupBackendServer, verifyBackendAccessibility, stopBackendServer } from "./backend";
import {
  setupFrontendDependencies,
  setupFrontendServer,
  verifyFrontendAccessibility,
  stopFrontendServer,
} from "./frontend";

interface SetupOptions {
  quick: boolean;
  skipChecks: boolean;
  skipDb: boolean;
  skipBackend: boolean;
  skipFrontend: boolean;
  noSeed: boolean;
  debug: boolean;
  help: boolean;
}

function parseArgs(): SetupOptions {
  const args = process.argv.slice(2);

  return {
    quick: args.includes("--quick"),
    skipChecks: args.includes("--skip-checks"),
    skipDb: args.includes("--skip-db"),
    skipBackend: args.includes("--skip-backend"),
    skipFrontend: args.includes("--skip-frontend"),
    noSeed: args.includes("--no-seed"),
    debug: args.includes("--debug"),
    help: args.includes("--help") || args.includes("-h"),
  };
}

function printHelp(): void {
  printBanner();
  console.log(`
Ares Car Rental Setup Script

Usage:
  bun setup.ts [options]

Options:
  --quick           Skip interactive prompts, use defaults
  --skip-checks     Skip tool installation checks
  --skip-db         Skip database setup
  --skip-backend    Skip backend setup
  --skip-frontend   Skip frontend setup
  --no-seed         Don't seed demo data
  --debug           Enable debug logging
  --help, -h        Show this help message

Examples:
  bun setup.ts                    # Interactive setup (recommended)
  bun setup.ts --quick            # Quick setup with defaults
  bun setup.ts --skip-checks      # Skip tool checks
  bun setup.ts --skip-db          # Skip database, only setup code
  bun setup.ts --debug            # Enable debug output

Full Setup:
  The script will:
  1. Check system requirements (.NET, Bun, SQL Server, optional Node)
  2. Generate secure configuration files
  3. Setup and seed the database
  4. Build and start the backend
  5. Install dependencies and start the frontend
  6. Verify all services are running

For more information, see: SETUP_QUICK_START.md
`);
}

/**
 * Run all system checks
 */
async function runSystemChecks(options: SetupOptions): Promise<SystemCheckResult> {
  logStep("System Checks");

  // Check OS
  const osInfo = await detectOS();
  const supported = isSupportedOS(osInfo.osType);
  if (!supported) {
    logError(`Unsupported OS: ${osInfo.osType}`);
    logInfo("Supported platforms: Windows, Linux, macOS");
    process.exit(1);
  }
  logSuccess(`OS: ${getOSDisplayName(osInfo.osType)} (${osInfo.arch})`);
  if (osInfo.isDocker) {
    logInfo("Running in Docker/devcontainer");
  }

  // Check .NET SDK
  const dotnetInfo = await checkDotnet();
  let efToolReady = dotnetInfo.efToolInstalled;
  let scriptToolReady = dotnetInfo.scriptToolInstalled;
  if (!dotnetInfo.installed) {
    logError(".NET SDK not found");
    logInfo("Please install .NET SDK 8.0 or later:");
    logInfo("  https://dotnet.microsoft.com/download");
    process.exit(1);
  }
  logSuccess(`.NET SDK: ${dotnetInfo.version ?? "unknown"}`);

  if (!efToolReady) {
    logWarn("dotnet-ef tool not installed");
    logInfo("Installing dotnet-ef tool...");
    const installed = await installDotnetEfTool();
    if (!installed) {
      logError("Failed to install dotnet-ef tool");
      process.exit(1);
    }
    efToolReady = true;
  } else {
    logSuccess("dotnet-ef tool is installed");
  }

  if (!scriptToolReady) {
    logWarn("dotnet-script tool not installed");
    logInfo("Installing dotnet-script tool...");
    const installed = await installDotnetScriptTool();
    if (!installed) {
      logError("Failed to install dotnet-script tool");
      process.exit(1);
    }
    scriptToolReady = true;
  } else {
    logSuccess("dotnet-script tool is installed");
  }

  // Check Node.js
  const nodeInfo = await checkNode();
  if (!nodeInfo.installed) {
    logWarn("Node.js not found (optional when using Bun)");
    logInfo("Continuing setup with Bun runtime");
  }

  // Check Node version compatibility
  const nodeVersionOk = nodeInfo.version ? isNodeVersionCompatible(nodeInfo.version) : false;
  if (nodeInfo.installed && !nodeVersionOk) {
    logWarn(`Node.js version ${nodeInfo.version ?? "unknown"} is old (recommend ≥18.0.0)`);
    logInfo("Continuing with Bun; install newer Node.js only if tooling needs it");
  } else if (nodeInfo.installed) {
    logSuccess(`Node.js: ${nodeInfo.version ?? "unknown"}`);
  }

  // Check Bun
  const bunInfo = checkBun();
  if (!bunInfo.installed) {
    logError("Bun not found (this shouldn't happen!)");
    process.exit(1);
  }

  const bunVersionOk = isBunVersionCompatible(bunInfo.version);
  if (!bunVersionOk) {
    logWarn(`Bun version ${bunInfo.version} may be too old (recommend ≥1.0.0)`);
  } else {
    logSuccess(`Bun: ${bunInfo.version}`);
  }

  // Check SQL Server (if not skipping DB)
  let sqlServerInfo: SqlServerInfo = { accessible: false, host: "localhost", port: 1433 };
  if (!options.skipDb) {
    // In devcontainer, SQL Server is at "mssql", otherwise "localhost"
    const sqlHost = osInfo.isDevcontainer || osInfo.isDocker ? "mssql" : "localhost";

    startSpinner(`Checking SQL Server at ${sqlHost}:1433...`);
    sqlServerInfo = await checkSqlServer(sqlHost);
    stopSpinner(true);

    if (!sqlServerInfo.accessible) {
      logWarn("SQL Server not accessible at initial check");
      logInfo("Will prompt for connection details during configuration");
    } else {
      logSuccess(`SQL Server: ${sqlServerInfo.version ?? "connected"}`);
      logInfo(`  Host: ${sqlServerInfo.host}:${String(sqlServerInfo.port)}`);
    }
  }

  // Check ports
  const portsInfo = await checkRequiredPorts();
  if (!portsInfo.backend.available) {
    logWarn(`Port ${String(portsInfo.backend.port)} (backend) is in use`);
    if (portsInfo.backend.processInfo) {
      logInfo(`  Process: ${portsInfo.backend.processInfo}`);
    }
  } else {
    logSuccess(`Port ${String(portsInfo.backend.port)} (backend) is available`);
  }

  if (!portsInfo.frontend.available) {
    logWarn(`Port ${String(portsInfo.frontend.port)} (frontend) is in use`);
    if (portsInfo.frontend.processInfo) {
      logInfo(`  Process: ${portsInfo.frontend.processInfo}`);
    }
  } else {
    logSuccess(`Port ${String(portsInfo.frontend.port)} (frontend) is available`);
  }

  if (!options.skipDb) {
    if (!portsInfo.sqlServer.available) {
      logInfo(`Port ${String(portsInfo.sqlServer.port)} (SQL Server) is in use (expected)`);
    } else {
      // In devcontainer, SQL Server runs in separate container, so local port check shows available
      if (osInfo.isDevcontainer || osInfo.isDocker) {
        logInfo(`Port ${String(portsInfo.sqlServer.port)} (SQL Server) - running in separate container`);
      } else {
        logWarn(`Port ${String(portsInfo.sqlServer.port)} (SQL Server) is not in use`);
      }
    }
  }

  // Build result - all checks must pass
  // Note: SQL Server check is optional - we'll prompt for connection details later
  /* eslint-disable @typescript-eslint/no-unnecessary-condition */
  const allPassed =
    supported && dotnetInfo.installed && efToolReady && scriptToolReady && bunInfo.installed && bunVersionOk;
  // SQL Server check removed - we'll validate connection during config setup

  return {
    allPassed,
    os: {
      supported,
      info: osInfo,
    },
    dotnet: {
      ready: dotnetInfo.installed && efToolReady && scriptToolReady,
      info: dotnetInfo,
    },
    node: {
      ready: !nodeInfo.installed || nodeVersionOk,
      info: nodeInfo,
    },
    bun: {
      ready: bunInfo.installed && bunVersionOk,
      info: bunInfo,
    },
    sqlServer: {
      ready: options.skipDb || sqlServerInfo.accessible,
      info: sqlServerInfo,
    },
    ports: {
      ready: portsInfo.backend.available && portsInfo.frontend.available,
      backend: portsInfo.backend,
      frontend: portsInfo.frontend,
      sqlServer: portsInfo.sqlServer,
    },
  };
  /* eslint-enable @typescript-eslint/no-unnecessary-condition */
}

// Helper functions for version checking
function isNodeVersionCompatible(version: string): boolean {
  const majorVersion = parseInt(version.split(".")[0] ?? "0", 10);
  return majorVersion >= 18;
}

function isBunVersionCompatible(version: string): boolean {
  const majorVersion = parseInt(version.split(".")[0] ?? "0", 10);
  return majorVersion >= 1;
}

/**
 * Setup cleanup handlers for graceful shutdown
 */
function setupCleanupHandlers(): void {
  let isCleaningUp = false;

  const cleanup = async (signal: string) => {
    if (isCleaningUp) {
      return;
    }
    isCleaningUp = true;

    logInfo("");
    logInfo("");
    logWarn(`Received ${signal}, shutting down gracefully...`);
    logInfo("");

    try {
      // Stop frontend if running
      await stopFrontendServer();

      // Stop backend if running
      await stopBackendServer();

      logSuccess("Cleanup completed");
      process.exit(0);
    } catch (error) {
      logError(`Cleanup error: ${error instanceof Error ? error.message : "Unknown error"}`);
      process.exit(1);
    }
  };

  // Handle Ctrl+C
  process.on("SIGINT", () => {
    void cleanup("SIGINT");
  });

  // Handle termination
  process.on("SIGTERM", () => {
    void cleanup("SIGTERM");
  });

  // Handle uncaught errors
  process.on("uncaughtException", (error: Error) => {
    logError(`Uncaught exception: ${error.message}`);
    if (error.stack) {
      logDebug(error.stack);
    }
    void cleanup("uncaughtException");
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason: unknown) => {
    logError(`Unhandled rejection: ${reason instanceof Error ? reason.message : String(reason)}`);
    if (reason instanceof Error && reason.stack) {
      logDebug(reason.stack);
    }
    void cleanup("unhandledRejection");
  });
}

async function main(): Promise<void> {
  const options = parseArgs();

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  if (options.debug) {
    setDebugMode(true);
  }

  // Setup cleanup handlers
  setupCleanupHandlers();

  printBanner();

  // Show system info
  logStep("System Information");
  logInfo(`OS: ${getOSType()}`);
  logInfo(`Architecture: ${getArch()}`);
  logInfo(`Bun version: ${Bun.version}`);
  logInfo("");

  // Run system checks
  if (!options.skipChecks) {
    const checkResult = await runSystemChecks(options);

    if (!checkResult.allPassed) {
      logError("System checks failed. Please fix the issues above and try again.");
      process.exit(1);
    }

    logInfo("");
    logSuccess("All system checks passed!");
    logInfo("");
  } else {
    logWarn("Skipping system checks (--skip-checks)");
    logInfo("");
  }

  // Setup configuration
  logStep("Configuration");

  // Detect if we're in devcontainer
  const osInfo = await detectOS();
  const isDevcontainer = osInfo.isDevcontainer || osInfo.isDocker;

  try {
    // Setup backend .env
    const backendConfig = await setupBackendEnv(options.quick, isDevcontainer);
    logInfo("");

    // Setup frontend .env.local (pass backend URL)
    const backendUrl = backendConfig.jwtIssuer || "http://localhost:5000";
    await setupFrontendEnv(options.quick, backendUrl);
    logInfo("");

    // Validate all configuration files
    const configValid = await validateAllConfigs();

    if (!configValid) {
      logError("Configuration validation failed. Please fix the errors above.");
      process.exit(1);
    }

    logInfo("");
    logSuccess("Configuration completed successfully!");
    logInfo("");
  } catch (error) {
    logError(`Configuration failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    if (error instanceof Error && error.stack) {
      logDebug(error.stack);
    }
    process.exit(1);
  }

  // Setup database
  if (!options.skipDb) {
    logStep("Database Setup");

    try {
      // Test database connection
      const connectionOk = await verifyDatabaseConnection();
      if (!connectionOk) {
        logError("Database connection failed. Please fix the issues above and try again.");
        process.exit(1);
      }
      logInfo("");

      // Run migrations
      const migrationsOk = await setupDatabase();
      if (!migrationsOk) {
        logError("Database migrations failed. Please fix the issues above and try again.");
        process.exit(1);
      }
      logInfo("");

      // Seed demo data
      const seedingOk = await setupSeeding(options.quick);
      if (!seedingOk) {
        logWarn("Seeding failed or was skipped");
      }
      logInfo("");

      // Verify seeded data
      const verification = await verifySeededData();
      if (!verification.success) {
        logWarn("Data verification completed with warnings");
        if (verification.warnings.length > 0) {
          logInfo("Warnings:");
          for (const warning of verification.warnings) {
            logWarn(`  - ${warning}`);
          }
        }
      }
      logInfo("");

      logSuccess("Database setup completed successfully!");
      logInfo("");
    } catch (error) {
      logError(`Database setup failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      if (error instanceof Error && error.stack) {
        logDebug(error.stack);
      }
      process.exit(1);
    }
  } else {
    logWarn("Skipping database setup (--skip-db)");
    logInfo("");
  }

  // Setup backend
  if (!options.skipBackend) {
    logStep("Backend Setup");

    try {
      // Build backend
      const buildOk = await setupBackendBuild();
      if (!buildOk) {
        logError("Backend build failed. Please fix the issues above and try again.");
        process.exit(1);
      }
      logInfo("");

      // Start backend server
      const backendUrl = await setupBackendServer();
      if (!backendUrl) {
        logError("Failed to start backend server. Please fix the issues above and try again.");
        process.exit(1);
      }
      logInfo("");

      // Verify backend accessibility
      const backendOk = await verifyBackendAccessibility(backendUrl);
      if (!backendOk) {
        logError("Backend verification failed. Please fix the issues above and try again.");
        await stopBackendServer();
        process.exit(1);
      }
      logInfo("");

      logSuccess("Backend setup completed successfully!");
      logInfo("");
      logInfo("Backend is running at: " + backendUrl);
      logInfo("");
    } catch (error) {
      logError(`Backend setup failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      if (error instanceof Error && error.stack) {
        logDebug(error.stack);
      }
      await stopBackendServer();
      process.exit(1);
    }
  } else {
    logWarn("Skipping backend setup (--skip-backend)");
    logInfo("");
  }

  // Setup frontend
  if (!options.skipFrontend) {
    logStep("Frontend Setup");

    try {
      // Install dependencies
      const depsOk = await setupFrontendDependencies();
      if (!depsOk) {
        logError("Frontend dependency installation failed. Please fix the issues above and try again.");
        await stopBackendServer();
        process.exit(1);
      }
      logInfo("");

      // Get backend URL for frontend
      const backendUrl = options.skipBackend ? "http://localhost:5000" : "http://localhost:5000";

      // Start frontend server
      const frontendUrl = await setupFrontendServer(3000, backendUrl);
      if (!frontendUrl) {
        logError("Failed to start frontend server. Please fix the issues above and try again.");
        await stopBackendServer();
        process.exit(1);
      }
      logInfo("");

      // Verify frontend accessibility
      const frontendOk = await verifyFrontendAccessibility(frontendUrl);
      if (!frontendOk) {
        logError("Frontend verification failed. Please fix the issues above and try again.");
        await stopFrontendServer();
        await stopBackendServer();
        process.exit(1);
      }
      logInfo("");

      logSuccess("Frontend setup completed successfully!");
      logInfo("");
      logInfo("Frontend is running at: " + frontendUrl);
      logInfo("");
    } catch (error) {
      logError(`Frontend setup failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      if (error instanceof Error && error.stack) {
        logDebug(error.stack);
      }
      await stopFrontendServer();
      await stopBackendServer();
      process.exit(1);
    }
  } else {
    logWarn("Skipping frontend setup (--skip-frontend)");
    logInfo("");
  }

  // Setup complete!
  logStep("Setup Complete");
  logSuccess("🎉 Ares Car Rental setup completed successfully!");
  logInfo("");

  if (!options.skipBackend && !options.skipFrontend) {
    logInfo("Your application is now running:");
    logInfo("  - Backend:  http://localhost:5000");
    logInfo("  - Frontend: http://localhost:3000");
    logInfo("  - Swagger:  http://localhost:5000/swagger");
    logInfo("");
    logInfo("Press Ctrl+C to stop all servers");
    logInfo("");

    // Keep the process running
    await waitForever();
  } else if (!options.skipBackend) {
    logInfo("Backend is running at: http://localhost:5000");
    logInfo("Press Ctrl+C to stop the backend server");
    logInfo("");

    // Keep the process running
    await waitForever();
  } else if (!options.skipFrontend) {
    logInfo("Frontend is running at: http://localhost:3000");
    logInfo("Press Ctrl+C to stop the frontend server");
    logInfo("");

    // Keep the process running
    await waitForever();
  } else {
    logInfo("Next steps:");
    logInfo("  1. Start the backend: cd backend/Api && dotnet run");
    logInfo("  2. Start the frontend: cd frontend && bun run dev");
    logInfo("  3. Access the application at http://localhost:3000");
    logInfo("");
  }
}

/**
 * Wait indefinitely (until interrupted)
 */
async function waitForever(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    await Bun.sleep(1000);
  }
}

// Run main function
try {
  await main();
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  logError(`Setup failed: ${errorMessage}`);
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
}

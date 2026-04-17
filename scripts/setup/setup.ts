#!/usr/bin/env bun

/**
 * Ares Car Rental Setup Script
 *
 * This script sets up the entire Ares Car Rental application:
 * - Checks for required tools (.NET, Node, Bun, SQL Server)
 * - Generates secure secrets
 * - Creates backend/.env and frontend/.env.local
 * - Tests database connection
 * - Runs migrations and seeds demo data
 * - Starts backend and frontend
 * - Verifies health endpoints
 *
 * Usage:
 *   bun setup.ts              # Interactive mode
 *   bun setup.ts --quick      # Quick mode with defaults
 *   bun setup.ts --help       # Show help
 */

// Import and run the main setup script
try {
  await import("./index.ts");
} catch (error) {
  console.error("Failed to run setup script:", error);
  process.exit(1);
}

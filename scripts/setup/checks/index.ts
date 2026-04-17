/**
 * System Checks Module
 * Exports all system check functions
 */

// Export types and functions from each module
export type { SystemInfo } from "./os";
export { detectOS, isSupportedOS, getOSDisplayName } from "./os";

export type { DotnetInfo } from "./dotnet";
export {
  checkDotnet,
  installDotnetEfTool,
  installDotnetScriptTool,
  getDotnetInstallInstructions,
  showDotnetStatus,
} from "./dotnet";

export type { NodeInfo } from "./node";
export { checkNode, getNodeInstallInstructions, showNodeStatus } from "./node";

export type { BunInfo } from "./bun";
export { checkBun, getBunInstallInstructions, showBunStatus } from "./bun";

export type { SqlServerInfo } from "./sqlserver";
export { checkSqlServer, getSqlServerInstallInstructions, showSqlServerStatus } from "./sqlserver";

export type { PortInfo } from "./ports";
export { checkPort, checkRequiredPorts, killProcessOnPort, showPortStatus } from "./ports";

export interface SystemCheckResult {
  allPassed: boolean;
  os: {
    supported: boolean;
    info: import("./os").SystemInfo;
  };
  dotnet: {
    ready: boolean;
    info: import("./dotnet").DotnetInfo;
  };
  node: {
    ready: boolean;
    info: import("./node").NodeInfo;
  };
  bun: {
    ready: boolean;
    info: import("./bun").BunInfo;
  };
  sqlServer: {
    ready: boolean;
    info: import("./sqlserver").SqlServerInfo;
  };
  ports: {
    ready: boolean;
    backend: import("./ports").PortInfo;
    frontend: import("./ports").PortInfo;
    sqlServer: import("./ports").PortInfo;
  };
}

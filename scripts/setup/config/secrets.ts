/**
 * Secrets Generation Module
 * Generates secure secrets for JWT, NextAuth, and other sensitive values
 */

import { logDebug, logInfo } from "../lib/logger";

export interface GeneratedSecrets {
  jwtSecret: string;
  jwtIssuer: string;
  jwtAudience: string;
  nextAuthSecret: string;
  nextAuthUrl: string;
}

/**
 * Generate a cryptographically secure random string
 */
export function generateSecureSecret(length = 64): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  // Convert to base64 and remove padding
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
    .substring(0, length);
}

/**
 * Generate a secure JWT secret (64 characters)
 */
export function generateJwtSecret(): string {
  logDebug("Generating JWT secret...");
  return generateSecureSecret(64);
}

/**
 * Generate a secure NextAuth secret (32 characters)
 */
export function generateNextAuthSecret(): string {
  logDebug("Generating NextAuth secret...");
  return generateSecureSecret(32);
}

/**
 * Generate all required secrets
 */
export function generateAllSecrets(
  frontendUrl = "http://localhost:3000",
  backendUrl = "http://localhost:5000"
): GeneratedSecrets {
  logInfo("Generating secure secrets...");

  const secrets: GeneratedSecrets = {
    jwtSecret: generateJwtSecret(),
    jwtIssuer: backendUrl,
    jwtAudience: frontendUrl,
    nextAuthSecret: generateNextAuthSecret(),
    nextAuthUrl: frontendUrl,
  };

  logDebug(`JWT Secret: ${secrets.jwtSecret.substring(0, 10)}...`);
  logDebug(`NextAuth Secret: ${secrets.nextAuthSecret.substring(0, 10)}...`);

  return secrets;
}

/**
 * Validate a secret meets minimum security requirements
 */
export function validateSecret(secret: string, minLength = 32): boolean {
  if (!secret || secret.length < minLength) {
    return false;
  }

  // Check for common weak secrets
  const weakSecrets = ["secret", "password", "12345", "changeme", "default", "test", "demo", "example"];

  const lowerSecret = secret.toLowerCase();
  for (const weak of weakSecrets) {
    if (lowerSecret.includes(weak)) {
      return false;
    }
  }

  return true;
}

/**
 * Check if a secret appears to be auto-generated or user-provided
 */
export function isGeneratedSecret(secret: string): boolean {
  // Generated secrets are typically base64-like and long
  return secret.length >= 32 && /^[A-Za-z0-9_-]+$/.test(secret);
}

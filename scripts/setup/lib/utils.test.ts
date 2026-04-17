/**
 * Unit tests for utility functions
 */

import { describe, test, expect } from "bun:test";
import { getOSType, getArch, generateRandomString, generateSecureSecret, isPortAvailable } from "./utils";

describe("OS Detection", () => {
  test("getOSType returns a valid OS type", () => {
    const osType = getOSType();
    expect(["windows", "linux", "darwin", "unknown"]).toContain(osType);
  });

  test("getArch returns a valid architecture", () => {
    const arch = getArch();
    expect(typeof arch).toBe("string");
    expect(arch.length).toBeGreaterThan(0);
  });

  test("getOSType returns consistent value", () => {
    const osType1 = getOSType();
    const osType2 = getOSType();
    expect(osType1).toBe(osType2);
  });
});

describe("Random String Generation", () => {
  test("generateRandomString generates string of correct length", () => {
    const length = 32;
    const result = generateRandomString(length);
    expect(result.length).toBe(length);
  });

  test("generateRandomString generates different strings", () => {
    const str1 = generateRandomString(32);
    const str2 = generateRandomString(32);
    expect(str1).not.toBe(str2);
  });

  test("generateRandomString handles small lengths", () => {
    const result = generateRandomString(1);
    expect(result.length).toBe(1);
  });

  test("generateRandomString handles large lengths", () => {
    const result = generateRandomString(1000);
    expect(result.length).toBe(1000);
  });

  test("generateRandomString returns non-empty string", () => {
    const result = generateRandomString(16);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("Secure Secret Generation", () => {
  test("generateSecureSecret generates base64 string", () => {
    const result = generateSecureSecret(32);
    // Base64 regex
    const base64Regex = /^[A-Za-z0-9+/]+=*$/;
    expect(base64Regex.test(result)).toBe(true);
  });

  test("generateSecureSecret generates different secrets", () => {
    const secret1 = generateSecureSecret(32);
    const secret2 = generateSecureSecret(32);
    expect(secret1).not.toBe(secret2);
  });

  test("generateSecureSecret generates longer strings for more bytes", () => {
    const secret32 = generateSecureSecret(32);
    const secret64 = generateSecureSecret(64);
    expect(secret64.length).toBeGreaterThan(secret32.length);
  });

  test("generateSecureSecret handles standard JWT secret size", () => {
    const secret = generateSecureSecret(64);
    expect(secret.length).toBeGreaterThan(0);
    // JWT secrets should be at least 256 bits (32 bytes) which is ~44 base64 chars
    expect(secret.length).toBeGreaterThanOrEqual(44);
  });

  test("generateSecureSecret with default parameter", () => {
    const secret = generateSecureSecret();
    expect(secret.length).toBeGreaterThan(0);
  });
});

describe("Port Availability", () => {
  test("isPortAvailable returns boolean", () => {
    const result = isPortAvailable(9999);
    expect(typeof result).toBe("boolean");
  });

  test("isPortAvailable detects available high port", () => {
    // Use a high port number that's likely to be available
    const result = isPortAvailable(54321);
    expect(typeof result).toBe("boolean");
  });

  test("isPortAvailable handles invalid port gracefully", () => {
    const result = isPortAvailable(0);
    expect(typeof result).toBe("boolean");
  });
});

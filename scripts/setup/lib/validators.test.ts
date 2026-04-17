/**
 * Unit tests for validation schemas
 */

import { describe, test, expect } from "bun:test";
import {
  connectionStringSchema,
  jwtSecretSchema,
  urlSchema,
  portSchema,
  passwordSchema,
  emailSchema,
  validateUrl,
  validatePort,
  validateJwtSecret,
  validatePassword,
  validateEmail,
  validateConnectionString,
} from "./validators";

describe("Connection String Schema", () => {
  test("validates correct SQL Server connection string", () => {
    const validConnectionString = "Server=localhost;Database=ares;User=sa;Password=Test@1234;";
    const result = connectionStringSchema.safeParse(validConnectionString);
    expect(result.success).toBe(true);
  });

  test("validates connection string with different formats", () => {
    const formats = [
      "Server=localhost;Database=ares;User=sa;Password=Test@1234;",
      "Server=localhost,1433;Database=ares;User=sa;Password=Test@1234;",
    ];

    for (const connectionString of formats) {
      const result = connectionStringSchema.safeParse(connectionString);
      expect(result.success).toBe(true);
    }
  });

  test("rejects empty connection string", () => {
    const result = connectionStringSchema.safeParse("");
    expect(result.success).toBe(false);
  });

  test("rejects invalid connection string", () => {
    const result = connectionStringSchema.safeParse("not a connection string");
    expect(result.success).toBe(false);
  });

  test("validateConnectionString function works", () => {
    expect(validateConnectionString("Server=localhost;Database=ares;User=sa;Password=Test@1234;")).toBe(true);
    expect(validateConnectionString("invalid")).toBe(false);
  });
});

describe("JWT Secret Schema", () => {
  test("validates JWT secret with minimum length", () => {
    const validSecret = "a".repeat(32); // 32 characters minimum
    const result = jwtSecretSchema.safeParse(validSecret);
    expect(result.success).toBe(true);
  });

  test("validates long JWT secret", () => {
    const validSecret = "a".repeat(128);
    const result = jwtSecretSchema.safeParse(validSecret);
    expect(result.success).toBe(true);
  });

  test("rejects JWT secret that is too short", () => {
    const shortSecret = "a".repeat(31); // Less than 32 characters
    const result = jwtSecretSchema.safeParse(shortSecret);
    expect(result.success).toBe(false);
  });

  test("rejects empty JWT secret", () => {
    const result = jwtSecretSchema.safeParse("");
    expect(result.success).toBe(false);
  });

  test("validateJwtSecret function works", () => {
    expect(validateJwtSecret("a".repeat(32))).toBe(true);
    expect(validateJwtSecret("short")).toBe(false);
  });
});

describe("URL Schema", () => {
  test("validates HTTP URLs", () => {
    const urls = ["http://localhost:3000", "http://example.com", "http://192.168.1.1:8080"];

    for (const url of urls) {
      const result = urlSchema.safeParse(url);
      expect(result.success).toBe(true);
    }
  });

  test("validates HTTPS URLs", () => {
    const urls = ["https://example.com", "https://api.example.com/v1", "https://subdomain.example.com:443"];

    for (const url of urls) {
      const result = urlSchema.safeParse(url);
      expect(result.success).toBe(true);
    }
  });

  test("rejects invalid URLs", () => {
    const invalidUrls = ["not a url", "", "http://"];

    for (const url of invalidUrls) {
      const result = urlSchema.safeParse(url);
      expect(result.success).toBe(false);
    }
  });

  test("validateUrl function works", () => {
    expect(validateUrl("http://localhost:3000")).toBe(true);
    expect(validateUrl("invalid")).toBe(false);
  });
});

describe("Port Schema", () => {
  test("validates common port numbers", () => {
    const ports = [80, 443, 3000, 5000, 8080, 1433];

    for (const port of ports) {
      const result = portSchema.safeParse(port);
      expect(result.success).toBe(true);
    }
  });

  test("validates edge case ports", () => {
    const result1 = portSchema.safeParse(1);
    const result2 = portSchema.safeParse(65535);
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
  });

  test("rejects invalid port numbers", () => {
    const invalidPorts = [0, -1, 65536, 100000];

    for (const port of invalidPorts) {
      const result = portSchema.safeParse(port);
      expect(result.success).toBe(false);
    }
  });

  test("rejects non-integer ports", () => {
    const result = portSchema.safeParse(3000.5);
    expect(result.success).toBe(false);
  });

  test("validatePort function works", () => {
    expect(validatePort(3000)).toBe(true);
    expect(validatePort(0)).toBe(false);
    expect(validatePort(70000)).toBe(false);
  });
});

describe("Password Schema", () => {
  test("validates password with minimum length", () => {
    const validPassword = "password123";
    const result = passwordSchema.safeParse(validPassword);
    expect(result.success).toBe(true);
  });

  test("rejects password that is too short", () => {
    const shortPassword = "pass";
    const result = passwordSchema.safeParse(shortPassword);
    expect(result.success).toBe(false);
  });

  test("validatePassword function works", () => {
    expect(validatePassword("password123")).toBe(true);
    expect(validatePassword("short")).toBe(false);
  });
});

describe("Email Schema", () => {
  test("validates correct email addresses", () => {
    const emails = ["user@example.com", "test.user@example.co.uk", "admin+tag@domain.com"];

    for (const email of emails) {
      const result = emailSchema.safeParse(email);
      expect(result.success).toBe(true);
    }
  });

  test("rejects invalid email addresses", () => {
    const invalidEmails = ["not-an-email", "@example.com", "user@", "user"];

    for (const email of invalidEmails) {
      const result = emailSchema.safeParse(email);
      expect(result.success).toBe(false);
    }
  });

  test("validateEmail function works", () => {
    expect(validateEmail("user@example.com")).toBe(true);
    expect(validateEmail("invalid")).toBe(false);
  });
});

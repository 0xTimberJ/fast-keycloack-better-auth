import { envVars } from "@/config/env";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";

/**
 * Generate a key from the secret
 */
function getKey(): Buffer {
  return scryptSync(envVars.BETTER_AUTH_SECRET, "salt", 32);
}

/**
 * Encrypt a value
 */
export function encryptValue(value: string): string {
  const iv = randomBytes(16);
  const key = getKey();
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(value, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt a value
 */
export function decryptValue(encrypted: string): string | null {
  try {
    const [ivHex, authTagHex, encryptedData] = encrypted.split(":");

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const key = getKey();

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Failed to decrypt value:", error);
    return null;
  }
}

"use server";

import { cookies } from "next/headers";
import { decryptValue, encryptValue } from "@/lib/crypto";
import { envVars } from "@/config/env";

/**
 * Refresh Keycloak tokens using the refresh token
 * Returns new access_token, id_token, and refresh_token
 */
export async function refreshKeycloakTokens(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // 1. Get refresh token
    const cookieStore = await cookies();
    const encryptedRefreshToken = cookieStore.get("keycloak_refresh_token");

    if (!encryptedRefreshToken?.value) {
      return { success: false, error: "No refresh token found" };
    }

    const refreshToken = decryptValue(encryptedRefreshToken.value);
    if (!refreshToken) {
      return { success: false, error: "Failed to decrypt refresh token" };
    }

    // 2. Call Keycloak to refresh tokens
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: envVars.KEYCLOAK_CLIENT_ID,
      client_secret: envVars.KEYCLOAK_CLIENT_SECRET,
      refresh_token: refreshToken,
    });

    const response = await fetch(
      `${envVars.KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      }
    );

    if (!response.ok) {
      console.error("Token refresh failed:", response.status);
      return { success: false, error: `Refresh failed: ${response.status}` };
    }

    const tokens = await response.json();
    console.log("✅ Tokens refreshed successfully");

    // 3. Update cookies with new tokens
    const encryptedIdToken = encryptValue(tokens.id_token);
    const encryptedAccessToken = encryptValue(tokens.access_token);
    const encryptedNewRefreshToken = encryptValue(tokens.refresh_token);

    cookieStore.set("keycloak_id_token", encryptedIdToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: tokens.expires_in,
    });

    cookieStore.set("keycloak_access_token", encryptedAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: tokens.expires_in,
    });

    cookieStore.set("keycloak_refresh_token", encryptedNewRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: tokens.refresh_expires_in,
    });

    return { success: true };
  } catch (error) {
    console.error("Error refreshing tokens:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Check if access token is expired or about to expire
 * Returns true if token will expire in less than 1 minute
 */
export async function isAccessTokenExpired(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("keycloak_access_token");

    if (!cookie) {
      return true;
    }
    return false;
  } catch (error) {
    return true;
  }
}

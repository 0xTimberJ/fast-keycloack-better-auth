"use server";

import { cookies } from "next/headers";
import { decryptValue } from "@/lib/crypto";

interface KeycloakTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * Get Keycloak ID token from encrypted cookie
 * This token is used for Keycloak logout
 */
export async function getIdToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const encryptedCookie = cookieStore.get("keycloak_id_token");

    if (!encryptedCookie?.value) {
      console.warn("⚠️ No Keycloak ID token found in cookies");
      return null;
    }

    const decrypted = decryptValue(encryptedCookie.value);
    if (!decrypted) {
      console.error("❌ Failed to decrypt ID token");
      return null;
    }

    return decrypted;
  } catch (error) {
    console.error("❌ Error retrieving ID token:", error);
    return null;
  }
}

/**
 * Get Keycloak access token from encrypted cookie
 * This token should be sent to the backend API for authentication
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const encryptedCookie = cookieStore.get("keycloak_access_token");

    if (!encryptedCookie?.value) {
      console.warn("⚠️ No Keycloak access token found in cookies");

      // Try to refresh if we have a refresh token
      const { refreshKeycloakTokens } = await import("@/app/actions/refresh-tokens");
      const refreshResult = await refreshKeycloakTokens();

      if (refreshResult.success) {
        // Get the new token after refresh
        const newCookie = (await cookies()).get("keycloak_access_token");
        if (newCookie?.value) {
          return decryptValue(newCookie.value);
        }
      }

      return null;
    }

    const decrypted = decryptValue(encryptedCookie.value);
    if (!decrypted) {
      console.error("❌ Failed to decrypt access token");
      return null;
    }

    return decrypted;
  } catch (error) {
    console.error("❌ Error retrieving access token:", error);
    return null;
  }
}

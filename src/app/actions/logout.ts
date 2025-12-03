"use server";

import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";
import { accountInfo } from "better-auth/api";
import { Account } from "better-auth";
import { envVars } from "@/config/env";

// Helper to call Keycloak logout endpoint
async function logoutFromKeycloak(idToken: string) {
  try {
    const KEYCLOAK_ISSUER = envVars.KEYCLOAK_ISSUER;
    if (!KEYCLOAK_ISSUER) {
      console.error("KEYCLOAK_ISSUER not configured");
      return;
    }

    const logOutUrl = new URL(
      `${KEYCLOAK_ISSUER}/protocol/openid-connect/logout`,
    );
    logOutUrl.searchParams.set("id_token_hint", idToken);

    const response = await fetch(logOutUrl.toString(), {
      method: "GET",
    });

    if (!response.ok) {
      console.error(
        `Keycloak logout failed: ${response.status} ${response.statusText}`,
      );
    }
  } catch (error) {
    // Log error but don't throw - logout should continue even if Keycloak call fails
    console.error("Error during Keycloak logout:", error);
  }
}

export const logout = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  console.log("session", session);

  // TODO: NEED tokenId from the accountInfo session to logout properly from keycloack 
}
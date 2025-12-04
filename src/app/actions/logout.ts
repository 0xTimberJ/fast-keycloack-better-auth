"use server";

import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";
import { envVars } from "@/config/env";
import { revalidatePath } from "next/cache";
import { getIdToken } from "@/lib/auth-helper";

async function logoutFromKeycloak(idToken: string) {
  try {
    const logOutUrl = new URL(
      `${envVars.KEYCLOAK_ISSUER}/protocol/openid-connect/logout`
    );
    logOutUrl.searchParams.set("id_token_hint", idToken);

    const response = await fetch(logOutUrl.toString(), { method: "GET" });

    if (!response.ok) {
      console.error(`Keycloak logout failed: ${response.status}`);
    } else {
      console.log("✅ Keycloak logout successful");
    }
  } catch (error) {
    console.error("Keycloak logout error:", error);
  }
}

export async function logout() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  try {
    const idToken = await getIdToken();

    if (idToken) {
      await logoutFromKeycloak(idToken);

      // Delete Keycloak cookies (id_token, access_token, refresh_token)
      allCookies.forEach((cookie) => {
        if (cookie.name.startsWith("keycloak_")) {
          cookieStore.delete(cookie.name);
        }
      });
    } else {
      console.warn("⚠️ No id_token found, skipping Keycloak logout");
    }
  } catch (error) {
    console.error("Error during logout:", error);
  }

  // Logout Better Auth
  await auth.api.signOut({
    headers: await headers(),
  });

  // Delete all better-auth related cookies
  allCookies.forEach((cookie) => {
    if (cookie.name.startsWith("better-auth.")) {
      cookieStore.delete(cookie.name);
    }
  });

  revalidatePath("/");
}


"use server";

import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";
import { envVars } from "@/config/env";
import { revalidatePath } from "next/cache";

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

async function getIdToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const encryptedCookie = cookieStore.get("keycloak_id_token_encrypted");

    if (!encryptedCookie?.value) {
      return null;
    }

    const { decryptValue } = await import("@/lib/crypto");
    return decryptValue(encryptedCookie.value);
  } catch (error) {
    console.error("Error retrieving id_token:", error);
    return null;
  }
}

export async function logout() {
  try {
    const idToken = await getIdToken();

    if (idToken) {
      await logoutFromKeycloak(idToken);

      const cookieStore = await cookies();
      cookieStore.delete("keycloak_id_token_encrypted");
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

  // Get all cookies
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  // Delete all better-auth related cookies
  allCookies.forEach((cookie) => {
    if (cookie.name.startsWith("better-auth.")) {
      cookieStore.delete(cookie.name);
    }
  });

  revalidatePath("/");
}
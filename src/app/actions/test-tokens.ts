"use server";

import { cookies } from "next/headers";
import { getAccessToken, getIdToken } from "@/lib/auth-helper";
import { refreshKeycloakTokens } from "./refresh-tokens";
import { decryptValue } from "@/lib/crypto";

/**
 * 🧪 Test 1: Verify that 3 cookies are created at login
 */
export async function testCookiesCreated() {
  const cookieStore = await cookies();

  const idToken = cookieStore.get("keycloak_id_token");
  const accessToken = cookieStore.get("keycloak_access_token");
  const refreshToken = cookieStore.get("keycloak_refresh_token");

  console.log("🧪 Test 1: Cookies created");
  console.log("  - ID Token:", idToken ? "✅ Present" : "❌ Absent");
  console.log("  - Access Token:", accessToken ? "✅ Present" : "❌ Absent");
  console.log("  - Refresh Token:", refreshToken ? "✅ Present" : "❌ Absent");

  return {
    success: !!(idToken && accessToken && refreshToken),
    details: {
      idToken: !!idToken,
      accessToken: !!accessToken,
      refreshToken: !!refreshToken,
    }
  };
}

/**
 * 🧪 Test 2: Verify that tokens are encrypted
 */
export async function testTokensEncrypted() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("keycloak_access_token");

  if (!accessToken?.value) {
    return { success: false, error: "No access token found" };
  }

  // An unencrypted JWT starts with "eyJ"
  const isEncrypted = !accessToken.value.startsWith("eyJ");

  console.log("🧪 Test 2: Encryption");
  console.log("  - Cookie value:", accessToken.value.substring(0, 50) + "...");
  console.log("  - Is encrypted:", isEncrypted ? "✅ YES" : "❌ NO (plain JWT!)");

  return {
    success: isEncrypted,
    cookiePreview: accessToken.value.substring(0, 50),
  };
}

/**
 * 🧪 Test 3: Verify decryption
 */
export async function testDecryption() {
  const cookieStore = await cookies();
  const encryptedToken = cookieStore.get("keycloak_access_token");

  if (!encryptedToken?.value) {
    return { success: false, error: "No access token found" };
  }

  const decrypted = decryptValue(encryptedToken.value);

  // A valid JWT has 3 parts separated by dots
  const isValidJWT = decrypted ? decrypted.split('.').length === 3 : false;

  console.log("🧪 Test 3: Decryption");
  console.log("  - Decryption:", decrypted ? "✅ Success" : "❌ Failed");
  console.log("  - Valid JWT:", isValidJWT ? "✅ YES" : "❌ NO");
  if (decrypted) {
    console.log("  - Token preview:", decrypted.substring(0, 50) + "...");
  }

  return {
    success: !!decrypted && isValidJWT,
    tokenPreview: decrypted?.substring(0, 50),
  };
}

/**
 * 🧪 Test 4: Test getAccessToken helper
 */
export async function testGetAccessToken() {
  console.log("🧪 Test 4: getAccessToken()");

  const token = await getAccessToken();

  console.log("  - Token retrieved:", token ? "✅ YES" : "❌ NO");
  if (token) {
    console.log("  - Token preview:", token.substring(0, 50) + "...");
    console.log("  - Is JWT:", token.split('.').length === 3 ? "✅ YES" : "❌ NO");
  }

  return {
    success: !!token,
    tokenPreview: token?.substring(0, 50),
  };
}

/**
 * 🧪 Test 5: Test manual refresh
 */
export async function testManualRefresh() {
  console.log("🧪 Test 5: Manual refresh");

  const result = await refreshKeycloakTokens();

  console.log("  - Refresh:", result.success ? "✅ Success" : "❌ Failed");
  if (!result.success) {
    console.log("  - Error:", result.error);
  }

  // Verify that new cookies are created
  if (result.success) {
    const cookieStore = await cookies();
    const newToken = cookieStore.get("keycloak_access_token");
    console.log("  - New token:", newToken ? "✅ Created" : "❌ Absent");
  }

  return result;
}

/**
 * 🧪 Test 6: Simulate expiration and auto-refresh
 * (Deletes access_token to simulate expiration)
 */
export async function testAutoRefresh() {
  console.log("🧪 Test 6: Auto-refresh");

  // 1. Delete access_token to simulate expiration
  const cookieStore = await cookies();
  cookieStore.delete("keycloak_access_token");
  console.log("  - Access token deleted (expiration simulation)");

  // 2. Try to retrieve token - should auto-refresh
  const token = await getAccessToken();

  console.log("  - Auto-refresh:", token ? "✅ Success" : "❌ Failed");
  if (token) {
    console.log("  - New token retrieved:", token.substring(0, 50) + "...");
  }

  return {
    success: !!token,
    tokenPreview: token?.substring(0, 50),
  };
}

/**
 * 🧪 Test 7: Decode JWT and verify expiration
 */
export async function testJWTExpiration() {
  const token = await getAccessToken();

  if (!token) {
    return { success: false, error: "No token found" };
  }

  try {
    // Decode JWT payload (part 2)
    const payload = JSON.parse(atob(token.split('.')[1]));

    const now = Date.now() / 1000; // Timestamp in seconds
    const expiresAt = payload.exp;
    const issuedAt = payload.iat;
    const timeLeft = expiresAt - now;

    console.log("🧪 Test 7: JWT Expiration");
    console.log("  - Issued at:", new Date(issuedAt * 1000).toLocaleString());
    console.log("  - Expires at:", new Date(expiresAt * 1000).toLocaleString());
    console.log("  - Time left:", Math.floor(timeLeft / 60), "minutes", Math.floor(timeLeft % 60), "seconds");
    console.log("  - Expired:", timeLeft < 0 ? "❌ YES" : "✅ NO");

    return {
      success: true,
      issuedAt: new Date(issuedAt * 1000).toISOString(),
      expiresAt: new Date(expiresAt * 1000).toISOString(),
      timeLeftSeconds: Math.floor(timeLeft),
      isExpired: timeLeft < 0,
    };
  } catch (error) {
    console.error("❌ Error decoding JWT:", error);
    return { success: false, error: "Failed to decode JWT" };
  }
}

/**
 * 🎯 Run all tests
 */
export async function runAllTests() {
  console.log("\n🎯 === STARTING TESTS ===\n");

  const results = {
    test1: await testCookiesCreated(),
    test2: await testTokensEncrypted(),
    test3: await testDecryption(),
    test4: await testGetAccessToken(),
    test5: await testManualRefresh(),
    test6: await testAutoRefresh(),
    test7: await testJWTExpiration(),
  };

  const allSuccess = Object.values(results).every(r => r.success);

  console.log("\n🎯 === RESULTS ===");
  console.log("Test 1 - Cookies created:", results.test1.success ? "✅" : "❌");
  console.log("Test 2 - Encryption:", results.test2.success ? "✅" : "❌");
  console.log("Test 3 - Decryption:", results.test3.success ? "✅" : "❌");
  console.log("Test 4 - getAccessToken:", results.test4.success ? "✅" : "❌");
  console.log("Test 5 - Manual refresh:", results.test5.success ? "✅" : "❌");
  console.log("Test 6 - Auto-refresh:", results.test6.success ? "✅" : "❌");
  console.log("Test 7 - JWT Expiration:", results.test7.success ? "✅" : "❌");
  console.log("\nOverall result:", allSuccess ? "✅ ALL TESTS PASSED" : "⚠️ SOME TESTS FAILED");

  return {
    allSuccess,
    results,
  };
}

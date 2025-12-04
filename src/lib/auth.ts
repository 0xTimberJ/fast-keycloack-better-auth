import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import { envVars } from "@/config/env";
import { cookies } from "next/headers";

export const auth = betterAuth({
  baseURL: envVars.BETTER_AUTH_URL,
  secret: envVars.BETTER_AUTH_SECRET,
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "keycloak",
          clientId: envVars.KEYCLOAK_CLIENT_ID,
          clientSecret: envVars.KEYCLOAK_CLIENT_SECRET,
          authorizationUrl: `${envVars.KEYCLOAK_ISSUER}/protocol/openid-connect/auth`,
          tokenUrl: `${envVars.KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
          userInfoUrl: `${envVars.KEYCLOAK_ISSUER}/protocol/openid-connect/userinfo`,
          redirectURI: `${envVars.BETTER_AUTH_URL}/api/auth/callback/keycloak`,
          scopes: ["openid", "profile", "email"],
          pkce: true,
          mapProfileToUser: (profile) => ({
            id: profile.sub,
            email: profile.email,
            emailVerified: profile.email_verified || false,
            name: profile.preferred_username || profile.email,
            image: profile.picture || undefined,
          }),
          async getToken({ code, redirectURI, codeVerifier }) {
            const params = new URLSearchParams({
              grant_type: "authorization_code",
              client_id: envVars.KEYCLOAK_CLIENT_ID,
              client_secret: envVars.KEYCLOAK_CLIENT_SECRET,
              code: code,
              redirect_uri: redirectURI,
            });

            if (codeVerifier) {
              params.append("code_verifier", codeVerifier);
            }

            const response = await fetch(
              `${envVars.KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
              {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: params,
              }
            );

            if (!response.ok) {
              throw new Error(`Token exchange failed: ${response.status}`);
            }

            const tokens = await response.json();

            try {
              const { encryptValue } = await import("@/lib/crypto");

              // 🔄 Store 3 separated cookies for auto-refresh
              // 1️⃣ ID Token - For Keycloak logout
              const encryptedIdToken = encryptValue(tokens.id_token);

              // 2️⃣ Access Token - For API backend calls
              const encryptedAccessToken = encryptValue(tokens.access_token);

              // 3️⃣ Refresh Token - For refreshing expired tokens  
              const encryptedRefreshToken = encryptValue(tokens.refresh_token);

              const cookieStore = await cookies();

              // Store ID Token
              cookieStore.set("keycloak_id_token", encryptedIdToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: tokens.expires_in,
              });

              // Store Access Token
              cookieStore.set("keycloak_access_token", encryptedAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: tokens.expires_in,
              });

              // Store Refresh Token
              cookieStore.set("keycloak_refresh_token", encryptedRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: tokens.refresh_expires_in, // 30 minutes
              });

            } catch (e) {
              console.error("❌ Error storing encrypted tokens:", e);
            }

            return {
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token,
              idToken: tokens.id_token,
              accessTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
              refreshTokenExpiresAt: tokens.refresh_expires_in
                ? new Date(Date.now() + tokens.refresh_expires_in * 1000)
                : undefined,
              scopes: tokens.scope?.split(" ") ?? [],
            };
          },
        },
      ],
    }),
  ],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 30 * 60, // 30min
      strategy: "jwe",
      refreshCache: true,
    },
  },
  account: {
    storeStateStrategy: "cookie",
    storeAccountCookie: true,
  },
  trustedOrigins: [envVars.BETTER_AUTH_URL],
});

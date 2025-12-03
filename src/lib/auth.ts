import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import { envVars } from "@/config/env";
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

            console.log("✅ OAuth tokens received", tokens);
            return {
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token,
              accessTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
              scopes: tokens.scope?.split(" ") ?? [],
              raw: { id_token: tokens.id_token },
            };
          },
        },
      ],
    }),
  ],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
      strategy: "jwt",
      refreshCache: {
        updateAge: 60 * 5, // 5 minutes in seconds
      },
    },
    expiresIn: 60 * 60 * 24, // 24 hours in seconds
    updateAge: 60 * 5, // 5 minutes in seconds
  },
  trustedOrigins: [envVars.BETTER_AUTH_URL],
});

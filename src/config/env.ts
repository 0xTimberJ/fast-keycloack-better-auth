import * as z from "zod";

let cachedEnvVars: z.infer<ReturnType<typeof createEnvSchema>> | null = null;

const createEnvSchema = () => {
  return z.object({
    BETTER_AUTH_URL: z.string(),
    BETTER_AUTH_SECRET: z.string(),
    KEYCLOAK_CLIENT_ID: z.string(),
    KEYCLOAK_CLIENT_SECRET: z.string(),
    KEYCLOAK_ISSUER: z.string(),
  });
};

const getEnvVars = () => {
  if (cachedEnvVars) {
    return cachedEnvVars;
  }

  const EnvSchema = createEnvSchema();
  const envVars = {
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID,
    KEYCLOAK_CLIENT_SECRET: process.env.KEYCLOAK_CLIENT_SECRET,
    KEYCLOAK_ISSUER: process.env.KEYCLOAK_ISSUER,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  };

  const parsedEnvVars = EnvSchema.safeParse(envVars);

  if (!parsedEnvVars.success) {
    const treeified = z.treeifyError(parsedEnvVars.error);
    // treeified is an object with error info per field (non-deprecated)
    throw new Error(
      `Invalid env vars provided.
      The following variables are missing or invalid:
      ${Object.entries(treeified)
        .map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
        .join("\n")}
  `,
    );
  }

  cachedEnvVars = parsedEnvVars.data;
  return cachedEnvVars;
};

// Export a getter function instead of immediate initialization
export const envVars = new Proxy({} as ReturnType<typeof getEnvVars>, {
  get(target, prop) {
    const vars = getEnvVars();
    return vars[prop as keyof typeof vars];
  },
});

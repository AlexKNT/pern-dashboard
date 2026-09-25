import { z } from "zod";

/**
 * The environment this process runs with.
 * Add a variable here as soon as the code reads it, so a missing value stops the
 * process at startup instead of surfacing partway through a request.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  DATABASE_URL_UNPOOLED: z.string().min(1).optional(),
  // Better Auth: the signing secret and the origin the browser reaches the API on.
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  // The origin of the web app in development, trusted for cross origin sign in.
  WEB_ORIGIN: z.string().url().default("http://localhost:5173"),
  // Optional providers. RESEND only mails in production; ARCJET rate limits when set.
  RESEND_API_KEY: z.string().min(1).optional(),
  ARCJET_KEY: z.string().min(1).optional(),
});

/** Reads `.env` when one exists, then validates and freezes the environment. */
function readEnv(): z.infer<typeof envSchema> {
  try {
    process.loadEnvFile();
  } catch {
    // No `.env` file in this directory. Values must come from the real environment.
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "(environment)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${problems}`);
  }

  return Object.freeze(parsed.data);
}

/** Validated environment for the API process, read once when this module loads. */
export const env = readEnv();

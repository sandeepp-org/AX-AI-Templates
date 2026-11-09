const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const ACCESS_TTL_MS = 15 * 60 * 1000;

/**
 * Reads JWT_SECRET or AUTH_SECRET from env.
 * @returns The secret string for JWT signing.
 * @throws Error if neither is set or either is shorter than 32 characters.
 */
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET ?? process.env.AUTH_SECRET ?? "";
  if (!secret || secret.trim().length < 32) {
    throw new Error(
      "JWT_SECRET or AUTH_SECRET must be set and at least 32 characters"
    );
  }
  return secret;
};

export {
  getJwtSecret,
  ACCESS_EXPIRES_IN,
  REFRESH_EXPIRES_IN,
  ACCESS_TTL_MS,
  REFRESH_TTL_MS,
};

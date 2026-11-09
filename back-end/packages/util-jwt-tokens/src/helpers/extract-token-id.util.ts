import { decodeJwt } from "jose";

/** Extracts the jti claim from a JWT; returns null if missing or malformed. */
const extractTokenId = (token: string): string | null => {
  try {
    const payload = decodeJwt(token);
    const jti = payload.jti;
    return typeof jti === "string" ? jti : null;
  } catch {
    return null;
  }
};

export { extractTokenId };

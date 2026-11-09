import { jwtVerify } from "jose";
import { toSecretKey } from "./to-secret-key.util.js";
import type { AccessTokenPayload, RefreshTokenPayload } from "../types.js";

/** Verifies and decodes an access token; throws if invalid or missing sub/role. */
const verifyAccessToken = async (
  token: string,
  secret: string
): Promise<AccessTokenPayload> => {
  const key = toSecretKey(secret);
  const { payload } = await jwtVerify(token, key);
  const sub = payload.sub;
  const role = payload.role;
  if (typeof sub !== "string" || typeof role !== "string") {
    throw new Error("Invalid access token payload: missing sub or role");
  }
  return {
    sub,
    role,
    iat: typeof payload.iat === "number" ? payload.iat : undefined,
    exp: typeof payload.exp === "number" ? payload.exp : undefined,
  };
};

/** Verifies and decodes a refresh token; throws if invalid or missing sub/jti. */
const verifyRefreshToken = async (
  token: string,
  secret: string
): Promise<RefreshTokenPayload> => {
  const key = toSecretKey(secret);
  const { payload } = await jwtVerify(token, key);
  const sub = payload.sub;
  const jti = payload.jti;
  const resolvedJti = typeof jti === "string" ? jti : "";
  if (typeof sub !== "string" || !resolvedJti) {
    throw new Error("Invalid refresh token payload: missing sub or jti");
  }
  const role = typeof payload.role === "string" ? payload.role : undefined;
  return {
    sub,
    jti: resolvedJti,
    role,
    iat: typeof payload.iat === "number" ? payload.iat : undefined,
    exp: typeof payload.exp === "number" ? payload.exp : undefined,
  };
};

export { verifyAccessToken, verifyRefreshToken };

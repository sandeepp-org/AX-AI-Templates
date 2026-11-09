import { SignJWT } from "jose";
import {
  DEFAULT_ACCESS_EXPIRES_IN,
  DEFAULT_REFRESH_EXPIRES_IN,
  DEFAULT_ALGORITHM,
} from "../constants.js";
import { toSecretKey } from "./to-secret-key.util.js";
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
  SignTokenOptions,
} from "../types.js";

/** Signs an access token with sub and role claims. */
const signAccessToken = async (
  payload: AccessTokenPayload,
  secret: string,
  options?: SignTokenOptions
): Promise<string> => {
  const expiresIn = options?.expiresIn ?? DEFAULT_ACCESS_EXPIRES_IN;
  const alg = options?.algorithm ?? DEFAULT_ALGORITHM;
  const key = toSecretKey(secret);

  const jwt = await new SignJWT({
    sub: payload.sub,
    role: payload.role,
  })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);

  return jwt;
};

/** Signs a refresh token with sub, jti, and optional role. */
const signRefreshToken = async (
  payload: RefreshTokenPayload,
  secret: string,
  options?: SignTokenOptions
): Promise<string> => {
  const expiresIn = options?.expiresIn ?? DEFAULT_REFRESH_EXPIRES_IN;
  const alg = options?.algorithm ?? DEFAULT_ALGORITHM;
  const key = toSecretKey(secret);

  const claims: Record<string, unknown> = {
    sub: payload.sub,
    jti: payload.jti,
  };
  if (payload.role !== undefined) {
    claims.role = payload.role;
  }
  const jwt = await new SignJWT(claims)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .setJti(payload.jti)
    .sign(key);

  return jwt;
};

export { signAccessToken, signRefreshToken };

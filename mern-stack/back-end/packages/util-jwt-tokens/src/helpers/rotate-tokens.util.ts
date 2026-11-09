import { randomUUID } from "node:crypto";
import {
  DEFAULT_ACCESS_EXPIRES_IN,
  DEFAULT_REFRESH_EXPIRES_IN,
} from "../constants.js";
import { verifyRefreshToken } from "./verify-token.util.js";
import { signAccessToken, signRefreshToken } from "./sign-token.util.js";
import type { TokenPair, RotateOptions } from "../types.js";

/** Rotates a valid refresh token into a new access + refresh pair. */
const rotateTokens = async (
  oldRefreshToken: string,
  secret: string,
  options?: RotateOptions
): Promise<TokenPair> => {
  const payload = await verifyRefreshToken(oldRefreshToken, secret);
  const newJti = randomUUID();
  const accessExpiresIn = options?.accessExpiresIn ?? DEFAULT_ACCESS_EXPIRES_IN;
  const refreshExpiresIn =
    options?.refreshExpiresIn ?? DEFAULT_REFRESH_EXPIRES_IN;

  const role = payload.role ?? "user";
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({ sub: payload.sub, role }, secret, {
      expiresIn: accessExpiresIn,
    }),
    signRefreshToken({ sub: payload.sub, jti: newJti, role }, secret, {
      expiresIn: refreshExpiresIn,
    }),
  ]);

  return { accessToken, refreshToken };
};

export { rotateTokens };

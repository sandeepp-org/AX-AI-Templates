import { hashPassword, verifyPassword } from "./helpers/hash-password.util.js";
import { validateEmail } from "./helpers/validate-email.util.js";
import { validatePasswordStrength } from "./helpers/validate-password-strength.util.js";
import {
  signAccessToken,
  signRefreshToken,
} from "./helpers/sign-token.util.js";
import {
  verifyAccessToken,
  verifyRefreshToken,
} from "./helpers/verify-token.util.js";
import { extractTokenId } from "./helpers/extract-token-id.util.js";
import { decodeToken } from "./helpers/decode-token.util.js";
import { rotateTokens } from "./helpers/rotate-tokens.util.js";
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
  SignTokenOptions,
  RotateOptions,
} from "./types.js";
import type { JwtTokensContract } from "./interfaces.js";

class JwtTokens implements JwtTokensContract {
  private constructor() {}

  hashPassword = hashPassword;
  verifyPassword = verifyPassword;
  validateEmail = validateEmail;
  validatePasswordStrength = validatePasswordStrength;
  verifyAccessToken = verifyAccessToken;
  verifyRefreshToken = verifyRefreshToken;
  signAccessToken = signAccessToken;
  signRefreshToken = signRefreshToken;
  rotateTokens = rotateTokens;
  extractTokenId = extractTokenId;
  decodeToken = decodeToken;
  isTokenRevoked = (jti: string, revokedIds: Set<string>): boolean =>
    revokedIds.has(jti);

  static hashPassword = hashPassword;
  static verifyPassword = verifyPassword;
  static validateEmail = validateEmail;
  static validatePasswordStrength = validatePasswordStrength;
  static verifyAccessToken = verifyAccessToken;
  static verifyRefreshToken = verifyRefreshToken;

  static signAccessToken = (
    payload: AccessTokenPayload,
    secret: string,
    options?: SignTokenOptions
  ): Promise<string> => signAccessToken(payload, secret, options);

  static signRefreshToken = (
    payload: RefreshTokenPayload,
    secret: string,
    options?: SignTokenOptions
  ): Promise<string> => signRefreshToken(payload, secret, options);

  static rotateTokens = (
    oldRefreshToken: string,
    secret: string,
    options?: RotateOptions
  ): ReturnType<typeof rotateTokens> =>
    rotateTokens(oldRefreshToken, secret, options);

  static extractTokenId = extractTokenId;
  static decodeToken = decodeToken;

  static isTokenRevoked = (jti: string, revokedIds: Set<string>): boolean =>
    revokedIds.has(jti);
}

export { JwtTokens };

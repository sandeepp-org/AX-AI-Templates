import type {
  AccessTokenPayload,
  RefreshTokenPayload,
  SignTokenOptions,
  RotateOptions,
  TokenPair,
  HashPasswordOptions,
  EmailValidationResult,
  PasswordStrengthResult,
  DecodedPayload,
} from "./types.js";

interface JwtTokensContract {
  hashPassword: (
    password: string,
    options?: HashPasswordOptions
  ) => Promise<string>;
  verifyPassword: (password: string, hash: string) => Promise<boolean>;
  validateEmail: (email: string) => EmailValidationResult;
  validatePasswordStrength: (password: string) => PasswordStrengthResult;
  verifyAccessToken: (
    token: string,
    secret: string
  ) => Promise<AccessTokenPayload>;
  verifyRefreshToken: (
    token: string,
    secret: string
  ) => Promise<RefreshTokenPayload>;
  signAccessToken: (
    payload: AccessTokenPayload,
    secret: string,
    options?: SignTokenOptions
  ) => Promise<string>;
  signRefreshToken: (
    payload: RefreshTokenPayload,
    secret: string,
    options?: SignTokenOptions
  ) => Promise<string>;
  rotateTokens: (
    oldRefreshToken: string,
    secret: string,
    options?: RotateOptions
  ) => Promise<TokenPair>;
  extractTokenId: (token: string) => string | null;
  decodeToken: (token: string) => DecodedPayload | null;
  isTokenRevoked: (jti: string, revokedIds: Set<string>) => boolean;
}

export type { JwtTokensContract };

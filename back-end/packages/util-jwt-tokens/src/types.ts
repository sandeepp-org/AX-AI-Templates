/** Payload of an access token. */
type AccessTokenPayload = {
  sub: string;
  role: string;
  iat?: number;
  exp?: number;
};

type RefreshTokenPayload = {
  sub: string; // sub is the subject of the token(user id, etc.)
  jti: string; // jti is the unique identifier for the token
  role?: string; // role is the role of the token(admin, user, etc.)
  iat?: number; // iat is the issued at timestamp
  exp?: number; // exp is the expiration timestamp
};

/** Options for signing a token. */
type SignTokenOptions = {
  expiresIn: string;
  algorithm?: "HS256" | "HS384" | "HS512";
};

/** A pair of access and refresh tokens. */
type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

/** Options for hashing a password. */
type HashPasswordOptions = {
  memoryCost?: number;
  timeCost?: number;
};

/** Result of email validation. */
type EmailValidationResult = {
  valid: boolean;
  error?: string;
};

/** Result of password strength validation. */
type PasswordStrengthResult = {
  valid: boolean;
  score?: number;
  issues?: string[];
};

/** Options for rotating tokens. */
type RotateOptions = {
  accessExpiresIn?: string;
  refreshExpiresIn?: string;
};

/** Decoded payload of a token. */
type DecodedPayload = {
  sub?: string;
  role?: string;
  jti?: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
};

/** Export types. */
export type {
  AccessTokenPayload,
  RefreshTokenPayload,
  SignTokenOptions,
  TokenPair,
  HashPasswordOptions,
  EmailValidationResult,
  PasswordStrengthResult,
  RotateOptions,
  DecodedPayload,
};

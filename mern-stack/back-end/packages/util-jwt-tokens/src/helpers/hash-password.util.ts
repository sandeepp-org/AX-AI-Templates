import argon2 from "argon2";
import type { HashPasswordOptions } from "../types.js";

/** Hashes a plain password with argon2. */
const hashPassword = async (
  plain: string,
  options?: HashPasswordOptions
): Promise<string> => {
  const opts: argon2.HashOptions = {};
  if (options?.memoryCost !== undefined) {
    opts.memoryCost = options.memoryCost;
  }
  if (options?.timeCost !== undefined) {
    opts.timeCost = options.timeCost;
  }
  return argon2.hash(plain, opts);
};

/** Verifies a plain password against an argon2 hash. */
const verifyPassword = async (
  plain: string,
  hash: string
): Promise<boolean> => {
  return argon2.verify(hash, plain);
};

export { hashPassword, verifyPassword };

import { decodeJwt } from "jose";
import type { DecodedPayload } from "../types.js";

/** Decodes a JWT payload without verifying; returns null for malformed tokens. */
const decodeToken = (token: string): DecodedPayload | null => {
  try {
    const payload = decodeJwt(token);
    return payload as DecodedPayload;
  } catch {
    return null;
  }
};

export { decodeToken };

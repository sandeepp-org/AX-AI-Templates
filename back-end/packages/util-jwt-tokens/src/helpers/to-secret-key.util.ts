/** Converts a string secret to a Uint8Array for use with jose/JWT signing. */
const toSecretKey = (secret: string): Uint8Array =>
  new TextEncoder().encode(secret);

export { toSecretKey };

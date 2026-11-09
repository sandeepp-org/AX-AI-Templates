import { SignJWT } from "jose";
import { verifyAccessToken } from "./verify-token.util.js";

const SECRET = "test-secret-at-least-32-characters-long-for-hs256";
const key = new TextEncoder().encode(SECRET);

describe("verify-token", () => {
  // test to throw for access token with missing sub or role
  it("should throw for access token with missing sub or role", async () => {
    const tokenMissingSub = await new SignJWT({ role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(key);
    await expect(verifyAccessToken(tokenMissingSub, SECRET)).rejects.toThrow(
      /missing sub or role/
    );

    const tokenMissingRole = await new SignJWT({ sub: "u" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(key);
    await expect(verifyAccessToken(tokenMissingRole, SECRET)).rejects.toThrow(
      /missing sub or role/
    );
  });
});

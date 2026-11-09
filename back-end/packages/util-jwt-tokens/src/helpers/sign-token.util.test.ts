import { signAccessToken, signRefreshToken } from "./sign-token.util.js";
import { verifyAccessToken, verifyRefreshToken } from "./verify-token.util.js";

const SECRET = "test-secret-at-least-32-characters-long-for-hs256";

describe("sign-token", () => {
  // test to sign and verify access token roundtrip
  it("should sign and verify access token roundtrip", async () => {
    const payload = { sub: "user-1", role: "admin" };
    const token = await signAccessToken(payload, SECRET);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    const decoded = await verifyAccessToken(token, SECRET);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.role).toBe(payload.role);
  });

  // test to sign and verify refresh token roundtrip
  it("should sign and verify refresh token roundtrip", async () => {
    const payload = { sub: "user-1", jti: "jti-123", role: "user" };
    const token = await signRefreshToken(payload, SECRET);
    expect(token).toBeDefined();

    const decoded = await verifyRefreshToken(token, SECRET);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.jti).toBe(payload.jti);
    expect(decoded.role).toBe(payload.role);
  });

  // test to throw when verifying with wrong secret
  it("should throw when verifying with wrong secret", async () => {
    const token = await signAccessToken({ sub: "u", role: "r" }, SECRET);
    await expect(verifyAccessToken(token, "wrong-secret")).rejects.toThrow();
  });

  // test to throw when verifying expired token
  it("should throw when verifying expired token", async () => {
    const token = await signAccessToken({ sub: "u", role: "r" }, SECRET, {
      expiresIn: "0s",
    });
    await expect(verifyAccessToken(token, SECRET)).rejects.toThrow();
  });
});

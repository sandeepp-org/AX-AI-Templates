import { signRefreshToken } from "./sign-token.util.js";
import { rotateTokens } from "./rotate-tokens.util.js";
import { verifyAccessToken, verifyRefreshToken } from "./verify-token.util.js";

const SECRET = "test-secret-at-least-32-characters-long-for-hs256";

describe("rotate-tokens", () => {
  // test to return new access and refresh token pair
  it("should return new access and refresh token pair", async () => {
    const oldRefresh = await signRefreshToken(
      { sub: "user-1", jti: "old-jti", role: "admin" },
      SECRET
    );
    const pair = await rotateTokens(oldRefresh, SECRET);
    expect(pair.accessToken).toBeDefined();
    expect(pair.refreshToken).toBeDefined();

    const accessPayload = await verifyAccessToken(pair.accessToken, SECRET);
    expect(accessPayload.sub).toBe("user-1");
    expect(accessPayload.role).toBe("admin");

    const refreshPayload = await verifyRefreshToken(pair.refreshToken, SECRET);
    expect(refreshPayload.sub).toBe("user-1");
    expect(refreshPayload.jti).not.toBe("old-jti");
  });

  // test to throw for invalid refresh token
  it("should throw for invalid refresh token", async () => {
    await expect(rotateTokens("invalid-token", SECRET)).rejects.toThrow();
  });

  // test to use custom accessExpiresIn and refreshExpiresIn options
  it("should use custom accessExpiresIn and refreshExpiresIn options", async () => {
    const oldRefresh = await signRefreshToken(
      { sub: "user-1", jti: "old-jti", role: "admin" },
      SECRET
    );
    const pair = await rotateTokens(oldRefresh, SECRET, {
      accessExpiresIn: "5m",
      refreshExpiresIn: "1d",
    });
    const accessPayload = await verifyAccessToken(pair.accessToken, SECRET);
    expect(accessPayload.sub).toBe("user-1");
    const refreshPayload = await verifyRefreshToken(pair.refreshToken, SECRET);
    expect(refreshPayload.sub).toBe("user-1");
  });
});

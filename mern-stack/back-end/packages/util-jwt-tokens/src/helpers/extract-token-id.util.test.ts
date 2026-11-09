import { signRefreshToken } from "./sign-token.util.js";
import { extractTokenId } from "./extract-token-id.util.js";

const SECRET = "test-secret-at-least-32-characters-long-for-hs256";

describe("extract-token-id", () => {
  // test to extract jti from valid token
  it("should extract jti from valid token", async () => {
    const token = await signRefreshToken(
      { sub: "u", jti: "my-jti-123", role: "user" },
      SECRET
    );
    const jti = extractTokenId(token);
    expect(jti).toBe("my-jti-123");
  });

  // test to return null for invalid token
  it("should return null for invalid token", () => {
    const jti = extractTokenId("not.a.valid.jwt");
    expect(jti).toBeNull();
  });

  // test to return null for valid JWT with no jti claim
  it("should return null for valid JWT with no jti claim", async () => {
    const { signAccessToken } = await import("./sign-token.util.js");
    const token = await signAccessToken({ sub: "u", role: "user" }, SECRET);
    const jti = extractTokenId(token);
    expect(jti).toBeNull();
  });
});

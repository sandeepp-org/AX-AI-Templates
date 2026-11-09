import { JwtTokens } from "./jwt-tokens.js";

const SECRET = "test-secret-at-least-32-characters-long-for-hs256";

// test to hash and verify password roundtrip
describe("JwtTokens", () => {
  describe("hashPassword / verifyPassword", () => {
    it("should hash and verify", async () => {
      const hash = await JwtTokens.hashPassword("pass123");
      const ok = await JwtTokens.verifyPassword("pass123", hash);
      expect(ok).toBe(true);
    });
  });

  // test to validate email
  describe("validateEmail", () => {
    it("should validate email", () => {
      expect(JwtTokens.validateEmail("a@b.com").valid).toBe(true);
      expect(JwtTokens.validateEmail("x").valid).toBe(false);
    });
  });

  // test to validate password strength
  describe("validatePasswordStrength", () => {
    it("should return invalid with issues for weak password", () => {
      const result = JwtTokens.validatePasswordStrength("Ab1");
      expect(result.valid).toBe(false);
      expect(result.issues).toBeDefined();
    });
  });

  // test to sign and verify access token
  describe("signAccessToken / verifyAccessToken", () => {
    it("should sign and verify", async () => {
      const token = await JwtTokens.signAccessToken(
        { sub: "u", role: "admin" },
        SECRET
      );
      const payload = await JwtTokens.verifyAccessToken(token, SECRET);
      expect(payload.sub).toBe("u");
      expect(payload.role).toBe("admin");
    });
  });

  // test to extract jti from refresh token
  describe("extractTokenId", () => {
    it("should extract jti from refresh token", async () => {
      const token = await JwtTokens.signRefreshToken(
        { sub: "u", jti: "jti-1", role: "user" },
        SECRET
      );
      const jti = JwtTokens.extractTokenId(token);
      expect(jti).toBe("jti-1");
    });
  });

  // test to check if token is revoked
  describe("isTokenRevoked", () => {
    it("should return true when jti in set", () => {
      expect(JwtTokens.isTokenRevoked("j1", new Set(["j1", "j2"]))).toBe(true);
    });
    it("should return false when jti not in set", () => {
      expect(JwtTokens.isTokenRevoked("j3", new Set(["j1", "j2"]))).toBe(false);
    });
  });

  // test to decode token without verifying
  describe("decodeToken", () => {
    it("should decode without verifying", async () => {
      const token = await JwtTokens.signAccessToken(
        { sub: "u", role: "r" },
        SECRET
      );
      const decoded = JwtTokens.decodeToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.sub).toBe("u");
    });

    it("should return null for invalid or malformed token", () => {
      const decoded = JwtTokens.decodeToken("not.a.valid.jwt");
      expect(decoded).toBeNull();
    });
  });
});

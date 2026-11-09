import { hashPassword, verifyPassword } from "./hash-password.util.js";

describe("hash-password", () => {
  // test to hash and verify password roundtrip
  it("should hash and verify password roundtrip", async () => {
    const plain = "mySecurePassword123";
    const hash = await hashPassword(plain);
    expect(hash).toBeDefined();
    expect(typeof hash).toBe("string");
    expect(hash).not.toBe(plain);

    const ok = await verifyPassword(plain, hash);
    expect(ok).toBe(true);
  });

  // test to return false for wrong password
  it("should return false for wrong password", async () => {
    const plain = "correctPassword";
    const hash = await hashPassword(plain);
    const ok = await verifyPassword("wrongPassword", hash);
    expect(ok).toBe(false);
  });

  // test to throw for invalid hash
  it("should throw for invalid hash", async () => {
    await expect(
      verifyPassword("any", "invalid-hash-format")
    ).rejects.toThrow();
  });

  // test to hash with custom memoryCost and timeCost options
  it("should hash with custom memoryCost and timeCost options", async () => {
    const plain = "mySecurePassword123";
    const hash = await hashPassword(plain, {
      memoryCost: 8192,
      timeCost: 2,
    });
    expect(hash).toBeDefined();
    const ok = await verifyPassword(plain, hash);
    expect(ok).toBe(true);
  });
});

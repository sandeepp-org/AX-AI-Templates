import { AwsSecretManager } from "./aws-secret-manager.js";

/** No real AWS: unreachable loopback endpoint fails fast (avoids SDK retry / long TCP hangs). */
const FAKE_CONFIG = {
  region: "us-east-1",
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
  endpoint: "http://127.0.0.1:1",
  maxAttempts: 1,
};

const integrationRegion = process.env.AWS_REGION ?? "us-east-1";
const integrationAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
const integrationSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const runIntegrationTests = Boolean(
  integrationAccessKeyId && integrationSecretAccessKey
);

describe("AwsSecretManager", () => {
  afterEach(async () => {
    try {
      await AwsSecretManager.getInstance().close();
    } catch {
      // not initialized
    }
  });

  it("getInstance should throw when not initialized", () => {
    expect(() => AwsSecretManager.getInstance()).toThrow(
      "AwsSecretManager not initialized"
    );
  });

  it("createInstance should return instance and getInstance should return same reference", async () => {
    const instance = await AwsSecretManager.createInstance(FAKE_CONFIG);
    const retrieved = AwsSecretManager.getInstance();
    expect(retrieved).toBe(instance);
  });

  it("create should return instance and getInstance should return same reference", async () => {
    const instance = await AwsSecretManager.create(FAKE_CONFIG);
    const retrieved = AwsSecretManager.getInstance();
    expect(retrieved).toBe(instance);
  });

  it("close should clear singleton", async () => {
    const instance = await AwsSecretManager.createInstance(FAKE_CONFIG);
    await instance.close();
    expect(() => AwsSecretManager.getInstance()).toThrow(
      "AwsSecretManager not initialized"
    );
  });

  it("should reinitialize cleanly after close and createInstance", async () => {
    const first = await AwsSecretManager.createInstance(FAKE_CONFIG);
    await first.close();

    const second = await AwsSecretManager.createInstance(FAKE_CONFIG);
    const retrieved = AwsSecretManager.getInstance();

    expect(retrieved).toBe(second);
    expect(second).not.toBe(first);
  });

  it("getSecrets with specific IDs should propagate non-ResourceNotFoundException errors", async () => {
    const instance = await AwsSecretManager.createInstance(FAKE_CONFIG);

    await expect(instance.getSecrets(["some-secret"])).rejects.toThrow();
  });

  it("setSecret should propagate errors when AWS client rejects", async () => {
    const instance = await AwsSecretManager.createInstance(FAKE_CONFIG);

    await expect(
      instance.setSecret("test-secret", "test-value")
    ).rejects.toThrow();
  });
});

describe("AwsSecretManager integration", () => {
  const testPrefix = `util-secret-manager-aws-${Date.now()}`;

  afterEach(async () => {
    try {
      await AwsSecretManager.getInstance().close();
    } catch {
      // not initialized
    }
  });

  const integrationConfig = runIntegrationTests
    ? {
        region: integrationRegion,
        credentials: {
          accessKeyId: integrationAccessKeyId!,
          secretAccessKey: integrationSecretAccessKey!,
        },
      }
    : undefined;

  it("getSecrets should read values from a real AWS Secrets Manager account", async () => {
    if (!integrationConfig) {
      return;
    }

    const instance = await AwsSecretManager.createInstance(integrationConfig);
    const secretName = `${testPrefix}-get-secrets`;
    const secretValue = "integration-value-1";
    await instance.setSecret(secretName, secretValue);

    const secrets = await instance.getSecrets([secretName]);
    expect(secrets[secretName]).toBe(secretValue);
  }, 30000);

  it("setSecret should support create-or-update flow against real AWS Secrets Manager", async () => {
    if (!integrationConfig) {
      return;
    }

    const instance = await AwsSecretManager.createInstance(integrationConfig);
    const secretName = `${testPrefix}-create-update`;
    const firstValue = "integration-first";
    const secondValue = "integration-second";

    await instance.setSecret(secretName, firstValue);
    await instance.setSecret(secretName, secondValue);

    const secrets = await instance.getSecrets([secretName]);
    expect(secrets[secretName]).toBe(secondValue);
  }, 30000);
});

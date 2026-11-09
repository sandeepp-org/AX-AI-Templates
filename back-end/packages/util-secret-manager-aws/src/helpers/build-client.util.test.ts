import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

import { buildSecretsManagerClient } from "./build-client.util.js";

describe("buildSecretsManagerClient", () => {
  it("should create SecretsManagerClient when config is empty", () => {
    const client = buildSecretsManagerClient();
    expect(client).toBeInstanceOf(SecretsManagerClient);
  });

  it("should create SecretsManagerClient with provided region", () => {
    const client = buildSecretsManagerClient({ region: "eu-west-1" });
    expect(client).toBeInstanceOf(SecretsManagerClient);
  });

  it("should create SecretsManagerClient with explicit credentials", () => {
    const client = buildSecretsManagerClient({
      region: "us-east-1",
      credentials: {
        accessKeyId: "AKIA_TEST",
        secretAccessKey: "test_secret",
      },
    });
    expect(client).toBeInstanceOf(SecretsManagerClient);
  });
});

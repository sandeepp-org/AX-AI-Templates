import {
  CreateSecretCommand,
  GetSecretValueCommand,
  ListSecretsCommand,
  PutSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

import type { SecretManager } from "./interfaces.js";
import type { AwsSecretManagerConfig } from "./types.js";
import { buildSecretsManagerClient } from "./helpers/build-client.util.js";

/**
 * AWS Secrets Manager-backed implementation of the SecretManager interface.
 */
class AwsSecretManager implements SecretManager {
  static #instance: AwsSecretManager | null = null;

  #client: SecretsManagerClient;

  private constructor(client: SecretsManagerClient) {
    this.#client = client;
  }

  /**
   * Creates and stores the AwsSecretManager singleton using the provided configuration.
   */
  static create = async (
    config?: AwsSecretManagerConfig
  ): Promise<AwsSecretManager> => {
    return AwsSecretManager.createInstance(config);
  };

  /**
   * Creates and stores the AwsSecretManager singleton using the provided configuration.
   */
  static createInstance = async (
    config?: AwsSecretManagerConfig
  ): Promise<AwsSecretManager> => {
    const client = buildSecretsManagerClient(config);
    const instance = new AwsSecretManager(client);
    AwsSecretManager.#instance = instance;
    return instance;
  };

  /**
   * Returns the previously created AwsSecretManager singleton or throws if not initialized.
   */
  static getInstance = (): AwsSecretManager => {
    if (AwsSecretManager.#instance === null) {
      throw new Error(
        "AwsSecretManager not initialized. Call AwsSecretManager.create() first."
      );
    }
    return AwsSecretManager.#instance;
  };

  /**
   * Retrieves all requested secrets (or all secrets when no IDs are provided) as a key/value map.
   */
  getSecrets = async (
    secretIds?: string[]
  ): Promise<Record<string, string>> => {
    const idsToFetch =
      (secretIds?.length ?? 0) > 0 ? secretIds! : await this.#listSecretNames();

    const entries = await Promise.all(
      idsToFetch.map(async (id) => {
        const value = await this.#getSecretValue(id);
        return [id, value] as const;
      })
    );

    const result: Record<string, string> = {};
    for (const [id, value] of entries) {
      if (value !== null) {
        result[id] = value;
      }
    }
    return result;
  };

  /**
   * Creates or updates a secret with the given ID and value in AWS Secrets Manager.
   */
  setSecret = async (secretName: string, value: string): Promise<void> => {
    try {
      await this.#client.send(
        new PutSecretValueCommand({ SecretId: secretName, SecretString: value })
      );
    } catch (err) {
      const isNotFound =
        err != null &&
        typeof err === "object" &&
        "name" in err &&
        (err as { name: string }).name === "ResourceNotFoundException";
      if (isNotFound) {
        await this.#client.send(
          new CreateSecretCommand({
            Name: secretName,
            SecretString: value,
          })
        );
      } else {
        throw err;
      }
    }
  };

  /**
   * Lists all secret names available in AWS Secrets Manager for the current client.
   */
  #listSecretNames = async (): Promise<string[]> => {
    const names: string[] = [];
    let nextToken: string | undefined;
    do {
      const response = await this.#client.send(
        new ListSecretsCommand({ NextToken: nextToken })
      );
      for (const secret of response.SecretList ?? []) {
        if (secret.Name) {
          names.push(secret.Name);
        }
      }
      nextToken = response.NextToken;
    } while (nextToken);
    return names;
  };

  /**
   * Reads a single secret value by ID, handling both string and binary payloads.
   * Returns null only when the secret does not exist; all other errors propagate.
   */
  #getSecretValue = async (secretId: string): Promise<string | null> => {
    try {
      const response = await this.#client.send(
        new GetSecretValueCommand({ SecretId: secretId })
      );
      if (response.SecretString) {
        return response.SecretString;
      }
      if (response.SecretBinary) {
        return Buffer.from(response.SecretBinary).toString("utf-8");
      }
      return null;
    } catch (err) {
      const isNotFound =
        err != null &&
        typeof err === "object" &&
        "name" in err &&
        (err as { name: string }).name === "ResourceNotFoundException";
      if (isNotFound) {
        return null;
      }
      throw err;
    }
  };

  /**
   * Cleans up the underlying AWS client and clears the singleton when appropriate.
   */
  close = async (): Promise<void> => {
    if (AwsSecretManager.#instance === this) {
      AwsSecretManager.#instance = null;
    }
    this.#client.destroy();
  };
}

export { AwsSecretManager };

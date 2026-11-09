import {
  SecretsManagerClient,
  type SecretsManagerClientConfig,
} from "@aws-sdk/client-secrets-manager";

import type { AwsSecretManagerConfig } from "../types.js";
import { DEFAULT_REGION } from "../constants.js";

/**
 * Builds an AWS SecretsManagerClient configured with region and optional credentials.
 */
const buildSecretsManagerClient = (
  config?: AwsSecretManagerConfig
): SecretsManagerClient => {
  const clientConfig: SecretsManagerClientConfig = {
    region: config?.region ?? DEFAULT_REGION,
    credentials: config?.credentials,
  };
  if (config?.endpoint !== undefined) {
    clientConfig.endpoint = config.endpoint;
  }
  if (config?.maxAttempts !== undefined) {
    clientConfig.maxAttempts = config.maxAttempts;
  }
  return new SecretsManagerClient(clientConfig);
};

export { buildSecretsManagerClient };

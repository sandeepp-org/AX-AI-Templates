/**
 * Contract for secret manager providers (AWS, Azure, etc.).
 * All publicly exposed methods must be defined here.
 *
 * Exposed methods:
 * - create(config?)     [static] - initialize singleton
 * - getInstance()       [static] - get singleton instance
 * - getSecrets(ids?)    [instance] - fetch secrets
 * - setSecret(id, val)  [instance] - create or update a secret
 * - close()             [instance] - cleanup
 */

interface SecretManager {
  getSecrets: (secretIds?: string[]) => Promise<Record<string, string>>;
  setSecret: (secretId: string, value: string) => Promise<void>;
  close: () => Promise<void>;
}

interface SecretManagerFactory<Config = unknown> {
  createInstance: (config?: Config) => Promise<SecretManager>;
  getInstance: () => SecretManager;
}

export type { SecretManager, SecretManagerFactory };

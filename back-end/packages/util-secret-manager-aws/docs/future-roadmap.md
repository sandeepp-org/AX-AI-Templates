## Future Roadmap — @util/secret-manager-aws

- **Provider ecosystem**
  - Extract shared `SecretManager` core and add additional providers (Azure Key Vault, GCP Secret Manager, HashiCorp Vault).
  - Pluggable provider selection based on config or environment.

- **Caching and refresh**
  - In-memory and distributed caching of secrets with TTL and background refresh.
  - Fine-grained cache invalidation for specific secret IDs.

- **Security and auditing**
  - Optional encryption-at-rest for cached secrets using app-managed keys.
  - Audit hooks to record secret access (who, when, which IDs) without exposing values.

- **Developer experience**
  - CLI helpers to list, diff, and validate secrets across environments.
  - Type-safe secret accessors generated from a configuration file (e.g. `secrets.config.json`).

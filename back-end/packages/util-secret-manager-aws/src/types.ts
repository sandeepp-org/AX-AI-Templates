type AwsSecretManagerConfig = {
  region?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  };
  /** Custom service endpoint (e.g. LocalStack) or a closed loopback port for fast-failing tests. */
  endpoint?: string;
  /** Caps SDK retry attempts; omit to use AWS SDK defaults. */
  maxAttempts?: number;
};

export type { AwsSecretManagerConfig };

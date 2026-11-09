import {
  AwsSecretManager,
  type AwsSecretManagerConfig,
} from "@util/secret-manager-aws";

const buildConfig = (): AwsSecretManagerConfig | undefined => {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!region && !accessKeyId && !secretAccessKey) {
    return undefined;
  }
  const config: AwsSecretManagerConfig = {};
  if (region) {
    config.region = region;
  }
  if (accessKeyId && secretAccessKey) {
    config.credentials = {
      accessKeyId,
      secretAccessKey,
      sessionToken: process.env.AWS_SESSION_TOKEN,
    };
  }
  return config;
};

let secrets: AwsSecretManager;

const initSecrets = async (): Promise<AwsSecretManager> => {
  secrets = await AwsSecretManager.createInstance(buildConfig());
  return secrets;
};

export { secrets, initSecrets };

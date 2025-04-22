import { defineFunction, secret } from "@aws-amplify/backend";

export const videoCall = defineFunction({
  entry: "./handler.ts",
  environment: {
    AGORA_APP_ID: secret("AGORA_APP_ID"),
    AGORA_APP_CERTIFICATE: secret("AGORA_APP_CERTIFICATE"),
  },
});
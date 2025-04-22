import { RtcTokenBuilder, RtcRole } from "agora-access-token";
import { AppSyncResolverEvent, AppSyncIdentityCognito } from "aws-lambda";

interface VideoCallArguments {
  name: string;
}

interface ResolverContext {
  identity?: AppSyncIdentityCognito;
}

export const handler = async (event: AppSyncResolverEvent<VideoCallArguments, ResolverContext>) => {
  try {
    // Fetch channel name from the frontend
    const { name: channelName } = event.arguments;
    if (!channelName) {
      throw new Error("Channel name is required");
    }

    // Get authenticated user
    const identity = event.identity as AppSyncIdentityCognito | undefined;
    const userId = identity?.sub;
    if (!userId) {
      throw new Error("User ID is missing (unauthenticated)");
    }

    const appId = process.env.AGORA_APP_ID; // secret
    const appCertificate = process.env.AGORA_APP_CERTIFICATE; // secret
    if (!appId || !appCertificate) {
      throw new Error("Server configuration error");
    }

    const account = userId;
    const role = RtcRole.PUBLISHER;
    const tokenExpirationInSeconds = 3600;
    const privilegeExpiredTs = Math.floor(Date.now() / 1000) + tokenExpirationInSeconds;

    // Create the token for Agora to establish a video call.
    const token = RtcTokenBuilder.buildTokenWithAccount(
      appId,
      appCertificate,
      channelName,
      account,
      role,
      privilegeExpiredTs
    );

    return JSON.stringify({ token, appId });
  } catch (error) {
    throw new Error(`Failed to generate token: ${(error as Error).message}`);
  }
};
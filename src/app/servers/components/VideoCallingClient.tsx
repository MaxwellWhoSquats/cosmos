"use client";
import {
  LocalUser,
  RemoteUser,
  useIsConnected,
  useJoin,
  useLocalMicrophoneTrack,
  useLocalCameraTrack,
  usePublish,
  useRemoteUsers,
  AgoraRTCProvider,
  IAgoraRTCClient,
} from "agora-rtc-react";
import AgoraRTC from "agora-rtc-react";
import { useState, useEffect } from "react";
import MicrophoneIcon from "@/src/components/Icons/MicrophoneIcon";
import CameraIcon from "@/src/components/Icons/CameraIcon";
import { useAmplifyAuthenticatedUser } from "@/src/hooks/useAmplifyAuthenticatedUser";
import { client } from "@/src/utils/amplifyClient";

interface VideoCallProps {
  appId: string;
  channel: string;
  token: string;
  uid: string;
  onDisconnect: () => void;
}

// View Agora Video SDK Documentation for component functionality ///

const VideoCall = ({
  appId,
  channel,
  token,
  uid,
  onDisconnect,
}: VideoCallProps) => {
  const [micOn, setMic] = useState(true);
  const [cameraOn, setCamera] = useState(true);
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  const { localCameraTrack } = useLocalCameraTrack(cameraOn);
  const isConnected = useIsConnected();
  const remoteUsers = useRemoteUsers();

  useJoin({ appid: appId, channel, token, uid }, true);
  usePublish([localMicrophoneTrack, localCameraTrack]);

  // Close tracks if the component unmounts unexpectedly
  useEffect(() => {
    return () => {
      localMicrophoneTrack?.close();
      localCameraTrack?.close();
    };
  }, [localMicrophoneTrack, localCameraTrack]);

  const handleEndCall = () => {
    localMicrophoneTrack?.close();
    localCameraTrack?.close();
    onDisconnect();
  };

  return (
    <div className="h-full p-4">
      {isConnected ? (
        <>
          <div className="flex flex-wrap gap-4">
            <div className="relative w-64 h-36 bg-base-300 rounded overflow-hidden">
              <LocalUser
                audioTrack={localMicrophoneTrack}
                cameraOn={cameraOn}
                micOn={micOn}
                playAudio={false}
                videoTrack={localCameraTrack}
                className="w-full h-full object-cover"
              >
                <div className="absolute bottom-1 left-1 p-1 rounded flex space-x-1 items-center">
                  <span className="text-xs text-white bg-base-200 bg-opacity-50 rounded px-2 py-0.5">
                    You
                  </span>
                  {!micOn && (
                    <div className="flex items-center justify-center h-5 w-5 rounded-full p-0.5 bg-base-200">
                      <MicrophoneIcon size="SMALL" color="RED" />
                    </div>
                  )}
                </div>
              </LocalUser>
            </div>

            {remoteUsers.map((user) => {
              return (
                <div
                  key={user.uid}
                  className="relative w-64 h-36 bg-base-300 rounded overflow-hidden"
                >
                  <RemoteUser
                    user={user}
                    playAudio={true}
                    playVideo={true}
                    className="w-full h-full object-cover"
                  >
                    <div className="absolute bottom-1 left-1 p-1 rounded flex space-x-1 items-center">
                      <span className="text-xs text-white bg-base-200 bg-opacity-50 rounded px-2 py-0.5">
                        {user.uid}
                      </span>
                      {!user.hasAudio && (
                        <div className="flex items-center justify-center h-5 w-5 rounded-full p-0.5 bg-base-200">
                          <MicrophoneIcon size="SMALL" color="RED" />
                        </div>
                      )}
                    </div>
                  </RemoteUser>
                </div>
              );
            })}
          </div>
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-1 items-center">
            <button
              className="p-3 bg-base-300 rounded-full hover:opacity-70"
              onClick={() => setMic((prev) => !prev)}
            >
              {micOn ? (
                <MicrophoneIcon size="LARGE" color="WHITE" />
              ) : (
                <MicrophoneIcon size="LARGE" color="RED" />
              )}
            </button>
            <button
              className="p-3 bg-base-300 rounded-full hover:opacity-70"
              onClick={() => setCamera((prev) => !prev)}
            >
              {cameraOn ? (
                <CameraIcon size="LARGE" color="WHITE" />
              ) : (
                <CameraIcon size="LARGE" color="RED" />
              )}
            </button>
            <button
              className="ml-2 py-2 px-4 bg-red-600 text-white rounded-xl hover:opacity-70"
              onClick={handleEndCall}
            >
              <p className="font-bold">End Call</p>
            </button>
          </div>
        </>
      ) : (
        <div className="text-xl text-white">Connecting...</div>
      )}
    </div>
  );
};

interface VideoCallingClientProps {
  initialChannel?: string;
}

const VideoCallingClient = ({ initialChannel }: VideoCallingClientProps) => {
  const { dbUser: user } = useAmplifyAuthenticatedUser();
  const [agoraClient, setAgoraClient] = useState<IAgoraRTCClient | null>(null);
  const [calling, setCalling] = useState(false);
  const [tokenData, setTokenData] = useState<{
    appId: string;
    token: string;
    channelName: string;
    uid: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Create the client only when needed and not already created
  useEffect(() => {
    if (calling && !agoraClient) {
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      setAgoraClient(client);
    }
  }, [calling, agoraClient]);

  const fetchToken = async (channelName: string) => {
    if (!user) {
      setError("You must be signed in to join a channel");
      return;
    }

    if (!channelName) {
      setError("Invalid channel name.");
      return;
    }

    try {
      setError(null);
      setCalling(true);
      const uid = user?.id;

      // Call the Lambda function to generate a token neccessary for a user to join the video call,
      // with it's (NAME => Agora concept) being the name of the (channel => my concept).
      const { data, errors } = await client.queries.videoCall({
        name: channelName,
      });

      if (errors) {
        throw new Error(
          `GraphQL errors: ${errors.map((e: any) => e.message).join(", ")}`
        );
      }

      if (!data) {
        throw new Error("No data returned from videoCall query");
      }

      const parsed = JSON.parse(data);
      if (!parsed.token || !parsed.appId) {
        throw new Error("Invalid token data: missing token or appId");
      }

      setTokenData({
        token: parsed.token,
        appId: parsed.appId,
        channelName,
        uid,
      });
      console.log("Token fetched successfully, ready to join.");
    } catch (error) {
      console.error("Failed to fetch token or join channel:", error);
      setError(
        `Failed to join channel: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      setCalling(false);
    }
  };

  const handleJoinChannel = () => {
    if (!initialChannel) {
      setError("Please enter a channel name");
      return;
    }
    fetchToken(initialChannel);
  };

  const handleDisconnect = async () => {
    if (agoraClient) {
      try {
        await agoraClient.leave();
        // Remove listeners after leaving successfully
        agoraClient.removeAllListeners();
      } catch (error) {
        console.error("Error leaving Agora channel:", error);
      }
    }
    setCalling(false);
    setAgoraClient(null);
    setTokenData(null);
    setError(null);
  };

  return (
    <div className="h-full flex flex-col justify-center items-center text-white">
      {" "}
      {error && (
        <div className="p-4 bg-red-700 text-white rounded mb-4 max-w-md text-center">
          {" "}
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      {!calling ? (
        <main className="flex flex-col items-center">
          <div className="mb-4 text-lg">Join Channel:</div>
          <div
            id="channelName"
            className="px-5 py-2 font-bold border border-gray-300 rounded text-center bg-gray-700 mb-4"
          >
            {initialChannel || "No Channel Specified"}
          </div>
          <button
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleJoinChannel}
            disabled={!initialChannel || calling}
          >
            Join Channel
          </button>
        </main>
      ) : agoraClient && tokenData ? (
        <AgoraRTCProvider client={agoraClient}>
          <VideoCall
            appId={tokenData.appId}
            channel={tokenData.channelName}
            token={tokenData.token}
            uid={tokenData.uid}
            onDisconnect={handleDisconnect}
          />
        </AgoraRTCProvider>
      ) : (
        <div className="text-lg text-gray-400">Initializing Call...</div>
      )}
    </div>
  );
};

export default VideoCallingClient;

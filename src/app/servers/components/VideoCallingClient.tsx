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
} from "agora-rtc-react";
import AgoraRTC from "agora-rtc-react";
import { useState, useEffect } from "react";
import MicrophoneIcon from "@/src/components/Icons/MicrophoneIcon";
import CameraIcon from "@/src/components/Icons/CameraIcon";

interface VideoCallProps {
  appId: string;
  channel: string;
  token: string;
  onDisconnect: () => void;
}

const VideoCall = ({ appId, channel, token, onDisconnect }: VideoCallProps) => {
  const [micOn, setMic] = useState(false);
  const [cameraOn, setCamera] = useState(false);
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  const { localCameraTrack } = useLocalCameraTrack(cameraOn);
  const isConnected = useIsConnected();
  const remoteUsers = useRemoteUsers();

  useJoin({ appid: appId, channel, token: token || null }, true);
  usePublish([localMicrophoneTrack, localCameraTrack]);

  useEffect(() => {
    return () => {
      localMicrophoneTrack?.close();
      localCameraTrack?.close();
    };
  }, [localMicrophoneTrack, localCameraTrack]);

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

            {remoteUsers.map((user) => (
              <div
                key={user.uid}
                className="relative w-64 h-36 bg-base-300 rounded overflow-hidden"
              >
                <RemoteUser user={user} className="w-full h-full object-cover">
                  <div className="absolute bottom-1 left-1 p-1 rounded flex space-x-1 items-center">
                    <span className="text-xs text-white bg-base-200 bg-opacity-50 rounded px-2 py-0.5">
                      {user.uid}
                    </span>
                  </div>
                </RemoteUser>
              </div>
            ))}
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
              className="ml-2 py-2 px-4 bg-error-content rounded-xl hover:opacity-70"
              onClick={onDisconnect}
            >
              <p className="font-bold text-white">End Call</p>
            </button>
          </div>
        </>
      ) : (
        <div className="text-xl">Connecting...</div>
      )}
    </div>
  );
};

const VideoCallingClient = () => {
  const [client, setClient] = useState<any>(null);
  const [calling, setCalling] = useState(false);
  // const appId = process.env.NEXT_PUBLIC_APP_ID || "";
  const [appId, setAppId] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const channel = "Test";
  // const token = process.env.NEXT_PUBLIC_TEMP_TOKEN || "";

  useEffect(() => {
    if (calling && !client) {
      const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      setClient(agoraClient);
    }
  }, [calling, client]);

  const handleDisconnect = () => {
    if (client) {
      client.leave().catch(console.error);
      client.removeAllListeners();
    }
    setCalling(false);
    setClient(null);
  };

  return (
    <div className="h-full">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Enter App ID"
          value={appId}
          onChange={(e) => setAppId(e.target.value)}
          className="p-2 border border-gray-300 rounded"
        />
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Enter Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="p-2 border border-gray-300 rounded"
        />
      </div>

      {!calling ? (
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => setCalling(true)}
        >
          Start Call
        </button>
      ) : client ? (
        <AgoraRTCProvider client={client}>
          <VideoCall
            appId={appId}
            channel={channel}
            token={token}
            onDisconnect={handleDisconnect}
          />
        </AgoraRTCProvider>
      ) : (
        <div className="text-lg text-white">Initializing...</div>
      )}
    </div>
  );
};

export default VideoCallingClient;

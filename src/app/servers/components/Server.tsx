"use client";
import { useAmplifyAuthenticatedUser } from "@/src/hooks/useAmplifyAuthenticatedUser";
import gsap from "gsap";
import dynamic from "next/dynamic";
import React, { useEffect, useRef, useState } from "react";
import { getServerInfo } from "../services/getServerInfo";

const VideoCallingClient = dynamic(() => import("./VideoCallingClient"), {
  ssr: false,
});

interface ServerProps {
  serverId: string;
}

const Server = ({ serverId }: ServerProps) => {
  const { dbUser: user } = useAmplifyAuthenticatedUser();

  const [serverName, setServerName] = useState<string | null>(null);
  const [serverMembers, setServerMembers] = useState<ServerMember[]>();
  const [channels, setChannels] = useState<Channel[]>();

  const serverContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchServerInfo = async () => {
      if (serverId) {
        const { serverName, serverMembers, serverChannels } =
          await getServerInfo(serverId);
        setServerName(serverName);
        setServerMembers(serverMembers);
        setChannels(serverChannels);
      }
    };

    fetchServerInfo();
  }, [serverId]);

  useEffect(() => {
    if (serverName && serverContentRef.current) {
      gsap.fromTo(
        serverContentRef.current,
        { scale: 0.99, opacity: 0 },
        { scale: 1, opacity: 1, delay: 0.4, duration: 0.5, ease: "power2.out" }
      );
    }
  }, [serverName]);

  return (
    <div
      ref={serverContentRef}
      style={{ opacity: 0 }}
      className="flex flex-row w-full h-full border border-gray-700"
    >
      <aside className="flex-[1] flex flex-col bg-base-300">
        {/* Server Name */}
        <div className="flex-1 px-4 flex items-center border-b border-gray-700 bg-midnight">
          <h2 className="text-xl font-bold text-white">{serverName}</h2>
        </div>
        {/* Channel List */}
        <div className="flex-7 p-4 space-y-4">
          <section className="">
            <h3 className="mb-2 text-xs font-semibold text-gray-400 uppercase">
              Text Channels
            </h3>
            <ul className="space-y-2">
              <li className="hover:bg-gray-700 rounded cursor-pointer text-gray-300">
                # general
              </li>
              <li className="hover:bg-gray-700 rounded cursor-pointer text-gray-300">
                # announcements
              </li>
              <li className="hover:bg-gray-700 rounded cursor-pointer text-gray-300">
                # random
              </li>
            </ul>
          </section>
          <section className="">
            <h3 className="mb-2 text-xs font-semibold text-gray-400 uppercase">
              Voice Channels
            </h3>
            <ul className="space-y-2">
              <li className="hover:bg-gray-700 rounded cursor-pointer text-gray-300">
                🔊 General Voice
              </li>
              <li className="hover:bg-gray-700 rounded cursor-pointer text-gray-300">
                🔊 Gaming
              </li>
            </ul>
          </section>
        </div>
        {/* User Info */}
        <div className="flex-1 px-4 border-t border-gray-700 flex items-center space-x-2 bg-midnight">
          <div className="w-8 h-8 bg-gray-600 rounded-full"></div>
          <div>
            <p className="text-sm font-semibold">{user?.username || "User"}</p>
          </div>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-[3] bg-midnight relative"></main>
    </div>
  );
};

export default Server;

"use client";
import { useAmplifyAuthenticatedUser } from "@/src/hooks/useAmplifyAuthenticatedUser";
import { client } from "@/src/utils/amplifyClient";
import gsap from "gsap";
import dynamic from "next/dynamic";
import React, { useEffect, useRef, useState } from "react";

const VideoCallingClient = dynamic(() => import("./VideoCallingClient"), {
  ssr: false,
});

interface ServerProps {
  serverId: string;
}

const Server = ({ serverId }: ServerProps) => {
  const { dbUser: user } = useAmplifyAuthenticatedUser();
  const [serverName, setServerName] = useState<string | null>(null);
  const serverContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (serverId) {
      setServerName(null);
      downloadServerInfo();
    }
  }, [serverId]);

  useEffect(() => {
    if (serverName && serverContentRef.current) {
      gsap.fromTo(
        serverContentRef.current,
        { scale: 0.99, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: "power2.out" }
      );
    }
  }, [serverName]);

  const downloadServerInfo = async () => {
    try {
      const { data: serverInfo, errors } = await client.models.Server.get({
        id: serverId,
      });
      if (errors) {
        console.error(errors);
        return;
      }
      setServerName(serverInfo?.name || "Unknown Server");
    } catch (error) {
      console.error("Failed to fetch server info:", error);
    }
  };

  return (
    <div
      ref={serverContentRef}
      style={{ opacity: 0 }}
      className="w-full h-full"
    >
      <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-slate-600 via-slate-400 to-slate-300">
        {serverName}
      </h2>
      <VideoCallingClient />
    </div>
  );
};

export default Server;

"use client";
import dynamic from "next/dynamic";
import { useAmplifyAuthenticatedUser } from "@/src/hooks/useAmplifyAuthenticatedUser";
import { client } from "@/src/utils/amplifyClient";
import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import CreateServerPopUp from "./components/CreateServerPopUp";

const VideoCalling = dynamic(() => import("./components/VideoCallingClient"), {
  ssr: false,
});

export default function ServersPage() {
  const { dbUser: user } = useAmplifyAuthenticatedUser();
  const [showPopUp, setShowPopUp] = useState(false);
  const popUpRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [servers, setServers] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      getAllServers();
    }
  }, [user]);

  // Animate popup in
  useEffect(() => {
    if (showPopUp && popUpRef.current && backdropRef.current) {
      gsap.fromTo(
        popUpRef.current,
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" }
      );
      gsap.fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 0.5, duration: 0.3 }
      );
    }
  }, [showPopUp]);

  // Animate popup out
  const closePopUp = () => {
    if (popUpRef.current && backdropRef.current) {
      gsap.to(popUpRef.current, {
        scale: 0.95,
        opacity: 0,
        duration: 0.2,
        ease: "power2.in",
      });
      gsap.to(backdropRef.current, {
        opacity: 0,
        duration: 0.2,
        onComplete: () => setShowPopUp(false),
      });
    } else {
      setShowPopUp(false);
    }
  };

  const getAllServers = async () => {
    if (!user) return;
    try {
      // Fetch servers the user is a member of via ServerMember field
      const { data: serversWithUser, errors: errorGetAllServers } =
        await client.models.ServerMember.list({
          filter: { userId: { eq: user.id } },
        });
      if (errorGetAllServers) {
        console.error("Errors fetching servers:", errorGetAllServers);
      }

      // Fetch server IDs from member records
      const serverIds = serversWithUser.map((record) => record.serverId);

      // Fetch server names from servers
      const serverNamesPromises = serverIds.map(async (serverId) => {
        const { data: server, errors: errorGetServerNames } =
          await client.models.Server.get({
            id: serverId,
          });
        if (errorGetServerNames) {
          console.error("Errors fetching server names:", errorGetServerNames);
        }
        return server?.name;
      });

      // Wait for all promises and filter out undefined values
      const theServers = (await Promise.all(serverNamesPromises)).filter(
        (name): name is string => typeof name === "string"
      );

      setServers(theServers);
      console.log("Fetched servers:", theServers);
    } catch (error) {
      console.error("Error fetching servers:", error);
    }
  };

  return (
    <div className="h-auto w-full flex flex-col border m-4 p-4 rounded relative">
      <header className="flex mb-4 items-center justify-between">
        <section className="flex items-center">
          <h1 className="text-2xl font-semibold mr-4">Servers</h1>
          <ul className="flex flex-row items-center space-x-2">
            {servers.map((server, index) => (
              <li key={index} className="flex p-2 bg-base-200 rounded-xl">
                {server}
              </li>
            ))}
            <button
              className="btn btn-secondary btn-sm"
              onClick={getAllServers}
            >
              Fetch Servers
            </button>
          </ul>
        </section>
        <section>
          <button
            onClick={() => setShowPopUp(true)}
            className="btn btn-secondary btn-sm"
          >
            Create Server
          </button>
        </section>
      </header>

      <div className="flex-1 p-4 rounded bg-base-200 overflow-hidden">
        <VideoCalling />
      </div>

      {showPopUp && (
        <>
          <div
            ref={backdropRef}
            className="fixed inset-0 bg-black z-40"
            onClick={closePopUp}
          ></div>
          <div
            ref={popUpRef}
            className="fixed z-50 bg-base-200 p-6 rounded-xl shadow-xl w-[90%] max-w-md top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <CreateServerPopUp
              closePopUp={closePopUp}
              onServerCreated={getAllServers}
            />
          </div>
        </>
      )}
    </div>
  );
}

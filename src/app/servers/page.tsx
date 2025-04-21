"use client";
import dynamic from "next/dynamic";
import { useAmplifyAuthenticatedUser } from "@/src/hooks/useAmplifyAuthenticatedUser";
import { client } from "@/src/utils/amplifyClient";
import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import CreateServerPopUp from "./components/CreateServerPopUp";
import { downloadData } from "aws-amplify/storage";
import Server from "./components/Server";

export default function ServersPage() {
  const { dbUser: user } = useAmplifyAuthenticatedUser();
  const [servers, setServers] = useState<{ id: string; iconUrl: string }[]>([]);
  const [serverId, setServerId] = useState<string>(""); // For front-end
  const [showPopUp, setShowPopUp] = useState(false);
  const popUpRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      getAllServerInfos();
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

  const getAllServerInfos = async () => {
    if (!user) return;
    try {
      const { data: serversWithUser, errors: errorGetAllServers } =
        await client.models.ServerMember.list({
          filter: { userId: { eq: user.id } },
        });
      if (errorGetAllServers) {
        console.error("Errors fetching servers: ", errorGetAllServers);
      }
      console.log(serversWithUser);

      const serverIds = serversWithUser.map((record) => record.serverId);

      const iconMapPromises = serverIds.map(async (serverId) => {
        const { data: server, errors: errorGetServerIcons } =
          await client.models.Server.get({ id: serverId });
        if (errorGetServerIcons) {
          console.error("Errors fetching server icons: ", errorGetServerIcons);
        }
        return server?.icon ? { id: serverId, icon: server.icon } : null;
      });

      const serverIdToIconMap = (await Promise.all(iconMapPromises)).filter(
        (entry): entry is { id: string; icon: string } => !!entry
      );

      await downloadServerIcons(serverIdToIconMap);
    } catch (error) {
      console.error("Unknown Error: ", error);
    }
  };

  const downloadServerIcons = async (
    serverIdToIconMap: { id: string; icon: string }[]
  ) => {
    const downloaded: { id: string; iconUrl: string }[] = [];

    for (let { id, icon } of serverIdToIconMap) {
      try {
        const { body } = await downloadData({ path: icon }).result;
        const blob = await body.blob();
        const url = URL.createObjectURL(blob);

        downloaded.push({ id, iconUrl: url });
      } catch (error) {
        console.error(`Failed to download icon ${icon}:`, error);
      }
    }

    setServers(downloaded);
  };

  return (
    <div className="h-auto w-full flex flex-col p-6 rounded relative">
      <header className="flex mb-4 items-center justify-between">
        <div id="left-side" className="flex">
          <h1 className="text-4xl font-semibold mr-4">Servers</h1>
          <ul className="flex flex-row items-center space-x-4">
            {servers.map(({ id, iconUrl }, index) => (
              <li key={id}>
                <div
                  className={`avatar ${
                    serverId === id
                      ? "scale-110 rounded-xl outline-2 outline-gray-300"
                      : ""
                  }`}
                  onClick={() => setServerId(id)}
                >
                  <div className="w-10 rounded-xl cursor-pointer hover:opacity-80 transition-opacity">
                    <img src={iconUrl} alt={`Server ${index}`} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <section>
          <button
            onClick={() => setShowPopUp(true)}
            className="btn btn-accent btn-sm"
          >
            Create Server
          </button>
        </section>
      </header>

      <div className="flex-1 rounded">
        {serverId ? (
          <Server serverId={serverId} />
        ) : (
          <div className="flex w-full h-full items-center justify-center border border-gray-700">
            Select a server.
          </div>
        )}
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
              onServerCreated={getAllServerInfos}
            />
          </div>
        </>
      )}
    </div>
  );
}

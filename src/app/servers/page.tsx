"use client";
import dynamic from "next/dynamic";
import { useAmplifyAuthenticatedUser } from "@/src/hooks/useAmplifyAuthenticatedUser";
import { client } from "@/src/utils/amplifyClient";
import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import CreateServerPopUp from "./components/CreateServerPopUp";
import { downloadData } from "aws-amplify/storage";

const VideoCalling = dynamic(() => import("./components/VideoCallingClient"), {
  ssr: false,
});

export default function ServersPage() {
  const { dbUser: user } = useAmplifyAuthenticatedUser();
  const [showPopUp, setShowPopUp] = useState(false);
  const popUpRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [serverIcons, setServerIcons] = useState<string[]>([]);

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
      // Fetch servers the user is a member of via ServerMember field
      const { data: serversWithUser, errors: errorGetAllServers } =
        await client.models.ServerMember.list({
          filter: { userId: { eq: user.id } },
        });
      if (errorGetAllServers) {
        console.error("Errors fetching servers:", errorGetAllServers);
      }

      // Fetch server IDs
      const serverIds = serversWithUser.map((record) => record.serverId);

      // Fetch server icons from servers
      const serverIconsPromises = serverIds.map(async (serverId) => {
        const { data: server, errors: errorGetServerIcons } =
          await client.models.Server.get({
            id: serverId,
          });
        if (errorGetServerIcons) {
          console.error("Errors fetching server icons:", errorGetServerIcons);
        }
        return server?.icon;
      });

      // Wait for all promises and filter out undefined values
      const theServerIcons = (await Promise.all(serverIconsPromises)).filter(
        (name): name is string => typeof name === "string"
      );
      console.log("Fetched servers:", theServerIcons);

      // Automatically download icons
      if (theServerIcons.length > 0) {
        await downloadServerIcons(theServerIcons);
      }
    } catch (error) {
      console.error("Error fetching servers:", error);
    }
  };

  const downloadServerIcons = async (icons: string[]) => {
    const theServerIconURLs: string[] = [];
    for (let icon of icons) {
      try {
        const { body } = await downloadData({ path: icon }).result;
        const blob = await body.blob();
        const url = URL.createObjectURL(blob);

        theServerIconURLs.push(url);
      } catch (error) {
        console.error(`Failed to download icon ${icon}:`, error);
      }
    }
    setServerIcons(theServerIconURLs);
  };

  return (
    <div className="h-auto w-full flex flex-col p-6 rounded relative">
      <header className="flex mb-4 items-center justify-between">
        <h1 className="text-4xl font-semibold mr-4">Servers</h1>
        <ul className="flex flex-row items-center space-x-2">
          {serverIcons.map((serverIcon, index) => (
            <li key={index}>
              <div className="avatar avatar-online">
                <div className="w-10 rounded-xl cursor-pointer hover:opacity-70">
                  <img src={serverIcon} alt="ProfileIcon" />
                </div>
              </div>
            </li>
          ))}
        </ul>
        <section>
          <button
            onClick={() => setShowPopUp(true)}
            className="btn btn-accent btn-sm"
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
              onServerCreated={getAllServerInfos}
            />
          </div>
        </>
      )}
    </div>
  );
}

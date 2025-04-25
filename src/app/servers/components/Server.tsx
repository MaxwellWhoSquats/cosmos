"use client";
import { useAmplifyAuthenticatedUser } from "@/src/hooks/useAmplifyAuthenticatedUser";
import gsap from "gsap";
import dynamic from "next/dynamic";
import React, { useEffect, useRef, useState } from "react";
import { getServerInfo } from "../services/serverServices";
import {
  PopUpAddServerMember,
  PopUpServerMemberActions,
  PopUpAddChannel,
} from "@/src/components/PopUps";
import SettingsIcon from "@/src/components/Icons/SettingsIcon";
import PlusIcon from "@/src/components/Icons/PlusIcon";
import CrownIcon from "@/src/components/Icons/CrownIcon";
import { getUserIcon } from "@/src/utils/getUserIcon";
import TextChannel from "./TextChannel";

const VideoCallingClient = dynamic(() => import("./VideoCallingClient"), {
  ssr: false,
});

interface ServerProps {
  serverId: string;
}

const Server = ({ serverId }: ServerProps) => {
  const { dbUser: user } = useAmplifyAuthenticatedUser();
  const [serverName, setServerName] = useState<string | null>(null);
  const [serverMembers, setServerMembers] = useState<ServerMember[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [userDataMap, setUserDataMap] = useState<
    Record<string, RelevantUserData>
  >({});
  const [userIcon, setUserIcon] = useState<string | null>(null);
  const [showAddServerMemberPopUp, setShowAddServerMemberPopUp] =
    useState(false);
  const [showAddChannelPopUp, setShowAddChannelPopUp] = useState(false);
  const [newChannelType, setNewChannelType] = useState<"TEXT" | "VOICE">(
    "TEXT"
  );
  const [selectedMember, setSelectedMember] = useState<ServerMember | null>(
    null
  );
  const [selectedVoiceChannel, setSelectedVoiceChannel] = useState<
    string | null
  >(null);
  const [selectedTextChannel, setSelectedTextChannel] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isServerLoading, setIsServerLoading] = useState(true);
  const serverContentRef = useRef<HTMLDivElement | null>(null);
  const addServerMemberPopUpRef = useRef<HTMLDivElement | null>(null);
  const addChannelPopUpRef = useRef<HTMLDivElement | null>(null);
  const memberActionsPopUpRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsServerLoading(true);

    setSelectedTextChannel(null);
    setSelectedVoiceChannel(null);

    const fetchServerInfo = async () => {
      if (!serverId || !user) {
        if (isMounted) setIsServerLoading(false);
        return;
      }
      try {
        const { serverName, serverMembers, serverChannels } =
          await getServerInfo(serverId);
        if (isMounted) {
          setServerName(serverName);
          setServerMembers(serverMembers);
          setChannels(serverChannels);
          const map: Record<string, RelevantUserData> = {};
          serverMembers.forEach((member) => {
            map[member.user.id] = {
              username: member.user.username,
              icon: member.user.icon,
            };
          });
          setUserDataMap(map);
          if (user?.icon) {
            getUserIcon(user.icon).then((iconUrl) => {
              if (isMounted) setUserIcon(iconUrl);
            });
          }
          setIsServerLoading(false);
        }
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setIsServerLoading(false);
        }
      }
    };
    fetchServerInfo();
    return () => {
      isMounted = false;
    };
  }, [serverId, user]);

  useEffect(() => {
    if (!isServerLoading && serverName && serverContentRef.current) {
      gsap.fromTo(
        serverContentRef.current,
        { scale: 0.99, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" }
      );
    } else if (isServerLoading && serverContentRef.current) {
      gsap.set(serverContentRef.current, { opacity: 0 });
    }
  }, [isServerLoading, serverName]);

  useEffect(() => {
    if (showAddServerMemberPopUp && addServerMemberPopUpRef.current) {
      gsap.fromTo(
        addServerMemberPopUpRef.current,
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" }
      );
    }
  }, [showAddServerMemberPopUp]);

  useEffect(() => {
    if (showAddChannelPopUp && addChannelPopUpRef.current) {
      gsap.fromTo(
        addChannelPopUpRef.current,
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" }
      );
    }
  }, [showAddChannelPopUp]);

  useEffect(() => {
    if (selectedMember && memberActionsPopUpRef.current) {
      gsap.fromTo(
        memberActionsPopUpRef.current,
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" }
      );
    }
  }, [selectedMember]);

  const closeAddServerMemberPopUp = () => {
    if (addServerMemberPopUpRef.current) {
      gsap.to(addServerMemberPopUpRef.current, {
        scale: 0.95,
        opacity: 0,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => setShowAddServerMemberPopUp(false),
      });
    }
  };

  const closeAddChannelPopUp = () => {
    if (addChannelPopUpRef.current) {
      gsap.to(addChannelPopUpRef.current, {
        scale: 0.95,
        opacity: 0,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => setShowAddChannelPopUp(false),
      });
    }
  };

  const closeMemberActionsPopUp = () => {
    if (memberActionsPopUpRef.current) {
      gsap.to(memberActionsPopUpRef.current, {
        scale: 0.95,
        opacity: 0,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => setSelectedMember(null),
      });
    }
  };

  const handleAddServerMember = (newMember: ServerMember) => {
    setServerMembers((prev) => [...prev, newMember]);

    // Update userDataMap with new member
    setUserDataMap((prev) => ({
      ...prev,
      [newMember.id]: {
        username: newMember.user.username,
        icon: newMember.user.icon,
      },
    }));
    closeAddServerMemberPopUp();
  };

  const handleCreateNewChannel = (channelType: "TEXT" | "VOICE") => {
    setNewChannelType(channelType);
    setShowAddChannelPopUp(true);
  };

  const handleAddChannel = (newChannel: Channel) => {
    setChannels((prev) => [...prev, newChannel]);
    closeAddChannelPopUp();
  };

  const handleJoinVoiceChannel = (channelName: string) => {
    setSelectedVoiceChannel(channelName);
    setSelectedTextChannel(null);
  };

  const handleJoinTextChannel = (channelId: string, channelName: string) => {
    setSelectedTextChannel({ id: channelId, name: channelName });
    setSelectedVoiceChannel(null);
  };

  return (
    <div
      ref={serverContentRef}
      style={{ opacity: 0 }}
      className="flex flex-row w-full h-full border border-gray-700"
    >
      {/* Left Sidebar */}
      <aside className="flex-[1] flex flex-col bg-base-300">
        <div className="flex-1 px-6 flex justify-between items-center border-b border-gray-700 bg-midnight">
          <h2 className="text-xl font-bold text-white">{`// ${serverName ?? "Loading..."}`}</h2>
          <div className="cursor-pointer hover:scale-125 transition duration-100">
            <SettingsIcon />
          </div>
        </div>
        <div className="flex-7 p-6 space-y-4 overflow-y-auto">
          <section>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase">
                Text Channels
              </h3>
              <div
                className="cursor-pointer hover:scale-125 transition duration-100"
                onClick={() => handleCreateNewChannel("TEXT")}
              >
                <PlusIcon />
              </div>
            </div>
            <ul className="space-y-2">
              {channels
                .filter((channel) => channel.type === "TEXT")
                .map((channel) => (
                  <li
                    key={channel.id}
                    className={`hover:bg-gray-800 rounded cursor-pointer text-gray-300 p-1 ${selectedTextChannel?.id === channel.id ? "bg-gray-800 font-semibold" : ""}`}
                    onClick={() =>
                      handleJoinTextChannel(channel.id, channel.name)
                    }
                  >
                    # {channel.name}
                  </li>
                ))}
            </ul>
          </section>
          <section>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase">
                Voice Channels
              </h3>
              <div
                className="cursor-pointer hover:scale-125 transition duration-100"
                onClick={() => handleCreateNewChannel("VOICE")}
              >
                <PlusIcon />
              </div>
            </div>
            <ul className="space-y-2">
              {channels
                .filter((channel) => channel.type === "VOICE")
                .map((channel) => (
                  <li
                    key={channel.id}
                    className={`hover:bg-gray-800 rounded cursor-pointer text-gray-300 p-1 ${selectedVoiceChannel === channel.name ? "bg-gray-800 font-semibold" : ""}`}
                    onClick={() => handleJoinVoiceChannel(channel.name)}
                  >
                    🔊 {channel.name}
                  </li>
                ))}
            </ul>
          </section>
        </div>
        <div className="flex-1 px-6 border-t border-gray-700 flex items-center space-x-2 bg-midnight">
          <div className="w-8 h-8 rounded-full overflow-hidden">
            {userIcon ? (
              <img
                src={userIcon}
                alt={`${user?.username}'s icon`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-600 rounded-full" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold">{user?.username || "User"}</p>
          </div>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-[3] bg-midnight border-l border-r border-gray-700 relative">
        {isServerLoading ? (
          <div className="w-full h-full flex justify-center items-center">
            <span className="loading loading-spinner loading-lg text-info"></span>
          </div>
        ) : selectedVoiceChannel ? (
          <VideoCallingClient initialChannel={selectedVoiceChannel} />
        ) : selectedTextChannel ? (
          <TextChannel
            key={selectedTextChannel.id}
            channelId={selectedTextChannel.id}
            channelName={selectedTextChannel.name}
            userDataMap={userDataMap}
          />
        ) : (
          <div className="w-full h-full flex justify-center items-center">
            Select a channel to connect
          </div>
        )}
      </main>
      {/* Right Sidebar: Server Members */}
      <aside className="flex-[1] flex flex-col bg-base-300">
        <div className="flex justify-center items-center px-6 py-4 space-x-2 border-b border-gray-700 bg-midnight">
          <h3 className="text-lg font-bold text-white">Server Members</h3>
          <button
            className="btn btn-xs btn-dash btn-secondary"
            onClick={() => setShowAddServerMemberPopUp(true)}
          >
            +
          </button>
        </div>
        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
          <section>
            <h4 className="mb-2 text-xs font-semibold text-gray-400 uppercase">
              Members
            </h4>
            <ul className="space-y-2">
              {serverMembers && serverMembers.length > 0 ? (
                serverMembers.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center space-x-2 p-1 text-gray-300 cursor-pointer hover:scale-105 hover:outline outline-purple-300 rounded-xl transition-transform duration-100"
                    onClick={() => setSelectedMember(member)}
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden">
                      {member.user.icon ? (
                        <img
                          src={member.user.icon}
                          alt={`${member.user.username}'s icon`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full skeleton rounded-full" />
                      )}
                    </div>
                    <span>{member.user.username}</span>
                    {member.role === "CREATOR" && (
                      <span className="p-0.5 rounded bg-yellow-300/80">
                        <CrownIcon />
                      </span>
                    )}
                  </li>
                ))
              ) : (
                <li className="text-gray-400">No members found</li>
              )}
            </ul>
          </section>
        </div>
      </aside>
      {/* Popups */}
      {showAddServerMemberPopUp && (
        <div
          ref={addServerMemberPopUpRef}
          className="fixed z-50 bg-base-200 p-6 rounded-xl shadow-xl w-[90%] max-w-md top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <PopUpAddServerMember
            closePopUp={closeAddServerMemberPopUp}
            serverId={serverId}
            onAdd={handleAddServerMember}
          />
        </div>
      )}
      {showAddChannelPopUp && (
        <div
          ref={addChannelPopUpRef}
          className="fixed z-50 bg-base-200 p-6 rounded-xl shadow-xl w-[90%] max-w-md top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <PopUpAddChannel
            serverId={serverId}
            channelType={newChannelType}
            closePopUp={closeAddChannelPopUp}
            onAdd={handleAddChannel}
          />
        </div>
      )}
      {selectedMember && (
        <div
          ref={memberActionsPopUpRef}
          className="fixed z-50 bg-base-200 p-6 rounded-xl shadow-xl w-[90%] max-w-md top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <PopUpServerMemberActions
            member={selectedMember}
            closePopUp={closeMemberActionsPopUp}
            onDelete={() => {
              setServerMembers((prev) =>
                prev.filter((m) => m.id !== selectedMember.id)
              );
              closeMemberActionsPopUp();
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Server;

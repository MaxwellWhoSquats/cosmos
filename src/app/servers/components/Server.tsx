"use client";
import { useAmplifyAuthenticatedUser } from "@/src/hooks/useAmplifyAuthenticatedUser";
import gsap from "gsap";
import dynamic from "next/dynamic";
import React, { useEffect, useRef, useState } from "react";
import {
  downloadServerMemberIcons,
  getServerInfo,
} from "../services/serverServices";
import {
  PopUpAddServerMember,
  PopUpServerMemberActions,
} from "@/src/components/PopUps";

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
  const [memberIcons, setMemberIcons] = useState<MemberIcon[]>([]);
  const [showAddServerMemberPopUp, setShowAddServerMemberPopUp] =
    useState(false);
  const [selectedMember, setSelectedMember] = useState<ServerMember | null>(
    null
  );

  const serverContentRef = useRef<HTMLDivElement | null>(null);
  const addServerMemberPopUpRef = useRef<HTMLDivElement | null>(null);
  const memberActionsPopUpRef = useRef<HTMLDivElement | null>(null);
  const userIcon = memberIcons.find((icon) => icon.id === user?.id)?.icon;

  useEffect(() => {
    const fetchServerInfo = async () => {
      if (serverId) {
        const { serverName, serverMembers, serverChannels } =
          await getServerInfo(serverId);
        setServerName(serverName);
        setServerMembers(serverMembers);
        setChannels(serverChannels);
        const icons = await downloadServerMemberIcons(serverId);
        setMemberIcons(icons);
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

  return (
    <div
      ref={serverContentRef}
      style={{ opacity: 0 }}
      className="flex flex-row w-full h-full border border-gray-700"
    >
      {/* Left Sidebar */}
      <aside className="flex-[1] flex flex-col bg-base-300">
        <div className="flex-1 px-6 space-x-4 flex items-center border-b border-gray-700 bg-midnight">
          <h2 className="text-2xl font-bold text-white overflow-hidden">
            {serverName}
          </h2>
        </div>
        <div className="flex-7 p-6 space-y-4">
          <section>
            <h3 className="mb-2 text-xs font-semibold text-gray-400 uppercase">
              Text Channels
            </h3>
            <ul className="space-y-2">
              {["general", "announcements", "random"].map((channel) => (
                <li
                  key={channel}
                  className="hover:bg-gray-700 rounded cursor-pointer text-gray-300 p-2"
                >
                  # {channel}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h3 className="mb-2 text-xs font-semibold text-gray-400 uppercase">
              Voice Channels
            </h3>
            <ul className="space-y-2">
              {["General Voice", "Gaming"].map((channel) => (
                <li
                  key={channel}
                  className="hover:bg-gray-700 rounded cursor-pointer text-gray-300 p-2"
                >
                  🔊 {channel}
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
      <main className="flex-[4] bg-midnight border-l border-r border-gray-700" />
      {/* Right Sidebar: Server Members */}
      <aside className="flex-[1] flex flex-col bg-base-300">
        <div className="flex justify-center items-center px-6 py-4 space-x-2 border-b border-gray-700 bg-midnight">
          <h3 className="text-lg font-bold text-white">Server Members</h3>
          <button
            className="btn btn-xs btn-primary"
            onClick={() => setShowAddServerMemberPopUp(true)}
          >
            +
          </button>
        </div>
        <div className="flex-1 p-6 space-y-4">
          <section>
            <h4 className="mb-2 text-xs font-semibold text-gray-400 uppercase">
              Members
            </h4>
            <ul className="space-y-2">
              {serverMembers && serverMembers.length > 0 ? (
                serverMembers.map((member) => {
                  const memberIcon = memberIcons.find(
                    (icon) => icon.id === member.user.id
                  )?.icon;
                  return (
                    <li
                      key={member.id}
                      className="flex items-center space-x-2 p-1 text-gray-300 cursor-pointer hover:scale-105 hover:outline outline-purple-300 rounded-xl"
                      onClick={() => setSelectedMember(member)}
                    >
                      <div className="w-6 h-6 rounded-full overflow-hidden">
                        {memberIcon ? (
                          <img
                            src={memberIcon}
                            alt={`${member.user.username}'s icon`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full skeleton rounded-full" />
                        )}
                      </div>
                      <span>{member.user.username}</span>
                    </li>
                  );
                })
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
            iconUrl={
              memberIcons.find((icon) => icon.id === selectedMember.user.id)
                ?.icon || null
            }
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

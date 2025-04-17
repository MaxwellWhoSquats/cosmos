"use client";
import React, { useEffect, useRef, useState } from "react";
import { ShootingStars } from "../components/ui/ShootingStars";
import { StarsBackground } from "../components/ui/StarsBackground";
import { useAmplifyAuthenticatedUser } from "../hooks/useAmplifyAuthenticatedUser";
import { client } from "../utils/amplifyClient";
import gsap from "gsap";
import { AnimateWord } from "../components/ui/AnimateWord";
import { CornerIcon } from "../components/Icons/CornerIcon";
import { cn } from "@/lib/utils";
import { PopUpAddFriend, PopUpFriendRequest } from "../components/PopUps";

const Home = () => {
  const { dbUser: user, loading } = useAmplifyAuthenticatedUser();
  const [username, setUsername] = useState<string>("");
  const [friendRequestSenderUsernames, setFriendRequestSenderUsernames] =
    useState<string[]>([]);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [showAddFriendPopUp, setShowAddFriendPopUp] = useState<boolean>(false);
  const [showFriendRequestsPopUp, setShowFriendRequestsPopUp] =
    useState<boolean>(false);

  const contentRef = useRef<HTMLDivElement | null>(null);
  const dashboardRef = useRef<HTMLDivElement | null>(null);
  const addFriendPopUpRef = useRef<HTMLDivElement | null>(null);
  const friendRequestsPopUpRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);

  // Make sure everything is loaded before starting animations
  useEffect(() => {
    if (!loading && user) {
      setUsername(user.username);
      setIsReady(true);
      getUserFriendRequests();
    }
  }, [loading, user]);

  // Homepage animations
  useEffect(() => {
    if (isReady && contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { scale: 0.98, opacity: 0, y: 10 },
        { scale: 1, opacity: 1, y: 0, duration: 1.2, ease: "power2.out" }
      );
      gsap.fromTo(
        dashboardRef.current,
        { scale: 0.8, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          delay: 1.2,
          duration: 0.6,
          ease: "power2.out",
        }
      );
    }
  }, [isReady]);

  // Animate "Add Friend" popup in
  useEffect(() => {
    if (
      showAddFriendPopUp &&
      addFriendPopUpRef.current &&
      backdropRef.current
    ) {
      animatePopUp(addFriendPopUpRef).open();
    }
  }, [showAddFriendPopUp]);

  // Animate "Add Friend" popup out
  const closeAddFriendPopUp = () => {
    if (addFriendPopUpRef.current && backdropRef.current) {
      animatePopUp(addFriendPopUpRef).close();
    } else {
      setShowAddFriendPopUp(false);
    }
  };

  // Animate "Friend Requets" popup in
  useEffect(() => {
    if (
      showFriendRequestsPopUp &&
      friendRequestsPopUpRef.current &&
      backdropRef.current
    ) {
      animatePopUp(friendRequestsPopUpRef).open();
    }
  }, [showFriendRequestsPopUp]);

  // Animate "Friend Requests" popup out
  const closeFriendRequestsPopUp = () => {
    if (friendRequestsPopUpRef.current && backdropRef.current) {
      animatePopUp(friendRequestsPopUpRef).close();
    } else {
      setShowFriendRequestsPopUp(false);
    }
  };

  const animatePopUp = (ref: any) => {
    function open() {
      gsap.fromTo(
        ref.current,
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" }
      );
      gsap.fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 0.5, duration: 0.3 }
      );
    }

    function close() {
      gsap.to(ref.current, {
        scale: 0.95,
        opacity: 0,
        duration: 0.2,
        ease: "power2.in",
      });
      gsap.to(backdropRef.current, {
        opacity: 0,
        duration: 0.2,
        onComplete: () =>
          ref === addFriendPopUpRef
            ? setShowAddFriendPopUp(false)
            : setShowFriendRequestsPopUp(false),
      });
    }

    return { open, close };
  };

  const getUserFriendRequests = async () => {
    try {
      // Get all friend requests for this user
      const { data: friendRequests, errors: errorGetFriendRequests } =
        await client.models.Friendship.list({
          filter: { friendId: { eq: user?.id } },
        });

      if (errorGetFriendRequests) {
        console.error(
          "Error getting friend requests: ",
          errorGetFriendRequests
        );
        return;
      }

      // Get the usernames of the friend request senders
      const senderUsernames = friendRequests
        .map((record) => record.senderUsername)
        .filter((name): name is string => name !== null && name !== undefined);

      if (senderUsernames.length > 0) {
        setFriendRequestSenderUsernames(senderUsernames);
      }
    } catch (error) {
      console.error("Unknown Error: ", error);
    }
  };

  return (
    <>
      <div
        ref={contentRef}
        style={{ opacity: 0 }}
        className="min-w-full min-h-full bg-base-300 flex flex-col rounded-md p-6"
      >
        <h2 className="text-4xl font-medium bg-clip-text text-transparent bg-gradient-to-b from-slate-600 via-slate-400 to-slate-300">
          <AnimateWord word={`@${username}`} />
        </h2>
        <main
          className="m-6 flex flex-1 border border-slate-800 z-10"
          ref={dashboardRef}
        >
          <div
            className={cn(
              "absolute inset-0",
              "[background-size:40px_40px]",
              "[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]"
            )}
          >
            <div
              id="vignette"
              className="absolute inset-0 bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_50%,black)]"
            />
          </div>
          <aside className="flex-[1] z-50 m-4 rounded space-x-2 ">
            <button
              className="btn btn-sm btn-soft btn-accent"
              onClick={() => setShowAddFriendPopUp(true)}
            >
              Add Friend
            </button>
            <button
              className="relative btn btn-sm btn-soft btn-primary"
              onClick={() => setShowFriendRequestsPopUp(true)}
            >
              <p>Friend Requests</p>
              {friendRequestSenderUsernames.length > 0 && (
                <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                  {friendRequestSenderUsernames.length}
                </span>
              )}
            </button>
          </aside>
          <section className="flex-[3] z-50 m-4 rounded"></section>
          <CornerIcon className="absolute h-6 w-6 -top-3 -left-3 dark:text-white text-black" />
          <CornerIcon className="absolute h-6 w-6 -bottom-3 -left-3 dark:text-white text-black" />
          <CornerIcon className="absolute h-6 w-6 -top-3 -right-3 dark:text-white text-black" />
          <CornerIcon className="absolute h-6 w-6 -bottom-3 -right-3 dark:text-white text-black" />
        </main>
        <ShootingStars minDelay={2000} maxDelay={4000} />
        <StarsBackground starDensity={0.0004} />
      </div>
      {showAddFriendPopUp && (
        <>
          <div
            ref={backdropRef}
            className="fixed inset-0 bg-black"
            onClick={closeAddFriendPopUp}
          ></div>
          <div
            ref={addFriendPopUpRef}
            className="fixed z-60 bg-base-200 p-6 rounded-xl shadow-xl w-[90%] max-w-md top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <PopUpAddFriend closePopUp={closeAddFriendPopUp} />
          </div>
        </>
      )}
      {showFriendRequestsPopUp && (
        <>
          <div
            ref={backdropRef}
            className="fixed inset-0 bg-black"
            onClick={closeFriendRequestsPopUp}
          ></div>
          <div
            ref={friendRequestsPopUpRef}
            className="fixed z-60 bg-base-200 p-6 rounded-xl shadow-xl w-[90%] max-w-md top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <PopUpFriendRequest
              closePopUp={closeFriendRequestsPopUp}
              friendRequests={friendRequestSenderUsernames}
            />
          </div>
        </>
      )}
    </>
  );
};

export default Home;

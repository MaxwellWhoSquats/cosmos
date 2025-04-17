"use client";
import { useAmplifyAuthenticatedUser } from "@/src/hooks/useAmplifyAuthenticatedUser";
import { client } from "@/src/utils/amplifyClient";
import React, { useState } from "react";

interface PopUpAddFriendProps {
  closePopUp: () => void;
}

interface PopUpFriendRequestProps {
  closePopUp: () => void;
  friendRequests?: string[];
}

export const PopUpAddFriend = ({ closePopUp }: PopUpAddFriendProps) => {
  const { dbUser: user, loading } = useAmplifyAuthenticatedUser();
  const [friendUsername, setFriendUsername] = useState("");

  const handleClosePopUp = () => {
    closePopUp();
  };

  const addFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      console.error("No user authenticated");
      return;
    }
    if (!friendUsername.trim().toLowerCase()) {
      return;
    }

    try {
      // Query User model to find the friend by username
      const { data: theFriend, errors: errorFetchFriendsByUsername } =
        await client.models.User.list({
          filter: { username: { eq: friendUsername.trim() } },
        });

      if (errorFetchFriendsByUsername) {
        console.error("Error fetching user:" + errorFetchFriendsByUsername);
        return;
      }

      if (!theFriend || theFriend.length === 0) {
        console.log("No user by that name!");
        return;
      }

      // Make Typescript happy by ensuring friendId is not null
      const friend = theFriend[0];
      if (!friend?.id) {
        console.error("Friend ID is missing.");
        return;
      }
      const friendId = friend.id;

      // Prevent sending friend request to self
      if (friendId === user.id) {
        console.error("You cannot send a friend request to yourself.");
        return;
      }

      // Create the friend request
      const { data: friendRequest, errors: errorCreateFriendRequest } =
        await client.models.Friendship.create({
          userId: user.id,
          senderUsername: user?.username,
          friendId,
          status: "PENDING",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

      if (errorCreateFriendRequest) {
        console.error(errorCreateFriendRequest);
        return;
      }

      if (friendRequest) {
        setFriendUsername("");
        closePopUp();
        console.log(
          `From: ${friendRequest.userId}... To: ${friendRequest.friendId}`
        );
      }
    } catch (error) {
      console.error("Unknown Error" + error);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold mb-4">Add a Friend</h2>
      <form onSubmit={addFriend}>
        <input
          type="text"
          placeholder="Friend's Username"
          className="input input-bordered w-full mb-4"
          value={friendUsername}
          onChange={(e) => {
            setFriendUsername(e.target.value);
          }}
        />
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleClosePopUp}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-secondary btn-sm"
            disabled={loading || !friendUsername.trim()}
          >
            Send Request
          </button>
        </div>
      </form>
    </div>
  );
};

export const PopUpFriendRequest = ({
  closePopUp,
  friendRequests,
}: PopUpFriendRequestProps) => {
  const handleClosePopUp = () => {
    closePopUp();
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold mb-4">Friend Requests</h2>
      {friendRequests?.map((username, index) => (
        <div key={index} className="flex">
          {username}
        </div>
      ))}
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={handleClosePopUp}
        >
          Close
        </button>
      </div>
    </div>
  );
};

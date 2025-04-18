"use client";
import { useAmplifyAuthenticatedUser } from "@/src/hooks/useAmplifyAuthenticatedUser";
import { client } from "@/src/utils/amplifyClient";
import React, { useState } from "react";

interface PopUpAddFriendProps {
  closePopUp: () => void;
}

interface PopUpFriendRequestProps {
  closePopUp: () => void;
  friendRequestSenderUserData?: [
    string | null, // friend request Id
    string | null, // userId of sender
    string | null, // username of sender
    string | null, // s3 icon url of sender
    string | null, // status
  ][];
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
  friendRequestSenderUserData: friendRequestSenderData,
}: PopUpFriendRequestProps) => {
  const [friendRequestSenderDataState, setFriendRequestSenderDataState] =
    useState(friendRequestSenderData || []);

  const handleClosePopUp = () => {
    closePopUp();
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      // Update the friendship status to ACCEPTED
      const { data: updatedFriendRequest, errors } =
        await client.models.Friendship.update({
          id: requestId,
          status: "ACCEPTED",
          updatedAt: new Date().toISOString(),
        });

      if (errors) {
        console.error("Error updating friend request:", errors);
        return;
      }

      console.log("Friend request accepted:", updatedFriendRequest);
      setFriendRequestSenderDataState((prevData) =>
        prevData.filter(([id]) => id !== requestId)
      );
    } catch (error) {
      console.error("Unknown Error: " + error);
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    try {
      // Delete the friendship
      const { data: updatedFriendRequest, errors } =
        await client.models.Friendship.delete({
          id: requestId,
        });

      if (errors) {
        console.error(errors);
        return;
      }

      console.log("Friend request rejected:", updatedFriendRequest);
      setFriendRequestSenderDataState((prevData) =>
        prevData.filter(([id]) => id !== requestId)
      );
    } catch (error) {
      console.error("Error rejecting friend request:", error);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold mb-4">Friend Requests</h2>
      {friendRequestSenderDataState &&
      friendRequestSenderDataState.length > 0 ? (
        friendRequestSenderDataState.map(
          ([requestId, senderId, username, iconS3Url, status]) => {
            if (!requestId || status !== "PENDING") return null;

            return (
              <div
                key={requestId}
                className="flex items-center bg-midnight p-2 w-full rounded text-white space-x-4"
              >
                {iconS3Url ? (
                  <div className="avatar">
                    <div className="w-7 rounded-full">
                      <img src={iconS3Url} alt="Icon" />
                    </div>
                  </div>
                ) : (
                  <div className="avatar">
                    <div className="skeleton w-7 shrink-0 rounded-full"></div>
                  </div>
                )}
                {/* Username */}
                <span className="flex-1">{username || "Unknown User"}</span>
                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    type="button"
                    className="btn btn-success btn-xs"
                    onClick={() => acceptFriendRequest(requestId)}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="btn btn-error btn-xs"
                    onClick={() => rejectFriendRequest(requestId)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            );
          }
        )
      ) : (
        <p className="text-gray-400">No friend requests at this time.</p>
      )}
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

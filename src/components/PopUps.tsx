"use client";
import { useAmplifyAuthenticatedUser } from "@/src/hooks/useAmplifyAuthenticatedUser";
import { client } from "@/src/utils/amplifyClient";
import React, { useState } from "react";
import { deleteServerMember } from "../app/servers/services/serverServices";
import { downloadData } from "aws-amplify/storage";
import { FileUploader } from "@aws-amplify/ui-react-storage";
import "@aws-amplify/ui-react/styles.css";

export interface FriendRelevantData {
  requestId: string | null; // friend request Id
  senderId: string | null; // userId of sender
  senderUsername: string | null; // username of sender
  iconS3Url?: string | null; // s3 icon url of sender
  status: string | null; // status
}

interface PopUpAddFriendProps {
  closePopUp: () => void;
}

interface PopUpFriendRequestProps {
  closePopUp: () => void;
  friendRequestSenderUserData?: FriendRelevantData[];
}

interface PopUpAddServerMemberProps {
  closePopUp: () => void;
  serverId: string;
  onAdd: (newMember: ServerMember) => void;
}

interface PopUpServerMemberActionsProps {
  member: ServerMember;
  closePopUp: () => void;
  onDelete: () => void;
}

interface PopUpCreateServerProps {
  closePopUp: () => void;
  onServerCreated: () => void;
}

interface PopUpAddChannelProps {
  serverId: string;
  channelType: "TEXT" | "VOICE";
  closePopUp: () => void;
  onAdd: (newChannel: Channel) => void;
}

export const PopUpAddFriend = ({ closePopUp }: PopUpAddFriendProps) => {
  const { dbUser: user, loading } = useAmplifyAuthenticatedUser();
  const [friendUsername, setFriendUsername] = useState("");
  const [message, setMessage] = useState("");

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
        setMessage("No user by that name!");
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
        setMessage("You cannot send a friend request to yourself.");
        return;
      }

      // Check if users are already friends
      const { data: existingFriendship, errors: errorFetchFriendship } =
        await client.models.Friendship.list({
          filter: {
            or: [
              { userId: { eq: user.id }, friendId: { eq: friendId } },
              { userId: { eq: friendId }, friendId: { eq: user.id } },
            ],
            and: [
              {
                or: [
                  { status: { eq: "ACCEPTED" } },
                  { status: { eq: "PENDING" } },
                ],
              },
            ],
          },
        });

      if (errorFetchFriendship) {
        console.error(
          "Error checking existing friendship:",
          errorFetchFriendship
        );
        return;
      }

      if (existingFriendship && existingFriendship.length > 0) {
        setMessage("You are already friends with this user.");
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
        {message && <p className="font-bold text-red-500 mb-4">{message}</p>}
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
  friendRequestSenderUserData,
}: PopUpFriendRequestProps) => {
  const { dbUser: user } = useAmplifyAuthenticatedUser();
  const [friendRequestSenderDataState, setFriendRequestSenderDataState] =
    useState<FriendRelevantData[]>(friendRequestSenderUserData || []);

  const handleClosePopUp = () => {
    closePopUp();
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      // Update the friendship status to ACCEPTED
      const { data: updatedFriendRequest, errors: errorUpdateFriendRequest } =
        await client.models.Friendship.update({
          id: requestId,
          status: "ACCEPTED",
          updatedAt: new Date().toISOString(),
        });

      if (errorUpdateFriendRequest) {
        console.error(
          "Error updating friend request:",
          errorUpdateFriendRequest
        );
        return;
      }

      // Find the specific friend request to get senderId and senderUsername
      const friendRequest = friendRequestSenderDataState.find(
        (request) => request.requestId === requestId
      );
      if (!friendRequest) {
        console.error("Friend request not found for ID:", requestId);
        return;
      }

      const { senderId } = friendRequest;

      // Make TypeScript happy
      if (!user || !senderId) {
        console.error("User data is missing, cannot create reverse friendship");
        return;
      }

      // If user accepts a friend request, create the reverse friendship.
      const {
        data: reverseFriendRequest,
        errors: errorCreateReverseFriendRequest,
      } = await client.models.Friendship.create({
        userId: user.id,
        senderUsername: user.username,
        friendId: senderId,
        status: "ACCEPTED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (errorCreateReverseFriendRequest) {
        console.error(
          "Error creating reverse friend request:",
          errorCreateReverseFriendRequest
        );
        return;
      }

      console.log("Friend request accepted:", updatedFriendRequest);
      console.log("Reverse friend request created:", reverseFriendRequest);

      setFriendRequestSenderDataState((prevData) =>
        prevData.filter((request) => request.requestId !== requestId)
      );
      window.location.reload();
    } catch (error) {
      console.error("Unknown Error: " + error);
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    try {
      // Delete the friendship
      const { data, errors } = await client.models.Friendship.delete({
        id: requestId,
      });

      if (errors) {
        console.error(errors);
        return;
      }

      console.log("Friend request rejected");
      setFriendRequestSenderDataState((prevData) =>
        prevData.filter((request) => request.requestId !== requestId)
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
        friendRequestSenderDataState.map((request) => {
          if (!request.requestId || request.status !== "PENDING") return null;

          return (
            <div
              key={request.requestId}
              className="flex items-center bg-midnight p-2 w-full rounded text-white space-x-4"
            >
              {request.iconS3Url ? (
                <div className="avatar">
                  <div className="w-7 rounded-full">
                    <img src={request.iconS3Url} alt="Icon" />
                  </div>
                </div>
              ) : (
                <div className="avatar">
                  <div className="skeleton w-7 shrink-0 rounded-full"></div>
                </div>
              )}
              {/* Username */}
              <span className="flex-1">
                {request.senderUsername || "Unknown User"}
              </span>
              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  type="button"
                  className="btn btn-success btn-xs"
                  onClick={() => acceptFriendRequest(request.requestId!)}
                >
                  Accept
                </button>
                <button
                  type="button"
                  className="btn btn-error btn-xs"
                  onClick={() => rejectFriendRequest(request.requestId!)}
                >
                  Reject
                </button>
              </div>
            </div>
          );
        })
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

export const PopUpCreateServer = ({
  closePopUp,
  onServerCreated,
}: PopUpCreateServerProps) => {
  const { dbUser: user, loading } = useAmplifyAuthenticatedUser();
  const [serverName, setServerName] = useState<string>("");
  const [iconS3Path, setIconS3Path] = useState<string>();

  const handleClosePopUp = () => {
    closePopUp();
  };

  const handleIconUploadSuccess = ({ key }: { key?: string }) => {
    const path = key;
    setIconS3Path(path);
  };

  const createServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      console.error("No user authenticated");
      return;
    }
    if (!serverName.trim() || !iconS3Path) {
      console.error("Server name and Icon are required");
      return;
    }

    try {
      // Create the server
      const { data: theServer, errors: errorCreateServerError } =
        await client.models.Server.create({
          name: serverName.trim(),
          ownerId: user.id,
          icon: iconS3Path,
        });

      if (errorCreateServerError) {
        console.error("Server creation errors: " + errorCreateServerError);
        return;
      }

      if (theServer) {
        // Automatically add the creator as a member
        const { data, errors: errorAddUserToServer } =
          await client.models.ServerMember.create({
            userId: user.id,
            serverId: theServer.id,
            role: "CREATOR",
          });
        if (errorAddUserToServer) {
          console.error("Membership creation errors:", errorAddUserToServer);
        }

        // Create default channels for the server
        try {
          // Create default text channel
          const { data: defaultTextChannel, errors: errorDefaultText } =
            await client.models.Channel.create({
              name: "General",
              type: "TEXT",
              serverId: theServer.id,
            });

          // Create default voice channel
          const { data: defaultVoiceChannel, errors: errorDefaultVoice } =
            await client.models.Channel.create({
              name: "General",
              type: "VOICE",
              serverId: theServer.id,
            });

          if (errorDefaultText) {
            console.error(
              "Error creating default text channel:",
              errorDefaultText
            );
            return;
          }

          if (errorDefaultVoice) {
            console.error(
              "Error creating default voice channel:",
              errorDefaultVoice
            );
            return;
          }
        } catch (error) {
          console.error("Unknown Error: " + error);
        }

        setServerName("");
        closePopUp();
        onServerCreated();
      }
    } catch (error) {
      console.error("Error creating server:", error);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold mb-4">Create a Server</h2>
      <section className="mb-4">
        <FileUploader
          acceptedFileTypes={[".jpeg", ".jpg", ".png"]}
          path="serverIcons/"
          autoUpload={false}
          maxFileCount={1}
          isResumable
          onUploadSuccess={handleIconUploadSuccess}
        />
      </section>
      <form onSubmit={createServer}>
        <input
          type="text"
          placeholder="Server Name"
          className="input input-bordered w-full mb-4"
          value={serverName}
          onChange={(e) => setServerName(e.target.value)}
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
            disabled={loading || !serverName.trim()}
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
};

export const PopUpAddServerMember = ({
  closePopUp,
  serverId,
  onAdd,
}: PopUpAddServerMemberProps) => {
  const { dbUser: user, loading } = useAmplifyAuthenticatedUser();
  const [username, setUsername] = useState("");

  const handleClosePopUp = () => {
    closePopUp();
  };

  const addServerMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      console.error("No user authenticated");
      return;
    }

    if (!username.trim()) {
      return;
    }

    try {
      // Query User model to find the friend by username
      const { data: users, errors: errorFetchUser } =
        await client.models.User.list({
          filter: { username: { eq: username.trim() } },
        });

      if (errorFetchUser) {
        console.error(errorFetchUser);
        return;
      }

      if (!users || users.length === 0) {
        console.log("No users with that username");
        return;
      }

      const friend = users[0];
      if (!friend?.id) {
        console.error("Friend ID is missing.");
        return;
      }

      const friendId = friend.id;

      // Prevent adding self to the server
      if (friendId === user.id) {
        console.error("You cannot add yourself to the server.");
        return;
      }

      // Check if the user is already a member of the server
      const { data: serverMember, errors: serverMemberErrors } =
        await client.models.ServerMember.list({
          filter: {
            userId: { eq: friendId },
            serverId: { eq: serverId },
          },
        });

      if (serverMemberErrors) {
        console.error("Error checking server membership:", serverMemberErrors);
        return;
      }

      if (serverMember.length > 0) {
        console.log("User is already a member of the server");
        return;
      }

      // Create the server member
      const { data: theServerMember, errors: errorAddUserToServer } =
        await client.models.ServerMember.create({
          userId: friendId,
          serverId: serverId,
        });

      if (errorAddUserToServer) {
        console.error("Error adding server member:", errorAddUserToServer);
        return;
      }

      if (theServerMember && friend && friend.username) {
        console.log(
          `Successfully created new server member: ${theServerMember.userId}`
        );
        // Fetch the icon for the new member
        let theIcon = null;
        if (friend.icon) {
          try {
            const { body } = await downloadData({ path: friend.icon }).result;
            theIcon = URL.createObjectURL(await body.blob());
          } catch (error) {
            console.error("Failed to download icon:", error);
          }
        }
        // Construct the ServerMember object
        if (friend && friend.username && theIcon) {
          const newMember: ServerMember = {
            id: theServerMember.id,
            serverId: serverId,
            user: {
              id: friend.id,
              username: friend.username,
              icon: theIcon,
            },
            role: "MEMBER",
          };
          // Call onAdd to update parent state
          onAdd(newMember);
          setUsername("");
        } else {
          console.log("Skipping onAdd due to missing username or icon");
        }
      }
    } catch (error) {
      console.error("Unknown error adding server member:", error);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold mb-4">Add Friend to Server</h2>
      <form onSubmit={addServerMember}>
        <input
          type="text"
          placeholder="Friend's Username"
          className="input input-bordered w-full mb-4"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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
            disabled={loading || !username.trim()}
          >
            Add Member
          </button>
        </div>
      </form>
    </div>
  );
};

export const PopUpServerMemberActions = ({
  member,
  closePopUp,
  onDelete,
}: PopUpServerMemberActionsProps) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setError(null);
      await deleteServerMember(member.id);
      onDelete();
      closePopUp();
    } catch (error: any) {
      setError(error.message || "Failed to delete member");
    }
  };

  const handleClosePopUp = () => {
    closePopUp();
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold mb-4">Member Details</h2>
      <div className="flex items-center bg-midnight p-2 w-full rounded text-white space-x-4">
        <div className="avatar">
          <div className="w-7 rounded-full">
            {member.user.icon ? (
              <img
                src={member.user.icon}
                alt={`${member.user.username}'s icon`}
              />
            ) : (
              <div className="skeleton w-7 shrink-0 rounded-full" />
            )}
          </div>
        </div>
        <div className="flex-1">
          <span className="font-bold">{member.user.username}</span>
        </div>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex flex-col space-y-2">
        {confirmDelete ? (
          <div className="flex flex-col space-y-2">
            <p className="text-sm text-red-400">
              Are you sure you want to remove {member.user.username}?
            </p>
            <div className="flex justify-end space-x-2">
              <button className="btn btn-sm btn-error" onClick={handleDelete}>
                Confirm
              </button>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end space-x-2">
            <button
              className="btn btn-sm btn-error"
              onClick={() => setConfirmDelete(true)}
              disabled={member.role === "CREATOR"} // Disable button for CREATOR
            >
              Remove Member
            </button>
            <button
              className="btn btn-sm btn-outline"
              onClick={handleClosePopUp}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const PopUpAddChannel = ({
  serverId,
  channelType,
  closePopUp,
  onAdd,
}: PopUpAddChannelProps) => {
  const { dbUser: user, loading } = useAmplifyAuthenticatedUser();
  const [channelName, setChannelName] = useState("");
  const [error, setError] = useState("");

  const handleClosePopUp = () => {
    closePopUp();
  };

  const addChannel = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      console.error("No user authenticated");
      setError("User not authenticated");
      return;
    }

    if (!channelName.trim()) {
      setError("Channel name is required");
      return;
    }

    try {
      // Create the channel
      const { data: newChannel, errors: channelErrors } =
        await client.models.Channel.create({
          name: channelName.trim(),
          type: channelType,
          serverId,
        });

      if (channelErrors) {
        console.error("Error creating channel:", channelErrors);
        setError("Failed to create channel");
        return;
      }

      if (newChannel) {
        const channel: Channel = {
          id: newChannel.id,
          serverId,
          name: newChannel.name,
          type: channelType,
        };
        onAdd(channel);
        setChannelName("");
        closePopUp();
      }
    } catch (error) {
      console.error("Unknown error creating channel:", error);
      setError("An unexpected error occurred");
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold mb-4">Create Channel</h2>
      <form onSubmit={addChannel}>
        <input
          type="text"
          placeholder="Channel Name"
          className="input input-bordered w-full mb-4"
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
        />
        {error && <p className="font-bold text-red-500 mb-4">{error}</p>}
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
            disabled={loading || !channelName.trim()}
          >
            Create Channel
          </button>
        </div>
      </form>
    </div>
  );
};

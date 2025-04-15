"use client";
import { useAmplifyAuthenticatedUser } from "@/src/hooks/useAmplifyAuthenticatedUser";
import { client } from "@/src/utils/amplifyClient";
import React, { useState } from "react";

interface CreateServerProps {
  closePopUp: () => void;
  onServerCreated: () => void;
}

const CreateServerPopUp = ({
  closePopUp,
  onServerCreated,
}: CreateServerProps) => {
  const { dbUser: user, loading } = useAmplifyAuthenticatedUser();
  const [serverName, setServerName] = useState<string>("");

  const handleClosePopUp = () => {
    closePopUp();
  };

  const createServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      console.error("No user authenticated");
      return;
    }
    if (!serverName.trim()) {
      console.error("Server name is required");
      return;
    }

    try {
      // Create the server
      const { data: theServer, errors: errorCreateServerError } =
        await client.models.Server.create({
          name: serverName.trim(),
          ownerId: user.id,
        });

      if (errorCreateServerError) {
        console.error("Server creation errors: " + errorCreateServerError);
        return;
      }

      if (theServer) {
        // Automatically add the creator as a member
        const { data: member, errors: errorAddUserToServer } =
          await client.models.ServerMember.create({
            userId: user.id,
            serverId: theServer.id,
          });
        if (errorAddUserToServer) {
          console.error("Membership creation errors:", errorAddUserToServer);
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
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Create a Server</h2>
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

export default CreateServerPopUp;

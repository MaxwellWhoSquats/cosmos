import { client } from "@/src/utils/amplifyClient";
import { downloadData } from "aws-amplify/storage";

export const getServerInfo = async (serverId: string) => {
  let serverName = "";
  let serverMembers: ServerMember[] = [];
  let serverChannels: Channel[] = [];

  try {
    // Fetch the server info by ID
    const { data: serverInfo, errors: errorGetServerInfo } = await client.models.Server.get({
      id: serverId,
    });

    if (errorGetServerInfo) {
      console.error("Errors fetching server info:", errorGetServerInfo);
    }

    if (serverInfo) {
      serverName = serverInfo.name; // Grab the server name

      // Fetch all channels listed on the Server
      const { data: theServerChannels, errors: errorGetServerChannels } = await client.models.Channel.list({
        filter: { serverId: { eq: serverId } },
      });

      if (errorGetServerChannels) {
        console.error("Errors fetching server channels:" + errorGetServerChannels)
      }

      if (theServerChannels) {
        // Fetch basic channel data for each Channel by querying CHANNEL MODEL
        const channelPromises = theServerChannels.map(async (channel) => {
          const { data: serverChannelData, errors: errorGetServerChannelData } = await client.models.Channel.get({
            id: channel.id,
          });

          if (errorGetServerChannelData) {
            console.error(`Error fetching channel ${channel.id}:`, errorGetServerChannelData);
            return null;
          }

          if (serverChannelData) {
            return {
              id: channel.id,
              serverId: channel.serverId,
              name: channel.name,
              type: channel.type,
            };
          }

          return null;
        });

        const resolvedChannels = await Promise.all(channelPromises);
        serverChannels = resolvedChannels.filter((channel): channel is Channel => channel !== null);
      }


      // Fetch all the members listed on the Server
      const { data: theServerMembers, errors: errorGetServerMembers } = await client.models.ServerMember.list({
        filter: { serverId: { eq: serverId } },
      });

      if (errorGetServerMembers) {
        console.error("Errors fetching server members:", errorGetServerMembers);
      }

      if (theServerMembers) {
        // Fetch user data for each ServerMember by querying USER MODEL
        const memberPromises = theServerMembers.map(async (member) => {
          const { data: serverMemberUserData, errors: errorGetServerMemberUserData } = await client.models.User.get({
            id: member.userId,
          });

          if (errorGetServerMemberUserData) {
            console.error(`Error fetching user ${member.userId}:`, errorGetServerMemberUserData);
            return null;
          }

          if (serverMemberUserData) {
            return {
              id: member.id,
              serverId: member.serverId,
              user: {
                id: serverMemberUserData.id,
                username: serverMemberUserData.username,
                icon: serverMemberUserData.icon,
              },
              role: member.role,
            };
          }

          return null;
        });

        const resolvedMembers = await Promise.all(memberPromises);
        serverMembers = resolvedMembers.filter((member): member is ServerMember => member !== null);
      }
    }
  } catch (error) {
    console.error("Unknown Error" + error);
  }

  return { serverName, serverMembers, serverChannels };
};

export const downloadServerMemberIcons = async (serverId: string) => {
  const { serverMembers } = await getServerInfo(serverId);
  const members: { id: string; icon: string }[] = [];

  for (let member of serverMembers) {
    let icon = null;
    if (member.user.icon) {
      try {
        const { body } = await downloadData({ path: member.user.icon })
          .result;
        icon = URL.createObjectURL(await body.blob());
      } catch (error) {
        console.error("Failed to download icon:", error);
      }
    }
    members.push({
      id: member.user.id,
      icon: icon!
    });
  }
  
  return members;
};

export const deleteServerMember = async (memberId: string) => {
  try {
    // Fetch the ServerMember to check their role
    const { data: member, errors: fetchErrors } = await client.models.ServerMember.get({ id: memberId });
    
    if (fetchErrors) {
      throw new Error("Failed to fetch server member: " + fetchErrors);
    }
    
    if (!member) {
      throw new Error("Server member not found");
    }
    
    // Prevent deletion if the role is CREATOR
    if (member.role === "CREATOR") {
      throw new Error("Cannot delete server member with CREATOR role");
    }
    
    // Proceed with deletion otherwise
    const { data, errors } = await client.models.ServerMember.delete({
      id: memberId,
    });
    
    if (errors) {
      throw new Error("Failed to delete server member: " + errors);
    }
    
    if (!data) {
      throw new Error("Server member not found");
    }
    
    console.log(`Successfully deleted server member: ${memberId}`);
    return true; // Indicate success
  } catch (error) {
    console.error("Error deleting server member:", error);
    throw error; // Re-throw to let the caller handle it
  }
};
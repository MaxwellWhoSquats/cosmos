interface ServerMember {
  id: string;
  serverId: string;
  user: {
    id: string;
    username: string;
    icon: string;
  };
  role: "CREATOR" | "ADMIN" | "MEMBER";
}

interface RelevantUserData {
  username: string;
  icon?: string | null;
}

interface Channel {
  id: string;
  serverId: string;
  name: string;
  type: "TEXT" | "VOICE";
}

interface Media {
  id: string;
  content: string;
  userId: string;
  channelId: string;
}

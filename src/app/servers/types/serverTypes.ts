interface ServerMember {
  id: string;
  serverId: string;
  user: {
    id: string;
    username: string;
    icon: string;
  };
}
  
interface Channel {
  id: string;
  serverId: string;
  name: string;
  type: "TEXT" | "VOICE";
}

interface Message {
  id: string;
  content: string;
  userId: string;
  channelId: string;
}

interface Media {
  id: string;
  content: string;
  userId: string;
  channelId: string;
}

interface MemberIcon {
  id: string;
  icon: string | null;
}
import React, { useState, useEffect, useRef } from "react";
import { client } from "../utils/amplifyClient";

interface DMProps {
  conversationId: string;
  senderUserId: string;
  senderUsername: string;
  senderIcon?: string | null;
  receiverUsername?: string | null | undefined;
  receiverId?: string | null;
  receiverIcon?: string | null;
}

interface DirectMessage {
  id: string;
  senderId: string;
  sender: { username: string; icon?: string | null };
  conversationId: string;
  content: string;
  createdAt: string;
}

const DM = ({
  conversationId,
  senderUserId,
  senderUsername,
  senderIcon,
  receiverUsername,
  receiverId,
  receiverIcon,
}: DMProps) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messageThreadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAndSetMessages();
  }, [conversationId, senderUserId, receiverId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messageThreadRef.current) {
      messageThreadRef.current.scrollTop =
        messageThreadRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch messages from both conversation directions (<==>) and update the state
  const fetchAndSetMessages = async () => {
    const allMessages = await fetchMessagesBetweenUsers();
    const formattedMessages = await formatMessages(allMessages);
    setMessages(
      formattedMessages.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    );
  };

  // Fetch messages from both the user's and friend's conversations
  const fetchMessagesBetweenUsers = async () => {
    try {
      const { data: directMessages, errors: msgErrors } =
        await client.models.DirectMessage.list({
          filter: { conversationId: { eq: conversationId } },
        });
      if (msgErrors)
        throw new Error(`Error fetching direct messages: ${msgErrors}`);

      let reverseMessages: any[] = [];
      if (receiverId) {
        const { data: reverseConversations, errors: convErrors } =
          await client.models.Conversation.list({
            filter: {
              senderId: { eq: receiverId },
              receiverId: { eq: senderUserId },
            },
          });
        if (convErrors)
          console.error("Error fetching reverse conversation:", convErrors);
        else if (
          reverseConversations.length > 0 &&
          reverseConversations[0].id
        ) {
          const { data: reverseMsgs, errors: reverseMsgErrors } =
            await client.models.DirectMessage.list({
              filter: { conversationId: { eq: reverseConversations[0].id } },
            });
          if (reverseMsgErrors)
            console.error("Error fetching reverse messages:", reverseMsgErrors);
          else reverseMessages = reverseMsgs;
        }
      }

      return [...directMessages, ...reverseMessages];
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  };

  // Format raw messages with sender details
  const formatMessages = async (
    rawMessages: any[]
  ): Promise<DirectMessage[]> => {
    return Promise.all(
      rawMessages.map(async (msg) => {
        const isSender = msg.senderId === senderUserId;
        const username = isSender
          ? senderUsername
          : receiverUsername || "Unknown";
        const icon = isSender ? senderIcon : receiverIcon;

        return {
          id: msg.id || `${Date.now()}`,
          senderId: msg.senderId || "unknown",
          sender: { username, icon },
          conversationId: msg.conversationId || conversationId,
          content: msg.content || "",
          createdAt: msg.createdAt || new Date().toISOString(),
        };
      })
    );
  };

  // Handle sending a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !receiverId) return;

    try {
      const allowedParticipants = [senderUserId, receiverId];
      const { data: newMsg, errors } = await client.models.DirectMessage.create(
        {
          conversationId,
          senderId: senderUserId,
          content: newMessage,
          createdAt: new Date().toISOString(),
          allowedParticipants,
        }
      );
      if (errors) throw new Error(`Error sending message: ${errors}`);

      const newDirectMessage: DirectMessage = {
        id: newMsg?.id || `${Date.now()}`,
        senderId: senderUserId,
        sender: { username: senderUsername, icon: senderIcon },
        conversationId,
        content: newMessage,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) =>
        [...prev, newDirectMessage].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      );
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div className="p-4 bg-base-200 rounded-t-md border-b border-slate-800">
        <h3 className="text-lg font-semibold text-gray-200">
          Chat with {receiverUsername || "User"}
        </h3>
      </div>
      <section
        id="messageThread"
        ref={messageThreadRef}
        className="overflow-y-auto min-h-[55vh] max-h-[55vh] p-4 flex flex-col" // BUG HERE: fix this to size dynamically to fill parent, without breaking overflow
      >
        <div className="flex flex-col justify-end flex-grow space-y-2">
          {messages.length > 0 ? (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.senderId === senderUserId
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-md flex items-start space-x-2 ${
                    message.senderId === senderUserId
                      ? "bg-accent text-white"
                      : "bg-base-100 text-gray-200"
                  }`}
                >
                  {message.sender.icon ? (
                    <img
                      src={message.sender.icon}
                      alt={`${message.sender.username}'s avatar`}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-500" />
                  )}
                  <div>
                    <p className="text-sm">{message.content}</p>
                    <span className="text-xs text-gray-400">
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center flex-grow">
              <span className="text-gray-400">
                No messages in this conversation!
              </span>
            </div>
          )}
        </div>
      </section>
      <div className="p-4 bg-base-200 rounded-b-md border-t border-slate-800">
        <form
          onSubmit={handleSendMessage}
          className="flex space-x-2 items-center"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 bg-base-100 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button type="submit" className="btn btn-sm btn-accent">
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default DM;

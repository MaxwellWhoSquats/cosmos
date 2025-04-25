"use client";
import { useAmplifyAuthenticatedUser } from "@/src/hooks/useAmplifyAuthenticatedUser";
import { client } from "@/src/utils/amplifyClient";
import React, { useState, useEffect, useRef, memo, useCallback } from "react";
import type { Schema } from "@/amplify/data/resource";
import { useChannelMessages } from "@/src/hooks/useChannelMessages";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";

type MessageType = Schema["Message"]["type"];

interface TextChannelProps {
  channelId: string;
  channelName: string;
  userDataMap: Record<string, RelevantUserData>;
}

// Individual Messages
const MessageItem = memo(
  ({
    message,
    userData,
  }: {
    message: MessageType;
    userData: RelevantUserData | undefined;
  }) => {
    const formattedTimestamp = message.createdAt
      ? new Date(message.createdAt).toLocaleString()
      : "Sending...";

    return (
      <div className="flex items-start space-x-3 py-1 hover:bg-gray-700/30 rounded group">
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mt-1">
          {userData?.icon ? (
            <img
              src={userData.icon}
              alt={`${userData?.username || "User"}'s icon`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-600 rounded-full" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-baseline space-x-2">
            <span className="font-semibold text-white hover:underline cursor-pointer">
              {userData?.username || "Unknown User"}
            </span>
            <span className="text-xs text-gray-400">{formattedTimestamp}</span>
          </div>
          <p className="text-gray-200 whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
      </div>
    );
  }
);

const TextChannel = ({
  channelId,
  channelName,
  userDataMap,
}: TextChannelProps) => {
  const { dbUser: user } = useAmplifyAuthenticatedUser();
  const {
    messages,
    isLoadingInitial,
    isLoadingPrevious,
    error,
    loadPrevious,
    hasNextPage,
  } = useChannelMessages(channelId);

  const [newMessageContent, setNewMessageContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [sendError, setSendError] = useState<string | null>(null);
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const isMountedRef = useRef(false);
  const messagesCountRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    messagesCountRef.current = 0;
    return () => {
      isMountedRef.current = false;
    };
  }, [channelId]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (isLoadingInitial || !isMountedRef.current) return;

    const newMessagesCount = messages.length;

    if (newMessagesCount > messagesCountRef.current && isAtBottom) {
      const timer = setTimeout(() => {
        virtuosoRef.current?.scrollToIndex({
          index: newMessagesCount - 1,
          align: "end",
          behavior: "auto",
        });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [messages, isLoadingInitial, isAtBottom]);

  const virtuosoStartReached = useCallback(async () => {
    if (!hasNextPage || isLoadingPrevious) return;

    await loadPrevious();
  }, [loadPrevious, hasNextPage, isLoadingPrevious]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    const contentToSend = newMessageContent.trim();

    if (!contentToSend || !user || isSending) return;

    setIsSending(true);
    setSendError(null);
    setNewMessageContent("");

    // Create the new message in DynamoDB
    try {
      await client.models.Message.create({
        content: contentToSend,
        channelId: channelId,
        userId: user.id,
      });
    } catch (err: any) {
      console.error("Error sending message:", err);
      setSendError("Failed to send message.");
      setNewMessageContent(contentToSend);
    } finally {
      setIsSending(false);
    }
  };

  // Can send message by pressing "Enter", not only by clicking "Send"
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderLoading = () => {
    return isLoadingPrevious ? (
      <div className="flex justify-center items-center h-12">
        <span className="loading loading-spinner loading-sm text-info"></span>
      </div>
    ) : null;
  };

  return (
    <div className="flex flex-col h-full bg-midnight text-gray-300">
      <header className="flex-shrink-0 px-6 py-3 border-b border-gray-700 shadow-md">
        <h2 className="text-xl font-semibold text-white"># {channelName}</h2>
      </header>
      <div className="flex-1 min-h-0 relative">
        {isLoadingInitial && messages.length === 0 && (
          <div className="absolute inset-0 flex justify-center items-center pointer-events-none z-10">
            <span className="loading loading-spinner loading-lg text-info"></span>
          </div>
        )}
        {error && !isLoadingInitial && (
          <div className="absolute inset-0 flex justify-center items-center text-red-500 p-4 pointer-events-none z-10">
            {error}
          </div>
        )}
        {!isLoadingInitial && messages.length === 0 && !error && (
          <div className="absolute inset-0 flex justify-center items-center text-gray-500 pointer-events-none z-10">
            No messages yet in #{channelName}!
          </div>
        )}
        <Virtuoso
          ref={virtuosoRef}
          style={{ height: "100%" }}
          data={messages}
          startReached={
            hasNextPage && !isLoadingPrevious ? virtuosoStartReached : undefined
          }
          initialTopMostItemIndex={
            messages.length > 0 ? messages.length - 1 : 0
          }
          followOutput="auto"
          atBottomStateChange={setIsAtBottom}
          computeItemKey={(index, item) => item.id}
          itemContent={(index, message) => (
            <div className="px-4">
              <MessageItem
                message={message}
                userData={userDataMap[message.userId]}
              />
            </div>
          )}
          components={{ Header: renderLoading }}
          className="custom-scrollbar"
        />
      </div>
      <footer className="flex-shrink-0 p-4 border-t border-gray-700 bg-midnight">
        {sendError && (
          <p className="text-xs text-red-500 mb-2 text-center">{sendError}</p>
        )}
        <form
          onSubmit={handleSendMessage}
          className="flex items-center space-x-3"
        >
          <input
            type="text"
            value={newMessageContent}
            onChange={(e) => setNewMessageContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${channelName}`}
            className="flex-1 px-4 py-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400 disabled:opacity-60"
            disabled={isSending || !user}
            maxLength={2000}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            disabled={isSending || !newMessageContent.trim()}
          >
            {isSending ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              "Send"
            )}
          </button>
        </form>
      </footer>
    </div>
  );
};

export default TextChannel;

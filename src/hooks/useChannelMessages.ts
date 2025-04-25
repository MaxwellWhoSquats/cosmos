import { useState, useEffect, useCallback, useRef } from "react";
import { client } from "@/src/utils/amplifyClient";
import type { Schema } from "@/amplify/data/resource";

type MessageType = Schema["Message"]["type"];

const MESSAGE_LIMIT = 100;

const sortMessages = (a: MessageType, b: MessageType): number => {
  const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
  if (dateA === dateB) return (a.id ?? "").localeCompare(b.id ?? "");
  return dateA - dateB;
};

export const useChannelMessages = (channelId: string | null) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [nextToken, setNextToken] = useState<string | null | undefined>(undefined);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);
  const channelIdRef = useRef(channelId);

  useEffect(() => {
    channelIdRef.current = channelId;
  }, [channelId]);
  
  // Fetch messages for a channel, handling both initial loads and pagination.
  // Optimizes performance by preventing concurrent fetches, managing pagination tokens, and sorting messages for efficient rendering.
  const fetchMessagesInternal = useCallback(
    async (token: string | null | undefined, isInitialLoad: boolean) => {
      const currentChannelId = channelIdRef.current;

      if (!currentChannelId || isFetchingRef.current) {
        return { fetchedCount: 0, newNextToken: token };
      }
      if (!isInitialLoad && token === null) {
        if(isLoadingPrevious) setIsLoadingPrevious(false);
        return { fetchedCount: 0, newNextToken: null};
      }

      // Mark fetch as in progress and clear any previous errors
      isFetchingRef.current = true;
      setError(null);
      let fetchedCount = 0;
      let apiNextToken: string | null | undefined = token;

      if (isInitialLoad) {
        setIsLoadingInitial(true);
        setMessages([]);
        setNextToken(undefined); // Reset pagination token
      } else {
        setIsLoadingPrevious(true);
      }

      // Fetch messages for the the current channel
      try {
        const response = await client.models.Message.list({
          filter: { channelId: { eq: currentChannelId } },
          limit: MESSAGE_LIMIT,
          nextToken: token,
        });

        if (currentChannelId !== channelIdRef.current) {
          throw new Error("Channel changed during fetch");
        }

        const fetchedMessages = response.data || [];
        fetchedCount = fetchedMessages.length;
        apiNextToken = response.nextToken ?? null;

        if (fetchedCount > 0) {
          setMessages((prevMessages) => {
            if (currentChannelId !== channelIdRef.current) {
              return prevMessages;
            }
            const combined = isInitialLoad ? [...fetchedMessages] : [...fetchedMessages, ...prevMessages];
            const uniqueMessages = Array.from(new Map(combined.map((m) => [m.id, m])).values());
            return uniqueMessages.sort(sortMessages);
          });
        }

        setNextToken(apiNextToken); // Update pagination token

      } catch (error: any) {
          setError(error);
          if (isInitialLoad) setMessages([]);
      } finally {
        if (isInitialLoad) setIsLoadingInitial(false);
        else setIsLoadingPrevious(false);
        isFetchingRef.current = false;
      }
      return { fetchedCount, newNextToken: apiNextToken };
    }, []
  );


  const loadPrevious = useCallback(async () => {
    if (!isLoadingPrevious && nextToken !== null) {
      return await fetchMessagesInternal(nextToken, false);
    }
    return { fetchedCount: 0, newNextToken: nextToken };
  }, [isLoadingPrevious, nextToken, fetchMessagesInternal]);


  // Fetch initial messages when channelId changes
  useEffect(() => {
    fetchMessagesInternal(undefined, true);
  }, [channelId, fetchMessagesInternal]);


  // Set up real-time subscription for new messages
  useEffect(() => {
    const effectChannelId = channelId;
    if (!effectChannelId) {
      return;
    }

    // Subscribe to new messages for the current channel
    const sub = client.models.Message.onCreate({
      filter: { channelId: { eq: effectChannelId } },
    }).subscribe({
      next: (newMessage: MessageType) => {
        // Ignore if channelId has changed or message is invalid
        if (channelIdRef.current !== newMessage.channelId) return;
        if (!newMessage || typeof newMessage !== 'object' || !newMessage.id) return;

        setMessages((prevMessages) => {
          if (prevMessages.some((msg) => msg.id === newMessage.id)) return prevMessages;
          const updatedMessages = [...prevMessages, newMessage];
          return updatedMessages.sort(sortMessages);
        });
      },
      error: (error) => console.error(error),
    });

    return () => {
      sub.unsubscribe();
    };
  }, [channelId]);

  return {
    messages,
    isLoadingInitial,
    isLoadingPrevious,
    error,
    loadPrevious,
    hasNextPage: nextToken !== null && nextToken !== undefined,
  };
};
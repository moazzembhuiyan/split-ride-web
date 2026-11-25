"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { mergeMessages } from "@/lib/chat-messages";
import type { Message } from "@/types/chat.types";
import {
  chatKeys,
  useChatByBooking,
  useCreateChat,
  useMarkChatSeen,
  useMessagesByChatId,
} from "./use-chat";
import { useSocket, useSocketEvent } from "./use-socket";
import { useMe } from "./use-user";

/** Fetches (or lazily creates) the 1:1 chat for a booking, syncs history + live messages. */
export function useRideChat(bookingId: string, otherUserId?: string) {
  const { data: meData } = useMe();
  const myId = meData?.data?._id;
  const { emit } = useSocket();
  const queryClient = useQueryClient();

  const {
    data: chatData,
    isError: chatErrored,
    isSuccess: chatFetched,
    isPending: chatQueryPending,
  } = useChatByBooking(bookingId);
  const createChat = useCreateChat();
  const attemptedCreate = useRef(false);
  const [createdChatId, setCreatedChatId] = useState<string | null>(null);

  const existingChatId = chatData?.data?._id;
  const chatMissing = Boolean(
    bookingId && (chatErrored || (chatFetched && !existingChatId)),
  );
  const chatId = existingChatId ?? createdChatId ?? undefined;

  // biome-ignore lint/correctness/useExhaustiveDependencies: createChat mutation identity is stable
  useEffect(() => {
    if (!chatMissing || attemptedCreate.current || !otherUserId || !myId) {
      return;
    }
    attemptedCreate.current = true;
    createChat.mutate(
      { booking: bookingId, participants: [myId, otherUserId] },
      {
        onSuccess: (res) => {
          setCreatedChatId(res.data._id);
          // Invalidate the booking query so it refetches and finds the newly created chat
          queryClient.invalidateQueries({
            queryKey: chatKeys.byBooking(bookingId),
          });
        },
      },
    );
  }, [chatMissing, bookingId, otherUserId, myId]);

  const { data: messagesData, isPending: messagesPending } =
    useMessagesByChatId(chatId ?? "");
  const [messages, setMessages] = useState<Message[]>([]);

  // The messages query has the whole conversation, the chat may have a part.
  useEffect(() => {
    const chatMessages = chatData?.data?.messages;
    // Merged, so a message that arrived live meanwhile is not lost.
    if (messagesData?.data.length) {
      setMessages((prev) => mergeMessages(prev, messagesData.data));
    } else if (chatMessages && chatMessages.length > 0) {
      setMessages((prev) => mergeMessages(prev, chatMessages));
    }
  }, [chatData, messagesData]);

  useSocketEvent("new-message", (msg) => {
    if (!chatId || (msg.chatId && msg.chatId !== chatId)) return;
    // Map socket payload to Message shape
    const mapped: Message = {
      _id: msg._id,
      sender: msg.sender,
      text: msg.text,
      seen: msg.seen,
      createdAt: msg.createdAt,
    };
    setMessages((prev) =>
      prev.some((m) => m._id === mapped._id) ? prev : [...prev, mapped],
    );
  });

  const markSeen = useMarkChatSeen();
  const seenRef = useRef(new Set<string>());
  useEffect(() => {
    if (!myId || !chatId) return;
    const unseen = messages
      .filter((m) => !m.seen && m.sender !== myId && !seenRef.current.has(m._id))
      .map((m) => m._id);
    if (unseen.length === 0) return;
    for (const id of unseen) seenRef.current.add(id);
    markSeen.mutate(chatId, {
      // Tried again with the next message.
      onError: () => {
        for (const id of unseen) seenRef.current.delete(id);
      },
    });
  }, [messages, myId, chatId, markSeen.mutate]);

  function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!chatId || !trimmed) return;
    emit("send-message", { chatId, text: trimmed });
  }

  return {
    chatId,
    messages,
    myId,
    sendMessage,
    ready: !!chatId,
    loading:
      chatQueryPending ||
      (chatMissing && !chatId) ||
      (!!chatId && messagesPending),
  };
}

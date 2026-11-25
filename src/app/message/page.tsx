"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  chatKeys,
  useChatById,
  useMarkChatSeen,
  useMessagesByChatId,
  useMyChatList,
} from "@/hooks/shared/use-chat";
import { useSocket, useSocketEvent } from "@/hooks/shared/use-socket";
import { useMe } from "@/hooks/shared/use-user";
import type {
  Message as ApiMessage,
  Chat,
  ChatListItem,
  ChatParticipant,
} from "@/types/chat.types";
import { ChatPanel } from "./_components/chat-panel";
import { SidebarList } from "./_components/sidebar-list";
import type { Conversation, Message as UiMessage } from "./types";

type MobileView = "list" | "chat";

function mapApiMessageToUiMessage(
  message: ApiMessage,
  myId?: string,
): UiMessage {
  return {
    id: message._id || message.id || "",
    content: message.text,
    sender: message.sender === myId ? "me" : "other",
    timestamp: new Date(message.sentAt || message.createdAt || new Date()),
  };
}

/** History plus what arrived live (or was just sent) while it loaded. */
function mergeHistory(current: UiMessage[], history: UiMessage[]): UiMessage[] {
  const known = new Set(history.map((message) => message.id));
  return [...history, ...current.filter((message) => !known.has(message.id))].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
  );
}

function mapApiChatToConversation(
  chatItem: {
    chat: Chat;
    lastMessage?: {
      _id: string;
      text: string;
      imageUrl?: string[];
      seen: boolean;
      isEdited: boolean;
      sender: { _id: string; name: string; profileImage?: string | null };
      createdAt: string;
    };
    unreadMessageCount: number;
  },
  myId?: string,
): Conversation {
  const chat = chatItem.chat;

  const otherParticipant = chat.participants?.find((p) => {
    if (typeof p === "string") return p !== myId;
    return (
      (p as ChatParticipant)._id !== myId && (p as ChatParticipant).id !== myId
    );
  });

  const populated =
    typeof otherParticipant === "object" && otherParticipant !== null
      ? (otherParticipant as ChatParticipant)
      : null;

  const rawLastMessage = chatItem.lastMessage?.text;
  const lastMessageText =
    rawLastMessage && rawLastMessage !== "new message"
      ? rawLastMessage
      : "No messages yet";
  const lastMessageTime = chatItem.lastMessage?.createdAt
    ? new Date(chatItem.lastMessage.createdAt)
    : new Date(chat.updatedAt || chat.createdAt);

  return {
    id: chat._id,
    participant: {
      name: populated?.name ?? "Chat",
      avatar: populated?.profileImage ?? "",
      isOnline: populated?.isOnline ?? false,
    },
    lastMessage: lastMessageText,
    lastMessageTime,
    unreadCount: chatItem.unreadMessageCount ?? 0,
    messages: [],
  };
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<MobileView>("list");

  const requestedChatId = useSearchParams().get("chat") ?? "";
  const { data: meData } = useMe();
  const myId = meData?.data?._id ?? meData?.data?.id;
  const myAvatar = meData?.data?.profileImage ?? "/user.png";
  const { data: chatsData } = useMyChatList();
  const { data: requestedChat } = useChatById(requestedChatId);
  const { data: messagesData } = useMessagesByChatId(activeId ?? "");
  const markChatSeen = useMarkChatSeen();
  const { emit } = useSocket();
  const queryClient = useQueryClient();

  // Refs for socket handlers (avoid stale closures)
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;
  const myIdRef = useRef(myId);
  myIdRef.current = myId;

  // Track which chat we've already loaded from API (to avoid re-loading on every query change)
  const loadedChatIdRef = useRef<string | null>(null);
  const seenMessageIdsRef = useRef(new Set<string>());

  const chats = useMemo(
    () => (chatsData?.data ?? []) as ChatListItem[],
    [chatsData?.data],
  );

  // ── Sidebar sync from chat list query ──────────────────────────────
  useEffect(() => {
    if (!chats.length) {
      // A chat opened from a notification stays open.
      if (requestedChatId) return;
      setConversations((prev) => (prev.length ? [] : prev));
      setActiveId((current) => (current === null ? current : null));
      return;
    }

    setConversations((prev) => {
      const existingById = new Map(
        prev.map((conversation) => [conversation.id, conversation]),
      );

      const nextConversations = chats.map((chatItem) => {
        const chatId = chatItem.chat._id;
        const previousConversation = existingById.get(chatId);

        return previousConversation
          ? {
              ...previousConversation,
              participant: previousConversation.participant,
              lastMessage:
                (chatItem.lastMessage?.text &&
                chatItem.lastMessage.text !== "new message"
                  ? chatItem.lastMessage.text
                  : undefined) ?? previousConversation.lastMessage,
              lastMessageTime: chatItem.lastMessage?.createdAt
                ? new Date(chatItem.lastMessage.createdAt)
                : previousConversation.lastMessageTime,
              unreadCount:
                chatItem.unreadMessageCount ?? previousConversation.unreadCount,
            }
          : mapApiChatToConversation(chatItem, myId);
      });

      const isSame =
        prev.length === nextConversations.length &&
        prev.every((conversation, index) => {
          const nextConversation = nextConversations[index];
          return (
            conversation.id === nextConversation.id &&
            conversation.lastMessage === nextConversation.lastMessage &&
            conversation.lastMessageTime.getTime() ===
              nextConversation.lastMessageTime.getTime()
          );
        });

      return isSame ? prev : nextConversations;
    });

    setActiveId((current) =>
      current ? current : (chats[0]?.chat._id ?? null),
    );
  }, [chats, myId, requestedChatId]);

  // ── Conversation opened from a notification ───────────────────────
  useEffect(() => {
    if (!requestedChatId) return;
    setActiveId(requestedChatId);
    setMobileView("chat");
  }, [requestedChatId]);

  useEffect(() => {
    const chat = requestedChat?.data;
    if (!chat?._id) return;
    setConversations((prev) =>
      prev.some((conversation) => conversation.id === chat._id)
        ? prev
        : [
            ...prev,
            mapApiChatToConversation({ chat, unreadMessageCount: 0 }, myId),
          ],
    );
  }, [requestedChat, myId, conversations]);

  // ── Initial message load from API (only on chat switch) ────────────
  const normalizedMessages = useMemo(
    () =>
      (messagesData?.data ?? [])
        .filter((msg) => msg.text && msg.text !== "new message")
        .map((message) => mapApiMessageToUiMessage(message, myId)),
    [messagesData?.data, myId],
  );

  useEffect(() => {
    if (!activeId) return;

    // Only load from API when switching to a NEW chat (not on every query change)
    if (loadedChatIdRef.current === activeId) return;
    if (!normalizedMessages.length) return;

    loadedChatIdRef.current = activeId;

    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === activeId
          ? {
              ...conversation,
              messages: mergeHistory(
                conversation.messages,
                normalizedMessages,
              ),
              lastMessage:
                normalizedMessages.at(-1)?.content ?? conversation.lastMessage,
              lastMessageTime:
                normalizedMessages.at(-1)?.timestamp ??
                conversation.lastMessageTime,
            }
          : conversation,
      ),
    );
  }, [activeId, normalizedMessages]);

  useEffect(() => {
    if (!activeId) return;
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === activeId && conversation.unreadCount !== 0
          ? { ...conversation, unreadCount: 0 }
          : conversation,
      ),
    );
  }, [activeId]);

  useEffect(() => {
    if (!activeId || !myId) return;

    const unseen = (messagesData?.data ?? [])
      .filter(
        (message) =>
          message.sender !== myId &&
          !message.seen &&
          !seenMessageIdsRef.current.has(message._id),
      )
      .map((message) => message._id);
    if (unseen.length === 0) return;
    for (const id of unseen) seenMessageIdsRef.current.add(id);
    // One request marks the whole chat.
    markChatSeen.mutate(activeId, {
      onError: () => {
        for (const id of unseen) seenMessageIdsRef.current.delete(id);
      },
    });
  }, [activeId, messagesData?.data, myId, markChatSeen.mutate]);

  // ── Socket: new-message — add directly, no API calls ───────────────
  useSocketEvent("new-message", (msg) => {
    const chatId = activeIdRef.current;
    if (!chatId || !msg?._id || (msg.chatId && msg.chatId !== chatId)) return;

    const newMsg: UiMessage = {
      id: msg._id,
      content: msg.text,
      sender: msg.sender === myIdRef.current ? "me" : "other",
      timestamp: new Date(msg.createdAt),
    };

    if (msg.sender !== myIdRef.current && !msg.seen) {
      markChatSeen.mutate(chatId);
    }

    setConversations((prev) =>
      prev.map((conversation) => {
        if (conversation.id !== chatId) return conversation;
        // Skip if already present (dedup)
        if (conversation.messages.some((m) => m.id === newMsg.id))
          return conversation;

        // Replace one optimistic placeholder from me with the server message.
        const optimisticIndex =
          newMsg.sender === "me"
            ? conversation.messages.findIndex(
                (m) => m.sender === "me" && m.content === newMsg.content,
              )
            : -1;
        const filtered =
          optimisticIndex >= 0
            ? conversation.messages.filter(
                (_, index) => index !== optimisticIndex,
              )
            : conversation.messages;

        return {
          ...conversation,
          messages: [...filtered, newMsg],
          lastMessage: newMsg.content || conversation.lastMessage,
          lastMessageTime: newMsg.timestamp,
        };
      }),
    );

    // Update sidebar unread/lastMessage
    queryClient.invalidateQueries({ queryKey: chatKeys.myList() });
  });

  // ── Socket: chat-list — sidebar only, no message touching ──────────
  useSocketEvent("chat-list", (chatUpdates) => {
    if (!chatUpdates || !Array.isArray(chatUpdates)) return;

    setConversations((prev) => {
      const updated = [...prev];

      for (const update of chatUpdates) {
        const existingIndex = updated.findIndex(
          (c) => c.id === update.chat._id,
        );

        if (existingIndex >= 0) {
          const validText =
            update.lastMessage?.text &&
            update.lastMessage.text !== "new message"
              ? update.lastMessage.text
              : undefined;
          updated[existingIndex] = {
            ...updated[existingIndex],
            lastMessage: validText ?? updated[existingIndex].lastMessage,
            lastMessageTime: update.lastMessage?.createdAt
              ? new Date(update.lastMessage.createdAt)
              : updated[existingIndex].lastMessageTime,
            unreadCount:
              update.chat._id === activeIdRef.current
                ? 0
                : update.unreadMessageCount,
          };
        } else {
          const otherParticipant = update.chat.participants.find(
            (p) => p._id !== myId,
          );
          const validText =
            update.lastMessage?.text &&
            update.lastMessage.text !== "new message"
              ? update.lastMessage.text
              : undefined;
          updated.push({
            id: update.chat._id,
            participant: {
              name: otherParticipant?.name ?? "Chat",
              avatar: otherParticipant?.profileImage ?? "",
              isOnline: false,
            },
            lastMessage: validText ?? "No messages yet",
            lastMessageTime: update.lastMessage?.createdAt
              ? new Date(update.lastMessage.createdAt)
              : new Date(),
            unreadCount:
              update.chat._id === activeIdRef.current
                ? 0
                : update.unreadMessageCount,
            messages: [],
          });
        }
      }

      return updated;
    });
  });

  // ── Derived state ──────────────────────────────────────────────────
  const activeConversation = conversations.find((c) => c.id === activeId) ??
    conversations[0] ?? {
      id: "",
      participant: { name: "", avatar: "", isOnline: false },
      lastMessage: "",
      lastMessageTime: new Date(),
      messages: [],
    };

  function handleSelect(id: string) {
    setActiveId(id);
    setMobileView("chat");
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === id
          ? { ...conversation, unreadCount: 0 }
          : conversation,
      ),
    );
  }

  // ── Send: optimistic + socket emit, NO API calls ───────────────────
  const handleSendMessage = useCallback(
    (conversationId: string, content: string) => {
      const trimmed = content.trim();
      if (!trimmed || !conversationId) return;

      const optimisticMessage: UiMessage = {
        id: crypto.randomUUID(),
        content: trimmed,
        sender: "me",
        timestamp: new Date(),
      };

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                messages: [...conversation.messages, optimisticMessage],
                lastMessage: trimmed,
                lastMessageTime: new Date(),
              }
            : conversation,
        ),
      );

      // Fire and forget — the new-message socket event will echo back
      // the real message and replace the optimistic placeholder
      emit("send-message", { chatId: conversationId, text: trimmed });
    },
    [emit],
  );

  return (
    <div className="flex min-h-0 flex-1 h-full w-full overflow-hidden">
      <aside
        className={[
          "h-full min-h-0 shrink-0 md:w-85 md:block",
          mobileView === "list" ? "block w-full" : "hidden",
        ].join(" ")}
      >
        <SidebarList
          conversations={conversations}
          activeId={activeId ?? ""}
          onSelect={handleSelect}
        />
      </aside>

      <main
        className={[
          "h-full min-h-0 min-w-0 flex-col overflow-hidden md:flex md:flex-1",
          mobileView === "chat" ? "flex flex-1" : "hidden",
        ].join(" ")}
      >
        <ChatPanel
          key={activeConversation.id}
          conversation={activeConversation}
          myAvatar={myAvatar}
          onSendMessage={handleSendMessage}
          onBack={() => setMobileView("list")}
        />
      </main>
    </div>
  );
}

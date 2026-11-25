"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { byNewest, fetchAllRows } from "@/lib/admin-list";
import { chatService } from "@/services/chat.service";
import type {
  CreateChatPayload,
  UpdateChatStatusPayload,
  UpdateMessagePayload,
} from "@/types/chat.types";

export const chatKeys = {
  myList: (search?: string) => ["chats", "my-list", search] as const,
  byBooking: (bookingId: string) => ["chats", "booking", bookingId] as const,
  messages: (chatId: string) => ["messages", chatId] as const,
  message: (messageId: string) => ["message", messageId] as const,
};

export function useCreateChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateChatPayload) => chatService.createChat(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chats"] }),
  });
}

export function useMyChatList(searchTerm?: string) {
  return useQuery({
    queryKey: chatKeys.myList(searchTerm),
    queryFn: () => chatService.getMyChatList(searchTerm),
  });
}

export function useChatByBooking(bookingId: string) {
  return useQuery({
    queryKey: chatKeys.byBooking(bookingId),
    queryFn: () => chatService.getChatByBookingId(bookingId),
    enabled: !!bookingId,
    retry: false, // Don't retry - let the get-or-create logic handle missing chats
  });
}

export function useUpdateChatStatus(chatId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateChatStatusPayload) =>
      chatService.updateChatStatus(chatId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chats"] }),
  });
}

/** The whole conversation, oldest first: the API's first page is the oldest. */
export function useMessagesByChatId(chatId: string) {
  return useQuery({
    queryKey: chatKeys.messages(chatId),
    queryFn: async () => {
      const rows = await fetchAllRows((page, limit) =>
        chatService.getMessagesByChatId(chatId, page, limit),
      );
      return { data: rows.sort((a, b) => byNewest(b, a)) };
    },
    enabled: !!chatId,
  });
}

export function useUpdateMessage(messageId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateMessagePayload) =>
      chatService.updateMessage(messageId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages"] }),
  });
}

/** One request marks the whole chat; the chat list shows the new unread count. */
export function useMarkChatSeen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => chatService.markChatSeen(chatId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chats", "my-list"] }),
  });
}

export function useChatById(chatId: string) {
  return useQuery({
    queryKey: ["chats", chatId] as const,
    queryFn: () => chatService.getChatById(chatId),
    enabled: !!chatId,
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) =>
      chatService.deleteConversationByChatId(chatId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages"] }),
  });
}

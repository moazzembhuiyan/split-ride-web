import { howl } from "@/lib/api";
import type { ApiResponse, PagedResponse } from "@/types/base";
import type {
  Chat,
  ChatListItem,
  CreateChatPayload,
  Message,
  UpdateChatStatusPayload,
  UpdateMessagePayload,
} from "@/types/chat.types";

export const chatService = {
  createChat: (payload: CreateChatPayload) =>
    howl<ApiResponse<Chat>>("/chats", { method: "POST", body: payload }),

  getMyChatList: (searchTerm?: string) => {
    const qs = searchTerm ? `?searchTerm=${encodeURIComponent(searchTerm)}` : "";
    return howl<ApiResponse<ChatListItem[]>>(`/chats/my-chat-list${qs}`);
  },

  getChatByBookingId: (bookingId: string) =>
    howl<ApiResponse<Chat>>(`/chats/booking/${bookingId}`),

  updateChatStatus: (chatId: string, payload: UpdateChatStatusPayload) =>
    howl<ApiResponse<Chat>>(`/chats/${chatId}`, { method: "PATCH", body: payload }),

  deleteChat: (chatId: string) =>
    howl<ApiResponse<null>>(`/chats/${chatId}`, { method: "DELETE" }),

  getMessagesByChatId: (chatId: string, page: number, limit: number) =>
    howl<PagedResponse<Message>>(
      `/message/my-messages/${chatId}?page=${page}&limit=${limit}`,
    ),

  getMessageById: (messageId: string) =>
    howl<ApiResponse<Message>>(`/message/${messageId}`),

  updateMessage: (messageId: string, payload: UpdateMessagePayload) =>
    howl<ApiResponse<Message>>(`/message/update/${messageId}`, { method: "PATCH", body: payload }),

  /** Marks every message the other person sent in this chat as seen. */
  markChatSeen: (chatId: string) =>
    howl<ApiResponse<null>>(`/message/seen/${chatId}`, { method: "PATCH" }),

  deleteMessage: (messageId: string) =>
    howl<ApiResponse<null>>(`/message/${messageId}`, { method: "DELETE" }),

  deleteConversationByChatId: (chatId: string) =>
    howl<ApiResponse<null>>(`/message/chat/${chatId}`, { method: "DELETE" }),

  getChatById: (chatId: string) =>
    howl<ApiResponse<Chat>>(`/chats/${chatId}`),
};

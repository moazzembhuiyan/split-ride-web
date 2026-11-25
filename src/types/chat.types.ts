export type ChatStatus = "pending" | "accepted" | "blocked" | "resolved";

export interface ChatParticipant {
  _id: string;
  id?: string;
  name: string;
  profileImage?: string | null;
  isOnline?: boolean;
}

export interface ChatBooking {
  _id: string;
  status?: string;
  service?: string;
  scheduledAt?: string;
}

export interface LastMessage {
  text: string;
  sentAt: string;
}

export interface MessageReadBy {
  _id: string;
  readBy: string[];
}

export interface Chat {
  _id: string;
  id?: string;
  booking?: string | ChatBooking;
  participants: (string | ChatParticipant)[];
  messages?: Message[];
  status?: ChatStatus;
  lastMessage?: string | LastMessage;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatListItem {
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
}

export interface Message {
  _id: string;
  id?: string;
  chat?: string;
  sender: string;
  text: string;
  seen?: boolean;
  readBy?: string[];
  sentAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateChatPayload {
  booking: string; // Can be empty string for global chats
  participants: [string, string];
}

export interface UpdateChatStatusPayload {
  status: "accepted" | "blocked" | "resolved";
}

export interface UpdateMessagePayload {
  text: string;
}

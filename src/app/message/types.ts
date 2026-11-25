export type MessageSender = "me" | "other";

export interface Message {
  id: string;
  content: string;
  sender: MessageSender;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  participant: {
    name: string;
    avatar: string;
    isOnline?: boolean;
  };
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount?: number;
  messages: Message[];
}

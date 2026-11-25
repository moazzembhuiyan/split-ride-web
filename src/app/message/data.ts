import type { Conversation } from "./types";

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "1",
    participant: {
      name: "Emily Johnson",
      avatar: "https://i.pravatar.cc/150?img=47",
      isOnline: true,
    },
    lastMessage: "Thank you.",
    lastMessageTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
    messages: [
      {
        id: "m1",
        content: "Hii Mam",
        sender: "me",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000 - 10 * 60000),
      },
      {
        id: "m2",
        content:
          "Hi Admin, I have a question regarding my recent order. Can you help me check its status? The order ID is #12345. Thank you!",
        sender: "other",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000 - 8 * 60000),
      },
      {
        id: "m3",
        content: "The order ID is #12345. Thank you!",
        sender: "other",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000 - 7 * 60000),
      },
      {
        id: "m4",
        content:
          "Hello! Sure, let me check that for you. Please give me a moment.",
        sender: "me",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000 - 5 * 60000),
      },
      {
        id: "m5",
        content: "Provide you with an update as soon as possible.",
        sender: "me",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000 - 4 * 60000),
      },
      {
        id: "m6",
        content: "Please kindly inform me as soon as possible.",
        sender: "other",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000 - 2 * 60000),
      },
      {
        id: "m7",
        content: "Thank you!",
        sender: "other",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      },
    ],
  },
  ...Array.from({ length: 6 }, (_, i) => ({
    id: String(i + 2),
    participant: {
      name: "Emily Johnson",
      avatar: "https://i.pravatar.cc/150?img=47",
      isOnline: false,
    },
    lastMessage: "Thank you.",
    lastMessageTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
    messages: [],
  })),
];

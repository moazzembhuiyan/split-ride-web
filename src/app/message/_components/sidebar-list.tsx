"use client";

import { AlignLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Conversation } from "../types";
import { ConversationItem } from "./conversation-item";

interface SidebarListProps {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function SidebarList({
  conversations,
  activeId,
  onSelect,
}: SidebarListProps) {
  return (
    <div className="flex h-full min-h-0 flex-col border-r">
      <div className="flex items-center gap-2 px-4 py-5">
        <AlignLeft className="size-5 text-foreground" />
        <h2 className="text-lg font-semibold">Chats</h2>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-2">
        <div className="flex flex-col gap-1 pb-4">
          {conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeId}
              onClick={onSelect}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

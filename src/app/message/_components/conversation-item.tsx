"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Conversation } from "../types";
import { formatDistanceToNow } from "../utils";

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: (id: string) => void;
}

export function ConversationItem({
  conversation,
  isActive,
  onClick,
}: ConversationItemProps) {
  const { participant, lastMessage, lastMessageTime, unreadCount } =
    conversation;

  return (
    <button
      type="button"
      onClick={() => onClick(conversation.id)}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted/60",
        isActive && "bg-muted/80",
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="size-12">
          <AvatarImage src={participant.avatar} alt={participant.name} />
          <AvatarFallback>{participant.name[0]}</AvatarFallback>
        </Avatar>
        {participant.isOnline && (
          <span className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-background bg-green-500" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-foreground">
            {participant.name}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatDistanceToNow(lastMessageTime)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="truncate text-xs text-muted-foreground">
            {lastMessage || "No messages yet"}
          </p>
          {unreadCount && unreadCount > 0 ? (
            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

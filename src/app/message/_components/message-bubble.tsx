import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Message } from "../types";

interface MessageBubbleProps {
  message: Message;
  participantAvatar: string;
  participantName: string;
  myAvatar: string;
  showAvatar: boolean;
}

export function MessageBubble({
  message,
  participantAvatar,
  participantName,
  myAvatar,
  showAvatar,
}: MessageBubbleProps) {
  const isMe = message.sender === "me";

  return (
    <div
      className={cn(
        "flex items-end gap-2",
        isMe ? "flex-row-reverse" : "flex-row",
      )}
    >
      {showAvatar ? (
        <Avatar className="size-9 shrink-0 mb-1">
          {(isMe ? myAvatar : participantAvatar) && (
            <AvatarImage
              src={isMe ? myAvatar : participantAvatar}
              alt={isMe ? "Me" : participantName}
            />
          )}
          <AvatarFallback>{isMe ? "M" : participantName[0]}</AvatarFallback>
        </Avatar>
      ) : (
        <div className="size-9 shrink-0" />
      )}

      <div
        className={cn(
          "max-w-[65%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isMe
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm bg-muted text-foreground",
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

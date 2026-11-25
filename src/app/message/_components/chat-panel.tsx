"use client";

import { ArrowLeft, MapPin, Paperclip, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import type { Conversation } from "../types";
import { MessageBubble } from "./message-bubble";

interface ChatPanelProps {
  conversation: Conversation;
  myAvatar?: string;
  // socket-ready: onSendMessage will be replaced by socket emit
  onSendMessage: (conversationId: string, content: string) => void;
  onBack?: () => void;
}

export function ChatPanel({
  conversation,
  myAvatar,
  onSendMessage,
  onBack,
}: ChatPanelProps) {
  const t = useT();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.messages]);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSendMessage(conversation.id, trimmed);
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Group consecutive messages from same sender for avatar display
  const messagesWithAvatar = conversation.messages.map((msg, i) => {
    const next = conversation.messages[i + 1];
    const isLastInGroup = !next || next.sender !== msg.sender;
    return { msg, showAvatar: isLastInGroup };
  });

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-6 py-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label={t("chat.backToChats")}
            className="mr-1 flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted md:hidden"
          >
            <ArrowLeft className="size-4" />
          </button>
        )}
        <Avatar className="size-10">
          {conversation.participant.avatar && (
            <AvatarImage
              src={conversation.participant.avatar}
              alt={conversation.participant.name}
            />
          )}
          <AvatarFallback>
            {conversation.participant.name?.[0] ?? "?"}
          </AvatarFallback>
        </Avatar>
        <span className="font-semibold text-foreground">
          {conversation.participant.name}
        </span>
      </div>

      {/* Messages */}
      <ScrollArea className="min-h-0 flex-1 px-6 py-4">
        {conversation.messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 py-20 text-center select-none">
            <div className="relative">
              <Avatar className="size-20 ring-4 ring-primary/10">
                {conversation.participant.avatar && (
                  <AvatarImage
                    src={conversation.participant.avatar}
                    alt={conversation.participant.name}
                  />
                )}
                <AvatarFallback className="text-2xl">
                  {conversation.participant.name?.[0] ?? "?"}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                <MapPin className="size-3" />
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">
                {conversation.participant.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("chat.matchedRoute")}
              </p>
            </div>
            <div className="flex gap-2">
              {[t("chat.sayHi"), t("chat.whenRide"), t("chat.shareStop")].map(
                (suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      onSendMessage(conversation.id, suggestion);
                    }}
                    className="rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted"
                  >
                    {suggestion}
                  </button>
                ),
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {messagesWithAvatar.map(({ msg, showAvatar }) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                participantAvatar={conversation.participant.avatar}
                participantName={conversation.participant.name}
                myAvatar={myAvatar ?? ""}
                showAvatar={showAvatar}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="flex items-center gap-3 border-t px-6 py-4">
        <button
          type="button"
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted"
          aria-label={t("chat.attachFile")}
        >
          <Paperclip className="size-4" />
        </button>

        <div className="relative flex-1">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("chat.typeMessage")}
            className={cn(
              "h-12 w-full rounded-full border border-border bg-background px-5 pr-12 text-sm outline-none",
              "placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
              "transition-[border-color,box-shadow]",
            )}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim()}
            aria-label={t("chat.sendMessage")}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40 hover:opacity-90"
          >
            <Send className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

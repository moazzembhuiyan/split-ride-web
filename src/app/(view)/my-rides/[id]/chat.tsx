"use client";
import { Message01Icon, SentIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRideChat } from "@/hooks/shared/use-ride-chat";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

interface Props {
  bookingId: string;
  otherUserId: string;
  otherUserName?: string;
  otherUserAvatar?: string | null;
}

export default function Chat({
  bookingId,
  otherUserId,
  otherUserName,
  otherUserAvatar,
}: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { messages, myId, sendMessage, loading } = useRideChat(
    bookingId,
    otherUserId,
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new messages or opening the panel
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, messages]);

  function handleSend() {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  }

  const initials = otherUserName
    ? otherUserName.slice(0, 2).toUpperCase()
    : "DR";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button className="fixed top-20 end-4 lg:top-auto lg:bottom-12 lg:end-12 z-40 w-16! p-0! h-16! aspect-square">
          <HugeiconsIcon className="size-8" icon={Message01Icon} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" side="top" className="w-96 max-w-[calc(100vw-1rem)]">
        <PopoverHeader className="flex flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="size-8 shrink-0">
              <AvatarImage src={otherUserAvatar ?? "/user.png"} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <h3 className="font-semibold truncate">
              {otherUserName ?? t("chat.chatWith")}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="p-0! size-10 shrink-0"
            onClick={() => setOpen(false)}
          >
            <XIcon />
          </Button>
        </PopoverHeader>
        <div className="flex flex-col gap-3 h-80 overflow-y-auto py-3 px-1">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground animate-pulse">
              Loading…
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
              Say hi 👋
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m._id}
                className={cn(
                  "flex",
                  m.sender === myId ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[70%] rounded-2xl px-4 py-2 text-sm",
                    m.sender === myId
                      ? "rounded-tr-sm bg-primary text-primary-foreground"
                      : "rounded-tl-sm bg-muted",
                  )}
                >
                  {m.text}
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
        <div className="flex items-center justify-between gap-2 pt-3 border-t">
          <InputGroup className="flex-1">
            <InputGroupInput
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`${t("chat.typeMessage")}...`}
            />
          </InputGroup>
          <Button
            size="icon"
            className="p-0! size-10 shrink-0"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <HugeiconsIcon className="size-5" icon={SentIcon} />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

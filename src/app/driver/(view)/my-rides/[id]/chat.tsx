"use client";
import { Message01Icon, SentIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeftIcon, XIcon } from "lucide-react";
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
import type { RidePassenger } from "@/types/booking.types";

interface ThreadProps {
  passenger: RidePassenger;
  onBack?: () => void;
  onClose: () => void;
}

function ChatThread({ passenger, onBack, onClose }: ThreadProps) {
  const t = useT();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { messages, myId, sendMessage, loading } = useRideChat(
    passenger._id,
    passenger.userId?._id,
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  }

  const initials = passenger.userId?.name
    ? passenger.userId.name.slice(0, 2).toUpperCase()
    : "P";

  return (
    <>
      <PopoverHeader className="flex flex-row justify-between items-center gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              className="p-0! size-8 shrink-0"
              onClick={onBack}
            >
              <ArrowLeftIcon className="size-4" />
            </Button>
          )}
          <Avatar className="size-8 shrink-0">
            <AvatarImage src={passenger.userId?.profileImage ?? "/user.png"} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <h3 className="font-semibold truncate">
            {passenger.userId?.name ?? "Passenger"}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="p-0! size-10 shrink-0"
          onClick={onClose}
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
    </>
  );
}

interface Props {
  passengers: RidePassenger[];
}

export default function Chat({ passengers }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<RidePassenger | null>(null);

  const active = passengers.length === 1 ? passengers[0] : selected;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setSelected(null);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          className="fixed top-20 end-4 lg:top-auto lg:bottom-12 lg:end-12 z-40 w-16! p-0! h-16! aspect-square"
          disabled={passengers.length === 0}
        >
          <HugeiconsIcon className="size-8" icon={Message01Icon} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" side="top" className="w-96 max-w-[calc(100vw-1rem)]">
        {!active ? (
          <>
            <PopoverHeader className="flex flex-row justify-between items-center">
              <h3 className="font-semibold">Select passenger</h3>
              <Button
                variant="ghost"
                size="icon"
                className="p-0! size-10"
                onClick={() => setOpen(false)}
              >
                <XIcon />
              </Button>
            </PopoverHeader>
            <div className="flex flex-col gap-1 py-2 max-h-80 overflow-y-auto">
              {passengers.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => setSelected(p)}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-muted transition-colors"
                >
                  <Avatar className="size-9">
                    <AvatarImage src={p.userId?.profileImage ?? "/user.png"} />
                    <AvatarFallback className="text-xs">
                      {p.userId?.name?.slice(0, 2).toUpperCase() ?? "P"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium truncate">
                    {p.userId?.name ?? "Passenger"}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <ChatThread
            passenger={active}
            onBack={passengers.length > 1 ? () => setSelected(null) : undefined}
            onClose={() => setOpen(false)}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

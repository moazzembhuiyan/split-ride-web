"use client";
import { useState } from "react";
import { StarIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSocket } from "@/hooks/shared/use-socket";
import { emitAck } from "@/lib/socket-ack";

export default function RatingDialog({
  open,
  onOpenChange,
  rideId,
  driverId,
  driverName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rideId: string;
  driverId: string;
  driverName?: string;
}) {
  const { socket } = useSocket();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (submitting) return;
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    setSubmitting(true);
    const result = await emitAck(
      socket,
      "ride:submit-rating",
      { rideId, driverId, rating, feedback: feedback.trim() || undefined },
      { timeoutMs: 15000 },
    );
    setSubmitting(false);
    if (result.ok) {
      toast.success(result.message || "Thanks for your feedback!");
      onOpenChange(false);
    } else {
      toast.error(result.message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Rate your ride</DialogTitle>
          <DialogDescription>
            {driverName ? `How was your trip with ${driverName}?` : "How was your trip?"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-1 py-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHoverRating(n)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1"
            >
              <HugeiconsIcon
                icon={StarIcon}
                className={`size-9 transition-colors ${
                  n <= (hoverRating || rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/40"
                }`}
              />
            </button>
          ))}
        </div>

        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Share feedback about your ride (optional)"
          rows={3}
          className="w-full resize-none rounded-2xl border border-border bg-muted/20 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
        />

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 rounded-full"
            onClick={() => onOpenChange(false)}
          >
            Skip
          </Button>
          <Button
            className="flex-1 rounded-full"
            onClick={() => void handleSubmit()}
            disabled={submitting}
          >
            {submitting ? "Submitting…" : "Submit Rating"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

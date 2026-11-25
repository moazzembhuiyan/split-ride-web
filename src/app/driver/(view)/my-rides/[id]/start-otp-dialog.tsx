"use client";
import { useCallback, useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSocket } from "@/hooks/shared/use-socket";
import { useT } from "@/i18n";
import { emitAck } from "@/lib/socket-ack";

const SEND_TIMEOUT_MS = 10000;
const RESEND_PAUSE_MS = 30000;
const MIN_CODE_LENGTH = 6;
const MAX_CODE_LENGTH = 6;

interface Props {
  rideId: string;
  passengerId: string;
  passengerName: string;
  verifying: boolean;
  onSubmit: (otp: string) => void;
  onClose: () => void;
}

/**
 * Asks the driver for the passenger's start code. Opening it again keeps the
 * code already sent; only the resend button asks for a new one.
 */
export default function StartOtpDialog({
  rideId,
  passengerId,
  passengerName,
  verifying,
  onSubmit,
  onClose,
}: Props) {
  const t = useT();
  const inputId = useId();
  const { socket } = useSocket();
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [paused, setPaused] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text?: string }>();

  const send = useCallback(
    async (resend: boolean) => {
      setSending(true);
      const result = await emitAck(
        socket,
        "driver:send-start-otp",
        { rideId, passengerId, ...(resend ? { resend: true } : {}) },
        { timeoutMs: SEND_TIMEOUT_MS },
      );
      setSending(false);
      setNotice(result.ok ? { ok: true } : { ok: false, text: result.message });
      setPaused(result.ok);
    },
    [socket, rideId, passengerId],
  );

  useEffect(() => {
    void send(false);
  }, [send]);

  useEffect(() => {
    if (!paused) return;
    const timer = setTimeout(() => setPaused(false), RESEND_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [paused]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!verifying && otp.length >= MIN_CODE_LENGTH) onSubmit(otp);
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {t("driver.otp.title", { name: passengerName })}
            </DialogTitle>
            <DialogDescription>{t("driver.otp.hint")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor={inputId}>{t("driver.otp.label")}</Label>
            <Input
              id={inputId}
              dir="ltr"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="text-center text-lg tracking-widest"
              value={otp}
              onChange={(e) =>
                // A pasted "123 456" keeps all six digits.
                setOtp(
                  e.target.value.replace(/\D/g, "").slice(0, MAX_CODE_LENGTH),
                )
              }
            />
            <p
              className={
                notice && !notice.ok
                  ? "text-xs text-destructive"
                  : "text-xs text-muted-foreground"
              }
              aria-live="polite"
            >
              {sending || !notice
                ? t("driver.otp.sending")
                : notice.ok
                  ? t("driver.otp.sent")
                  : notice.text}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={sending || paused || verifying}
              onClick={() => void send(true)}
            >
              {t("driver.otp.resend")}
            </Button>
            <Button
              type="submit"
              disabled={verifying || otp.length < MIN_CODE_LENGTH}
            >
              {t("driver.otp.confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

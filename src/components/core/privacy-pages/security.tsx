"use client";

import {
  AppleIcon,
  CircleLock02Icon,
  Facebook02Icon,
  GoogleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useCookies } from "react-cookie";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useDeleteMe } from "@/hooks/shared/use-user";
import { useT } from "@/i18n";
import { useUserStore } from "@/store/user-store";

export default function Security({ driver: _driver }: { driver?: boolean }) {
  const t = useT();
  const [, , removeCookie] = useCookies(["token"]);
  const qc = useQueryClient();
  const clearUserId = useUserStore((state) => state.clearUserId);
  const { mutate: deleteAccount, isPending } = useDeleteMe();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");

  function handleDeleteAccount() {
    setIsDeleteDialogOpen(true);
  }

  function confirmDeleteAccount() {
    deleteAccount(
      { reason: deleteReason.trim() || "User requested account deletion" },
      {
        onSuccess: () => {
          removeCookie("token", { path: "/" });
          clearUserId();
          qc.clear();
          setDeleteReason("");
          setIsDeleteDialogOpen(false);
          toast.success("Account deleted successfully");
          window.location.href = "/";
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "Failed to delete account",
          );
        },
      },
    );
  }

  return (
    <div className="p-4 sm:p-8 lg:p-12 h-full w-full">
      <h1 className="text-2xl font-bold">{t("profile.security.title")}</h1>
      <div className="mt-8 space-y-4 hidden">
        <Card className=" border-0 ring-0 rounded-lg">
          <CardContent className="flex justify-between items-center">
            <div className="flex items-center gap-2 font-semibold">
              <HugeiconsIcon
                icon={CircleLock02Icon}
                className="size-6 text-primary"
              />
              <h3>{t("profile.security.twoStep")}</h3>
            </div>
            <Switch id="two-step-verification" />
          </CardContent>
        </Card>
        <Card className=" border-0 ring-0 rounded-lg">
          <CardContent className="flex justify-between items-center">
            <div className="flex items-center gap-2 font-semibold">
              <HugeiconsIcon icon={AppleIcon} className="size-6 text-primary" />
              <h3>{t("profile.security.apple")}</h3>
            </div>
            <Switch id="apple-login" />
          </CardContent>
        </Card>
        <Card className=" border-0 ring-0 rounded-lg">
          <CardContent className="flex justify-between items-center">
            <div className="flex items-center gap-2 font-semibold">
              <HugeiconsIcon
                icon={GoogleIcon}
                className="size-6 text-primary"
              />
              <h3>{t("profile.security.google")}</h3>
            </div>
            <Switch id="google-login" />
          </CardContent>
        </Card>
        <Card className=" border-0 ring-0 rounded-lg">
          <CardContent className="flex justify-between items-center">
            <div className="flex items-center gap-2 font-semibold">
              <HugeiconsIcon
                icon={Facebook02Icon}
                className="size-6 text-primary"
              />
              <h3>{t("profile.security.facebook")}</h3>
            </div>
            <Switch id="facebook-login" />
          </CardContent>
        </Card>
      </div>
      <Separator className="w-full border-t mt-6" />
      <div className="bg-destructive/10 p-6 mt-6 rounded-lg space-y-3 w-full">
        <h3 className="font-semibold">{t("profile.security.deleteTitle")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("profile.security.deleteMsg")}
        </p>
        <Button
          variant="destructive"
          size="lg"
          className="ml-auto block"
          onClick={handleDeleteAccount}
          disabled={isPending}
        >
          {isPending ? "Deleting..." : t("profile.security.deleteBtn")}
        </Button>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete your account</DialogTitle>
            <DialogDescription>
              Please share why you want to delete your account. This message
              will be sent with your request.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Tell us why you want to delete your account..."
            value={deleteReason}
            onChange={(event) => setDeleteReason(event.target.value)}
            className="min-h-32"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteReason("");
                setIsDeleteDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteAccount}
              disabled={isPending || !deleteReason.trim()}
            >
              {isPending ? "Deleting..." : "Confirm delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

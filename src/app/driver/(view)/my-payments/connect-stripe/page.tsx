"use client";

import Rings from "@/components/core/rings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useConnectExistingStripe,
  useConnectStripe,
  useStripeConnectionCheck,
} from "@/hooks/driver/use-stripe";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Page() {
  const router = useRouter();
  const [existingId, setExistingId] = useState("");

  const { data: connectionData, isLoading: checkingConnection } =
    useStripeConnectionCheck();

  const connectStripe = useConnectStripe();
  const connectExisting = useConnectExistingStripe();

  const isConnected = connectionData?.data?.isConnected ?? false;

  // If already connected, redirect back
  useEffect(() => {
    if (!checkingConnection && isConnected) {
      router.replace("/driver/my-payments");
    }
  }, [checkingConnection, isConnected, router]);

  function handleNewStripe() {
    connectStripe.mutate(undefined, {
      onSuccess: (res) => {
        const url = res?.data;
        if (url) {
          window.location.href = url;
        } else {
          toast.error("Could not get Stripe onboarding URL");
        }
      },
      onError: () => {
        toast.error("Failed to start Stripe connection");
      },
    });
  }

  function handleExistingStripe() {
    const trimmed = existingId.trim();
    if (!trimmed) return;

    connectExisting.mutate(
      { stripeAccountId: trimmed },
      {
        onSuccess: (res) => {
          const url = res?.data?.url;
          if (url) {
            window.location.href = url;
          } else {
            toast.success("Stripe account connected successfully!");
            router.push("/driver/my-payments");
          }
        },
        onError: () => {
          toast.error("Failed to connect existing Stripe account");
        },
      },
    );
  }

  if (checkingConnection) {
    return (
      <div className="relative h-full flex flex-col items-center w-full p-8 md:p-12 max-h-[90dvh] overflow-y-auto gap-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full max-w-lg rounded-2xl" />
        <Skeleton className="h-48 w-full max-w-lg rounded-2xl" />
        <Rings />
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col items-center w-full p-8 md:p-12 max-h-[90dvh] overflow-y-auto gap-6">
      <h1 className="text-2xl font-bold">Connect Your Stripe Account</h1>

      {/* New to Stripe */}
      <Card className="w-full max-w-lg rounded-2xl shadow-none">
        <CardContent className="p-6 flex flex-col gap-4">
          <div>
            <p className="font-bold text-base">New to Stripe?</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Create and connect your Stripe account automatically in just a few
              steps.
            </p>
          </div>
          <Button onClick={handleNewStripe} disabled={connectStripe.isPending}>
            {connectStripe.isPending ? "Connecting..." : "Connect"}
          </Button>
        </CardContent>
      </Card>

      {/* Already have Stripe */}
      <Card className="w-full max-w-lg rounded-2xl shadow-none">
        <CardContent className="p-6 flex flex-col gap-4">
          <p className="font-bold text-base">Already Have a Stripe Account?</p>
          <div className="space-y-1.5">
            <Label htmlFor="stripe-account-id">Stripe Account ID</Label>
            <Input
              id="stripe-account-id"
              placeholder="acct_1234567890"
              value={existingId}
              onChange={(e) => setExistingId(e.target.value)}
              className="rounded-full bg-white border border-muted h-12"
            />
          </div>
          <Button
            onClick={handleExistingStripe}
            disabled={!existingId.trim() || connectExisting.isPending}
          >
            {connectExisting.isPending ? "Connecting..." : "Connect"}
          </Button>
        </CardContent>
      </Card>

      <Link
        href="/driver/my-payments"
        className="text-sm text-violet-500 underline underline-offset-2"
      >
        Go back
      </Link>

      <Rings />
    </div>
  );
}

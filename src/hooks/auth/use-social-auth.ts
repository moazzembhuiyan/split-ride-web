"use client";

import { signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLoginWithApple, useLoginWithGoogle } from "@/hooks/auth/use-auth";
import { appleProvider, firebaseAuth, getFcmToken, googleProvider } from "@/lib/firebase";
import { saveSession } from "@/lib/session";
import type { LoginResponse, LoginUser } from "@/types/auth.types";

function redirectForRole(router: ReturnType<typeof useRouter>, user: LoginUser) {
  if (user.role === "admin") router.push("/admin/dashboard");
  else if (user.role === "provider") router.push("/driver");
  else router.push("/book");
}

export function useSocialAuth(role: "user" | "provider") {
  const router = useRouter();
  const googleMutation = useLoginWithGoogle();
  const appleMutation = useLoginWithApple();

  async function loginWithGoogle() {
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await result.user.getIdToken();
      const fcmToken = await getFcmToken();
      const { displayName, email, photoURL } = result.user;

      googleMutation.mutate(
        {
          name: displayName ?? "",
          email: email ?? "",
          role,
          token: idToken,
          profileImage: photoURL ?? undefined,
          fcmToken: fcmToken ?? undefined,
        },
        {
          onSuccess(res) {
            const data = res.data as LoginResponse;
            if (data?.accessToken) {
              saveSession(data);
              redirectForRole(router, data.user);
            }
          },
          onError(err) {
            toast.error(err.message);
          },
        }
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    }
  }

  async function loginWithApple() {
    try {
      (document.activeElement as HTMLElement | null)?.blur();
      const result = await signInWithPopup(firebaseAuth, appleProvider);
      const idToken = await result.user.getIdToken();
      const fcmToken = await getFcmToken();
      const { displayName, email, photoURL } = result.user;

      appleMutation.mutate(
        {
          name: displayName ?? "",
          email: email ?? "",
          role,
          token: idToken,
          profileImage: photoURL ?? undefined,
          fcmToken: fcmToken ?? undefined,
        },
        {
          onSuccess(res) {
            const data = res.data as LoginResponse;
            if (data?.accessToken) {
              saveSession(data);
              redirectForRole(router, data.user);
            }
          },
          onError(err) {
            toast.error(err.message);
          },
        }
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Apple sign-in failed");
    }
  }

  return {
    loginWithGoogle,
    loginWithApple,
    isGooglePending: googleMutation.isPending,
    isApplePending: appleMutation.isPending,
  };
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";

/** Flutter home never waits on nearby-driver search. Send Find to info. */
export default function Page() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/book/info");
  }, [router]);
  return (
    <div className="flex items-center justify-center h-[calc(100vh-64px)]">
      <Spinner />
    </div>
  );
}

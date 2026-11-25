"use client";

import { useMemo } from "react";
import DOMPurify from "dompurify";
import { useSettingByKey } from "@/hooks/shared/use-settings";
import { SUPPORT_EMAIL } from "@/lib/support";

export default function Terms({ driver }: { driver?: boolean }) {
  const key = driver ? "providerTramsAndCondition" : "userTramsAndCondition";
  const { data, isPending } = useSettingByKey(key);
  const content = data?.data?.value?.trim();

  // "use client" components still render on the server during SSR, where
  // DOMPurify has no DOM to work with. Sanitizing in useMemo would run there too,
  // so guard on `window` and only sanitize in the browser.
  const sanitized = useMemo(() => {
    if (!content || typeof window === "undefined") return "";
    return DOMPurify.sanitize(content);
  }, [content]);

  return (
    <div className="p-4 sm:p-8 lg:p-12 h-full w-full">
      <h1 className="text-2xl font-bold">Terms and Conditions</h1>
      <div className="mt-8 text-sm leading-relaxed">
        {isPending ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : content ? (
          <div
            className="space-y-4 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:font-semibold"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
            dangerouslySetInnerHTML={{ __html: sanitized }}
          />
        ) : (
          <p className="whitespace-pre-wrap">
            SplitRide Terms and Conditions. For questions contact {SUPPORT_EMAIL}.
            The administrator can publish the full legal text from Settings → Terms.
          </p>
        )}
      </div>
    </div>
  );
}
"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  useSettingByKey,
  useUpdateSettingByKey,
} from "@/hooks/shared/use-settings";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import TextEditor from "./text-editor";

type Tab = "userTramsAndCondition" | "providerTramsAndCondition";

function TermsEditor({ tabKey }: { tabKey: Tab }) {
  const t = useT();
  const { data, isPending } = useSettingByKey(tabKey);
  const { mutate, isPending: isSaving } = useUpdateSettingByKey(tabKey);
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");
  const [matchCount, setMatchCount] = useState(0);

  useEffect(() => {
    if (data?.data?.value) setContent(data.data.value);
  }, [data]);

  function handleSave() {
    mutate(
      { value: content },
      {
        onSuccess: () => toast.success(t("admin.settings.terms.saved")),
        onError: () => toast.error(t("admin.settings.terms.saveFailed")),
      },
    );
  }

  if (isPending) {
    return (
      <div className="p-8 text-sm text-muted-foreground">
        {t("admin.common.loading")}
      </div>
    );
  }

  return (
    <div className="p-8 flex flex-col h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">
            {t("admin.settings.terms.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("admin.settings.terms.desc")}
          </p>
        </div>
        <div className="flex items-center gap-2 border rounded-full px-4 py-2 text-sm text-muted-foreground bg-muted/50 shrink-0">
          <Search className="size-4" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.settings.terms.searchPlaceholder")}
            className="bg-transparent outline-none w-48 text-foreground placeholder:text-muted-foreground text-sm"
          />
          {search && (
            <span className="text-xs whitespace-nowrap">
              {t("admin.settings.terms.matches", { count: matchCount })}
            </span>
          )}
        </div>
      </div>

      {/* <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="mt-6 flex-1 resize-none border rounded-xl p-6 text-sm leading-relaxed text-foreground outline-none min-h-100"
      /> */}
      <TextEditor
        content={content}
        search={search}
        onChange={setContent}
        onMatchCountChange={setMatchCount}
      />

      <div className="flex items-center justify-end gap-3 mt-6">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? t("admin.common.saving") : t("admin.common.saveChanges")}
        </Button>
      </div>
    </div>
  );
}

export default function TermsPage() {
  const t = useT();
  const [tab, setTab] = useState<Tab>("userTramsAndCondition");

  const tabs: { value: Tab; label: string }[] = [
    { value: "userTramsAndCondition", label: t("admin.common.users") },
    { value: "providerTramsAndCondition", label: t("admin.common.drivers") },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 pt-6 flex items-center gap-1 border-b border-border/40">
        {tabs.map((tb) => (
          <button
            key={tb.value}
            type="button"
            onClick={() => setTab(tb.value)}
            className={cn(
              "px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === tb.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tb.label}
          </button>
        ))}
      </div>
      <TermsEditor key={tab} tabKey={tab} />
    </div>
  );
}

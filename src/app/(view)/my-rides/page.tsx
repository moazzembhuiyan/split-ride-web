"use client";
import React from "react";
import Rings from "@/components/core/rings";
import AnimatedTabsDemo from "@/components/shadcn-studio/tabs/tabs-27";
import { useT } from "@/i18n";
import Past, { type RidesTab } from "./past";

export default function Page() {
  const t = useT();
  const [type, setType] = React.useState<RidesTab>("upcoming");

  const tabs: { name: string; value: RidesTab }[] = [
    { name: t("rides.ongoing"), value: "ongoing" },
    { name: t("rides.upcoming"), value: "upcoming" },
    { name: t("rides.past"), value: "past" },
    { name: t("rides.cancelled"), value: "cancelled" },
  ];

  return (
    <div className="h-full flex flex-col justify-start items-start w-full p-4 sm:p-8 lg:p-12 lg:max-h-[90dvh] overflow-y-auto">
      <div className="w-full lg:flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <h1 className="text-3xl font-bold mb-4 lg:mb-0">{t("rides.title")}</h1>
        <AnimatedTabsDemo<RidesTab>
          setValue={setType}
          value={type}
          tabs={tabs}
        />
      </div>
      <div className="lg:flex-1 w-full justify-center items-center flex z-30">
        <Past key={type} type={type} />
      </div>
      <Rings />
    </div>
  );
}

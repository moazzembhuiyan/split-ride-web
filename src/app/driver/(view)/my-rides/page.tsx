"use client";
import { useState } from "react";
import Rings from "@/components/core/rings";
import AnimatedTabsDemo from "@/components/shadcn-studio/tabs/tabs-27";
import Ongoing from "./ongoing";
import Past from "./past";
import Upcoming from "./upcoming";

export default function Page() {
  const [type, setType] = useState<"ongoing" | "upcoming" | "past">("ongoing");
  const tabs: { name: string; value: "ongoing" | "upcoming" | "past" }[] = [
    { name: "Ongoing", value: "ongoing" },
    { name: "Upcoming Rides", value: "upcoming" },
    { name: "Past", value: "past" },
  ];

  return (
    <div className="h-full flex flex-col justify-start items-start w-full p-4 md:p-12 md:max-h-[90dvh] overflow-y-auto">
      <div className="w-full md:flex justify-between items-center">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">My Rides</h1>
        <div className="flex items-center gap-4">
          <AnimatedTabsDemo<"ongoing" | "upcoming" | "past">
            setValue={setType}
            value={type}
            tabs={tabs}
          />
        </div>
      </div>
      <div className="md:flex-1 w-full justify-center items-center md:flex z-30">
        {type === "ongoing" ? (
          <Ongoing />
        ) : type === "upcoming" ? (
          <Upcoming />
        ) : (
          <Past />
        )}
      </div>
      <Rings />
    </div>
  );
}

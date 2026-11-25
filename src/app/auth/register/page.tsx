"use client";

import { useT } from "@/i18n";
import Image from "next/image";
import Register from "./register";

export default function Page() {
  const t = useT();
  return (
    <main className="min-h-screen w-full grid lg:grid-cols-2 xl:grid-cols-3">
      <div className="col-span-1">
        <Register />
      </div>
      <div className="hidden lg:block xl:col-span-2 border rounded-l-[5rem] relative overflow-hidden bg-linear-to-r from-[#56E1E8] via-[#5C58EB] to-[#BA63FF]">
        <div className="pointer-events-none absolute overflow-hidden -right-48 -top-48 size-96 rounded-full border-60 border-background/30 xl:-right-60 xl:-top-60 xl:size-120 xl:border-80 2xl:-right-75 2xl:-top-75 2xl:size-150 2xl:border-100"></div>
        <div className="pointer-events-none absolute overflow-hidden -right-24 -top-56 size-96 rounded-full border-60 border-background/60 xl:-right-32 xl:-top-72 xl:size-120 xl:border-80 2xl:-right-40 2xl:-top-90 2xl:size-150 2xl:border-100"></div>

        <div className="pointer-events-none absolute overflow-hidden -left-48 -bottom-48 size-96 rounded-full border-60 border-background/80 xl:-left-60 xl:-bottom-60 xl:size-120 xl:border-80 2xl:-left-75 2xl:-bottom-75 2xl:size-150 2xl:border-100"></div>
        <div className="pointer-events-none absolute overflow-hidden -left-24 -bottom-56 size-96 rounded-full border-60 border-background/30 xl:-left-32 xl:-bottom-72 xl:size-120 xl:border-80 2xl:-left-40 2xl:-bottom-90 2xl:size-150 2xl:border-100"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center h-fit  gap-6">
          <Image
            src="/cars-icon.webp"
            alt=""
            width={500}
            height={500}
            className=" w-[40dvw] h-[20dvw] aspect-square  object-contain"
          />
          <div className="text-center">
            <h1 className="text-3xl xl:text-5xl font-bold text-background">
              {t("auth.login.welcomeTitle")}
            </h1>
            <p className="text-background/80 text-base xl:text-2xl whitespace-nowrap mt-4">
              {t("auth.login.welcomeSubtitle")}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

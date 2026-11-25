import React from "react";

export default function Rings() {
  return (
    <div className="hidden md:block">
      <div className="pointer-events-none absolute -left-48 z-10 -bottom-48 size-96 rounded-full p-15 bg-linear-to-br from-cyan-400/80 to-violet-500 xl:-left-60 xl:-bottom-60 xl:size-120 xl:p-20 2xl:-left-75 2xl:-bottom-75 2xl:size-150 2xl:p-25">
        <div className="w-full h-full rounded-full bg-background z-0"></div>
      </div>
      <div className="pointer-events-none absolute -left-24 z-0 -bottom-56 size-96 rounded-full p-15 bg-linear-to-br from-cyan-400/30 to-violet-500/30 xl:-left-32 xl:-bottom-72 xl:size-120 xl:p-20 2xl:-left-40 2xl:-bottom-90 2xl:size-150 2xl:p-25">
        <div className="w-full h-full rounded-full bg-background z-0"></div>
      </div>
    </div>
  );
}

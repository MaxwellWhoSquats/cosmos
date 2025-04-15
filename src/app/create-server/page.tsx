"use client";
import dynamic from "next/dynamic";

const VideoCalling = dynamic(() => import("./components/VideoCallingClient"), {
  ssr: false,
});

export default function CreateServerPage() {
  return (
    <div className="h-full w-full flex flex-col">
      <h1 className="text-2xl font-semibold p-4">Create Channel</h1>
      <div className="flex-1 m-4 p-4 rounded bg-base-200 overflow-hidden">
        <VideoCalling />
      </div>
    </div>
  );
}

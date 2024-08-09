"use client";
import SideNavbar from "../components/SideNavbar";
import Checkout from "../components/Checkout";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function Timer() {
  const session = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/signin");
    },
  });
  return (
    <>
      <div className="flex bg-white h-full text-indigo-900">
        <div className="w-64">
          <SideNavbar />
        </div>
        <div className="timer flex-grow p-8">
          <div className="timer-header flex flex-row justify-between items-center">
            <h1 className="font-bold text-2xl">Timer</h1>
            <button className="px-6 py-3 bg-indigo-800 text-white rounded-md">
              Add Timer
            </button>
          </div>

          <div className="timer-container"></div>
        </div>
        <div className="w-2/6">
          <Checkout />
        </div>
      </div>
    </>
  );
}
Timer.requireAuth = true;

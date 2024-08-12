"use client";
import React from "react";
import SideNavbar from "../components/SideNavbar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const Profile = () => {
  const { data: session } = useSession();

  const router = useRouter();
  const email = session?.user?.email;
  const avatar = session?.user?.image;

  return (
    <>
      <div className="flex min-h-screen bg-white text-indigo-900">
        <SideNavbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {email && (
            <div className="flex flex-col items-center">
              <div className="text-black text-3xl">You`re Logging as</div>
              <div className="text-black text-lg">{email}</div>
              <button
                onClick={() => router.push("/forgot-password")}
                className="disabled:opacity-40 flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-xl mt-4 font-semibold leading-6 text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Change Password
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Profile;

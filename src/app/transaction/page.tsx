'use client';

import React from 'react';
import { redirect, useRouter } from 'next/navigation';
import SideNavbar from '../components/SideNavbar';
import { useSession } from 'next-auth/react';

export default function Transaction () {
  const router = useRouter();
  const session = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/signin');
    },
  });
  return (
    <div className="flex min-h-screen bg-white">
      <SideNavbar />
      <div className='w-5/6 flex-1 flex flex-col p-8'>
      <p className='text-black'>Test</p>
      </div>
    </div>
  );
};
Transaction.requireAuth = true



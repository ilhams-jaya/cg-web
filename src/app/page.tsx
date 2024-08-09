'use client';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Stopwatch from './stopwatch/page';

export default function Home() {
  const session = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/signin');
    },
  });
  return (
    <>
    <Stopwatch/>
    </>
    
  )
}

Home.requireAuth = true
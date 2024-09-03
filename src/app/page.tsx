'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase'; 
import SideNavbar from './components/SideNavbar';
import toast from 'react-hot-toast';

export default function Home() {
  const { data: session, status } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (session?.user?.email) {
        console.log('Checking user with email:', session.user.email);
        // Buat kueri untuk mendapatkan dokumen yang sesuai
        const q = query(collection(db, 'users'), where('email', '==', session.user.email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          querySnapshot.forEach((doc) => {
            const userData = doc.data();
            console.log('User data found:', userData);
            if (userData.isAdmin) {
              setIsAdmin(true);
            } else {
              router.push('/stopwatch');
              toast.error("You are not an admin")
            }
          });
        } else {
          console.error("User document doesn't exist.");
          router.push('/signin');
        }
      } else if (status === 'unauthenticated') {
        router.push('/signin');
      }
    };

    if (status === 'authenticated') {
      checkAdminStatus();
    }
  }, [session, status, router]);

  if (!isAdmin) {
    return null; // Bisa juga diganti dengan komponen loading atau spinner
  }

  return (
    <>
      <div className="flex bg-white h-full text-indigo-900">
        <div className="w-64">
          <SideNavbar />
        </div>
        <div className="dashboard flex-grow p-8">
          
        </div>
      </div>
    </>
  )
}

Home.requireAuth = true;

import React, { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SideNavbar() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname(); 

  const handleNavigation = (path: string) => {
    setLoading(true);
    router.push(path);
  };

  const handleLogout = async () => {
    setLoading(true);
    await signOut({ redirect: false }); 
    router.push('/signin'); 
  };

  return (
    <aside className="w-64 h-full shadow-md bg-indigo-800 text-white fixed">
      <div className="p-4 text-center text-xl font-bold border-b border-gray-700">
        Campus Game
      </div>
      <nav className="mt-4">
        <ul>
          <li className={`p-4 hover:bg-indigo-700 ${pathname === '/' ? 'bg-indigo-500' : ''}`}>
            <Link href="/" onClick={() => handleNavigation('/')}>Dashboard</Link>
          </li>
          <li className={`p-4 hover:bg-indigo-700 ${pathname === '/stopwatch' ? 'bg-indigo-500' : ''}`}>
            <Link href="/stopwatch" onClick={() => handleNavigation('/stopwatch')}>Stopwatch</Link>
          </li>
          <li className={`p-4 hover:bg-indigo-700 ${pathname === '/timer' ? 'bg-indigo-500' : ''}`}>
            <Link href="/timer" onClick={() => handleNavigation('/timer')}>Timer</Link>
          </li>
          <li className={`p-4 hover:bg-indigo-700 ${pathname === '/menu' ? 'bg-indigo-500' : ''}`}>
            <Link href="/menu" onClick={() => handleNavigation('/menu')}>Menu</Link>
          </li>
          <li className={`p-4 hover:bg-indigo-700 ${pathname === '/transaction' ? 'bg-indigo-500' : ''}`}>
            <Link href="/transaction" onClick={() => handleNavigation('/transaction')}>Transaction</Link>
          </li>
          <li className={`p-4 hover:bg-indigo-700 ${pathname === '/profile' ? 'bg-indigo-500' : ''}`}>
            <Link href="/profile" onClick={() => handleNavigation('/profile')}>Profile</Link>
          </li>
          <li className="p-4 hover:bg-indigo-700">
            <button onClick={handleLogout}>Logout</button>
          </li>
        </ul>
        {loading && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
            <div className="h-8 w-8 border-4 border-t-transparent border-indigo-900 border-solid rounded-full animate-spin"></div>
          </div>
        )}
      </nav>
    </aside>
  );
}

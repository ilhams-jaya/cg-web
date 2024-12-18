'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import SideNavbar from './components/SideNavbar';
import toast from 'react-hot-toast';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import dayjs from 'dayjs';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface TransactionData {
  id: string;
  custName: string;
  userId: string;  
  paymentType: string;
  time: Timestamp;
  total: number;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [labels, setLabels] = useState<string[]>([
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 
    'August', 'September', 'October', 'November', 'December'
  ]);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionData[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>(''); 
  const [users, setUsers] = useState<{ id: string, name: string }[]>([]);
  const [dateFilter, setDateFilter] = useState<string>(dayjs().format('YYYY-MM-DD')); 
  const [totalAmount, setTotalAmount] = useState<number>(0); 
  const router = useRouter();

  const fetchAllTransactions = useCallback(async () => {
    const q = query(collection(db, 'transactions'));
    const querySnapshot = await getDocs(q);
    const allTransactions: TransactionData[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as TransactionData));
    
    setTransactions(allTransactions);
    setFilteredTransactions(allTransactions);
    updateTotalAmount(allTransactions);
  }, []);

  const fetchUsers = useCallback(async () => {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const usersData = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
    }));

    setUsers(usersData);
  }, []);

  const fetchSalesData = useCallback(async () => {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const userSalesPromises = usersSnapshot.docs.map(async (userDoc) => {
      const userData = userDoc.data();
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', userDoc.id)
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);

      const monthlySales: number[] = Array(12).fill(0);
      transactionsSnapshot.forEach((doc) => {
        const transaction = doc.data();
        const month = (transaction.time as Timestamp).toDate().getMonth();
        monthlySales[month] += transaction.total;
      });

      return {
        label: userData.name,
        data: monthlySales,
        borderColor: getRandomColor(),
        fill: false,
      };
    });

    const resolvedSalesData = await Promise.all(userSalesPromises);
    setSalesData(resolvedSalesData);
  }, []);

  const checkAdminStatus = useCallback(async () => {
    if (session?.user?.email) {
      const q = query(collection(db, 'users'), where('email', '==', session.user.email));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        if (userData.isAdmin) {
          setIsAdmin(true);
          await Promise.all([fetchSalesData(), fetchAllTransactions(), fetchUsers()]);
        } else {
          router.push('/stopwatch');
          toast.error("You are not an admin");
        }
      } else {
        router.push('/signin');
      }
    } else if (status === 'unauthenticated') {
      router.push('/signin');
    }
  }, [session, status, router, fetchSalesData, fetchAllTransactions, fetchUsers]);

  useEffect(() => {
    if (status === 'authenticated') {
      checkAdminStatus();
    }
  }, [status, checkAdminStatus]);

  const filterTransactions = useCallback(() => {
    let filtered = transactions;
    if (paymentFilter) filtered = filtered.filter((t) => t.paymentType === paymentFilter);
    if (selectedUserId) filtered = filtered.filter((t) => t.userId === selectedUserId);
    if (dateFilter) filtered = filtered.filter((t) => dayjs((t.time as Timestamp).toDate()).format('YYYY-MM-DD') === dateFilter);

    setFilteredTransactions(filtered);
    updateTotalAmount(filtered);
  }, [transactions, paymentFilter, selectedUserId, dateFilter]);

  const updateTotalAmount = (data: TransactionData[]) => {
    const total = data.reduce((sum, transaction) => sum + transaction.total, 0);
    setTotalAmount(total);
  };

  useEffect(() => {
    filterTransactions();
  }, [paymentFilter, selectedUserId, dateFilter, filterTransactions]);

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) color += letters[Math.floor(Math.random() * 16)];
    return color;
  };

  if (!isAdmin) return null;

  return (
    <div className="flex bg-white min-h-screen text-indigo-900">
      <div className="w-64">
        <SideNavbar />
      </div>
      <div className="dashboard flex-grow p-8">
        <h1 className="text-2xl font-bold mb-6">Monthly Sales Data</h1>
        
        {salesData.length > 0 && (
          <Line
            data={{ labels, datasets: salesData }}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Total Sales by User (Per Month)' },
              },
            }}
          />
        )}

        <h2 className="text-xl font-semibold mt-10">Transaction Filters</h2>
        <div className="flex space-x-4 mb-4">
          <div>
            <label>Payment Method:</label>
            <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="p-2 border">
              <option value="">All</option>
              <option value="QRIS">QRIS</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
          <div>
            <label>User Name:</label>
            <select 
              value={selectedUserId} 
              onChange={(e) => setSelectedUserId(e.target.value)} 
              className="p-2 border"
            >
              <option value="">All Users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Date:</label>
            <input 
              type="date" 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)} 
              className="p-2 border"
            />
          </div>
        </div>

        <h3 className="text-lg font-bold mb-2">Total Sales: {totalAmount}</h3>
        <table className="min-w-full border-collapse border">
          <thead>
            <tr>
              <th className="border p-2">Customer Name</th>
              <th className="border p-2">Payment Method</th>
              <th className="border p-2">Time</th>
              <th className="border p-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="border p-2">{transaction.custName}</td>
                <td className="border p-2">{transaction.paymentType}</td>
                <td className="border p-2">{dayjs((transaction.time as Timestamp).toDate()).format('YYYY-MM-DD')}</td>
                <td className="border p-2">{transaction.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

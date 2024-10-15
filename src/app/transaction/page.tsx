'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import dayjs from 'dayjs'; 
import SideNavbar from '../components/SideNavbar';
import { redirect } from 'next/navigation';
import { db } from '../firebase';

interface TransactionData {
  id: string;
  custName: string;
  paymentType: string;
  time: Timestamp;
  total: number;
}

export default function Transaction() {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionData[]>([]);
  const [sortType, setSortType] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD')); 
  const [totalNominal, setTotalNominal] = useState<number>(0); 
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/signin');
    },
  });

  useEffect(() => {
    const fetchUserId = async () => {
      if (session?.user?.email) {
        const usersQuery = query(
          collection(db, 'users'),
          where('email', '==', session.user.email)
        );
        const querySnapshot = await getDocs(usersQuery);
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          setUserId(userDoc.id);
        }
      }
    };

    fetchUserId();
  }, [session?.user?.email]);

  const fetchAllTransactions = useCallback(async () => {
    if (userId) {
      const q = query(collection(db, 'transactions'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const allTransactions: TransactionData[] = [];

      querySnapshot.forEach((doc) => {
        allTransactions.push({
          id: doc.id,
          ...doc.data(),
        } as TransactionData);
      });

      setTransactions(allTransactions);
      setFilteredTransactions(allTransactions); 
      updateTotalNominal(allTransactions); 
    }
  }, [userId]); 

  useEffect(() => {
    fetchAllTransactions();
  }, [fetchAllTransactions]);

  const updateTotalNominal = (data: TransactionData[]) => {
    const total = data.reduce((sum, transaction) => sum + transaction.total, 0);
    setTotalNominal(total);
  };

  const filterTransactions = useCallback(() => {
    let filtered = transactions;

    if (sortType) {
      filtered = filtered.filter((t) => t.paymentType === sortType);
    }

    if (selectedDate) {
      filtered = filtered.filter((t) =>
        dayjs((t.time as Timestamp).toDate()).format('YYYY-MM-DD') === selectedDate
      );
    }

    setFilteredTransactions(filtered);
    updateTotalNominal(filtered); 
  }, [transactions, sortType, selectedDate]);

  useEffect(() => {
    filterTransactions();
  }, [sortType, selectedDate, filterTransactions]);

  return (
    <div className="flex min-h-screen bg-white text-black">
      <div className="w-64">
        <SideNavbar />
      </div>
      <div className="w-5/6 flex flex-col p-8">
        <h1 className="text-2xl font-bold mb-4">Transactions</h1>
        <div className="flex flex-row mb-4">
          <div className="mr-4">
            <label className="mr-2">Filter by Payment Method:</label>
            <select
              value={sortType || ''}
              onChange={(e) => setSortType(e.target.value)}
              className="p-2 border border-gray-300 rounded"
            >
              <option value="">All</option>
              <option value="QRIS">QRIS</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
          <div className="mr-4">
            <label className="mr-2">Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="p-2 border border-gray-300 rounded"
            />
          </div>
        </div>
        <div className="transaction-table">
          <h2 className="text-lg font-semibold mb-2">Total Nominal: Rp {totalNominal}</h2>
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 font-semibold">Customer Name</th>
                <th className="border p-2 font-semibold">Payment Method</th>
                <th className="border p-2 font-semibold">Time</th>
                <th className="border p-2 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="border p-2">{transaction.custName}</td>
                  <td className="border p-2">{transaction.paymentType}</td>
                  <td className="border p-2">
                    {dayjs(transaction.time.toDate()).format('DD-MM-YYYY')}
                  </td>
                  <td className="border p-2">Rp {transaction.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

Transaction.requireAuth = true;

// src/views/TransactionView.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import SideNavbar from '../components/SideNavbar';
import { fetchUserTransactions, filterTransactions } from '../controllers/transactionController';
import dayjs from 'dayjs';
import { redirect } from 'next/navigation';
import { TransactionData } from '../models/transactionModel'; // pastikan ini diimpor

export default function TransactionView() {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionData[]>([]);
  const [sortType, setSortType] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [totalNominal, setTotalNominal] = useState<number>(0);
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/signin');
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      if (session?.user?.email) {
        const { transactions, totalNominal = 0 } = await fetchUserTransactions(session.user.email);
        setTransactions(transactions);
        setFilteredTransactions(transactions);
        setTotalNominal(totalNominal || 0); // Pastikan totalNominal memiliki nilai 0 jika undefined
      }
    };

    fetchData();
  }, [session?.user?.email]);

  const applyFilter = useCallback(() => {
    const { filtered, totalNominal = 0 } = filterTransactions(transactions, sortType, selectedDate);
    setFilteredTransactions(filtered);
    setTotalNominal(totalNominal || 0); // Pastikan totalNominal memiliki nilai 0 jika undefined
  }, [transactions, sortType, selectedDate]);

  useEffect(() => {
    applyFilter();
  }, [sortType, selectedDate, applyFilter]);

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
            <select value={sortType || ''} onChange={(e) => setSortType(e.target.value)} className="p-2 border border-gray-300 rounded">
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

TransactionView.requireAuth = true;

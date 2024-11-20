// src/controllers/transactionController.ts
import { TransactionData, getTransactionsByUserId, getUserIdByEmail } from '../models/transactionModel';
import { Timestamp } from 'firebase/firestore';
import dayjs from 'dayjs';

export const fetchUserTransactions = async (email: string) => {
  const userId = await getUserIdByEmail(email);
  if (!userId) return { transactions: [], total: 0 };

  const transactions = await getTransactionsByUserId(userId);
  const totalNominal = calculateTotalNominal(transactions);

  return { transactions, totalNominal };
};

export const filterTransactions = (transactions: TransactionData[], sortType: string | null, selectedDate: string) => {
  let filtered = transactions;
  
  if (sortType) filtered = filtered.filter((t) => t.paymentType === sortType);
  if (selectedDate) filtered = filtered.filter((t) =>
    dayjs((t.time as Timestamp).toDate()).format('YYYY-MM-DD') === selectedDate
  );

  return { filtered, totalNominal: calculateTotalNominal(filtered) };
};

const calculateTotalNominal = (transactions: TransactionData[]) => 
  transactions.reduce((sum, transaction) => sum + transaction.total, 0);

// src/models/transactionModel.ts
import { db } from '../firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

export interface TransactionData {
  id: string;
  custName: string;
  paymentType: string;
  time: Timestamp;
  total: number;
}

export const getUserIdByEmail = async (email: string) => {
  const usersQuery = query(collection(db, 'users'), where('email', '==', email));
  const querySnapshot = await getDocs(usersQuery);
  return !querySnapshot.empty ? querySnapshot.docs[0].id : null;
};

export const getTransactionsByUserId = async (userId: string) => {
  const q = query(collection(db, 'transactions'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  const transactions: TransactionData[] = [];
  querySnapshot.forEach((doc) =>
    transactions.push({ id: doc.id, ...doc.data() } as TransactionData)
  );
  return transactions;
};

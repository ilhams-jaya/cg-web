import React, { useEffect, useState, useCallback } from "react"; 
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  addDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDoc,
} from "firebase/firestore";
import { useSession } from "next-auth/react";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  itemId: string; // Tambahkan itemId agar bisa referensi ke menu
}

export default function Checkout() {
  const { data: session } = useSession();
  const [userId, setUserId] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [custName, setCustName] = useState("");
  const [discount, setDiscount] = useState(0); // State untuk diskon
  const [paymentType, setPaymentType] = useState("QRIS");
  const [cashAmount, setCashAmount] = useState<number | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      if (session?.user?.email) {
        const usersQuery = query(
          collection(db, "users"),
          where("email", "==", session.user.email)
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

  useEffect(() => {
    if (userId) {
      const q = query(collection(db, "cart"), where("userId", "==", userId));
      const unsubscribeFirestore = onSnapshot(q, (querySnapshot) => {
        const cartData: CartItem[] = [];
        querySnapshot.forEach((doc) => {
          cartData.push({ ...doc.data(), id: doc.id } as CartItem);
        });
        localStorage.setItem("cartItems", JSON.stringify(cartData));
        setCartItems(cartData);
      });
      return () => unsubscribeFirestore();
    } else {
      setCartItems([]);
    }
  }, [userId]);

  useEffect(() => {
    const storedCartItems = localStorage.getItem("cartItems");
    if (storedCartItems) {
      setCartItems(JSON.parse(storedCartItems));
    }
  }, []);

  const calculateTotalPrice = useCallback((items: CartItem[], discount: number) => {
    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const fixPrice = total - discount;
    return fixPrice > 0 ? fixPrice : 0; // Pastikan total tidak negatif
  }, []);

  useEffect(() => {
    setTotalPrice(calculateTotalPrice(cartItems, discount));
  }, [cartItems, discount, calculateTotalPrice]); 

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    const updatedItems = cartItems.map((item) =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );

    setCartItems(updatedItems);
    localStorage.setItem("cartItems", JSON.stringify(updatedItems));

    const itemRef = doc(db, "cart", itemId);
    updateDoc(itemRef, { quantity: newQuantity });
  };

  const handlePayment = () => {
    setShowModal(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteDoc(doc(db, "cart", itemId));
  
      const updatedItems = cartItems.filter((item) => item.id !== itemId);
      setCartItems(updatedItems);
      localStorage.setItem("cartItems", JSON.stringify(updatedItems));
  
      toast.success("Item has been successfully removed from the cart.")
      
    } catch (error) {
      toast.error("Error removing item ");
    }
  };

  const handleConfirmPayment = async () => {
    if (paymentType === "Cash" && cashAmount !== null) {
      const change = cashAmount - totalPrice;
      Swal.fire({
        title: "Change Amount",
        text: `Change: Rp.${change}`,
        icon: "success",
      });
    } else {
      Swal.fire({
        title: `Payment Success`,
        text: `QRIS : Rp.${totalPrice}`,
        icon: "success",
      });
    }

    try {
      // Membuat transaksi baru di Firestore
      await addDoc(collection(db, "transactions"), {
        custName: custName,
        paymentType: paymentType,
        time: new Date(),
        total: totalPrice,
        userId: userId,
      });

      // Mengambil semua item dari cart
      const cartQuery = query(
        collection(db, "cart"),
        where("userId", "==", userId)
      );
      const cartSnapshot = await getDocs(cartQuery);

      const batch = writeBatch(db);

      // Update stok pada koleksi menu dan hapus item dari cart
      for (const docSnapshot of cartSnapshot.docs) {
        const cartItem = docSnapshot.data();
        const menuDocRef = doc(db, "menus", cartItem.itemId);
        const menuSnapshot = await getDoc(menuDocRef);

        if (menuSnapshot.exists()) {
          const menuData = menuSnapshot.data();
          const updatedStock = menuData.stock - cartItem.quantity;

          if (updatedStock >= 0) {
            batch.update(menuDocRef, { stock: updatedStock });
          } else {
            console.error("Not enough stock for", cartItem.name);
            // Tambahkan handling jika stok tidak cukup
          }
        }

        batch.delete(docSnapshot.ref); // Hapus item dari cart
      }

      await batch.commit(); // Eksekusi semua operasi dalam batch

      setShowModal(false);
      setCartItems([]);
      localStorage.removeItem("cartItems");
    } catch (error) {
      console.error("Error during transaction: ", error);
    }
  };
  return (
    <>
      <div className="checkout p-8 h-full bg-white border-l-2 border-gray-300 w-1/4 fixed">
        <div className="checkout-header">
          <h1 className="text-2xl font-bold">Checkout</h1>
          <input
            type="text"
            value={custName}
            onChange={(e) => setCustName(e.target.value)}
            placeholder="Add Customer Name"
            className="border rounded-md p-2 w-full mt-2"
          />
          <input
            type="number"
            onChange={(e) => setDiscount(parseFloat(e.target.value))}
            placeholder="Enter Discount"
            className="border rounded-md p-2 w-full mt-2"
          />
        </div>
        <div className="checkout-items mt-4 overflow-y-auto" style={{ paddingBottom: '80px', maxHeight: 'calc(100vh - 160px)' }}>
        {cartItems.length > 0 ? (
          cartItems.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center mb-4 shadow p-2 border rounded-md"
            >
              <div>
                <h2 className="font-bold">{item.name}</h2>
                <p>Rp.{item.price}</p>
                <p>Total Price: Rp.{item.price * item.quantity}</p>
              </div>
              <div className="flex items-center">
                <button
                  className="bg-gray-300 px-2 rounded"
                  onClick={() =>
                    handleQuantityChange(item.id, item.quantity - 1)
                  }
                >
                  -
                </button>
                <span className="mx-2">{item.quantity}</span>
                <button
                  className="bg-gray-300 px-2 rounded"
                  onClick={() =>
                    handleQuantityChange(item.id, item.quantity + 1)
                  }
                >
                  +
                </button>
                <button
                  className="text-red-600 ml-4"
                  onClick={() => handleDeleteItem(item.id)}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No items in cart.</p>
        )}
      </div>
        <div className="checkout-price flex flex-row justify-between items-center bg-white p-4 border-t absolute bottom-0 left-0 w-full">
          <span className="font-bold text-lg">Total: Rp.{totalPrice}</span>
          <button
            className="py-3 px-9 bg-indigo-600 text-white rounded-md"
            onClick={handlePayment}
          >
            Payment
          </button>
        </div>
      </div>

      {showModal && (
        <div className="modal bg-black bg-opacity-50 fixed inset-0 flex items-center justify-center">
          <div className="bg-white p-8 rounded-md">
            <h2 className="text-lg font-bold">Confirm Payment</h2>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="border rounded-md p-2 w-full mt-2"
            >
              <option value="QRIS">QRIS</option>
              <option value="Cash">Cash</option>
            </select>

            {paymentType === "Cash" && (
              <input
                type="number"
                value={cashAmount ?? ""}
                onChange={(e) => setCashAmount(parseFloat(e.target.value))}
                placeholder="Enter cash amount"
                className="border rounded-md p-2 w-full mt-2"
              />
            )}
            

            <div className="flex justify-end mt-4">
              <button
                className="py-2 px-6 bg-indigo-600 text-white rounded-md mr-4"
                onClick={handleConfirmPayment}
              >
                Confirm Payment
              </button>
              <button
                className="px-6 py-2 bg-gray-300 rounded-md"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faPause,
  faRedo,
  faTrash,
  faEdit,
} from "@fortawesome/free-solid-svg-icons";
import SideNavbar from "../components/SideNavbar";
import Checkout from "../components/Checkout";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

interface Stopwatch {
  id: string;
  name: string;
  cost: number;
  running: boolean;
  time: number;
  startTime?: number | null;
  userId: string;
}

interface CartItem {
  userId: string;
  itemId: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

export default function Stopwatch() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [stopwatches, setStopwatches] = useState<Stopwatch[]>([]);
  const [newStopwatch, setNewStopwatch] = useState({ name: "", cost: 0 });
  const [editStopwatch, setEditStopwatch] = useState<Stopwatch | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const { data: session } = useSession();
  const [userId, setUserId] = useState<string | null>(null);

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
      const q = query(
        collection(db, "stopwatches"),
        where("userId", "==", userId)
      );

      const unsubscribeFirestore = onSnapshot(q, (querySnapshot) => {
        const stopwatchesData: Stopwatch[] = [];
        querySnapshot.forEach((doc) => {
          stopwatchesData.push({ ...doc.data(), id: doc.id } as Stopwatch);
        });
        setStopwatches(stopwatchesData);
      });

      return () => unsubscribeFirestore();
    } else {
      setStopwatches([]);
    }
  }, [userId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStopwatches((prevStopwatches) =>
        prevStopwatches.map((sw) => {
          if (sw.running) {
            return {
              ...sw,
              time: sw.time + (Date.now() - (sw.startTime || 0)),
              startTime: Date.now(),
            };
          }
          return sw;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSave = async () => {
    if (newStopwatch.name && newStopwatch.cost && userId) {
      const docRef = await addDoc(collection(db, "stopwatches"), {
        ...newStopwatch,
        userId: userId,
        running: false,
        time: 0,
      });
      setStopwatches([
        ...stopwatches,
        {
          id: docRef.id,
          ...newStopwatch,
          userId: userId,
          running: false,
          time: 0,
        },
      ]);
      setIsModalOpen(false);
      setNewStopwatch({ name: "", cost: 0 });
    }
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "stopwatches", id));
    setStopwatches(stopwatches.filter((sw) => sw.id !== id));
  };

  const handlePlayPause = async (id: string) => {
    const stopwatch = stopwatches.find((sw) => sw.id === id);
    if (stopwatch) {
      const updatedStopwatch = {
        ...stopwatch,
        running: !stopwatch.running,
        startTime: !stopwatch.running ? Date.now() : null,
      };
      await updateDoc(doc(db, "stopwatches", id), updatedStopwatch);
      setStopwatches(
        stopwatches.map((sw) => (sw.id === id ? updatedStopwatch : sw))
      );
    }
  };

  const handleReset = async (id: string) => {
    await updateDoc(doc(db, "stopwatches", id), {
      time: 0,
      running: false,
      startTime: null,
    });
    setStopwatches(
      stopwatches.map((sw) =>
        sw.id === id ? { ...sw, time: 0, running: false, startTime: null } : sw
      )
    );
  };

  const handleEditStopwatch = async () => {
    if (editStopwatch) {
      const { id, name, cost, time } = editStopwatch;
      const updatedStopwatch = { ...editStopwatch, name, cost, time };
      await updateDoc(doc(db, "stopwatches", id), updatedStopwatch);
      setStopwatches(
        stopwatches.map((sw) => (sw.id === id ? updatedStopwatch : sw))
      );
      setIsEditModalOpen(false);
      setEditStopwatch(null);
    }
  };

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600000);
    const minutes = Math.floor((time % 3600000) / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  };

  const parseTime = (hours: number, minutes: number, seconds: number) => {
    return hours * 3600000 + minutes * 60000 + seconds * 1000;
  };

  const addToCart = async (sw: Stopwatch) => {
    if (userId) {
      const price = Number(((sw.cost / 3600000) * sw.time).toFixed(0));
      const cartItem: CartItem = {
        userId: userId,
        itemId: sw.id,
        name: sw.name,
        price: price,
        imageUrl: "",
        quantity: 1,
      };

      try {
        await addDoc(collection(db, "cart"), cartItem);

        setCart([...cart, cartItem]);
        toast.success(`${sw.name} has been added to your cart.`);
      } catch (error) {
        console.error("Error adding to cart: ", error);
      }
    }
  };

  return (
    <>
      <div className="flex bg-white text-indigo-900 min-h-screen">
        <div className="w-64">
          <SideNavbar />
        </div>
        <div className="stopwatch flex-grow p-8">
          <div className="stopwatch-header flex flex-row justify-between items-center">
            <h1 className="font-bold text-2xl">Stopwatch</h1>
            <button
              className="px-6 py-3 bg-indigo-600 text-white rounded-md"
              onClick={() => setIsModalOpen(true)}
            >
              Add Stopwatch
            </button>
          </div>

          <div className="stopwatch-container grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-8">
            {stopwatches
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((sw) => (
              <div
                key={sw.id}
                className={`stopwatch-card border-4 rounded-md p-4 relative ${
                  sw.running ? "border-indigo-400" : "border-gray-200"
                }`}
              >
                <button
                  className="absolute top-2 right-2 text-red-600"
                  onClick={() => handleDelete(sw.id!)}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
                <h2 className="text-lg font-bold mt-2 text-center">
                  {sw.name}
                </h2>
                <div className="text-3xl mt-4 mb-2 text-center font-bold">
                  {formatTime(sw.time)}
                </div>
                <p className="text-gray-600 text-center">Rp{sw.cost}/hour</p>
                <div className="flex space-x-4 mb-2 mt-2 justify-center">
                  <button
                    className={`${
                      sw.running ? "bg-red-500" : "bg-green-500"
                    } text-white px-4 py-2 rounded-md`}
                    onClick={() => handlePlayPause(sw.id)}
                  >
                    <FontAwesomeIcon icon={sw.running ? faPause : faPlay} />
                  </button>
                  <button
                    className="text-white bg-yellow-500 py-2 px-4 rounded-md"
                    onClick={() => handleReset(sw.id)}
                  >
                    <FontAwesomeIcon icon={faRedo} />
                  </button>
                  <button
                    className="text-white bg-blue-500 py-2 px-4 rounded-md"
                    onClick={() => {
                      setEditStopwatch(sw);
                      setIsEditModalOpen(true);
                    }}
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                </div>
                <div className="flex justify-center">
                  <button
                    className="text-white bg-indigo-600 py-2 px-4 rounded-md mt-4"
                    onClick={() => addToCart(sw)}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="w-1/4">
          <Checkout />
        </div>
      </div>

      {isModalOpen && (
        <div className="modal fixed inset-0 flex items-center justify-center z-50">
          <div className="modal-overlay absolute inset-0 bg-gray-900 opacity-50"></div>
          <div className="modal-container bg-white w-11/12 md:max-w-md mx-auto rounded shadow-lg z-50 overflow-y-auto">
            <div className="modal-content p-6">
              <h2 className="text-xl font-bold mb-4 text-black">
                Add New Stopwatch
              </h2>
              <input
                type="text"
                className="w-full p-2 mb-4 border border-gray-300 rounded text-black"
                placeholder="Name"
                value={newStopwatch.name}
                onChange={(e) =>
                  setNewStopwatch({ ...newStopwatch, name: e.target.value })
                }
              />
              <input
                type="number"
                className="w-full p-2 mb-4 border border-gray-300 rounded text-black"
                placeholder="Cost per Hour"
                value={newStopwatch.cost || ""}
                onChange={(e) =>
                  setNewStopwatch({
                    ...newStopwatch,
                    cost: parseInt(e.target.value, 10),
                  })
                }
              />
              <div className="flex justify-end">
                <button
                  className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-indigo-600 text-white px-4 py-2 rounded"
                  onClick={handleSave}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && editStopwatch && (
        <div className="modal fixed inset-0 flex items-center justify-center z-50">
          <div className="modal-overlay absolute inset-0 bg-gray-900 opacity-50"></div>
          <div className="modal-container bg-white w-11/12 md:max-w-md mx-auto rounded shadow-lg z-50 overflow-y-auto">
            <div className="modal-content p-6">
              <h2 className="text-xl font-bold mb-4 text-black">
                Edit Stopwatch
              </h2>
              <input
                type="text"
                className="w-full p-2 mb-4 border border-gray-300 rounded text-black"
                placeholder="Name"
                value={editStopwatch.name}
                onChange={(e) =>
                  setEditStopwatch({ ...editStopwatch, name: e.target.value })
                }
              />
              <input
                type="number"
                className="w-full p-2 mb-4 border border-gray-300 rounded text-black"
                placeholder="Cost per Hour"
                value={editStopwatch.cost}
                onChange={(e) =>
                  setEditStopwatch({
                    ...editStopwatch,
                    cost: parseInt(e.target.value, 10),
                  })
                }
              />
              <div className="flex justify-end">
                <button
                  className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-indigo-600 text-white px-4 py-2 rounded"
                  onClick={handleEditStopwatch}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

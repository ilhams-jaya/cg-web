"use client";
import SideNavbar from "../components/SideNavbar";
import Checkout from "../components/Checkout";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
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
import {
  faPlay,
  faPause,
  faRedo,
  faTrash,
  faEdit,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";
import { useCart } from "react-use-cart";

interface Timer {
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

export default function Timer() {
  const { data: session } = useSession();
  const [timers, setTimers] = useState<Timer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTimerId, setEditTimerId] = useState<string | null>(null);
  const [newTimer, setNewTimer] = useState({
    name: "",
    cost: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [userId, setUserId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
      const q = query(collection(db, "timers"), where("userId", "==", userId));

      const unsubscribeFirestore = onSnapshot(q, (querySnapshot) => {
        const timerData: Timer[] = [];
        querySnapshot.forEach((doc) => {
          timerData.push({ ...doc.data(), id: doc.id } as Timer);
        });
        setTimers(timerData);
      });

      return () => unsubscribeFirestore();
    } else {
      setTimers([]);
    }
  }, [userId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prevTimers) =>
        prevTimers.map((timer) => {
          if (timer.running) {
            const elapsedTime = Math.floor(
              (Date.now() - (timer.startTime || 0)) / 1000
            );
            const newTime = timer.time - elapsedTime;

            if (newTime <= 0) {
              handleTimerEnd(timer);
              return { ...timer, time: 0, running: false };
            }

            return { ...timer, time: newTime };
          }
          return timer;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [timers]);

  const handleTimerEnd = (timer: Timer) => {
    if (audioRef.current) {
      audioRef.current.muted = false;
      audioRef.current.play();
    }

    Swal.fire({
      title: `Timer "${timer.name}" has finished!`,
      text: "Click OK to stop the notification.",
      icon: "info",
      allowOutsideClick: false,
      allowEscapeKey: false,
      confirmButtonText: "OK",
    }).then(() => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    });
  };

  const handleSave = async () => {
    if (newTimer.name && newTimer.cost) {
      const totalTimeInSeconds =
        newTimer.hours * 3600 + newTimer.minutes * 60 + newTimer.seconds;

      const timerData = {
        name: newTimer.name,
        cost: newTimer.cost,
        running: false,
        time: totalTimeInSeconds,
        startTime: null,
        userId: userId!,
      };

      if (editTimerId) {
        const timerRef = doc(db, "timers", editTimerId);
        await updateDoc(timerRef, timerData);
      } else {
        await addDoc(collection(db, "timers"), timerData);
      }

      setNewTimer({ name: "", cost: 0, hours: 0, minutes: 0, seconds: 0 });
      setIsModalOpen(false);
      setEditTimerId(null);
    }
  };

  const handlePlayPause = async (timer: Timer) => {
    const timerRef = doc(db, "timers", timer.id);

    if (timer.running) {
      const elapsedTime = Math.floor(
        (Date.now() - (timer.startTime || 0)) / 1000
      );
      await updateDoc(timerRef, {
        running: false,
        time: timer.time - elapsedTime,
        startTime: null,
      });
    } else {
      await updateDoc(timerRef, {
        running: true,
        startTime: Date.now(),
      });

      if (audioRef.current) {
        audioRef.current.muted = true;
        audioRef.current.play().catch(() => {
          // Handle play rejection silently
        });
      }
    }
  };

  const handleReset = async (timer: Timer) => {
    const timerRef = doc(db, "timers", timer.id);
    await updateDoc(timerRef, {
      running: false,
      time: 0,
      startTime: null,
    });
  };

  const handleEdit = (timer: Timer) => {
    const hours = Math.floor(timer.time / 3600);
    const minutes = Math.floor((timer.time % 3600) / 60);
    const seconds = timer.time % 60;

    setNewTimer({
      name: timer.name,
      cost: timer.cost,
      hours,
      minutes,
      seconds,
    });
    setEditTimerId(timer.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (timerId: string) => {
    await deleteDoc(doc(db, "timers", timerId));
  };

  const addToCart = async (timer: Timer) => {
    if (userId) {
      const price = Number(((timer.cost / 3600) * timer.time).toFixed(0));
      const cartItem: CartItem = {
        userId: userId,
        itemId: timer.id,
        name: timer.name,
        price: price,
        imageUrl: "",
        quantity: 1,
      };

      try {
        await addDoc(collection(db, "cart"), cartItem);

        setCart((prevCart) => [...prevCart, cartItem]);
      } catch (error) {
        console.error("Error adding to cart: ", error);
      }
    }
  };

  return (
    <>
      <div className="flex bg-white min-h-screen text-indigo-900">
        <div className="w-64">
          <SideNavbar />
        </div>
        <div className="flex-grow p-8">
          <div className="timer-header flex flex-row justify-between items-center mb-4">
            <h1 className="font-bold text-2xl">Timer</h1>
            <button
              className="px-6 py-3 bg-indigo-600 text-white rounded-md"
              onClick={() => setIsModalOpen(true)}
            >
              Add Timer
            </button>
          </div>

          <div className="timers-container grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-8">
            {timers
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((timer) => (
                <div
                  key={timer.id}
                  className={`border-4 rounded-md p-4 relative bg-white shadow ${
                    timer.running ? "border-indigo-400" : "border-gray-200"
                  }`} 
                >
                  <button
                    className="absolute top-2 right-2 text-red-600"
                    onClick={() => handleDelete(timer.id!)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                  <h2 className="text-center mt-4 text-lg font-bold">
                    {timer.name}
                  </h2>
                  <p className="text-center text-md text-gray-600">
                    Rp.{timer.cost}/hour
                  </p>
                  <div className="text-3xl font-bold text-center my-4">
                    {new Date(timer.time * 1000).toISOString().substr(11, 8)}
                  </div>
                  <div className="flex space-x-2 justify-center">
                    <button
                      className={`${
                        timer.running ? "bg-red-500" : "bg-green-500"
                      } text-white px-4 py-2 rounded-md`}
                      onClick={() => handlePlayPause(timer)}
                    >
                      <FontAwesomeIcon
                        icon={timer.running ? faPause : faPlay}
                      />
                    </button>
                    <button
                      className="bg-yellow-500 text-white px-4 py-2 rounded-md"
                      onClick={() => handleReset(timer)}
                    >
                      <FontAwesomeIcon icon={faRedo} />
                    </button>
                    <button
                      className="bg-blue-500 text-white px-4 py-2 rounded-md"
                      onClick={() => handleEdit(timer)}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                  </div>

                  <div className="flex justify-center">
                    <button
                      className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md"
                      onClick={() => addToCart(timer)}
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
                {editTimerId ? "Edit Timer" : "Add New Timer"}
              </h2>
              <input
                type="text"
                className="w-full p-2 mb-4 border border-gray-300 rounded text-black"
                placeholder="Name"
                value={newTimer.name}
                onChange={(e) =>
                  setNewTimer({ ...newTimer, name: e.target.value })
                }
              />
              <input
                type="number"
                className="w-full p-2 mb-4 border border-gray-300 rounded text-black"
                placeholder="Cost per Hour"
                value={newTimer.cost || ""}
                onChange={(e) =>
                  setNewTimer({ ...newTimer, cost: Number(e.target.value) })
                }
              />
              <div className="flex justify-between space-x-2 mb-4">
                <input
                  type="number"
                  className="w-full p-2 mb-4 border border-gray-300 rounded text-black"
                  placeholder="Hours"
                  value={newTimer.hours || ""}
                  onChange={(e) =>
                    setNewTimer({ ...newTimer, hours: Number(e.target.value) })
                  }
                />
                <input
                  type="number"
                  className="w-full p-2 mb-4 border border-gray-300 rounded text-black"
                  placeholder="Minutes"
                  value={newTimer.minutes || ""}
                  onChange={(e) =>
                    setNewTimer({
                      ...newTimer,
                      minutes: Number(e.target.value),
                    })
                  }
                />
                <input
                  type="number"
                  className="w-full p-2 mb-4 border border-gray-300 rounded text-black"
                  placeholder="Seconds"
                  value={newTimer.seconds || ""}
                  onChange={(e) =>
                    setNewTimer({
                      ...newTimer,
                      seconds: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="flex justify-end">
                <button
                  className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditTimerId(null);
                  }}
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
    </>
  );
}

Timer.requireAuth = true;

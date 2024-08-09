'use client';
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
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

interface Stopwatch {
  id: string;
  name: string;
  cost: number;
  running: boolean;
  time: number; // time in milliseconds
  startTime?: number; // start time in milliseconds since epoch
  userId: string;
}

export default function Stopwatch() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [stopwatches, setStopwatches] = useState<Stopwatch[]>([]);
  const [newStopwatch, setNewStopwatch] = useState({ name: "", cost: 0 });
  const [editStopwatch, setEditStopwatch] = useState<Stopwatch | null>(null);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchStopwatches = async () => {
      const querySnapshot = await getDocs(collection(db, "stopwatches"));
      const fetchedStopwatches = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Stopwatch[];
      setStopwatches(fetchedStopwatches);
    };

    fetchStopwatches();
  }, []);

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
    if (newStopwatch.name && newStopwatch.cost && user) {
      const docRef = await addDoc(collection(db, "stopwatches"), {
        ...newStopwatch,
        userId: user.uid,
        running: false,
        time: 0,
      });
      setStopwatches([
        ...stopwatches,
        {
          id: docRef.id,
          ...newStopwatch,
          userId: user.uid,
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
        startTime: !stopwatch.running ? Date.now() : undefined,
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
      startTime: undefined,
    });
    setStopwatches(
      stopwatches.map((sw) =>
        sw.id === id
          ? { ...sw, time: 0, running: false, startTime: undefined }
          : sw
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
              className="px-6 py-3 bg-indigo-800 text-white rounded-md"
              onClick={() => setIsModalOpen(true)}
            >
              Add Stopwatch
            </button>
          </div>

          <div className="stopwatch-container grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-8">
            {stopwatches.map((sw) => (
              <div
                key={sw.id}
                className="stopwatch-card border rounded-md p-4 relative"
              >
                <button
                  className="absolute top-2 right-2 text-red-600"
                  onClick={() => handleDelete(sw.id!)}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
                <h2 className="text-lg font-bold mt-2 text-center">{sw.name}</h2>
                <div className="text-3xl mt-4 mb-2 text-center font-bold">{formatTime(sw.time)}</div>
                <p className="text-gray-600 text-center">Rp{sw.cost}/hour</p>
                <div className="flex space-x-4 mb-2 mt-2 justify-center">
                  <button
                    className="text-white bg-indigo-600 py-1 px-2 rounded-md"
                    onClick={() => handlePlayPause(sw.id)}
                  >
                    <FontAwesomeIcon icon={sw.running ? faPause : faPlay} />
                  </button>
                  <button
                    className="text-white bg-indigo-600 py-1 px-2 rounded-md"
                    onClick={() => handleReset(sw.id)}
                  >
                    <FontAwesomeIcon icon={faRedo} />
                  </button>
                  <button
                    className="text-white bg-indigo-600 py-1 px-2 rounded-md"
                    onClick={() => {
                      setEditStopwatch(sw);
                      setIsEditModalOpen(true);
                    }}
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                </div>
                <div className="mt-4 flex justify-center items-center">
                  <button className="text-white px-4 py-2 bg-indigo-600 rounded-md">
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="w-2/6">
          <Checkout />
        </div>
      </div>

      {/* Add New Stopwatch Modal */}
      {isModalOpen && (
        <div className="modal fixed inset-0 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white text-black p-8 rounded-md w-1/3 border-2">
            <h2 className="text-2xl font-bold mb-4">Add New Stopwatch</h2>
            <input
              type="text"
              name="name"
              placeholder="Stopwatch Name"
              className="border p-2 mb-4 w-full"
              value={newStopwatch.name}
              onChange={(e) =>
                setNewStopwatch({ ...newStopwatch, name: e.target.value })
              }
            />
            <input
              type="number"
              name="cost"
              placeholder="Stopwatch Cost/hour"
              className="border p-2 mb-4 w-full"
              value={newStopwatch.cost}
              onChange={(e) =>
                setNewStopwatch({
                  ...newStopwatch,
                  cost: Number(e.target.value),
                })
              }
            />
            <div className="flex justify-end">
              <button
                className="px-6 py-2 bg-indigo-800 text-white rounded-md mr-4"
                onClick={handleSave}
              >
                Save
              </button>
              <button
                className="px-6 py-2 bg-gray-300 rounded-md"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Stopwatch Modal */}
      {isEditModalOpen && editStopwatch && (
        <div className="modal fixed inset-0 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white text-black p-8 rounded-md w-1/3 border-2">
            <h2 className="text-2xl font-bold mb-4">Edit Stopwatch</h2>
            <input
              type="text"
              name="name"
              placeholder="Stopwatch Name"
              className="border p-2 mb-4 w-full"
              value={editStopwatch.name}
              onChange={(e) =>
                setEditStopwatch({ ...editStopwatch, name: e.target.value })
              }
            />
            <input
              type="number"
              name="cost"
              placeholder="Stopwatch Cost/hour"
              className="border p-2 mb-4 w-full"
              value={editStopwatch.cost}
              onChange={(e) =>
                setEditStopwatch({
                  ...editStopwatch,
                  cost: Number(e.target.value),
                })
              }
            />
            <div className="flex space-x-4">
              <input
                type="number"
                name="hours"
                placeholder="Hours"
                className="border p-2 mb-4 w-full"
                value={Math.floor(editStopwatch.time / 3600000)}
                onChange={(e) =>
                  setEditStopwatch({
                    ...editStopwatch,
                    time: parseTime(
                      Number(e.target.value),
                      Math.floor((editStopwatch.time % 3600000) / 60000),
                      Math.floor((editStopwatch.time % 60000) / 1000)
                    ),
                  })
                }
              />
              <input
                type="number"
                name="minutes"
                placeholder="Minutes"
                className="border p-2 mb-4 w-full"
                value={Math.floor((editStopwatch.time % 3600000) / 60000)}
                onChange={(e) =>
                  setEditStopwatch({
                    ...editStopwatch,
                    time: parseTime(
                      Math.floor(editStopwatch.time / 3600000),
                      Number(e.target.value),
                      Math.floor((editStopwatch.time % 60000) / 1000)
                    ),
                  })
                }
              />
              <input
                type="number"
                name="seconds"
                placeholder="Seconds"
                className="border p-2 mb-4 w-full"
                value={Math.floor((editStopwatch.time % 60000) / 1000)}
                onChange={(e) =>
                  setEditStopwatch({
                    ...editStopwatch,
                    time: parseTime(
                      Math.floor(editStopwatch.time / 3600000),
                      Math.floor((editStopwatch.time % 3600000) / 60000),
                      Number(e.target.value)
                    ),
                  })
                }
              />
            </div>
            <div className="flex justify-end">
              <button
                className="px-6 py-2 bg-indigo-800 text-white rounded-md mr-4"
                onClick={handleEditStopwatch}
              >
                Save
              </button>
              <button
                className="px-6 py-2 bg-gray-300 rounded-md"
                onClick={() => setIsEditModalOpen(false)}
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

Stopwatch.requireAuth = true;

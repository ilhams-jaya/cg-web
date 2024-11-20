"use client"
import React, { useState } from "react";
import Countdown, { CountdownRenderProps } from "react-countdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause, faRedo } from "@fortawesome/free-solid-svg-icons";

interface Timer {
  id: number;
  name: string;
  duration: number; // in milliseconds
  running: boolean;
  startTime: number | null; // timestamp of when the timer was started
  remaining: number; // remaining time in milliseconds
}

const MultiTimer = () => {
  const [timers, setTimers] = useState<Timer[]>([]);
  const [newTimer, setNewTimer] = useState({
    name: "",
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const addTimer = () => {
    const duration =
      (newTimer.hours * 3600 + newTimer.minutes * 60 + newTimer.seconds) * 1000;

    if (newTimer.name && duration > 0) {
      setTimers([
        ...timers,
        {
          id: Date.now(),
          name: newTimer.name,
          duration,
          running: false,
          startTime: null,
          remaining: duration,
        },
      ]);
      setNewTimer({ name: "", hours: 0, minutes: 0, seconds: 0 });
    }
  };

  const toggleTimer = (id: number) => {
    setTimers((prevTimers) =>
      prevTimers.map((timer) => {
        if (timer.id === id) {
          if (timer.running) {
            // Pause
            return {
              ...timer,
              running: false,
              remaining:
                timer.remaining -
                (Date.now() - (timer.startTime || Date.now())),
              startTime: null,
            };
          } else {
            // Start
            return {
              ...timer,
              running: true,
              startTime: Date.now(),
            };
          }
        }
        return timer;
      })
    );
  };

  const resetTimer = (id: number) => {
    setTimers((prevTimers) =>
      prevTimers.map((timer) =>
        timer.id === id
          ? {
              ...timer,
              running: false,
              remaining: timer.duration,
              startTime: null,
            }
          : timer
      )
    );
  };

  const removeTimer = (id: number) => {
    setTimers((prevTimers) => prevTimers.filter((timer) => timer.id !== id));
  };

  return (
    <div className="container mx-auto p-6 text-black">
      <h1 className="text-2xl font-bold mb-4">Multi Timer</h1>

      {/* Add New Timer */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Timer Name"
          className="border p-2 mr-2"
          value={newTimer.name}
          onChange={(e) => setNewTimer({ ...newTimer, name: e.target.value })}
        />
        <input
          type="number"
          placeholder="Hours"
          className="border p-2 mr-2"
          value={newTimer.hours || ""}
          onChange={(e) =>
            setNewTimer({ ...newTimer, hours: parseInt(e.target.value, 10) })
          }
        />
        <input
          type="number"
          placeholder="Minutes"
          className="border p-2 mr-2"
          value={newTimer.minutes || ""}
          onChange={(e) =>
            setNewTimer({ ...newTimer, minutes: parseInt(e.target.value, 10) })
          }
        />
        <input
          type="number"
          placeholder="Seconds"
          className="border p-2 mr-2"
          value={newTimer.seconds || ""}
          onChange={(e) =>
            setNewTimer({ ...newTimer, seconds: parseInt(e.target.value, 10) })
          }
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={addTimer}
        >
          Add Timer
        </button>
      </div>

      {/* List of Timers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {timers.map((timer) => (
          <div
            key={timer.id}
            className="p-4 border rounded shadow bg-white flex flex-col items-center"
          >
            <h2 className="text-lg font-bold">{timer.name}</h2>
            <div className="text-2xl font-mono my-4">
              <Countdown
                key={timer.id}
                date={Date.now() + timer.remaining}
                autoStart={false}
                controlled={timer.running}
                onComplete={() => resetTimer(timer.id)}
                renderer={({ hours, minutes, seconds }: CountdownRenderProps) => (
                  <span>
                    {String(hours).padStart(2, "0")}:
                    {String(minutes).padStart(2, "0")}:
                    {String(seconds).padStart(2, "0")}
                  </span>
                )}
              />
            </div>
            <div className="flex space-x-2">
              <button
                className={`px-4 py-2 rounded text-white ${
                  timer.running ? "bg-red-500" : "bg-green-500"
                }`}
                onClick={() => toggleTimer(timer.id)}
              >
                <FontAwesomeIcon icon={timer.running ? faPause : faPlay} />
              </button>
              <button
                className="bg-yellow-500 px-4 py-2 rounded text-white"
                onClick={() => resetTimer(timer.id)}
              >
                <FontAwesomeIcon icon={faRedo} />
              </button>
              <button
                className="bg-gray-500 px-4 py-2 rounded text-white"
                onClick={() => removeTimer(timer.id)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiTimer;

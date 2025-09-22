// src/pages/Home.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  const [meetingCode, setMeetingCode] = useState("");
  const navigate = useNavigate();

  // 🔹 Create Meeting
  const createMeeting = () => {
    const newRoomId = uuidv4(); // random unique ID
    navigate(`/room/${newRoomId}`);
  };

  // 🔹 Join Meeting
  const joinMeeting = () => {
    if (meetingCode.trim()) {
      navigate(`/room/${meetingCode.trim()}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 space-y-4">
      <h1 className="text-2xl font-bold">Welcome to Video Call App</h1>

      <button
        onClick={createMeeting}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg"
      >
        Create Meeting
      </button>

      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="Enter Meeting Code"
          value={meetingCode}
          onChange={(e) => setMeetingCode(e.target.value)}
          className="border p-2 rounded"
        />
        <button
          onClick={joinMeeting}
          className="px-4 py-2 bg-green-500 text-white rounded-lg"
        >
          Join
        </button>
      </div>
    </div>
  );
}

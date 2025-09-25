// src/pages/Home.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import socket from "../utils/socket"; // import your socket instance

export default function Home() {
  const [meetingCode, setMeetingCode] = useState("");
  const [name, setName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isHost, setIsHost] = useState(false);

  const navigate = useNavigate();

  // Open modal for creating meeting
  const handleCreateMeeting = () => {
    setIsHost(true);
    setShowModal(true);
  };

  // Open modal for joining meeting
  const handleJoinMeeting = () => {
    setIsHost(false);
    setShowModal(true);
  };

  // Confirm action for both create/join
  const confirmAction = () => {
    if (!name.trim()) return;

    if (isHost) {
      // Create meeting
      console.log("Creating meeting...");
      const roomId = uuidv4();
      
      // ✅ Emit createRoom to server
      socket.emit("createRoom", { roomId, name });
      
      // Listen for room creation confirmation
      socket.once("roomCreated", () => {
        navigate(`/call/${roomId}`, { state: { name, isHost: true } });
      });
      
    } else {
      // Join meeting: send request to host
      if (!meetingCode.trim()) return;
      const roomId = meetingCode.trim();

      socket.emit("requestToJoin", { roomId, name });
      console.log("Requesting to join meeting...");
      
      // Wait for host to accept
      socket.once("joinResponse", (data) => {
        if (data.allow) {
          navigate(`/call/${roomId}`, { state: { name, isHost: false } });
        } else {
          alert("Your request to join was rejected.");
        }
      });
      
      // Handle room not found
      socket.once("roomNotFound", () => {
        alert("Meeting room not found. Please check the meeting ID.");
      });
    }

    setShowModal(false);
    setName("");
    setMeetingCode("");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 space-y-6 border border-solid border-black">
      <h1 className="text-2xl font-bold mb-8">Welcome to Video Call App</h1>

      <div className="flex space-x-4">
        <button
          onClick={handleCreateMeeting}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600"
        >
          Create Meeting
        </button>

        <button
          onClick={handleJoinMeeting}
          className="px-6 py-3 bg-green-500 text-white rounded-lg shadow-lg hover:bg-green-600"
        >
          Join Meeting
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80">
            {!isHost && (
              <input
                type="text"
                placeholder="Meeting Code"
                value={meetingCode}
                onChange={(e) => setMeetingCode(e.target.value)}
                className="w-full border p-2 rounded mb-3"
              />
            )}
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border p-2 rounded mb-4"
            />

            <div className="flex justify-between">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`px-4 py-2 rounded ${
                  isHost ? "bg-blue-500" : "bg-green-500"
                } text-white`}
              >
                {isHost ? "Create" : "Request Join"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  
}
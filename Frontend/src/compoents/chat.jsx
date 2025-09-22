// src/components/Chat.js
import React from "react";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import socket from "../utils/socket";
import { X } from "lucide-react";

// const socket = io("http://localhost:5000"); // backend URL

export default function Chat({setShowChat}) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Listen for messages
    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, { text: msg, from: "other" }]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, []);

  const sendMessage = () => {
    if (message.trim() === "") return;

    // Show my own message
    setMessages((prev) => [...prev, { text: message, from: "me" }]);

    // Send to backend
    socket.emit("sendMessage", message);

    setMessage("");
  };

  return (
    <div className="w-80 bg-white shadow-lg flex flex-col justify-between h-full">
      {/* Chat Header */}
      <div
        onClick={() => setShowChat(false)}
        className="flex items-center space-x-2 justify-end p-4 cursor-pointer"
      >
        <X className="w-6 h-6 text-gray-600" />
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`mb-2 p-2 rounded-lg max-w-[70%] ${
              msg.from === "me"
                ? "bg-blue-500 text-white self-end ml-auto"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type here..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

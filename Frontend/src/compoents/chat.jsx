// src/components/Chat.js
import { useState } from "react";
import React from "react";

export default function Chat() {
  const [message, setMessage] = useState("");

  return (
    <div className="w-80 bg-white shadow-lg flex flex-col justify-between">
      {/* Chat Header */}
      <div className="flex items-center space-x-2 justify-end p-4">
        <span className="text-sm text-gray-500">Chat</span>
        <button className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">
          <span className="text-xs">×</span>
        </button>
      </div>

      {/* Chat Input */}
      <div className="p-4 ">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type here..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setMessage("")}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

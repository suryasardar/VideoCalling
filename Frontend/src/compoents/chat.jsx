// src/components/Chat.js
import React from "react";
import { useState, useEffect } from "react";
import socket from "../utils/socket";
import { X } from "lucide-react";

export default function Chat({ setShowChat }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Listen for messages
    socket.on("receiveMessage", (msgData) => {
      console.log("Received message:", msgData); // Debug log
      
      // Handle both old and new message formats
      const messageText = typeof msgData === 'string' ? msgData : msgData.text;
      const senderName = typeof msgData === 'object' ? msgData.name : 'Other User';
      
      setMessages((prev) => [...prev, { 
        text: messageText, 
        from: "other",
        name: senderName,
        timestamp: Date.now()
      }]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, []);

  const sendMessage = (e) => {
    if (e) e.preventDefault();
    if (message.trim() === "") return;

    // Show my own message
    setMessages((prev) => [...prev, { 
      text: message, 
      from: "me",
      name: "You",
      timestamp: Date.now()
    }]);

    // Send to backend
    socket.emit("sendMessage", message);
    setMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage(e);
    }
  };

  return (
    <div className="w-80 bg-white shadow-lg flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 ">
        <h3 className="text-lg font-semibold">Chat</h3>
        <button
          onClick={() => setShowChat(false)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2">
        {messages.length === 0 ? (
          <div className="text-gray-500 text-center text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={`${msg.timestamp}-${i}`}
              className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  msg.from === "me"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                {msg.from !== "me" && (
                  <div className="text-xs opacity-75 mb-1">{msg.name}</div>
                )}
                <div className="text-sm">{msg.text}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Chat Input */}
      <div className="p-2 border-t">
        <form onSubmit={sendMessage} className="flex space-x-1">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1  py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-2 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
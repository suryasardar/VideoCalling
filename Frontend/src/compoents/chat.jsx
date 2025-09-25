// src/components/Chat.js
import React from "react";
import { useState, useEffect, useRef } from "react";
import socket from "../utils/socket";
import { X } from "lucide-react";

export default function Chat({ setShowChat }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Listen for messages
    const handleReceiveMessage = (msgData) => {
      console.log("Received message:", msgData);
      
      // Handle the message format from server: {text, name}
      const messageText = msgData.text || msgData;
      const senderName = msgData.name || 'Anonymous';
      
      setMessages((prev) => [...prev, { 
        text: messageText, 
        from: "other",
        name: senderName,
        timestamp: Date.now()
      }]);
    };

    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, []);

  const sendMessage = (e) => {
    if (e) e.preventDefault();
    if (message.trim() === "") return;

    const newMessage = {
      text: message, 
      from: "me",
      name: "You",
      timestamp: Date.now()
    };

    // Show my own message immediately
    setMessages((prev) => [...prev, newMessage]);

    // Send to backend
    socket.emit("sendMessage", message);
    setMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  return (
    <div className="w-80 bg-white shadow-lg flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-800">Chat</h3>
        <button
          onClick={() => setShowChat(false)}
          className="p-1 hover:bg-gray-200 rounded transition-colors cursor-pointer"
          title="Close chat"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <div className="text-gray-500 text-center text-sm mt-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div
                key={`${msg.timestamp}-${i}`}
                className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg shadow-sm ${
                    msg.from === "me"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {msg.from !== "me" && (
                    <div className="text-xs opacity-75 mb-1 font-medium">
                      {msg.name}
                    </div>
                  )}
                  <div className="text-sm break-words">{msg.text}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t bg-gray-50">
        <form onSubmit={sendMessage} className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className={`px-1 py-2 rounded-lg transition-colors ${
              message.trim()
                ? "bg-blue-500 hover:bg-blue-600 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
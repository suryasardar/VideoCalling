// src/pages/Home.js
import Sidebar from "../compoents/Sidebar";
import VideoCall from "../compoents/VideoCall";
import Chat from "../compoents/chat";
import React from "react";
import { useState } from "react";

export default function Home() {
      const [showChat, setShowChat] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <VideoCall onToggleChat={() => setShowChat(!showChat)} />
      {showChat && <Chat />}
    </div>
  );
}

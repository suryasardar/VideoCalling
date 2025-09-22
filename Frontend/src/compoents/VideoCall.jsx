// src/compoents/VideoCall.jsx
import { useState, useRef } from "react";
import { useParams } from "react-router-dom"; // ✅ added
import { Video, Mic, Phone, MessageSquare } from "lucide-react";
import VideoPlayer from "./VideoPlayer";
import React from "react";
import Sidebar from "./Sidebar";
import Chat from "./chat";

export default function VideoCall({ onToggleChat }) {
  const { meetingId } = useParams(); // ✅ read meetingId
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const playerRef = useRef(null);

  return (
    <div className="flex flex-col h-screen bg-gray-900 relative">
      {/* <Sidebar /> */}
      {/* WebRTC logic */}
      <VideoPlayer
        ref={playerRef}
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        isMuted={isMuted}
        isVideoOff={isVideoOff}
      />
      {/* Meeting Link (for sharing like Google Meet) */}
      <div className="absolute top-2 left-2 bg-white px-3 py-1 rounded shadow text-sm">
        Meeting ID: {meetingId}
      </div>

      {/* Remote Video */}
      <div className="h-full pt-20 pb-20 px-4 flex items-center justify-center">
        <div className="relative w-full max-w-5xl h-full bg-gray-800 rounded-lg overflow-hidden">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Local Video */}
      <div className="absolute bottom-24 right-6 w-32 h-24 bg-gray-700 rounded-lg overflow-hidden">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white px-1 text-xs rounded">
          You
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-white p-4">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer ${
              isVideoOff ? "bg-red-500" : "bg-gray-200"
            }`}
          >
            <Video
              className={`w-6 h-6 ${
                isVideoOff ? "text-white" : "text-gray-600"
              }`}
            />
          </button>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer ${
              isMuted ? "bg-red-500" : "bg-gray-200"
            }`}
          >
            <Mic
              className={`w-6 h-6 ${isMuted ? "text-white" : "text-gray-600"}`}
            />
          </button>
          <button
            onClick={() => setShowChat(!showChat)}
            className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer"
          >
            <MessageSquare className="w-6 h-6 text-gray-600" />
          </button>
          <button
            onClick={() => playerRef.current?.startCall()}
            className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center cursor-pointer"
          >
            <Phone className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {showChat && (
        <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-lg">
          <Chat setShowChat={setShowChat} />
        </div>
      )}
    </div>
  );
}

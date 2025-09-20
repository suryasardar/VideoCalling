import { useState, useRef } from "react";
import { Video, Mic, Phone, MessageSquare, ChevronLeft } from "lucide-react";
import VideoPlayer from "./VideoPlayer";
import React from "react";

export default function VideoCall({ onToggleChat }) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const playerRef = useRef(null);

  return (
    <div className="flex-1 bg-gray-900 relative">
      {/* WebRTC logic */}
      <VideoPlayer
        ref={playerRef}
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        isMuted={isMuted}
        isVideoOff={isVideoOff}
      />

      {/* Remote Video */}
      <div className="h-full pt-16 pb-20 px-4 flex items-center justify-center">
        <div className="relative w-full max-w-2xl h-full bg-gray-800 rounded-lg overflow-hidden">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Local Video */}
      <div className="absolute bottom-24 right-6 w-32 h-24 bg-gray-700 rounded-lg overflow-hidden">
        <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white px-1 text-xs rounded">
          You
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-white p-4">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isVideoOff ? "bg-red-500" : "bg-gray-200"
            }`}
          >
            <Video className={`w-6 h-6 ${isVideoOff ? "text-white" : "text-gray-600"}`} />
          </button>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isMuted ? "bg-red-500" : "bg-gray-200"
            }`}
          >
            <Mic className={`w-6 h-6 ${isMuted ? "text-white" : "text-gray-600"}`} />
          </button>
          <button
            onClick={onToggleChat}
            className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center"
          >
            <MessageSquare className="w-6 h-6 text-gray-600" />
          </button>
          <button
            onClick={() => playerRef.current?.startCall()}
            className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center"
          >
            <Phone className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

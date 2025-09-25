// src/components/VideoCall.jsx
import { useState, useRef, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Video, Mic, Phone, MessageSquare, PhoneOff } from "lucide-react";
import VideoPlayer from "./VideoPlayer";
import Chat from "./chat";
import socket from "../utils/socket";
import React from "react";

export default function VideoCall() {
  const { meetingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { name, isHost } = location.state;

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [isCallActive, setIsCallActive] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const playerRef = useRef(null);

  // Listen for join requests (host only)
  useEffect(() => {
    if (!isHost) return;

    socket.on("joinRequest", (data) => {
      setJoinRequests((prev) => [...prev, data]);
    });

    return () => {
      socket.off("joinRequest");
    };
  }, [isHost]);

  // Listen for call status changes
  useEffect(() => {
    const handleUserJoined = () => {
      setIsCallActive(true);
    };

    const handleUserLeft = () => {
      setIsCallActive(false);
      // Clear remote video
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    };

    const handleHostLeft = () => {
      alert("Host has left the meeting");
      navigate("/");
    };

    socket.on("userJoined", handleUserJoined);
    socket.on("userLeft", handleUserLeft);
    socket.on("hostLeft", handleHostLeft);

    return () => {
      socket.off("userJoined", handleUserJoined);
      socket.off("userLeft", handleUserLeft);
      socket.off("hostLeft", handleHostLeft);
    };
  }, [navigate]);

  const handleRequest = (request, allow) => {
    socket.emit("respondToJoin", {
      allow,
      to: request.socketId,
      roomId: meetingId,
    });
    setJoinRequests((prev) =>
      prev.filter((r) => r.socketId !== request.socketId)
    );
  };

  const handleStartCall = () => {
    if (playerRef.current?.startCall) {
      playerRef.current.startCall();
      setIsCallActive(true);
    }
  };

  const handleEndCall = () => {
    // Disconnect from the call and go back to home
    if (playerRef.current?.endCall) {
      playerRef.current.endCall();
    }

    // Emit leave room event
    socket.emit("leaveRoom", { roomId: meetingId, name });

    // Navigate back to home
    navigate("/");
  };

  const handleRestartConnection = () => {
    if (playerRef.current?.restartConnection) {
      playerRef.current.restartConnection();
    }
  };

  console.log(isHost, name, meetingId, "call status:", isCallActive);

  return (
    <div className="flex flex-col h-screen bg-gray-900 relative">
      {/* Video Player logic */}
      <VideoPlayer
        ref={playerRef}
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        name={name}
      />

      {/* Meeting ID */}
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
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 text-sm rounded">
            {isCallActive ? "Remote User" : "No remote video"}
          </div>
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
          {name} (You)
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-white p-4 flex justify-center space-x-4">
        <button
          onClick={() => setIsVideoOff(!isVideoOff)}
          className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer ${
            isVideoOff ? "bg-red-500" : "bg-gray-200"
          }`}
          title={isVideoOff ? "Turn on camera" : "Turn off camera"}
        >
          <Video
            className={`w-6 h-6 ${isVideoOff ? "text-white" : "text-gray-600"}`}
          />
        </button>

        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer ${
            isMuted ? "bg-red-500" : "bg-gray-200"
          }`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          <Mic
            className={`w-6 h-6 ${isMuted ? "text-white" : "text-gray-600"}`}
          />
        </button>

        <button
          onClick={() => setShowChat(!showChat)}
          className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer"
          title="Toggle chat"
        >
          <MessageSquare className="w-6 h-6 text-gray-600" />
        </button>

        <button
          onClick={handleEndCall}
          className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center cursor-pointer"
          title="End call"
        >
          <PhoneOff className="w-6 h-6 text-white" />
        </button>

        <button
          onClick={handleRestartConnection}
          className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center cursor-pointer"
          title="Restart connection"
        >
          <span className="text-white text-lg">↻</span>
        </button>
      </div>

      {showChat && (
        <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-lg z-40 cursor-pointer">
          <Chat setShowChat={setShowChat} />
        </div>
      )}

      {/* Join Requests Modal (host only) */}
      {isHost && joinRequests.length > 0 && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Join Requests</h2>
            {joinRequests.map((req) => (
              <div
                key={req.socketId}
                className="flex justify-between items-center mb-2"
              >
                <span>{req.name}</span>
                <div className="space-x-2">
                  <button
                    onClick={() => handleRequest(req, true)}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 cursor-pointer"
                  >
                    Admit
                  </button>
                  <button
                    onClick={() => handleRequest(req, false)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

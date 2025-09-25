// src/components/VideoPlayer.jsx
import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import socket from "../utils/socket";
import React from "react";

// Enhanced RTC configuration with TURN servers
const rtcConfig = {
  iceServers: [
    // Multiple STUN servers
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    
    // Free TURN servers for relay connections
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject"
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject", 
      credential: "openrelayproject"
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject"
    }
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: 'balanced',
  rtcpMuxPolicy: 'require'
};

const VideoPlayer = forwardRef(
  ({ localVideoRef, remoteVideoRef, isMuted, isVideoOff, name }, ref) => {
    const { meetingId } = useParams();
    const location = useLocation();
    const { isHost } = location.state || {};
    
    const pcRef = useRef(null);
    const streamRef = useRef(null);
    const hasJoinedRoom = useRef(false);
    const iceCandidateQueue = useRef([]);
    const connectionAttempts = useRef(0);
    const maxAttempts = 3;

    // Join room when component mounts
    useEffect(() => {
      if (meetingId && !hasJoinedRoom.current) {
        console.log("Joining room:", meetingId);
        socket.emit("joinRoom", meetingId);
        hasJoinedRoom.current = true;
      }
    }, [meetingId]);

    // Handle mute/video toggle
    useEffect(() => {
      if (streamRef.current) {
        const stream = streamRef.current;
        stream.getAudioTracks().forEach((track) => (track.enabled = !isMuted));
        stream.getVideoTracks().forEach((track) => (track.enabled = !isVideoOff));
      }
    }, [isMuted, isVideoOff]);

    // Create peer connection
    const createPeerConnection = (stream) => {
      const pc = new RTCPeerConnection(rtcConfig);
      
      // Add local tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log("Received remote track:", event.track.kind);
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // ICE candidate handling
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log(`Sending ICE candidate: ${event.candidate.type} - ${event.candidate.protocol}`);
          socket.emit("ice-candidate", {
            candidate: event.candidate,
            roomId: meetingId
          });
        } else {
          console.log("ICE gathering completed");
        }
      };

      // Connection state monitoring with retry logic
      pc.onconnectionstatechange = () => {
        console.log("Connection state:", pc.connectionState);
        if (pc.connectionState === 'failed' && connectionAttempts.current < maxAttempts) {
          console.log(`Connection failed, attempting retry ${connectionAttempts.current + 1}/${maxAttempts}`);
          connectionAttempts.current++;
          setTimeout(() => restartConnection(), 2000);
        } else if (pc.connectionState === 'connected') {
          console.log("WebRTC connection established successfully!");
          connectionAttempts.current = 0;
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log("ICE connection state:", pc.iceConnectionState);
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          console.log("ICE connection successful!");
        }
      };

      pc.onicegatheringstatechange = () => {
        console.log("ICE gathering state:", pc.iceGatheringState);
      };

      return pc;
    };

    // Setup media & peer connection
    useEffect(() => {
      let isMounted = true;

      const initializeMedia = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 640, max: 1280 },
              height: { ideal: 480, max: 720 },
              frameRate: { ideal: 15, max: 30 }
            }, 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          
          if (!isMounted) return;
          
          streamRef.current = stream;
          
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }

          const pc = createPeerConnection(stream);
          pcRef.current = pc;

          // Setup signaling listeners
          setupSignalingListeners();

        } catch (error) {
          console.error("Error accessing media devices:", error);
        }
      };

      initializeMedia();

      return () => {
        isMounted = false;
        cleanup();
      };
    }, [meetingId, localVideoRef, remoteVideoRef]);

    const setupSignalingListeners = () => {
      // Handle incoming offer
      socket.on("offer", async (data) => {
        try {
          console.log("Received offer from:", data.name);
          const pc = pcRef.current;
          if (!pc || pc.signalingState !== "stable") {
            console.log("PeerConnection not ready for offer");
            return;
          }
          
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          
          // Process any queued ICE candidates
          while (iceCandidateQueue.current.length > 0) {
            const candidate = iceCandidateQueue.current.shift();
            try {
              await pc.addIceCandidate(candidate);
              console.log("Added queued ICE candidate");
            } catch (e) {
              console.error("Error adding queued candidate:", e);
            }
          }
          
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          
          socket.emit("answer", {
            answer: answer,
            roomId: meetingId,
            name: name
          });
          console.log("Sent answer");
        } catch (error) {
          console.error("Error handling offer:", error);
        }
      });

      // Handle incoming answer
      socket.on("answer", async (data) => {
        try {
          console.log("Received answer from:", data.name);
          const pc = pcRef.current;
          if (!pc) return;
          
          if (pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            console.log("Set remote description from answer");
            
            // Process any queued ICE candidates
            while (iceCandidateQueue.current.length > 0) {
              const candidate = iceCandidateQueue.current.shift();
              try {
                await pc.addIceCandidate(candidate);
                console.log("Added queued ICE candidate");
              } catch (e) {
                console.error("Error adding queued candidate:", e);
              }
            }
          }
        } catch (error) {
          console.error("Error handling answer:", error);
        }
      });

      // Handle ICE candidates
      socket.on("ice-candidate", async (data) => {
        try {
          const pc = pcRef.current;
          if (!pc) return;
          
          const candidate = new RTCIceCandidate(data.candidate);
          
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(candidate);
            console.log(`Added ICE candidate: ${candidate.type || 'unknown'}`);
          } else {
            console.log("Queueing ICE candidate - no remote description yet");
            iceCandidateQueue.current.push(candidate);
          }
        } catch (error) {
          console.error("Error adding ICE candidate:", error);
        }
      });

      // Handle user joined
      socket.on("userJoined", (data) => {
        console.log("User joined:", data.name);
        if (isHost) {
          setTimeout(() => {
            startCall();
          }, 3000); // Increased delay for better reliability
        }
      });
    };

    // Restart connection function
    const restartConnection = async () => {
      try {
        console.log("Restarting connection...");
        if (!pcRef.current || !streamRef.current) return;
        
        const pc = pcRef.current;
        if (pc.signalingState === "stable") {
          const offer = await pc.createOffer({ iceRestart: true });
          await pc.setLocalDescription(offer);
          
          socket.emit("offer", {
            offer: offer,
            roomId: meetingId,
            name: name
          });
          console.log("Sent restart offer");
        }
      } catch (error) {
        console.error("Error restarting connection:", error);
      }
    };

    // Start call function
    const startCall = async () => {
      if (!pcRef.current) {
        console.warn("PeerConnection not ready yet");
        return;
      }
      
      try {
        console.log("Starting call...");
        const pc = pcRef.current;
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        await pc.setLocalDescription(offer);
        
        socket.emit("offer", {
          offer: offer,
          roomId: meetingId,
          name: name
        });
        console.log("Sent offer");
      } catch (error) {
        console.error("Error starting call:", error);
      }
    };

    // Cleanup function
    const cleanup = () => {
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Remove event listeners
      socket.off("offer");
      socket.off("answer"); 
      socket.off("ice-candidate");
      socket.off("userJoined");
    };

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      startCall,
      restartConnection,
      endCall: cleanup
    }));

    return null;
  }
);

export default VideoPlayer;
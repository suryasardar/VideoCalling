// src/components/VideoPlayer.jsx
import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import socket from "../utils/socket";
// Enhanced TURN configuration
const turnConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" }
  ],
  iceCandidatePoolSize: 10
};
import React from "react";

const VideoPlayer = forwardRef(
  ({ localVideoRef, remoteVideoRef, isMuted, isVideoOff, name }, ref) => {
    const { meetingId } = useParams();
    const location = useLocation();
    const { isHost } = location.state || {};
    
    const pcRef = useRef(null);
    const streamRef = useRef(null);
    const hasJoinedRoom = useRef(false);

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

    // Setup media & peer connection
    useEffect(() => {
      let isMounted = true;

      const initializeMedia = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
          });
          
          if (!isMounted) return;
          
          streamRef.current = stream;
          
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }

          // Create peer connection
          const pc = new RTCPeerConnection(turnConfig);
          pcRef.current = pc;

          // Add local tracks to peer connection
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

          // Handle ICE candidates
          pc.onicecandidate = (event) => {
            if (event.candidate) {
              console.log("Sending ICE candidate:", event.candidate.type);
              socket.emit("ice-candidate", {
                candidate: event.candidate,
                roomId: meetingId
              });
            } else {
              console.log("ICE gathering completed");
            }
          };

          // Connection state logging with reconnection logic
          pc.onconnectionstatechange = () => {
            console.log("Connection state:", pc.connectionState);
            if (pc.connectionState === 'failed') {
              console.log("Connection failed, attempting restart...");
              restartIce(pc);
            }
          };

          pc.oniceconnectionstatechange = () => {
            console.log("ICE connection state:", pc.iceConnectionState);
            if (pc.iceConnectionState === 'failed') {
              console.log("ICE connection failed, restarting ICE...");
              restartIce(pc);
            }
          };

          pc.onicegatheringstatechange = () => {
            console.log("ICE gathering state:", pc.iceGatheringState);
          };

          // Setup signaling listeners
          setupSignalingListeners(pc);

        } catch (error) {
          console.error("Error accessing media devices:", error);
        }
      };

      const setupSignalingListeners = (pc) => {
        // Handle incoming offer
        socket.on("offer", async (data) => {
          try {
            console.log("Received offer from:", data.name);
            if (pc.signalingState !== "stable") {
              console.log("PeerConnection not in stable state, ignoring offer");
              return;
            }
            
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
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
            if (pc.signalingState === "have-local-offer") {
              await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
              console.log("Set remote description from answer");
            }
          } catch (error) {
            console.error("Error handling answer:", error);
          }
        });

        // Handle ICE candidates with queuing
        const iceCandidateQueue = [];
        let remoteDescriptionSet = false;

        socket.on("ice-candidate", async (data) => {
          try {
            const candidate = new RTCIceCandidate(data.candidate);
            
            if (pc.remoteDescription && pc.remoteDescription.type) {
              await pc.addIceCandidate(candidate);
              console.log("Added ICE candidate:", candidate.type || 'unknown');
              remoteDescriptionSet = true;
              
              // Process queued candidates
              while (iceCandidateQueue.length > 0) {
                const queuedCandidate = iceCandidateQueue.shift();
                await pc.addIceCandidate(queuedCandidate);
                console.log("Added queued ICE candidate");
              }
            } else {
              console.log("Queueing ICE candidate - no remote description yet");
              iceCandidateQueue.push(candidate);
            }
          } catch (error) {
            console.error("Error adding ICE candidate:", error);
          }
        });

        // Handle user joined (for auto-starting call)
        socket.on("userJoined", (data) => {
          console.log("User joined:", data.name);
          // If we're the host, automatically start the call after a delay
          if (isHost) {
            setTimeout(() => {
              startCall();
            }, 2000); // Increased delay to ensure both sides are ready
          }
        });
      };

      initializeMedia();

      return () => {
        isMounted = false;
        
        // Cleanup
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
    }, [meetingId, localVideoRef, remoteVideoRef, isHost, name]);

    // ICE restart function
    const restartIce = async (pc) => {
      try {
        console.log("Attempting ICE restart...");
        const offer = await pc.createOffer({ iceRestart: true });
        await pc.setLocalDescription(offer);
        
        socket.emit("offer", {
          offer: offer,
          roomId: meetingId,
          name: name
        });
      } catch (error) {
        console.error("Error during ICE restart:", error);
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
        const offer = await pcRef.current.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        await pcRef.current.setLocalDescription(offer);
        
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

    // Expose startCall and restart methods
    useImperativeHandle(ref, () => ({
      startCall,
      restartConnection: () => restartIce(pcRef.current)
    }));

    return null;
  }
);

export default VideoPlayer;
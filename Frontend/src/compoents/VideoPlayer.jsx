import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import socket from "../utils/socket";
import turnConfig from "../utils/turnConfig";
import React from "react";

const VideoPlayer = forwardRef(({ localVideoRef, remoteVideoRef, isMuted, isVideoOff }, ref) => {
  const pcRef = useRef(null);
  const streamRef = useRef(null);

  // Mute / Video toggle
  useEffect(() => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject;
      stream.getAudioTracks().forEach(track => (track.enabled = !isMuted));
      stream.getVideoTracks().forEach(track => (track.enabled = !isVideoOff));
    }
  }, [isMuted, isVideoOff, localVideoRef]);

  // Setup media & peer connection
  useEffect(() => {
    let isMounted = true;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        if (!isMounted) return;
        streamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const pc = new RTCPeerConnection(turnConfig);
        pcRef.current = pc;

        // Add local tracks
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        // Remote stream
        pc.ontrack = event => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        // ICE candidate
        pc.onicecandidate = event => {
          if (event.candidate) socket.emit("ice-candidate", event.candidate);
        };

        // Signaling
        const handleOffer = async offer => {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("answer", answer);
        };

        const handleAnswer = async answer => {
          if (pcRef.current) {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          }
        };

        const handleIce = async candidate => {
          if (pcRef.current) {
            try {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.error("Error adding ICE candidate:", e);
            }
          }
        };

        socket.on("offer", handleOffer);
        socket.on("answer", handleAnswer);
        socket.on("ice-candidate", handleIce);

      }).catch(error => {
        console.error("Error accessing media devices:", error);
      });

    return () => {
      isMounted = false;

      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
    };
  }, [localVideoRef, remoteVideoRef]);

  // Expose startCall to parent
  useImperativeHandle(ref, () => ({
    startCall: async () => {
      if (!pcRef.current) {
        console.warn("PeerConnection not ready yet");
        return;
      }
      console.log("Starting call...");
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);
      socket.emit("offer", offer);
    }
  }));

  return null; // logic-only component
});

export default VideoPlayer;

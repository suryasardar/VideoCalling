import { io } from "socket.io-client";

const socket = io("https://videocalling-1-3ddj.onrender.com", {
  transports: ["websocket", "polling"],
});

export default socket;

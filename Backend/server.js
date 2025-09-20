import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // in prod, use your frontend URL
    methods: ["GET", "POST"]
  }
});

// 🔹 Handle connections
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("sendMessage", (message) => {
    console.log("Message received:", message);
    // Broadcast message to all other clients
    socket.broadcast.emit("receiveMessage", message);
  });

  // Relay "offer" to the other peer
  socket.on("offer", (data) => {
    console.log("Offer from", socket.id);
    socket.broadcast.emit("offer", data);
  });

  // Join a room
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`${socket.id} joined room ${roomId}`);
  });

  // Relay "answer" to the other peer
  socket.on("answer", (data) => {
    console.log("Answer from", socket.id);
    socket.broadcast.emit("answer", data);
  });

  // Relay ICE candidates
  socket.on("ice-candidate", (candidate) => {
    console.log("ICE candidate from", socket.id);
    socket.broadcast.emit("ice-candidate", candidate);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Signaling server running on http://localhost:${PORT}`);
});




 

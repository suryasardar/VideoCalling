import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // In production, restrict to your frontend URL
    methods: ["GET", "POST"]
  }
});

// 🔹 Handle socket connections
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join a specific meeting room
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    socket.roomId = roomId; // store roomId in socket instance
    console.log(`${socket.id} joined room ${roomId}`);
  });

  // Relay offer only inside the room
  socket.on("offer", (data) => {
    console.log(`Offer from ${socket.id} in room ${socket.roomId}`);
    socket.to(socket.roomId).emit("offer", data);
  });

  // Relay answer only inside the room
  socket.on("answer", (data) => {
    console.log(`Answer from ${socket.id} in room ${socket.roomId}`);
    socket.to(socket.roomId).emit("answer", data);
  });

  // Relay ICE candidates only inside the room
  socket.on("ice-candidate", (candidate) => {
    console.log(`ICE candidate from ${socket.id} in room ${socket.roomId}`);
    socket.to(socket.roomId).emit("ice-candidate", candidate);
  });

  // Optional: Simple text chat inside the same room
  socket.on("sendMessage", (message) => {
    console.log(`Message from ${socket.id} in room ${socket.roomId}:`, message);
    socket.to(socket.roomId).emit("receiveMessage", message);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`✅ Signaling server running on http://localhost:${PORT}`);
});

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Track room hosts and users
const rooms = {}; // { roomId: { hostSocketId, users: [socketIds] } }

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Create room
  socket.on("createRoom", ({ roomId, name }) => {
    socket.join(roomId);
    socket.data = { name, roomId };
    socket.isHost = true;
    
    // Initialize room with host
    rooms[roomId] = {
      hostSocketId: socket.id,
      users: [socket.id]
    };
    
    console.log(`Room ${roomId} created by ${name} (${socket.id})`);
    socket.emit("roomCreated", { roomId });
  });

  // Handle joinRoom (when user enters the call page)
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    
    // If user data exists, they were already admitted
    if (socket.data && socket.data.roomId === roomId) {
      console.log(`${socket.data.name} joined room ${roomId}`);
      
      // Notify others in the room that this user joined
      socket.to(roomId).emit("userJoined", {
        name: socket.data.name,
        socketId: socket.id
      });
    }
    // If no user data, this is the host joining their own room
    else if (rooms[roomId] && rooms[roomId].hostSocketId === socket.id) {
      console.log(`Host joined their own room ${roomId}`);
    }
  });

  // User requests to join
  socket.on("requestToJoin", ({ roomId, name }) => {
    socket.data = { name, roomId };
    
    const room = rooms[roomId];
    if (!room) {
      return socket.emit("roomNotFound");
    }

    const hostId = room.hostSocketId;
    console.log(`${name} (${socket.id}) requested to join room ${roomId}`);
    
    // Send join request to host
    io.to(hostId).emit("joinRequest", { 
      socketId: socket.id, 
      name,
      roomId 
    });
  });

  // Host responds to join
  socket.on("respondToJoin", ({ allow, to, roomId }) => {
    console.log(`Host responding to join request: allow=${allow}, to=${to}, roomId=${roomId}`);
    
    if (allow) {
      // Add user to room
      socket.join(roomId);
      
      // Add to room tracking
      if (rooms[roomId]) {
        rooms[roomId].users.push(to);
      }
      
      // Make the requesting user join the room
      const requestingSocket = io.sockets.sockets.get(to);
      if (requestingSocket) {
        requestingSocket.join(roomId);
        requestingSocket.data.roomId = roomId; // Set room ID for the user
      }
      
      io.to(to).emit("joinResponse", { allow: true });
      console.log(`Host accepted ${to} into room ${roomId}`);
    } else {
      io.to(to).emit("joinResponse", { allow: false });
      console.log(`Host rejected ${to}`);
    }
  });

  // Text chat inside the admitted room
  socket.on("sendMessage", (message) => {
    const roomId = socket.data?.roomId;
    if (!roomId) return; // only send if user is in a room
    
    // Send message to OTHER users in the room (not back to sender)
    socket.to(roomId).emit("receiveMessage", {
      text: message,
      name: socket.data?.name || "Anonymous",
    });
    
    console.log(`Message from ${socket.data?.name} in room ${roomId}: ${message}`);
  });

  // Signaling inside room
  socket.on("offer", (data) => {
    console.log(`Forwarding offer from ${data.name} in room ${data.roomId}`);
    socket.to(data.roomId).emit("offer", data);
  });
  
  socket.on("answer", (data) => {
    console.log(`Forwarding answer from ${data.name} in room ${data.roomId}`);
    socket.to(data.roomId).emit("answer", data);
  });
  
  socket.on("ice-candidate", (data) => {
    console.log(`Forwarding ICE candidate in room ${data.roomId}`);
    socket.to(data.roomId).emit("ice-candidate", data);
  });

  // Handle user leaving room
  socket.on("leaveRoom", ({ roomId, name }) => {
    console.log(`${name} is leaving room ${roomId}`);
    
    // Notify others in the room
    socket.to(roomId).emit("userLeft", {
      name: name,
      socketId: socket.id
    });
    
    // Remove user from room tracking
    if (rooms[roomId]) {
      rooms[roomId].users = rooms[roomId].users.filter(id => id !== socket.id);
    }
    
    // Leave the socket room
    socket.leave(roomId);
    
    // Clear user data
    if (socket.data) {
      socket.data.roomId = null;
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    
    const roomId = socket.data?.roomId;
    if (roomId && rooms[roomId]) {
      // If host disconnects
      if (rooms[roomId].hostSocketId === socket.id) {
        socket.to(roomId).emit("hostLeft");
        delete rooms[roomId];
        console.log(`Host left room ${roomId}, room deleted`);
      } else {
        // Remove user from room tracking
        rooms[roomId].users = rooms[roomId].users.filter(id => id !== socket.id);
        console.log(`User ${socket.id} left room ${roomId}`);
      }
    }
  });
});

const PORT = 5000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
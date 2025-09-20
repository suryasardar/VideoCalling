// src/utils/turnConfig.js
const turnConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" } // free STUN server
    // Later you can add TURN:
    // { urls: "turn:your-turn-server.com:3478", username: "user", credential: "pass" }
  ]
};

export default turnConfig;

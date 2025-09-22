// App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import VideoCall from "./compoents/VideoCall";

function App() {
   return (
    <Router>
      <Routes>
        {/* Home Page: Create / Join Meeting */}
        <Route path="/" element={<Home />} />

        {/* Video Call Page */}
        {/* here I added :meetingId param */}
        <Route path="/room/:meetingId" element={<VideoCall />} />

      </Routes>
    </Router>
  );
}

export default App;

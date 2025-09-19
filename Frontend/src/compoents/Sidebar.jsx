// src/components/Sidebar.js
import { Home, Calendar, Users, FileText, Settings } from "lucide-react";
import React from "react";

export default function Sidebar() {
  return (
    <div className="w-16 bg-white shadow-lg flex flex-col items-center py-4 space-y-4">
      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
        <Home className="w-5 h-5 text-white" />
      </div>
      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
        <Calendar className="w-5 h-5 text-purple-600" />
      </div>
      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
        <Users className="w-5 h-5 text-gray-600" />
      </div>
      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
        <FileText className="w-5 h-5 text-gray-600" />
      </div>
      <div className="flex-1"></div>
      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
        <Settings className="w-5 h-5 text-gray-600" />
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then(setStats);
  }, []);

  if (!stats) {
    return <p>Loading...</p>;
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard Admin</h1>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-800 p-4 rounded-md">
            <h2 className="text-xl text-white">Usuários Hoje</h2>
            <p className="text-2xl text-white">{stats.users}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-md">
            <h2 className="text-xl text-white">Links Buildados Hoje</h2>
            <p className="text-2xl text-white">{stats.shortners}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-md">
            <h2 className="text-xl text-white">Pastes Criados Hoje</h2>
            <p className="text-2xl text-white">3</p>
          </div>
        </div>
        <div className="mt-8">
          {/* Include your Graph Component here */}
        </div>
        <div className="mt-8">
          {/* Include the Brazil map with users per state */}
        </div>
      </div>
    </div>
  );
}

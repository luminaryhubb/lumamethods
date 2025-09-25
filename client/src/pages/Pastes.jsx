import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";

export default function Pastes() {
  const [pastes, setPastes] = useState([]);

  useEffect(() => {
    fetch("/api/admin/pastes")
      .then((res) => res.json())
      .then(setPastes);
  }, []);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">Pastes</h1>
        <div className="grid grid-cols-3 gap-4">
          {pastes.map((paste) => (
            <div className="bg-gray-800 p-4 rounded-md" key={paste.id}>
              <h2 className="text-xl text-white">{paste.title}</h2>
              <p className="text-white">{paste.content}</p>
              <p className="text-white">Views: {paste.views}</p>
              <button className="bg-red-500 text-white py-2 px-4 rounded-md mt-4">Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

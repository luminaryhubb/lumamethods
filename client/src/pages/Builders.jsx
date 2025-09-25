import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";

export default function Builders() {
  const [builders, setBuilders] = useState([]);

  useEffect(() => {
    fetch("/api/admin/builders")
      .then((res) => res.json())
      .then(setBuilders);
  }, []);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">Builders</h1>
        <div className="grid grid-cols-3 gap-4">
          {builders.map((builder) => (
            <div className="bg-gray-800 p-4 rounded-md" key={builder.id}>
              <h2 className="text-xl text-white">{builder.platform}</h2>
              <p className="text-white">Link: {builder.private_link}</p>
              <p className="text-white">Option: {builder.option_chosen}</p>
              <p className="text-white">Generated at: {builder.created_at}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

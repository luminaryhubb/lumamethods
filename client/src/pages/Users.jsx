import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";

export default function Users() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then(setUsers);
  }, []);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">Users</h1>
        <div className="grid grid-cols-3 gap-4">
          {users.map((user) => (
            <div className="bg-gray-800 p-4 rounded-md" key={user.id}>
              <h2 className="text-xl text-white">{user.username}</h2>
              <p className="text-white">Role: {user.role}</p>
              <p className="text-white">Uses Remaining: {user.uses_left}</p>
              <button className="bg-blue-500 text-white py-2 px-4 rounded-md mt-4">Add Role</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

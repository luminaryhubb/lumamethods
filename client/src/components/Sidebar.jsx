import React from "react";
import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="w-64 bg-gray-900 text-white h-screen p-6">
      <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
      <ul>
        <li>
          <Link to="/admin/dashboard" className="block py-2">Dashboard</Link>
        </li>
        <li>
          <Link to="/admin/pastes" className="block py-2">Pastes</Link>
        </li>
        <li>
          <Link to="/admin/builders" className="block py-2">Builders</Link>
        </li>
        <li>
          <Link to="/admin/users" className="block py-2">Users</Link>
        </li>
        <li>
          <Link to="/admin/config" className="block py-2">Config</Link>
        </li>
      </ul>
    </div>
  );
}

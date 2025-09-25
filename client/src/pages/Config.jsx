import React from "react";
import Sidebar from "../components/Sidebar";

export default function Config() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">Config</h1>
        <p className="text-white">Alterações de nome do site, logo, cor, manutenção, etc.</p>
      </div>
    </div>
  );
}

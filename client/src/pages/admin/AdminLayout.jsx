import React from 'react'
import { Link, Routes, Route, useNavigate } from 'react-router-dom'
import AdminDashboard from './Dashboard'
import AdminPastes from './Pastes'
import AdminConfig from './Config'
import AdminPanel from './Panel'

function getToken(){ return localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token') }

export default function AdminLayout(){
  const nav = useNavigate()
  const token = getToken()
  if (!token) { nav('/admin/login'); return null }

  function logout(){ localStorage.removeItem('admin_token'); sessionStorage.removeItem('admin_token'); nav('/admin/login') }

  return (
    <div className="grid grid-cols-12 gap-6">
      <aside className="col-span-3 bg-neutral-900 p-4 rounded-xl">
        <h3 className="font-semibold mb-4">Admin</h3>
        <nav className="space-y-2">
          <Link to="/admin" className="block p-2 bg-neutral-800 rounded">Dashboard</Link>
          <Link to="/admin/pastes" className="block p-2 bg-neutral-800 rounded">Pastes</Link>
          <Link to="/admin/config" className="block p-2 bg-neutral-800 rounded">Configurações</Link>
          <Link to="/admin/panel" className="block p-2 bg-neutral-800 rounded">Admin Panel</Link>
          <button onClick={logout} className="mt-4 px-3 py-2 bg-rose-600 rounded">Logout</button>
        </nav>
      </aside>
      <main className="col-span-9">
        <Routes>
          <Route path="/" element={<AdminDashboard/>} />
          <Route path="/pastes" element={<AdminPastes/>} />
          <Route path="/config" element={<AdminConfig/>} />
          <Route path="/panel" element={<AdminPanel/>} />
        </Routes>
      </main>
    </div>
  )
}

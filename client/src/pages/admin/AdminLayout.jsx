import React, {useEffect, useState} from 'react'
import { Link, Routes, Route, useNavigate } from 'react-router-dom'
import Dashboard from './Dashboard'
import Pastes from './Pastes'
import Users from './Users'
import Links from './Links'
import Config from './Config'
import Panel from './Panel'

export default function AdminLayout(){
  const nav = useNavigate();
  const [me,setMe]=useState(null)
  useEffect(()=>{ fetch('/api/me').then(r=>r.json()).then(d=>{ if(!d.logged) nav('/admin/login'); else setMe(d) }).catch(()=>nav('/admin/login')) },[])
  if(!me) return null
  return (
    <div className="grid grid-cols-12 gap-6">
      <aside className="col-span-3 card p-4">
        <h3 className="font-semibold mb-4">Admin</h3>
        <nav className="space-y-2">
          <Link to="/admin" className="block p-2 bg-neutral-800 rounded">Dashboard</Link>
          <Link to="/admin/pastes" className="block p-2 bg-neutral-800 rounded">Pastes</Link>
          <Link to="/admin/users" className="block p-2 bg-neutral-800 rounded">Usuários</Link>
          <Link to="/admin/links" className="block p-2 bg-neutral-800 rounded">Links</Link>
          <Link to="/admin/config" className="block p-2 bg-neutral-800 rounded">Configurações</Link>
          <Link to="/admin/panel" className="block p-2 bg-neutral-800 rounded">Admin Panel</Link>
          <a href="/auth/logout" className="block p-2 mt-4 bg-rose-600 rounded text-center">Logout</a>
        </nav>
      </aside>
      <main className="col-span-9">
        <Routes>
          <Route path="/" element={<Dashboard/>} />
          <Route path="/pastes" element={<Pastes/>} />
          <Route path="/users" element={<Users/>} />
          <Route path="/links" element={<Links/>} />
          <Route path="/config" element={<Config/>} />
          <Route path="/panel" element={<Panel/>} />
        </Routes>
      </main>
    </div>
  )
}

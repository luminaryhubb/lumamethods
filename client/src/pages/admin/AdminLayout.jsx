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
    <div className="grid" style={{display:'grid', gridTemplateColumns:'250px 1fr', gap:16}}>
      <aside className="card" style={{padding:12}}>
        <h3>Admin</h3>
        <nav style={{display:'flex',flexDirection:'column',gap:8, marginTop:8}}>
          <Link to="/admin" className="nav-btn">Dashboard</Link>
          <Link to="/admin/pastes" className="nav-btn">Pastes</Link>
          <Link to="/admin/users" className="nav-btn">Usuários</Link>
          <Link to="/admin/links" className="nav-btn">Links</Link>
          <Link to="/admin/config" className="nav-btn">Configurações</Link>
          <Link to="/admin/panel" className="nav-btn">Admin Panel</Link>
          <a href="/auth/logout" className="nav-btn" style={{background:'#ef4444', color:'#fff'}}>Logout</a>
        </nav>
      </aside>
      <main>
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

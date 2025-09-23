import React, {useEffect, useState, createContext} from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import LinkFake from './pages/LinkFake'
import Shortener from './pages/Shortener'
import ViewLink from './pages/ViewLink'
import AdminLogin from './pages/admin/Login'
import AdminLayout from './pages/admin/AdminLayout'

export const UserContext = createContext(null)

export default function App(){
  const [me, setMe] = useState(null)
  useEffect(()=>{ fetch('/api/me').then(r=>r.json()).then(d=>{ if(d.logged) setMe(d) }).catch(()=>{}) },[])
  return (
    <UserContext.Provider value={{me,setMe}}>
      <div className="container">
        <header className="header">
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <img src="/logo.gif" alt="logo" className="logo" />
            <div>
              <h1 style={{margin:0}}>Luma Methods - Best Methods</h1>
              <div style={{fontSize:13, color:'#cbd5e1'}}>Hub de métodos — login com Discord</div>
            </div>
          </div>
          <nav style={{display:'flex',gap:8}}>
            <Link to="/" className="nav-btn" style={{background:'var(--purple)'}}>Home</Link>
            <Link to="/link-fake" className="nav-btn" style={{background:'rgba(255,255,255,0.03)'}}>Link Fake</Link>
            <Link to="/shortener" className="nav-btn" style={{background:'rgba(255,255,255,0.03)'}}>Encurtador</Link>
            <Link to="/admin/login" className="nav-btn" style={{background:'rgba(255,255,255,0.03)'}}>Admin</Link>
          </nav>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<Home/>} />
            <Route path="/link-fake" element={<LinkFake/>} />
            <Route path="/shortener" element={<Shortener/>} />
            <Route path="/l/:id" element={<ViewLink/>} />
            <Route path="/s/:id" element={<ViewLink/>} />
            <Route path="/admin/login" element={<AdminLogin/>} />
            <Route path="/admin/*" element={<AdminLayout/>} />
          </Routes>
        </main>
      </div>
    </UserContext.Provider>
  )
}

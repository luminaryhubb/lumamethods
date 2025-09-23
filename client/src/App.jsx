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
    <BrowserRouter>
      <div className="container">
        <header className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <img src="/logo.gif" alt="logo" className="logo-gif"/>
            <div>
              <h1 className="text-2xl font-bold">Luma Methods - Best Methods</h1>
              <div className="text-sm text-neutral-300">Hub de métodos — login via Discord necessário</div>
            </div>
          </div>
          <nav className="flex gap-2">
            <Link to="/" className="px-3 py-1 rounded text-white" style={{background:'var(--purple)'}}>Home</Link>
            <Link to="/link-fake" className="px-3 py-1 rounded text-white bg-neutral-800">Link Fake</Link>
            <Link to="/shortener" className="px-3 py-1 rounded text-white bg-neutral-800">Encurtador</Link>
            <Link to="/admin/login" className="px-3 py-1 rounded text-white bg-neutral-800">Admin</Link>
          </nav>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<Home/>} />
            <Route path="/link-fake" element={<LinkFake/>} />
            <Route path="/shortener" element={<Shortener/>} />
            <Route path="/l/:id" element={<ViewLink/>} />
            <Route path="/admin/login" element={<AdminLogin/>} />
            <Route path="/admin/*" element={<AdminLayout/>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
    </UserContext.Provider>
  )
}

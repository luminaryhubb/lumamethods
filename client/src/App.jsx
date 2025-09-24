import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import CreatePage from './pages/CreatePage'
import ViewPage from './pages/ViewPage'
import AdminLogin from './pages/admin/Login'
import AdminLayout from './pages/admin/AdminLayout'

export default function App(){
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-neutral-900 text-white p-6">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 w-10 h-10 rounded flex items-center justify-center font-bold">LM</div>
            <h1 className="text-2xl font-bold">Luma Methods - Protected Pastes</h1>
          </div>
          <nav className="flex gap-3">
            <Link to="/" className="text-sm bg-rose-600 px-3 py-1 rounded">Create</Link>
            <Link to="/admin/login" className="text-sm bg-neutral-800 px-3 py-1 rounded">Admin</Link>
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<CreatePage/>} />
          <Route path="/paste/:id" element={<ViewPage/>} />
          <Route path="/admin/login" element={<AdminLogin/>} />
          <Route path="/admin/*" element={<AdminLayout/>} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

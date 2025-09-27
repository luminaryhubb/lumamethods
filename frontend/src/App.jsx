import React, {useEffect, useState} from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Methods from './pages/Methods'

export default function App(){
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(()=>{
    fetch('/api/auth/status').then(r=> r.ok ? r.json() : null).then(d=>{
      if(d && d.user) setUser(d.user)
    }).catch(()=>{})
  },[])

  return (
    <div className='min-h-screen bg-black text-white'>
      <Routes>
        <Route path='/' element={<Home user={user} />} />
        <Route path='/dashboard/*' element={<Dashboard user={user} setUser={setUser} />} />
        <Route path='/methods' element={<Methods />} />
      </Routes>
    </div>
  )
}

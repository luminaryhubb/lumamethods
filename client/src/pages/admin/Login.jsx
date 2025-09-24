import React, {useState} from 'react'
import { useNavigate } from 'react-router-dom'

export default function AdminLogin(){
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState(null)
  const nav = useNavigate()

  async function handleLogin(e){
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user,password})})
    const data = await res.json()
    if (data.error) return setError(data.error)
    if (remember) localStorage.setItem('admin_token', data.token)
    else sessionStorage.setItem('admin_token', data.token)
    nav('/admin')
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Admin Login</h2>
      <form onSubmit={handleLogin} className="bg-neutral-800 p-6 rounded-xl space-y-3">
        <input className="w-full p-2 bg-neutral-900 rounded" placeholder="user" value={user} onChange={e=>setUser(e.target.value)} />
        <input type="password" className="w-full p-2 bg-neutral-900 rounded" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <div className="flex items-center gap-2">
          <input type="checkbox" id="remember" checked={remember} onChange={e=>setRemember(e.target.checked)} />
          <label htmlFor="remember" className="text-sm">Lembrar de mim</label>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-rose-600 rounded">Login</button>
          {error && <div className="text-rose-400">{error}</div>}
        </div>
      </form>
    </div>
  )
}

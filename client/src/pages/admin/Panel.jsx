import React, {useState, useEffect} from 'react'
function getToken(){ return localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token') }

export default function AdminPanel(){
  const [cfg, setCfg] = useState(null)

  async function load(){
    const res = await fetch('/api/admin/config', { headers: { 'x-admin-token': getToken() } })
    const data = await res.json()
    setCfg(data)
  }
  useEffect(()=>{ load() },[])

  async function toggle(){
    const res = await fetch('/api/admin/maintenance', { method:'POST', headers:{ 'Content-Type':'application/json','x-admin-token': getToken() }, body: JSON.stringify({ allowCreation: !cfg.allowCreation }) })
    const data = await res.json(); setCfg(data.config)
  }

  if (!cfg) return null
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Admin Panel</h2>
      <div className="bg-neutral-800 p-4 rounded">
        <div className="mb-3">Allow creation: <strong>{cfg.allowCreation? 'Yes':'No'}</strong></div>
        <button className="px-3 py-2 bg-rose-600 rounded" onClick={toggle}>{cfg.allowCreation? 'Disable Creation':'Enable Creation'}</button>
      </div>
    </div>
  )
}

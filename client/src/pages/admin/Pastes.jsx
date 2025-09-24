import React, {useEffect, useState} from 'react'
function getToken(){ return localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token') }

export default function AdminPastes(){
  const [pastes, setPastes] = useState([])
  const [error, setError] = useState(null)

  async function load(){
    setError(null)
    const res = await fetch('/api/admin/pastes', { headers: { 'x-admin-token': getToken() } })
    const data = await res.json()
    if (data.error) return setError(data.error)
    setPastes(data.pastes)
  }

  useEffect(()=>{ load() },[])

  async function del(id){
    if (!confirm('Apagar paste '+id+'?')) return
    const res = await fetch('/api/admin/pastes/'+id, { method:'DELETE', headers:{ 'x-admin-token': getToken() } })
    const data = await res.json()
    if (data.error) return alert(data.error)
    load()
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Pastes</h2>
      {error && <div className="text-rose-400">{error}</div>}
      <div className="space-y-3">
        {pastes.map(p=> (
          <div key={p.id} className="bg-neutral-800 p-3 rounded flex justify-between items-start">
            <div>
              <div className="font-medium">{p.id} <span className="text-sm text-neutral-400">({p.accessesCount} views)</span></div>
              <div className="text-sm text-neutral-300 mt-2">{p.textPreview}</div>
              <div className="text-xs text-neutral-400 mt-2">Senha: <span className="font-mono">{p.password}</span></div>
            </div>
            <div className="flex flex-col gap-2">
              <button className="px-3 py-1 bg-rose-600 rounded" onClick={()=>del(p.id)}>Apagar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

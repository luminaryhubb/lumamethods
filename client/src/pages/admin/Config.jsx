import React, {useEffect, useState} from 'react'
function getToken(){ return localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token') }

export default function AdminConfig(){
  const [cfg, setCfg] = useState(null)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [color, setColor] = useState('#ef4444')

  async function load(){
    const res = await fetch('/api/admin/config', { headers: { 'x-admin-token': getToken() } })
    const data = await res.json()
    setCfg(data); setName(data.siteName); setIcon(data.icon); setColor(data.themeColor)
  }
  useEffect(()=>{ load() },[])

  async function save(){
    const res = await fetch('/api/admin/config', { method:'PUT', headers:{ 'Content-Type':'application/json','x-admin-token': getToken() }, body: JSON.stringify({ siteName: name, icon, themeColor: color }) })
    const data = await res.json()
    if (data.error) alert(data.error)
    else alert('Saved')
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Configurações</h2>
      <div className="bg-neutral-800 p-4 rounded space-y-3">
        <label className="text-sm">Nome do site</label>
        <input className="w-full p-2 bg-neutral-900 rounded" value={name} onChange={e=>setName(e.target.value)} />
        <label className="text-sm">Icon (URL)</label>
        <input className="w-full p-2 bg-neutral-900 rounded" value={icon} onChange={e=>setIcon(e.target.value)} />
        <label className="text-sm">Cor do tema</label>
        <input type="color" className="w-20 h-10" value={color} onChange={e=>setColor(e.target.value)} />
        <div><button className="px-3 py-2 bg-rose-600 rounded mt-2" onClick={save}>Salvar</button></div>
      </div>
    </div>
  )
}

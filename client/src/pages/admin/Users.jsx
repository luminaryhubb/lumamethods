import React, {useEffect, useState} from 'react'
export default function Users(){
  const [users,setUsers]=useState([])
  const [q,setQ]=useState('')
  useEffect(()=>{ fetch('/api/admin/users').then(r=>r.json()).then(d=>setUsers(d.users)).catch(()=>{}) },[])
  function search(){ return users.filter(u=>u.username.toLowerCase().includes(q.toLowerCase())||u.id.includes(q)) }
  async function addUses(id){ const amt = prompt('Quantidade de usos a adicionar'); if(!amt) return; await fetch('/api/admin/user/'+id+'/adduses',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount:amt})}); alert('Adicionado'); }
  async function setRole(id){ const role = prompt('Role (free, vip, mod, admin)'); if(!role) return; await fetch('/api/admin/user/'+id+'/setrole',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role})}); alert('Setado'); }
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Usuários</h3>
      <div className="mb-3"><input className="p-2 bg-neutral-900 rounded" placeholder="Pesquisar" value={q} onChange={e=>setQ(e.target.value)} /></div>
      <div className="space-y-2">{search().map(u=> (<div key={u.id} className="card p-3 flex justify-between items-center"><div><div className="font-medium">{u.username} <span className="text-sm text-neutral-400">({u.id})</span></div><div className="text-sm text-neutral-300">Uses: {(u.uses||[]).length}</div></div><div className="flex flex-col gap-2"><button onClick={()=>addUses(u.id)} className="px-3 py-1 rounded" style={{background:'var(--purple)'}}>Adicionar Usos</button><button onClick={()=>setRole(u.id)} className="px-3 py-1 rounded bg-neutral-800">Colocar Cargo</button></div></div>))}</div>
    </div>
  )
}

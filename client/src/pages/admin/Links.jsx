import React, {useEffect, useState} from 'react'
export default function Links(){
  const [links,setLinks]=useState([])
  useEffect(()=>{ fetch('/api/admin/links').then(r=>r.json()).then(d=>setLinks(d.links)).catch(()=>{}) },[])
  async function del(id){ if(!confirm('Apagar?')) return; await fetch('/api/admin/link/'+id,{method:'DELETE'}); alert('apagado'); window.location.reload(); }
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Links Gerados</h3>
      <div className="space-y-2">{links.map(l=> (<div key={l.id} className="card p-3"><div className="font-medium">{l.id} • {l.network} • views: {l.views}</div><div className="text-sm text-neutral-300 mt-2">{l.output}</div><div className="mt-2"><button onClick={()=>del(l.id)} className="px-3 py-1 rounded bg-rose-600">Apagar</button></div></div>))}</div>
    </div>
  )
}

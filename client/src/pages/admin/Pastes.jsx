import React, {useEffect, useState} from 'react'
export default function Pastes(){
  const [pastes,setPastes]=useState([])
  useEffect(()=>{ fetch('/api/admin/pastes').then(r=>r.json()).then(d=>setPastes(d.pastes)).catch(()=>{}) },[])
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Pastes</h3>
      <div className="space-y-2">{pastes.map(p=> (<div key={p.id} className="card p-3"><div className="font-medium">{p.id} • views: {p.accessesCount}</div><div className="text-sm text-neutral-300 mt-2">{p.textPreview}</div></div>))}</div>
    </div>
  )
}

import React, {useEffect, useState} from 'react'
export default function Panel(){
  const [cfg,setCfg]=useState(null)
  useEffect(()=>{ fetch('/api/admin/config').then(r=>r.json()).then(d=>setCfg(d)).catch(()=>{}) },[])
  async function toggle(){ await fetch('/api/admin/config',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({allowCreation:!cfg.allowCreation})}); const d = await (await fetch('/api/admin/config')).json(); setCfg(d) }
  if(!cfg) return null
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Admin Panel</h3>
      <div className="card p-4">
        <div>Allow creation: <strong>{cfg.allowCreation? 'Yes':'No'}</strong></div>
        <div className="mt-3"><button onClick={toggle} className="px-3 py-1 rounded" style={{background:'var(--purple)'}}>{cfg.allowCreation? 'Disable Creation':'Enable Creation'}</button></div>
      </div>
    </div>
  )
}

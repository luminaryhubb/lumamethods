import React, {useEffect, useState} from 'react'
export default function Shortener(){
  const [cfg,setCfg]=useState(null)
  useEffect(()=>{ fetch('/api/admin/config').then(r=>r.json()).then(d=>setCfg(d)).catch(()=>{}) },[])
  return (
    <div className="max-w-2xl mx-auto card p-6">
      <h3 className="font-semibold">Encurtador - Luma Methods</h3>
      <p className="text-sm text-neutral-300 mb-4">Se quiser, configure uma URL de encurtador no painel de Configurações para redirecionar aqui.</p>
      {cfg && cfg.shortenerUrl ? <a href={cfg.shortenerUrl} className="px-3 py-1 rounded" style={{background:'var(--purple)'}}>Abrir encurtador externo</a> : <div className="text-sm text-neutral-400">Nenhum encurtador configurado.</div>}
    </div>
  )
}

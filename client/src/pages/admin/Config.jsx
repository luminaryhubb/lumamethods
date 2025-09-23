import React, {useEffect, useState} from 'react'
export default function Config(){
  const [cfg,setCfg]=useState(null)
  useEffect(()=>{ fetch('/api/admin/config').then(r=>r.json()).then(d=>setCfg(d)).catch(()=>{}) },[])
  async function save(){ await fetch('/api/admin/config',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(cfg)}); alert('Saved') }
  if(!cfg) return null
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Configurações</h3>
      <div className="space-y-2 card p-4">
        <label>Nome do site</label>
        <input className="w-full p-2 bg-neutral-900 rounded" value={cfg.siteName} onChange={e=>setCfg({...cfg,siteName:e.target.value})} />
        <label>Logo GIF URL</label>
        <input className="w-full p-2 bg-neutral-900 rounded" value={cfg.logo} onChange={e=>setCfg({...cfg,logo:e.target.value})} />
        <label>Cor do tema</label>
        <input type='color' value={cfg.themeColor} onChange={e=>setCfg({...cfg,themeColor:e.target.value})} />
        <label>Shortener URL (opcional)</label>
        <input className="w-full p-2 bg-neutral-900 rounded" value={cfg.shortenerUrl||''} onChange={e=>setCfg({...cfg,shortenerUrl:e.target.value})} />
        <div><button onClick={save} className="px-3 py-1 rounded" style={{background:'var(--purple)'}}>Salvar</button></div>
      </div>
    </div>
  )
}

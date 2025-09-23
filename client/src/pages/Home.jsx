import React, {useContext, useEffect, useState} from 'react'
import { UserContext } from '../App'

export default function Home(){
  const {me} = useContext(UserContext)
  const [cfg, setCfg] = useState(null)
  useEffect(()=>{ fetch('/api/admin/config').then(r=>r.json()).then(setCfg).catch(()=>{}) },[])
  return (
    <div className="space-y-6">
      <div className="card flex flex-col md:flex-row items-center gap-6 p-6">
        <img src={cfg && cfg.logo ? cfg.logo : '/logo.gif'} className="w-24 h-24" alt="logo" />
        <div>
          <h2 className="text-xl font-bold">Luma Methods - Best Methods</h2>
          <p className="text-sm text-neutral-300">Acesse os métodos através do login com Discord.</p>
          <div className="mt-2">{me ? <span className="text-sm">Logado como {me.profile.username}</span> : <a href="/auth/discord" className="px-3 py-1 rounded" style={{background:'var(--purple)'}}>Login com Discord</a>}</div>
        </div>
      </div>

      <div className="grid-mobile">
        <div className="card p-6">
          <h3 className="font-semibold text-lg">Link Fake - Luma Methods</h3>
          <p className="text-sm text-neutral-300 mb-4">Crie links disfarçados que aparentam ser de outro serviço.</p>
          <a href="/link-fake" className="px-4 py-2 rounded" style={{background:'var(--purple)'}}>Abrir</a>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-lg">Encurtador - Luma Methods</h3>
          <p className="text-sm text-neutral-300 mb-4">Nosso encurtador já existente.</p>
          <a href="/shortener" className="px-4 py-2 rounded" style={{background:'var(--purple)'}}>Abrir</a>
        </div>
      </div>
    </div>
  )
}

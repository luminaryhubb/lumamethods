import React, {useContext, useEffect, useState} from 'react'
import { UserContext } from '../App'

export default function Home(){
  const {me} = useContext(UserContext)
  const [cfg, setCfg] = useState({})
  useEffect(()=>{ fetch('/api/config').then(r=>r.json()).then(d=>setCfg(d)).catch(()=>{}) },[])
  return (
    <div style={{display:'grid', gap:16}}>
      <div className="card" style={{display:'flex', gap:16, alignItems:'center'}}>
        <img src={cfg.logo || '/logo.gif'} className="logo" alt="logo" />
        <div>
          <h2 style={{margin:0}}>{cfg.siteName || 'Luma Methods - Best Methods'}</h2>
          <div style={{color:'#cbd5e1'}}>Acesse os métodos — login via Discord necessário</div>
          <div style={{marginTop:8}}>{me ? <span style={{fontSize:13}}>Logado como {me.profile.username}</span> : <a href='/auth/discord' className="nav-btn" style={{background:'var(--purple)'}}>Login com Discord</a>}</div>
        </div>
      </div>

      <div className="grid-mobile">
        <div className="card">
          <h3>Link Fake - Luma Methods</h3>
          <p className="text-sm" style={{color:'#9ca3af'}}>Crie links disfarçados para compartilhar.</p>
          <a href="/link-fake" className="nav-btn" style={{background:'var(--purple)'}}>Abrir</a>
        </div>

        <div className="card">
          <h3>Encurtador - Luma Methods</h3>
          <p className="text-sm" style={{color:'#9ca3af'}}>Crie links curtos facilmente.</p>
          <a href="/shortener" className="nav-btn" style={{background:'var(--purple)'}}>Abrir</a>
        </div>
      </div>
    </div>
  )
}

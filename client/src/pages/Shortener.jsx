import React, {useState, useContext} from 'react'
import { UserContext } from '../App'

export default function Shortener(){
  const {me} = useContext(UserContext)
  const [url, setUrl] = useState('')
  const [alias, setAlias] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function handleShorten(e){
    e.preventDefault(); setError(null); setResult(null);
    if (!me) return setError('Você precisa logar com Discord para usar o encurtador.')
    const res = await fetch('/api/shorten', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ url, alias }) })
    const data = await res.json();
    if (data.error) setError(data.error)
    else setResult(data)
  }

  return (
    <div className="max-w-xl" style={{margin:'0 auto'}}>
      <div className="card">
        <h3>Encurtador</h3>
        <form onSubmit={handleShorten} style={{display:'grid', gap:8, marginTop:8}}>
          <label>URL a encurtar</label>
          <input value={url} onChange={e=>setUrl(e.target.value)} className="nav-btn" placeholder="https://..." required />
          <label>Alias (opcional)</label>
          <input value={alias} onChange={e=>setAlias(e.target.value)} className="nav-btn" placeholder="personalizado" />
          <div><button className="nav-btn" style={{background:'var(--purple)'}}>Encurtar</button></div>
        </form>
      </div>

      {result && (
        <div className="card" style={{marginTop:12}}>
          <div>Short URL:</div>
          <div style={{marginTop:8}}><a href={result.shortUrl}>{result.shortUrl}</a></div>
          <div style={{marginTop:8}}><button className="nav-btn" onClick={()=>{ navigator.clipboard.writeText(window.location.origin + result.shortUrl); alert('Short URL copiada') }} style={{background:'var(--purple)'}}>Copiar</button></div>
        </div>
      )}

      {error && <div style={{color:'#fca5a5', marginTop:8}}>{String(error)}</div>}
    </div>
  )
}

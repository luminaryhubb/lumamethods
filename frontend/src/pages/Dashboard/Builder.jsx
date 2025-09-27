import React, {useState, useEffect} from 'react'
export default function Builder({user}){
  const [mode, setMode] = useState('roblox')
  const [robloxLink, setRobloxLink] = useState('')
  const [selectedGame, setSelectedGame] = useState('https://www.roblox.com/pt/games/8737602449/PLS-DONATE')
  const [platform, setPlatform] = useState('youtube')
  const [platformLink, setPlatformLink] = useState('')
  const [platformUsername, setPlatformUsername] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [remaining, setRemaining] = useState(3)

  useEffect(()=> { // fetch remaining from server
    fetch('/api/uses/remaining').then(r=> r.ok? r.json(): null).then(d=>{ if(d) setRemaining(d.remaining) }).catch(()=>{})
  },[])

  function build(){
    setError('')
    if(remaining <= 0){ setError('Você excedeu seus 3 usos diários.'); return; }
    if(mode==='roblox'){
      if(!robloxLink){ setError('Insira o link privado'); return; }
      const out = `<${robloxLink}>[s](${selectedGame})`
      setOutput(out)
      record({type:'roblox', game:selectedGame})
    } else {
      if(!platformLink || !platformUsername){ setError('Preencha campos'); return; }
      const base = platform==='youtube'?`https://youtube.com/@${platformUsername}`: platform==='tiktok'?`https://tiktok.com/${platformUsername}`:`https://spotify.com/${platformUsername}`
      const out = `[${base}](<${platformLink}>)`
      setOutput(out); record({type:'platform', platform})
    }
  }
  function record(payload){
    fetch('/api/uses/increment', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({}) }).then(r=>{
      if(r.ok){
        fetch('/api/db/record', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
        setRemaining(prev=> prev===Infinity? prev : prev-1)
      } else r.json().then(j=> setError(j.error || 'Erro'))
    }).catch(()=> setError('Erro'))
  }
  async function copyOut(){ try{ await navigator.clipboard.writeText(output); alert('Copiado') }catch(e){ alert('Erro') } }

  return (
    <div className='p-6'>
      <h2 className='text-2xl font-bold mb-4'>Luma Builder</h2>
      <div className='card p-4'>
        <div className='flex gap-2 mb-4'>
          <button className={'px-3 py-2 rounded '+(mode==='roblox'?'bg-blue-600':'bg-white/5')} onClick={()=>setMode('roblox')}>Roblox</button>
          <button className={'px-3 py-2 rounded '+(mode==='platform'?'bg-blue-600':'bg-white/5')} onClick={()=>setMode('platform')}>Plataforma</button>
        </div>
        {mode==='roblox' ? (
          <div>
            <label>Link privado</label>
            <input className='w-full p-2 rounded bg-black/20 mt-1' value={robloxLink} onChange={e=>setRobloxLink(e.target.value)} placeholder='https://www.roblox.com/share?code=...' />
            <label className='mt-3'>Escolha jogo</label>
            <select className='w-full p-2 rounded bg-black/20 mt-1' value={selectedGame} onChange={e=>setSelectedGame(e.target.value)}>
              <option value='https://www.roblox.com/share?code=4a3bfb1c8c8247458d7996f25d8cba65&type=Server'>99 Noites</option>
              <option value='https://www.roblox.com/pt/games/8737602449/PLS-DONATE'>Pls Donate</option>
              <option value='https://www.roblox.com/share?code=3e53b3c450edb044882857e27370bb77&type=Server'>Doors</option>
              <option value='https://www.roblox.com/share?code=b31ee3faf6f22a4fab1df07d32bf0646&type=Server'>Grow a garden</option>
              <option value='https://www.roblox.com/pt/games/142823291/Murder-Mystery-2'>Murder Mystery 2</option>
              <option value='https://www.roblox.com/share?code=a9ab77e67d758848b6100045442e61eb&type=Server'>Adopt Me</option>
              <option value='https://www.roblox.com/share?code=5f5f0967e99e3a4c9f82421b51a9a4ff&type=Server'>Blue Lock</option>
              <option value='https://www.roblox.com/share?code=234ad24be74f3f44aad2eebdc208555f&type=Server'>Jujutsu Shinanigans</option>
            </select>
          </div>
        ) : (
          <div>
            <label>Plataforma</label>
            <select className='w-full p-2 rounded bg-black/20 mt-1' value={platform} onChange={e=>setPlatform(e.target.value)}>
              <option value='youtube'>YouTube</option>
              <option value='tiktok'>TikTok</option>
              <option value='spotify'>Spotify</option>
            </select>
            <label className='mt-3'>Link privado</label>
            <input className='w-full p-2 rounded bg-black/20 mt-1' value={platformLink} onChange={e=>setPlatformLink(e.target.value)} placeholder='link privado' />
            <label className='mt-3'>Nome de usuário</label>
            <input className='w-full p-2 rounded bg-black/20 mt-1' value={platformUsername} onChange={e=>setPlatformUsername(e.target.value)} placeholder='nomeDeUsuario' />
          </div>
        )}
        <div className='flex items-center gap-3 mt-4'>
          <button onClick={build} className='px-4 py-2 bg-green-600 rounded'>Iniciar Builder</button>
          <div className='ml-auto'>Usos restantes: <strong>{remaining===Infinity? '∞': remaining}</strong></div>
        </div>
        {error && <div className='text-red-400 mt-2'>{error}</div>}
        {output && <div className='mt-3'><div className='card p-2 break-all'>{output}</div><div className='mt-2'><button onClick={copyOut} className='px-3 py-2 bg-blue-600 rounded'>Copiar</button></div></div>}
      </div>
    </div>
  )
}
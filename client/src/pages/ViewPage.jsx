import React, {useEffect, useState} from 'react'
import { useParams } from 'react-router-dom'

export default function ViewPage(){
  const { id } = useParams()
  const [meta, setMeta] = useState(null)
  const [password, setPassword] = useState('')
  const [content, setContent] = useState(null)
  const [error, setError] = useState(null)

  useEffect(()=>{
    fetch('/api/paste/'+id).then(r=>r.json()).then(setMeta).catch(()=>{})
  },[id])

  async function handleCheck(e){
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/verify/'+id, {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({password})
    })
    const data = await res.json()
    if (data.error) return setError(data.error)
    if (data.redirect) {
      window.location.href = data.redirect
    } else if (data.text) {
      setContent(data.text)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-neutral-800 p-6 rounded-xl">
        <h2 className="text-lg font-semibold mb-2">Acessar paste: {id}</h2>
        <div className="text-sm text-neutral-400 mb-4">Criado: {meta? meta.createdAt : '...' } • Acessos: {meta? meta.accessesCount: '...'}</div>
        {!content ? (
          <form onSubmit={handleCheck} className="space-y-3">
            <div>
              <label className="text-sm text-neutral-300">Senha</label>
              <input className="w-full mt-1 p-2 bg-neutral-900 rounded" value={password} onChange={e=>setPassword(e.target.value)} required/>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-rose-600 rounded">Enviar</button>
              {error && <div className="text-rose-400">{error}</div>}
            </div>
          </form>
        ): (
          <div>
            <h3 className="font-medium mb-2">Conteúdo</h3>
            <pre className="bg-black p-4 rounded text-sm whitespace-pre-wrap">{content}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

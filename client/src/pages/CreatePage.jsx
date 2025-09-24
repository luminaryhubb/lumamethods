import React, {useState} from 'react'

export default function CreatePage(){
  const [text, setText] = useState('')
  const [password, setPassword] = useState('')
  const [redirect, setRedirect] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleCreate(e){
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/create', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ text, password, redirect })
    })
    const data = await res.json()
    setResult(data)
    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Criar paste protegido</h2>
      <form onSubmit={handleCreate} className="space-y-4 bg-neutral-800 p-6 rounded-xl">
        <div>
          <label className="text-sm text-neutral-300">Texto</label>
          <textarea className="w-full mt-1 p-3 bg-neutral-900 rounded text-sm" rows="6" value={text} onChange={e=>setText(e.target.value)} required/>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-neutral-300">Senha (obrigatória)</label>
            <input className="w-full mt-1 p-2 bg-neutral-900 rounded" value={password} onChange={e=>setPassword(e.target.value)} required/>
          </div>
          <div>
            <label className="text-sm text-neutral-300">Redirecionar (opcional)</label>
            <input className="w-full mt-1 p-2 bg-neutral-900 rounded" placeholder="https://..." value={redirect} onChange={e=>setRedirect(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-rose-600 rounded" disabled={loading}>{loading? 'Criando...':'Criar'}</button>
          {result && <input readOnly className="flex-1 p-2 bg-neutral-900 rounded font-mono" value={window.location.origin + result.link} />}
        </div>
      </form>
    </div>
  )
}

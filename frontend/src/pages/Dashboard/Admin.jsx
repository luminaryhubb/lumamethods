import React, {useEffect, useState} from 'react'
export default function Admin({user}){
  const [status, setStatus] = useState('checking')
  useEffect(()=>{
    fetch('/api/auth/status').then(r=> r.ok? r.json(): Promise.reject()).then(()=>{
      return fetch('/api/auth/verify-oauth')
    }).then(r=> r.ok? r.json(): Promise.reject()).then(()=> fetch('/api/admin/check')).then(r=>{
      if(r.ok) setStatus('ok'); else setStatus('denied')
    }).catch(()=> setStatus('denied'))
  },[])
  if(status==='checking') return <div className='p-6 card'>Verificando...</div>
  if(status==='denied') return <div className='p-6 card text-red-400'>Acesso negado. Redirecionando...</div>
  return <div className='p-6 card'><h3>Admin</h3><p>Ferramentas administrativas (aqui você implementa).</p></div>
}
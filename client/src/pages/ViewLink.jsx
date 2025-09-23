import React, {useEffect, useState} from 'react'
import { useParams } from 'react-router-dom'
export default function ViewLink(){
  const { id } = useParams()
  const [data, setData] = useState(null)
  useEffect(()=>{ fetch('/l/'+id).then(r=>r.json()).then(setData) },[id])
  if (!data) return <div>Loading...</div>
  return (
    <div className="max-w-2xl mx-auto card p-6">
      <h3 className="font-semibold">Link gerado</h3>
      <pre className="bg-black p-3 rounded mt-2">{data.output}</pre>
      <div className="text-sm text-neutral-400 mt-2">Network: {data.network}</div>
    </div>
  )
}

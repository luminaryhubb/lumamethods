import React, {useEffect, useState} from 'react'
import { useParams } from 'react-router-dom'
export default function ViewLink(){
  const { id } = useParams()
  const [data, setData] = useState(null)
  useEffect(()=>{ fetch('/l/'+id).then(r=>r.json()).then(setData).catch(()=>{}) },[id])
  if (!data) return <div>Loading...</div>
  return (
    <div className="max-w-xl" style={{margin:'0 auto'}}>
      <div className="card">
        <h3>Link gerado</h3>
        <pre style={{background:'#000', padding:10, borderRadius:8}}>{data.output}</pre>
        <div style={{marginTop:8}}>Network: {data.network} • Views: {data.views}</div>
      </div>
    </div>
  )
}

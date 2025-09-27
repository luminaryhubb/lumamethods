import React, {useEffect, useState} from 'react'
export default function Stats(){
  const [stats, setStats] = useState({topGames:[]})
  useEffect(()=>{ fetch('/api/db/stats').then(r=> r.ok? r.json(): null).then(d=>{ if(d) setStats(d) }) },[])
  return (
    <div className='p-6'>
      <h2 className='text-2xl font-bold mb-4'>Estatísticas</h2>
      <div className='card p-4'>
        <h4 className='font-bold'>Jogos mais usados</h4>
        <ol className='mt-2 space-y-1'>
          {stats.topGames.length? stats.topGames.map((g,i)=> <li key={i}>{i+1}. {g.game} — {g.count} usos</li>) : <li>Nenhum registro</li>}
        </ol>
      </div>
    </div>
  )
}
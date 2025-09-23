import React, {useEffect, useState} from 'react'
export default function Dashboard(){
  const [stats,setStats]=useState({counts:{}, totalPastes:0, totalViews:0})
  useEffect(()=>{ fetch('/api/admin/stats').then(r=>r.json()).then(d=>setStats(d)).catch(()=>{}) },[])
  return (
    <div>
      <h3>Dashboard</h3>
      <div style={{display:'flex',gap:12, marginTop:12}}>
        <div className="card" style={{padding:12}}><div>Pastes</div><div style={{fontSize:20}}>{stats.totalPastes}</div></div>
        <div className="card" style={{padding:12}}><div>Visualizações</div><div style={{fontSize:20}}>{stats.totalViews}</div></div>
      </div>
    </div>
  )
}

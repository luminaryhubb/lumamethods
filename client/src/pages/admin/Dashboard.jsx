import React, {useEffect, useState} from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
export default function Dashboard(){
  const [stats,setStats]=useState([])
  const [totals,setTotals]=useState({totalPastes:0,totalViews:0})
  useEffect(()=>{ fetch('/api/admin/stats').then(r=>r.json()).then(d=>{ const chart = Object.keys(d.counts||{}).map(k=>({date:k,value:d.counts[k]})); setStats(chart); setTotals({totalPastes:d.totalPastes||0,totalViews:d.totalViews||0}) }).catch(()=>{}) },[])
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Dashboard</h3>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4"><div className="text-sm text-neutral-400">Pastes</div><div className="text-2xl font-bold">{totals.totalPastes}</div></div>
        <div className="card p-4"><div className="text-sm text-neutral-400">Visualizações</div><div className="text-2xl font-bold">{totals.totalViews}</div></div>
        <div className="card p-4"><div className="text-sm text-neutral-400">Usuários</div><div className="text-2xl font-bold">--</div></div>
      </div>
      <div className="card p-4"><h4 className="font-medium mb-2">Acessos últimos 7 dias</h4><div style={{height:200}}><ResponsiveContainer width="100%" height="100%"><LineChart data={stats}><XAxis dataKey="date"/><YAxis/><Tooltip/><Line type="monotone" dataKey="value" stroke="#fff" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer></div></div>
    </div>
  )
}

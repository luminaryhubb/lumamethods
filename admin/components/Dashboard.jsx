// Dashboard layout that uses StatCard, ChartComponent, MapBrazil
window.Dashboard = () => {
  const [stats,setStats] = React.useState(null);
  React.useEffect(()=>{ fetch('/api/stats').then(r=>r.json()).then(j=>setStats(j)).catch(()=>{}) },[]);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div><StatCard title="Usuários registrados hoje" value={stats?stats.usersToday:'—'} /></div>
        <div><StatCard title="Links Buildados Hoje" value={stats?stats.linksToday:'—'} /></div>
        <div><StatCard title="Pastes Criados Hoje" value={stats?stats.pastesToday:'—'} /></div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="p-4 bg-neutral-900 rounded"><h3 className="font-bold mb-4">Shortners com mais views</h3><div id="topShortners" className="space-y-2"></div></div>
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Usuários registrados</h3>
            <select className="bg-neutral-800 p-1 rounded">
              <option>3d</option><option>7d</option><option>30d</option>
            </select>
          </div>
          <ChartComponent />
        </div>
        <div>
          <div className="p-4 bg-neutral-900 rounded"><h3 className="font-bold mb-4">Top Shortners</h3><div>short.ly/1 — 1.2k views</div></div>
        </div>
      </div>

      <div><div className="p-4 bg-neutral-900 rounded"><h3 className="font-bold mb-4">Mapa do Brasil — Usuários por estado</h3><MapBrazil/></div></div>
    </div>
  );
};

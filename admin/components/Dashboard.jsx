window.Dashboard = () => {
  const [period, setPeriod] = React.useState('7d');
  const [stats, setStats] = React.useState(null);
  React.useEffect(()=>{ fetch('/api/stats').then(r=>r.json()).then(j=>setStats(j)); },[]);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4"><StatCard title="Usuários registrados hoje" value={stats?stats.usersToday:'—'} /></div>
        <div className="p-4"><StatCard title="Links Buildados Hoje" value={stats?stats.linksToday:'—'} /></div>
        <div className="p-4"><StatCard title="Pastes Criados Hoje" value={stats?stats.pastesToday:'—'} /></div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <SpotlightCard><h3 className="font-bold mb-4">Shortners com mais views</h3><div className="space-y-2"><ShortnerItem url="short.ly/abc" meta="1.2k • autor"/></div></SpotlightCard>
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Usuários registrados</h3>
            <select className="bg-neutral-800 p-1 rounded" value={period} onChange={(e)=>setPeriod(e.target.value)}><option value="3d">3d</option><option value="7d">7d</option><option value="30d">30d</option></select>
          </div>
          <ChartComponent period={period} />
        </div>
        <div>
          <SpotlightCard><h3 className="font-bold mb-4">Top Shortners</h3><div className="space-y-2"><div>short.ly/1 — 1.2k views</div></div></SpotlightCard>
        </div>
      </div>

      <SpotlightCard><h3 className="font-bold mb-4">Mapa do Brasil — Usuários por estado</h3><MapBrazil/></SpotlightCard>
    </div>
  );
};

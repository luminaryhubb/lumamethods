window.Pastes = () => {
  const [pastes, setPastes] = React.useState([]);
  function load(){ fetch('/api/pastes?filter=recent').then(r=>r.json()).then(j=>setPastes(j)); }
  React.useEffect(()=>load(),[]);
  async function del(id){ if(!confirm('Apagar paste?')) return; const res = await fetch('/api/pastes/'+id,{ method:'DELETE' }); if(res.ok) load(); else alert('erro'); }
  return (
    <div className="space-y-6">
      <SpotlightCard><h3 className="font-bold mb-4">Pastes criados hoje</h3>{pastes.slice(0,5).map(p=>(<div key={p.id} className="p-4 bg-neutral-800 rounded">{p.title} — {p.author} — <button onClick={()=>del(p.id)} className="ml-4 bg-red-600 px-2 rounded">Apagar</button></div>))}</SpotlightCard>
      <SpotlightCard><h3 className="font-bold mb-4">Top 10 Pastes</h3><ol className="list-decimal pl-6 space-y-2">{pastes.sort((a,b)=>b.views-a.views).slice(0,10).map((p,i)=>(<li key={p.id}>{p.title} — {p.views} views — {p.author}</li>))}</ol></SpotlightCard>
    </div>
  );
};

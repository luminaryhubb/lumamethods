window.Builders = () => {
  const [builders,setBuilders] = React.useState([]);
  React.useEffect(()=>fetch('/api/builders').then(r=>r.json()).then(j=>setBuilders(j.builders)).catch(()=>{}),[]);
  return (<div className="space-y-6"><div className="p-4 bg-neutral-900 rounded"><h3 className="font-bold mb-4">Links de jogos gerados</h3>{builders.map(b=>(<div key={b.game_key} className="p-3 bg-neutral-800 rounded">{b.name} — {b.link}</div>))}</div></div>);
};

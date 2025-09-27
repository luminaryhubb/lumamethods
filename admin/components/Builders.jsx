window.Builders = () => {
  const [builders,setBuilders] = React.useState([]);
  React.useEffect(()=>fetch('/api/builders').then(r=>r.json()).then(j=>setBuilders(j.builders)),[]);
  return (<div className="space-y-6"><SpotlightCard><h3 className="font-bold mb-4">Links de jogos gerados</h3>{builders.map(b=>(<div key={b.game} className="p-3 bg-neutral-800 rounded">{b.game} — {b.count}</div>))}</SpotlightCard><SpotlightCard><h3 className="font-bold mb-4">Jogos mais escolhidos</h3></SpotlightCard></div>);
};

window.Config = () => {
  const [cfg,setCfg] = React.useState(null);
  React.useEffect(()=>fetch('/api/config').then(r=>r.json()).then(j=>setCfg(j)).catch(()=>{}),[]);
  async function save(){ const form = Object.fromEntries(new FormData(document.getElementById('cfg'))); await fetch('/api/config',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) }); alert('Salvo'); }
  if(!cfg) return <div>Carregando...</div>;
  return (<div className="space-y-6"><div className="p-4 bg-neutral-900 rounded"><h3 className="font-bold mb-4">Configurações do site</h3><form id="cfg" className="space-y-2"><div>Nome: <input name="siteName" defaultValue={cfg.siteName} className="ml-2 p-1 rounded bg-neutral-800"/></div><div>Primary color: <input type="color" name="primaryColor" defaultValue={cfg.primaryColor} className="ml-2"/></div><div>Maintenance: <input type="checkbox" name="maintenance" defaultChecked={cfg.maintenance}/></div><div><button type="button" onClick={save} className="mt-2 px-4 py-2 bg-purple-600 rounded">Salvar</button></div></form></div></div>);
};


const { useState, useEffect, useRef } = React;

function Sidebar({page,setPage}){
  const items = ['Dashboard','Pastes','Builders','Users','Config'];
  return (
    <div className="w-64 bg-neutral-800 p-4 flex flex-col space-y-4">
      <div className="text-2xl font-bold text-purple-300 mb-4">Luma Admin</div>
      {items.map(i=>(
        <button key={i} className={"text-left p-2 rounded "+(page===i ? "bg-purple-700 text-white":"text-neutral-200 hover:bg-neutral-700")} onClick={()=>setPage(i)}>{i}</button>
      ))}
      <div className="mt-auto text-xs text-neutral-400">Logged as admin</div>
    </div>
  );
}

// Simple card
function Card({title,children}){
  return <div className="bg-neutral-800 p-4 rounded shadow">{children ? children : <h3 className="font-bold">{title}</h3>}</div>
}

// Dashboard: show pastes stats and top
function Dashboard(){
  const [stats,setStats] = useState({pastes:0,views:0,top:[]});
  useEffect(()=>{
    fetch('/api/admin/stats').then(r=>r.json()).then(j=>setStats(j)).catch(()=>{})
  },[]);
  return (
    <div className="p-6 space-y-6 w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><div><div className="text-sm text-neutral-400">Pastes</div><div className="text-2xl font-bold">{stats.pastes||0}</div></div></Card>
        <Card><div><div className="text-sm text-neutral-400">Views</div><div className="text-2xl font-bold">{stats.views||0}</div></div></Card>
        <Card><div><div className="text-sm text-neutral-400">Users today</div><div className="text-2xl font-bold">{stats.usersToday||0}</div></div></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><h3 className="font-bold mb-2">Top Pastes</h3>{(stats.top||[]).map(p=>(<div key={p.id} className="p-2 bg-neutral-900 rounded mb-2"><div className="font-semibold">{p.id}</div><div className="text-neutral-400 text-sm">{p.views} views</div></div>))}</Card>
        <Card><h3 className="font-bold mb-2">Recent Builders</h3>{(stats.builders||[]).map(b=>(<div key={b.id} className="p-2 bg-neutral-900 rounded mb-2">{b.game} — {b.count} uses</div>))}</Card>
      </div>
    </div>
  );
}

// Pastes management
function Pastes(){
  const [pastes,setPastes]=useState([]);
  function load(){ fetch('/api/admin/pastes').then(r=>r.json()).then(j=>setPastes(j.pastes||[])).catch(()=>{}) }
  useEffect(()=>load(),[]);
  async function del(id){ if(!confirm('Excluir paste '+id+'?')) return; await fetch('/api/admin/pastes/'+id,{method:'DELETE',headers:{'x-admin-token':localStorage.getItem('admin_token')||''}}); load(); }
  return (
    <div className="p-6 space-y-4 w-full">
      <h2 className="text-2xl font-bold">Pastes</h2>
      <div className="grid gap-3">
        {pastes.map(p=>(
          <div key={p.id} className="bg-neutral-800 p-3 rounded flex justify-between items-start">
            <div>
              <div className="font-mono font-semibold text-purple-200">{p.id}</div>
              <div className="text-sm text-neutral-400">Created: {p.createdAt}</div>
              <div className="text-sm text-neutral-400">Views: {p.accessesCount||0}</div>
              <div className="text-sm break-words mt-2 text-neutral-200">Preview: {p.textPreview||'(hidden)'}</div>
            </div>
            <div className="space-y-2 ml-4">
              <button className="bg-red-600 px-3 py-1 rounded" onClick={()=>del(p.id)}>Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Builder UI implementation (stepper)
function Builders(){
  const [step,setStep]=useState(1);
  const [platform,setPlatform]=useState('Roblox');
  const [robloxLink,setRobloxLink]=useState('');
  const [selectedGame,setSelectedGame]=useState('Pls Donate');
  const [platformLink,setPlatformLink]=useState('');
  const [platformUser,setPlatformUser]=useState('');
  const games = {
    "99 Noites":"https://www.roblox.com/share?code=4a3bfb1c8c8247458d7996f25d8cba65&type=Server",
    "Pls Donate":"https://www.roblox.com/pt/games/8737602449/PLS-DONATE",
    "Doors":"https://www.roblox.com/share?code=3e53b3c450edb044882857e27370bb77&type=Server",
    "Grow a garden":"https://www.roblox.com/share?code=b31ee3faf6f22a4fab1df07d32bf0646&type=Server",
    "Murder Mystery 2":"https://www.roblox.com/pt/games/142823291/Murder-Mystery-2",
    "Adopt Me":"https://www.roblox.com/share?code=a9ab77e67d758848b6100045442e61eb&type=Server",
    "Blue Lock":"https://www.roblox.com/share?code=5f5f0967e99e3a4c9f82421b51a9a4ff&type=Server",
    "Jujutsu Shinanigans":"https://www.roblox.com/share?code=234ad24be74f3f44aad2eebdc208555f&type=Server"
  };

  // fetch uses left for logged user via /api/user
  const [user, setUser] = useState(null);
  const [usesLeft,setUsesLeft]=useState(0);
  useEffect(()=>{
    fetch('/api/user').then(r=>r.json()).then(j=>{ setUser(j.user); if(j.user && j.user.id){ fetch('/api/admin/builders').then(r=>r.json()).then(()=>{}).catch(()=>{}); } });
    // also get uses from data endpoint
    fetch('/api/user').then(r=>r.json()).then(j=>{
      if(j.user && j.user.id){ fetch('/api/users').then(r=>r.json()).then(u=>{ /* users list available in admin only; for public, uses handled differently */ }).catch(()=>{}); }
    }).catch(()=>{});
  },[]);

  function next(){ setStep(s=>Math.min(3,s+1)); }
  function prev(){ setStep(s=>Math.max(1,s-1)); }

  async function startBuilder(){
    // create output according to selection
    if(platform==='Roblox'){
      if(!robloxLink){ alert('Coloque o link privado do Roblox'); return; }
      const out = `<${robloxLink}>[s](${games[selectedGame]})`;
      navigator.clipboard.writeText(out);
      alert('Output copiado para a área de transferência:\n'+out);
      // call backend to decrement uses
      const res = await fetch('/api/builder/use',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user:user||{id:'guest'}})});
      if(!res.ok){ alert('Erro: uso excedido'); }
    } else {
      if(!platformLink||!platformUser){ alert('Preencha link privado e nome de usuário'); return; }
      const prefix = platform==='Tiktok' ? 'https://tiktok.com/' : platform==='Youtube' ? 'https://youtube.com/@' : 'https://spotify.com/@';
      const out = `[${prefix+platformUser}](<${platformLink}>)`;
      navigator.clipboard.writeText(out);
      alert('Output copiado:\n'+out);
      const res = await fetch('/api/builder/use',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user:user||{id:'guest'}})});
      if(!res.ok){ alert('Erro: uso excedido'); }
    }
  }

  return (
    <div className="p-6 w-full space-y-6">
      <h2 className="text-2xl font-bold">Luma Builder</h2>
      <div className="bg-neutral-800 p-4 rounded">
        <div className="mb-4">Use remaining: <strong>{usesLeft}</strong> (3 per day)</div>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <label className="w-32">Modo</label>
            <select value={platform} onChange={e=>setPlatform(e.target.value)} className="bg-neutral-900 p-2 rounded">
              <option>Roblox</option>
              <option>Youtube</option>
              <option>Tiktok</option>
              <option>Spotify</option>
            </select>
          </div>

          {platform==='Roblox' && (
            <div className="space-y-2">
              <div><label>Link privado do Roblox (obrigatório)</label><input className="w-full p-2 rounded bg-neutral-900" value={robloxLink} onChange={e=>setRobloxLink(e.target.value)} placeholder="https://www.roblox.com/share?code=..." /></div>
              <div><label>Escolha o jogo</label><select className="w-full p-2 rounded bg-neutral-900" value={selectedGame} onChange={e=>setSelectedGame(e.target.value)}>
                {Object.keys(games).map(g=>(<option key={g}>{g}</option>))}
              </select></div>
            </div>
          )}

          {platform!=='Roblox' && (
            <div className="space-y-2">
              <div><label>Link privado (obrigatório)</label><input className="w-full p-2 rounded bg-neutral-900" value={platformLink} onChange={e=>setPlatformLink(e.target.value)} /></div>
              <div><label>Nome de usuário (obrigatório)</label><input className="w-full p-2 rounded bg-neutral-900" value={platformUser} onChange={e=>setPlatformUser(e.target.value)} /></div>
            </div>
          )}

          <div className="flex space-x-2 mt-4">
            <button className="bg-purple-600 px-4 py-2 rounded" onClick={startBuilder}>Iniciar Builder</button>
            <button className="bg-neutral-700 px-4 py-2 rounded" onClick={()=>{ setRobloxLink(''); setPlatformLink(''); setPlatformUser('');}}>Limpar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Users admin view
function Users(){
  const [users,setUsers]=useState([]);
  function load(){ fetch('/api/users').then(r=>r.json()).then(j=>setUsers(j)).catch(()=>{}); }
  useEffect(()=>load(),[]);
  async function addUses(id,amount){
    const resp = await fetch('/api/users/'+id+'/adduses',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount})});
    load();
  }
  async function block(id){
    await fetch('/api/users/'+id+'/block',{method:'POST'}); load();
  }
  async function addRole(id,role){
    await fetch('/api/users/'+id+'/role',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role})}); load();
  }
  return (
    <div className="p-6 w-full">
      <h2 className="text-2xl font-bold mb-4">Users</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map(u=>(
          <div key={u.id} className="bg-neutral-800 p-4 rounded flex items-center space-x-4">
            <img src={u.avatar} className="w-16 h-16 rounded" alt="avatar" />
            <div className="flex-1">
              <div className="font-bold">{u.name}</div>
              <div className="text-sm text-neutral-400">ID: {u.id}</div>
              <div className="text-sm text-neutral-300">Usos: {u.usesLeft ?? 3}</div>
              <div className="mt-2 space-x-2">
                <button className="bg-purple-600 px-2 py-1 rounded" onClick={()=>addRole(u.id,'Membro')}>Adicionar Cargo</button>
                <button className="bg-red-600 px-2 py-1 rounded" onClick={()=>block(u.id)}>Bloquear</button>
                <button className="bg-green-600 px-2 py-1 rounded" onClick={()=>addUses(u.id,3)}>Adicionar Usos</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Config page
function Config(){
  const [cfg,setCfg]=useState({});
  useEffect(()=>{ fetch('/api/config').then(r=>r.json()).then(j=>setCfg(j)).catch(()=>{}); },[]);
  async function save(){ await fetch('/api/admin/config',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(cfg)}); alert('Salvo'); }
  return (
    <div className="p-6 w-full">
      <h2 className="text-2xl font-bold mb-4">Config</h2>
      <div className="bg-neutral-800 p-4 rounded space-y-3">
        <div><label>Site Name</label><input className="w-full p-2 rounded bg-neutral-900" value={cfg.siteName||''} onChange={e=>setCfg({...cfg,siteName:e.target.value})} /></div>
        <div><label>Theme Color</label><input className="w-full p-2 rounded bg-neutral-900" value={cfg.themeColor||''} onChange={e=>setCfg({...cfg,themeColor:e.target.value})} /></div>
        <div className="flex space-x-2"><button className="bg-purple-600 px-4 py-2 rounded" onClick={save}>Salvar</button></div>
      </div>
    </div>
  );
}

// Main App
function App(){
  const [page,setPage]=useState('Dashboard');
  const [ok,setOk]=useState(true);
  useEffect(()=>{
    fetch('/api/is-admin').then(r=>r.json()).then(j=>{ if(!j.admin) setOk(false); }).catch(()=>setOk(false));
  },[]);
  if(!ok) return (<div className="p-6 text-red-400">Acesso negado. Faça login com um admin.</div>);
  return (
    <div className="flex h-screen">
      <Sidebar page={page} setPage={setPage} />
      <div className="flex-1 overflow-auto">
        {page==='Dashboard' && <Dashboard/>}
        {page==='Pastes' && <Pastes/>}
        {page==='Builders' && <Builders/>}
        {page==='Users' && <Users/>}
        {page==='Config' && <Config/>}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

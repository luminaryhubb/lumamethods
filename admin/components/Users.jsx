window.Users = () => {
  const [users,setUsers] = React.useState([]);
  function load(){ fetch('/api/users').then(r=>{ if(!r.ok) return alert('Só admins'); return r.json()}).then(j=>j && setUsers(j)); }
  React.useEffect(()=>load(),[]);
  async function setRole(id,role){ await fetch('/api/users/'+id+'/role',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({role})}); load(); }
  async function block(id){ await fetch('/api/users/'+id+'/block',{ method:'POST'}); load(); }
  return (<div className="space-y-6"><SpotlightCard><h3 className="font-bold mb-4">Usuários</h3>{users.map(u=>(<div key={u.id} className="p-4 bg-neutral-800 rounded flex justify-between items-center"><div>{u.username} — {u.role} — {u.uses} usos</div><div><select onChange={(e)=>setRole(u.id,e.target.value)} defaultValue={u.role} className="bg-neutral-900 p-1 rounded"><option>Basic</option><option>Plus</option><option>Premium</option></select><button onClick={()=>block(u.id)} className="ml-2 px-2 py-1 bg-red-600 rounded">Bloquear</button></div></div>))}</SpotlightCard></div>);
};

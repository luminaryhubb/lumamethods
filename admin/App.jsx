const { useState, useEffect } = React;
function App(){
  const [page,setPage] = useState('Dashboard');
  useEffect(()=>{
    fetch('/api/is-admin').then(r=>r.json()).then(j=>{ if(!j.admin) { /* not admin */ } });
  },[]);
  return (<div className="flex h-screen"><Sidebar page={page} setPage={setPage} /><div className="flex-1 p-8 overflow-auto">{page==='Dashboard' && <Dashboard/>}{page==='Pastes' && <Pastes/>}{page==='Builders' && <Builders/>}{page==='Users' && <Users/>}{page==='Config' && <Config/>}</div></div>);
}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);

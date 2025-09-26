const { useState, useEffect } = React;
function App(){
  const [page,setPage] = useState('Dashboard');
  return (<div className="flex h-screen"><Sidebar page={page} setPage={setPage} /><div className="flex-1 p-8 overflow-auto">{page==='Dashboard' && <div><h1 className="text-2xl font-bold mb-4">Dashboard</h1><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="p-4 bg-neutral-900 rounded"><div className="text-sm text-gray-300">Usuarios registrados hoje</div><div className="text-2xl font-bold">--</div></div><div className="p-4 bg-neutral-900 rounded"><div className="text-sm text-gray-300">Links Buildados Hoje</div><div className="text-2xl font-bold">--</div></div><div className="p-4 bg-neutral-900 rounded"><div className="text-sm text-gray-300">Pastes Criados Hoje</div><div className="text-2xl font-bold">--</div></div></div></div>}{page!=='Dashboard' && <div className="p-6">Página {page} (em construção)</div>}</div></div>);
}
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);

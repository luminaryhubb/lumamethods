const { useState, useEffect } = React;

// components import simulated by defining them here (single-file approach)
const Sidebar = ({ page, setPage }) => (
  <div className="w-72 p-6 bg-neutral-900 h-screen">
    <h2 className="text-2xl font-bold mb-6">Admin</h2>
    {['Dashboard','Pastes','Builders','Users','Config'].map(p => (
      <button key={p} onClick={()=>setPage(p)} className={'block w-full text-left mb-2 p-3 rounded '+(page===p?'bg-purple-700':'hover:bg-purple-600')}>{p}</button>
    ))}
    <div className="mt-8"><button onClick={()=>{fetch('/auth/logout').then(()=>location.href='/')}} className="px-4 py-2 bg-gray-700 rounded">Logout</button></div>
  </div>
);

// SpotlightCard component
const SpotlightCard = ({ children, className='' }) => {
  const ref = React.useRef(null);
  const [pos, setPos] = useState({x:0,y:0});
  const [opacity, setOpacity] = useState(0);
  return (
    <div ref={ref} onMouseMove={(e)=>{const r=ref.current.getBoundingClientRect(); setPos({x:e.clientX-r.left,y:e.clientY-r.top})}} onMouseEnter={()=>setOpacity(0.6)} onMouseLeave={()=>setOpacity(0)} className={'relative rounded-3xl border border-neutral-800 bg-neutral-900 p-6 '+className}>
      <div style={{position:'absolute',inset:0,background:`radial-gradient(circle at ${pos.x}px ${pos.y}px, rgba(255,255,255,0.08), transparent 60%)`,opacity}} className="pointer-events-none transition-opacity"></div>
      {children}
    </div>
  );
};

// small Card
const StatCard = ({title, value}) => (
  <SpotlightCard className="text-center">
    <div className="text-sm text-gray-300">{title}</div>
    <div className="text-2xl font-bold mt-2">{value}</div>
  </SpotlightCard>
);

// Dummy chart (placeholder)
const Chart = ({period, setPeriod}) => (
  <SpotlightCard>
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-bold">Usuários registrados</h3>
      <select value={period} onChange={e=>setPeriod(e.target.value)} className="bg-neutral-800 p-1 rounded">
        <option value="3d">3d</option><option value="7d">7d</option><option value="30d">30d</option>
      </select>
    </div>
    <div style={{height:200}} className="bg-neutral-800 rounded" />
  </SpotlightCard>
);

function Dashboard({setPage}){
  const [period, setPeriod] = useState('7d');
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Usuários registrados hoje" value="12"/>
        <StatCard title="Links Buildados Hoje" value="34"/>
        <StatCard title="Pastes Criados Hoje" value="5"/>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <SpotlightCard>
            <h3 className="font-bold mb-4">Shortners com mais views</h3>
            <div className="space-y-2">
              <div className="flex justify-between"><div>short.ly/abc</div><div className="text-sm text-gray-400">views • autor</div></div>
              <div className="flex justify-between"><div>short.ly/xyz</div><div className="text-sm text-gray-400">views • autor</div></div>
            </div>
          </SpotlightCard>
          <Chart period={period} setPeriod={setPeriod} />
        </div>
        <div>
          <SpotlightCard>
            <h3 className="font-bold mb-4">Top Shortners</h3>
            <div className="space-y-2">
              <div>short.ly/1 — 1.2k views</div>
              <div>short.ly/2 — 800 views</div>
              <div>short.ly/3 — 640 views</div>
            </div>
          </SpotlightCard>
        </div>
      </div>

      <SpotlightCard>
        <h3 className="font-bold mb-4">Mapa do Brasil — Usuários por estado</h3>
        <div style="height:300px" className="bg-neutral-800 rounded" />
      </SpotlightCard>
    </div>
  );
}

function Pastes(){
  return (
    <div className="space-y-6">
      <SpotlightCard>
        <h3 className="font-bold mb-4">Pastes criados hoje</h3>
        <div className="space-y-2">
          <div className="p-4 bg-neutral-800 rounded">Paste 1 — autor — <button className="ml-4 bg-red-600 px-2 rounded">Apagar</button></div>
          <div className="p-4 bg-neutral-800 rounded">Paste 2 — autor — <button className="ml-4 bg-red-600 px-2 rounded">Apagar</button></div>
        </div>
      </SpotlightCard>
      <SpotlightCard>
        <h3 className="font-bold mb-4">Top 10 Pastes</h3>
        <ol className="list-decimal pl-6 space-y-2">
          {Array.from({length:10}).map((_,i)=><li key={i}>Top Paste #{i+1} — 1234 views</li>)}
        </ol>
      </SpotlightCard>
    </div>
  );
}

function Builders(){
  return (
    <div className="space-y-6">
      <SpotlightCard><h3 className="font-bold mb-4">Links de jogos gerados</h3></SpotlightCard>
      <SpotlightCard><h3 className="font-bold mb-4">Jogos mais escolhidos</h3></SpotlightCard>
    </div>
  );
}

function Users(){
  const roles = ['Basic','Plus','Premium'];
  return (
    <div className="space-y-6">
      <SpotlightCard>
        <h3 className="font-bold mb-4">Usuários</h3>
        <div className="space-y-2">
          <div className="p-4 bg-neutral-800 rounded flex justify-between">user1 <div><button className="px-2 py-1 bg-green-600 rounded">Adicionar Cargo</button></div></div>
          <div className="p-4 bg-neutral-800 rounded flex justify-between">user2 <div><button className="px-2 py-1 bg-red-600 rounded">Bloquear</button></div></div>
        </div>
      </SpotlightCard>
    </div>
  );
}

function Config(){
  return (
    <div className="space-y-6">
      <SpotlightCard><h3 className="font-bold">Configurações do site</h3></SpotlightCard>
    </div>
  );
}

function App(){
  const [page,setPage] = useState('Dashboard');
  return (
    <div className="flex h-screen">
      <Sidebar page={page} setPage={setPage} />
      <div className="flex-1 p-8 overflow-auto">
        {page==='Dashboard' && <Dashboard setPage={setPage} />}
        {page==='Pastes' && <Pastes />}
        {page==='Builders' && <Builders />}
        {page==='Users' && <Users />}
        {page==='Config' && <Config />}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);

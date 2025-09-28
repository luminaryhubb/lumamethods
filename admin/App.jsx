// admin/app.jsx
const { useState, useEffect } = React;

function Sidebar({ page, setPage }) {
  const items = ["Dashboard", "Pastes", "Builders", "Users", "Config"];
  return (
    <div className="w-64 bg-neutral-900 p-4 flex flex-col space-y-4 text-white h-screen">
      <div className="text-2xl font-bold text-purple-300 mb-4">Luma Admin</div>
      {items.map((i) => (
        <button
          key={i}
          className={
            "text-left p-2 rounded transition " +
            (page === i
              ? "bg-purple-700 text-white"
              : "text-neutral-300 hover:bg-neutral-700")
          }
          onClick={() => setPage(i)}
        >
          {i}
        </button>
      ))}
      <div className="mt-auto text-xs text-neutral-500">
        Painel Administrativo
      </div>
    </div>
  );
}

// Card pequeno de estatísticas
function StatCard({ title, value, subtitle }) {
  return (
    <div className="bg-neutral-800 p-4 rounded">
      <div className="text-sm text-neutral-300">{title}</div>
      <div className="text-2xl font-bold text-purple-300">{value}</div>
      {subtitle && (
        <div className="text-xs text-neutral-400 mt-1">{subtitle}</div>
      )}
    </div>
  );
}

// Dashboard
function Dashboard() {
  const [stats, setStats] = useState({
    totalPastes: 0,
    totalUsers: 0,
    buildersCount: 0,
    views: 0,
    days: [],
    usersTimeseries: [],
    topPastes: [],
  });

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((j) => setStats(j))
      .catch(() => {});
  }, []);

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Pastes" value={stats.totalPastes} />
        <StatCard title="Usuários" value={stats.totalUsers} />
        <StatCard title="Builders" value={stats.buildersCount} />
        <StatCard title="Views totais" value={stats.views} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-neutral-800 p-4 rounded">
          <div className="text-sm text-neutral-300 mb-2">
            Usuários (últimos 7 dias)
          </div>
          <canvas id="chart-users"></canvas>
        </div>
        <div className="bg-neutral-800 p-4 rounded">
          <div className="text-sm text-neutral-300 mb-2">Top Pastes</div>
          <ul>
            {stats.topPastes &&
              stats.topPastes.slice(0, 3).map((p) => (
                <li key={p.id} className="mb-2">
                  <div className="font-semibold text-purple-300">
                    {p.id}{" "}
                    <span className="text-neutral-400">
                      ({p.views} views)
                    </span>
                  </div>
                  <div className="text-xs text-neutral-400">
                    por {p.createdByName || "unknown"}
                  </div>
                </li>
              ))}
          </ul>
        </div>
      </div>

      <DashboardCharts
        days={stats.days}
        usersTimeseries={stats.usersTimeseries}
      />
    </div>
  );
}

function DashboardCharts({ days, usersTimeseries }) {
  useEffect(() => {
    const ctx = document.getElementById("chart-users");
    if (!ctx) return;
    if (window._chartUsers) window._chartUsers.destroy();
    window._chartUsers = new Chart(ctx, {
      type: "line",
      data: {
        labels: days || [],
        datasets: [
          {
            label: "Usuários novos",
            data: usersTimeseries || [],
            fill: true,
            tension: 0.3,
            borderColor: "#9f7aea",
            backgroundColor: "rgba(159,122,234,0.15)",
          },
        ],
      },
      options: { responsive: true, plugins: { legend: { display: false } } },
    });
  }, [days, usersTimeseries]);
  return null;
}

// Pastes
function Pastes() {
  const [pastes, setPastes] = useState([]);

  async function load() {
    const res = await fetch("/api/admin/pastes");
    if (!res.ok) return setPastes([]);
    const j = await res.json();
    setPastes(j);
  }

  useEffect(() => {
    load();
  }, []);

  async function del(id) {
    if (!confirm("Apagar paste " + id + "?")) return;
    const res = await fetch("/api/admin/paste/" + id, { method: "DELETE" });
    if (res.ok) load();
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl mb-4">Pastes</h1>
      <div className="grid gap-4">
        {pastes.map((p) => (
          <div
            key={p.id}
            className="bg-neutral-800 p-4 rounded flex justify-between items-start"
          >
            <div className="max-w-3xl">
              <div className="flex items-baseline space-x-3">
                <div className="font-mono font-semibold text-lg">{p.id}</div>
                <div className="text-neutral-400 text-sm">
                  ({p.views} views)
                </div>
              </div>
              <div className="mt-2 text-neutral-200">{p.text}</div>
              <div className="mt-2 text-neutral-400 text-sm">
                Senha: {p.password}
              </div>
              <div className="mt-2 text-neutral-400 text-sm">
                Link:{" "}
                <a
                  className="text-purple-400"
                  href={`/paste/${p.id}`}
                  target="_blank"
                >
                  {window.location.origin}/paste/{p.id} -{" "}
                  {p.createdByName || p.createdBy}
                </a>
              </div>
            </div>
            <div>
              <button
                onClick={() => del(p.id)}
                className="bg-red-600 px-3 py-2 rounded"
              >
                Apagar
              </button>
            </div>
          </div>
        ))}
        {pastes.length === 0 && (
          <div className="text-neutral-400">Nenhum paste</div>
        )}
      </div>
    </div>
  );
}

// Builders
function Builders() {
  const [summary, setSummary] = useState({
    logs: [],
    byPlatform: {},
    byGame: {},
  });

  useEffect(() => {
    fetch("/api/admin/builders")
      .then((r) => r.json())
      .then((j) => setSummary(j))
      .catch(() => {});
  }, []);

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl mb-4">Builders</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-neutral-800 p-4 rounded">
          <div className="text-sm text-neutral-300 mb-2">Plataformas</div>
          <ul>
            {Object.entries(summary.byPlatform || {}).map(([k, v]) => (
              <li key={k} className="flex justify-between">
                <span>{k}</span>
                <span className="text-neutral-400">{v}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-neutral-800 p-4 rounded">
          <div className="text-sm text-neutral-300 mb-2">Jogos</div>
          <ul>
            {Object.entries(summary.byGame || {}).map(([k, v]) => (
              <li key={k} className="flex justify-between">
                <span>{k}</span>
                <span className="text-neutral-400">{v}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-neutral-800 p-4 rounded">
        <h3 className="mb-2">Logs recentes</h3>
        {summary.logs
          .slice()
          .reverse()
          .slice(0, 30)
          .map((l) => (
            <div
              key={l.id || l.createdAt}
              className="border-t border-neutral-700 py-2"
            >
              <div className="text-sm">
                {l.username} — {l.platform || l.mode}{" "}
                {l.game ? `(${l.game})` : ""}
              </div>
              <div className="text-xs text-neutral-400">
                {new Date(l.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        {(!summary.logs || summary.logs.length === 0) && (
          <div className="text-neutral-400">Nenhum log</div>
        )}
      </div>
    </div>
  );
}

// Users
function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/users");
    if (res.ok) {
      setUsers(await res.json());
    }
    setLoading(false);
  }
  useEffect(() => load(), []);

  async function toggleBlock(id) {
    await fetch(`/api/admin/block/${id}`, { method: "POST" });
    load();
  }
  async function addUses(id) {
    const a = parseInt(prompt("Quantas uses adicionar? (ex: 3)"));
    if (!a) return;
    await fetch(`/api/admin/adduses/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: a }),
    });
    load();
  }
  async function setRole(id) {
    const r = prompt("Defina role: Membro / Basic / Plus / Premium");
    if (!r) return;
    await fetch(`/api/admin/role/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: r }),
    });
    load();
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl mb-4">Usuários</h1>
      {loading && <div className="text-neutral-400">Carregando...</div>}
      <div className="space-y-3">
        {users.map((u) => (
          <div
            key={u.id}
            className="bg-neutral-800 p-3 rounded flex justify-between items-center"
          >
            <div>
              <div className="font-semibold">
                {u.username}{" "}
                <span className="text-xs text-neutral-400">({u.id})</span>
              </div>
              <div className="text-sm text-neutral-400">
                Uses: {u.usesLeft} — Roles: {(u.roles || []).join(", ")}
              </div>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => setRole(u.id)}
                className="bg-purple-600 px-2 py-1 rounded"
              >
                Set Role
              </button>
              <button
                onClick={() => addUses(u.id)}
                className="bg-green-600 px-2 py-1 rounded"
              >
                Add Uses
              </button>
              <button
                onClick={() => toggleBlock(u.id)}
                className={
                  u.blocked
                    ? "bg-green-600 px-2 py-1 rounded"
                    : "bg-red-600 px-2 py-1 rounded"
                }
              >
                {u.blocked ? "Unblock" : "Block"}
              </button>
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className="text-neutral-400">Nenhum usuário</div>
        )}
      </div>
    </div>
  );
}

// Config
function Config() {
  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl mb-4">Config</h1>
      <div className="bg-neutral-800 p-4 rounded">
        <p className="text-neutral-400">
          Configurações básicas poderão ser adicionadas aqui.
        </p>
      </div>
    </div>
  );
}

// Tela de não-admin
function NotAdmin() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-black">
      <div className="bg-neutral-900 text-white rounded-xl p-8 shadow-2xl max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold text-red-400">
          Você não é um administrador
        </h1>
        <p className="text-neutral-300">
          O que está fazendo aqui? Apenas administradores podem acessar este
          painel.
        </p>
        <a href="/" className="inline-block bg-purple-600 px-4 py-2 rounded">
          Voltar ao site
        </a>
      </div>
    </div>
  );
}

// App principal
function App() {
  const [page, setPage] = useState("Dashboard");
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    fetch("/api/is-admin")
      .then((r) => r.json())
      .then((j) => setIsAdmin(j.isAdmin))
      .catch(() => setIsAdmin(false));
  }, []);

  if (isAdmin === null)
    return (
      <div className="h-screen flex items-center justify-center text-white">
        Carregando...
      </div>
    );
  if (!isAdmin) return <NotAdmin />;

  return (
    <div className="flex">
      <Sidebar page={page} setPage={setPage} />
      <div className="flex-1 min-h-screen bg-neutral-950">
        {page === "Dashboard" && <Dashboard />}
        {page === "Pastes" && <Pastes />}
        {page === "Builders" && <Builders />}
        {page === "Users" && <Users />}
        {page === "Config" && <Config />}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

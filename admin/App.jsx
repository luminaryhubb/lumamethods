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

function Dashboard() {
  const [stats, setStats] = useState({
    totalPastes: 0,
    totalUsers: 0,
    buildersCount: 0,
    views: 0,
    days: [],
    usersTimeseries: [],
    topPastes: [],
    rolesDistribution: { Membro: 0, Basic: 0, Plus: 0, Premium: 0 },
    buildersByPlatform: {},
  });

  useEffect(() => {
    async function load() {
      try {
        const [s, b, u] = await Promise.all([
          fetch("/api/admin/stats").then((r) => r.json()),
          fetch("/api/admin/builders").then((r) => r.json()),
          fetch("/api/users").then((r) => r.json()),
        ]);

        const rolesDist = { Membro: 0, Basic: 0, Plus: 0, Premium: 0 };
        u.forEach((usr) => {
          (usr.roles || []).forEach((role) => {
            if (rolesDist[role] !== undefined) rolesDist[role]++;
          });
        });

        setStats({
          ...s,
          rolesDistribution: rolesDist,
          buildersByPlatform: b.byPlatform || {},
        });
      } catch (e) {
        console.error("Erro carregando dashboard", e);
      }
    }
    load();
  }, []);

  return (
    <div className="p-6 text-white space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Pastes" value={stats.totalPastes} />
        <StatCard title="Usuários" value={stats.totalUsers} />
        <StatCard title="Builders" value={stats.buildersCount} />
        <StatCard title="Views totais" value={stats.views} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-neutral-800 p-4 rounded shadow-md">
          <div className="text-sm text-neutral-300 mb-2">
            Usuários (últimos 7 dias)
          </div>
          <canvas id="chart-users"></canvas>
        </div>
        <div className="bg-neutral-800 p-4 rounded shadow-md">
          <div className="text-sm text-neutral-300 mb-2">Top Pastes</div>
          <ul>
            {stats.topPastes &&
              stats.topPastes.slice(0, 3).map((p) => (
                <li key={p.id} className="mb-2 border-b border-neutral-700 pb-2">
                  <div className="font-semibold text-purple-300">
                    {p.id}{" "}
                    <span className="text-neutral-400">({p.views} views)</span>
                  </div>
                  <div className="text-xs text-neutral-400">
                    por {p.createdByName || "unknown"}
                  </div>
                </li>
              ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-neutral-800 p-4 rounded shadow-md">
          <div className="text-sm text-neutral-300 mb-2">
            Distribuição de Roles
          </div>
          <canvas id="chart-roles"></canvas>
        </div>
        <div className="bg-neutral-800 p-4 rounded shadow-md">
          <div className="text-sm text-neutral-300 mb-2">
            Builders por plataforma
          </div>
          <canvas id="chart-builders"></canvas>
        </div>
      </div>

      <DashboardCharts
        days={stats.days}
        usersTimeseries={stats.usersTimeseries}
        rolesDistribution={stats.rolesDistribution}
        buildersByPlatform={stats.buildersByPlatform}
      />
    </div>
  );
}

function DashboardCharts({ days, usersTimeseries, rolesDistribution, buildersByPlatform }) {
  useEffect(() => {
    const ctx = document.getElementById("chart-users");
    if (ctx) {
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
    }

    const ctxRoles = document.getElementById("chart-roles");
    if (ctxRoles) {
      if (window._chartRoles) window._chartRoles.destroy();
      window._chartRoles = new Chart(ctxRoles, {
        type: "doughnut",
        data: {
          labels: Object.keys(rolesDistribution),
          datasets: [
            {
              data: Object.values(rolesDistribution),
              backgroundColor: ["#6b46c1", "#805ad5", "#9f7aea", "#b794f4"],
            },
          ],
        },
        options: { responsive: true },
      });
    }

    const ctxBuilders = document.getElementById("chart-builders");
    if (ctxBuilders) {
      if (window._chartBuilders) window._chartBuilders.destroy();
      window._chartBuilders = new Chart(ctxBuilders, {
        type: "bar",
        data: {
          labels: Object.keys(buildersByPlatform || {}),
          datasets: [
            {
              data: Object.values(buildersByPlatform || {}),
              backgroundColor: "#9f7aea",
            },
          ],
        },
        options: { responsive: true, plugins: { legend: { display: false } } },
      });
    }
  }, [days, usersTimeseries, rolesDistribution, buildersByPlatform]);

  return null;
}

/* ------------------- PASTES ------------------- */
function Pastes() {
  const [pastes, setPastes] = useState([]);
  const [info, setInfo] = useState(null);

  useEffect(() => {
    fetch("/api/admin/pastes")
      .then(r => r.json())
      .then(setPastes)
      .catch(err => console.error("Erro carregando pastes", err));
  }, []);

  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl font-bold mb-4">Pastes</h2>
      {pastes.length === 0 ? (
        <p>Nenhum paste encontrado.</p>
      ) : (
        <ul className="space-y-4">
          {pastes.map(p => (
            <li key={p.id} className="p-4 bg-neutral-800 rounded flex justify-between items-start">
              <div>
                <div className="font-semibold text-purple-300">
                  {p.link} <span className="text-neutral-400">({p.views} views)</span>
                </div>
                <div className="text-sm">{p.content}</div>
                <div className="text-xs text-neutral-400 mt-1">Senha: {p.password}</div>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => fetch(`/api/admin/paste/${p.id}`, { method: "DELETE" })}
                  className="bg-red-600 px-3 py-1 rounded"
                >
                  Apagar
                </button>
                <button
                  onClick={() => setInfo(p)}
                  className="bg-blue-600 px-3 py-1 rounded"
                >
                  Info
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {info && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-neutral-900 p-6 rounded shadow-lg w-96 text-white">
            <h3 className="text-xl font-bold mb-2">Informações do Paste</h3>
            <p><b>ID:</b> {info.id}</p>
            <p><b>Criado por:</b> {info.username}</p>
            <button
              onClick={() => setInfo(null)}
              className="mt-4 bg-purple-600 px-3 py-1 rounded"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------- USERS ------------------- */
function Users() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("/api/admin/users")
      .then(r => r.json())
      .then(setUsers)
      .catch(err => console.error("Erro carregando usuários", err));
  }, []);

  function updateRole(id, role) {
    fetch(`/api/admin/users/${id}/role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    }).then(() => {
      setUsers(users.map(u => u.id === id ? { ...u, role } : u));
    });
  }

  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl font-bold mb-4">Usuários</h2>
      {users.length === 0 ? (
        <p>Nenhum usuário encontrado.</p>
      ) : (
        <ul className="space-y-3">
          {users.map(u => (
            <li key={u.id} className="p-4 bg-neutral-800 rounded flex justify-between">
              <div>
                <div className="font-bold">{u.username}</div>
                <div className="text-xs text-neutral-400">({u.id})</div>
                <div className="text-sm mt-1">Cargo: {u.role || "Membro"}</div>
                <div className="text-sm">Usos: {u.usos || 0}</div>
              </div>
              <div className="space-x-2">
                {["Basic", "Plus", "Premium"].map(r => (
                  <button
                    key={r}
                    onClick={() => updateRole(u.id, r)}
                    className="bg-purple-600 px-2 py-1 rounded"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Builders() {
  const [builders, setBuilders] = useState([]);

  useEffect(() => {
    fetch("/api/admin/builders")
      .then(r => r.json())
      .then(setBuilders)
      .catch(err => console.error("Erro carregando builders", err));
  }, []);

  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl font-bold mb-4">Builders</h2>
      <ul className="space-y-2">
        {builders.map(b => (
          <li key={b.id} className="p-3 bg-neutral-800 rounded">
            <div>{b.name} — {b.platform}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Config() {
  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl font-bold mb-4">Configurações</h2>
      <p>Ajuste as configurações do sistema aqui.</p>
    </div>
  );
}

function NotAdmin() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-black">
      <div className="bg-neutral-900 text-white rounded-xl p-8 shadow-2xl max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold text-red-400">
          Você não é um administrador
        </h1>
        <p className="text-neutral-300">
          Apenas administradores podem acessar este painel.
        </p>
        <a href="/" className="inline-block bg-purple-600 px-4 py-2 rounded">
          Voltar ao site
        </a>
      </div>
    </div>
  );
}

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

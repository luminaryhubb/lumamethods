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

/* ---------------- DASHBOARD ---------------- */
function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPastes: 0,
    totalBuilders: 0,
    totalViews: 0,
    days: [],
    usersTimeseries: [],
    topPastes: [],
  });

  useEffect(() => {
    async function load() {
      try {
        const s = await fetch("/api/admin/stats").then((r) => r.json());
        setStats(s);
      } catch (e) {
        console.error("Erro dashboard", e);
      }
    }
    load();
  }, []);

  useEffect(() => {
    const ctx = document.getElementById("chart-users");
    if (!ctx) return;
    if (window._chartUsers) window._chartUsers.destroy();
    window._chartUsers = new Chart(ctx, {
      type: "line",
      data: {
        labels: stats.days || [],
        datasets: [
          {
            label: "Usuários novos",
            data: stats.usersTimeseries || [],
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: { responsive: true, plugins: { legend: { display: false } } },
    });
  }, [stats.days, stats.usersTimeseries]);

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Pastes" value={stats.totalPastes} />
        <StatCard title="Usuários" value={stats.totalUsers} />
        <StatCard title="Builders" value={stats.totalBuilders} />
        <StatCard title="Views totais" value={stats.totalViews} />
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
              stats.topPastes.slice(0, 5).map((p) => (
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
    </div>
  );
}

/* ---------------- PASTES ---------------- */
function Pastes() {
  const [pastes, setPastes] = useState([]);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pastes");
      const j = await res.json();
      setPastes(j.pastes || []);
    } catch (e) {
      console.error("Erro carregando pastes", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function del(id) {
    if (!confirm("Apagar paste " + id + "?")) return;
    const res = await fetch(`/api/admin/delete-paste`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) load();
    else alert("Erro ao apagar");
  }

  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl font-bold mb-4">Pastes</h2>
      {loading && <div className="text-neutral-400">Carregando...</div>}
      {!loading && pastes.length === 0 && (
        <div className="text-neutral-400">Nenhum paste</div>
      )}
      <ul className="space-y-4">
        {pastes.map((p) => (
          <li
            key={p.id}
            className="p-4 bg-neutral-800 rounded flex justify-between items-start"
          >
            <div className="max-w-3xl">
              <div className="flex items-baseline gap-3">
                <a
                  className="font-mono font-semibold text-lg text-purple-300"
                  href={`/paste/${p.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {window.location.origin}/paste/{p.id}
                </a>
                <span className="text-neutral-400 text-sm">
                  ({p.views} views)
                </span>
              </div>
              <div className="mt-2 text-neutral-200 whitespace-pre-wrap">
                {p.content || p.text}
              </div>
              <div className="mt-2 text-neutral-400 text-sm">
                Senha: {p.password}
              </div>
              <div className="mt-1 text-xs text-neutral-400">
                Criado em: {new Date(p.createdAt).toLocaleString()}
              </div>
            </div>
            <div className="flex flex-col gap-2 ml-4">
              <button
                onClick={() => del(p.id)}
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

      {info && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-neutral-900 p-6 rounded shadow-lg w-96 text-white">
            <h3 className="text-xl font-bold mb-2">Informações do Paste</h3>
            <p>
              <b>ID:</b> {info.id}
            </p>
            <p>
              <b>Criado por:</b>{" "}
              {info.createdByName || info.createdBy || "unknown"}
            </p>
            <p className="mt-2">
              <b>Conteúdo:</b>
            </p>
            <pre className="bg-neutral-800 p-2 rounded text-sm whitespace-pre-wrap">
              {info.content || info.text}
            </pre>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setInfo(null)}
                className="bg-purple-600 px-3 py-1 rounded"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- USERS ---------------- */
function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const j = await res.json();
      setUsers(j.users || []);
    } catch (e) {
      console.error("Erro carregando usuários", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleBlock(id, blocked) {
    const endpoint = blocked ? "/api/admin/unblock" : "/api/admin/block";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) load();
    else alert("Erro ao bloquear/desbloquear");
  }

  async function addUses(id) {
    const a = parseInt(prompt("Quantas uses adicionar? (ex: 3)"));
    if (!a || isNaN(a)) return;
    const res = await fetch(`/api/admin/adduses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, amount: a }),
    });
    if (res.ok) load();
    else alert("Erro adicionando uses");
  }

  async function setRole(id) {
    const r = prompt("Defina role: Membro / Basic / Plus / Premium");
    if (!r) return;
    const res = await fetch(`/api/admin/role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role: r }),
    });
    if (res.ok) load();
    else {
      const j = await res.json().catch(() => ({ error: "err" }));
      alert("Erro: " + (j.error || "invalid"));
    }
  }

  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl font-bold mb-4">Usuários</h2>
      {loading && <div className="text-neutral-400">Carregando...</div>}
      {!loading && users.length === 0 && (
        <div className="text-neutral-400">Nenhum usuário</div>
      )}
      <div className="space-y-3">
        {users.map((u) => (
          <div
            key={u.id}
            className="bg-neutral-800 p-3 rounded flex justify-between items-center"
          >
            <div>
              <div className="font-semibold">{u.username}</div>
              <div className="text-xs text-neutral-400">({u.id})</div>
              <div className="text-sm text-neutral-400">
                Roles: {(u.roles || []).join(", ") || "Membro"}
              </div>
              <div className="text-sm text-neutral-400">
                Usos:{" "}
                {u.usesLeft === Infinity
                  ? "∞"
                  : u.usesLeft ?? 0}
              </div>
              {u.blocked && (
                <div className="text-xs text-red-400 mt-1">
                  BAN: Usuário bloqueado
                </div>
              )}
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
                onClick={() => toggleBlock(u.id, u.blocked)}
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
      </div>
    </div>
  );
}

function Builders() {
  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl font-bold mb-4">Builders</h2>
      <p>Implementação futura.</p>
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
        <a
          href="/"
          className="inline-block bg-purple-600 px-4 py-2 rounded"
        >
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
      .then((j) => setIsAdmin(!!j.isAdmin))
      .catch(() => setIsAdmin(false));
  }, []);

  if (isAdmin === null) {
    return (
      <div className="h-screen flex items-center justify-center text-white">
        Carregando...
      </div>
    );
  }
  if (!isAdmin) return <NotAdmin />;

  return (
    <div className="flex min-h-screen">
      <Sidebar page={page} setPage={setPage} />
      <div className="flex-1 bg-neutral-950">
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

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
    <div className="bg-neutral-800 p-4 rounded shadow-md">
      <div className="text-sm text-neutral-300">{title}</div>
      <div className="text-3xl font-bold text-purple-300">{value}</div>
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
  });

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((j) => setStats(j))
      .catch(() => {});
  }, []);

  return (
    <div className="p-6 text-white space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Pastes" value={stats.totalPastes} />
        <StatCard title="Usuários" value={stats.totalUsers} />
        <StatCard title="Builders" value={stats.buildersCount} />
        <StatCard title="Views totais" value={stats.views} />
      </div>

      {/* Gráficos principais */}
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

      {/* Gráficos extras */}
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
      />
    </div>
  );
}

function DashboardCharts({ days, usersTimeseries }) {
  useEffect(() => {
    // Chart de usuários
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
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
        },
      });
    }

    // Chart de roles (mock de exemplo, backend pode alimentar)
    const ctxRoles = document.getElementById("chart-roles");
    if (ctxRoles) {
      if (window._chartRoles) window._chartRoles.destroy();
      window._chartRoles = new Chart(ctxRoles, {
        type: "doughnut",
        data: {
          labels: ["Membro", "Basic", "Plus", "Premium"],
          datasets: [
            {
              data: [70, 10, 15, 5],
              backgroundColor: [
                "#6b46c1",
                "#805ad5",
                "#9f7aea",
                "#b794f4",
              ],
            },
          ],
        },
        options: { responsive: true },
      });
    }

    // Chart de builders por plataforma (mock)
    const ctxBuilders = document.getElementById("chart-builders");
    if (ctxBuilders) {
      if (window._chartBuilders) window._chartBuilders.destroy();
      window._chartBuilders = new Chart(ctxBuilders, {
        type: "bar",
        data: {
          labels: ["Roblox", "Discord", "Outros"],
          datasets: [
            {
              data: [12, 8, 4],
              backgroundColor: "#9f7aea",
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
        },
      });
    }
  }, [days, usersTimeseries]);

  return null;
}

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
        {page === "Pastes" && <div className="p-6">[Pastes]</div>}
        {page === "Builders" && <div className="p-6">[Builders]</div>}
        {page === "Users" && <div className="p-6">[Users]</div>}
        {page === "Config" && <div className="p-6">[Config]</div>}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

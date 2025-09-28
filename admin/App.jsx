const { useState, useEffect } = React;

// Sidebar
function Sidebar({ page, setPage }) {
  const items = ["Dashboard", "Pastes", "Builders", "Users", "Config"];
  return (
    <div className="w-64 bg-neutral-900 p-4 flex flex-col space-y-4 text-white">
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

// Dashboard
function Dashboard() {
  const [stats, setStats] = useState({ pastes: 0, views: 0, usersToday: 0 });

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((j) => setStats(j))
      .catch(() => {});
  }, []);

  return (
    <div className="p-6 text-white space-y-6 w-full">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-neutral-800 p-4 rounded">Pastes: {stats.pastes}</div>
        <div className="bg-neutral-800 p-4 rounded">Views: {stats.views}</div>
        <div className="bg-neutral-800 p-4 rounded">
          Users today: {stats.usersToday}
        </div>
      </div>
    </div>
  );
}

// Pastes
function Pastes() {
  const [pastes, setPastes] = useState([]);

  function load() {
    fetch("/api/admin/pastes")
      .then((r) => r.json())
      .then((j) => setPastes(j))
      .catch(() => {});
  }

  useEffect(() => {
    load();
  }, []);

  async function delPaste(id) {
    if (!confirm("Tem certeza que deseja apagar este paste?")) return;
    const res = await fetch(`/api/admin/paste/${id}`, { method: "DELETE" });
    if (res.ok) {
      load();
    } else {
      alert("Erro ao apagar paste.");
    }
  }

  return (
    <div className="p-6 text-white w-full">
      <h2 className="text-2xl font-bold mb-4">Pastes</h2>
      {pastes.map((p) => (
        <div
          key={p.id}
          className="bg-neutral-800 p-4 rounded mb-3 flex justify-between items-start"
        >
          <div className="max-w-xl break-words">
            <p>
              <b>URL:</b>{" "}
              <a
                className="text-purple-400"
                href={`/paste/${p.id}`}
                target="_blank"
              >
                {window.location.origin}/paste/{p.id}
              </a>
            </p>
            <p>
              <b>Senha:</b> {p.password || "-"}
            </p>
            <p>
              <b>Conteúdo:</b> {p.text}
            </p>
            {p.redirect && (
              <p>
                <b>Redirect:</b> {p.redirect}
              </p>
            )}
          </div>
          <button
            onClick={() => delPaste(p.id)}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
          >
            Apagar
          </button>
        </div>
      ))}
      {pastes.length === 0 && (
        <p className="text-neutral-400">Nenhum paste criado.</p>
      )}
    </div>
  );
}

// Users
function Users() {
  const [users, setUsers] = useState([]);

  function load() {
    fetch("/api/users")
      .then((r) => r.json())
      .then((j) => setUsers(j))
      .catch(() => {});
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleBlock(id) {
    await fetch(`/api/admin/block/${id}`, { method: "POST" });
    load();
  }

  return (
    <div className="p-6 text-white w-full">
      <h2 className="text-2xl mb-4">Usuários</h2>
      {users.map((u) => (
        <div
          key={u.id}
          className="bg-neutral-800 p-3 rounded mb-2 flex justify-between"
        >
          <span>
            {u.username || u.name} ({u.id}) — Usos: {u.usesLeft}{" "}
            {u.blocked && "🚫 BLOQUEADO"}
          </span>
          <button
            onClick={() => toggleBlock(u.id)}
            className={
              "px-3 py-1 rounded " +
              (u.blocked
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700")
            }
          >
            {u.blocked ? "Desbloquear" : "Bloquear"}
          </button>
        </div>
      ))}
      {users.length === 0 && (
        <p className="text-neutral-400">Nenhum usuário encontrado.</p>
      )}
    </div>
  );
}

// Builders
function Builders() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetch("/api/admin/builders")
      .then((r) => r.json())
      .then((j) => setLogs(j))
      .catch(() => {});
  }, []);

  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl mb-4">Builders</h2>
      {logs.length === 0 ? (
        <p className="text-neutral-400">Nenhum log encontrado.</p>
      ) : (
        <div className="space-y-2">
          {logs.map((l, i) => (
            <div key={i} className="bg-neutral-800 p-3 rounded">
              {l}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Config
function Config() {
  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl mb-4">Config</h2>
      <p>Configurações do site...</p>
    </div>
  );
}

// NotAdmin
function NotAdmin() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-black">
      <div className="bg-neutral-900 text-white rounded-xl p-8 shadow-2xl max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold text-red-400">
          Você não é um administrador
        </h1>
        <p className="text-neutral-300">
          O que está fazendo aqui? <br />
          Apenas administradores podem acessar este painel.
        </p>
        <button
          onClick={() => (window.location.href = "/")}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
        >
          Voltar para login
        </button>
      </div>
    </div>
  );
}

// App
function App() {
  const [page, setPage] = useState("Dashboard");
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    fetch("/api/is-admin")
      .then((r) => r.json())
      .then((j) => setIsAdmin(j.admin))
      .catch(() => setIsAdmin(false));
  }, []);

  if (isAdmin === null) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        Carregando...
      </div>
    );
  }

  if (!isAdmin) {
    return <NotAdmin />;
  }

  return (
    <div className="flex h-screen bg-neutral-950">
      <Sidebar page={page} setPage={setPage} />
      <div className="flex-1 overflow-auto">
        {page === "Dashboard" && <Dashboard />}
        {page === "Pastes" && <Pastes />}
        {page === "Builders" && <Builders />}
        {page === "Users" && <Users />}
        {page === "Config" && <Config />}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

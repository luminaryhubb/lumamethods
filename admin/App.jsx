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
            "text-left p-2 rounded " +
            (page === i
              ? "bg-purple-700 text-white"
              : "text-neutral-300 hover:bg-neutral-700")
          }
          onClick={() => setPage(i)}
        >
          {i}
        </button>
      ))}
      <div className="mt-auto text-xs text-neutral-500">Logged as admin</div>
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

// Builders
function Builders() {
  const [usesLeft, setUsesLeft] = useState(0);
  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then((j) => setUsesLeft(j.usesLeft ?? 0));
  }, []);
  async function useBuilder() {
    const res = await fetch("/api/builder/use", { method: "POST" });
    if (res.ok) {
      const j = await res.json();
      setUsesLeft(j.usesLeft);
      alert("Uso consumido!");
    } else {
      alert("Erro: sem usos ou não logado.");
    }
  }
  return (
    <div className="p-6 text-white">
      <h2 className="text-xl mb-4">Builder</h2>
      <p>Usos restantes: {usesLeft}</p>
      <button
        onClick={useBuilder}
        className="mt-4 bg-purple-600 px-4 py-2 rounded"
      >
        Usar Builder
      </button>
    </div>
  );
}

// Users
function Users() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((j) => setUsers(j));
  }, []);

  async function toggleBlock(id) {
    const res = await fetch(`/api/admin/block/${id}`, { method: "POST" });
    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, blocked: updated.blocked } : u))
      );
    }
  }

  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl mb-4">Users</h2>
      {users.map((u) => (
        <div
          key={u.id}
          className="bg-neutral-800 p-3 rounded mb-2 flex justify-between items-center"
        >
          <div>
            {u.name} ({u.id}) — Usos: {u.usesLeft}{" "}
            {u.blocked && <span className="text-red-400 ml-2">(Bloqueado)</span>}
          </div>
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

// Not admin
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
        {page === "Pastes" && (
          <div className="p-6 text-white">Pastes page...</div>
        )}
        {page === "Builders" && <Builders />}
        {page === "Users" && <Users />}
        {page === "Config" && <Config />}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

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
      <div className="mt-auto text-xs text-neutral-500">Painel Administrativo</div>
    </div>
  );
}

// Dashboard
function Dashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, totalPastes: 0, views: 0 });
  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((j) => setStats(j))
      .catch(() => {});
  }, []);
  return (
    <div className="p-6 space-y-6 w-full">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-neutral-800 p-4 rounded">Pastes: {stats.totalPastes}</div>
        <div className="bg-neutral-800 p-4 rounded">Views: {stats.views}</div>
        <div className="bg-neutral-800 p-4 rounded">Usuários: {stats.totalUsers}</div>
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
    <div className="p-6">
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

// Pastes
function Pastes() {
  const [pastes, setPastes] = useState([]);
  useEffect(() => {
    fetch("/api/admin/pastes")
      .then((r) => r.json())
      .then((j) => setPastes(j))
      .catch(() => {});
  }, []);

  async function deletePaste(id) {
    if (!confirm("Tem certeza que deseja apagar este paste?")) return;
    const res = await fetch(`/api/admin/paste/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPastes((p) => p.filter((x) => x.id !== id));
    } else {
      alert("Erro ao apagar paste.");
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Pastes</h2>
      {pastes.map((p) => (
        <div key={p.id} className="bg-neutral-800 p-4 rounded space-y-2">
          <p><b>ID:</b> {p.id}</p>
          <p>
            <b>URL:</b>{" "}
            <a
              href={`/paste/${p.id}`}
              target="_blank"
              className="text-purple-400 underline"
            >
              /paste/{p.id}
            </a>
          </p>
          <p><b>Senha:</b> {p.password}</p>
          <p><b>Conteúdo:</b> {p.text}</p>
          <button
            onClick={() => deletePaste(p.id)}
            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white"
          >
            Apagar
          </button>
        </div>
      ))}
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
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl mb-4">Usuários</h2>
      {users.map((u) => (
        <div key={u.id} className="bg-neutral-800 p-3 rounded">
          {u.username} ({u.id}) — Usos: {u.usesLeft}
        </div>
      ))}
    </div>
  );
}

// Config
function Config() {
  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">Configurações</h2>
      <p>Aqui futuramente vai ter configurações avançadas...</p>
    </div>
  );
}

// Bloqueio
function NotAdmin() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-black">
      <div className="bg-neutral-900 text-white rounded-xl p-8 shadow-2xl max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold text-red-400">
          Você não é um administrador
        </h1>
        <p className="text-neutral-300">
          O que está fazendo aqui? Apenas administradores podem acessar este painel.
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
      .then((j) => setIsAdmin(j.isAdmin))
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
    <div className="flex h-screen bg-neutral-950 text-white">
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

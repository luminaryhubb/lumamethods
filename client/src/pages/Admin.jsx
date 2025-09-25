
import { useEffect, useState } from 'react';

export default function Admin() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then(setStats);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold">Painel Admin</h1>
      {stats ? (
        <div>
          <p>Usuários: {stats.users}</p>
          <p>Shortners: {stats.shortners}</p>
        </div>
      ) : (
        <p>Carregando...</p>
      )}
    </div>
  );
}

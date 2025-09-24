
import React, { useState, useEffect } from 'react';

function getToken() {
  return localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalPastes: 0, newUsersToday: 0 });
  const [topPastes, setTopPastes] = useState([]);
  const [siteConfig, setSiteConfig] = useState({ siteName: 'Luma Methods', themeColor: '#ef4444' });

  // Function to load dashboard data
  const loadDashboardData = async () => {
    try {
      const res = await fetch('/api/admin/stats', { headers: { 'x-admin-token': getToken() } });
      const data = await res.json();
      setStats({ totalPastes: data.totalPastes, newUsersToday: data.newUsersToday });

      const topPastesRes = await fetch('/api/admin/top-pastes', { headers: { 'x-admin-token': getToken() } });
      const topPastesData = await topPastesRes.json();
      setTopPastes(topPastesData);

      const configRes = await fetch('/api/admin/config', { headers: { 'x-admin-token': getToken() } });
      const configData = await configRes.json();
      setSiteConfig(configData);
    } catch (error) {
      console.error('Error loading dashboard data', error);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="bg-dark-bg text-white p-6">
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-neutral-800 p-4 rounded">
          <div className="text-sm text-neutral-400">Total de Pastes</div>
          <div className="text-2xl font-bold">{stats.totalPastes}</div>
        </div>
        <div className="bg-neutral-800 p-4 rounded">
          <div className="text-sm text-neutral-400">Usuários Novos Hoje</div>
          <div className="text-2xl font-bold">{stats.newUsersToday}</div>
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-4">Top 10 Pastes com Mais Visualizações</h3>
      <div className="bg-neutral-800 p-4 rounded mb-6">
        <ul>
          {topPastes.map((paste) => (
            <li key={paste.id} className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">{paste.title}</p>
                <p className="text-xs text-neutral-400">{paste.views} visualizações</p>
              </div>
              <span className="text-xs text-neutral-500">Senha: {paste.password}</span>
            </li>
          ))}
        </ul>
      </div>

      <h3 className="text-lg font-semibold mb-4">Configurações do Site</h3>
      <div className="bg-neutral-800 p-4 rounded mb-6">
        <div>
          <div className="text-sm text-neutral-400">Nome do Site</div>
          <div className="text-xl font-bold">{siteConfig.siteName}</div>
        </div>
        <div>
          <div className="text-sm text-neutral-400">Cor do Tema</div>
          <div className="w-20 h-10 rounded" style={{ backgroundColor: siteConfig.themeColor }}></div>
        </div>
      </div>
    </div>
  );
}

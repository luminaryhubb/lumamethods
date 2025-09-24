import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function getToken() {
    return localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
}

export default function AdminDashboard() {
    const [stats, setStats] = useState([]);
    const [totals, setTotals] = useState({ totalPastes: 0, totalViews: 0, totalUsers: 0 });

    const loadStats = async () => {
        const res = await fetch('/api/admin/stats', { headers: { 'x-admin-token': getToken() } });
        const data = await res.json();
        const chartData = Object.keys(data.counts || {}).map(d => ({ date: d, value: data.counts[d] }));
        setStats(chartData);
        setTotals({
            totalPastes: data.totalPastes || 0,
            totalViews: data.totalViews || 0,
            totalUsers: stats.reduce((total, curr) => total + curr.value, 0), // Add logic for users
        });
    };

    useEffect(() => {
        loadStats();
    }, []);

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-neutral-800 p-4 rounded">
                    <div className="text-sm text-neutral-400">Pastes</div>
                    <div className="text-2xl font-bold">{totals.totalPastes}</div>
                </div>
                <div className="bg-neutral-800 p-4 rounded">
                    <div className="text-sm text-neutral-400">Visualizações</div>
                    <div className="text-2xl font-bold">{totals.totalViews}</div>
                </div>
                <div className="bg-neutral-800 p-4 rounded">
                    <div className="text-sm text-neutral-400">Usuários Hoje</div>
                    <div className="text-2xl font-bold">{totals.totalUsers}</div>
                </div>
            </div>

            <div className="bg-neutral-800 p-4 rounded">
                <h3 className="font-medium mb-2">Acessos últimos 7 dias</h3>
                <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats}>
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="value" stroke="#F43F5E" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

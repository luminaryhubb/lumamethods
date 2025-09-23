import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Cpu, Pause, Play, Settings, Key } from "lucide-react";

const sampleData = Array.from({ length: 20 }).map((_, i) => ({
  name: `t${i}`,
  hash: Math.round(45 + Math.sin(i / 3) * 5 + Math.random() * 3),
}));

export default function ShadowRootDashboard() {
  const [running, setRunning] = useState(true);
  const [hashrate] = useState(54.39);
  const [temperature] = useState(86.0);
  const [sharesAccepted] = useState(233);
  const [sharesRejected] = useState(42);
  const [minerIntensity, setMinerIntensity] = useState(60);
  const [keyValue, setKeyValue] = useState("bc1q3t1x3...9z5qet");

  function toggleRunning() {
    setRunning((s) => !s);
  }

  function generateKey() {
    const k = "bc1" + Math.random().toString(36).slice(2, 20);
    setKeyValue(k);
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-6 font-sans">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 w-12 h-12 rounded-md flex items-center justify-center font-bold">SR</div>
          <div>
            <h1 className="text-2xl font-semibold">ShadowRoot — mineração e utilitários de chaves</h1>
            <p className="text-sm text-neutral-400">Design próprio, moderno e funcional. Gerador de chaves seguro para usos legítimos e educacionais.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-rose-600 rounded-md text-sm">Iniciar mineração</button>
          <button className="px-3 py-2 bg-neutral-800 rounded-md text-sm">Discord</button>
          <button className="px-3 py-2 bg-neutral-800 rounded-md text-sm">Configurações</button>
        </div>
      </header>

      <main className="grid grid-cols-12 gap-6">
        <section className="col-span-8 space-y-6">
          <div className="bg-neutral-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Cpu className="w-6 h-6" />
                <div>
                  <div className="text-xs text-neutral-400">Taxa de Hash</div>
                  <div className="text-xl font-semibold">{hashrate} TH/s</div>
                </div>
              </div>
              <div className="text-sm text-neutral-400">Uptime 00:00:07</div>
            </div>

            <div style={{ height: 220 }} className="w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sampleData}>
                  <XAxis dataKey="name" hide />
                  <YAxis hide />
                  <Tooltip />
                  <Line type="monotone" dataKey="hash" stroke="#F43F5E" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card title="Hashrate">{hashrate} TH/s</Card>
            <Card title="Shares aceitos">{sharesAccepted}</Card>
            <Card title="Temperatura">{temperature} °C</Card>
          </div>

          <div className="bg-neutral-800 rounded-xl p-4">
            <h3 className="font-semibold mb-3">Controle do minerador</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="text-sm text-neutral-400 mb-1">Status</div>
                <div className={`inline-block px-3 py-1 rounded-full text-sm ${running ? 'bg-emerald-600' : 'bg-rose-600'}`}>{running ? 'Ativo' : 'Pausado'}</div>
              </div>

              <div className="w-64">
                <div className="text-sm text-neutral-400">Intensidade</div>
                <input type="range" min="0" max="100" value={minerIntensity} onChange={(e) => setMinerIntensity(Number(e.target.value))} className="w-full mt-2" />
              </div>

              <div className="flex gap-2">
                <button onClick={toggleRunning} className="px-4 py-2 rounded-md bg-neutral-700 flex items-center gap-2"><Pause className="w-4 h-4" />{running ? 'Pausar' : 'Retomar'}</button>
                <button className="px-4 py-2 rounded-md bg-neutral-700 flex items-center gap-2"><Settings className="w-4 h-4" />Config</button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-neutral-400 mb-2">Endereço para recebimento</div>
                <div className="bg-neutral-900 p-3 rounded-md font-mono text-sm break-all">{keyValue}</div>
              </div>

              <div>
                <div className="text-sm text-neutral-400 mb-2">Opções</div>
                <div className="flex gap-2">
                  <button onClick={generateKey} className="px-4 py-2 rounded-md bg-indigo-600 flex items-center gap-2"><Key className="w-4 h-4" />Gerar</button>
                  <button className="px-4 py-2 rounded-md bg-neutral-700">Copiar</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="col-span-4 space-y-6">
          <div className="bg-neutral-800 rounded-xl p-4">
            <h4 className="font-semibold mb-3">Gerador de chaves (ético)</h4>
            <p className="text-sm text-neutral-400 mb-3">Gera chaves aleatórias para testes/uso legítimo. Não realiza brute force ou varredura de carteiras.</p>
            <div className="flex gap-2">
              <input className="flex-1 rounded-md bg-neutral-900 p-2 font-mono text-sm" value={keyValue} readOnly />
              <button onClick={generateKey} className="px-4 py-2 rounded-md bg-indigo-600">Gerar</button>
            </div>
          </div>

          <div className="bg-neutral-800 rounded-xl p-4">
            <h4 className="font-semibold">Estatísticas</h4>
            <ul className="mt-3 space-y-2 text-sm text-neutral-300">
              <li>Shares aceitos: <span className="font-medium">{sharesAccepted}</span></li>
              <li>Shares rejeitados: <span className="font-medium">{sharesRejected}</span></li>
              <li>Dificuldade de rede: <span className="font-medium">85.00 T</span></li>
              <li>Pool: <span className="font-medium">PPS</span></li>
            </ul>
          </div>

          <div className="bg-neutral-800 rounded-xl p-4">
            <h4 className="font-semibold">Progresso de pagamento</h4>
            <div className="w-full bg-neutral-700 rounded-full h-3 overflow-hidden mt-2">
              <div style={{ width: '18%' }} className="h-full bg-indigo-600" />
            </div>
            <div className="text-xs text-neutral-400 mt-2">0.001 / 0.006 BTC</div>
          </div>
        </aside>
      </main>

      <footer className="mt-8 text-center text-xs text-neutral-500">ShadowRoot • painel em tempo real</footer>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-neutral-800 rounded-xl p-4">
      <div className="text-xs text-neutral-400">{title}</div>
      <div className="text-lg font-semibold mt-1">{children}</div>
    </div>
  );
}
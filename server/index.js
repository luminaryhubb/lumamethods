const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { nanoid } = require('nanoid');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Default admin credentials (as requested)
const ADMIN_USER = process.env.ADMIN_USER || 'luma';
const ADMIN_PASS = process.env.ADMIN_PASS || 'cachorro1337';

app.use(cors());
app.use(bodyParser.json({ limit: '2mb' }));

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const PASTES_FILE = path.join(DATA_DIR, 'pastes.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const ADMINS_FILE = path.join(DATA_DIR, 'admins.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(PASTES_FILE)) fs.writeFileSync(PASTES_FILE, JSON.stringify({ pastes: {} }, null, 2));
if (!fs.existsSync(CONFIG_FILE)) fs.writeFileSync(CONFIG_FILE, JSON.stringify({ siteName: 'Luma Methods', icon: '', themeColor: '#ef4444', allowCreation: true }, null, 2));
// store admin hashed password
if (!fs.existsSync(ADMINS_FILE)) {
  const hash = bcrypt.hashSync(ADMIN_PASS, 10);
  fs.writeFileSync(ADMINS_FILE, JSON.stringify({ user: ADMIN_USER, passHash: hash }, null, 2));
}

function readJSON(file){
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function writeJSON(file, data){
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// simple in-memory admin sessions { token: {user, expires} }
const sessions = {};

// middleware to protect admin routes
function requireAdmin(req, res, next){
  const token = req.header('x-admin-token');
  if (!token) return res.status(401).json({ error: 'No admin token' });
  const s = sessions[token];
  if (!s) return res.status(401).json({ error: 'Invalid token' });
  // check expiry (30 days)
  if (new Date() > new Date(s.expires)) {
    delete sessions[token];
    return res.status(401).json({ error: 'Session expired' });
  }
  req.admin = s.user;
  next();
}

// create paste (honors config.allowCreation)
app.post('/api/create', (req, res) => {
  const { text, password, redirect } = req.body;
  const config = readJSON(CONFIG_FILE);
  if (!config.allowCreation) return res.status(403).json({ error: 'Creation disabled by admin' });
  if (!text || !password) return res.status(400).json({ error: 'Text and password required' });
  const id = nanoid(8);
  const data = readJSON(PASTES_FILE);
  data.pastes[id] = {
    id,
    text,
    password,
    redirect: redirect || null,
    createdAt: new Date().toISOString(),
    accesses: []
  };
  writeJSON(PASTES_FILE, data);
  res.json({ link: `/paste/${id}`, id });
});

// verify password and return content or redirect
app.post('/api/verify/:id', (req, res) => {
  const { password } = req.body;
  const id = req.params.id;
  const data = readJSON(PASTES_FILE);
  const paste = data.pastes[id];
  if (!paste) return res.status(404).json({ error: 'Paste not found' });
  if (paste.password !== password) return res.status(403).json({ error: 'Incorrect password' });
  paste.accesses.push(new Date().toISOString());
  writeJSON(PASTES_FILE, data);
  if (paste.redirect) return res.json({ redirect: paste.redirect });
  return res.json({ text: paste.text });
});

// get paste metadata (no text)
app.get('/api/paste/:id', (req, res) => {
  const id = req.params.id;
  const data = readJSON(PASTES_FILE);
  const paste = data.pastes[id];
  if (!paste) return res.status(404).json({ error: 'Paste not found' });
  const { id: pid, createdAt, redirect, accesses } = paste;
  res.json({ id: pid, createdAt, redirect, accessesCount: accesses.length });
});

// admin login
app.post('/api/admin/login', (req, res) => {
  const { user, password } = req.body;
  if (!user || !password) return res.status(400).json({ error: 'user and password required' });
  const adm = readJSON(ADMINS_FILE);
  if (user !== adm.user) return res.status(403).json({ error: 'Invalid credentials' });
  if (!bcrypt.compareSync(password, adm.passHash)) return res.status(403).json({ error: 'Invalid credentials' });
  const token = nanoid(24);
  const expires = new Date(); expires.setDate(expires.getDate() + 30); // 30 days session
  sessions[token] = { user, expires: expires.toISOString() };
  res.json({ token, expires: expires.toISOString() });
});

// admin: list pastes
app.get('/api/admin/pastes', requireAdmin, (req, res) => {
  const data = readJSON(PASTES_FILE);
  const list = Object.values(data.pastes).map(p => ({
    id: p.id, createdAt: p.createdAt, redirect: p.redirect, accessesCount: p.accesses.length, textPreview: p.text.slice(0,200), password: p.password
  }));
  res.json({ pastes: list });
});

// admin: delete paste
app.delete('/api/admin/pastes/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  const data = readJSON(PASTES_FILE);
  if (!data.pastes[id]) return res.status(404).json({ error: 'Paste not found' });
  delete data.pastes[id];
  writeJSON(PASTES_FILE, data);
  res.json({ ok: true });
});

// admin: stats (accesses per day for last 7 days + totals)
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const data = readJSON(PASTES_FILE);
  const allAccesses = [];
  Object.values(data.pastes).forEach(p => (p.accesses||[]).forEach(a => allAccesses.push(a)));
  const counts = {};
  const today = new Date();
  for (let i=6;i>=0;i--){
    const d = new Date(today); d.setDate(today.getDate() - i);
    const keyDay = d.toISOString().slice(0,10);
    counts[keyDay]=0;
  }
  allAccesses.forEach(ts => { const day = ts.slice(0,10); if (counts.hasOwnProperty(day)) counts[day]++; });
  const totalPastes = Object.keys(data.pastes).length;
  const totalViews = allAccesses.length;
  res.json({ counts, totalPastes, totalViews });
});

// admin: get/set config
app.get('/api/admin/config', requireAdmin, (req, res) => {
  const cfg = readJSON(CONFIG_FILE);
  res.json(cfg);
});
app.put('/api/admin/config', requireAdmin, (req, res) => {
  const newCfg = req.body || {};
  const cfg = readJSON(CONFIG_FILE);
  const merged = Object.assign(cfg, newCfg);
  writeJSON(CONFIG_FILE, merged);
  res.json({ ok: true, config: merged });
});

// admin: toggle maintenance (disable creation)
app.post('/api/admin/maintenance', requireAdmin, (req, res) => {
  const { allowCreation } = req.body;
  const cfg = readJSON(CONFIG_FILE);
  cfg.allowCreation = !!allowCreation;
  writeJSON(CONFIG_FILE, cfg);
  res.json({ ok: true, config: cfg });
});

// serve client static build if exists
const clientDist = path.join(process.cwd(), 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('API running. Client not built.');
  });
}

app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});

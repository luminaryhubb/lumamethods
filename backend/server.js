require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Serve frontend built files in production
app.use('/', express.static(path.join(__dirname, '..', 'frontend', 'dist')));
app.use('/static', express.static(path.join(__dirname, '..', 'frontend', 'public')));

// Setup DB (sqlite)
const dbFile = path.join(__dirname, 'luma.db');
const db = new Database(dbFile);
db.prepare('CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT, avatar TEXT, roles TEXT, usesToday INTEGER, lastUseDate TEXT)').run();
db.prepare('CREATE TABLE IF NOT EXISTS records (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, key TEXT, time TEXT)').run();

// Helper to upsert user
function upsertUser(u){
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(u.id);
  if(existing){
    db.prepare('UPDATE users SET username = ?, avatar = ?, roles = ? WHERE id = ?').run(u.username, u.avatar || '', (u.roles || []).join(','), u.id);
    return;
  }
  db.prepare('INSERT INTO users (id, username, avatar, roles, usesToday, lastUseDate) VALUES (?, ?, ?, ?, 0, NULL)').run(u.id, u.username, u.avatar || '', (u.roles || []).join(','));
}

// Discord OAuth endpoints
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const CALLBACK = process.env.DISCORD_CALLBACK_URL;

app.get('/auth/discord', (req, res) => {
  if(!CLIENT_ID) return res.status(500).send('DISCORD_CLIENT_ID not configured');
  const state = Math.random().toString(36).slice(2);
  req.session.oauth_state = state;
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: CALLBACK,
    response_type: 'code',
    scope: 'identify email guilds'
  }).toString();
  res.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
});

app.get('/auth/callback', async (req, res) => {
  try{
    const code = req.query.code;
    const state = req.query.state;
    if(!code) return res.status(400).send('No code');
    if(state && req.session.oauth_state && state !== req.session.oauth_state){ return res.status(400).send('Invalid state'); }

    // exchange code for token
    const tokenRes = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: CALLBACK
    }).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

    const access_token = tokenRes.data.access_token;
    // fetch user
    const me = await axios.get('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${access_token}` } });
    const user = { id: me.data.id, username: me.data.username, avatar: me.data.avatar ? `https://cdn.discordapp.com/avatars/${me.data.id}/${me.data.avatar}.png` : '', roles: ['Membro'] };

    // persist user in session + DB
    req.session.user = user;
    upsertUser(user);

    // If opened as popup: postMessage to opener and close
    const script = `
      <script>
        try{ window.opener.postMessage({ type:'LUMA_AUTH', user: ${JSON.stringify(user)} }, '*'); }catch(e){}
        try{ window.close(); }catch(e){ window.location = '/'; }
      </script>`;
    res.send(script);
  }catch(err){
    console.error(err.response ? err.response.data : err.message);
    res.status(500).send('OAuth error');
  }
});

app.get('/auth/logout', (req, res) => {
  req.session.destroy(()=>{ res.redirect('/'); });
});

// API endpoints
app.get('/api/auth/status', (req, res) => {
  if(req.session && req.session.user) return res.json({ user: req.session.user });
  return res.status(401).json({ ok:false });
});

app.get('/api/auth/verify-oauth', async (req, res) => {
  // double-check by attempting to fetch /users/@me using stored session token is not stored; this endpoint simply checks session
  if(req.session && req.session.user) return res.json({ ok:true });
  return res.status(401).json({ ok:false });
});

app.get('/api/admin/check', (req, res) => {
  const adminEnv = (process.env.ADMIN_IDS || '').split(',').filter(Boolean);
  if(req.session && req.session.user && adminEnv.includes(req.session.user.id)) return res.json({ admin:true });
  return res.status(403).json({ admin:false });
});

// Uses increment and remaining
app.post('/api/uses/increment', (req, res) => {
  const user = req.session && req.session.user;
  const now = new Date().toISOString().slice(0,10);
  if(!user) return res.status(401).json({ error:'not_logged' });
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
  if(u){
    let usesToday = u.usesToday || 0;
    let last = u.lastUseDate || null;
    if(last !== now){ usesToday = 0; db.prepare('UPDATE users SET usesToday = 0, lastUseDate = ? WHERE id = ?').run(now, user.id); }
    const roles = (u.roles || '').split(',').filter(Boolean);
    const quota = roles.length ? Infinity : 3; // members with roles have Infinity; adjust as needed
    if(usesToday >= quota) return res.status(403).json({ error:'quota' });
    usesToday++;
    db.prepare('UPDATE users SET usesToday = ?, lastUseDate = ? WHERE id = ?').run(usesToday, now, user.id);
    return res.json({ ok:true, usesToday, quota });
  } else {
    db.prepare('INSERT INTO users (id, username, avatar, roles, usesToday, lastUseDate) VALUES (?,?,?,?,1,?)').run(user.id, user.username, user.avatar || '', 'Membro', now);
    return res.json({ ok:true, usesToday:1, quota:3 });
  }
});

app.get('/api/uses/remaining', (req, res) => {
  const user = req.session && req.session.user;
  if(!user) return res.status(401).json({ error:'not_logged' });
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
  const now = new Date().toISOString().slice(0,10);
  if(!u) return res.json({ remaining:3 });
  if(u.lastUseDate !== now) return res.json({ remaining:3 });
  const roles = (u.roles || '').split(',').filter(Boolean);
  const quota = roles.length ? Infinity : 3;
  const rem = quota === Infinity ? Infinity : Math.max(0, quota - (u.usesToday || 0));
  return res.json({ remaining: rem });
});

// record builder use stats
app.post('/api/db/record', (req, res) => {
  const { type, game, platform } = req.body;
  const key = type === 'roblox' ? (game || '') : (platform ? 'platform:'+platform : '');
  db.prepare('INSERT INTO records (type, key, time) VALUES (?,?,?)').run(type, key, new Date().toISOString());
  return res.json({ ok:true });
});

// stats endpoint
app.get('/api/db/stats', (req, res) => {
  const rows = db.prepare('SELECT key, COUNT(*) as cnt FROM records GROUP BY key ORDER BY cnt DESC LIMIT 10').all();
  const topGames = rows.map(r=> ({ game: r.key, count: r.cnt })).filter(r=> r.game);
  res.json({ topGames });
});

app.listen(PORT, ()=> console.log('Server running on port', PORT));

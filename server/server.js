require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const { Pool } = require('pg');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(cookieParser());

// Postgres connection: use DATABASE_URL env (Render) or individual parts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_CALLBACK_URL = process.env.DISCORD_CALLBACK_URL;
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'discord_user_cookie';

// helper to read cookie user
function getUserFromCookie(req){
  try {
    const raw = req.cookies[SESSION_COOKIE_NAME];
    if(!raw) return null;
    return JSON.parse(raw);
  } catch(e){ return null; }
}

async function requireAdmin(req, res, next){
  const u = getUserFromCookie(req);
  if(!u) return res.redirect('/');
  try{
    const r = await pool.query('SELECT role FROM users WHERE id=$1 LIMIT 1', [u.id]);
    if(r.rows.length && r.rows[0].role === 'admin') return next();
    return res.redirect('/');
  }catch(e){
    console.error(e);
    return res.redirect('/');
  }
}

// OAuth2 start
app.get('/auth/discord', (req,res)=>{
  const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_CALLBACK_URL)}&response_type=code&scope=identify`;
  res.redirect(url);
});

// OAuth2 callback
app.get('/auth/discord/callback', async (req,res)=>{
  const code = req.query.code;
  if(!code) return res.redirect('/');
  try{
    const params = new URLSearchParams();
    params.append('client_id', DISCORD_CLIENT_ID);
    params.append('client_secret', DISCORD_CLIENT_SECRET);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', DISCORD_CALLBACK_URL);
    const tokenRes = await axios.post('https://discord.com/api/oauth2/token', params.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    const access = tokenRes.data.access_token;
    const userRes = await axios.get('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${access}` } });
    const u = userRes.data;
    // upsert into users table
    await pool.query(`INSERT INTO users(id, username, discriminator, avatar, role, uses_daily, uses_today, last_reset, created_at)
      VALUES($1,$2,$3,$4,$5,3,0,now(),now())
      ON CONFLICT (id) DO UPDATE SET username=EXCLUDED.username, avatar=EXCLUDED.avatar`, [u.id, u.username, u.discriminator, u.avatar, 'basic']);
    // set cookie
    const cookieOpts = { httpOnly: true, secure: process.env.NODE_ENV==='production', sameSite: process.env.NODE_ENV==='production' ? 'None' : 'Lax', maxAge: 1000*60*60*24 };
    res.cookie(SESSION_COOKIE_NAME, JSON.stringify({ id: u.id, username: u.username, discriminator: u.discriminator, avatar: u.avatar }), cookieOpts);
    res.redirect('/methods.html');
  }catch(e){
    console.error('oauth callback error', e && e.toString());
    res.redirect('/');
  }
});

// logout
app.get('/auth/logout', (req,res)=>{
  res.clearCookie(SESSION_COOKIE_NAME);
  res.redirect('/');
});

// API endpoints
app.get('/api/user', async (req,res)=>{
  const u = getUserFromCookie(req);
  if(!u) return res.status(401).json({ error: 'Not logged' });
  try{
    const r = await pool.query('SELECT id, username, role, uses_today, uses_daily, last_reset FROM users WHERE id=$1', [u.id]);
    const row = r.rows[0] || null;
    res.json(Object.assign({}, u, row));
  }catch(e){ console.error(e); res.status(500).json({ error: 'db' }); }
});

app.get('/api/is-admin', async (req,res)=>{
  const u = getUserFromCookie(req);
  if(!u) return res.json({ admin: false });
  try{
    const r = await pool.query('SELECT role FROM users WHERE id=$1', [u.id]);
    return res.json({ admin: r.rows.length && r.rows[0].role === 'admin', id: u.id });
  }catch(e){ return res.json({ admin: false }); }
});

app.get('/api/stats', async (req,res)=>{
  try{
    const usersToday = await pool.query("SELECT count(*) FROM users WHERE created_at::date = (now() at time zone 'America/Sao_Paulo')::date");
    const linksToday = await pool.query("SELECT count(*) FROM shortners WHERE created_at::date = (now() at time zone 'America/Sao_Paulo')::date");
    const pastesToday = await pool.query("SELECT count(*) FROM pastes WHERE created_at::date = (now() at time zone 'America/Sao_Paulo')::date");
    res.json({ usersToday: Number(usersToday.rows[0].count), linksToday: Number(linksToday.rows[0].count), pastesToday: Number(pastesToday.rows[0].count) });
  }catch(e){ console.error(e); res.status(500).json({ error: 'db' }); }
});

app.get('/api/shortners/top', async (req,res)=>{
  try{ const r = await pool.query('SELECT id, url, original, creator, views FROM shortners ORDER BY views DESC LIMIT 20'); res.json(r.rows); }catch(e){ res.status(500).json({}); }
});

app.get('/api/pastes', async (req,res)=>{
  const filter = req.query.filter || 'recent';
  try{
    const q = filter === 'top' ? 'SELECT * FROM pastes ORDER BY views DESC LIMIT 100' : 'SELECT * FROM pastes ORDER BY created_at DESC LIMIT 100';
    const r = await pool.query(q);
    res.json(r.rows);
  }catch(e){ res.status(500).json({}); }
});

app.delete('/api/pastes/:id', async (req,res)=>{
  const u = getUserFromCookie(req);
  if(!u) return res.status(401).json({ error: 'Not logged' });
  const rrole = await pool.query('SELECT role FROM users WHERE id=$1', [u.id]);
  if(!rrole.rows.length || rrole.rows[0].role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try{ await pool.query('DELETE FROM pastes WHERE id=$1', [req.params.id]); res.json({ ok: true }); }catch(e){ res.status(500).json({}); }
});

app.post('/api/builder/roblox', async (req,res)=>{
  const u = getUserFromCookie(req);
  if(!u) return res.status(401).json({ error: 'Not logged' });
  const { userLink, gameKey, platform, platformLink, platformUsername } = req.body;
  if(!userLink) return res.status(400).json({ error: 'userLink required' });
  if(!gameKey) return res.status(400).json({ error: 'gameKey required' });
  try{
    // reset uses_today if last_reset is before today (Sao Paulo)
    const resetQuery = `UPDATE users SET uses_today = 0, last_reset = now() WHERE id=$1 AND (last_reset IS NULL OR (last_reset at time zone 'America/Sao_Paulo')::date < (now() at time zone 'America/Sao_Paulo')::date)`;
    await pool.query(resetQuery, [u.id]);
    const ur = await pool.query('SELECT uses_today, uses_daily FROM users WHERE id=$1', [u.id]);
    const uses_today = ur.rows[0].uses_today || 0;
    const uses_daily = ur.rows[0].uses_daily || 3;
    if(uses_today >= uses_daily) return res.status(403).json({ error: 'limit' });
    await pool.query('UPDATE users SET uses_today = uses_today + 1 WHERE id=$1', [u.id]);
    // get game link
    const gr = await pool.query('SELECT link FROM builders WHERE game_key=$1 LIMIT 1', [gameKey]);
    const gameLink = gr.rows.length ? gr.rows[0].link : null;
    const output = `<${userLink}>[s](${gameLink})`;
    await pool.query('INSERT INTO builder_history(user_id, type, input, output, created_at) VALUES($1,$2,$3,$4,now())', [u.id, 'roblox', userLink, output]);
    return res.json({ output });
  }catch(e){ console.error(e); res.status(500).json({ error: 'db' }); }
});

app.post('/api/shortner', async (req,res)=>{
  const u = getUserFromCookie(req);
  if(!u) return res.status(401).json({ error: 'Not logged' });
  const { original } = req.body;
  if(!original) return res.status(400).json({ error: 'original required' });
  try{
    const id = require('crypto').randomBytes(4).toString('hex');
    const url = `${process.env.SHORT_DOMAIN || 'https://short.ly'}/${id}`;
    await pool.query('INSERT INTO shortners(id, url, original, creator, views, created_at) VALUES($1,$2,$3,$4,0,now())', [id, url, original, u.id]);
    res.json({ id, url });
  }catch(e){ console.error(e); res.status(500).json({}); }
});

// Serve static
app.use('/public', express.static(path.join(__dirname, '..', 'public')));
app.use('/admin_assets', express.static(path.join(__dirname, '..', 'admin', 'assets')));

// Admin route (protect)
app.get('/admin', requireAdmin, (req,res)=>{
  res.sendFile(path.join(__dirname, '..', 'admin', 'index.html'));
});
app.get('/admin/*', requireAdmin, (req,res)=>{
  res.sendFile(path.join(__dirname, '..', 'admin', 'index.html'));
});

// Public routes
app.get('/', (req,res)=> res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));
app.get('/methods.html', (req,res)=> res.sendFile(path.join(__dirname, '..', 'public', 'methods.html')));
app.get('/builder.html', (req,res)=> res.sendFile(path.join(__dirname, '..', 'public', 'builder.html')));
app.get('/shortner.html', (req,res)=> res.sendFile(path.join(__dirname, '..', 'public', 'shortner.html')));
app.get('/404.html', (req,res)=> res.sendFile(path.join(__dirname, '..', 'public', '404.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log('Server running on port', PORT));

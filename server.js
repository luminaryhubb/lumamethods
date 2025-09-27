const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cookieParser = require('cookie-parser');

const DATA_FILE = path.join(__dirname, 'data', 'data.json');
function readData(){ return JSON.parse(fs.readFileSync(DATA_FILE)); }
function writeData(d){ fs.writeFileSync(DATA_FILE, JSON.stringify(d,null,2)); }

const app = express();
app.use(express.json());
app.use(cookieParser());

const ADMIN_IDS = (process.env.ADMIN_IDS || '').split(',').filter(Boolean); // comma separated Discord IDs

function requireAdmin(req, res, next){
  try{
    const c = req.cookies['discord_user'];
    if(!c) return res.status(401).send('Not authorized');
    const u = JSON.parse(decodeURIComponent(c));
    if(!u || !u.id) return res.status(401).send('Not authorized');
    if(ADMIN_IDS.includes(u.id.toString())){ req.user = u; return next(); }
    return res.status(403).send('Forbidden');
  }catch(e){ return res.status(401).send('Not authorized'); }
}


const CLIENT_ID = process.env.DISCORD_CLIENT_ID || '';
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.DISCORD_CALLBACK_URL || 'http://localhost:3000/auth/discord/callback';
const ADMIN_IDS = ['1411328138931077142','1066509829025300560','1420447434362060917'];

app.get('/auth/discord', (req, res) => {
  const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify`;
  res.redirect(url);
});

app.get('/auth/discord/callback', async (req, res) => {
  const code = req.query.code;
  if(!code) return res.redirect('/404.html');
  try{
    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', REDIRECT_URI);
    const tokenRes = await axios.post('https://discord.com/api/oauth2/token', params.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    const accessToken = tokenRes.data.access_token;
    const userRes = await axios.get('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${accessToken}` } });
    const u = userRes.data;
    const cookieOpts = { httpOnly: true, secure: process.env.NODE_ENV==='production', sameSite: process.env.NODE_ENV==='production'?'None':'Lax', maxAge: 1000*60*60*24 };
    res.cookie('discord_user', JSON.stringify({ id:u.id, username:u.username, discriminator:u.discriminator, avatar:u.avatar }), cookieOpts);
    res.redirect('/public/methods.html');
  }catch(e){
    console.error('oauth callback error', e && e.toString());
    res.redirect('/404.html');
  }
});

// helper to require login via cookie
function getUserFromCookie(req){
  const cookie = req.cookies.discord_user;
  if(!cookie) return null;
  try{ return JSON.parse(cookie); }catch{ return null; }
}

app.get('/api/user', (req,res)=>{
  const u = getUserFromCookie(req);
  if(!u) return res.status(401).json({ error:'Not logged' });
  res.json(u);
});

app.get('/api/is-admin', (req,res)=>{
  const u = getUserFromCookie(req);
  res.json({ admin: !!(u && ADMIN_IDS.includes(u.id)), id: u?u.id:null });
});

// stats
app.get('/api/stats', (req,res)=>{
  const data = readData();
  res.json({
    usersToday: 12,
    linksToday: 34,
    pastesToday: data.pastes.length,
    timeseries: data.stats.timeseries,
    labels: data.stats.labels
  });
});

app.get('/api/shortners/top', (req,res)=>{
  const data = readData();
  res.json(data.shortners.sort((a,b)=>b.views-a.views));
});

// pastes endpoints
app.get('/api/pastes', (req,res)=>{
  const data = readData();
  const filter = req.query.filter || 'all';
  let list = data.pastes.slice();
  if(filter==='top') list = list.sort((a,b)=>b.views-a.views);
  if(filter==='recent') list = list.sort((a,b)=> new Date(b.created_at)-new Date(a.created_at));
  res.json(list);
});

app.delete('/api/pastes/:id', (req,res)=>{
  const user = getUserFromCookie(req);
  if(!user) return res.status(401).json({ error:'Not logged' });
  if(!ADMIN_IDS.includes(user.id)) return res.status(403).json({ error:'Not admin' });
  const id = req.params.id;
  const data = readData();
  data.pastes = data.pastes.filter(p=>p.id!==id);
  writeData(data);
  res.json({ ok:true });
});

// builders
app.get('/api/builders', (req,res)=>{
  const data = readData();
  res.json({ builders: data.builders });
});

// users management (admin)
app.get('/api/users', (req,res)=>{
  const user = getUserFromCookie(req);
  if(!user) return res.status(401).json({ error:'Not logged' });
  if(!ADMIN_IDS.includes(user.id)) return res.status(403).json({ error:'Not admin' });
  const data = readData();
  res.json(data.users);
});

app.post('/api/users/:id/role', (req,res)=>{
  const user = getUserFromCookie(req);
  if(!user) return res.status(401).json({ error:'Not logged' });
  if(!ADMIN_IDS.includes(user.id)) return res.status(403).json({ error:'Not admin' });
  const id = req.params.id;
  const { role } = req.body;
  const data = readData();
  const u = data.users.find(x=>x.id===id);
  if(!u) return res.status(404).json({ error:'User not found' });
  u.role = role;
  writeData(data);
  res.json({ ok:true, user:u });
});

app.post('/api/users/:id/block', (req,res)=>{
  const user = getUserFromCookie(req);
  if(!user) return res.status(401).json({ error:'Not logged' });
  if(!ADMIN_IDS.includes(user.id)) return res.status(403).json({ error:'Not admin' });
  const id = req.params.id;
  const data = readData();
  const u = data.users.find(x=>x.id===id);
  if(!u) return res.status(404).json({ error:'User not found' });
  u.blocked = true;
  writeData(data);
  res.json({ ok:true });
});

// config
app.get('/api/config', (req,res)=>{
  const data = readData();
  res.json(data.config);
});
app.post('/api/config', (req,res)=>{
  const user = getUserFromCookie(req);
  if(!user) return res.status(401).json({ error:'Not logged' });
  if(!ADMIN_IDS.includes(user.id)) return res.status(403).json({ error:'Not admin' });
  const data = readData();
  data.config = Object.assign(data.config, req.body);
  writeData(data);
  res.json({ ok:true, config:data.config });
});

app.get('/auth/logout', (req,res)=>{
  res.clearCookie('discord_user');
  res.redirect('/');
});

app.use('/public', express.static(path.join(__dirname,'public')));
// Protected admin static routes - requires Discord admin
app.get('/admin', requireAdmin, (req,res)=>{
  res.sendFile(path.join(__dirname,'admin','index.html'));
});
app.get('/admin/*', requireAdmin, (req,res)=>{
  // serve requested admin asset
  const rel = req.path.replace('/admin/','');
  const filePath = path.join(__dirname,'admin', rel);
  if(fs.existsSync(filePath)) return res.sendFile(filePath);
  return res.status(404).send('Not found');
});

app.get('/', (req,res)=> res.sendFile(path.join(__dirname,'public','index.html')));
app.get('/404.html', (req,res)=> res.sendFile(path.join(__dirname,'public','404.html')));

const PORT = process.env.PORT || 3000;



// --- ADMIN: additional user management endpoints ---
// Add uses to a user
app.post('/api/users/:id/adduses', requireAdmin, (req,res)=>{
  const id = req.params.id;
  const body = req.body || {};
  const amount = parseInt(body.amount) || 0;
  if(amount <= 0) return res.status(400).json({error:'amount required positive'});
  const data = readData();
  data.users = data.users || {};
  data.users[id] = data.users[id] || { id, name: 'unknown', avatar: '', usesLeft: 3, lastReset: new Date().toISOString().slice(0,10), roles: [] };
  data.users[id].usesLeft = (data.users[id].usesLeft || 0) + amount;
  writeData(data);
  return res.json({ok:true, usesLeft: data.users[id].usesLeft});
});

// Set role for a user
app.post('/api/users/:id/role', requireAdmin, (req,res)=>{
  const id = req.params.id;
  const body = req.body || {};
  const role = body.role;
  if(!role) return res.status(400).json({error:'role required'});
  const data = readData();
  data.users = data.users || {};
  data.users[id] = data.users[id] || { id, name:'unknown', avatar:'', usesLeft:3, lastReset: new Date().toISOString().slice(0,10), roles:[] };
  // set role (replace or push)
  data.users[id].roles = data.users[id].roles || [];
  if(!data.users[id].roles.includes(role)) data.users[id].roles.push(role);
  writeData(data);
  return res.json({ok:true, roles: data.users[id].roles});
});

// Block/unblock user
app.post('/api/users/:id/block', requireAdmin, (req,res)=>{
  const id = req.params.id;
  const body = req.body || {};
  const block = body.block === undefined ? true : !!body.block;
  const data = readData();
  data.users = data.users || {};
  data.users[id] = data.users[id] || { id, name:'unknown', avatar:'', usesLeft:3, lastReset: new Date().toISOString().slice(0,10), roles:[] };
  data.users[id].blocked = block;
  writeData(data);
  return res.json({ok:true, blocked: data.users[id].blocked});
});

// Admin stats: users, pastes, top pastes, builder summary
app.get('/api/admin/stats', requireAdmin, (req,res)=>{
  const data = readData();
  data.users = data.users || {};
  data.pastes = data.pastes || {};
  data.builders = data.builders || [];

  const totalUsers = Object.keys(data.users).length;
  const totalPastes = Object.keys(data.pastes).length;

  // top pastes by accesses length or views property
  const pastesArr = Object.values(data.pastes).map(p => ({ id: p.id, views: (p.accesses ? p.accesses.length : (p.views||0)), createdAt: p.createdAt || null, textPreview: p.text ? (p.text.slice(0,200)) : '' }));
  pastesArr.sort((a,b)=> (b.views||0)-(a.views||0));
  const topPastes = pastesArr.slice(0,10);

  // builder summary: aggregate games and platforms
  const gameCounts = {};
  const platformCounts = {};
  (data.builders || []).forEach(b=>{
    if(b.game) gameCounts[b.game] = (gameCounts[b.game]||0)+1;
    if(b.platform) platformCounts[b.platform] = (platformCounts[b.platform]||0)+1;
  });
  const topGames = Object.keys(gameCounts).map(k=>({game:k,count:gameCounts[k]})).sort((a,b)=>b.count-a.count).slice(0,10);
  const topPlatforms = Object.keys(platformCounts).map(k=>({platform:k,count:platformCounts[k]})).sort((a,b)=>b.count-a.count).slice(0,10);

  return res.json({
    totalUsers,
    totalPastes,
    topPastes,
    builders: topGames,
    platforms: topPlatforms,
    usersToday: 0, // placeholder
    pastesToday: 0,
    views: pastesArr.reduce((s,p)=>s+(p.views||0),0)
  });
});

// Endpoint to list admin pastes (ensure protected)
app.get('/api/admin/pastes', requireAdmin, (req,res)=>{
  const data = readData();
  data.pastes = data.pastes || {};
  const list = Object.values(data.pastes).map(p=>({
    id: p.id,
    createdAt: p.createdAt,
    redirect: p.redirect,
    accessesCount: (p.accesses? p.accesses.length : (p.views||0)),
    textPreview: p.text ? (p.text.slice(0,200)) : null
  }));
  return res.json({pastes: list});
});

// Endpoint to list users for admin
app.get('/api/users', requireAdmin, (req,res)=>{
  const data = readData();
  data.users = data.users || {};
  return res.json(Object.values(data.users));
});


app.listen(PORT, ()=> console.log('Server running on port', PORT));


// Builder usages: simple JSON-based quota (3 per day default)
app.post('/api/builder/use', (req,res)=>{
  const user = req.body.user; // expect { id }
  if(!user || !user.id) return res.status(400).json({error:'user required'});
  const data = readData();
  data.users = data.users || {};
  const uid = user.id;
  const today = new Date().toISOString().slice(0,10);
  data.users[uid] = data.users[uid] || { usesLeft:3, lastReset: today };
  if(data.users[uid].lastReset !== today){ data.users[uid].usesLeft = 3; data.users[uid].lastReset = today; }
  if(data.users[uid].usesLeft<=0) return res.status(403).json({error:'no uses left'});
  data.users[uid].usesLeft -= 1;
  writeData(data);
  return res.json({ok:true, usesLeft: data.users[uid].usesLeft});
});

// Admin endpoint to view builder usages summary
app.get('/api/admin/builders', requireAdmin, (req,res)=>{
  const data = readData();
  const users = data.users || {};
  return res.json({users});
});


// Simple paste creation saved to data.json
app.post('/api/create', (req,res)=>{
  const { text, password, redirect } = req.body;
  if(!text || !password) return res.status(400).json({error:'text and password required'});
  const data = readData();
  data.pastes = data.pastes || {};
  const id = Math.random().toString(36).slice(2,10);
  data.pastes[id] = { id, text, password, redirect: redirect||null, createdAt: new Date().toISOString(), accesses: [] };
  writeData(data);
  res.json({ id });
});

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
app.use('/admin', express.static(path.join(__dirname,'admin')));
app.get('/', (req,res)=> res.sendFile(path.join(__dirname,'public','index.html')));
app.get('/404.html', (req,res)=> res.sendFile(path.join(__dirname,'public','404.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log('Server running on port', PORT));

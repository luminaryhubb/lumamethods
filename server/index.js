const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { nanoid } = require('nanoid');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;

const app = express();
const PORT = process.env.PORT || 3000;

// Environment variables
const CLIENT_ID = process.env.DISCORD_CLIENT_ID || 'YOUR_CLIENT_ID';
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';
const CALLBACK = process.env.DISCORD_CALLBACK_URL || 'http://localhost:3000/auth/discord/callback';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change_this_secret';

// Owners/Admin IDs (from user)
const OWNERS = ['1411328138931077142','821833532691316757'];
const ADMINS = ['1066509829025300560','1419789419946442765','1402748934555963414'];

app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json({ limit: '5mb' }));

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const LINKS_FILE = path.join(DATA_DIR, 'links.json');
const PASTES_FILE = path.join(DATA_DIR, 'pastes.json');
const SHORT_FILE = path.join(DATA_DIR, 'shorteners.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify({ users: {} }, null, 2));
if (!fs.existsSync(LINKS_FILE)) fs.writeFileSync(LINKS_FILE, JSON.stringify({ links: {} }, null, 2));
if (!fs.existsSync(PASTES_FILE)) fs.writeFileSync(PASTES_FILE, JSON.stringify({ pastes: {} }, null, 2));
if (!fs.existsSync(SHORT_FILE)) fs.writeFileSync(SHORT_FILE, JSON.stringify({ shorteners: {} }, null, 2));
if (!fs.existsSync(CONFIG_FILE)) fs.writeFileSync(CONFIG_FILE, JSON.stringify({ siteName:'Luma Methods - Best Methods', logo:'https://media.discordapp.net/attachments/1414311428218814606/1420127903265460364/standard_10.gif?ex=68d444ac&is=68d2f32c&hm=0ef97a9757953ccddf03efaa622fd30953f976248550cbb6ab77b4bfa4436cf8&=&width=160&height=160', themeColor:'#7c3aed', allowCreation:true, shortenerUrl:'' }, null, 2));

function readJSON(file){ try { return JSON.parse(fs.readFileSync(file,'utf8')); } catch(e){ return {}; } }
function writeJSON(file, data){ fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

// passport setup (Discord OAuth2)
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

const scopes = ['identify'];

passport.use(new DiscordStrategy({
  clientID: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  callbackURL: CALLBACK,
  scope: scopes
}, function(accessToken, refreshToken, profile, done) {
  return done(null, profile);
}));

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 30 }
}));
app.use(passport.initialize());
app.use(passport.session());

// Auth routes
app.get('/auth/discord', passport.authenticate('discord'));
app.get('/auth/discord/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => {
  // on success redirect client to home - client will call /api/me to pick up session
  res.redirect('/');
});
app.get('/auth/logout', (req, res) => { req.logout(()=>{}); res.redirect('/'); });

function requireLogin(req,res,next){
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Unauthorized' });
}
function isAdminId(id){ if (!id) return false; return OWNERS.includes(id) || ADMINS.includes(id); }
function requireAdmin(req,res,next){
  if (!req.isAuthenticated || !req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
  const id = req.user.id;
  if (!isAdminId(id)) return res.status(403).json({ error: 'Forbidden' });
  next();
}

// Public config (so logo loads for everyone)
app.get('/api/config', (req,res) => {
  const cfg = readJSON(CONFIG_FILE);
  const publicCfg = { siteName: cfg.siteName, logo: cfg.logo, themeColor: cfg.themeColor, shortenerUrl: cfg.shortenerUrl, allowCreation: cfg.allowCreation };
  res.json(publicCfg);
})

// /api/me -> user session + create user record
app.get('/api/me', (req,res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) return res.json({ logged:false });
  const profile = req.user;
  const users = readJSON(USERS_FILE);
  if (!users.users[profile.id]){
    users.users[profile.id] = { id: profile.id, username: profile.username, avatar: profile.avatar, uses: [], role: 'free', createdAt: new Date().toISOString() };
    writeJSON(USERS_FILE, users);
  } else {
    users.users[profile.id].username = profile.username;
    users.users[profile.id].avatar = profile.avatar;
    writeJSON(USERS_FILE, users);
  }
  const u = users.users[profile.id];
  u.isAdmin = isAdminId(profile.id);
  u.isOwner = OWNERS.includes(profile.id);
  res.json({ logged:true, profile, user: u });
});

// Create link fake (requires login)
app.post('/api/create/linkfake', requireLogin, (req,res) => {
  const profile = req.user;
  const { network, username, privateLink, robloxGame } = req.body;
  if (!network) return res.status(400).json({ error: 'network required' });
  if (!privateLink) return res.status(400).json({ error: 'privateLink required' });

  const users = readJSON(USERS_FILE);
  const user = users.users[profile.id];
  if (!user) return res.status(400).json({ error: 'user record not found' });

  // check daily uses (3 free/day)
  const now = Date.now();
  const dayAgo = now - (24*60*60*1000);
  const recent = (user.uses||[]).filter(ts => new Date(ts).getTime() > dayAgo);
  if (!isAdminId(profile.id) && recent.length >= 3) return res.status(403).json({ error: 'Você ja usou seus 3 usos diarios, volte amanha para mais usos' });

  let output = '';
  if (network === 'roblox'){
    if (!robloxGame) return res.status(400).json({ error: 'robloxGame required' });
    // user expects: <privateLink>[s](gameLink)
    output = `${privateLink}[s](${robloxGame})`;
  } else {
    // other networks: display link based on username and network, and link to privateLink in parentheses as <...>
    let display = '';
    if (network === 'tiktok') display = `https://tiktok.com/@${username}`;
    else if (network === 'youtube') display = `https://youtube.com/${username}`;
    else if (network === 'twitter') display = `https://twitter.com/${username}`;
    else display = username;
    // format: [display](<privateLink>)
    output = `[${display}](<${privateLink}>)`;
  }

  const links = readJSON(LINKS_FILE);
  const id = nanoid(8);
  links.links[id] = { id, owner: profile.id, network, username, privateLink, robloxGame: robloxGame||null, output, createdAt: new Date().toISOString(), views: 0 };
  writeJSON(LINKS_FILE, links);

  // record usage
  user.uses = user.uses || [];
  user.uses.push(new Date().toISOString());
  users.users[profile.id] = user;
  writeJSON(USERS_FILE, users);

  res.json({ ok:true, id, output, link: `/l/${id}` });
});

// view generated link: returns JSON for SPA and increments views
app.get('/l/:id', (req,res) => {
  const id = req.params.id;
  const links = readJSON(LINKS_FILE);
  const l = links.links[id];
  if (!l) return res.status(404).json({ error: 'Not found' });
  l.views = (l.views||0) + 1;
  links.links[id] = l;
  writeJSON(LINKS_FILE, links);
  res.json({ id:l.id, output:l.output, owner:l.owner, network:l.network, views:l.views, createdAt:l.createdAt });
});

// SHORTENER: create short link (requires login) and redirect route
app.post('/api/shorten', requireLogin, (req,res) => {
  const profile = req.user;
  const { url, alias } = req.body;
  if (!url) return res.status(400).json({ error: 'url required' });
  const short = readJSON(SHORT_FILE);
  // if alias provided, ensure unique
  let id = alias && alias.trim().length>0 ? alias.trim() : nanoid(6);
  if (short.shorteners[id]) return res.status(400).json({ error: 'alias_taken' });
  short.shorteners[id] = { id, owner: profile.id, url, createdAt: new Date().toISOString(), views: 0 };
  writeJSON(SHORT_FILE, short);
  res.json({ ok:true, id, shortUrl: `/s/${id}` });
});

// redirect short link
app.get('/s/:id', (req,res) => {
  const id = req.params.id;
  const short = readJSON(SHORT_FILE);
  const s = short.shorteners[id];
  if (!s) return res.status(404).send('Not found');
  s.views = (s.views||0) + 1;
  short.shorteners[id] = s;
  writeJSON(SHORT_FILE, short);
  res.redirect(s.url);
});

// Admin endpoints (requireAdmin)
app.get('/api/admin/users', requireAdmin, (req,res) => { const users = readJSON(USERS_FILE); res.json({ users: Object.values(users.users) }); });
app.post('/api/admin/user/:id/adduses', requireAdmin, (req,res) => { const uid = req.params.id; const amount = Number(req.body.amount||0); const users = readJSON(USERS_FILE); if (!users.users[uid]) return res.status(404).json({ error: 'User not found' }); users.users[uid].uses = users.users[uid].uses || []; for (let i=0;i<amount;i++) users.users[uid].uses.push(new Date().toISOString()); writeJSON(USERS_FILE, users); res.json({ ok:true }); });
app.post('/api/admin/user/:id/setrole', requireAdmin, (req,res) => { const uid = req.params.id; const role = req.body.role || 'free'; const users = readJSON(USERS_FILE); if (!users.users[uid]) return res.status(404).json({ error: 'User not found' }); users.users[uid].role = role; writeJSON(USERS_FILE, users); res.json({ ok:true }); });
app.get('/api/admin/links', requireAdmin, (req,res) => { const links = readJSON(LINKS_FILE); res.json({ links: Object.values(links.links) }); });
app.delete('/api/admin/link/:id', requireAdmin, (req,res) => { const id = req.params.id; const links = readJSON(LINKS_FILE); if (!links.links[id]) return res.status(404).json({ error: 'Not found' }); delete links.links[id]; writeJSON(LINKS_FILE, links); res.json({ ok:true }); });
app.get('/api/admin/shorteners', requireAdmin, (req,res) => { const s = readJSON(SHORT_FILE); res.json({ shorteners: Object.values(s.shorteners) }); });
app.delete('/api/admin/shorteners/:id', requireAdmin, (req,res) => { const id = req.params.id; const s = readJSON(SHORT_FILE); if (!s.shorteners[id]) return res.status(404).json({ error: 'Not found' }); delete s.shorteners[id]; writeJSON(SHORT_FILE, s); res.json({ ok:true }); });

app.get('/api/admin/pastes', requireAdmin, (req,res) => { const p = readJSON(PASTES_FILE); res.json({ pastes: Object.values(p.pastes) }); });

// admin stats for dashboard
app.get('/api/admin/stats', requireAdmin, (req,res) => {
  const p = readJSON(PASTES_FILE);
  const l = readJSON(LINKS_FILE);
  const s = readJSON(SHORT_FILE);
  const counts = {};
  // simple counts for last 7 days - group by date string
  const now = Date.now();
  for (let i=0;i<7;i++){
    const d = new Date(now - i*24*60*60*1000).toISOString().slice(0,10);
    counts[d]=0;
  }
  Object.values(l.links).forEach(x=>{ const d = x.createdAt ? x.createdAt.slice(0,10) : new Date().toISOString().slice(0,10); if(counts[d]!==undefined) counts[d]++; });
  const totalPastes = Object.keys(p.pastes).length;
  const totalViews = Object.values(l.links).reduce((acc,x)=>acc+(x.views||0),0) + Object.values(s.shorteners).reduce((acc,x)=>acc+(x.views||0),0);
  res.json({ counts, totalPastes, totalViews });
});

// admin config get/put (protect put)
app.get('/api/admin/config', requireAdmin, (req,res) => { const cfg = readJSON(CONFIG_FILE); res.json(cfg); });
app.put('/api/admin/config', requireAdmin, (req,res) => { const newCfg = req.body || {}; const cfg = readJSON(CONFIG_FILE); const merged = Object.assign(cfg, newCfg); writeJSON(CONFIG_FILE, merged); res.json({ ok:true, config: merged }); });

// serve client if built
const clientDist = path.join(process.cwd(), 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.get('/', (req, res) => res.send('API running. Client not built.'));
}

app.listen(PORT, () => console.log('Server listening on', PORT));

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

const CLIENT_ID = process.env.DISCORD_CLIENT_ID || 'YOUR_CLIENT_ID';
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';
const CALLBACK = process.env.DISCORD_CALLBACK_URL || 'http://localhost:3000/auth/discord/callback';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change_this_secret';

const OWNERS = ['1411328138931077142','821833532691316757'];
const ADMINS = ['1066509829025300560','1419789419946442765','1402748934555963414'];

app.use(cors());
app.use(bodyParser.json({ limit: '2mb' }));

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const LINKS_FILE = path.join(DATA_DIR, 'links.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify({ users: {} }, null, 2));
if (!fs.existsSync(LINKS_FILE)) fs.writeFileSync(LINKS_FILE, JSON.stringify({ links: {} }, null, 2));
if (!fs.existsSync(CONFIG_FILE)) fs.writeFileSync(CONFIG_FILE, JSON.stringify({ siteName: 'Luma Methods - Best Methods', logo:'', themeColor:'#7c3aed', allowCreation:true }, null, 2));

function readJSON(file){ return JSON.parse(fs.readFileSync(file,'utf8')); }
function writeJSON(file, data){ fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

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

app.get('/auth/discord', passport.authenticate('discord'));
app.get('/auth/discord/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => {
  res.redirect('/admin');
});
app.get('/auth/logout', (req, res) => { req.logout(()=>{}); res.redirect('/'); });

function requireLogin(req, res, next){
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Unauthorized' });
}
function isAdminId(id){ if (!id) return false; return OWNERS.includes(id) || ADMINS.includes(id); }

app.get('/api/me', (req, res) => {
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

app.post('/api/create/linkfake', requireLogin, (req, res) => {
  const profile = req.user;
  const { network, username, privateLink, robloxGame } = req.body;
  if (!network) return res.status(400).json({ error: 'network required' });
  const users = readJSON(USERS_FILE);
  const user = users.users[profile.id];
  const now = Date.now();
  const dayAgo = now - (24*60*60*1000);
  const recent = (user.uses||[]).filter(ts => new Date(ts).getTime() > dayAgo);
  if (!isAdminId(profile.id) && recent.length >= 3) return res.status(403).json({ error: 'Você ja usou seus 3 usos diarios, volte amanha para mais usos' });
  if (!privateLink) return res.status(400).json({ error: 'privateLink required' });

  let output = '';
  if (network === 'roblox'){
    if (!robloxGame) return res.status(400).json({ error: 'robloxGame required' });
    output = `${privateLink}[s](${robloxGame})`;
  } else {
    let display = '';
    if (network === 'tiktok') display = `https://tiktok.com/@${username}`;
    else if (network === 'youtube') display = `https://youtube.com/${username}`;
    else if (network === 'twitter') display = `https://twitter.com/${username}`;
    else display = username;
    output = `[${display}](<${privateLink}>)`;
  }

  const links = readJSON(LINKS_FILE);
  const id = nanoid(8);
  links.links[id] = { id, owner: profile.id, network, username, privateLink, robloxGame: robloxGame||null, output, createdAt: new Date().toISOString(), views: 0 };
  writeJSON(LINKS_FILE, links);

  user.uses = user.uses || [];
  user.uses.push(new Date().toISOString());
  users.users[profile.id] = user;
  writeJSON(USERS_FILE, users);

  res.json({ ok:true, id, output, link: `/l/${id}` });
});

app.get('/l/:id', (req, res) => {
  const id = req.params.id;
  const links = readJSON(LINKS_FILE);
  const l = links.links[id];
  if (!l) return res.status(404).send('Link not found');
  l.views = (l.views||0) + 1;
  links.links[id] = l;
  writeJSON(LINKS_FILE, links);
  res.json({ id: l.id, output: l.output, owner: l.owner, network: l.network });
});

function requireAdmin(req,res,next){
  if (!req.isAuthenticated || !req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
  const id = req.user.id;
  if (!isAdminId(id)) return res.status(403).json({ error: 'Forbidden' });
  next();
}

app.get('/api/admin/users', requireAdmin, (req,res) => { const users = readJSON(USERS_FILE); res.json({ users: Object.values(users.users) }); });
app.post('/api/admin/user/:id/adduses', requireAdmin, (req,res) => { const uid = req.params.id; const amount = Number(req.body.amount||0); const users = readJSON(USERS_FILE); if (!users.users[uid]) return res.status(404).json({ error: 'User not found' }); users.users[uid].uses = users.users[uid].uses || []; for (let i=0;i<amount;i++) users.users[uid].uses.push(new Date().toISOString()); writeJSON(USERS_FILE, users); res.json({ ok:true }); });
app.post('/api/admin/user/:id/setrole', requireAdmin, (req,res) => { const uid = req.params.id; const role = req.body.role || 'free'; const users = readJSON(USERS_FILE); if (!users.users[uid]) return res.status(404).json({ error: 'User not found' }); users.users[uid].role = role; writeJSON(USERS_FILE, users); res.json({ ok:true }); });
app.get('/api/admin/links', requireAdmin, (req,res) => { const links = readJSON(LINKS_FILE); res.json({ links: Object.values(links.links) }); });
app.delete('/api/admin/link/:id', requireAdmin, (req,res) => { const id = req.params.id; const links = readJSON(LINKS_FILE); if (!links.links[id]) return res.status(404).json({ error: 'Not found' }); delete links.links[id]; writeJSON(LINKS_FILE, links); res.json({ ok:true }); });
app.get('/api/admin/topusers', requireAdmin, (req,res) => { const users = readJSON(USERS_FILE); const links = readJSON(LINKS_FILE); const totals = {}; Object.values(links.links).forEach(l => { totals[l.owner] = (totals[l.owner]||0) + (l.views||0) }); const result = Object.keys(totals).map(uid => { const u = users.users[uid] || { username: 'Unknown', avatar: null }; return { id: uid, username: u.username, avatar: u.avatar, views: totals[uid] }; }).sort((a,b)=>b.views-a.views); res.json({ top: result }); });

const clientDist = path.join(process.cwd(), 'client', 'dist');
if (fs.existsSync(clientDist)) { app.use(express.static(clientDist)); app.get('*', (req, res) => { res.sendFile(path.join(clientDist, 'index.html')); }); } else { app.get('/', (req, res) => res.send('API running. Client not built.')); }

app.listen(PORT, () => console.log('Server listening on', PORT));

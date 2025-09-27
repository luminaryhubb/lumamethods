const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cookieParser());

const DATA_FILE = path.join(__dirname, 'data', 'data.json');
function readData() {
  if (!fs.existsSync(DATA_FILE)) return { users: {}, pastes: {}, builders: [] };
  return JSON.parse(fs.readFileSync(DATA_FILE));
}
function writeData(d) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));
}

// Admin IDs (env ou fallback)
const ADMIN_IDS = (process.env.ADMIN_IDS ||
  '1411328138931077142,1066509829025300560,1420447434362060917')
  .split(',')
  .filter(Boolean);

// Discord OAuth config
const CLIENT_ID = process.env.DISCORD_CLIENT_ID || '';
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
const REDIRECT_URI =
  process.env.DISCORD_CALLBACK_URL ||
  'http://localhost:3000/auth/discord/callback';

// --- Helpers ---
function getUserFromCookie(req) {
  const cookie = req.cookies.discord_user;
  if (!cookie) return null;
  try {
    return JSON.parse(cookie);
  } catch {
    return null;
  }
}

function requireAdmin(req, res, next) {
  try {
    const u = getUserFromCookie(req);
    if (!u || !u.id) return res.status(401).send('Not authorized');
    if (ADMIN_IDS.includes(u.id.toString())) {
      req.user = u;
      return next();
    }
    return res.status(403).send('Forbidden');
  } catch {
    return res.status(401).send('Not authorized');
  }
}

// --- Auth ---
app.get('/auth/discord', (req, res) => {
  const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_type=code&scope=identify`;
  res.redirect(url);
});

app.get('/auth/discord/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.redirect('/404.html');
  try {
    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', REDIRECT_URI);

    const tokenRes = await axios.post(
      'https://discord.com/api/oauth2/token',
      params.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const accessToken = tokenRes.data.access_token;
    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const u = userRes.data;

    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 1000 * 60 * 60 * 24,
    };
    res.cookie(
      'discord_user',
      JSON.stringify({
        id: u.id,
        username: u.username,
        discriminator: u.discriminator,
        avatar: u.avatar,
      }),
      cookieOpts
    );

    // Redireciona usuários normais para /methods.html
    // Admins vão manualmente para /admin
    if (ADMIN_IDS.includes(u.id)) {
      return res.redirect('/admin/index.html');
    }
    return res.redirect('/public/methods.html');
  } catch (e) {
    console.error('oauth callback error', e && e.toString());
    res.redirect('/404.html');
  }
});

app.get('/auth/logout', (req, res) => {
  res.clearCookie('discord_user');
  res.redirect('/');
});

// --- API: User ---
app.get('/api/user', (req, res) => {
  const u = getUserFromCookie(req);
  if (!u) return res.status(401).json({ error: 'Not logged' });
  res.json(u);
});

app.get('/api/is-admin', (req, res) => {
  const u = getUserFromCookie(req);
  res.json({ admin: !!(u && ADMIN_IDS.includes(u.id)), id: u ? u.id : null });
});

// --- API: Pastebin ---
app.get('/api/pastes', (req, res) => {
  const data = readData();
  res.json(Object.values(data.pastes || {}));
});

app.post('/api/pastes', (req, res) => {
  const { text, redirect } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });

  const data = readData();
  data.pastes = data.pastes || {};
  const id = Math.random().toString(36).slice(2, 10);
  data.pastes[id] = {
    id,
    text,
    redirect: redirect || null,
    createdAt: new Date().toISOString(),
    views: 0,
  };
  writeData(data);
  res.json({ id });
});

app.delete('/api/pastes/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  const data = readData();
  if (data.pastes && data.pastes[id]) {
    delete data.pastes[id];
    writeData(data);
  }
  res.json({ ok: true });
});

// --- API: Builder ---
app.post('/api/builder/use', (req, res) => {
  const user = req.body.user;
  if (!user || !user.id)
    return res.status(400).json({ error: 'user required' });

  const data = readData();
  data.users = data.users || {};
  const uid = user.id;
  const today = new Date().toISOString().slice(0, 10);

  // Admins têm usos infinitos
  if (ADMIN_IDS.includes(uid)) {
    return res.json({ ok: true, usesLeft: Infinity });
  }

  data.users[uid] = data.users[uid] || {
    id: uid,
    username: user.username || 'unknown',
    avatar: user.avatar || '',
    usesLeft: 3,
    lastReset: today,
  };

  // Reset diário
  if (data.users[uid].lastReset !== today) {
    data.users[uid].usesLeft = 3;
    data.users[uid].lastReset = today;
  }

  if (data.users[uid].usesLeft <= 0)
    return res.status(403).json({ error: 'no uses left' });

  data.users[uid].usesLeft -= 1;
  writeData(data);
  return res.json({ ok: true, usesLeft: data.users[uid].usesLeft });
});

app.get('/api/builders', (req, res) => {
  const data = readData();
  res.json({ builders: data.builders || [] });
});

// --- Admin APIs ---
app.get('/api/admin/users', requireAdmin, (req, res) => {
  const data = readData();
  res.json(Object.values(data.users || {}));
});

app.get('/api/admin/pastes', requireAdmin, (req, res) => {
  const data = readData();
  res.json(Object.values(data.pastes || {}));
});

app.get('/api/admin/builders', requireAdmin, (req, res) => {
  const data = readData();
  res.json(data.builders || []);
});

// --- Static files ---
app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/admin', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.get('/admin/*', requireAdmin, (req, res) => {
  const rel = req.path.replace('/admin/', '');
  const filePath = path.join(__dirname, 'admin', rel);
  if (fs.existsSync(filePath)) return res.sendFile(filePath);
  return res.status(404).send('Not found');
});

app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
);
app.get('/404.html', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', '404.html'))
);

// --- Start ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port', PORT));

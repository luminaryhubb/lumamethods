const express = require('express');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
app.use(cookieParser());

const CLIENT_ID = process.env.DISCORD_CLIENT_ID || '';
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.DISCORD_CALLBACK_URL || 'http://localhost:3000/auth/discord/callback';
const ADMIN_IDS = ['1411328138931077142','1066509829025300560','1420447434362060917'];

// start oauth
app.get('/auth/discord', (req, res) => {
  const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify`;
  res.redirect(url);
});

// callback
app.get('/auth/discord/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.redirect('/404.html');
  try {
    const tokenRes = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI
    }).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

    const accessToken = tokenRes.data.access_token;
    const userRes = await axios.get('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${accessToken}` } });
    const u = userRes.data;

    // store minimal user info in an HTTP-only cookie (no session store)
    const cookieOpts = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        maxAge: 1000 * 60 * 60 * 24
    };
    res.cookie('discord_user', JSON.stringify({ id: u.id, username: u.username, discriminator: u.discriminator, avatar: u.avatar }), cookieOpts);

    // redirect cleanly
    res.redirect('/public/methods.html');
  } catch (err) {
    console.error('OAuth callback error', err && err.toString());
    res.redirect('/404.html');
  }
});

// endpoint for frontend to read current user (reads cookie)
app.get('/api/user', (req, res) => {
  const cookie = req.cookies.discord_user;
  if (!cookie) return res.status(401).json({ error: 'Not logged' });
  try {
    const user = JSON.parse(cookie);
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Invalid cookie' });
  }
});

// logout
app.get('/auth/logout', (req, res) => {
  res.clearCookie('discord_user');
  res.redirect('/');
});

// static serve
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.get('/404.html', (req, res) => res.sendFile(path.join(__dirname, 'public/404.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));

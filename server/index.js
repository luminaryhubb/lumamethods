const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Passport setup
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

const scopes = ['identify', 'email'];
passport.use(new DiscordStrategy({
  clientID: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL: process.env.DISCORD_CALLBACK_URL,
  scope: scopes
}, function(accessToken, refreshToken, profile, done) {
  // profile contains user info
  profile.accessToken = accessToken;
  return done(null, profile);
}));

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'change_this',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));
app.use(passport.initialize());
app.use(passport.session());

// Auth routes
app.get('/auth/discord', passport.authenticate('discord'));
app.get('/auth/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/' }),
  (req, res) => {
    // Successful auth, redirect to client welcome route
    res.redirect('/welcome');
  });

app.get('/auth/logout', (req, res) => {
  req.logout(() => {});
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// API route to get user data
app.get('/api/user', (req, res) => {
  if (!req.user) return res.json({ logged: false });
  return res.json({
    logged: true,
    id: req.user.id,
    username: req.user.username,
    discriminator: req.user.discriminator,
    avatar: req.user.avatar,
    tag: `${req.user.username}#${req.user.discriminator}`
  });
});

// Serve client build (if exists)
const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientBuildPath));
// Serve index.html for SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

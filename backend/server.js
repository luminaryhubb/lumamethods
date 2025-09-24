const express = require('express');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const session = require('express-session');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Configuração do Passport
passport.use(new DiscordStrategy({
  clientID: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL: process.env.DISCORD_CALLBACK_URL,
  scope: ['identify']
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Configuração do Express
app.use(cors());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, '../client/build'))); // Serve arquivos estáticos do React

// Rota inicial
app.get('/', (req, res) => {
  res.send('<h1>Olá! <a href="/auth/discord">Login com Discord</a></h1>');
});

// Rota de login com Discord
app.get('/auth/discord', passport.authenticate('discord'));

// Callback após o login com Discord
app.get('/auth/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/' }),
  (req, res) => {
    // Após o login com sucesso, redireciona para a página de boas-vindas
    res.redirect(`/welcome?username=${req.user.username}`);
  }
);

// Rota de boas-vindas
app.get('/welcome', (req, res) => {
  const username = req.query.username;
  if (!username) {
    return res.redirect('/');
  }
  res.render('welcome', { username }); // Renderiza a página de boas-vindas
});

// Rota de fallback para quando o React não encontrar uma rota
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

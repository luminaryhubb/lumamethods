// server.js
const express = require("express");
const session = require("express-session");
const fetch = require("node-fetch");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração de sessão
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // true se usar https com proxy reverso
}));

// Servir arquivos estáticos (index.html, metodos.html etc.)
app.use(express.static(path.join(__dirname, "public")));

// Rota inicial -> sempre mostra index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Inicia login com Discord
app.get("/login", (req, res) => {
  const redirectUri = encodeURIComponent(process.env.DISCORD_CALLBACK_URL);
  const clientId = process.env.DISCORD_CLIENT_ID;

  res.redirect(
    `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify%20email`
  );
});

// Callback do Discord
app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.redirect("/");

  try {
    // Troca code por token
    const params = new URLSearchParams();
    params.append("client_id", process.env.DISCORD_CLIENT_ID);
    params.append("client_secret", process.env.DISCORD_CLIENT_SECRET);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", process.env.DISCORD_CALLBACK_URL);

    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error("Erro ao pegar token:", tokenData);
      return res.redirect("/");
    }

    // Busca dados do usuário
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const userData = await userRes.json();

    // Salva usuário na sessão
    req.session.user = userData;
    res.redirect("/metodos.html");
  } catch (err) {
    console.error("Erro no callback:", err);
    res.redirect("/");
  }
});

// Middleware para proteger rotas
function authRequired(req, res, next) {
  if (!req.session.user) return res.redirect("/");
  next();
}

// API para pegar dados do usuário logado
app.get("/api/user", authRequired, (req, res) => {
  res.json(req.session.user);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

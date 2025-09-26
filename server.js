// server.js
const express = require("express");
const session = require("express-session");
const fetch = require("node-fetch");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Sessão
app.use(session({
  secret: process.env.SESSION_SECRET || "secret",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Página inicial
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Login → redireciona pro Discord
app.get("/login", (req, res) => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_CALLBACK_URL; // SEM encodeURIComponent

  const discordAuthUrl =
    `https://discord.com/api/oauth2/authorize?client_id=${clientId}` +
    `&redirect_uri=${redirectUri}` +
    `&response_type=code&scope=identify%20email`;

  res.redirect(discordAuthUrl);
});

// Callback do Discord
app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.redirect("/");

  try {
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

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const userData = await userRes.json();

    req.session.user = userData;
    res.redirect("/metodos.html");
  } catch (err) {
    console.error("Erro no callback:", err);
    res.redirect("/");
  }
});

// Middleware de proteção
function authRequired(req, res, next) {
  if (!req.session.user) return res.redirect("/");
  next();
}

// API → retorna usuário logado
app.get("/api/user", authRequired, (req, res) => {
  res.json(req.session.user);
});

// Start
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

// server.js
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const axios = require("axios");
const path = require("path");

const app = express();

// Configuração da sessão
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
  })
);

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, "public")));

// Login → Redireciona pro Discord
app.get("/login", (req, res) => {
  const authorizeUrl = `https://discord.com/api/oauth2/authorize?client_id=${
    process.env.DISCORD_CLIENT_ID
  }&redirect_uri=${encodeURIComponent(
    process.env.DISCORD_CALLBACK_URL
  )}&response_type=code&scope=identify`;
  res.redirect(authorizeUrl);
});

// Callback do Discord
app.get("/auth/discord/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("Código de autorização não encontrado.");

  try {
    // Trocar o código por um token
    const tokenResponse = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.DISCORD_CALLBACK_URL,
        scope: "identify",
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Pegar dados do usuário
    const userResponse = await axios.get("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Salvar usuário na sessão
    req.session.user = userResponse.data;

    // Redirecionar para métodos
    res.redirect("/metodos.html");
  } catch (err) {
    console.error("Erro no callback:", err.response?.data || err.message);
    res.status(500).send("Erro na autenticação com Discord.");
  }
});

// Middleware para proteger rotas
function checkAuth(req, res, next) {
  if (req.session.user) return next();
  return res.redirect("/");
}

// Exemplo de rota protegida
app.get("/metodos.html", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "metodos.html"));
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server rodando em http://localhost:${PORT}`)
);

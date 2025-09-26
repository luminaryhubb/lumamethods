// server.js (corrigido para Render + Discord OAuth2)
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const axios = require("axios");
const path = require("path");

const app = express();

// Render usa proxy HTTPS → precisamos avisar o Express
app.set("trust proxy", 1);

// Configuração da sessão
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,     // Render sempre usa HTTPS em produção
      sameSite: "none", // necessário para redirecionamento do Discord
    },
  })
);

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, "public")));

// Rota de login → Discord
app.get("/login", (req, res) => {
  const authorizeUrl = `https://discord.com/api/oauth2/authorize?client_id=${
    process.env.DISCORD_CLIENT_ID
  }&redirect_uri=${encodeURIComponent(
    process.env.DISCORD_CALLBACK_URL
  )}&response_type=code&scope=identify`;

  console.log("🔗 Redirecionando para:", authorizeUrl);
  res.redirect(authorizeUrl);
});

// Callback do Discord
app.get("/auth/discord/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("❌ Código de autorização não encontrado.");

  try {
    // Trocar código por token
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
    console.log("✅ Usuário autenticado:", req.session.user);

    // Garante que a sessão é persistida antes do redirect
    req.session.save(err => {
      if (err) console.error("Erro ao salvar sessão:", err);
      res.redirect("/metodos.html");
    });
  } catch (err) {
    console.error("❌ Erro no callback:", err.response?.data || err.message);
    res.status(500).send("Erro na autenticação com Discord.");
  }
});

// Middleware para proteger rotas
function checkAuth(req, res, next) {
  console.log("🔎 Sessão atual:", req.session.user);
  if (req.session.user) return next();
  return res.redirect("/");
}

// Rota protegida
app.get("/metodos.html", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "metodos.html"));
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    console.log("👋 Sessão destruída");
    res.redirect("/");
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server rodando em http://localhost:${PORT}`)
);

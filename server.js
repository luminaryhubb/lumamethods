// server.js — versão com proteção correta e debug
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const axios = require("axios");
const path = require("path");

const app = express();

// Se o app estiver atrás de proxy (Render) — obrigatório para secure cookies funcionar
app.set("trust proxy", 1);

// ---------- (OPCIONAL) Sessão em Postgres (recomendado em produção com múltiplas réplicas)
// Para usar, instale: npm i connect-pg-simple pg
// e defina USE_PG_SESSION=true e DATABASE_URL no seu Render env.
// Uncomment abaixo se for usar.
// const pgSession = require("connect-pg-simple")(session);
// const { Pool } = require("pg");
// const pgPool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const sessionConfig = {
  secret: process.env.SESSION_SECRET || "supersecret",
  resave: false,
  saveUninitialized: false,
  // Sessão configurada para OAuth redirect: SameSite none + secure true
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // em Render deve ser true
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24, // 1 dia (ajuste se quiser)
  },
};

// if (process.env.USE_PG_SESSION === "true") {
//   sessionConfig.store = new pgSession({ pool: pgPool, tableName: "session" });
//}

app.use(session(sessionConfig));

// (DEBUG) Log simples de cada request — útil pra ver se cookie chega ao servidor
app.use((req, res, next) => {
  console.log("<<REQ>>", req.method, req.url, "Cookie header:", req.headers.cookie || "—");
  next();
});

// Rota de login (redireciona pro Discord)
app.get("/login", (req, res) => {
  const authorizeUrl = `https://discord.com/api/oauth2/authorize?client_id=${
    process.env.DISCORD_CLIENT_ID
  }&redirect_uri=${encodeURIComponent(
    process.env.DISCORD_CALLBACK_URL
  )}&response_type=code&scope=identify`;
  console.log("🔗 Redirecionando para:", authorizeUrl);
  res.redirect(authorizeUrl);
});

// Callback do Discord (troca código por token, pega usuário e salva na sessão)
app.get("/auth/discord/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Código não encontrado");

  try {
    const tokenResponse = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.DISCORD_CALLBACK_URL,
        scope: "identify",
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const accessToken = tokenResponse.data.access_token;
    const userResponse = await axios.get("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    req.session.user = userResponse.data;
    console.log("✅ Usuário autenticado:", req.session.user);

    // Garantir persistência antes de redirecionar
    req.session.save(err => {
      if (err) console.error("Erro ao salvar sessão:", err);
      // redireciona para página protegida
      res.redirect("/metodos.html");
    });
  } catch (err) {
    console.error("Erro no callback:", err.response?.data || err.message);
    res.status(500).send("Erro na autenticação com Discord.");
  }
});

// Middleware de proteção
function checkAuth(req, res, next) {
  console.log("🔎 Sessão atual (no checkAuth):", !!req.session.user);
  if (req.session.user) return next();
  return res.redirect("/");
}

// Rota protegida — esta rota será chamada antes do express.static abaixo
app.get("/metodos.html", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "metodos.html"));
});

// Rota de debug para checar sessão via navegador
app.get("/_session", (req, res) => {
  res.json({ user: req.session.user || null });
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) console.error("Erro ao destruir sessão:", err);
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

// Agora sim serve os arquivos estáticos (index, css, js) — colocado *depois* das rotas protegidas
app.use(express.static(path.join(__dirname, "public")));

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server rodando na porta ${PORT}`));

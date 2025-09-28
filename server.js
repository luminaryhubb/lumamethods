const express = require("express");
const session = require("express-session");
const fetch = require("node-fetch");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

// middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// sessão
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
  })
);

// servir pastas estáticas
app.use(express.static(path.join(__dirname, "public")));
app.use("/admin", express.static(path.join(__dirname, "admin")));

// memória temporária
let users = {}; // {id: {name, avatar, usesLeft, role}}
let pastes = {}; // {id: {content, password, createdAt, views}}

// reset diário às 00:00 → renova usos
setInterval(() => {
  Object.keys(users).forEach((id) => {
    users[id].usesLeft = 3;
  });
  console.log("Usos resetados!");
}, 24 * 60 * 60 * 1000);

// rota de login Discord
app.get("/auth/discord", (req, res) => {
  const redirect = encodeURIComponent(process.env.DISCORD_REDIRECT_URI);
  const url = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${redirect}&response_type=code&scope=identify`;
  res.redirect(url);
});

// callback do discord
app.get("/auth/discord/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.redirect("/index.html");

  try {
    const params = new URLSearchParams();
    params.append("client_id", process.env.DISCORD_CLIENT_ID);
    params.append("client_secret", process.env.DISCORD_CLIENT_SECRET);
    params.append("grant_type", "authorization_code");
    params.append("redirect_uri", process.env.DISCORD_REDIRECT_URI);
    params.append("code", code);
    params.append("scope", "identify");

    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      body: params,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const tokenData = await tokenRes.json();

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    req.session.user = {
      id: userData.id,
      name: userData.username,
      avatar: `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`,
      role: userData.id === process.env.ADMIN_ID ? "admin" : "user",
    };

    if (!users[userData.id]) {
      users[userData.id] = {
        id: userData.id,
        name: userData.username,
        avatar: `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`,
        role: userData.id === process.env.ADMIN_ID ? "admin" : "user",
        usesLeft: 3,
      };
    }

    if (req.session.user.role === "admin") {
      return res.redirect("/admin/index.html");
    } else {
      return res.redirect("/methods.html");
    }
  } catch (err) {
    console.error("Erro no login:", err);
    return res.redirect("/index.html");
  }
});

// API: informações do usuário logado
app.get("/api/user", (req, res) => {
  if (!req.session.user) return res.json({ user: null });
  res.json({ user: users[req.session.user.id] });
});

// API: admin check
app.get("/api/is-admin", (req, res) => {
  if (!req.session.user) return res.json({ admin: false });
  res.json({ admin: req.session.user.role === "admin" });
});

// API: criar paste (shortner)
app.post("/api/paste", (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Não logado" });

  const user = users[req.session.user.id];
  if (user.usesLeft <= 0) {
    return res.status(403).json({ error: "Sem usos restantes" });
  }

  const { content, password, redirect } = req.body;
  if (!content || !password) {
    return res.status(400).json({ error: "Conteúdo e senha são obrigatórios" });
  }

  const id = Math.random().toString(36).substring(2, 8);
  pastes[id] = {
    id,
    content,
    password,
    redirect: redirect || null,
    createdAt: new Date().toISOString(),
    views: 0,
  };

  user.usesLeft--;

  res.json({ link: `/paste/${id}` });
});

// API: acessar paste
app.post("/api/paste/:id", (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  const paste = pastes[id];
  if (!paste) return res.status(404).json({ error: "Paste não encontrado" });
  if (paste.password !== password)
    return res.status(403).json({ error: "Senha incorreta" });

  pastes[id].views++;

  if (paste.redirect) {
    return res.json({ redirect: paste.redirect });
  }
  res.json({ content: paste.content });
});

// API: admin lista pastes
app.get("/api/admin/pastes", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin")
    return res.status(403).json({ error: "Acesso negado" });
  res.json({ pastes: Object.values(pastes) });
});

// rodar servidor
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});

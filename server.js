require("dotenv").config();
const express = require("express");
const session = require("express-session");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_CALLBACK_URL || `http://localhost:${PORT}/auth/discord/callback`;
const SESSION_SECRET = process.env.SESSION_SECRET || "secret123";
const ADMIN_IDS = (process.env.ADMIN_IDS || "").split(",");

const dataFile = path.join(__dirname, "data.json");

// Helpers para persistir dados
function readData() {
  if (!fs.existsSync(dataFile)) return { users: {}, pastes: {}, views: 0 };
  return JSON.parse(fs.readFileSync(dataFile));
}
function writeData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

// Middlewares
app.use(express.static("public"));
app.use("/admin", express.static(path.join(__dirname, "admin")));
app.use(bodyParser.json());
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// Middleware auth
function ensureAuth(req, res, next) {
  if (!req.session.user) return res.redirect("/");
  next();
}

// Reset diário
function resetDailyUses() {
  const data = readData();
  const today = new Date().toISOString().slice(0, 10);
  for (const uid in data.users) {
    const u = data.users[uid];
    if (u.lastReset !== today) {
      u.usesLeft = ADMIN_IDS.includes(uid) ? Infinity : 3;
      u.lastReset = today;
    }
  }
  writeData(data);
}
setInterval(resetDailyUses, 60 * 60 * 1000);

// -----------------------------
// Discord OAuth
// -----------------------------

// Alias para compatibilidade
app.get("/auth/discord", (req, res) => res.redirect("/auth/login"));

// Login
app.get("/auth/login", (req, res) => {
  const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_type=code&scope=identify`;
  res.redirect(url);
});

// Callback
app.get("/auth/discord/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.redirect("/");

  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error("Erro ao obter token:", tokenData);
      return res.redirect("/");
    }

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const u = await userRes.json();

    const data = readData();
    if (!data.users[u.id]) {
      data.users[u.id] = {
        id: u.id,
        username: u.username,
        avatar: `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`,
        usesLeft: ADMIN_IDS.includes(u.id) ? Infinity : 3,
        lastReset: new Date().toISOString().slice(0, 10),
        blocked: false,
      };
      writeData(data);
    }

    req.session.user = { id: u.id, username: u.username, avatar: u.avatar };

    // após login → manda para methods
    res.redirect("/methods.html");
  } catch (err) {
    console.error(err);
    res.redirect("/");
  }
});

// Logout
app.get("/auth/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// -----------------------------
// APIs
// -----------------------------

// Info user
app.get("/api/user", ensureAuth, (req, res) => {
  const data = readData();
  const user = data.users[req.session.user.id];
  res.json(user);
});

// Builder (usa 1 uso)
app.post("/api/builder/use", ensureAuth, (req, res) => {
  const data = readData();
  const user = data.users[req.session.user.id];
  if (!user) return res.status(403).json({ error: "Usuário não encontrado" });
  if (user.blocked) return res.status(403).json({ error: "Bloqueado" });

  if (!ADMIN_IDS.includes(user.id)) {
    if (user.usesLeft <= 0) return res.status(403).json({ error: "Sem usos restantes" });
    user.usesLeft -= 1;
  }
  writeData(data);
  res.json({ success: true });
});

// -----------------------------
// Paste (shortner)
// -----------------------------
app.post("/api/create", ensureAuth, (req, res) => {
  const text = (req.body.text || "").toString().trim();
  const password = (req.body.password || "").toString();
  const redirect = (req.body.redirect || "").toString().trim();

  if (!text || !password) {
    return res.status(400).json({ error: "Faltando dados: text e password são obrigatórios" });
  }

  const data = readData();
  const uid = req.session.user.id;

  if (!ADMIN_IDS.includes(uid)) {
    if (data.users[uid].usesLeft <= 0) {
      return res.status(403).json({ error: "Sem usos restantes" });
    }
    data.users[uid].usesLeft -= 1;
  }

  const id = Math.random().toString(36).slice(2, 9);
  data.pastes[id] = {
    id,
    text,
    password,
    redirect: redirect || null,
    createdBy: uid,
    createdAt: new Date().toISOString(),
    views: 0,
  };

  writeData(data);
  return res.json({ id, link: `/paste/${id}` });
});

// Ver paste
app.get("/paste/:id", (req, res) => {
  const data = readData();
  const paste = data.pastes[req.params.id];
  if (!paste) return res.status(404).send("Paste não encontrado");

  paste.views = (paste.views || 0) + 1;
  writeData(data);

  if (paste.redirect) {
    return res.redirect(paste.redirect);
  }

  res.send(`<h3>Conteúdo:</h3><pre>${paste.text}</pre><p>Senha: ${paste.password}</p>`);
});

// -----------------------------
// Admin APIs
// -----------------------------
app.get("/api/admin/stats", ensureAuth, (req, res) => {
  if (!ADMIN_IDS.includes(req.session.user.id)) return res.status(403).json({ error: "Sem permissão" });
  const data = readData();
  res.json({
    totalUsers: Object.keys(data.users).length,
    totalPastes: Object.keys(data.pastes).length,
    views: data.views || 0,
  });
});

// -----------------------------
app.listen(PORT, () => console.log("✅ Server rodando na porta " + PORT));

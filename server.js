// server.js
const express = require("express");
const fetch = require("node-fetch");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3000;

// =======================
// CONFIGURAÇÕES
// =======================
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || "http://localhost:3000/callback";
const ADMIN_IDS = (process.env.ADMIN_IDS || "").split(",");

const DATA_FILE = path.join(__dirname, "data.json");

// =======================
// HELPERS DE DATA
// =======================
function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return { users: {}, pastes: {} };
  }
}
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// reset diário de usos
setInterval(() => {
  const data = readData();
  const today = new Date().toISOString().slice(0, 10);
  if (data.lastReset !== today) {
    for (const uid in data.users) {
      data.users[uid].usesLeft = 3;
    }
    data.lastReset = today;
    writeData(data);
    console.log("Usos resetados:", today);
  }
}, 60 * 1000);

// =======================
// MIDDLEWARES
// =======================
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
  })
);

// static: public e admin
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/admin", express.static(path.join(__dirname, "admin")));

// =======================
// AUTH
// =======================
function ensureAuth(req, res, next) {
  if (req.session.user) return next();
  return res.status(401).json({ error: "Não autorizado" });
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// login com discord
app.get("/login", (req, res) => {
  const url =
    `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code&scope=identify`;
  res.redirect(url);
});

app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Code ausente");

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
    const token = await tokenRes.json();
    if (!token.access_token) return res.status(400).json(token);

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    const user = await userRes.json();

    const data = readData();
    if (!data.users[user.id]) {
      data.users[user.id] = {
        id: user.id,
        username: `${user.username}#${user.discriminator}`,
        usesLeft: 3,
      };
      writeData(data);
    }

    req.session.user = user;

    if (ADMIN_IDS.includes(user.id)) {
      return res.redirect("/admin/index.html");
    } else {
      return res.redirect("/public/methods.html");
    }
  } catch (err) {
    console.error("Erro callback:", err);
    res.status(500).send("Erro interno");
  }
});

// logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// =======================
// API USER
// =======================
app.get("/api/user", ensureAuth, (req, res) => {
  const data = readData();
  const uid = req.session.user.id;
  res.json(data.users[uid]);
});

// =======================
// API PASTES
// =======================
app.post("/api/create", ensureAuth, (req, res) => {
  const text = (req.body.text || req.body.content || "").toString().trim();
  const password = (req.body.password || "").toString();
  const redirect = (req.body.redirect || req.body.url || null);

  if (!text || !password) {
    return res
      .status(400)
      .json({ error: "Faltando dados: text/content e password" });
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
    redirect,
    createdBy: uid,
    createdAt: new Date().toISOString(),
    views: 0,
  };
  writeData(data);

  res.json({ id, link: `/paste/${id}` });
});

// compatibilidade
app.post("/api/paste", ensureAuth, (req, res) => {
  req.url = "/api/create";
  app.handle(req, res);
});

// abrir paste
app.get("/paste/:id", (req, res) => {
  const data = readData();
  const paste = data.pastes[req.params.id];
  if (!paste) return res.status(404).send("Paste não encontrado");

  res.send(`
    <html>
      <head><title>Paste ${paste.id}</title></head>
      <body style="font-family: sans-serif; background: #111; color: #eee;">
        <h2>Paste protegido</h2>
        <form method="POST" action="/paste/${paste.id}/view">
          <input type="password" name="password" placeholder="Senha" required />
          <button type="submit">Ver Conteúdo</button>
        </form>
      </body>
    </html>
  `);
});

// ver paste
app.use(express.urlencoded({ extended: true }));
app.post("/paste/:id/view", (req, res) => {
  const data = readData();
  const paste = data.pastes[req.params.id];
  if (!paste) return res.status(404).send("Paste não encontrado");

  if (req.body.password !== paste.password) {
    return res.status(403).send("Senha incorreta");
  }

  paste.views += 1;
  writeData(data);

  if (paste.redirect) {
    return res.redirect(paste.redirect);
  }

  res.send(`
    <html>
      <head><title>Paste ${paste.id}</title></head>
      <body style="font-family: monospace; background: #111; color: #eee;">
        <pre>${paste.text}</pre>
      </body>
    </html>
  `);
});

// =======================
// START
// =======================
app.listen(PORT, () =>
  console.log(`Servidor rodando em http://localhost:${PORT}`)
);

// -----------------------------
// server.js
// -----------------------------
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// -----------------------------
// CONFIG
// -----------------------------
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || "http://localhost:3000/auth/callback";
const ADMIN_IDS = (process.env.ADMIN_IDS || "").split(",");

// -----------------------------
// HELPERS (data.json)
// -----------------------------
const DATA_FILE = path.join(__dirname, "data.json");

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

// -----------------------------
// MIDDLEWARE
// -----------------------------
app.use(bodyParser.json());
app.use(
  session({
    secret: "supersecret",
    resave: false,
    saveUninitialized: false,
  })
);

function ensureAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: "Não autenticado" });
  next();
}

// -----------------------------
// STATIC FILES
// -----------------------------
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/admin", express.static(path.join(__dirname, "admin"))); // <-- serve admin também

// -----------------------------
// DISCORD LOGIN
// -----------------------------
app.get("/auth/discord", (req, res) => {
  const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_type=code&scope=identify`;
  res.redirect(url);
});

app.get("/auth/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Código não fornecido");

  try {
    // troca code por token
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

    // pega user info
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const user = await userRes.json();

    req.session.user = user;

    // registra usuário no data.json
    const data = readData();
    if (!data.users[user.id]) {
      data.users[user.id] = {
        id: user.id,
        username: user.username,
        usesLeft: 3,
      };
      writeData(data);
    }

    res.redirect("/public/methods.html");
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro no login do Discord");
  }
});

// -----------------------------
// PASTE CREATION
// -----------------------------
app.post("/api/create", ensureAuth, (req, res) => {
  const text = (req.body.text || req.body.content || "").toString().trim();
  const password = (req.body.password || "").toString().trim();
  const redirect = (req.body.redirect || req.body.url || null);

  if (!text || !password) {
    return res.status(400).json({ error: "Faltando dados: text/content e password são obrigatórios" });
  }

  const data = readData();
  const uid = req.session.user && req.session.user.id;

  if (!uid || !data.users[uid]) {
    return res.status(401).json({ error: "Usuário não encontrado / não logado" });
  }

  // controla usos (admins não gastam)
  if (!ADMIN_IDS.includes(uid)) {
    data.users[uid].usesLeft = data.users[uid].usesLeft ?? 3;
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
  return res.json({ id, link: `/paste/${id}` });
});

// compatibilidade
app.post("/api/paste", ensureAuth, (req, res) => {
  return app._router.handle(req, res, () => {}, "post", "/api/create");
});

// -----------------------------
// PASTE VIEW (senha obrigatória SEMPRE)
// -----------------------------
app.get("/paste/:id", (req, res) => {
  const id = req.params.id;
  const data = readData();
  const paste = data.pastes[id];

  if (!paste) return res.status(404).send("Paste não encontrado");

  res.send(`
    <html>
      <body style="font-family: sans-serif; max-width: 600px; margin: 50px auto;">
        <h2>Este paste está protegido por senha 🔑</h2>
        <form method="POST" action="/paste/${id}/check">
          <input type="password" name="password" placeholder="Senha" required />
          <button type="submit">Acessar</button>
        </form>
      </body>
    </html>
  `);
});

app.use(bodyParser.urlencoded({ extended: true }));

app.post("/paste/:id/check", (req, res) => {
  const id = req.params.id;
  const { password } = req.body;
  const data = readData();
  const paste = data.pastes[id];

  if (!paste) return res.status(404).send("Paste não encontrado");

  if (password !== paste.password) {
    return res.status(403).send("Senha incorreta");
  }

  data.pastes[id].views++;
  writeData(data);

  if (paste.redirect) {
    return res.redirect(paste.redirect);
  } else {
    return res.send(`<pre>${paste.text}</pre>`);
  }
});

// -----------------------------
// START SERVER
// -----------------------------
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

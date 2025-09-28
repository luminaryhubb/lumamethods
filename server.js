const express = require("express");
const session = require("express-session");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== CONFIG ====================
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || "http://localhost:3000/auth/callback";
const ADMIN_IDS = (process.env.ADMIN_IDS || "").split(",");

// ==================== SESSION ====================
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
  })
);

// ==================== DB HELPERS ====================
const DATA_FILE = path.join(__dirname, "data.json");
function readData() {
  if (!fs.existsSync(DATA_FILE)) return { users: {}, pastes: {} };
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ==================== STATIC FILES ====================
// Agora os arquivos da pasta public ficam acessíveis na raiz
app.use(express.static(path.join(__dirname, "public")));
app.use("/admin", express.static(path.join(__dirname, "admin")));

// ==================== AUTH MIDDLEWARE ====================
function ensureAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Não autenticado" });
  }
  next();
}
function ensureAdmin(req, res, next) {
  if (!req.session.user || !ADMIN_IDS.includes(req.session.user.id)) {
    return res.status(403).json({ error: "Acesso negado" });
  }
  next();
}

// ==================== DISCORD OAUTH ====================
app.get("/auth/login", (req, res) => {
  const url = new URL("https://discord.com/api/oauth2/authorize");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "identify");
  res.redirect(url.toString());
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

    if (!tokenData.access_token) {
      return res.status(400).json({ error: "Falha ao obter token", details: tokenData });
    }

    // pega user info
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const user = await userRes.json();

    req.session.user = user;

    // registra usuário
    const data = readData();
    if (!data.users[user.id]) {
      data.users[user.id] = {
        id: user.id,
        username: user.username,
        usesLeft: 3,
      };
      writeData(data);
    }

    // 🔥 redireciona direto para methods.html
    res.redirect("/methods.html");
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro no login do Discord");
  }
});

app.get("/auth/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/index.html"));
});

// ==================== API USER ====================
app.get("/api/user", ensureAuth, (req, res) => {
  const data = readData();
  const uid = req.session.user.id;
  res.json({ user: data.users[uid] || null });
});

app.get("/api/is-admin", (req, res) => {
  res.json({ admin: req.session.user && ADMIN_IDS.includes(req.session.user.id) });
});

// ==================== PASTES ====================
app.post("/api/create", ensureAuth, (req, res) => {
  const text = (req.body.text || req.body.content || "").toString().trim();
  const password = (req.body.password || "").toString();
  const redirect = (req.body.redirect || req.body.url || null);

  if (!text || !password) {
    return res.status(400).json({ error: "Faltando dados: text/content e password são obrigatórios" });
  }

  const data = readData();
  const uid = req.session.user.id;

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

app.get("/paste/:id", (req, res) => {
  const { id } = req.params;
  const data = readData();
  const paste = data.pastes[id];
  if (!paste) return res.status(404).send("Paste não encontrado");

  // envia uma página simples pedindo senha
  res.send(`
    <html>
      <body style="font-family: sans-serif; padding: 20px; background: #111; color: #eee;">
        <h2>🔒 Paste protegido</h2>
        <form method="POST" action="/paste/${id}/unlock">
          <input type="password" name="password" placeholder="Senha" />
          <button type="submit">Entrar</button>
        </form>
      </body>
    </html>
  `);
});

app.post("/paste/:id/unlock", express.urlencoded({ extended: true }), (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  const data = readData();
  const paste = data.pastes[id];
  if (!paste) return res.status(404).send("Paste não encontrado");

  if (paste.password !== password) {
    return res.status(403).send("Senha incorreta");
  }

  paste.views++;
  writeData(data);

  if (paste.redirect) {
    return res.redirect(paste.redirect);
  } else {
    return res.send(`<pre style="white-space: pre-wrap;">${paste.text}</pre>`);
  }
});

// ==================== ADMIN ====================
app.get("/api/admin/pastes", ensureAdmin, (req, res) => {
  const data = readData();
  res.json({ pastes: Object.values(data.pastes || {}) });
});

app.delete("/api/admin/pastes/:id", ensureAdmin, (req, res) => {
  const data = readData();
  delete data.pastes[req.params.id];
  writeData(data);
  res.json({ ok: true });
});

// ==================== START ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server rodando na porta ${PORT}`));

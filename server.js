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
const REDIRECT_URI =
  process.env.DISCORD_CALLBACK_URL || "http://localhost:3000/auth/discord/callback";
const SESSION_SECRET = process.env.SESSION_SECRET || "secret123";
const ADMIN_IDS = process.env.ADMIN_IDS
  ? process.env.ADMIN_IDS.split(",")
  : ["1411328138931077142", "1066509829025300560", "1420447434362060917"];

const dataFile = path.join(__dirname, "data.json");
function readData() {
  if (!fs.existsSync(dataFile)) return { users: {}, pastes: {}, views: 0 };
  return JSON.parse(fs.readFileSync(dataFile));
}
function writeData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

app.use(express.static("public"));
app.use("/admin", express.static("admin"));
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

// Discord OAuth
app.get("/auth/discord", (req, res) => {
  res.redirect(
    `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&response_type=code&scope=identify`
  );
});

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

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const u = await userRes.json();

    const data = readData();
    if (!data.users[u.id]) {
      data.users[u.id] = {
        id: u.id,
        username: u.username,
        avatar: u.avatar,
        usesLeft: ADMIN_IDS.includes(u.id) ? Infinity : 3,
        lastReset: new Date().toISOString().slice(0, 10),
        blocked: false,
      };
      writeData(data);
    }

    req.session.user = { id: u.id, username: u.username, avatar: u.avatar };

    // ✅ Corrigido aqui: sem /public
    if (ADMIN_IDS.includes(u.id)) {
      res.redirect("/admin");
    } else {
      res.redirect("/methods.html");
    }
  } catch (err) {
    console.error(err);
    res.redirect("/");
  }
});

app.get("/auth/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

app.get("/api/user", ensureAuth, (req, res) => {
  const data = readData();
  const user = data.users[req.session.user.id];
  res.json(user);
});

// Builder endpoint
app.post("/api/builder/use", ensureAuth, (req, res) => {
  const data = readData();
  const user = data.users[req.session.user.id];
  if (!user) return res.status(403).json({ error: "Usuário não encontrado" });
  if (user.blocked) return res.status(403).json({ error: "Bloqueado" });

  if (!ADMIN_IDS.includes(user.id)) {
    if (user.usesLeft <= 0)
      return res.status(403).json({ error: "Sem usos restantes" });
    user.usesLeft -= 1;
  }
  writeData(data);
  res.json({ success: true, link: "https://exemplo.com/generated-link" });
});

// Paste endpoints
app.post("/api/create", ensureAuth, (req, res) => {
  const { text, password, redirect } = req.body;
  if (!text || !password)
    return res.status(400).json({ error: "Faltando dados" });
  const id = Math.random().toString(36).slice(2, 8);
  const data = readData();
  data.pastes[id] = { text, password, redirect };
  writeData(data);
  res.json({ id });
});

app.get("/paste/:id", (req, res) => {
  const data = readData();
  const paste = data.pastes[req.params.id];
  if (!paste) return res.status(404).send("Paste não encontrado");
  res.send(`<pre>${paste.text}</pre>`);
});

// Admin stats
app.get("/api/admin/stats", ensureAuth, (req, res) => {
  if (!ADMIN_IDS.includes(req.session.user.id))
    return res.status(403).json({ error: "Sem permissão" });
  const data = readData();
  res.json({
    totalUsers: Object.keys(data.users).length,
    totalPastes: Object.keys(data.pastes).length,
    views: data.views || 0,
  });
});

app.listen(PORT, () => console.log("Server rodando na porta " + PORT));

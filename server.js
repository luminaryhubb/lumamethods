// server.js
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI =
  process.env.DISCORD_CALLBACK_URL ||
  `http://localhost:${PORT}/auth/discord/callback`;
const SESSION_SECRET = process.env.SESSION_SECRET || "secret123";

const ADMIN_IDS = (process.env.ADMIN_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const dataFile = path.join(__dirname, "data.json");

// ---------------- Persistência ----------------
function readData() {
  if (!fs.existsSync(dataFile))
    return {
      users: {},
      pastes: {},
      builders: [],
      views: 0,
      stats: { usersTimeseries: [], dates: [] },
    };
  return JSON.parse(fs.readFileSync(dataFile));
}
function writeData(d) {
  fs.writeFileSync(dataFile, JSON.stringify(d, null, 2));
}
(function ensureData() {
  const d = readData();
  d.users = d.users || {};
  d.pastes = d.pastes || {};
  d.builders = d.builders || [];
  d.views = d.views || 0;
  writeData(d);
})();

// ---------------- Middlewares ----------------
app.use(express.static(path.join(__dirname, "public")));
app.use("/admin", express.static(path.join(__dirname, "admin")));
app.use(bodyParser.json());
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

function defaultUsesForRole(role) {
  if (!role) return 3;
  if (role === "Basic") return 10;
  if (role === "Plus") return 25;
  if (role === "Premium") return 55;
  return 3;
}
function isAdminId(id) {
  return ADMIN_IDS.includes(String(id));
}
function ensureAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: "Not logged" });
  next();
}

// ---------------- Reset diário ----------------
function resetDailyUses() {
  const data = readData();
  const today = new Date().toISOString().slice(0, 10);
  for (const uid in data.users) {
    const u = data.users[uid];
    const role = (u.roles && u.roles[0]) || u.role || "Membro";
    const target = isAdminId(uid) ? Infinity : defaultUsesForRole(role);
    if (u.lastReset !== today) {
      u.usesLeft = target;
      u.lastReset = today;
    } else {
      if (u.usesLeft === undefined) u.usesLeft = target;
    }
  }
  writeData(data);
}
setInterval(resetDailyUses, 60 * 60 * 1000);
resetDailyUses();

// ---------------- Discord OAuth ----------------
app.get("/auth/discord", (req, res) => res.redirect("/auth/login"));
app.get("/auth/login", (req, res) => {
  if (!CLIENT_ID) return res.status(500).send("DISCORD_CLIENT_ID not set");
  const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_type=code&scope=identify`;
  res.redirect(url);
});
app.get("/auth/discord/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.redirect("/");
  try {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    });
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return res.redirect("/");

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const u = await userRes.json();

    const data = readData();
    if (!data.users[u.id]) {
      const role = "Membro";
      data.users[u.id] = {
        id: u.id,
        username: u.username,
        avatar: u.avatar
          ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`
          : null,
        roles: [role],
        usesLeft: isAdminId(u.id) ? Infinity : defaultUsesForRole(role),
        lastReset: new Date().toISOString().slice(0, 10),
        blocked: false,
        createdAt: new Date().toISOString(),
      };
    } else {
      data.users[u.id].username = u.username;
      if (u.avatar)
        data.users[u.id].avatar = `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`;
    }
    writeData(data);

    req.session.user = {
      id: u.id,
      username: u.username,
      avatar: data.users[u.id].avatar || null,
    };
    return res.redirect("/methods.html");
  } catch (err) {
    console.error("oauth callback error", err);
    return res.redirect("/");
  }
});
app.get("/auth/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// ---------------- APIs ----------------
app.get("/api/user", ensureAuth, (req, res) => {
  const data = readData();
  const u = data.users[req.session.user.id];
  if (!u) return res.status(404).json({ error: "User unknown" });
  return res.json({ user: u });
});
app.get("/api/is-admin", ensureAuth, (req, res) => {
  return res.json({ isAdmin: isAdminId(req.session.user.id) });
});

// builder use
app.post("/api/builder/use", ensureAuth, (req, res) => {
  const data = readData();
  const uid = req.session.user.id;
  const u = data.users[uid];
  if (!u) return res.status(404).json({ error: "User not found" });
  if (u.blocked)
    return res.status(403).json({ error: "Você foi banido do Luma Methods" });
  if (!isAdminId(uid)) {
    if (u.usesLeft <= 0)
      return res.status(403).json({ error: "Sem Usos Restantes - Volte amanhã!" });
    u.usesLeft -= 1;
  }
  data.builders.push({
    id: Math.random().toString(36).slice(2, 9),
    user: uid,
    username: u.username,
    mode: req.body.mode || "Roblox",
    platform: req.body.platform || req.body.mode || "Roblox",
    robloxLink: req.body.robloxLink || null,
    game: req.body.game || null,
    platformUser: req.body.platformUser || null,
    createdAt: new Date().toISOString(),
  });
  writeData(data);
  return res.json({ ok: true, usesLeft: u.usesLeft });
});

// paste
app.post("/api/create", ensureAuth, (req, res) => {
  const text = (req.body.text || req.body.content || "").trim();
  const password = (req.body.password || "").toString();
  const redirect = (req.body.redirect || "").trim() || null;
  if (!text || !password)
    return res.status(400).json({ error: "text and password required" });

  const data = readData();
  const uid = req.session.user.id;
  const u = data.users[uid];
  if (!isAdminId(uid)) {
    if (u.usesLeft <= 0)
      return res.status(403).json({ error: "Sem Usos Disponíveis - Volte amanhã" });
    u.usesLeft -= 1;
  }
  const id = Math.random().toString(36).slice(2, 9);
  data.pastes[id] = {
    id,
    text,
    password,
    redirect,
    createdBy: uid,
    createdByName: u.username,
    createdAt: new Date().toISOString(),
    views: 0,
  };
  writeData(data);
  return res.json({ id, link: `/paste/${id}` });
});
app.get("/api/paste/:id/data", (req, res) => {
  const data = readData();
  const p = data.pastes[req.params.id];
  if (!p) return res.status(404).json({ error: "Not found" });
  return res.json({
    id: p.id,
    createdAt: p.createdAt,
    views: p.views || 0,
    redirect: p.redirect || null,
    createdBy: p.createdBy,
    createdByName: p.createdByName,
  });
});
app.post("/api/paste/:id/access", (req, res) => {
  const data = readData();
  const p = data.pastes[req.params.id];
  if (!p) return res.status(404).json({ error: "Not found" });
  if (p.password !== (req.body.password || ""))
    return res.status(403).json({ error: "Invalid password" });
  p.views = (p.views || 0) + 1;
  data.views = (data.views || 0) + 1;
  writeData(data);
  return res.json({ text: p.text, redirect: p.redirect || null });
});
app.get("/paste/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "view.html"));
});

// ---------------- Admin APIs ----------------
app.get("/api/admin/users", ensureAuth, (req, res) => {
  if (!isAdminId(req.session.user.id))
    return res.status(403).json({ error: "Forbidden" });
  const data = readData();
  res.json({ users: Object.values(data.users) });
});
app.post("/api/admin/block", ensureAuth, (req, res) => {
  if (!isAdminId(req.session.user.id))
    return res.status(403).json({ error: "Forbidden" });
  const { id } = req.body;
  const data = readData();
  if (!data.users[id]) return res.status(404).json({ error: "Not found" });
  data.users[id].blocked = true;
  writeData(data);
  res.json({ ok: true });
});
app.post("/api/admin/unblock", ensureAuth, (req, res) => {
  if (!isAdminId(req.session.user.id))
    return res.status(403).json({ error: "Forbidden" });
  const { id } = req.body;
  const data = readData();
  if (!data.users[id]) return res.status(404).json({ error: "Not found" });
  data.users[id].blocked = false;
  writeData(data);
  res.json({ ok: true });
});
app.post("/api/admin/adduses", ensureAuth, (req, res) => {
  if (!isAdminId(req.session.user.id))
    return res.status(403).json({ error: "Forbidden" });
  const { id, amount } = req.body;
  const data = readData();
  if (!data.users[id]) return res.status(404).json({ error: "Not found" });
  data.users[id].usesLeft = (data.users[id].usesLeft || 0) + Number(amount || 0);
  writeData(data);
  res.json({ ok: true });
});
app.post("/api/admin/role", ensureAuth, (req, res) => {
  if (!isAdminId(req.session.user.id))
    return res.status(403).json({ error: "Forbidden" });
  const { id, role } = req.body;
  const data = readData();
  if (!data.users[id]) return res.status(404).json({ error: "Not found" });
  data.users[id].roles = [role];
  data.users[id].usesLeft = defaultUsesForRole(role);
  writeData(data);
  res.json({ ok: true });
});
app.get("/api/admin/pastes", ensureAuth, (req, res) => {
  if (!isAdminId(req.session.user.id))
    return res.status(403).json({ error: "Forbidden" });
  const data = readData();
  res.json({ pastes: Object.values(data.pastes) });
});
app.post("/api/admin/delete-paste", ensureAuth, (req, res) => {
  if (!isAdminId(req.session.user.id))
    return res.status(403).json({ error: "Forbidden" });
  const { id } = req.body;
  const data = readData();
  delete data.pastes[id];
  writeData(data);
  res.json({ ok: true });
});
app.get("/api/admin/builders", ensureAuth, (req, res) => {
  if (!isAdminId(req.session.user.id))
    return res.status(403).json({ error: "Forbidden" });
  const data = readData();
  res.json({ builders: data.builders || [] });
});
app.get("/api/admin/stats", ensureAuth, (req, res) => {
  if (!isAdminId(req.session.user.id))
    return res.status(403).json({ error: "Forbidden" });
  const data = readData();
  const totalUsers = Object.keys(data.users).length;
  const totalPastes = Object.keys(data.pastes).length;
  const totalBuilders = (data.builders || []).length;
  const totalViews = data.views || 0;
  res.json({
    totalUsers,
    totalPastes,
    totalBuilders,
    totalViews,
  });
});

app.listen(PORT, () =>
  console.log(`✅ Server rodando em http://localhost:${PORT}`)
);

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
const REDIRECT_URI = process.env.DISCORD_CALLBACK_URL || `http://localhost:${PORT}/auth/discord/callback`;
const SESSION_SECRET = process.env.SESSION_SECRET || "secret123";

const ADMIN_IDS = (process.env.ADMIN_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const dataFile = path.join(__dirname, "data.json");

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

// ensure data structure
(function ensureData() {
  const d = readData();
  d.users = d.users || {};
  d.pastes = d.pastes || {};
  d.builders = d.builders || [];
  d.views = d.views || 0;
  writeData(d);
})();

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

// helper: uses per role
function defaultUsesForRole(role) {
  if (!role) return 3;
  if (role === "Basic") return 10;
  if (role === "Plus") return 25;
  if (role === "Premium") return 55;
  return 3;
}

// daily reset
function resetDailyUses() {
  const data = readData();
  const today = new Date().toISOString().slice(0, 10);
  for (const uid in data.users) {
    const u = data.users[uid];
    const role = (u.roles && u.roles[0]) || u.role || null;
    const target = ADMIN_IDS.includes(uid) ? Infinity : defaultUsesForRole(role);
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

// middlewares
function ensureAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: "Not logged" });
  next();
}
function isAdminId(id) {
  return ADMIN_IDS.includes(String(id));
}

// ----------------- Discord OAuth -----------------
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
    if (!tokenData.access_token) {
      console.error("token error", tokenData);
      return res.redirect("/");
    }
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const u = await userRes.json();
    const data = readData();

    data.users = data.users || {};
    if (!data.users[u.id]) {
      const role = "Membro";
      data.users[u.id] = {
        id: u.id,
        username: u.username,
        avatar: u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png` : null,
        roles: [role],
        usesLeft: isAdminId(u.id) ? Infinity : defaultUsesForRole(role),
        lastReset: new Date().toISOString().slice(0, 10),
        blocked: false,
        createdAt: new Date().toISOString(),
      };
    } else {
      // update username/avatar
      data.users[u.id].username = u.username;
      if (u.avatar) data.users[u.id].avatar = `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`;
    }
    writeData(data);

    // keep session.user minimal but will return full user via /api/user
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

// ----------------- APIs -----------------

// usuário logado
app.get("/api/user", ensureAuth, (req, res) => {
  const data = readData();
  const u = data.users[req.session.user.id];
  if (!u) return res.status(404).json({ error: "User unknown" });
  // RETURN THE USER OBJECT DIRECTLY (was previously nested) so frontend can use user.username and user.id
  return res.json(u);
});

// admin check
app.get("/api/is-admin", ensureAuth, (req, res) => {
  const id = req.session.user.id;
  return res.json({ isAdmin: isAdminId(id) });
});

// builder use
app.post("/api/builder/use", ensureAuth, (req, res) => {
  const data = readData();
  const uid = req.session.user.id;
  const u = data.users[uid];
  if (!u) return res.status(404).json({ error: "User not found" });
  if (u.blocked) return res.status(403).json({ error: "Blocked" });
  if (!isAdminId(uid)) {
    if (u.usesLeft <= 0) return res.status(403).json({ error: "No uses left" });
    u.usesLeft -= 1;
  }
  data.builders = data.builders || [];
  // Accept details from body (frontend must POST these fields)
  data.builders.push({
    id: Math.random().toString(36).slice(2, 9),
    user: uid,
    username: u.username,
    mode: req.body.mode || req.body.platform || "Roblox",
    platform: req.body.platform || req.body.mode || "Roblox",
    robloxLink: req.body.robloxLink || null,
    game: req.body.game || null,
    platformUser: req.body.platformUser || null,
    createdAt: new Date().toISOString(),
  });
  writeData(data);
  return res.json({ ok: true, usesLeft: u.usesLeft });
});

// paste create
app.post("/api/create", ensureAuth, (req, res) => {
  const text = (req.body.text || req.body.content || "").toString().trim();
  const password = (req.body.password || "").toString();
  const redirect = (req.body.redirect || "").toString().trim() || null;

  if (!text || !password) return res.status(400).json({ error: "text and password required" });

  const data = readData();
  const uid = req.session.user.id;
  const u = data.users[uid];
  if (!u) return res.status(401).json({ error: "User not found" });

  if (!isAdminId(uid)) {
    if (u.usesLeft === undefined) u.usesLeft = defaultUsesForRole((u.roles && u.roles[0]) || null);
    if (u.usesLeft <= 0) return res.status(403).json({ error: "No uses left" });
    u.usesLeft -= 1;
  }

  const id = Math.random().toString(36).slice(2, 9);
  data.pastes = data.pastes || {};
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

// paste metadata
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
    createdByName: p.createdByName || null,
  });
});

// verify password (view)
app.post("/api/paste/:id/access", (req, res) => {
  const data = readData();
  const p = data.pastes[req.params.id];
  if (!p) return res.status(404).json({ error: "Not found" });
  const pass = (req.body.password || "").toString();
  if (p.password !== pass) return res.status(403).json({ error: "Invalid password" });
  p.views = (p.views || 0) + 1;
  data.views = (data.views || 0) + 1;
  writeData(data);
  return res.json({ text: p.text, redirect: p.redirect || null });
});

// página pública de paste
app.get("/paste/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "paste.html"));
});

// ----------------- Admin APIs -----------------
app.get("/api/admin/stats", ensureAuth, (req, res) => {
  if (!isAdminId(req.session.user.id)) return res.status(403).json({ error: "no" });
  const data = readData();
  const today = new Date();
  const days = [];
  const counts = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push(key);
    const cnt = Object.values(data.users || {}).filter((u) => u.createdAt && u.createdAt.slice(0, 10) === key).length;
    counts.push(cnt);
  }
  const totalPastes = Object.keys(data.pastes || {}).length;
  const totalUsers = Object.keys(data.users || {}).length;
  const buildersCount = (data.builders || []).length;
  return res.json({
    totalPastes,
    totalUsers,
    buildersCount,
    views: data.views || 0,
    days,
    usersTimeseries: counts,
    topPastes: Object.values(data.pastes || {})
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 10)
      .map((p) => ({
        id: p.id,
        views: p.views || 0,
        createdByName: p.createdByName || p.createdBy,
      })),
  });
});

// list all pastes (admin)
app.get("/api/admin/pastes", ensureAuth, (req, res) => {
  if (!isAdminId(req.session.user.id)) return res.status(403).json({ error: "no" });
  const data = readData();
  const list = Object.values(data.pastes || {})
    .map((p) => ({
      id: p.id,
      text: p.text,
      password: p.password,
      redirect: p.redirect,
      createdAt: p.createdAt,
      views: p.views || 0,
      createdBy: p.createdBy,
      createdByName: p.createdByName,
      // convenience fields for admin front-end
      link: `/paste/${p.id}`,
      content: p.text,
    }))
    .sort((a, b) => (b.views || 0) - (a.views || 0));
  return res.json(list);
});

// delete paste (admin)
app.delete("/api/admin/paste/:id", ensureAuth, (req, res) => {
  if (!isAdminId(req.session.user.id)) return res.status(403).json({ error: "no" });
  const data = readData();
  if (!data.pastes[req.params.id]) return res.status(404).json({ error: "not found" });
  delete data.pastes[req.params.id];
  writeData(data);
  return res.json({ ok: true });
});

// list users (admin)
app.get("/api/users", ensureAuth, (req, res) => {
  if (!isAdminId(req.session.user.id)) return res.status(403).json({ error: "no" });
  const data = readData();
  const users = Object.values(data.users || {}).map((u) => ({
    id: u.id,
    username: u.username,
    avatar: u.avatar,
    usesLeft: u.usesLeft,
    roles: u.roles || [],
    blocked: !!u.blocked,
    createdAt: u.createdAt,
  }));
  return res.json(users);
});

// block/unblock user (admin)
app.post("/api/admin/block/:id", ensureAuth, (req, res) => {
  if (!isAdminId(req.session.user.id)) return res.status(403).json({ error: "no" });
  const target = req.params.id;
  const data = readData();
  if (!data.users[target]) return res.status(404).json({ error: "not found" });
  data.users[target].blocked = !data.users[target].blocked;
  writeData(data);
  return res.json({ id: target, blocked: data.users[target].blocked });
});

// add uses (admin)
app.post("/api/admin/adduses/:id", ensureAuth, (req, res) => {
  if (!isAdminId(req.session.user.id)) return res.status(403).json({ error: "no" });
  const id = req.params.id;
  const amount = parseInt(req.body.amount || 0);
  if (!amount || amount <= 0) return res.status(400).json({ error: "invalid amount" });
  const data = readData();
  data.users[id] = data.users[id] || {
    id,
    username: "unknown",
    usesLeft: 0,
    roles: ["Membro"],
    createdAt: new Date().toISOString(),
  };
  data.users[id].usesLeft = (data.users[id].usesLeft || 0) + amount;
  writeData(data);
  return res.json({ id, usesLeft: data.users[id].usesLeft });
});

// set role (admin)
app.post("/api/admin/role/:id", ensureAuth, (req, res) => {
  if (!isAdminId(req.session.user.id)) return res.status(403).json({ error: "no" });
  const id = req.params.id;
  const role = (req.body.role || "").toString();
  if (!["Membro", "Basic", "Plus", "Premium"].includes(role)) return res.status(400).json({ error: "invalid role" });
  const data = readData();
  data.users[id] = data.users[id] || {
    id,
    username: "unknown",
    usesLeft: defaultUsesForRole(role),
    roles: [role],
    createdAt: new Date().toISOString(),
  };
  data.users[id].roles = [role];
  const target = defaultUsesForRole(role);
  if (!isAdminId(id)) {
    if (!data.users[id].usesLeft || data.users[id].usesLeft < target) data.users[id].usesLeft = target;
  } else {
    data.users[id].usesLeft = Infinity;
  }
  writeData(data);
  return res.json({
    id,
    role: data.users[id].roles,
    usesLeft: data.users[id].usesLeft,
  });
});

// builder summary (admin)
app.get("/api/admin/builders", ensureAuth, (req, res) => {
  if (!isAdminId(req.session.user.id)) return res.status(403).json({ error: "no" });
  const data = readData();
  const byPlatform = {};
  const byGame = {};
  (data.builders || []).forEach((b) => {
    const p = b.platform || b.mode || "Roblox";
    byPlatform[p] = (byPlatform[p] || 0) + 1;
    if (b.game) byGame[b.game] = (byGame[b.game] || 0) + 1;
  });
  return res.json({ logs: data.builders || [], byPlatform, byGame });
});

app.listen(PORT, () => console.log("✅ Server listening on", PORT));

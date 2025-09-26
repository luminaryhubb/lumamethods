const express = require("express");
const session = require("express-session");
const fetch = require("node-fetch");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.use(express.static(path.join(__dirname, "public")));

app.get("/login", (req, res) => {
  const redirectUri = encodeURIComponent(process.env.DISCORD_CALLBACK_URL);
  res.redirect(
    `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=identify%20email`
  );
});

app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.redirect("/");

  try {
    const params = new URLSearchParams();
    params.append("client_id", process.env.DISCORD_CLIENT_ID);
    params.append("client_secret", process.env.DISCORD_CLIENT_SECRET);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", process.env.DISCORD_CALLBACK_URL);

    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.redirect("/");
    }

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const userData = await userRes.json();

    req.session.user = userData;
    res.redirect("/metodos.html");
  } catch (err) {
    console.error(err);
    res.redirect("/");
  }
});

function authRequired(req, res, next) {
  if (!req.session.user) return res.redirect("/");
  next();
}

app.get("/api/user", authRequired, (req, res) => {
  res.json(req.session.user);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

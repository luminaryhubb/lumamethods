const express = require("express");
const passport = require("passport");
const Strategy = require("passport-discord").Strategy;
const path = require("path");
const cors = require("cors");

const app = express();

// 🔹 CORS
app.use(cors({
  origin: "https://lumamethods.onrender.com",
  credentials: true,
}));

// 🔹 Passport sem session
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new Strategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: "https://lumamethods.onrender.com/auth/discord/callback",
    scope: ["identify"],
  },
  (accessToken, refreshToken, profile, done) => {
    profile.accessToken = accessToken;
    return done(null, profile);
  }
));

app.use(passport.initialize()); // ❌ SEM passport.session()

// 🔹 Login
app.get("/auth/discord", passport.authenticate("discord"));

// 🔹 Callback
app.get("/auth/discord/callback",
  passport.authenticate("discord", { failureRedirect: "/" }),
  (req, res) => {
    if (!req.user) return res.redirect("/");
    const u = req.user;
    const redirectURL = `/metodos.html?` +
      `id=${u.id}&username=${u.username}&discriminator=${u.discriminator}&avatar=${u.avatar}`;
    res.redirect(redirectURL);
  }
);

// 🔹 Servir arquivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// 🔹 Todas as outras rotas
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🔥 Server rodando na porta ${PORT}`));

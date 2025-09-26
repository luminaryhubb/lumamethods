const express = require("express");
const passport = require("passport");
const Strategy = require("passport-discord").Strategy;
const path = require("path");
const cors = require("cors");

const app = express();

// 🔹 CORS
app.use(
  cors({
    origin: "https://lumamethods.onrender.com", // seu domínio
    credentials: true,
  })
);

// 🔹 Passport Discord
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(
  new Strategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: "https://lumamethods.onrender.com/auth/discord/callback",
      scope: ["identify"],
    },
    (accessToken, refreshToken, profile, done) => {
      // 🔹 Retorna dados do usuário + token
      profile.accessToken = accessToken;
      return done(null, profile);
    }
  )
);

app.use(passport.initialize());

// 🔹 Autenticação
app.get("/auth/discord", passport.authenticate("discord"));

app.get(
  "/auth/discord/callback",
  passport.authenticate("discord", { failureRedirect: "/" }),
  (req, res) => {
    // Envia token e dados do usuário via query string
    const redirectURL = `/metodos.html?accessToken=${req.user.accessToken}&id=${req.user.id}&username=${req.user.username}&discriminator=${req.user.discriminator}&avatar=${req.user.avatar}`;
    res.redirect(redirectURL);
  }
);

// 🔹 Servir arquivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// 🔹 Rota coringa
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🔥 Server rodando na porta ${PORT}`));

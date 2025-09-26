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
      profile.accessToken = accessToken || null; // garante que não quebre
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
    try {
      if (!req.user) throw new Error("Usuário não encontrado");
      const u = req.user;
      const redirectURL = `/metodos.html?` +
        `accessToken=${u.accessToken || ""}` +
        `&id=${u.id || ""}` +
        `&username=${u.username || ""}` +
        `&discriminator=${u.discriminator || ""}` +
        `&avatar=${u.avatar || ""}`;
      res.redirect(redirectURL);
    } catch (err) {
      console.error("Erro no callback do Discord:", err);
      res.redirect("/"); // redireciona para home se houver erro
    }
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

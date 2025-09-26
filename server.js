const express = require("express");
const session = require("express-session");
const passport = require("passport");
const Strategy = require("passport-discord").Strategy;
const path = require("path");
const cors = require("cors");

const app = express();

// 🔹 Configurar CORS para permitir cookies da sessão
app.use(
  cors({
    origin: "https://lumamethods.onrender.com", // seu domínio no Render
    credentials: true,
  })
);

// 🔹 Configurar sessão com cookies válidos em HTTPS
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true, // Render usa HTTPS
      sameSite: "none", // 🔥 sem isso o cookie some
      maxAge: 1000 * 60 * 60 * 24, // 1 dia
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// 🔹 Configuração do Passport com Discord
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

passport.use(
  new Strategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: "https://lumamethods.onrender.com/auth/discord/callback",
      scope: ["identify"],
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  )
);

// 🔹 Rotas de autenticação
app.get("/auth/discord", passport.authenticate("discord"));

app.get(
  "/auth/discord/callback",
  passport.authenticate("discord", { failureRedirect: "/" }),
  (req, res) => {
    console.log("✅ Usuário autenticado:", req.user);
    res.redirect("/metodos.html");
  }
);

app.get("/api/user", (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: "Não autorizado" });
  }
});

app.get("/auth/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.redirect("/");
    });
  });
});

// 🔹 Servindo arquivos estáticos da pasta "public"
app.use(express.static(path.join(__dirname, "public")));

// 🔹 Rota coringa para SPA ou fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🔹 Iniciar servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🔥 Server rodando na porta ${PORT}`));

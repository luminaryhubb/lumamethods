import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as DiscordStrategy } from "passport-discord";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// =========================
// 🔑 Configuração da sessão
// =========================
app.use(
  session({
    secret: process.env.SESSION_SECRET || "makerzxluma",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// =========================
// 🔑 Estratégia do Discord
// =========================
passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL:
        process.env.DISCORD_CALLBACK_URL ||
        "http://localhost:10000/auth/discord/callback",
      scope: ["identify"],
    },
    function (accessToken, refreshToken, profile, done) {
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// =========================
// 🔑 Rotas de autenticação
// =========================
app.get(
  "/auth/discord",
  passport.authenticate("discord", { scope: ["identify"] })
);

app.get(
  "/auth/discord/callback",
  passport.authenticate("discord", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/welcome");
  }
);

app.get("/welcome", (req, res) => {
  if (!req.user) return res.redirect("/auth/discord");
  const username = req.user.username;
  const discriminator = req.user.discriminator;

  res.send(`
    <html>
      <head>
        <title>Bem-vindo</title>
        <style>
          body {
            background: black;
            color: white;
            font-family: monospace;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-size: 2rem;
          }
        </style>
      </head>
      <body>
        Bem vindo, ${username}#${discriminator}!
      </body>
    </html>
  `);
});

// =========================
// 🔑 Servindo React (build)
// =========================
app.use(express.static(path.join(__dirname, "../client/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

// =========================
// 🔑 Start do servidor
// =========================
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
  

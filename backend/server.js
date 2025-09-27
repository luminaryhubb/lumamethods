import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as DiscordStrategy } from "passport-discord";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Database ----------
const db = await open({
  filename: path.join(__dirname, "database.sqlite"),
  driver: sqlite3.Database,
});

// Cria tabela de usuários
await db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT,
  avatar TEXT,
  role TEXT DEFAULT 'Membro',
  daily_uses INTEGER DEFAULT 3,
  last_reset DATE
)
`);

// ---------- Session ----------
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
  })
);

// ---------- Passport Discord ----------
passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: process.env.DISCORD_REDIRECT_URI,
      scope: ["identify"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await db.get("SELECT * FROM users WHERE id = ?", profile.id);
        if (!user) {
          await db.run(
            "INSERT INTO users (id, username, avatar, role, daily_uses, last_reset) VALUES (?, ?, ?, ?, ?, ?)",
            profile.id,
            profile.username,
            profile.avatar,
            "Membro",
            3,
            new Date().toISOString().split("T")[0]
          );
          user = await db.get("SELECT * FROM users WHERE id = ?", profile.id);
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await db.get("SELECT * FROM users WHERE id = ?", id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

app.use(passport.initialize());
app.use(passport.session());

// ---------- Auth Routes ----------
app.get("/auth/discord", passport.authenticate("discord"));

app.get(
  "/auth/discord/callback",
  passport.authenticate("discord", {
    failureRedirect: "/",
  }),
  (req, res) => {
    res.redirect("/dashboard");
  }
);

app.get("/auth/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/");
  });
});

// ---------- API Example ----------
app.get("/api/me", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not logged in" });
  res.json(req.user);
});

// ---------- Admin Middleware ----------
function requireAdmin(req, res, next) {
  if (!req.user) return res.redirect("/");
  if (req.user.role !== "Admin") return res.redirect("/dashboard");
  next();
}

app.get("/admin", requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// ---------- Serve React build ----------
app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// ---------- Start ----------
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);

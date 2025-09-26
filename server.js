// server.js
import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as DiscordStrategy } from "passport-discord";
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Variáveis do ambiente (.env)
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- Conexão com Postgres ---
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// --- Rodar migrations (create_tables.sql) ---
async function runMigrations() {
  try {
    const sqlPath = path.join(__dirname, "migrations", "create_tables.sql");
    const sql = fs.readFileSync(sqlPath).toString();
    await pool.query(sql);
    console.log("✅ Migrations executadas com sucesso.");
  } catch (err) {
    console.error("❌ Erro ao rodar migrations:", err);
  }
}
runMigrations();

// --- Sessão ---
app.use(
  session({
    secret: process.env.SESSION_SECRET || "changeme",
    resave: false,
    saveUninitialized: false,
  })
);

// --- Passport + Discord OAuth2 ---
passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: process.env.DISCORD_CALLBACK_URL,
      scope: ["identify", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const { id, username, email } = profile;
        await pool.query(
          `INSERT INTO users (discord_id, username, email)
           VALUES ($1, $2, $3)
           ON CONFLICT (discord_id) DO UPDATE
             SET username = $2, email = $3`,
          [id, username, email || null]
        );
        return done(null, profile);
      } catch (err) {
        console.error("Erro ao salvar usuário:", err);
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
    const res = await pool.query("SELECT * FROM users WHERE discord_id = $1", [
      id,
    ]);
    done(null, res.rows[0]);
  } catch (err) {
    done(err, null);
  }
});

app.use(passport.initialize());
app.use(passport.session());

// --- Rotas OAuth2 ---
app.get("/auth/discord", passport.authenticate("discord"));
app.get(
  "/auth/discord/callback",
  passport.authenticate("discord", {
    failureRedirect: "/",
  }),
  (req, res) => {
    res.redirect("/"); // redireciona para a home após login
  }
);

app.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

// --- Proteção da área admin ---
function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user && req.user.is_admin) {
    return next();
  }
  return res.status(403).send("Acesso negado");
}

app.get("/admin", isAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// --- Servir arquivos estáticos (frontend) ---
app.use(express.static(path.join(__dirname, "public")));

// --- Inicia servidor ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

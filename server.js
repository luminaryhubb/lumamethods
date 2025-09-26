const express = require("express");
const axios = require("axios");
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

// 🔹 CORS
app.use(cors({
  origin: "https://lumamethods.onrender.com",
  credentials: true,
}));

// 🔹 Cookie parser
app.use(cookieParser());

// 🔹 Variáveis do Discord
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = "https://lumamethods.onrender.com/auth/discord/callback";

// 🔹 Inicia login
app.get("/auth/discord", (req, res) => {
  const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify`;
  res.redirect(url);
});

// 🔹 Callback do Discord
app.get("/auth/discord/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.redirect("/");

  try {
    // Pega token do Discord
    const tokenRes = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: REDIRECT_URI,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const accessToken = tokenRes.data.access_token;

    // Pega informações do usuário
    const userRes = await axios.get("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const u = userRes.data;

    // Grava cookie HTTP-only com os dados do usuário
    res.cookie("discord_user", JSON.stringify({
      id: u.id,
      username: u.username,
      discriminator: u.discriminator,
      avatar: u.avatar
    }), {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 1000 * 60 * 60 * 24, // 1 dia
    });

    // Redireciona limpo para metodos.html
    res.redirect("/metodos.html");

  } catch (err) {
    console.error(err);
    res.redirect("/");
  }
});

// 🔹 Endpoint para frontend ler dados do usuário
app.get("/api/user", (req, res) => {
  const cookie = req.cookies.discord_user;
  if (!cookie) return res.status(401).json({ error: "Não autorizado" });

  try {
    const user = JSON.parse(cookie);
    res.json(user);
  } catch {
    res.status(401).json({ error: "Não autorizado" });
  }
});

// 🔹 Servir arquivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// 🔹 Todas as outras rotas
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🔥 Server rodando na porta ${PORT}`));

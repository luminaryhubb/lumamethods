const express = require("express");
const axios = require("axios");
const path = require("path");
const cors = require("cors");

const app = express();

// 🔹 CORS
app.use(cors({
  origin: "https://lumamethods.onrender.com",
  credentials: true,
}));

// 🔹 Variáveis do Discord (certifique-se de ter no .env)
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
    const tokenRes = await axios.post("https://discord.com/api/oauth2/token", new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: REDIRECT_URI,
    }), { headers: { "Content-Type": "application/x-www-form-urlencoded" }});

    const accessToken = tokenRes.data.access_token;

    // Pega informações do usuário
    const userRes = await axios.get("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const u = userRes.data;

    // Redireciona para metodos.html com query string
    const redirectURL = `/metodos.html?` +
      `id=${u.id}&username=${u.username}&discriminator=${u.discriminator}&avatar=${u.avatar}`;
    res.redirect(redirectURL);

  } catch (err) {
    console.error(err);
    res.redirect("/");
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

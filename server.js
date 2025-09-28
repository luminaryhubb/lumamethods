const express = require("express");
const session = require("express-session");
const fetch = require("node-fetch");
const path = require("path");
const crypto = require("crypto");

const app = express();

// Configurações básicas
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "super-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

// Pastas estáticas
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/admin", express.static(path.join(__dirname, "admin")));

// ---- Autenticação com Discord ----
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || "http://localhost:3000/auth/callback";

// Inicia login
app.get("/auth/discord", (req, res) => {
  const url =
    `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code&scope=identify`;
  res.redirect(url);
});

// Callback do Discord
app.get("/auth/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("Erro: nenhum código fornecido");

  try {
    // Troca o code por um token
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) return res.send("Erro ao obter token: " + JSON.stringify(tokenData));

    // Busca o usuário no Discord
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    // Salva na sessão
    req.session.user = userData;
    console.log("Usuário logado:", userData);

    res.redirect("/public/methods.html");
  } catch (err) {
    console.error(err);
    res.send("Erro no login");
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/public/index.html");
  });
});

// ---- API do Shortner / Paste ----
const pastes = new Map(); // {id:{text,password,redirect}}

// Criar Paste
app.post("/api/create", (req, res) => {
  const { text, password, redirect } = req.body;
  if (!text || !password) return res.json({ error: "Preencha todos os campos" });

  const id = crypto.randomBytes(4).toString("hex");
  pastes.set(id, { text, password, redirect });
  res.json({ id });
});

// Acessar Paste
app.get("/paste/:id", (req, res) => {
  const paste = pastes.get(req.params.id);
  if (!paste) return res.send("Paste não encontrado");

  // Exibir página que pede senha
  res.send(`
    <html>
      <head><title>Paste</title></head>
      <body style="font-family:sans-serif; padding:2rem; background:#111; color:#eee;">
        <h2>Digite a senha para ver o conteúdo</h2>
        <form method="POST" action="/paste/${req.params.id}">
          <input type="password" name="password" placeholder="Senha" required/>
          <button type="submit">Acessar</button>
        </form>
      </body>
    </html>
  `);
});

// Verificação da senha
app.post("/paste/:id", express.urlencoded({ extended: true }), (req, res) => {
  const paste = pastes.get(req.params.id);
  if (!paste) return res.send("Paste não encontrado");

  if (req.body.password !== paste.password) {
    return res.send("Senha incorreta");
  }

  if (paste.redirect) {
    return res.redirect(paste.redirect);
  }

  res.send(`
    <html>
      <head><title>Paste</title></head>
      <body style="font-family:sans-serif; padding:2rem; background:#111; color:#eee; white-space:pre-wrap;">
        <h2>Conteúdo:</h2>
        <div style="background:#222; padding:1rem; border-radius:8px;">${paste.text}</div>
      </body>
    </html>
  `);
});

// ---- Admin ----
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin/index.html"));
});

// ---- Start Server ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

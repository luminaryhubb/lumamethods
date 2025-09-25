import express from "express";
import session from "express-session";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";

import authRoutes from "./routes/auth.js";
import shortnerRoutes from "./routes/shortner.js";
import builderRoutes from "./routes/builder.js";
import adminRoutes from "./routes/admin.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || "changeme",
  resave: false,
  saveUninitialized: false
}));

app.use("/api/auth", authRoutes);
app.use("/api/shortner", shortnerRoutes);
app.use("/api/builder", builderRoutes);
app.use("/api/admin", adminRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(path.join(__dirname, "../client/dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server rodando na porta ${PORT}`);
});

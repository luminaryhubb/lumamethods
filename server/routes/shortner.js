import express from "express";
import pool from "../db.js";
import { nanoid } from "nanoid";

const router = express.Router();

// criar link curto
router.post("/", async (req, res) => {
  const { url } = req.body;
  const code = nanoid(6);
  try {
    await pool.query("INSERT INTO shortners(code, url) VALUES($1, $2)", [code, url]);
    res.json({ short: `${req.protocol}://${req.get("host")}/${code}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// redirecionar
router.get("/:code", async (req, res) => {
  const { code } = req.params;
  const result = await pool.query("SELECT url FROM shortners WHERE code = $1", [code]);
  if (result.rows.length > 0) {
    res.redirect(result.rows[0].url);
  } else {
    res.status(404).send("Not found");
  }
});

export default router;

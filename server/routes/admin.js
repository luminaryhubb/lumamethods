import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/stats", async (req, res) => {
  const users = await pool.query("SELECT COUNT(*) FROM users");
  const shortners = await pool.query("SELECT COUNT(*) FROM shortners");
  res.json({
    users: users.rows[0].count,
    shortners: shortners.rows[0].count
  });
});

export default router;
